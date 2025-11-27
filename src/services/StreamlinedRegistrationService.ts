import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';
import AlumniDataIntegrationService, { AlumniProfile } from './AlumniDataIntegrationService';
import { EmailService } from './EmailService';

export interface InvitationValidation {
  isValid: boolean;
  invitation: any;
  alumniProfile?: AlumniProfile;
  requiresUserInput: boolean;
  suggestedFields: string[];
  canOneClickJoin: boolean;
  errorType?: 'expired' | 'used' | 'invalid' | 'not_found';
  errorMessage?: string;
}

export interface RegistrationData {
  invitation: any;
  alumniProfile?: AlumniProfile;
  requiredFields: string[];
  optionalFields: string[];
  estimatedCompletionTime: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  alumniMemberId?: number;
}

export class StreamlinedRegistrationService {
  private pool: mysql.Pool;
  private alumniService: AlumniDataIntegrationService;
  private emailService?: EmailService;

  constructor(pool: mysql.Pool, alumniService: AlumniDataIntegrationService, emailService?: EmailService) {
    this.pool = pool;
    this.alumniService = alumniService;
    this.emailService = emailService;
  }

  /**
   * Validate invitation with alumni data integration
   */
  async validateInvitationWithAlumniData(token: string): Promise<InvitationValidation> {
    try {
      const connection = await this.pool.getConnection();

      // First, check if invitation exists at all
      const [allRows] = await connection.execute(`
        SELECT ui.id, ui.invitation_token, ui.email, ui.status, ui.completion_status,
               ui.is_used, ui.used_at, ui.expires_at, ui.alumni_member_id,
               ui.invited_by, ui.invitation_type, ui.invitation_data, ui.sent_at,
               ui.accepted_by, ui.ip_address, ui.resend_count, ui.last_resent_at,
               ui.created_at, ui.updated_at,
               am.id as alumni_id, am.first_name, am.last_name, am.email as alumni_email
        FROM USER_INVITATIONS ui
        LEFT JOIN alumni_members am ON ui.alumni_member_id = am.id
        WHERE ui.invitation_token = ?
        LIMIT 1
      `, [token]);
      if (!Array.isArray(allRows) || allRows.length === 0) {
        connection.release();
        return {
          isValid: false,
          invitation: null,
          requiresUserInput: false,
          suggestedFields: [],
          canOneClickJoin: false,
          errorType: 'not_found',
          errorMessage: 'Invitation not found or invalid token'
        };
      }

      const dbInvitation = allRows[0] as any;

      // Check if invitation is expired
      const now = new Date();
      const expiresAt = new Date(dbInvitation.expires_at);
      if (expiresAt <= now) {
        connection.release();
        return {
          isValid: false,
          invitation: null,
          requiresUserInput: false,
          suggestedFields: [],
          canOneClickJoin: false,
          errorType: 'expired',
          errorMessage: `This invitation expired on ${expiresAt.toLocaleDateString()}. Please request a new invitation.`
        };
      }

      // Check if invitation is already used
      if (dbInvitation.status !== 'pending' || dbInvitation.is_used) {
        connection.release();
        return {
          isValid: false,
          invitation: null,
          requiresUserInput: false,
          suggestedFields: [],
          canOneClickJoin: false,
          errorType: 'used',
          errorMessage: 'This invitation has already been used or is no longer valid.'
        };
      }

      // Use the invitation data from the first query (already validated)
      const invitation = dbInvitation;
      let alumniProfile: AlumniProfile | undefined;

      // Fetch alumni data if invitation is linked
      if (invitation.alumni_member_id) {
        const profile = await this.alumniService.fetchAlumniDataForInvitation(invitation.email);
        if (profile) {
          alumniProfile = profile;
        }
      }

      const requiresUserInput = !alumniProfile?.canAutoPopulate;
      const suggestedFields = alumniProfile?.missingFields || [];
      const canOneClickJoin = alumniProfile?.canAutoPopulate || false;

      return {
        isValid: true,
        invitation,
        alumniProfile,
        requiresUserInput,
        suggestedFields,
        canOneClickJoin
      };

    } catch (error) {
      console.error('Error validating invitation with alumni data:', error);
      throw new Error('Failed to validate invitation');
    }
  }

  /**
   * Prepare registration data for the UI
   */
  async prepareRegistrationData(token: string): Promise<RegistrationData> {
    const validation = await this.validateInvitationWithAlumniData(token);

    if (!validation.isValid) {
      throw new Error('Invalid invitation token');
    }

    const requiredFields = validation.alumniProfile?.missingFields || ['firstName', 'lastName', 'phone'];
    const optionalFields = ['address', 'bio', 'linkedin_url'];
    const estimatedCompletionTime = validation.canOneClickJoin ? 30 : 120; // seconds

    return {
      invitation: validation.invitation,
      alumniProfile: validation.alumniProfile,
      requiredFields,
      optionalFields,
      estimatedCompletionTime
    };
  }

  /**
   * Complete streamlined registration
   */
  async completeStreamlinedRegistration(token: string, additionalData: any = {}): Promise<User> {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate invitation
      const validation = await this.validateInvitationWithAlumniData(token);
      if (!validation.isValid || !validation.canOneClickJoin) {
        throw new Error('Invalid invitation or additional data required');
      }

      const invitation = validation.invitation;
      const alumniProfile = validation.alumniProfile!;

      // Create user account
      const userId = uuidv4();
      const insertUserQuery = `
        INSERT INTO app_users (
          id, email, alumni_member_id, first_name, last_name,
          phone, status, email_verified, email_verified_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW(), NOW())
      `;

      await connection.execute(insertUserQuery, [
        userId,
        invitation.email,
        alumniProfile.id,
        alumniProfile.firstName,
        alumniProfile.lastName,
        alumniProfile.phone || null
      ]);

      // Create default user preferences
      console.log(`📋 Creating default preferences for new user ${userId}...`);
      await this.createDefaultUserPreferences(connection, userId);

      // Update invitation status
      await connection.execute(`
        UPDATE USER_INVITATIONS
        SET status = 'accepted', completion_status = 'completed',
            user_id = ?, used_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [userId, invitation.id]);

      // Create user profile with alumni snapshot
      const alumniSnapshot = this.alumniService.createProfileSnapshot(alumniProfile);
      const insertProfileQuery = `
        INSERT INTO user_profiles (
          id, user_id, alumni_member_id, first_name, last_name,
          graduation_year, program, phone, alumni_data_snapshot,
          user_additions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await connection.execute(insertProfileQuery, [
        uuidv4(),
        userId,
        alumniProfile.id,
        alumniProfile.firstName,
        alumniProfile.lastName,
        alumniProfile.graduationYear,
        alumniProfile.program,
        alumniProfile.phone || null,
        alumniSnapshot,
        JSON.stringify(additionalData)
      ]);

      // Create primary FAMILY_MEMBER record for the alumni
      const familyMemberId = uuidv4();
      await this.createPrimaryFamilyMember(connection, userId, alumniProfile, familyMemberId);

      // Update app_users with primary_family_member_id and family account settings
      await connection.execute(`
        UPDATE app_users
        SET primary_family_member_id = ?,
            is_family_account = TRUE,
            family_account_type = 'alumni'
        WHERE id = ?
      `, [familyMemberId, userId]);

      await connection.commit();

      const user: User = {
        id: userId,
        email: invitation.email,
        firstName: alumniProfile.firstName,
        lastName: alumniProfile.lastName,
        alumniMemberId: alumniProfile.id
      };

      // Send welcome email
      await this.sendWelcomeEmailWithProfileSummary(userId);

      return user;

    } catch (error) {
      await connection.rollback();
      console.error('Error completing streamlined registration:', error);
      throw new Error('Failed to complete registration');
    } finally {
      connection.release();
    }
  }

  /**
   * Create primary family member record for alumni
   * Uses birth_date if available, falls back to estimated age from graduation year
   */
  private async createPrimaryFamilyMember(
    connection: mysql.PoolConnection,
    userId: string,
    alumniProfile: AlumniProfile,
    familyMemberId: string
  ): Promise<void> {
    // Calculate age from birth_date or estimate from graduation year
    let birthDate: string | null = alumniProfile.birthDate || null;
    let currentAge: number | null = null;
    let canAccess = true;
    let requiresConsent = false;
    let accessLevel = 'full';

    if (birthDate) {
      // Calculate age from actual birth date
      const today = new Date();
      const birth = new Date(birthDate);
      currentAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        currentAge--;
      }
    } else if (alumniProfile.estimatedBirthYear) {
      // Estimate age from estimated birth year
      currentAge = new Date().getFullYear() - alumniProfile.estimatedBirthYear;
      // Create estimated birth date (Jan 1 of estimated year)
      birthDate = `${alumniProfile.estimatedBirthYear}-01-01`;
    } else if (alumniProfile.graduationYear) {
      // Fallback: estimate from graduation year (typical age 22 at graduation)
      const estimatedBirthYear = alumniProfile.graduationYear - 22;
      currentAge = new Date().getFullYear() - estimatedBirthYear;
      // Create estimated birth date (Jan 1 of estimated year)
      birthDate = `${estimatedBirthYear}-01-01`;
    }

    // COPPA compliance: determine access level based on age
    if (currentAge !== null) {
      if (currentAge < 14) {
        canAccess = false;
        accessLevel = 'blocked';
      } else if (currentAge < 18) {
        requiresConsent = true;
        accessLevel = 'supervised';
        canAccess = false; // Needs parent consent first
      }
    }

    console.log(`📋 Creating primary family member for user ${userId}:`, {
      birthDate,
      currentAge,
      accessLevel,
      source: alumniProfile.birthDate ? 'actual_birth_date' : 
              alumniProfile.estimatedBirthYear ? 'estimated_birth_year' : 
              alumniProfile.graduationYear ? 'graduation_year' : 'unknown'
    });

    await connection.execute(`
      INSERT INTO FAMILY_MEMBERS (
        id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
        birth_date, current_age, can_access_platform, requires_parent_consent,
        parent_consent_given, access_level, relationship, is_primary_contact, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      familyMemberId,
      userId,
      alumniProfile.id,
      alumniProfile.firstName,
      alumniProfile.lastName,
      `${alumniProfile.firstName} ${alumniProfile.lastName}`,
      birthDate,
      currentAge,
      canAccess ? 1 : 0,
      requiresConsent ? 1 : 0,
      0, // parent_consent_given - needs to be granted via consent flow
      accessLevel,
      'self', // Primary member relationship to themselves
      1, // is_primary_contact
      canAccess ? 'active' : (requiresConsent ? 'pending_consent' : 'blocked')
    ]);
  }

  /**
   * Handle incomplete alumni data (fallback registration)
   */
  async handleIncompleteAlumniData(token: string, userData: any): Promise<User> {
    const connection = await this.pool.getConnection();

    try {
      await connection.beginTransaction();

      // Validate invitation
      const validation = await this.validateInvitationWithAlumniData(token);
      if (!validation.isValid) {
        throw new Error('Invalid invitation token');
      }

      const invitation = validation.invitation;
      const alumniProfile = validation.alumniProfile;

      // Merge data if alumni profile exists, otherwise use invitation data
      let mergedData = userData;
      if (alumniProfile) {
        const mergeResult = this.alumniService.mergeAlumniDataWithUserInput(alumniProfile, userData);
        mergedData = mergeResult.mergedProfile;
      } else {
        // No alumni profile - extract from invitation_data
        const invitationData = invitation.invitation_data
          ? (typeof invitation.invitation_data === 'string'
              ? JSON.parse(invitation.invitation_data)
              : invitation.invitation_data)
          : {};

        mergedData = {
          ...userData,
          firstName: userData.firstName || invitationData.firstName || 'Unknown',
          lastName: userData.lastName || invitationData.lastName || 'User',
          graduationYear: userData.graduationYear || invitationData.graduationYear || null,
          phone: userData.phone || null
        };
      }

      // Create user account
      const userId = uuidv4();
      const insertUserQuery = `
        INSERT INTO app_users (
          id, email, alumni_member_id, first_name, last_name,
          phone, status, email_verified, email_verified_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW(), NOW())
      `;

      await connection.execute(insertUserQuery, [
        userId,
        invitation.email,
        alumniProfile?.id || null,
        mergedData.firstName,
        mergedData.lastName,
        mergedData.phone || null
      ]);

      // Create default user preferences
      console.log(`📋 Creating default preferences for new user ${userId}...`);
      await this.createDefaultUserPreferences(connection, userId);

      // Update invitation status
      await connection.execute(`
        UPDATE USER_INVITATIONS
        SET status = 'accepted', completion_status = 'completed',
            user_id = ?, used_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [userId, invitation.id]);

      // Create user profile
      const alumniSnapshot = alumniProfile ? this.alumniService.createProfileSnapshot(alumniProfile) : null;
      const insertProfileQuery = `
        INSERT INTO user_profiles (
          id, user_id, alumni_member_id, first_name, last_name,
          graduation_year, program, phone, alumni_data_snapshot,
          user_additions, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      await connection.execute(insertProfileQuery, [
        uuidv4(),
        userId,
        alumniProfile?.id || null,
        mergedData.firstName,
        mergedData.lastName,
        mergedData.graduationYear || alumniProfile?.graduationYear || null,
        mergedData.program || alumniProfile?.program || null,
        mergedData.phone || null,
        alumniSnapshot,
        JSON.stringify(userData)
      ]);

      // Create primary FAMILY_MEMBER record
      const familyMemberId = uuidv4();
      if (alumniProfile) {
        await this.createPrimaryFamilyMember(connection, userId, alumniProfile, familyMemberId);
      } else {
        // Create basic family member without alumni profile
        await this.createBasicFamilyMember(connection, userId, mergedData, familyMemberId);
      }

      // Update app_users with primary_family_member_id and family account settings
      await connection.execute(`
        UPDATE app_users
        SET primary_family_member_id = ?,
            is_family_account = TRUE,
            family_account_type = 'alumni'
        WHERE id = ?
      `, [familyMemberId, userId]);

      await connection.commit();

      const user: User = {
        id: userId,
        email: invitation.email,
        firstName: mergedData.firstName,
        lastName: mergedData.lastName,
        alumniMemberId: alumniProfile?.id
      };

      // Send welcome email
      await this.sendWelcomeEmailWithProfileSummary(userId);

      return user;

    } catch (error) {
      await connection.rollback();
      console.error('Error handling incomplete alumni data registration:', error);
      throw new Error('Failed to complete registration');
    } finally {
      connection.release();
    }
  }

  /**
   * Create basic family member when no alumni profile exists
   */
  private async createBasicFamilyMember(
    connection: mysql.PoolConnection,
    userId: string,
    userData: any,
    familyMemberId: string
  ): Promise<void> {
    console.log(`📋 Creating basic family member for user ${userId} (no alumni profile)`);

    await connection.execute(`
      INSERT INTO FAMILY_MEMBERS (
        id, parent_user_id, first_name, last_name, display_name,
        birth_date, current_age, can_access_platform, requires_parent_consent,
        parent_consent_given, access_level, relationship, is_primary_contact, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      familyMemberId,
      userId,
      userData.firstName,
      userData.lastName,
      `${userData.firstName} ${userData.lastName}`,
      null, // birth_date - unknown
      null, // current_age - unknown
      1, // can_access_platform - assume yes (adult)
      0, // requires_parent_consent - no
      0, // parent_consent_given
      'full', // access_level
      'self',
      1, // is_primary_contact
      'active'
    ]);
  }

  /**
   * Create default preferences for a new user
   * Creates entries in USER_PREFERENCES, USER_NOTIFICATION_PREFERENCES, and USER_PRIVACY_SETTINGS
   */
  private async createDefaultUserPreferences(connection: mysql.PoolConnection, userId: string): Promise<void> {
    try {
      // Create default USER_PREFERENCES
      const prefId = uuidv4();
      await connection.execute(`
        INSERT INTO USER_PREFERENCES (
          id, user_id,
          preference_type, max_postings,
          notification_settings, privacy_settings, interface_settings,
          is_professional, education_status
        ) VALUES (
          ?, ?,
          'both', 5,
          '{"email_notifications": true, "push_notifications": true, "frequency": "daily"}',
          '{"profile_visibility": "alumni_only", "show_email": false, "show_phone": false}',
          '{"theme": "system", "language": "en", "timezone": "UTC"}',
          FALSE, 'professional'
        )
      `, [prefId, userId]);
      console.log(`✅ Created USER_PREFERENCES for user ${userId}`);

      // Create default USER_NOTIFICATION_PREFERENCES
      await connection.execute(`
        INSERT INTO USER_NOTIFICATION_PREFERENCES (
          user_id, email_notifications, email_frequency, posting_updates,
          connection_requests, event_reminders, weekly_digest, push_notifications
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, true, 'daily', true, true, true, true, false]);
      console.log(`✅ Created USER_NOTIFICATION_PREFERENCES for user ${userId}`);

      // Create default USER_PRIVACY_SETTINGS
      await connection.execute(`
        INSERT INTO USER_PRIVACY_SETTINGS (
          user_id, profile_visibility, show_email, show_phone, show_location,
          searchable_by_name, searchable_by_email, allow_messaging
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, 'alumni_only', false, false, true, true, false, 'alumni_only']);
      console.log(`✅ Created USER_PRIVACY_SETTINGS for user ${userId}`);

    } catch (error) {
      console.error(`❌ Error creating default preferences for user ${userId}:`, error);
      // Don't throw - preference creation failure shouldn't break registration
      // Preferences will be created on-demand when user accesses preferences page
    }
  }

  /**
   * Send welcome email with profile summary
   */
  private async sendWelcomeEmailWithProfileSummary(userId: string): Promise<void> {
    if (!this.emailService) {
      // Email service not available, skip sending email
      return;
    }

    try {
      // Get user details
      const connection = await this.pool.getConnection();
      const [userRows] = await connection.execute(`
        SELECT au.*, up.*, am.program, am.graduation_year
        FROM app_users au
        LEFT JOIN user_profiles up ON au.id = up.user_id
        LEFT JOIN alumni_members am ON au.alumni_member_id = am.id
        WHERE au.id = ?
      `, [userId]);

      connection.release();

      if (!Array.isArray(userRows) || userRows.length === 0) {
        return;
      }

      const user = userRows[0] as any;

      // Send welcome email
      await this.emailService.sendWelcomeEmail({
        id: userId,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      } as any);

    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw - email failure shouldn't break registration
    }
  }
}

export default StreamlinedRegistrationService;
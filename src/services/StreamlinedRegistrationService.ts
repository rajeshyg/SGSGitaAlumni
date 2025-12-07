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
   * Creates family member records for ALL alumni members with the same email
   */
  async completeStreamlinedRegistration(token: string, _additionalData: any = {}): Promise<User> {
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

      // Fetch ALL alumni members with this email for family onboarding
      // This enables parent + children family profiles when they share an email
      const allAlumniProfiles = await this.alumniService.fetchAllAlumniMembersByEmail(invitation.email);
      console.log(`👨‍👩‍👧‍👦 Found ${allAlumniProfiles.length} alumni member(s) with email ${invitation.email}`);

      // Create primary FAMILY_MEMBER record for the registering alumni
      // Note: FAMILY_MEMBERS is now the single source of truth for profile data
      // (user_profiles table deprecated - see migrations/consolidate-user-profiles-to-family-members.sql)
      const primaryFamilyMemberId = uuidv4();
      const primaryAlumniSnapshot = this.alumniService.createProfileSnapshot(alumniProfile);
      await this.createPrimaryFamilyMember(connection, userId, alumniProfile, primaryFamilyMemberId, primaryAlumniSnapshot);

      // Create additional family members for other alumni with the same email
      let additionalMembersCreated = 0;
      for (const otherAlumni of allAlumniProfiles) {
        // Skip the primary alumni (already created above)
        if (otherAlumni.id === alumniProfile.id) {
          continue;
        }

        // Create family member for this additional alumni record
        const familyMemberId = uuidv4();
        const alumniSnapshot = this.alumniService.createProfileSnapshot(otherAlumni);
        await this.createAdditionalFamilyMember(connection, userId, otherAlumni, familyMemberId, alumniSnapshot);
        additionalMembersCreated++;
        console.log(`👤 Created family member for ${otherAlumni.firstName} ${otherAlumni.lastName} (alumni ID: ${otherAlumni.id})`);
      }

      console.log(`✅ Created ${additionalMembersCreated + 1} total family member(s) for user ${userId}`);

      // Update app_users with primary_family_member_id and family account settings
      await connection.execute(`
        UPDATE app_users
        SET primary_family_member_id = ?,
            is_family_account = TRUE,
            family_account_type = 'alumni'
        WHERE id = ?
      `, [primaryFamilyMemberId, userId]);

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
   * Note: FAMILY_MEMBERS is now the single source of truth for all profile data
   */
  private async createPrimaryFamilyMember(
    connection: mysql.PoolConnection,
    userId: string,
    alumniProfile: AlumniProfile,
    familyMemberId: string,
    alumniSnapshot?: string | null
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

    // FAMILY_MEMBERS is now the single source of truth for all profile data
    // Including graduation_year, program, alumni_data_snapshot (previously in user_profiles)
    await connection.execute(`
      INSERT INTO FAMILY_MEMBERS (
        id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
        birth_date, current_age, can_access_platform, requires_parent_consent,
        parent_consent_given, access_level, relationship, is_primary_contact, status,
        graduation_year, program, alumni_data_snapshot, phone,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
      canAccess ? 'active' : (requiresConsent ? 'pending_consent' : 'blocked'),
      alumniProfile.graduationYear || null,
      alumniProfile.program || null,
      alumniSnapshot || null,
      alumniProfile.phone || null
    ]);
  }

  /**
   * Create additional family member record for family members who share the same email
   * Used during registration to onboard children/other family members automatically
   * Note: FAMILY_MEMBERS is now the single source of truth for all profile data
   */
  private async createAdditionalFamilyMember(
    connection: mysql.PoolConnection,
    userId: string,
    alumniProfile: AlumniProfile,
    familyMemberId: string,
    alumniSnapshot?: string | null
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
    // For additional family members, default to NULL birth_date requiring age verification
    if (currentAge !== null) {
      if (currentAge < 14) {
        canAccess = false;
        accessLevel = 'blocked';
      } else if (currentAge < 18) {
        requiresConsent = true;
        accessLevel = 'supervised';
        canAccess = false; // Needs parent consent first
      }
    } else {
      // No age info - mark as requiring age verification
      // User must provide birth date before accessing platform
      // This triggers the YearOfBirthModal during profile selection
      accessLevel = 'full'; // Will be updated when birth date is provided
    }

    // Determine relationship based on age comparison with typical adult (assume parent is 25+ years older)
    // For family members from alumni data, we don't know exact relationship, use 'family_member'
    const relationship = 'family_member';

    console.log(`📋 Creating additional family member for user ${userId}:`, {
      name: `${alumniProfile.firstName} ${alumniProfile.lastName}`,
      alumniId: alumniProfile.id,
      birthDate,
      currentAge,
      accessLevel,
      relationship
    });

    // FAMILY_MEMBERS is now the single source of truth for all profile data
    // Including graduation_year, program, alumni_data_snapshot (previously in user_profiles)
    await connection.execute(`
      INSERT INTO FAMILY_MEMBERS (
        id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
        birth_date, current_age, can_access_platform, requires_parent_consent,
        parent_consent_given, access_level, relationship, is_primary_contact, status,
        graduation_year, program, alumni_data_snapshot, phone,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
      relationship, // 'family_member' for additional members
      0, // is_primary_contact = false for additional members
      canAccess ? 'active' : (requiresConsent ? 'pending_consent' : 'blocked'),
      alumniProfile.graduationYear || null,
      alumniProfile.program || null,
      alumniSnapshot || null,
      alumniProfile.phone || null
    ]);
  }

  /**
   * Handle incomplete alumni data (fallback registration)
   * Creates family member records for ALL alumni members with the same email
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

      // Create user account FIRST (required for FK constraints)
      const userId = uuidv4();
      console.log(`📝 Step 1: Creating app_users record for ${userId} with email ${invitation.email}`);
      
      const insertUserQuery = `
        INSERT INTO app_users (
          id, email, alumni_member_id, first_name, last_name,
          phone, status, email_verified, email_verified_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', 1, NOW(), NOW(), NOW())
      `;

      try {
        await connection.execute(insertUserQuery, [
          userId,
          invitation.email,
          alumniProfile?.id || null,
          mergedData.firstName,
          mergedData.lastName,
          mergedData.phone || null
        ]);
        console.log(`✅ app_users record created successfully`);
      } catch (userInsertError: any) {
        console.error(`❌ FAILED to create app_users record:`, userInsertError);
        throw new Error(`Failed to create user account: ${userInsertError?.message || 'Unknown error'}`);
      }

      // Create default user preferences (depends on app_users FK)
      console.log(`📋 Step 2: Creating default preferences for new user ${userId}...`);
      await this.createDefaultUserPreferences(connection, userId);

      // Update invitation status
      await connection.execute(`
        UPDATE USER_INVITATIONS
        SET status = 'accepted', completion_status = 'completed',
            user_id = ?, used_at = NOW(), updated_at = NOW()
        WHERE id = ?
      `, [userId, invitation.id]);

      // Fetch ALL alumni members with this email for family onboarding
      const allAlumniProfiles = await this.alumniService.fetchAllAlumniMembersByEmail(invitation.email);
      console.log(`👨‍👩‍👧‍👦 Found ${allAlumniProfiles.length} alumni member(s) with email ${invitation.email}`);

      // Create primary FAMILY_MEMBER record
      // Note: FAMILY_MEMBERS is now the single source of truth for profile data
      // (user_profiles table deprecated - see migrations/consolidate-user-profiles-to-family-members.sql)
      const primaryFamilyMemberId = uuidv4();
      if (alumniProfile) {
        const primarySnapshot = this.alumniService.createProfileSnapshot(alumniProfile);
        await this.createPrimaryFamilyMember(connection, userId, alumniProfile, primaryFamilyMemberId, primarySnapshot);
      } else {
        // Create basic family member without alumni profile
        await this.createBasicFamilyMember(connection, userId, mergedData, primaryFamilyMemberId);
      }

      // Create additional family members for other alumni with the same email
      let additionalMembersCreated = 0;
      for (const otherAlumni of allAlumniProfiles) {
        // Skip the primary alumni (already created above)
        if (alumniProfile && otherAlumni.id === alumniProfile.id) {
          continue;
        }
        // Also skip if no primary alumni profile was found (already created basic member)
        if (!alumniProfile && additionalMembersCreated === 0 && otherAlumni.firstName === mergedData.firstName && otherAlumni.lastName === mergedData.lastName) {
          continue;
        }

        // Create family member for this additional alumni record
        const familyMemberId = uuidv4();
        const alumniSnapshot = this.alumniService.createProfileSnapshot(otherAlumni);
        await this.createAdditionalFamilyMember(connection, userId, otherAlumni, familyMemberId, alumniSnapshot);
        additionalMembersCreated++;
        console.log(`👤 Created family member for ${otherAlumni.firstName} ${otherAlumni.lastName} (alumni ID: ${otherAlumni.id})`);
      }

      console.log(`✅ Created ${additionalMembersCreated + 1} total family member(s) for user ${userId}`);

      // Update app_users with primary_family_member_id and family account settings
      await connection.execute(`
        UPDATE app_users
        SET primary_family_member_id = ?,
            is_family_account = TRUE,
            family_account_type = 'alumni'
        WHERE id = ?
      `, [primaryFamilyMemberId, userId]);

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
   * Note: FAMILY_MEMBERS is now the single source of truth for all profile data
   */
  private async createBasicFamilyMember(
    connection: mysql.PoolConnection,
    userId: string,
    userData: any,
    familyMemberId: string
  ): Promise<void> {
    console.log(`📋 Creating basic family member for user ${userId} (no alumni profile)`);

    // FAMILY_MEMBERS is now the single source of truth for all profile data
    // Including graduation_year, program, phone (previously in user_profiles)
    await connection.execute(`
      INSERT INTO FAMILY_MEMBERS (
        id, parent_user_id, first_name, last_name, display_name,
        birth_date, current_age, can_access_platform, requires_parent_consent,
        parent_consent_given, access_level, relationship, is_primary_contact, status,
        graduation_year, program, phone,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
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
      'active',
      userData.graduationYear || null,
      userData.program || null,
      userData.phone || null
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
      // NOTE: Using FAMILY_MEMBERS instead of deprecated user_profiles
      // See migrations/consolidate-user-profiles-to-family-members.sql
      const connection = await this.pool.getConnection();
      const [userRows] = await connection.execute(`
        SELECT au.email, au.first_name, au.last_name, 
               fm.graduation_year, fm.program,
               COALESCE(am.program, fm.program) as alumni_program,
               COALESCE(am.graduation_year, fm.graduation_year) as alumni_graduation_year
        FROM app_users au
        LEFT JOIN FAMILY_MEMBERS fm ON au.primary_family_member_id = fm.id
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
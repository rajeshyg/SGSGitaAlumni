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

      // Merge data if alumni profile exists
      let mergedData = userData;
      if (alumniProfile) {
        const mergeResult = this.alumniService.mergeAlumniDataWithUserInput(alumniProfile, userData);
        mergedData = mergeResult.mergedProfile;
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
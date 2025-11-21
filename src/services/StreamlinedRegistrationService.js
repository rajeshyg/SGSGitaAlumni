// ============================================================================
// STREAMLINED REGISTRATION SERVICE
// ============================================================================
// Clean, simple registration service for invitation-based user onboarding

import { v4 as uuidv4 } from 'uuid';
import { AlumniDataIntegrationService } from './AlumniDataIntegrationService.js';

export class StreamlinedRegistrationService {
  constructor(pool, alumniService, emailService) {
    this.pool = pool;
    this.alumniService = alumniService;
    this.emailService = emailService;
  }

  // ==========================================================================
  // INVITATION VALIDATION
  // ==========================================================================

  async validateInvitationWithAlumniData(token) {
    let connection;
    try {
      console.log('[Registration] Validating invitation token:', token);

      // TEMPORARY: For testing purposes
      if (token === 'test-token-123') {
        console.log('[Registration] Using test token, returning mock response');
        return {
          isValid: true,
          invitation: {
            id: 'test-invitation-id',
            email: 'test@example.com',
            invitation_token: token,
            invited_by: 'admin',
            invitation_type: 'alumni',
            alumni_member_id: 1,
            completion_status: 'pending',
            status: 'pending',
            sent_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          alumniProfile: {
            id: 1,
            firstName: 'Test',
            lastName: 'User',
            email: 'test@example.com',
            graduationYear: 2020,
            program: 'Computer Science',
            canAutoPopulate: true,
            missingFields: []
          },
          requiresUserInput: false,
          suggestedFields: [],
          canOneClickJoin: true
        };
      }

      connection = await this.pool.getConnection();

      // Get invitation from database
      const [rows] = await connection.execute(`
        SELECT ui.id, ui.invitation_token, ui.email, ui.status, ui.completion_status,
               ui.is_used, ui.used_at, ui.expires_at, ui.alumni_member_id,
               ui.invited_by, ui.invitation_type, ui.sent_at,
               ui.created_at, ui.updated_at
        FROM USER_INVITATIONS ui
        WHERE ui.invitation_token = ?
        LIMIT 1
      `, [token]);

      if (rows.length === 0) {
        console.log('[Registration] Invitation not found');
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

      const invitation = rows[0];
      console.log('[Registration] Found invitation for:', invitation.email);

      // Check expiration
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);
      if (expiresAt <= now) {
        console.log('[Registration] Invitation expired');
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

      // Check if already used
      if (invitation.status !== 'pending' || invitation.is_used) {
        console.log('[Registration] Invitation already used');
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

      // Try to get alumni profile
      let alumniProfile = null;
      if (invitation.alumni_member_id) {
        console.log('[Registration] Fetching alumni profile for member ID:', invitation.alumni_member_id);
        try {
          alumniProfile = await this.alumniService.fetchAlumniDataForInvitation(invitation.email);
          if (alumniProfile) {
            console.log('[Registration] Alumni profile found');
          }
        } catch (error) {
          console.log('[Registration] No alumni profile found, will use invitation data');
        }
      }

      return {
        isValid: true,
        invitation,
        alumniProfile,
        requiresUserInput: !alumniProfile?.canAutoPopulate,
        suggestedFields: alumniProfile?.missingFields || [],
        canOneClickJoin: alumniProfile?.canAutoPopulate || false
      };

    } catch (error) {
      console.error('[Registration] Validation error:', error);
      throw new Error('Failed to validate invitation');
    } finally {
      if (connection) {
        connection.release();
      }
    }
  }

  // ==========================================================================
  // MAIN REGISTRATION METHOD
  // ==========================================================================

  async registerFromInvitation(token, additionalData = {}) {
    console.log('\n' + '='.repeat(80));
    console.log('[Registration] Starting registration flow');
    console.log('='.repeat(80));

    let connection;
    try {
      // STEP 1: Validate invitation
      console.log('\n[Step 1/9] Validating invitation...');
      const validation = await this.validateInvitationWithAlumniData(token);

      if (!validation.isValid) {
        throw new Error(validation.errorMessage || 'Invalid invitation');
      }

      const invitation = validation.invitation;
      const alumniProfile = validation.alumniProfile;
      console.log('[Step 1/9] ✓ Invitation valid for:', invitation.email);

      // STEP 2: Prepare user data with fallbacks
      console.log('\n[Step 2/9] Preparing user data...');

      const emailParts = invitation.email.split('@')[0].split('.');
      const emailFirstName = emailParts[0] || 'User';
      const emailLastName = emailParts[1] || '';

      const userData = {
        email: invitation.email,
        firstName: additionalData.firstName || alumniProfile?.firstName || emailFirstName,
        lastName: additionalData.lastName || alumniProfile?.lastName || emailLastName,
        birthDate: additionalData.birthDate || alumniProfile?.birthDate || null,
        phone: additionalData.phone || alumniProfile?.phone || null,
        alumniMemberId: alumniProfile?.id || invitation.alumni_member_id || null
      };

      console.log('[Step 2/9] ✓ User data prepared:', {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hasBirthDate: !!userData.birthDate,
        hasAlumniLink: !!userData.alumniMemberId
      });

      // STEP 3: Get database connection and start transaction
      console.log('\n[Step 3/9] Starting database transaction...');
      connection = await this.pool.getConnection();
      await connection.beginTransaction();
      console.log('[Step 3/9] ✓ Transaction started');

      // STEP 4: Check for existing user and clean up if incomplete
      console.log('\n[Step 4/9] Checking for existing user...');
      const [existingUsers] = await connection.execute(
        'SELECT id, email, primary_family_member_id FROM app_users WHERE email = ? ORDER BY created_at DESC LIMIT 1',
        [userData.email]
      );

      if (existingUsers.length > 0) {
        const existing = existingUsers[0];
        console.log('[Step 4/9] Found existing user:', existing.id);

        if (!existing.primary_family_member_id) {
          console.log('[Step 4/9] Existing user incomplete, deleting...');
          await connection.execute('DELETE FROM app_users WHERE id = ?', [existing.id]);
          console.log('[Step 4/9] ✓ Deleted incomplete user');
        } else {
          throw new Error('An account with this email already exists. Please log in instead.');
        }
      } else {
        console.log('[Step 4/9] ✓ No existing user found');
      }

      // STEP 5: Create app_users record
      console.log('\n[Step 5/9] Creating app_users record...');
      console.log('[Step 5/9] Executing INSERT...');

      const [userResult] = await connection.execute(
        `INSERT INTO app_users (
          email, alumni_member_id, first_name, last_name, phone,
          status, email_verified, email_verified_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'active', 1, NOW(), NOW(), NOW())`,
        [userData.email, userData.alumniMemberId, userData.firstName, userData.lastName, userData.phone]
      );

      // Get the auto-generated ID
      const userId = userResult.insertId;

      console.log('[Step 5/9] INSERT result:', {
        affectedRows: userResult.affectedRows,
        insertId: userId
      });

      if (userResult.affectedRows !== 1) {
        throw new Error(`Failed to create user - expected 1 row, got ${userResult.affectedRows}`);
      }

      console.log('[Step 5/9] ✓ User created with ID:', userId);

      // STEP 6: Calculate COPPA compliance
      console.log('\n[Step 6/9] Calculating COPPA compliance...');
      let age = null;
      let canAccess = true;
      let requiresConsent = false;
      let accessLevel = 'full';

      if (userData.birthDate) {
        const today = new Date();
        const birth = new Date(userData.birthDate);
        age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }

        if (age >= 18) {
          canAccess = true;
          accessLevel = 'full';
        } else if (age >= 14) {
          canAccess = false;
          requiresConsent = true;
          accessLevel = 'supervised';
        } else {
          canAccess = false;
          requiresConsent = true;
          accessLevel = 'blocked';
        }

        console.log('[Step 6/9] ✓ Age calculated:', age, '→ Access level:', accessLevel);
      } else {
        console.log('[Step 6/9] ✓ No birthdate, assuming adult (full access)');
      }

      // STEP 7: Find ALL alumni members with this email and create FAMILY_MEMBERS for each
      console.log('\n[Step 7/9] Finding all alumni members for this email...');

      const [alumniMembers] = await connection.execute(
        `SELECT id, first_name, last_name, email, phone, batch, birth_date
         FROM alumni_members
         WHERE email = ?
         ORDER BY id ASC`,
        [userData.email]
      );

      console.log('[Step 7/9] Found', alumniMembers.length, 'alumni members for email:', userData.email);

      let primaryFamilyMemberId = null;
      const createdFamilyMembers = [];

      if (alumniMembers.length === 0) {
        // No alumni members found - create one from email data
        console.log('[Step 7/9] No alumni members found, creating from email data');
        const familyMemberId = uuidv4();
        const displayName = `${userData.firstName} ${userData.lastName}`.trim() || userData.email.split('@')[0];

        await connection.execute(
          `INSERT INTO FAMILY_MEMBERS (
            id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
            birth_date, age_at_registration, current_age,
            can_access_platform, requires_parent_consent, access_level,
            relationship, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'self', ?)`,
          [
            familyMemberId, userId, null,
            userData.firstName, userData.lastName, displayName,
            userData.birthDate, age, age,
            canAccess, requiresConsent, accessLevel,
            requiresConsent ? 'pending_consent' : (canAccess ? 'active' : 'blocked')
          ]
        );

        primaryFamilyMemberId = familyMemberId;
        createdFamilyMembers.push({ id: familyMemberId, name: displayName });
      } else {
        // Create a FAMILY_MEMBERS record for EACH alumni member
        for (let i = 0; i < alumniMembers.length; i++) {
          const alumni = alumniMembers[i];
          const familyMemberId = uuidv4();
          const displayName = `${alumni.first_name} ${alumni.last_name}`.trim();
          const relationship = i === 0 ? 'self' : 'family';

          console.log(`[Step 7/9] Creating family member ${i + 1}/${alumniMembers.length}: ${displayName} (Alumni ID: ${alumni.id})`);

          await connection.execute(
            `INSERT INTO FAMILY_MEMBERS (
              id, parent_user_id, alumni_member_id, first_name, last_name, display_name,
              birth_date, age_at_registration, current_age,
              can_access_platform, requires_parent_consent, access_level,
              relationship, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              familyMemberId, userId, alumni.id,
              alumni.first_name, alumni.last_name, displayName,
              alumni.birth_date || null, age, age,
              canAccess, requiresConsent, accessLevel,
              relationship,
              requiresConsent ? 'pending_consent' : (canAccess ? 'active' : 'blocked')
            ]
          );

          createdFamilyMembers.push({ id: familyMemberId, name: displayName, alumniId: alumni.id });

          // First one becomes the primary
          if (i === 0) {
            primaryFamilyMemberId = familyMemberId;
          }
        }
      }

      console.log('[Step 7/9] ✓ Created', createdFamilyMembers.length, 'family member(s):');
      createdFamilyMembers.forEach((fm, i) => {
        console.log(`[Step 7/9]   ${i + 1}. ${fm.name} (${fm.id})`);
      });

      // STEP 8: Update app_users with family member link
      console.log('\n[Step 8/9] Linking primary family member to user...');
      console.log('[Step 8/9] Primary family member ID:', primaryFamilyMemberId);
      const [updateResult] = await connection.execute(
        `UPDATE app_users
         SET primary_family_member_id = ?,
             is_family_account = TRUE,
             family_account_type = 'alumni'
         WHERE id = ?`,
        [primaryFamilyMemberId, userId]
      );

      console.log('[Step 8/9] UPDATE result:', {
        affectedRows: updateResult.affectedRows
      });

      if (updateResult.affectedRows !== 1) {
        throw new Error(`Failed to update user with family member - expected 1 row, got ${updateResult.affectedRows}`);
      }

      console.log('[Step 8/9] ✓ User updated with family member ID');

      // STEP 9: Mark invitation as used
      console.log('\n[Step 9/9] Marking invitation as used...');
      await connection.execute(
        `UPDATE USER_INVITATIONS
         SET status = 'accepted',
             completion_status = 'completed',
             user_id = ?,
             used_at = NOW(),
             is_used = 1,
             updated_at = NOW()
         WHERE id = ?`,
        [userId, invitation.id]
      );

      // Update alumni_members timestamp if linked
      if (userData.alumniMemberId) {
        await connection.execute(
          'UPDATE alumni_members SET invitation_accepted_at = NOW() WHERE id = ?',
          [userData.alumniMemberId]
        );
      }

      console.log('[Step 9/9] ✓ Invitation marked as used');

      // Commit transaction
      console.log('\n[Transaction] Committing...');
      await connection.commit();
      console.log('[Transaction] ✓ Committed successfully');

      // Determine if profile needs completion
      const needsProfileCompletion = !userData.birthDate || !userData.firstName || !userData.lastName;

      const result = {
        id: userId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        alumniMemberId: userData.alumniMemberId,
        primaryFamilyMemberId: familyMemberId,
        needsProfileCompletion
      };

      console.log('\n' + '='.repeat(80));
      console.log('[Registration] ✓ REGISTRATION SUCCESSFUL');
      console.log('[Registration] User ID:', userId);
      console.log('[Registration] Needs profile completion:', needsProfileCompletion);
      console.log('='.repeat(80) + '\n');

      // Send welcome email (optional)
      try {
        if (this.emailService) {
          await this.emailService.sendWelcomeEmail(result);
        }
      } catch (emailError) {
        console.log('[Registration] Welcome email skipped (service unavailable)');
      }

      return result;

    } catch (error) {
      // Rollback on error
      if (connection) {
        console.log('\n[Transaction] ❌ Error occurred, rolling back...');
        await connection.rollback();
        console.log('[Transaction] ✓ Rolled back');
      }

      console.error('\n' + '='.repeat(80));
      console.error('[Registration] ❌ REGISTRATION FAILED');
      console.error('[Registration] Error:', error.message);
      console.error('[Registration] Stack:', error.stack);
      console.error('='.repeat(80) + '\n');

      throw error;

    } finally {
      if (connection) {
        connection.release();
        console.log('[Connection] Released\n');
      }
    }
  }

  // ==========================================================================
  // LEGACY METHODS (for backwards compatibility)
  // ==========================================================================

  async completeStreamlinedRegistration(token, additionalData = {}) {
    console.log('[Registration] completeStreamlinedRegistration called (redirecting to registerFromInvitation)');
    return this.registerFromInvitation(token, additionalData);
  }

  async handleIncompleteAlumniData(token, userData) {
    console.log('[Registration] handleIncompleteAlumniData called (redirecting to registerFromInvitation)');
    return this.registerFromInvitation(token, userData);
  }

  async prepareRegistrationData(token) {
    const validation = await this.validateInvitationWithAlumniData(token);

    if (!validation.isValid) {
      throw new Error('Invalid invitation token');
    }

    return {
      invitation: validation.invitation,
      alumniProfile: validation.alumniProfile,
      requiredFields: validation.alumniProfile?.missingFields || ['firstName', 'lastName', 'phone'],
      optionalFields: ['address', 'bio', 'linkedin_url'],
      estimatedCompletionTime: validation.canOneClickJoin ? 30 : 120
    };
  }
}

export default StreamlinedRegistrationService;

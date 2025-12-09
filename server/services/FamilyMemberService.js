/**
 * FAMILY MEMBER SERVICE (MIGRATED)
 * 
 * Handles all family member/profile operations including:
 * - Creating and managing user profiles (linked to alumni_members)
 * - Profile switching
 * - Age verification and parent consent
 * - Access control
 * 
 * MIGRATED: Uses accounts + user_profiles + alumni_members schema
 * (replaced legacy app_users + FAMILY_MEMBERS references)
 */

import db from '../../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class FamilyMemberService {
  
  /**
   * Get all profiles for an account
   * MIGRATED: user_profiles joined with alumni_members
   */
  async getFamilyMembers(accountId) {
    const [profiles] = await db.execute(
      `SELECT up.id, up.relationship, up.access_level, up.status, up.parent_profile_id,
              up.requires_consent, up.parent_consent_given, up.created_at, up.updated_at,
              am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth
       FROM user_profiles up
       JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE up.account_id = ?
       ORDER BY up.relationship DESC, up.created_at ASC`,
      [accountId]
    );
    return profiles;
  }
  
  /**
   * Get a specific profile by ID
   * MIGRATED: user_profiles joined with alumni_members
   */
  async getFamilyMember(profileId, accountId = null) {
    let query = `
      SELECT up.*, am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth, am.email
       FROM user_profiles up
       JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE up.id = ?`;
    const params = [profileId];
    
    if (accountId) {
      query += ` AND up.account_id = ?`;
      params.push(accountId);
    }
    
    query += ` LIMIT 1`;
    
    const [rows] = await db.execute(query, params);
    return rows[0] || null;
  }
  
  /**
   * Create a new profile for an account
   * MIGRATED: Creates user_profiles entry linked to alumni_members
   */
  async createFamilyMember(accountId, payload) {
    const age = payload.yearOfBirth ? new Date().getFullYear() - Number(payload.yearOfBirth) : null;
    if (age !== null && age < 14) {
      throw new Error('Profile creation blocked for under 14 (COPPA)');
    }
    
    const requiresConsent = age !== null && age < 18;
    const accessLevel = requiresConsent ? 'supervised' : 'full';
    const status = requiresConsent ? 'pending_consent' : 'active';
    const id = uuidv4();
    
    await db.execute(
      `INSERT INTO user_profiles (
         id, account_id, alumni_member_id, relationship, parent_profile_id,
         access_level, status, requires_consent, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        accountId,
        payload.alumniMemberId,
        payload.relationship,
        payload.parentProfileId || null,
        accessLevel,
        status,
        requiresConsent ? 1 : 0
      ]
    );
    
    return await this.getFamilyMember(id, accountId);
  }
  
  /**
   * Update an existing profile
   * MIGRATED: Updates user_profiles
   */
  async updateFamilyMember(profileId, accountId, updates) {
    const allowedFields = ['relationship', 'access_level', 'status', 'parent_profile_id'];
    const setClause = [];
    const params = [];
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClause.push(`${field} = ?`);
        params.push(updates[field]);
      }
    }
    
    if (setClause.length === 0) {
      return await this.getFamilyMember(profileId, accountId);
    }
    
    setClause.push('updated_at = NOW()');
    params.push(profileId, accountId);
    
    await db.execute(
      `UPDATE user_profiles SET ${setClause.join(', ')} WHERE id = ? AND account_id = ?`,
      params
    );
    
    return await this.getFamilyMember(profileId, accountId);
  }
  
  /**
   * Delete a profile
   * MIGRATED: Deletes from user_profiles
   */
  async deleteFamilyMember(profileId, accountId) {
    // Check if this is not a self profile
    const profile = await this.getFamilyMember(profileId, accountId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    if (profile.relationship === 'self') {
      throw new Error('Cannot delete self profile');
    }
    
    await db.execute(
      `DELETE FROM user_profiles WHERE id = ? AND account_id = ?`,
      [profileId, accountId]
    );
    
    return { success: true };
  }
  
  /**
   * Grant parent consent for a minor profile
   * MIGRATED: Updates user_profiles and PARENT_CONSENT_RECORDS
   */
  async grantParentConsent(profileId, accountId, consentData = {}) {
    const profile = await this.getFamilyMember(profileId, accountId);
    if (!profile) throw new Error('Profile not found');
    
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    
    await db.execute(
      `UPDATE user_profiles SET 
         parent_consent_given = 1,
         consent_expiry_date = ?,
         access_level = 'supervised',
         status = 'active',
         updated_at = NOW()
       WHERE id = ? AND account_id = ?`,
      [expiresAt, profileId, accountId]
    );
    
    await db.execute(
      `INSERT INTO PARENT_CONSENT_RECORDS 
         (id, child_profile_id, parent_account_id, consent_given_date, consent_expiry_date, status, created_at,
          ip_address, user_agent, digital_signature, verification_method)
       VALUES (?, ?, ?, NOW(), ?, 'active', NOW(), ?, ?, ?, ?)`,
      [
        uuidv4(),
        profileId,
        accountId,
        expiresAt,
        consentData.ipAddress || null,
        consentData.userAgent || null,
        consentData.digitalSignature || null,
        consentData.verificationMethod || 'email_otp'
      ]
    );
    
    return await this.getFamilyMember(profileId, accountId);
  }
  
  /**
   * Revoke parent consent for a minor profile
   * MIGRATED: Updates PARENT_CONSENT_RECORDS and user_profiles
   */
  async revokeParentConsent(profileId, accountId, revocationData = {}) {
    const profile = await this.getFamilyMember(profileId, accountId);
    if (!profile) throw new Error('Profile not found');
    
    await db.execute(
      `UPDATE PARENT_CONSENT_RECORDS
       SET status = 'revoked',
           revoked_at = NOW(),
           revoked_reason = ?
       WHERE child_profile_id = ? AND parent_account_id = ? AND status = 'active'`,
      [revocationData.reason || 'Consent revoked by parent', profileId, accountId]
    );
    
    await db.execute(
      `UPDATE user_profiles
       SET parent_consent_given = 0,
           access_level = 'supervised',
           status = 'pending_consent',
           updated_at = NOW()
       WHERE id = ? AND account_id = ?`,
      [profileId, accountId]
    );
    
    return await this.getFamilyMember(profileId, accountId);
  }
  
  /**
   * Check if annual consent renewal is needed
   * Queries PARENT_CONSENT_RECORDS for expiration status
   */
  async checkConsentRenewal(profileId) {
    const profile = await this.getFamilyMember(profileId);
    
    if (!profile || !profile.requires_consent) {
      return { needsRenewal: false };
    }
    
    // Check if there's an active consent record
    const [consentRecords] = await db.execute(
      `SELECT id, consent_given_date, consent_expiry_date, status
       FROM PARENT_CONSENT_RECORDS
       WHERE child_profile_id = ?
         AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [profileId]
    );
    
    // No consent record found - needs consent
    if (consentRecords.length === 0) {
      return {
        needsRenewal: true,
        reason: 'no_consent_record',
        message: 'No active consent record found'
      };
    }
    
    const consentRecord = consentRecords[0];
    const now = new Date();
    const expiresAt = new Date(consentRecord.consent_expiry_date);
    
    // Check if consent has expired
    if (expiresAt < now) {
      return {
        needsRenewal: true,
        reason: 'expired',
        expiresAt: consentRecord.consent_expiry_date,
        consentId: consentRecord.id,
        message: `Consent expired on ${expiresAt.toLocaleDateString()}`
      };
    }
    
    // Check if consent is expiring soon (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    if (expiresAt < thirtyDaysFromNow) {
      return {
        needsRenewal: false,
        expiringSoon: true,
        expiresAt: consentRecord.consent_expiry_date,
        daysRemaining: Math.floor((expiresAt - now) / (1000 * 60 * 60 * 24)),
        consentId: consentRecord.id,
        message: `Consent expires on ${expiresAt.toLocaleDateString()}`
      };
    }
    
    // Consent is valid
    return {
      needsRenewal: false,
      expiresAt: consentRecord.consent_expiry_date,
      consentTimestamp: consentRecord.consent_given_date,
      consentId: consentRecord.id,
      message: 'Consent is active and valid'
    };
  }
  
  /**
   * Get access log for account profiles
   * MIGRATED: Queries profile access history
   */
  async getAccessLog(accountId, limit = 10) {
    const limitValue = parseInt(limit, 10) || 10;
    
    const [logs] = await db.execute(
      `SELECT pal.*, up.relationship,
              am.first_name, am.last_name
       FROM PROFILE_ACCESS_LOG pal
       JOIN user_profiles up ON pal.profile_id = up.id
       JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE up.account_id = ?
       ORDER BY pal.access_timestamp DESC
       LIMIT ?`,
      [accountId, limitValue]
    );
    
    return logs;
  }
}

export default new FamilyMemberService();

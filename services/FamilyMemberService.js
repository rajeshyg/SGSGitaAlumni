/**
 * FAMILY MEMBER SERVICE
 * 
 * Handles all family member operations including:
 * - Creating and managing family member profiles
 * - Profile switching
 * - Age verification and parent consent
 * - Access control
 */

import db from '../config/database.js';

class FamilyMemberService {
  
  /**
   * Get all family members for a parent user
   */
  async getFamilyMembers(parentUserId) {
    const [members] = await db.execute(
      `SELECT 
        id,
        parent_user_id,
        alumni_member_id,
        first_name,
        last_name,
        display_name,
        birth_date,
        current_age,
        can_access_platform,
        requires_parent_consent,
        parent_consent_given,
        access_level,
        relationship,
        is_primary_contact,
        profile_image_url,
        status,
        last_login_at
      FROM FAMILY_MEMBERS
      WHERE parent_user_id = ?
      ORDER BY is_primary_contact DESC, created_at ASC`,
      [parentUserId]
    );
    
    return members;
  }
  
  /**
   * Get a specific family member by ID
   */
  async getFamilyMember(familyMemberId, parentUserId = null) {
    const query = parentUserId 
      ? 'SELECT * FROM FAMILY_MEMBERS WHERE id = ? AND parent_user_id = ?'
      : 'SELECT * FROM FAMILY_MEMBERS WHERE id = ?';
    
    const params = parentUserId ? [familyMemberId, parentUserId] : [familyMemberId];
    const [members] = await db.execute(query, params);
    
    return members[0] || null;
  }
  
  /**
   * Create a new family member
   */
  async createFamilyMember(parentUserId, memberData) {
    const {
      firstName,
      lastName,
      displayName,
      birthDate,
      relationship = 'child',
      profileImageUrl = null
    } = memberData;
    
    // Calculate age if birthDate provided
    let age = null;
    let canAccess = false;
    let requiresConsent = false;
    let accessLevel = 'blocked';
    
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      age = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      
      // COPPA compliance: under 14 = blocked, 14-17 = needs consent, 18+ = full
      if (age >= 18) {
        canAccess = true;
        accessLevel = 'full';
      } else if (age >= 14) {
        canAccess = false; // Needs parent consent first
        requiresConsent = true;
        accessLevel = 'supervised';
      }
    }
    
    const [result] = await db.execute(
      `INSERT INTO FAMILY_MEMBERS (
        parent_user_id,
        first_name,
        last_name,
        display_name,
        birth_date,
        age_at_registration,
        current_age,
        can_access_platform,
        requires_parent_consent,
        access_level,
        relationship,
        profile_image_url,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parentUserId,
        firstName,
        lastName,
        displayName || `${firstName} ${lastName}`,
        birthDate,
        age,
        age,
        canAccess,
        requiresConsent,
        accessLevel,
        relationship,
        profileImageUrl,
        requiresConsent ? 'pending_consent' : (canAccess ? 'active' : 'blocked')
      ]
    );
    
    // Update parent account to be a family account
    await db.execute(
      `UPDATE app_users 
       SET is_family_account = TRUE,
           family_account_type = 'parent'
       WHERE id = ?`,
      [parentUserId]
    );
    
    // Get the created member
    const [members] = await db.execute(
      'SELECT * FROM FAMILY_MEMBERS WHERE parent_user_id = ? ORDER BY created_at DESC LIMIT 1',
      [parentUserId]
    );
    
    return members[0];
  }
  
  /**
   * Grant parent consent for a minor (14-17)
   */
  async grantParentConsent(familyMemberId, parentUserId) {
    const member = await this.getFamilyMember(familyMemberId, parentUserId);
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    if (!member.requires_parent_consent) {
      throw new Error('This family member does not require parent consent');
    }
    
    await db.execute(
      `UPDATE FAMILY_MEMBERS
       SET parent_consent_given = TRUE,
           parent_consent_date = NOW(),
           can_access_platform = TRUE,
           status = 'active',
           last_consent_check_at = NOW()
       WHERE id = ?`,
      [familyMemberId]
    );
    
    return await this.getFamilyMember(familyMemberId);
  }
  
  /**
   * Revoke parent consent
   */
  async revokeParentConsent(familyMemberId, parentUserId) {
    const member = await this.getFamilyMember(familyMemberId, parentUserId);
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    await db.execute(
      `UPDATE FAMILY_MEMBERS
       SET parent_consent_given = FALSE,
           can_access_platform = FALSE,
           status = 'pending_consent'
       WHERE id = ?`,
      [familyMemberId]
    );
    
    return await this.getFamilyMember(familyMemberId);
  }
  
  /**
   * Switch active profile for a user session
   */
  async switchProfile(parentUserId, familyMemberId, ipAddress, userAgent) {
    const member = await this.getFamilyMember(familyMemberId, parentUserId);
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    if (!member.can_access_platform) {
      throw new Error('This family member does not have platform access');
    }
    
    // Update user's active family member
    await db.execute(
      `UPDATE app_users
       SET primary_family_member_id = ?
       WHERE id = ?`,
      [familyMemberId, parentUserId]
    );
    
    // Update family member's last login
    await db.execute(
      `UPDATE FAMILY_MEMBERS
       SET last_login_at = NOW()
       WHERE id = ?`,
      [familyMemberId]
    );
    
    // Log the profile switch
    await db.execute(
      `INSERT INTO FAMILY_ACCESS_LOG (
        family_member_id,
        parent_user_id,
        access_type,
        ip_address,
        user_agent
      ) VALUES (?, ?, 'profile_switch', ?, ?)`,
      [familyMemberId, parentUserId, ipAddress, userAgent]
    );
    
    return member;
  }
  
  /**
   * Update family member profile
   */
  async updateFamilyMember(familyMemberId, parentUserId, updates) {
    const member = await this.getFamilyMember(familyMemberId, parentUserId);
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    const allowedFields = [
      'first_name',
      'last_name',
      'display_name',
      'profile_image_url',
      'bio'
    ];
    
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updates).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        updateFields.push(`${snakeKey} = ?`);
        updateValues.push(updates[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return member;
    }
    
    updateValues.push(familyMemberId);
    
    await db.execute(
      `UPDATE FAMILY_MEMBERS SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
    
    return await this.getFamilyMember(familyMemberId);
  }
  
  /**
   * Delete a family member
   */
  async deleteFamilyMember(familyMemberId, parentUserId) {
    const member = await this.getFamilyMember(familyMemberId, parentUserId);
    
    if (!member) {
      throw new Error('Family member not found');
    }
    
    if (member.is_primary_contact) {
      throw new Error('Cannot delete primary contact profile');
    }
    
    await db.execute(
      'DELETE FROM FAMILY_MEMBERS WHERE id = ? AND parent_user_id = ?',
      [familyMemberId, parentUserId]
    );
    
    return { success: true, message: 'Family member deleted' };
  }
  
  /**
   * Get family access logs
   */
  async getAccessLogs(parentUserId, limit = 50) {
    const limitValue = typeof limit === 'number' ? limit : parseInt(limit) || 50;
    
    const [logs] = await db.execute(
      `SELECT 
        fal.id,
        fal.family_member_id,
        fal.parent_user_id,
        fal.access_type,
        fal.access_timestamp,
        fal.ip_address,
        fal.user_agent,
        fm.first_name,
        fm.last_name,
        fm.display_name
      FROM FAMILY_ACCESS_LOG fal
      JOIN FAMILY_MEMBERS fm ON fal.family_member_id = fm.id
      WHERE fal.parent_user_id = ?
      ORDER BY fal.access_timestamp DESC
      LIMIT ?`,
      [parentUserId, limitValue]
    );
    
    return logs;
  }
  
  /**
   * Check if annual consent renewal is needed
   */
  async checkConsentRenewal(familyMemberId) {
    const member = await this.getFamilyMember(familyMemberId);
    
    if (!member || !member.requires_parent_consent) {
      return { needsRenewal: false };
    }
    
    const lastCheck = member.last_consent_check_at || member.parent_consent_date;
    if (!lastCheck) {
      return { needsRenewal: true };
    }
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const needsRenewal = new Date(lastCheck) < oneYearAgo;
    
    return { needsRenewal, lastCheck };
  }
}

export default new FamilyMemberService();

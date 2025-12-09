import mysql from 'mysql2/promise';
import { hmacTokenService } from '../src/lib/security/HMACTokenService.js';
import { ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';

// Get database pool - will be passed from main server
let pool = null;

export function setInvitationsPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// INVITATION SYSTEM API ENDPOINTS
// ============================================================================

// Get all invitations with pagination (both regular and family invitations)
export const getAllInvitations = asyncHandler(async (req, res) => {
  const { createLogger } = await import('../src/utils/logger.js');
  const logger = createLogger('api/invitations');

  const { page = 1, pageSize = 50, status } = req.query;

  // Use database
  const connection = await pool.getConnection();
  try {
    logger.info('Fetching all invitations for admin management', { page, pageSize, status });

    // Build WHERE clause for regular invitations
    let whereClause = '';
    const queryParams = [];

    if (status) {
      whereClause = 'WHERE ui.status = ?';
      queryParams.push(status);
    }

    // Get total count for regular invitations
    const countQuery = `SELECT COUNT(*) as total FROM USER_INVITATIONS ui ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Get paginated regular invitations
    const pageSizeNum = parseInt(pageSize) || 20;
    const offsetNum = (parseInt(page) - 1) * pageSizeNum;
    // MIGRATED: accounts table doesn't have first_name/last_name - join with user_profiles + alumni_members
    const dataQuery = `
      SELECT
        ui.*,
        COALESCE(am.first_name, 'Unknown') as first_name,
        COALESCE(am.last_name, '') as last_name,
        a.email as user_email
      FROM USER_INVITATIONS ui
      LEFT JOIN accounts a ON ui.user_id COLLATE utf8mb4_unicode_ci = a.id COLLATE utf8mb4_unicode_ci
      LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      ${whereClause}
      ORDER BY ui.created_at DESC
      LIMIT ${pageSizeNum} OFFSET ${offsetNum}
    `;

    const [rows] = await connection.execute(dataQuery, queryParams);
    logger.info('Rows fetched from DB', { count: rows.length });

    // Transform regular invitations data
    const invitations = rows.map(row => {
      let invitationData = {};
      // Skip parsing if invitation_data is null, undefined, or contains [object Object]
      if (row.invitation_data && typeof row.invitation_data === 'string' && row.invitation_data !== '[object Object]' && row.invitation_data.trim() !== '') {
        try {
          if (row.invitation_data === '[object Object]' || row.invitation_data.trim() === '') {
            invitationData = {};
          } else {
            try {
              invitationData = JSON.parse(row.invitation_data);
            } catch (parseError) {
              try {
                const fixedJson = row.invitation_data.replace(/'/g, '"');
                invitationData = JSON.parse(fixedJson);
              } catch (secondParseError) {
                logger.warn('Failed to parse invitation_data', { id: row.id, data: row.invitation_data.substring(0, 100), parseError, secondParseError });
                invitationData = {};
              }
            }
          }
        } catch (error) {
          logger.warn('Exception during invitation_data parsing', { id: row.id, error });
          invitationData = {};
        }
      }
      return {
        id: row.id,
        email: row.email,
        userId: row.user_id,
        invitationToken: row.invitation_token,
        invitedBy: row.invited_by,
        invitationType: row.invitation_type,
        invitationData: invitationData,
        status: row.status,
        sentAt: row.sent_at,
        expiresAt: row.expires_at,
        isUsed: row.is_used,
        usedAt: row.used_at,
        acceptedBy: row.accepted_by,
        resendCount: row.resend_count,
        lastResentAt: row.last_resent_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        user: row.user_id ? {
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.user_email
        } : null,
        invitationCategory: 'regular'
      };
    });

    logger.info('Transformed invitations', { count: invitations.length });

    res.json({
      success: true,
      data: invitations,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    });
  } finally {
    connection.release();
  }
});

// DEPRECATED: Family invitation functions removed in Phase 3
// Replaced by new onboarding flow with explicit profile selection
// - getFamilyInvitations
// - createFamilyInvitation  
// - validateFamilyInvitation
// - acceptFamilyInvitationProfile

// Create invitation (supports both email and userId based invitations)
export const createInvitation = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { email, userId, invitedBy, invitationType, invitationData, expiresAt, expiresInDays } = req.body;

    // Validate that either email or userId is provided
    if (!email && !userId) {
      throw ValidationError.missingField('email or userId');
    }

    if (email && userId) {
      throw ValidationError.invalidData('Cannot provide both email and userId');
    }

    let targetEmail = email;
    let targetUserId = userId;

    // If userId is provided, get the email from the user record
    if (userId) {
      const [userRows] = await connection.execute(
        'SELECT email FROM accounts WHERE id = ? AND status = ?',[userId,'active']
      );

      if (userRows.length === 0) {
        throw ResourceError.notFound('User', userId);
      }

      targetEmail = userRows[0].email;
      targetUserId = userId;
    }

    // Check if user already exists (for email-based invitations)
    if (email && !userId) {
      const [existingUserRows] = await connection.execute(
        'SELECT id FROM accounts WHERE email = ? AND status = ?',[email,'active']
      );

      if (existingUserRows.length > 0) {
        targetUserId = existingUserRows[0].id;
      }
    }

    // Check for existing pending invitation
    let existingCheckQuery = 'SELECT id FROM USER_INVITATIONS WHERE status = "pending" AND email = ?';
    let existingCheckParams = [targetEmail];

    if (targetUserId) {
      existingCheckQuery += ' AND user_id = ?';
      existingCheckParams.push(targetUserId);
    }

    const [existingRows] = await connection.execute(existingCheckQuery, existingCheckParams);

    if (existingRows.length > 0) {
      throw ValidationError.duplicate('invitation', 'User already has a pending invitation');
    }

    // Calculate expiration date
    let expiresAtDate;
    if (expiresAt) {
      expiresAtDate = new Date(expiresAt);
    } else if (expiresInDays) {
      expiresAtDate = new Date(Date.now() + parseInt(expiresInDays) * 24 * 60 * 60 * 1000);
    } else {
      expiresAtDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    // Generate HMAC token
    const invitationId = generateUUID();
    const hmacToken = generateHMACInvitationToken({
      id: invitationId,
      email: targetEmail,
      invitationType: invitationType || 'alumni',
      expiresAt: expiresAtDate
    });

    // Extract token components for database storage
    // The token is base64url encoded JSON with {payload, signature}
    let tokenPayload = '';
    let tokenSignature = '';
    try {
      const tokenData = JSON.parse(Buffer.from(hmacToken, 'base64url').toString());
      tokenPayload = JSON.stringify(tokenData.payload) || '';
      tokenSignature = tokenData.signature || '';
    } catch (error) {
      console.error('Error parsing HMAC token:', error);
      tokenPayload = '';
      tokenSignature = '';
    }

    const invitation = {
      id: invitationId,
      email: targetEmail,
      userId: targetUserId || null,
      invitationToken: hmacToken, // Store full HMAC token
      invitedBy,
      invitationType: invitationType || 'alumni',
      invitationData: JSON.stringify(invitationData || {}).replace(/'/g, '"'), // Fix single quotes to double quotes
      status: 'pending',
      sentAt: new Date(),
      expiresAt: expiresAtDate,
      isUsed: false,
      resendCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO USER_INVITATIONS (
        id, email, user_id, invitation_token, invited_by, invitation_type,
        invitation_data, status, sent_at, expires_at, is_used,
        resend_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      invitation.id,
      invitation.email,
      invitation.userId,
      invitation.invitationToken,
      invitation.invitedBy,
      invitation.invitationType,
      invitation.invitationData,
      invitation.status,
      invitation.sentAt,
      invitation.expiresAt,
      invitation.isUsed,
      invitation.resendCount,
      invitation.createdAt,
      invitation.updatedAt
    ]);

    res.status(201).json({
      success: true,
      data: invitation
    });
  } finally {
    connection.release();
  }
});

// Create bulk invitations
export const createBulkInvitations = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { invitations, invitedBy, invitationType, expiresInDays = 7 } = req.body;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      throw ValidationError.missingField('invitations array');
    }

    if (invitations.length > 50) {
      throw ValidationError.invalidData('Maximum 50 invitations allowed per bulk request');
    }

  const createdInvitations = [];
  const errors = [];

  // Calculate expiration date
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  for (const invitationData of invitations) {
    try {
      const { userId, email } = invitationData;

      if (!userId && !email) {
        errors.push({ invitationData, error: 'Either userId or email must be provided' });
        continue;
      }

      let targetEmail = email;
      let targetUserId = userId;

      // If userId is provided, get the email from the user record
      if (userId) {
        const [userRows] = await connection.execute(
          'SELECT email FROM accounts WHERE id = ? AND status = ?',[userId,'active']
        );

        if (userRows.length === 0) {
          errors.push({ invitationData, error: 'User not found' });
          continue;
        }

        targetEmail = userRows[0].email;
        targetUserId = userId;
      }

      // Check for existing pending invitation
      let existingCheckQuery = 'SELECT id FROM USER_INVITATIONS WHERE status = "pending" AND email = ?';
      let existingCheckParams = [targetEmail];

      if (targetUserId) {
        existingCheckQuery += ' AND user_id = ?';
        existingCheckParams.push(targetUserId);
      }

      const [existingRows] = await connection.execute(existingCheckQuery, existingCheckParams);

      if (existingRows.length > 0) {
        errors.push({ invitationData, error: 'User already has a pending invitation' });
        continue;
      }

      // Generate HMAC token
      const invitationId = generateUUID();
      const hmacToken = generateHMACInvitationToken({
        id: invitationId,
        email: targetEmail,
        invitationType: invitationType || 'profile_completion',
        expiresAt
      });

      // Extract token components for database storage
      // The token is base64url encoded JSON with {payload, signature}
      let tokenPayload = '';
      let tokenSignature = '';
      try {
        const tokenData = JSON.parse(Buffer.from(hmacToken, 'base64url').toString());
        tokenPayload = JSON.stringify(tokenData.payload) || '';
        tokenSignature = tokenData.signature || '';
      } catch (error) {
        console.error('Error parsing HMAC token:', error);
        tokenPayload = '';
        tokenSignature = '';
      }

      const invitation = {
        id: invitationId,
        email: targetEmail,
        userId: targetUserId,
        invitationToken: hmacToken, // Store full HMAC token
        invitedBy,
        invitationType: invitationType || 'profile_completion',
        invitationData: JSON.stringify(invitationData.invitationData || {}).replace(/'/g, '"'), // Fix single quotes to double quotes
        status: 'pending',
        sentAt: new Date(),
        expiresAt,
        isUsed: false,
        resendCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertQuery = `
        INSERT INTO USER_INVITATIONS (
          id, email, user_id, invitation_token, invited_by, invitation_type,
          invitation_data, status, sent_at, expires_at, is_used,
          resend_count, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertQuery, [
        invitation.id,
        invitation.email,
        invitation.userId,
        invitation.invitationToken,
        invitation.invitedBy,
        invitation.invitationType,
        invitation.invitationData,
        invitation.status,
        invitation.sentAt,
        invitation.expiresAt,
        invitation.isUsed,
        invitation.resendCount,
        invitation.createdAt,
        invitation.updatedAt
      ]);

      createdInvitations.push(invitation);

    } catch (invitationError) {
      console.error('Error creating individual invitation:', invitationError);
      errors.push({ invitationData, error: invitationError.message });
    }
  }

    res.status(201).json({
      success: true,
      created: createdInvitations.length,
      failed: errors.length,
      invitations: createdInvitations,
      failedInvitations: errors
    });
  } finally {
    connection.release();
  }
});

// Validate invitation token and return alumni matches with COPPA status
export const validateInvitation = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const connection = await pool.getConnection();
  try {
    // First try to find by invitation_token (HMAC signed token)
    let [invitations] = await connection.execute(
      `SELECT id, email, status, expires_at
       FROM USER_INVITATIONS
       WHERE invitation_token = ? AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    // If not found by token, try by id (UUID) for backward compatibility
    if (invitations.length === 0) {
      [invitations] = await connection.execute(
        `SELECT id, email, status, expires_at
         FROM USER_INVITATIONS
         WHERE id = ? AND status = 'pending' AND expires_at > NOW()`,
        [token]
      );
    }

    if (invitations.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const invitation = invitations[0];

    // Fetch matching alumni
    const [alumni] = await connection.execute(
      `SELECT id, first_name, last_name, batch, center_name, year_of_birth, email,
              CASE 
                WHEN year_of_birth IS NOT NULL THEN YEAR(CURDATE()) - year_of_birth
                ELSE NULL
              END as age
       FROM alumni_members 
       WHERE email = ?`,
      [invitation.email]
    );

    // Get the primary alumni profile (first match)
    const primaryAlumni = alumni.length > 0 ? alumni[0] : null;
    const age = primaryAlumni?.age;
    const coppaStatus = getCoppaStatus(age);
    
    // Map alumni to the expected format
    const alumniWithCoppa = alumni.map(a => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      batch: a.batch,
      centerName: a.center_name,
      yearOfBirth: a.year_of_birth,
      age: a.age,
      coppaStatus: getCoppaStatus(a.age),
      canCreateProfile: a.age === null || a.age >= 14
    }));

    // Build response matching frontend InvitationValidationResponse interface
    res.json({
      isValid: true,
      valid: true, // backward compatibility
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expires_at,
        status: invitation.status
      },
      alumniProfile: primaryAlumni ? {
        id: primaryAlumni.id,
        firstName: primaryAlumni.first_name,
        lastName: primaryAlumni.last_name,
        email: primaryAlumni.email,
        batch: primaryAlumni.batch,
        centerName: primaryAlumni.center_name,
        yearOfBirth: primaryAlumni.year_of_birth,
        age: primaryAlumni.age,
        // Note: current_position, company, location are on user_profiles, not alumni_members
        currentPosition: null,
        company: null,
        location: null,
        requiresParentConsent: coppaStatus === 'requires_consent',
        isBlocked: coppaStatus === 'blocked'
      } : null,
      alumni: alumniWithCoppa,
      requiresUserInput: !primaryAlumni,
      suggestedFields: !primaryAlumni ? ['firstName', 'lastName', 'yearOfBirth'] : [],
      canOneClickJoin: !!primaryAlumni && coppaStatus === 'full_access',
      registrationData: {
        requiredFields: ['password'],
        optionalFields: ['profileImage'],
        estimatedCompletionTime: 60
      }
    });
  } finally {
    connection.release();
  }
});

function getCoppaStatus(age) {
  if (age === null) return 'unknown';
  if (age < 14) return 'blocked';
  if (age < 18) return 'requires_consent';
  return 'full_access';
}

// Update invitation status
export const updateInvitation = asyncHandler(async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    if (updates.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(updates.status);
    }

    if (updates.isUsed !== undefined) {
      updateFields.push('is_used = ?');
      updateValues.push(updates.isUsed);
    }

    if (updates.usedAt !== undefined) {
      updateFields.push('used_at = ?');
      updateValues.push(new Date(updates.usedAt));
    }

    if (updates.acceptedBy !== undefined) {
      updateFields.push('accepted_by = ?');
      updateValues.push(updates.acceptedBy);
    }

    if (updates.userId !== undefined) {
      updateFields.push('user_id = ?');
      updateValues.push(updates.userId);
    }

    if (updates.sentAt !== undefined) {
      updateFields.push('sent_at = ?');
      updateValues.push(new Date(updates.sentAt));
    }

    if (updates.resendCount !== undefined) {
      updateFields.push('resend_count = ?');
      updateValues.push(updates.resendCount);
    }

    if (updates.lastResentAt !== undefined) {
      updateFields.push('last_resent_at = ?');
      updateValues.push(new Date(updates.lastResentAt));
    }

    if (updateFields.length === 0) {
      throw ValidationError.missingField('fields to update');
    }

    updateFields.push('updated_at = NOW()');

    const query = `
      UPDATE USER_INVITATIONS
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    updateValues.push(id);

    const [result] = await connection.execute(query, updateValues);

    if (result.affectedRows === 0) {
      throw ResourceError.notFound('Invitation', id);
    }

    // Get updated invitation
    const [rows] = await connection.execute('SELECT * FROM USER_INVITATIONS WHERE id = ?', [id]);

    const invitation = rows[0];
    res.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        userId: invitation.user_id,
        invitationToken: invitation.invitation_token,
        invitedBy: invitation.invited_by,
        invitationData: (() => {
          try {
            return JSON.parse(invitation.invitation_data || '{}');
          } catch (error) {
            return {};
          }
        })(),
        sentAt: invitation.sent_at,
        expiresAt: invitation.expires_at,
        isUsed: invitation.is_used,
        usedAt: invitation.used_at,
        acceptedBy: invitation.accepted_by,
        resendCount: invitation.resend_count,
        lastResentAt: invitation.last_resent_at,
        createdAt: invitation.created_at,
        updatedAt: invitation.updated_at
      }
    });
  } finally {
    connection.release();
  }
});

// Resend invitation
export const resendInvitation = asyncHandler(async (req, res) => {
  const { createLogger } = await import('../src/utils/logger.js');
  const logger = createLogger('api/invitations');

  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    logger.info('Resending invitation:', id);

    // Get the invitation
    const [invitations] = await connection.execute(
      'SELECT * FROM USER_INVITATIONS WHERE id = ?',
      [id]
    );

    if (invitations.length === 0) {
      throw ResourceError.notFound('Invitation', id);
    }

    const invitation = invitations[0];

    // Check if invitation can be resent (not expired, not accepted)
    if (invitation.status === 'accepted') {
      throw ValidationError.invalidData('Cannot resend accepted invitation');
    }

    // Generate a NEW HMAC token for the resent invitation
    const expiresInDays = 7; // Default expiry
    const newExpiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    // Use the helper function to ensure correct payload format
    const newHmacToken = generateHMACInvitationToken({
      id: invitation.id,
      email: invitation.email,
      invitationType: invitation.invitation_type || 'alumni',
      expiresAt: newExpiresAt
    });

    logger.info('Generated new HMAC token for resend:', { id, tokenLength: newHmacToken.length });

    // Update with new token, resend count, sent_at, and new expiry
    await connection.execute(
      `UPDATE USER_INVITATIONS
       SET invitation_token = ?,
           resend_count = resend_count + 1,
           sent_at = NOW(),
           expires_at = ?,
           updated_at = NOW(),
           last_resent_at = NOW()
       WHERE id = ?`,
      [newHmacToken, newExpiresAt, id]
    );

    logger.info('Invitation resent successfully with new token:', id);
    res.json({
      success: true,
      message: 'Invitation resent successfully with new token',
      invitationId: id,
      newExpiresAt: newExpiresAt.toISOString()
    });
  } finally {
    connection.release();
  }
});

// Revoke invitation
export const revokeInvitation = asyncHandler(async (req, res) => {
  const { createLogger } = await import('../src/utils/logger.js');
  const logger = createLogger('api/invitations');

  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    logger.info('Revoking invitation:', id);

    // Get the invitation
    const [invitations] = await connection.execute(
      'SELECT * FROM USER_INVITATIONS WHERE id = ?',
      [id]
    );

    if (invitations.length === 0) {
      throw ResourceError.notFound('Invitation', id);
    }

    const invitation = invitations[0];

    // Check if invitation can be revoked (not accepted)
    if (invitation.status === 'accepted') {
      throw ValidationError.invalidData('Cannot revoke accepted invitation');
    }

    // Update status to revoked
    await connection.execute(
      'UPDATE USER_INVITATIONS SET status = "revoked", updated_at = NOW() WHERE id = ?',
      [id]
    );

    logger.info('Invitation revoked successfully:', id);
    res.json({
      success: true,
      message: 'Invitation revoked successfully',
      invitationId: id
    });
  } finally {
    connection.release();
  }
});

// Helper functions
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateHMACInvitationToken(invitationData) {
  const payload = {
    invitationId: invitationData.id,
    email: invitationData.email,
    type: invitationData.invitationType || 'alumni',
    expiresAt: invitationData.expiresAt ? Math.floor(new Date(invitationData.expiresAt).getTime()) : Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days default
    issuedAt: Date.now()
  };

  return hmacTokenService.generateToken(payload);
}

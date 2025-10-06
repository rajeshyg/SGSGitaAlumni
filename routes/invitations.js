import mysql from 'mysql2/promise';
import { hmacTokenService } from '../src/lib/security/HMACTokenService.js';

// Get database pool - will be passed from main server
let pool = null;

export function setInvitationsPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// INVITATION SYSTEM API ENDPOINTS
// ============================================================================

// Get all invitations with pagination (both regular and family invitations)
export const getAllInvitations = async (req, res) => {
  const { createLogger } = await import('../src/utils/logger.js');
  const logger = createLogger('api/invitations');
  try {
    const { page = 1, pageSize = 50, status } = req.query;

    // Use database
    const connection = await pool.getConnection();

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
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const dataQuery = `
      SELECT
        ui.*,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM USER_INVITATIONS ui
      LEFT JOIN app_users u ON ui.user_id = u.id
      ${whereClause}
      ORDER BY ui.created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${offset}
    `;

    const [rows] = await connection.execute(dataQuery, queryParams);
    logger.info('Rows fetched from DB', { count: rows.length });
    connection.release();

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
      data: invitations,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    });
  } catch (error) {
    const errorDetails = error && error.stack ? error.stack : error;
    logger.error('Error fetching invitations', { error: errorDetails });
    res.status(500).json({ error: 'Failed to fetch invitations', details: errorDetails });
  }
};

// Get family invitations with pagination
export const getFamilyInvitations = async (req, res) => {
  try {
    const { page = 1, pageSize = 50, status } = req.query;

    // Use database
    const connection = await pool.getConnection();

    console.log('API: Fetching family invitations for admin management:', { page, pageSize, status });

    // Build WHERE clause
    let whereClause = '';
    const queryParams = [];

    if (status) {
      whereClause = 'WHERE status = ?';
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM FAMILY_INVITATIONS ${whereClause}`;
    const [countResult] = await connection.execute(countQuery, queryParams);
    const total = countResult[0].total;

    // Get paginated data
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const dataQuery = `
      SELECT * FROM FAMILY_INVITATIONS
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${parseInt(pageSize)} OFFSET ${offset}
    `;

    const [rows] = await connection.execute(dataQuery, queryParams);
    connection.release();

    // Transform data to match expected format
    const invitations = rows.map(row => {
      let childrenProfiles = [];
      try {
        // Handle different formats of children_profiles data
        if (row.children_profiles && row.children_profiles !== '[object Object]' && typeof row.children_profiles === 'string' && row.children_profiles.trim() !== '') {
          if (typeof row.children_profiles === 'string') {
            // Skip if it's clearly malformed
            if (row.children_profiles === '[object Object]' || row.children_profiles.trim() === '') {
              childrenProfiles = [];
            } else {
              // Try to parse as JSON first
              try {
                childrenProfiles = JSON.parse(row.children_profiles);
              } catch (parseError) {
                // If JSON parsing fails, try to fix common formatting issues
                try {
                  const fixedJson = row.children_profiles.replace(/'/g, '"');
                  childrenProfiles = JSON.parse(fixedJson);
                } catch (secondParseError) {
                  // If all parsing attempts fail, log and use empty array
                  console.warn('Failed to parse children_profiles for invitation:', row.id, 'Data:', row.children_profiles.substring(0, 100));
                  childrenProfiles = [];
                }
              }
            }
          } else {
            childrenProfiles = row.children_profiles;
          }
        }
      } catch (error) {
        console.warn('Failed to parse children_profiles for invitation:', row.id, error);
        childrenProfiles = [];
      }

      return {
        id: row.id,
        parentEmail: row.parent_email,
        childrenProfiles: childrenProfiles,
        invitationToken: row.invitation_token,
        status: row.status,
        sentAt: row.sent_at,
        expiresAt: row.expires_at,
        invitedBy: row.invited_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    res.json({
      data: invitations,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / parseInt(pageSize))
    });

  } catch (error) {
    console.error('Error fetching family invitations:', error);
    res.status(500).json({ error: 'Failed to fetch family invitations' });
  }
};

// Create family invitation
export const createFamilyInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { parentEmail, childrenData, invitedBy, expiresInDays = 7 } = req.body;

    // Generate HMAC token for family invitation
    const familyInvitationId = generateUUID();
    const hmacToken = generateHMACInvitationToken({
      id: familyInvitationId,
      email: parentEmail,
      invitationType: 'family_member',
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    });

    // Extract token components for database storage
    const tokenParts = hmacToken.split('.');
    const tokenPayload = tokenParts[0] || '';
    const tokenSignature = tokenParts[1] || '';

    const familyInvitation = {
      id: familyInvitationId,
      parentEmail,
      childrenProfiles: JSON.stringify(childrenData),
      invitationToken: hmacToken, // Store full HMAC token
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
      invitedBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      // HMAC token fields
      tokenPayload: tokenPayload,
      tokenSignature: tokenSignature,
      tokenFormat: 'hmac'
    };

    const query = `
      INSERT INTO FAMILY_INVITATIONS (
        id, parent_email, children_profiles, invitation_token, status,
        sent_at, expires_at, invited_by, created_at, updated_at, token_payload, token_signature, token_format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      familyInvitation.id,
      familyInvitation.parentEmail,
      familyInvitation.childrenProfiles,
      familyInvitation.invitationToken,
      familyInvitation.status,
      familyInvitation.sentAt,
      familyInvitation.expiresAt,
      familyInvitation.invitedBy,
      familyInvitation.createdAt,
      familyInvitation.updatedAt,
      familyInvitation.tokenPayload,
      familyInvitation.tokenSignature,
      familyInvitation.tokenFormat
    ]);

    connection.release();

    res.status(201).json(familyInvitation);
  } catch (error) {
    console.error('Error creating family invitation:', error);
    res.status(500).json({ error: 'Failed to create family invitation' });
  }
};

// Validate family invitation token
export const validateFamilyInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { token } = req.params;

    const query = `
      SELECT * FROM FAMILY_INVITATIONS
      WHERE invitation_token = ? AND status IN ('pending', 'partially_accepted')
      AND expires_at > NOW()
    `;

    const [rows] = await connection.execute(query, [token]);
    connection.release();

    if (rows.length > 0) {
      const row = rows[0];
      const familyInvitation = {
        id: row.id,
        parentEmail: row.parent_email,
        childrenProfiles: JSON.parse(row.children_profiles || '[]'),
        invitationToken: row.invitation_token,
        status: row.status,
        sentAt: row.sent_at,
        expiresAt: row.expires_at,
        invitedBy: row.invited_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      res.json({ familyInvitation });
    } else {
      res.json({ familyInvitation: null });
    }
  } catch (error) {
    console.error('Error validating family invitation:', error);
    res.status(500).json({ error: 'Failed to validate family invitation' });
  }
};

// Accept family invitation profile
export const acceptFamilyInvitationProfile = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { profileId, acceptedBy } = req.body;

    // Get current family invitation
    const [rows] = await connection.execute('SELECT * FROM FAMILY_INVITATIONS WHERE id = ?', [id]);
    if (rows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Family invitation not found' });
    }

    const row = rows[0];
    const childrenProfiles = JSON.parse(row.children_profiles || '[]');

    // Update the specific profile as accepted
    const updatedProfiles = childrenProfiles.map(profile =>
      profile.id === profileId
        ? { ...profile, isAccepted: true, acceptedAt: new Date() }
        : profile
    );

    // Check if all profiles are now accepted
    const allAccepted = updatedProfiles.every(profile => profile.isAccepted);
    const newStatus = allAccepted ? 'completed' : 'partially_accepted';

    // Update the invitation
    await connection.execute(
      'UPDATE FAMILY_INVITATIONS SET children_profiles = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [JSON.stringify(updatedProfiles), newStatus, id]
    );

    connection.release();

    res.json({ success: true, status: newStatus });
  } catch (error) {
    console.error('Error accepting family invitation profile:', error);
    res.status(500).json({ error: 'Failed to accept family invitation profile' });
  }
};

// Create invitation (supports both email and userId based invitations)
export const createInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { email, userId, invitedBy, invitationType, invitationData, expiresAt, expiresInDays } = req.body;

    // Validate that either email or userId is provided
    if (!email && !userId) {
      connection.release();
      return res.status(400).json({ error: 'Either email or userId must be provided' });
    }

    if (email && userId) {
      connection.release();
      return res.status(400).json({ error: 'Cannot provide both email and userId' });
    }

    let targetEmail = email;
    let targetUserId = userId;

    // If userId is provided, get the email from the user record
    if (userId) {
      const [userRows] = await connection.execute(
        'SELECT email FROM app_users WHERE id = ? AND is_active = true',
        [userId]
      );

      if (userRows.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'User not found' });
      }

      targetEmail = userRows[0].email;
      targetUserId = userId;
    }

    // Check if user already exists (for email-based invitations)
    if (email && !userId) {
      const [existingUserRows] = await connection.execute(
        'SELECT id FROM app_users WHERE email = ? AND is_active = true',
        [email]
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
      connection.release();
      return res.status(409).json({ error: 'User already has a pending invitation' });
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
    const tokenParts = hmacToken.split('.');
    const tokenPayload = tokenParts[0] || '';
    const tokenSignature = tokenParts[1] || '';

    const invitation = {
      id: invitationId,
      email: targetEmail,
      userId: targetUserId,
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
      updatedAt: new Date(),
      // HMAC token fields
      tokenPayload: tokenPayload,
      tokenSignature: tokenSignature,
      tokenFormat: 'hmac'
    };

    const query = `
      INSERT INTO USER_INVITATIONS (
        id, email, user_id, invitation_token, invited_by, invitation_type,
        invitation_data, status, sent_at, expires_at, is_used,
        resend_count, created_at, updated_at, token_payload, token_signature, token_format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      invitation.updatedAt,
      invitation.tokenPayload,
      invitation.tokenSignature,
      invitation.tokenFormat
    ]);

    connection.release();

    res.status(201).json(invitation);
  } catch (error) {
    console.error('Error creating invitation:', error);
    res.status(500).json({ error: 'Failed to create invitation' });
  }
};

// Create bulk invitations
export const createBulkInvitations = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { invitations, invitedBy, invitationType, expiresInDays = 7 } = req.body;

    if (!Array.isArray(invitations) || invitations.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'Invitations array is required' });
    }

    if (invitations.length > 50) {
      connection.release();
      return res.status(400).json({ error: 'Maximum 50 invitations allowed per bulk request' });
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
            'SELECT email FROM app_users WHERE id = ? AND is_active = true',
            [userId]
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
        const tokenParts = hmacToken.split('.');
        const tokenPayload = tokenParts[0] || '';
        const tokenSignature = tokenParts[1] || '';

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
          updatedAt: new Date(),
          // HMAC token fields
          tokenPayload: tokenPayload,
          tokenSignature: tokenSignature,
          tokenFormat: 'hmac'
        };

        const insertQuery = `
          INSERT INTO USER_INVITATIONS (
            id, email, user_id, invitation_token, invited_by, invitation_type,
            invitation_data, status, sent_at, expires_at, is_used,
            resend_count, created_at, updated_at, token_payload, token_signature, token_format
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
          invitation.updatedAt,
          invitation.tokenPayload,
          invitation.tokenSignature,
          invitation.tokenFormat
        ]);

        createdInvitations.push(invitation);

      } catch (invitationError) {
        console.error('Error creating individual invitation:', invitationError);
        errors.push({ invitationData, error: invitationError.message });
      }
    }

    connection.release();

    res.status(201).json({
      success: createdInvitations.length,
      errors: errors.length,
      invitations: createdInvitations,
      failedInvitations: errors
    });

  } catch (error) {
    console.error('Error creating bulk invitations:', error);
    res.status(500).json({ error: 'Failed to create bulk invitations' });
  }
};

// Validate invitation token
export const validateInvitation = async (req, res) => {
  // Prevent caching of invitation validation responses
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate, proxy-revalidate, private',
    'Pragma': 'no-cache',
    'Expires': '0',
    'ETag': false,
    'Last-Modified': new Date().toUTCString()
  });

  try {
    const { token } = req.params;
    console.log('VALIDATE_INVITATION: Starting validation for token:', token);
    const connection = await pool.getConnection();

    // First, try to find by exact token match (for backward compatibility)
    let query = `
      SELECT * FROM USER_INVITATIONS
      WHERE invitation_token = ? AND status = 'pending' AND expires_at > NOW() AND is_used = false
    `;

    let [rows] = await connection.execute(query, [token]);

    // If not found and token looks like HMAC format, try HMAC validation
    if (rows.length === 0 && token.includes('.')) {
      try {
        const validation = hmacTokenService.validateToken(token);
        if (validation.isValid && validation.payload) {
          // Find invitation by payload data
          query = `
            SELECT * FROM USER_INVITATIONS
            WHERE id = ? AND email = ? AND status = 'pending' AND expires_at > NOW() AND is_used = false
          `;
          [rows] = await connection.execute(query, [
            validation.payload.invitationId,
            validation.payload.email
          ]);
        }
      } catch (hmacError) {
        console.warn('HMAC token validation failed:', hmacError.message);
      }
    }

    connection.release();

    if (rows.length > 0) {
      const invitation = rows[0];

      // For alumni invitations, fetch alumni data to pre-populate the form
      let alumniData = null;
      if (invitation.invitation_type === 'alumni') {
        try {
          const alumniQuery = `
            SELECT
              id, student_id, first_name, last_name, email, phone,
              batch as graduation_year, result as degree, center_name as program,
              address, created_at, updated_at
            FROM alumni_members
            WHERE email = ? AND email IS NOT NULL AND email != ''
            LIMIT 1
          `;
          const [alumniRows] = await connection.execute(alumniQuery, [invitation.email]);

          if (alumniRows.length > 0) {
            const alumni = alumniRows[0];
            alumniData = {
              id: alumni.id,
              studentId: alumni.student_id,
              firstName: alumni.first_name,
              lastName: alumni.last_name,
              email: alumni.email,
              phone: alumni.phone,
              graduationYear: alumni.graduation_year,
              degree: alumni.degree,
              program: alumni.program,
              address: alumni.address,
              createdAt: alumni.created_at,
              updatedAt: alumni.updated_at
            };
          }
        } catch (alumniError) {
          console.warn('Failed to fetch alumni data for invitation:', invitation.id, alumniError.message);
        }
      }

      const responseData = {
        invitation: {
          id: invitation.id,
          email: invitation.email,
          invitationToken: invitation.invitation_token,
          invitedBy: invitation.invited_by,
          invitationType: invitation.invitation_type,
          invitationData: (() => {
            try {
              return JSON.parse(invitation.invitation_data || '{}');
            } catch (error) {
              return {};
            }
          })(),
          status: invitation.status,
          sentAt: invitation.sent_at,
          expiresAt: invitation.expires_at,
          isUsed: invitation.is_used,
          resendCount: invitation.resend_count,
          createdAt: invitation.created_at,
          updatedAt: invitation.updated_at
        },
        alumniData: alumniData
      };
      console.log('VALIDATE_INVITATION: Sending response:', JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } else {
      res.json({ invitation: null });
    }
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({ error: 'Failed to validate invitation' });
  }
};

// Update invitation status
export const updateInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
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
      connection.release();
      return res.status(400).json({ error: 'No valid fields to update' });
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
      connection.release();
      return res.status(404).json({ error: 'Invitation not found' });
    }

    // Get updated invitation
    const [rows] = await connection.execute('SELECT * FROM USER_INVITATIONS WHERE id = ?', [id]);
    connection.release();

    const invitation = rows[0];
    res.json({
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
    });

  } catch (error) {
    console.error('Error updating invitation:', error);
    res.status(500).json({ error: 'Failed to update invitation' });
  }
};

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
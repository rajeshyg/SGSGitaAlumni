import mysql from 'mysql2/promise';

// Get database pool - will be passed from main server
let pool = null;

export function setUsersPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// USER MANAGEMENT API ENDPOINTS
// ============================================================================

// Update user attributes
export const updateUser = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic update query for users table
    const userUpdateFields = [];
    const userUpdateValues = [];

    // Editable user fields
    const editableUserFields = [
      'first_name', 'last_name', 'email', 'birth_date', 'graduation_year',
      'program', 'current_position', 'bio', 'linkedin_url', 'company',
      'location', 'age_verified', 'parent_consent_required', 'parent_consent_given',
      'requires_otp'
    ];

    editableUserFields.forEach(field => {
      if (updates[field] !== undefined) {
        userUpdateFields.push(`${field} = ?`);
        userUpdateValues.push(updates[field]);
      }
    });

    // Update user record if there are changes
    if (userUpdateFields.length > 0) {
      userUpdateFields.push('updated_at = NOW()');

      const userQuery = `
        UPDATE app_users
        SET ${userUpdateFields.join(', ')}
        WHERE id = ?
      `;

      userUpdateValues.push(id);
      await connection.execute(userQuery, userUpdateValues);
    }

    // Update alumni_profiles if profile data is provided
    if (updates.alumniProfile) {
      const profileUpdates = updates.alumniProfile;
      const profileUpdateFields = [];
      const profileUpdateValues = [];

      const editableProfileFields = [
        'family_name', 'father_name', 'batch', 'center_name', 'result',
        'category', 'phone', 'email', 'student_id'
      ];

      editableProfileFields.forEach(field => {
        if (profileUpdates[field] !== undefined) {
          profileUpdateFields.push(`${field} = ?`);
          profileUpdateValues.push(profileUpdates[field]);
        }
      });

      if (profileUpdateFields.length > 0) {
        profileUpdateFields.push('updated_at = NOW()');

        const profileQuery = `
          UPDATE alumni_members
          SET ${profileUpdateFields.join(', ')}
          WHERE id = ?
        `;

        profileUpdateValues.push(id);
        await connection.execute(profileQuery, profileUpdateValues);
      }
    }

    // Get updated user data
    const [userRows] = await connection.execute(`
      SELECT
        u.*,
        am.family_name, am.father_name, am.batch, am.center_name,
        am.result, am.category, am.phone as alumni_phone, am.email as alumni_email,
        am.student_id
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = ? AND u.is_active = true
    `, [id]);

    connection.release();

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    const userResponse = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      birthDate: user.birth_date,
      graduationYear: user.graduation_year,
      program: user.program,
      currentPosition: user.current_position,
      bio: user.bio,
      linkedinUrl: user.linkedin_url,
      company: user.company,
      location: user.location,
      ageVerified: user.age_verified,
      parentConsentRequired: user.parent_consent_required,
      parentConsentGiven: user.parent_consent_given,
      requiresOtp: user.requires_otp,
      alumniProfile: {
        familyName: user.family_name,
        fatherName: user.father_name,
        batch: user.batch,
        centerName: user.center_name,
        result: user.result,
        category: user.category,
        phone: user.alumni_phone,
        email: user.alumni_email,
        studentId: user.student_id
      },
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };

    res.json({ user: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Send invitation to user
export const sendInvitationToUser = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { invitationType = 'profile_completion', expiresInDays = 7 } = req.body;
    const invitedBy = req.user.id;

    // Get user details
    const [userRows] = await connection.execute(
      'SELECT email, first_name, last_name FROM app_users WHERE id = ? AND is_active = true',
      [id]
    );

    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Check for existing pending invitation
    const [existingRows] = await connection.execute(
      'SELECT id FROM USER_INVITATIONS WHERE user_id = ? AND status = "pending"',
      [id]
    );

    if (existingRows.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'User already has a pending invitation' });
    }

    // Generate HMAC token
    const invitationId = generateUUID();
    const hmacToken = generateHMACInvitationToken({
      id: invitationId,
      email: user.email,
      invitationType,
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    });

    // Extract token components for database storage
    const tokenParts = hmacToken.split('.');
    const tokenPayload = tokenParts[0] || '';
    const tokenSignature = tokenParts[1] || '';

    // Create invitation
    const invitation = {
      id: invitationId,
      email: user.email,
      userId: id,
      invitationToken: hmacToken, // Store full HMAC token
      invitedBy,
      invitationType,
      invitationData: JSON.stringify({
        firstName: user.first_name,
        lastName: user.last_name,
        invitationType
      }),
      status: 'pending',
      sentAt: new Date(),
      expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000),
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

    connection.release();

    res.status(201).json({
      invitation,
      message: `Invitation sent to ${user.first_name} ${user.last_name} (${user.email})`
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  }
};

// ============================================================================
// USER SEARCH & PROFILE API ENDPOINTS
// ============================================================================

// Search users for invitations
export const searchUsers = async (req, res) => {
  console.log('🚀 API: Users search endpoint called');

  try {
    const { q = '', limit = 50 } = req.query;

    // Use database
    console.log('🔍 API: Getting database connection...');
    const connection = await pool.getConnection();
    console.log('🔗 API: Database connection obtained successfully');

    console.log('📋 API: Request parameters - q:', q, 'limit:', limit);

    // Test basic database connectivity
    console.log('🧪 API: Testing database connectivity...');
    const [testRows] = await connection.execute('SELECT 1 as test_value');
    console.log('✅ API: Database test query result:', testRows);

    // Test if app_users table exists and is accessible
    console.log('📊 API: Testing app_users table access...');
    const [tableTest] = await connection.execute('SELECT COUNT(*) as count FROM app_users LIMIT 1');
    console.log('📈 API: App users table test result:', tableTest);

    // Build search query - only use app_users table
    let whereClause = 'WHERE u.is_active = true';
    const queryParams = [];

    if (q && q.trim()) {
      whereClause += ' AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)';
      const trimmedQ = q.trim();
      queryParams.push(`%${trimmedQ}%`, `%${trimmedQ}%`, `%${trimmedQ}%`);
      console.log('🔎 API: Search query added for:', trimmedQ);
    }

    const searchQuery = `
      SELECT
        u.id,
        COALESCE(u.first_name, 'Unknown') as firstName,
        COALESCE(u.last_name, 'Unknown') as lastName,
        u.email,
        u.status,
        u.email_verified,
        u.current_position,
        u.company,
        u.location,
        u.created_at,
        CASE WHEN (u.first_name IS NOT NULL AND u.last_name IS NOT NULL) THEN 1 ELSE 0 END as isProfileComplete
      FROM app_users u
      ${whereClause}
      ORDER BY COALESCE(u.last_name, 'Unknown'), COALESCE(u.first_name, 'Unknown')
      LIMIT ${parseInt(limit)}
    `;

    console.log('⚡ API: Final search query:', searchQuery);
    console.log('🎯 API: Query parameters:', queryParams);

    const [rows] = await connection.execute(searchQuery, queryParams);
    console.log('🎉 API: Search query executed successfully, found', rows.length, 'rows');

    // Transform results to match expected interface
    const users = rows.map(row => ({
      id: row.id,
      firstName: row.firstName || 'Unknown',
      lastName: row.lastName || 'Unknown',
      email: row.email,
      status: row.status,
      emailVerified: !!row.email_verified,
      graduationYear: row.graduation_year,
      program: row.program,
      currentPosition: row.current_position,
      company: row.company,
      location: row.location,
      profileImageUrl: null, // Not available in current schema
      isProfileComplete: !!row.isProfileComplete,
      ageVerified: false, // Not available in current schema
      parentConsentRequired: false, // Not available in current schema
      createdAt: row.created_at
    }));

    console.log('✨ API: Successfully transformed', users.length, 'users');
    const response = {
      users,
      total: users.length,
      query: q,
      limit: parseInt(limit)
    };

    console.log('📤 API: Sending response with', users.length, 'users');
    res.json(response);

  } catch (error) {
    console.error('💥 API: Detailed error in users search:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({
      error: 'Failed to search users',
      details: error.message,
      code: error.code
    });
  }
};

// Get user profile details for invitation
export const getUserProfile = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;

    console.log('[API] Fetching user profile for ID:', id);

    const query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.status,
        u.is_active,
        u.birth_date,
        u.phone,
        u.profile_image_url,
        u.bio,
        u.linkedin_url,
        u.current_position,
        u.company,
        u.location,
        u.email_verified,
        u.email_verified_at,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        am.family_name,
        am.father_name,
        am.batch as graduation_year,
        am.center_name as program,
        am.result as alumni_position,
        am.category as alumni_category,
        am.phone as alumni_phone,
        am.email as alumni_email,
        am.student_id,
        am.status as alumni_status
      FROM app_users u
      LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
      WHERE u.id = ? AND u.is_active = true
    `;

    const [rows] = await connection.execute(query, [id]);
    connection.release();

    console.log('[API] Query result rows:', rows.length);
    if (rows.length > 0) {
      console.log('[API] User data found:', { id: rows[0].id, email: rows[0].email, is_active: rows[0].is_active });
    }

    if (rows.length === 0) {
      console.log('[API] No user found for ID:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    const row = rows[0];

    // Build comprehensive user profile with proper fallbacks
    const userProfile = {
      id: row.id,
      firstName: row.first_name || row.father_name || 'Unknown',
      lastName: row.last_name || row.family_name || 'Unknown',
      email: row.email,
      role: row.role,
      status: row.status,
      birthDate: row.birth_date,
      phone: row.phone || row.alumni_phone,
      profileImageUrl: row.profile_image_url,
      bio: row.bio,
      linkedinUrl: row.linkedin_url,
      currentPosition: row.current_position || row.alumni_position,
      company: row.company || row.alumni_category,
      location: row.location || row.program,
      graduationYear: row.graduation_year,
      program: row.program,
      emailVerified: !!row.email_verified,
      emailVerifiedAt: row.email_verified_at,
      lastLoginAt: row.last_login_at,
      isProfileComplete: !!(row.first_name && row.last_name) || !!(row.father_name && row.family_name),
      ageVerified: false, // TODO: Add to schema if needed
      parentConsentRequired: false, // TODO: Add to schema if needed
      parentConsentGiven: false, // TODO: Add to schema if needed
      alumniProfile: row.alumni_member_id ? {
        familyName: row.family_name,
        fatherName: row.father_name,
        batch: row.graduation_year,
        centerName: row.program,
        result: row.alumni_position,
        category: row.alumni_category,
        phone: row.alumni_phone,
        email: row.alumni_email,
        studentId: row.student_id,
        status: row.alumni_status
      } : null,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json({ user: userProfile });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
};

// Get current user profile (basic User object for AuthContext)
export const getCurrentUserProfile = async (req, res) => {
  try {
    // Use database
    const connection = await pool.getConnection();
    const userId = req.user.id;

    // Get basic user info (same format as login response)
    const query = `
      SELECT
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.role,
        u.is_active,
        u.created_at,
        u.last_login_at
      FROM app_users u
      WHERE u.id = ? AND u.is_active = true
    `;

    const [rows] = await connection.execute(query, [userId]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = rows[0];

    // Return basic User object matching AuthContext expectations
    const user = {
      id: row.id,
      email: row.email,
      firstName: row.first_name || 'Unknown',
      lastName: row.last_name || 'Unknown',
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at
    };

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

// Helper functions (will be moved to utils)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function generateHMACInvitationToken(invitationData) {
  // Import here to avoid circular dependency
  const { hmacTokenService } = require('../src/lib/security/HMACTokenService.js');
  const payload = {
    invitationId: invitationData.id,
    email: invitationData.email,
    type: invitationData.invitationType || 'alumni',
    expiresAt: invitationData.expiresAt ? Math.floor(new Date(invitationData.expiresAt).getTime()) : Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days default
    issuedAt: Date.now()
  };

  return hmacTokenService.generateToken(payload);
}
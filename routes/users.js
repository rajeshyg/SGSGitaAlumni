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
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const updates = req.body;

    // Transform camelCase to snake_case for database compatibility
    const camelToSnake = (str) => str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    
    // Normalize updates to snake_case
    const normalizedUpdates = {};
    Object.keys(updates).forEach(key => {
      const snakeKey = camelToSnake(key);
      normalizedUpdates[snakeKey] = updates[key];
    });

    // Build dynamic update query for accounts/alumni_members tables
    // MIGRATED: app_users → accounts + alumni_members via user_profiles
    const accountUpdateFields = [];
    const accountUpdateValues = [];
    const alumniUpdateFields = [];
    const alumniUpdateValues = [];

    // Account editable fields (stored in accounts table)
    const editableAccountFields = [
      'email'
    ];

    // Alumni editable fields (stored in alumni_members via user_profiles)
    const editableAlumniFields = [
      'first_name', 'last_name', 'year_of_birth', 'batch', 'center_name',
      'current_center', 'profile_image_url', 'phone'
    ];

    editableAccountFields.forEach(field => {
      if (normalizedUpdates[field] !== undefined) {
        accountUpdateFields.push(`${field} = ?`);
        accountUpdateValues.push(normalizedUpdates[field]);
      }
    });

    editableAlumniFields.forEach(field => {
      if (normalizedUpdates[field] !== undefined) {
        alumniUpdateFields.push(`${field} = ?`);
        alumniUpdateValues.push(normalizedUpdates[field]);
      }
    });

    // Get the alumni_member_id through user_profiles for this account
    const [profileRows] = await connection.execute(`
      SELECT up.alumni_member_id 
      FROM user_profiles up 
      WHERE up.account_id = ? AND up.relationship = 'parent'
      LIMIT 1
    `, [id]);

    const alumniMemberId = profileRows.length > 0 ? profileRows[0].alumni_member_id : null;

    // Update account record if there are changes
    if (accountUpdateFields.length > 0) {
      accountUpdateFields.push('updated_at = NOW()');

      const accountQuery = `
        UPDATE accounts
        SET ${accountUpdateFields.join(', ')}
        WHERE id = ?
      `;

      accountUpdateValues.push(id);
      await connection.execute(accountQuery, accountUpdateValues);
    }

    // Update alumni_members if there are alumni field changes and we have an alumni_member_id
    if (alumniUpdateFields.length > 0 && alumniMemberId) {
      alumniUpdateFields.push('updated_at = NOW()');

      const alumniQuery = `
        UPDATE alumni_members
        SET ${alumniUpdateFields.join(', ')}
        WHERE id = ?
      `;

      alumniUpdateValues.push(alumniMemberId);
      await connection.execute(alumniQuery, alumniUpdateValues);
    }

    // Update alumni_profiles if profile data is provided
    if (updates.alumniProfile || normalizedUpdates.alumni_profile) {
      const profileUpdates = updates.alumniProfile || normalizedUpdates.alumni_profile;
      const profileUpdateFields = [];
      const profileUpdateValues = [];
      
      // Normalize profile updates to snake_case
      const normalizedProfileUpdates = {};
      Object.keys(profileUpdates).forEach(key => {
        const snakeKey = camelToSnake(key);
        normalizedProfileUpdates[snakeKey] = profileUpdates[key];
      });

      const editableProfileFields = [
        'family_name', 'father_name', 'batch', 'center_name', 'result',
        'category', 'phone', 'email', 'student_id'
      ];

      editableProfileFields.forEach(field => {
        if (normalizedProfileUpdates[field] !== undefined) {
          profileUpdateFields.push(`${field} = ?`);
          profileUpdateValues.push(normalizedProfileUpdates[field]);
        }
      });

      if (profileUpdateFields.length > 0 && alumniMemberId) {
        profileUpdateFields.push('updated_at = NOW()');

        const profileQuery = `
          UPDATE alumni_members
          SET ${profileUpdateFields.join(', ')}
          WHERE id = ?
        `;

        profileUpdateValues.push(alumniMemberId);
        await connection.execute(profileQuery, profileUpdateValues);
      }
    }

    // Get updated user data - MIGRATED: app_users → accounts + user_profiles
    const [userRows] = await connection.execute(`
      SELECT
        a.id,
        a.email,
        a.status,
        a.role,
        a.created_at,
        a.updated_at,
        am.first_name,
        am.last_name,
        am.year_of_birth,
        am.batch,
        am.center_name,
        NULL as current_position,
        NULL as company,
        NULL as location,
        am.bio,
        am.linkedin_url,
        am.profile_image_url,
        am.family_name, 
        am.father_name,
        am.result, 
        am.category, 
        am.phone as alumni_phone, 
        am.email as alumni_email,
        am.student_id,
        up.access_level,
        up.requires_consent,
        up.parent_consent_given
      FROM accounts a
      LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      WHERE a.id = ? AND a.status = 'active'
    `, [id]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];
    // MIGRATED: Updated response to match new schema (no birth_date, using year_of_birth)
    const userResponse = {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      yearOfBirth: user.year_of_birth,
      graduationYear: user.batch,
      program: user.center_name,
      currentPosition: user.current_position,
      bio: user.bio,
      linkedinUrl: user.linkedin_url,
      company: user.company,
      location: user.location,
      profileImageUrl: user.profile_image_url,
      accessLevel: user.access_level,
      parentConsentRequired: user.requires_consent,
      parentConsentGiven: user.parent_consent_given,
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
  } finally {
    connection.release();
  }
};

// Send invitation to user
export const sendInvitationToUser = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { invitationType = 'profile_completion', expiresInDays = 7 } = req.body;
    const invitedBy = req.user.id;

    // Get user details - MIGRATED: app_users → accounts + user_profiles
    const [userRows] = await connection.execute(
      `SELECT a.email, am.first_name, am.last_name 
       FROM accounts a 
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE a.id = ? AND a.status = 'active'`,
      [id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Check for existing pending invitation
    const [existingRows] = await connection.execute(
      'SELECT id FROM USER_INVITATIONS WHERE user_id = ? AND status = "pending"',
      [id]
    );

    if (existingRows.length > 0) {
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

    res.status(201).json({
      invitation,
      message: `Invitation sent to ${user.first_name} ${user.last_name} (${user.email})`
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ error: 'Failed to send invitation' });
  } finally {
    connection.release();
  }
};

// ============================================================================
// USER SEARCH & PROFILE API ENDPOINTS
// ============================================================================

// Search users for invitations
export const searchUsers = async (req, res) => {
  console.log('🚀 API: Users search endpoint called');

  const connection = await pool.getConnection();
  try {
    const { q = '', limit = 50 } = req.query;

    // Use database
    console.log('🔍 API: Getting database connection...');
    console.log('🔗 API: Database connection obtained successfully');

    console.log('📋 API: Request parameters - q:', q, 'limit:', limit);

    // Test basic database connectivity
    console.log('🧪 API: Testing database connectivity...');
    const [testRows] = await connection.execute('SELECT 1 as test_value');
    console.log('✅ API: Database test query result:', testRows);

    // Test if accounts table exists and is accessible - MIGRATED: app_users → accounts
    console.log('📊 API: Testing accounts table access...');
    const [tableTest] = await connection.execute('SELECT COUNT(*) as count FROM accounts LIMIT 1');
    console.log('📈 API: Accounts table test result:', tableTest);

    // Build search query - MIGRATED: app_users → accounts + user_profiles + alumni_members
    let whereClause = "WHERE a.status = 'active'";
    const queryParams = [];

    if (q && q.trim()) {
      whereClause += ' AND (am.first_name LIKE ? OR am.last_name LIKE ? OR a.email LIKE ?)';
      const trimmedQ = q.trim();
      queryParams.push(`%${trimmedQ}%`, `%${trimmedQ}%`, `%${trimmedQ}%`);
      console.log('🔎 API: Search query added for:', trimmedQ);
    }

    const limitNum = parseInt(limit) || 50;
    // CRITICAL FIX: Return user_profile.id (profile ID) as the primary ID for chat
    // Conversations happen between user profiles, not accounts (accounts are shared by family)
    const searchQuery = `
      SELECT
        up.id as profile_id,
        a.id as account_id,
        COALESCE(am.first_name, 'Unknown') as firstName,
        COALESCE(am.last_name, 'Unknown') as lastName,
        a.email,
        a.status,
        up.display_name,
        up.relationship,
        NULL as current_position,
        NULL as company,
        NULL as location,
        a.created_at,
        CASE WHEN (am.first_name IS NOT NULL AND am.last_name IS NOT NULL) THEN 1 ELSE 0 END as isProfileComplete
      FROM user_profiles up
      INNER JOIN accounts a ON up.account_id = a.id
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      ${whereClause}
      AND up.status = 'active'
      ORDER BY COALESCE(am.last_name, 'Unknown'), COALESCE(am.first_name, 'Unknown')
      LIMIT ${limitNum}
    `;

    console.log('⚡ API: Final search query:', searchQuery);
    console.log('🎯 API: Query parameters:', queryParams);

    const [rows] = await connection.execute(searchQuery, queryParams);
    console.log('🎉 API: Search query executed successfully, found', rows.length, 'rows');

    // Transform results to match expected interface
    // CRITICAL: Use profile_id as the primary ID for chat functionality
    const users = rows.map(row => ({
      id: row.profile_id,  // Use profile ID as primary ID for chat
      accountId: row.account_id,  // Keep account ID for reference
      firstName: row.firstName || 'Unknown',
      lastName: row.lastName || 'Unknown',
      displayName: row.display_name,
      relationship: row.relationship,
      email: row.email,
      status: row.status,
      emailVerified: !!row.email_verified,
      graduationYear: row.graduation_year,
      program: row.program,
      currentPosition: row.current_position, // NULL until profile fields are added
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
  } finally {
    connection.release();
  }
};

// Get user profile details for invitation - MIGRATED: app_users → accounts + user_profiles
export const getUserProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;

    console.log('[API] Fetching user profile for ID:', id);

    const query = `
      SELECT
        a.id,
        a.email,
        a.role,
        a.status,
        a.last_login_at,
        a.created_at,
        a.updated_at,
        am.first_name,
        am.last_name,
        am.year_of_birth,
        am.phone,
        am.profile_image_url,
        am.bio,
        am.linkedin_url,
        NULL as current_position,
        NULL as company,
        NULL as location,
        am.family_name,
        am.father_name,
        am.batch as graduation_year,
        am.center_name as program,
        am.result as alumni_position,
        am.category as alumni_category,
        am.phone as alumni_phone,
        am.email as alumni_email,
        am.student_id,
        am.status as alumni_status,
        up.access_level,
        up.requires_consent,
        up.parent_consent_given
      FROM accounts a
      LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      WHERE a.id = ? AND a.status = 'active'
    `;

    const [rows] = await connection.execute(query, [id]);

    console.log('[API] Query result rows:', rows.length);
    if (rows.length > 0) {
      console.log('[API] User data found:', { id: rows[0].id, email: rows[0].email, status: rows[0].status });
    }

    if (rows.length === 0) {
      console.log('[API] No user found for ID:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    const row = rows[0];

    // Build comprehensive user profile with proper fallbacks - MIGRATED: no birth_date
    const userProfile = {
      id: row.id,
      firstName: row.first_name || row.father_name || 'Unknown',
      lastName: row.last_name || row.family_name || 'Unknown',
      email: row.email,
      role: row.role,
      status: row.status,
      yearOfBirth: row.year_of_birth,
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
  } finally {
    connection.release();
  }
};

// Get current user profile (basic User object for AuthContext)
// MIGRATED: app_users → accounts + user_profiles
export const getCurrentUserProfile = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    // Use the active profile from the session (populated by auth middleware from JWT)
    // Fallback to parent profile logic only if no active profile is set (shouldn't happen with valid tokens)
    const activeProfileId = req.session?.activeProfileId;

    // Get basic user info via accounts + user_profiles
    // JOIN on the specific active profile ID
    const query = `
      SELECT
        a.id,
        a.email,
        a.role,
        a.status,
        a.created_at,
        a.last_login_at,
        am.first_name,
        am.last_name,
        am.profile_image_url,
        am.year_of_birth,
        up.id as profile_id,
        up.relationship,
        up.access_level
      FROM accounts a
      LEFT JOIN user_profiles up ON up.id = ? AND up.account_id = a.id
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      WHERE a.id = ? AND a.status = 'active'
    `;

    // If for some reason activeProfileId is missing, we might need a fallback query, 
    // but middleware guarantees activeProfileId is set if profiles exist.
    // If it's null/undefined, the LEFT JOIN will just return nulls for profile fields, which is handled.
    const [rows] = await connection.execute(query, [activeProfileId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const row = rows[0];

    // Return User object matching AuthContext expectations
    // MIGRATED: No more is_family_account/primary_family_member_id, using user_profiles + accounts
    const user = {
      id: row.id,
      email: row.email,
      firstName: row.first_name || 'Unknown',
      lastName: row.last_name || 'Unknown',
      role: row.role,
      isActive: row.status === 'active',
      createdAt: row.created_at,
      lastLoginAt: row.last_login_at,
      profileImageUrl: row.profile_image_url,
      // New schema fields
      activeProfileId: row.profile_id,
      relationship: row.relationship,
      accessLevel: row.access_level,
      yearOfBirth: row.year_of_birth,
      // Add profileId alias for frontend compatibility
      profileId: row.profile_id
    };

    res.json(user);
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  } finally {
    connection.release();
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
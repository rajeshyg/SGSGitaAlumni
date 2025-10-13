import mysql from 'mysql2/promise';

// Get database pool - will be passed from main server
let pool = null;

export function setAlumniPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// ALUMNI MEMBERS API ENDPOINTS (Source Data Management)
// ============================================================================

// Search alumni members (MUST come before the :id route to avoid matching "search" as an ID)
export const searchAlumniMembers = async (req, res) => {
  try {
    const { q = '', limit = 50 } = req.query;

    // Use database
    const connection = await pool.getConnection();

    console.log('API: Searching alumni members:', q);

    const limitNum = parseInt(limit) || 50;
    const searchQuery = `
      SELECT
        am.id, am.student_id, am.first_name, am.last_name, am.email, am.phone,
        am.batch as graduation_year, am.result as degree, am.center_name as department,
        ot.otp_code as otp_code, ot.expires_at as otp_expires_at
      FROM alumni_members am
      LEFT JOIN app_users au ON au.alumni_member_id = am.id
      LEFT JOIN OTP_TOKENS ot ON ot.user_id = au.id AND ot.is_used = false AND ot.expires_at > NOW()
      WHERE am.first_name LIKE ? OR am.last_name LIKE ? OR am.email LIKE ? OR am.student_id LIKE ?
      ORDER BY am.last_name, am.first_name
      LIMIT ${limitNum}
    `;

    const searchTerm = `%${q}%`;
    const [rows] = await connection.execute(searchQuery, [searchTerm, searchTerm, searchTerm, searchTerm]);
    connection.release();

    const members = rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      graduationYear: row.graduation_year,
      degree: row.degree,
      department: row.department,
      otpCode: row.otp_code,
      otpExpiresAt: row.otp_expires_at
    }));

    res.json(members);

  } catch (error) {
    console.error('Error searching alumni members:', error);
    res.status(500).json({ error: 'Failed to search alumni members' });
  }
};

// Get alumni directory with pagination and filters
export const getAlumniDirectory = async (req, res) => {
  try {
    // Parse query parameters
    const {
      q = '',                           // Search query
      page = 1,                         // Page number
      perPage = 20,                     // Items per page
      graduationYear,                   // Specific year filter
      graduationYearMin,                // Year range min
      graduationYearMax,                // Year range max
      department,                       // Department filter
      sortBy = 'name',                  // Sort field
      sortOrder = 'asc'                 // Sort direction
    } = req.query;

    // Validate and sanitize inputs
    const pageNum = Math.max(1, parseInt(page) || 1);
    const perPageNum = Math.min(100, Math.max(1, parseInt(perPage) || 20));
    const offset = (pageNum - 1) * perPageNum;

    // Get database connection
    const connection = await pool.getConnection();

    console.log('API: Fetching alumni directory:', { q, page: pageNum, perPage: perPageNum, graduationYear, department });

    // Build WHERE clause
    const whereClauses = [];
    const queryParams = [];

    // Search query (name or email)
    if (q && q.trim()) {
      whereClauses.push('(am.first_name LIKE ? OR am.last_name LIKE ? OR am.email LIKE ?)');
      const searchTerm = `%${q.trim()}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm);
    }

    // Graduation year filters
    if (graduationYear) {
      whereClauses.push('am.batch = ?');
      queryParams.push(parseInt(graduationYear));
    } else {
      if (graduationYearMin) {
        whereClauses.push('am.batch >= ?');
        queryParams.push(parseInt(graduationYearMin));
      }
      if (graduationYearMax) {
        whereClauses.push('am.batch <= ?');
        queryParams.push(parseInt(graduationYearMax));
      }
    }

    // Department filter
    if (department && department.trim()) {
      whereClauses.push('am.center_name = ?');
      queryParams.push(department.trim());
    }

    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // Build ORDER BY clause
    let orderByClause = '';
    switch (sortBy) {
      case 'graduationYear':
        orderByClause = `ORDER BY am.batch ${sortOrder === 'desc' ? 'DESC' : 'ASC'}, am.last_name ASC, am.first_name ASC`;
        break;
      case 'recent':
        orderByClause = `ORDER BY am.created_at ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        break;
      case 'name':
      default:
        orderByClause = `ORDER BY am.last_name ${sortOrder === 'desc' ? 'DESC' : 'ASC'}, am.first_name ${sortOrder === 'desc' ? 'DESC' : 'ASC'}`;
        break;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM alumni_members am
      ${whereClause}
    `;
    const [countRows] = await connection.execute(countQuery, queryParams);
    const total = countRows[0].total;

    // Get paginated data
    const dataQuery = `
      SELECT
        am.id,
        am.student_id,
        am.first_name,
        am.last_name,
        am.email,
        am.phone,
        am.batch as graduation_year,
        am.result as degree,
        am.center_name as department,
        am.created_at,
        am.updated_at
      FROM alumni_members am
      ${whereClause}
      ${orderByClause}
      LIMIT ${perPageNum} OFFSET ${offset}
    `;
    const [dataRows] = await connection.execute(dataQuery, queryParams);

    // Get filter options (available years and departments)
    const [yearRows] = await connection.execute(`
      SELECT DISTINCT batch as year
      FROM alumni_members
      WHERE batch IS NOT NULL
      ORDER BY batch DESC
    `);

    const [deptRows] = await connection.execute(`
      SELECT DISTINCT center_name as department
      FROM alumni_members
      WHERE center_name IS NOT NULL AND center_name != ''
      ORDER BY center_name ASC
    `);

    connection.release();

    // Transform data
    const data = dataRows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      firstName: row.first_name,
      lastName: row.last_name,
      displayName: `${row.first_name} ${row.last_name}`.trim(),
      email: row.email,
      phone: row.phone || null,
      graduationYear: row.graduation_year,
      degree: row.degree,
      department: row.department,
      location: null, // Address column not available in current schema
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / perPageNum);
    const pagination = {
      page: pageNum,
      perPage: perPageNum,
      total,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    };

    // Build filter options
    const filters = {
      graduationYears: yearRows.map(row => row.year),
      departments: deptRows.map(row => row.department)
    };

    // Send response
    res.json({
      success: true,
      data,
      pagination,
      filters
    });

  } catch (error) {
    console.error('Error fetching alumni directory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch alumni directory',
      message: error.message
    });
  }
};

// Helper function to extract location from address
function extractLocation(address) {
  if (!address) return null;

  // Simple extraction: get last part after comma (usually city/state)
  const parts = address.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts[parts.length - 1]; // Return last part (state/country)
  }
  return address.substring(0, 50); // Return first 50 chars if no comma
}

// Get alumni member by ID
export const getAlumniMember = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;

    console.log('API: Fetching alumni member source data:', id);

    const query = `
      SELECT
        id, student_id, first_name, last_name, email, phone,
        batch as graduation_year, result as degree, center_name as department, address,
        created_at, updated_at
      FROM alumni_members
      WHERE id = ?
    `;

    const [rows] = await connection.execute(query, [id]);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Alumni member not found' });
    }

    const member = rows[0];
    res.json({
      id: member.id,
      studentId: member.student_id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      graduationYear: member.graduation_year,
      degree: member.degree,
      department: member.department,
      address: member.address,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    });

  } catch (error) {
    console.error('Error fetching alumni member:', error);
    res.status(500).json({ error: 'Failed to fetch alumni member' });
  }
};

// Update alumni member contact information
export const updateAlumniMember = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const updates = req.body;

    console.log('API: Updating alumni member contact info:', id);

    // Build dynamic update query
    const updateFields = [];
    const updateValues = [];

    const editableFields = ['first_name', 'last_name', 'email', 'phone', 'address'];

    editableFields.forEach(field => {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    });

    if (updateFields.length === 0) {
      connection.release();
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    const query = `
      UPDATE alumni_members
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    const [result] = await connection.execute(query, updateValues);

    if (result.affectedRows === 0) {
      connection.release();
      return res.status(404).json({ error: 'Alumni member not found' });
    }

    // Get updated member
    const [updatedRows] = await connection.execute(
      'SELECT id, student_id, first_name, last_name, email, phone, batch as graduation_year, result as degree, center_name as department, address, created_at, updated_at FROM alumni_members WHERE id = ?',
      [id]
    );
    connection.release();

    const member = updatedRows[0];
    res.json({
      id: member.id,
      studentId: member.student_id,
      firstName: member.first_name,
      lastName: member.last_name,
      email: member.email,
      phone: member.phone,
      graduationYear: member.graduation_year,
      degree: member.degree,
      department: member.department,
      address: member.address,
      createdAt: member.created_at,
      updatedAt: member.updated_at
    });

  } catch (error) {
    console.error('Error updating alumni member:', error);
    res.status(500).json({ error: 'Failed to update alumni member' });
  }
};

// Send invitation to alumni member
export const sendInvitationToAlumni = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { id } = req.params;
    const { invitationType = 'alumni', expiresInDays = 7 } = req.body;
    const invitedBy = req.user?.id || 'system'; // Use authenticated user or system

    console.log('API: Sending invitation to alumni member:', id);

    // Get alumni member details
    const [memberRows] = await connection.execute(
      'SELECT first_name, last_name, email FROM alumni_members WHERE id = ?',
      [id]
    );

    if (memberRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Alumni member not found' });
    }

    const member = memberRows[0];

    // Check if email exists
    if (!member.email) {
      connection.release();
      return res.status(400).json({ error: 'Alumni member has no email address' });
    }

    // Check for existing pending invitation
    const [existingRows] = await connection.execute(
      'SELECT id FROM USER_INVITATIONS WHERE email = ? AND status = "pending"',
      [member.email]
    );

    if (existingRows.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Alumni member already has a pending invitation' });
    }

    // Generate HMAC token
    const invitationId = generateUUID();
    const hmacToken = generateHMACInvitationToken({
      id: invitationId,
      email: member.email,
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
      email: member.email,
      invitationToken: hmacToken, // Store full HMAC token
      invitedBy,
      invitationType,
      invitationData: JSON.stringify({
        alumniMemberId: id,
        firstName: member.first_name,
        lastName: member.last_name,
        invitationType
      }).replace(/'/g, '"'), // Fix single quotes to double quotes
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
        id, email, invitation_token, invited_by, invitation_type,
        invitation_data, status, sent_at, expires_at, is_used,
        resend_count, created_at, updated_at, token_payload, token_signature, token_format
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(insertQuery, [
      invitation.id,
      invitation.email,
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

    res.status(201).json({
      invitation,
      message: `Invitation sent to ${member.first_name} ${member.last_name} (${member.email})`
    });

  } catch (error) {
    console.error('Error sending invitation to alumni member:', error);
    res.status(500).json({ error: 'Failed to send invitation to alumni member' });
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
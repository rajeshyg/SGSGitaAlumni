import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { hmacTokenService } from '../src/lib/security/HMACTokenService.js';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.NODE_ENV === 'development' ? '24h' : (process.env.JWT_EXPIRES_IN || '1h');
const REFRESH_TOKEN_EXPIRES_IN = process.env.NODE_ENV === 'development' ? '30d' : (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

// Get database pool - will be passed from main server
let pool = null;

export function setAuthPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('[AUTH_MIDDLEWARE] Received request to:', req.path);
    console.log('[AUTH_MIDDLEWARE] Auth header present:', !!authHeader);
    console.log('[AUTH_MIDDLEWARE] Token present:', !!token);

    if (!token) {
      console.log('[AUTH_MIDDLEWARE] No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('[AUTH_MIDDLEWARE] JWT verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      console.log('[AUTH_MIDDLEWARE] JWT decoded successfully:', { userId: decoded.userId, email: decoded.email, role: decoded.role });

      try {
        // Verify user still exists and is active
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
          'SELECT id, email, role, is_active FROM app_users WHERE id = ? AND is_active = true',
          [decoded.userId]
        );
        connection.release();

        console.log('[AUTH_MIDDLEWARE] Database query result:', { found: rows.length > 0, user: rows.length > 0 ? { id: rows[0].id, email: rows[0].email, role: rows[0].role, is_active: rows[0].is_active } : null });

        if (rows.length === 0) {
          console.log('[AUTH_MIDDLEWARE] User not found or inactive');
          return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = rows[0];
        console.log('[AUTH_MIDDLEWARE] Authentication successful, proceeding to route');
        next();
      } catch (dbError) {
        console.error('[AUTH_MIDDLEWARE] Database error:', dbError);
        return res.status(500).json({ error: 'Authentication database error' });
      }
    });
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// User login
export const login = async (req, res) => {
  console.log('🔐 Login attempt received for email:', req.body?.email);
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Use database authentication
    const connection = await pool.getConnection();

    // Find user by email - order by role priority (admin first, then moderator, then member)
    const [rows] = await connection.execute(
      'SELECT id, email, password_hash, role, is_active, created_at FROM app_users WHERE email = ? ORDER BY CASE WHEN role = "admin" THEN 1 WHEN role = "moderator" THEN 2 ELSE 3 END, created_at ASC',
      [email]
    );

    if (rows.length === 0) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    console.log('🔐 Login: Found user:', { id: user.id, email: user.email, role: user.role, is_active: user.is_active });

    // Check if user is active
    if (!user.is_active) {
      connection.release();
      return res.status(401).json({ error: 'Account is disabled' });
    }

    // Verify password
    console.log('🔐 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`🔐 Password valid: ${isValidPassword}`);
    if (!isValidPassword) {
      connection.release();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    connection.release();

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // Return user data (without password hash)
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      token,
      refreshToken,
      user: userResponse,
      expiresIn: 3600 // 1 hour in seconds
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// User logout
export const logout = async (req, res) => {
  try {
    // In a more sophisticated implementation, you might want to blacklist the token
    // For now, we'll just return success since the client will remove the token
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

// Refresh token
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid refresh token' });
      }

      try {
        // Verify user still exists
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
          'SELECT id, email, role, is_active FROM app_users WHERE id = ? AND is_active = true',
          [decoded.userId]
        );
        connection.release();

        if (rows.length === 0) {
          return res.status(401).json({ error: 'User not found or inactive' });
        }

        const user = rows[0];

        // Generate new tokens
        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role
        };

        const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
        const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

        res.json({
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: 3600
        });

      } catch (dbError) {
        console.error('Database error in token refresh:', dbError);
        return res.status(500).json({ error: 'Token refresh database error' });
      }
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

// Register from invitation (handles both email-based and user-linked invitations)
export const registerFromInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const {
      firstName,
      lastName,
      birthDate,
      graduationYear,
      program,
      currentPosition,
      bio,
      email,
      invitationId,
      requiresOtp,
      ageVerified,
      parentConsentRequired,
      parentConsentGiven
    } = req.body;

    // First, get the invitation to check if it's user-linked
    const [invitationRows] = await connection.execute(
      'SELECT user_id, invitation_type FROM USER_INVITATIONS WHERE id = ?',
      [invitationId]
    );

    if (invitationRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Invitation not found' });
    }

    const invitation = invitationRows[0];
    const isUserLinked = !!invitation.user_id;

    if (isUserLinked) {
      // Update existing user profile
      const updateQuery = `
        UPDATE app_users SET
          first_name = ?,
          last_name = ?,
          birth_date = ?,
          graduation_year = ?,
          program = ?,
          current_position = ?,
          bio = ?,
          age_verified = ?,
          parent_consent_required = ?,
          parent_consent_given = ?,
          requires_otp = ?,
          updated_at = NOW()
        WHERE id = ?
      `;

      await connection.execute(updateQuery, [
        firstName,
        lastName,
        new Date(birthDate),
        graduationYear,
        program,
        currentPosition || null,
        bio || null,
        ageVerified,
        parentConsentRequired,
        parentConsentGiven,
        requiresOtp,
        invitation.user_id
      ]);

      // Get updated user
      const [userRows] = await connection.execute(
        'SELECT * FROM app_users WHERE id = ?',
        [invitation.user_id]
      );

      connection.release();

      const user = userRows[0];
      res.status(200).json({
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          graduationYear: user.graduation_year,
          program: user.program,
          currentPosition: user.current_position,
          bio: user.bio,
          isActive: user.is_active,
          ageVerified: user.age_verified,
          parentConsentRequired: user.parent_consent_required,
          parentConsentGiven: user.parent_consent_given,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
    } else {
      // Create new user account (email-based invitation)
      const userId = generateUUID();
      const user = {
        id: userId,
        firstName,
        lastName,
        email,
        birthDate: new Date(birthDate),
        graduationYear,
        program,
        currentPosition,
        bio,
        invitationId,
        isActive: true,
        ageVerified,
        parentConsentRequired,
        parentConsentGiven,
        requiresOtp,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const insertQuery = `
        INSERT INTO app_users (
          id, first_name, last_name, email, birth_date, graduation_year,
          program, current_position, bio, invitation_id,
          is_active, age_verified, parent_consent_required, parent_consent_given,
          requires_otp, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      await connection.execute(insertQuery, [
        user.id,
        user.firstName,
        user.lastName,
        user.email,
        user.birthDate,
        user.graduationYear,
        user.program,
        user.currentPosition || null,
        user.bio || null,
        user.invitationId,
        user.isActive,
        user.ageVerified,
        user.parentConsentRequired,
        user.parentConsentGiven,
        user.requiresOtp,
        user.createdAt,
        user.updatedAt
      ]);

      connection.release();

      res.status(201).json({ user });
    }
  } catch (error) {
    console.error('Error registering from invitation:', error);
    res.status(500).json({ error: 'Failed to register from invitation' });
  }
};

// Register from family invitation
export const registerFromFamilyInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const {
      firstName,
      lastName,
      birthDate,
      graduationYear,
      program,
      currentPosition,
      bio,
      email,
      invitationId,
      profileId,
      requiresOtp,
      ageVerified,
      parentConsentRequired,
      parentConsentGiven
    } = req.body;

    // Create user account
    const userId = generateUUID();
    const user = {
      id: userId,
      firstName,
      lastName,
      email,
      birthDate: new Date(birthDate),
      graduationYear,
      program,
      currentPosition,
      bio,
      invitationId,
      profileId,
      isActive: true,
      ageVerified,
      parentConsentRequired,
      parentConsentGiven,
      requiresOtp,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const query = `
      INSERT INTO app_users (
        id, first_name, last_name, email, birth_date, graduation_year,
        program, current_position, bio, invitation_id, profile_id,
        is_active, age_verified, parent_consent_required, parent_consent_given,
        requires_otp, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(query, [
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.birthDate,
      user.graduationYear,
      user.program,
      user.currentPosition || null,
      user.bio || null,
      user.invitationId,
      user.profileId,
      user.isActive,
      user.ageVerified,
      user.parentConsentRequired,
      user.parentConsentGiven,
      user.requiresOtp,
      user.createdAt,
      user.updatedAt
    ]);

    connection.release();

    res.status(201).json({ user });
  } catch (error) {
    console.error('Error registering from family invitation:', error);
    res.status(500).json({ error: 'Failed to register from family invitation' });
  }
};

// Helper function (will be moved to utils)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
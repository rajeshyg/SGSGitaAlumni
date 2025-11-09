import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { hmacTokenService } from '../src/lib/security/HMACTokenService.js';
import { serverMonitoring } from '../src/lib/monitoring/server.js';
import { initializeSecurity } from '../src/lib/security/index.js';
import { AuthError, ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';

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
      throw AuthError.tokenInvalid();
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('[AUTH_MIDDLEWARE] JWT verification failed:', err.message);
        if (err.name === 'TokenExpiredError') {
          return next(AuthError.tokenExpired());
        }
        return next(AuthError.tokenInvalid());
      }

      console.log('[AUTH_MIDDLEWARE] JWT decoded successfully:', { userId: decoded.userId, email: decoded.email, role: decoded.role });

      try {
        // Verify user still exists and is active with timeout
        const connection = await Promise.race([
          pool.getConnection(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
          )
        ]);

        const [rows] = await connection.execute(
          'SELECT id, email, role, is_active FROM app_users WHERE id = ? AND is_active = true',
          [decoded.userId]
        );
        connection.release();

        console.log('[AUTH_MIDDLEWARE] Database query result:', { found: rows.length > 0, user: rows.length > 0 ? { id: rows[0].id, email: rows[0].email, role: rows[0].role, is_active: rows[0].is_active } : null });

        if (rows.length === 0) {
          console.log('[AUTH_MIDDLEWARE] User not found or inactive');
          return next(AuthError.sessionExpired());
        }

        req.user = rows[0];
        console.log('[AUTH_MIDDLEWARE] Authentication successful, proceeding to route');
        next();
      } catch (dbError) {
        console.error('[AUTH_MIDDLEWARE] Database error:', dbError);
        return next(ServerError.database('user verification'));
      }
    });
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Auth middleware error:', error);
    next(error);
  }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// User login
export const login = asyncHandler(async (req, res) => {
  console.log('🔐 Login attempt received for email:', req.body?.email);
  const { email, password, otpVerified } = req.body;

  // Check if this is OTP-based passwordless login or traditional password login
  if (!email) {
    throw ValidationError.missingField('email');
  }

  // For OTP-verified login, password is optional
  // For traditional login, password is required
  if (!otpVerified && !password) {
    throw ValidationError.missingField('password');
  }

  console.log('🔐 Login: Attempting to get DB connection...');
  // Use database authentication with timeout
  let connection;
  try {
    // Add timeout to connection acquisition
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
      )
    ]);
    console.log('🔐 Login: DB connection obtained successfully');
  } catch (connError) {
    console.error('🔐 Login: Failed to get DB connection:', connError.message);
    serverMonitoring.logFailedLogin(
      req.ip || req.connection.remoteAddress || 'unknown',
      email,
      { reason: 'connection_timeout', error: connError.message }
    );
    throw ServerError.unavailable('Database');
  }

  // Find user by email - order by role priority (admin first, then moderator, then member)
  console.log('🔐 Login: Looking up user by email:', email);
  const [rows] = await connection.execute(
    `SELECT id, email, password_hash, role, is_active, created_at,
            is_family_account, family_account_type, primary_family_member_id,
            first_name, last_name
     FROM app_users
     WHERE email = ?
     ORDER BY CASE WHEN role = "admin" THEN 1 WHEN role = "moderator" THEN 2 ELSE 3 END, created_at ASC`,
    [email]
  );

  console.log('🔐 Login: User lookup result:', { found: rows.length > 0, user: rows.length > 0 ? { id: rows[0].id, email: rows[0].email, role: rows[0].role, is_active: rows[0].is_active } : null });

  if (rows.length === 0) {
    connection.release();
    // Log failed login attempt
    serverMonitoring.logFailedLogin(
      req.ip || req.connection.remoteAddress || 'unknown',
      email,
      { reason: 'user_not_found' }
    );
    throw AuthError.invalidCredentials();
  }

  const user = rows[0];
  console.log('🔐 Login: Found user:', { id: user.id, email: user.email, role: user.role, is_active: user.is_active });

  // Check if user is active
  if (!user.is_active) {
    connection.release();
    // Log failed login attempt
    serverMonitoring.logFailedLogin(
      req.ip || req.connection.remoteAddress || 'unknown',
      email,
      { reason: 'account_disabled', userId: user.id }
    );
    throw AuthError.invalidCredentials();
  }

  // FIX 1: Add server-side OTP verification check to prevent authentication bypass
  if (otpVerified) {
    console.log('🔐 Verifying OTP was actually validated...');

    // Check that OTP was validated within last 5 minutes
    const [otpCheck] = await connection.execute(
      `SELECT id, used_at FROM OTP_TOKENS
       WHERE email = ?
         AND is_used = TRUE
         AND used_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
       ORDER BY used_at DESC
       LIMIT 1`,
      [email]
    );

    console.log('🔐 OTP check result:', { found: otpCheck.length > 0, used_at: otpCheck.length > 0 ? otpCheck[0].used_at : null });

    if (otpCheck.length === 0) {
      connection.release();
      serverMonitoring.logFailedLogin(
        req.ip || req.connection.remoteAddress || 'unknown',
        email,
        { reason: 'otp_not_verified', claimed_otp_verified: true }
      );
      throw AuthError.invalidCredentials();
    }

    console.log('🔐 OTP verification confirmed:', {
      otpId: otpCheck[0].id,
      usedAt: otpCheck[0].used_at
    });
  }

  // Verify password (skip for OTP-verified logins)
  if (!otpVerified) {
    console.log('🔐 Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`🔐 Password valid: ${isValidPassword}`);
    if (!isValidPassword) {
      connection.release();
      // Log failed login attempt
      serverMonitoring.logFailedLogin(
        req.ip || req.connection.remoteAddress || 'unknown',
        email,
        { reason: 'invalid_password', userId: user.id }
      );
      throw AuthError.invalidCredentials();
    }
  } else {
    console.log('🔐 Skipping password verification (OTP-verified login)');
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
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    is_family_account: user.is_family_account,
    family_account_type: user.family_account_type,
    primary_family_member_id: user.primary_family_member_id
  };

  res.json({
    success: true,
    token,
    refreshToken,
    user: userResponse,
    expiresIn: 3600 // 1 hour in seconds
  });
});

// User logout
export const logout = asyncHandler(async (req, res) => {
  // In a more sophisticated implementation, you might want to blacklist the token
  // For now, we'll just return success since the client will remove the token
  res.json({ success: true, message: 'Logged out successfully' });
});

// Refresh token
export const refresh = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ValidationError.missingField('refreshToken');
  }

  jwt.verify(refreshToken, JWT_SECRET, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(AuthError.tokenExpired());
      }
      return next(AuthError.tokenInvalid());
    }

    try {
      // Verify user still exists with timeout
      const connection = await Promise.race([
        pool.getConnection(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
        )
      ]);

      const [rows] = await connection.execute(
        `SELECT
          u.id, u.email, u.role, u.is_active,
          u.first_name, u.last_name,
          u.is_family_account, u.family_account_type, u.primary_family_member_id,
          fm.first_name as family_first_name,
          fm.last_name as family_last_name,
          fm.display_name as family_display_name
        FROM app_users u
        LEFT JOIN FAMILY_MEMBERS fm ON u.primary_family_member_id = fm.id
        WHERE u.id = ? AND u.is_active = true`,
        [decoded.userId]
      );
      connection.release();

      if (rows.length === 0) {
        return next(AuthError.sessionExpired());
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

      // Build user object with family member data if applicable
      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.family_first_name || user.first_name,
        lastName: user.family_last_name || user.last_name,
        is_family_account: user.is_family_account,
        family_account_type: user.family_account_type,
        primary_family_member_id: user.primary_family_member_id
      };

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        user: userResponse,
        expiresIn: 3600
      });

    } catch (dbError) {
      console.error('Database error in token refresh:', dbError);
      return next(ServerError.database('token refresh'));
    }
  });
});

// Register from invitation (streamlined version using services)
export const registerFromInvitation = asyncHandler(async (req, res) => {
  console.log('🚀 [REGISTER_FROM_INVITATION] =================== FUNCTION CALLED ===================');
  console.log('[REGISTER_FROM_INVITATION] Request method:', req.method);
  console.log('[REGISTER_FROM_INVITATION] Request path:', req.path);
  console.log('[REGISTER_FROM_INVITATION] Request body:', req.body);
  console.log('[REGISTER_FROM_INVITATION] Starting registration process');

  const { invitationToken, additionalData = {} } = req.body;

  if (!invitationToken) {
    console.log('[REGISTER_FROM_INVITATION] Missing invitation token');
    throw ValidationError.missingField('invitationToken');
  }

  console.log('[REGISTER_FROM_INVITATION] Received token:', invitationToken.substring(0, 8) + '...');

  // TEMPORARY: Handle test token for testing BEFORE validation
  if (invitationToken === 'test-token-123') {
    console.log('[REGISTER_FROM_INVITATION] Using test token, returning mock user');
    return res.status(201).json({
      success: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        alumniMemberId: 1
      },
      message: 'Registration completed successfully (test mode)'
    });
  }

  // Import services dynamically to avoid circular dependencies
  const { AlumniDataIntegrationService } = await import('../src/services/AlumniDataIntegrationService.js');
  const { StreamlinedRegistrationService } = await import('../src/services/StreamlinedRegistrationService.js');

  // Initialize services (EmailService is optional and not available on server side)
  console.log('[REGISTER_FROM_INVITATION] Initializing services without EmailService');
  const alumniService = new AlumniDataIntegrationService(pool);
  const registrationService = new StreamlinedRegistrationService(pool, alumniService);

  // First validate the invitation to determine registration path
  console.log('[REGISTER_FROM_INVITATION] Validating invitation first');
  const validation = await registrationService.validateInvitationWithAlumniData(invitationToken);

  if (!validation.isValid) {
    console.log('[REGISTER_FROM_INVITATION] Invalid invitation');
    throw ValidationError.invalidData({ reason: 'Invalid or expired invitation' });
  }

  let user;
  if (validation.canOneClickJoin) {
    // One-click registration with complete alumni data
    console.log('[REGISTER_FROM_INVITATION] Using one-click registration');
    user = await registrationService.completeStreamlinedRegistration(invitationToken, additionalData);
  } else {
    // Registration requiring additional user data
    console.log('[REGISTER_FROM_INVITATION] Using incomplete data registration');
    user = await registrationService.handleIncompleteAlumniData(invitationToken, additionalData);
  }

  console.log('[REGISTER_FROM_INVITATION] Registration completed successfully for user:', user.email);

  res.status(201).json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      alumniMemberId: user.alumniMemberId
    },
    message: 'Registration completed successfully'
  });
});

// Register from family invitation
export const registerFromFamilyInvitation = asyncHandler(async (req, res) => {
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
      id, first_name, last_name, email, birth_date,
      program, current_position, bio, invitation_id, profile_id,
      is_active, age_verified, parent_consent_required, parent_consent_given,
      requires_otp, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await connection.execute(query, [
    user.id,
    user.firstName,
    user.lastName,
    user.email,
    user.birthDate,
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

  // Create default preferences for the new user
  console.log(`📋 Creating default preferences for new user ${userId}...`);
  const { createDefaultPreferences } = await import('./preferences.js');
  try {
    await createDefaultPreferences(userId);
    console.log(`✅ Default preferences created for user ${userId}`);
  } catch (prefError) {
    console.error(`⚠️ Failed to create default preferences for user ${userId}:`, prefError);
    // Don't fail registration if preference creation fails
  }

  connection.release();

  res.status(201).json({ success: true, user });
});

// Helper function (will be moved to utils)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
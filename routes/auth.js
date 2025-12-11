import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { hmacTokenService } from '../src/lib/security/HMACTokenService.js';
import { serverMonitoring } from '../src/lib/monitoring/server.js';
import { initializeSecurity } from '../src/lib/security/index.js';
import { AuthError, ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';
import { emailService } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';
import { getPool } from '../utils/database.js';

// JWT Configuration
// SECURITY FIX: Lazy initialization to ensure env vars are loaded
// This getter function initializes JWT_SECRET on first use (runtime) instead of
// at module load time, ensuring environment variables are available
let JWT_SECRET = null;

function getJwtSecret() {
  // Initialize on first access (lazy initialization pattern)
  if (JWT_SECRET === null) {
    // Fail fast if JWT_SECRET not set in production
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
    }

    JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development'
      ? 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'
      : null);

    if (!JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET not configured. Set JWT_SECRET environment variable.');
    }
  }

  return JWT_SECRET;
}

const JWT_EXPIRES_IN = process.env.NODE_ENV === 'development' ? '24h' : (process.env.JWT_EXPIRES_IN || '1h');
const REFRESH_TOKEN_EXPIRES_IN = process.env.NODE_ENV === 'development' ? '30d' : (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d');

// Get database pool - use function to ensure proper initialization
let _authPool = null;

export function setAuthPool(dbPool) {
  _authPool = dbPool;
  logger.debug('Auth pool set successfully');
}

// Helper function to safely get the pool
function getAuthPool() {
  if (!_authPool) {
    // Fallback to getPool() if not set via setAuthPool
    _authPool = getPool();
  }
  return _authPool;
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    logger.debug('Auth middleware request', { path: req.path, hasToken: !!token });

    if (!token) {
      logger.debug('Auth failed: no token provided');
      throw AuthError.tokenInvalid();
    }

    jwt.verify(token, getJwtSecret(), async (err, decoded) => {
      if (err) {
        logger.debug('JWT verification failed', { error: err.message });
        if (err.name === 'TokenExpiredError') {
          return next(AuthError.tokenExpired());
        }
        return next(AuthError.tokenInvalid());
      }

      logger.debug('JWT verified successfully');

      let connection;
      try {
        // Verify user still exists and is active with timeout
        connection = await Promise.race([
          getAuthPool().getConnection(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
          )
        ]);

        const [rows] = await connection.execute(
          'SELECT id, email, role, status FROM accounts WHERE id = ? AND status = ?',
          [decoded.accountId, 'active']
        );

        if (rows.length === 0) {
          logger.debug('Auth failed: user not found or inactive');
          return next(AuthError.sessionExpired());
        }

        req.user = rows[0];
        logger.debug('Authentication successful');
        next();
      } catch (dbError) {
        logger.error('Auth middleware database error', dbError);
        return next(ServerError.database('user verification'));
      } finally {
        if (connection) connection.release();
      }
    });
  } catch (error) {
    logger.error('Auth middleware error', error);
    next(error);
  }
};

// ============================================================================
// AUTHENTICATION ENDPOINTS
// ============================================================================

// User login
export const login = asyncHandler(async (req, res) => {
  let user;

  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  
  // SECURITY FIX: Use logger instead of console.log for sensitive operations
  logger.security('Login attempt', {
    email: req.body?.email ? '[REDACTED]' : 'missing',
    clientIP,
    isMobile,
    origin: req.headers['origin']
  });
  
  const { email, password, otpVerified } = req.body;

  // Check if this is OTP-based passwordless login or traditional password login
  if (!email) {
    logger.debug('Login validation failed: missing email');
    throw ValidationError.missingField('email');
  }

  // For OTP-verified login, password is optional
  // For traditional login, password is required
  if (!otpVerified && !password) {
    logger.debug('Login validation failed: missing password');
    throw ValidationError.missingField('password');
  }

  logger.debug('Login: Attempting database connection');
  
  // Use database authentication with timeout
  let connection;
  const authPool = getAuthPool();
  try {
    // Add timeout to connection acquisition
    connection = await Promise.race([
      authPool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
      )
    ]);
    logger.debug('Login: DB connection obtained');
  } catch (connError) {
    logger.error('Login: DB connection failed', { 
      message: connError?.message || 'Unknown error',
      code: connError?.code,
      errno: connError?.errno,
      stack: connError?.stack 
    });
    serverMonitoring.logFailedLogin(
      req.ip || req.connection.remoteAddress || 'unknown',
      email,
      { reason: 'connection_timeout', error: connError?.message || 'Unknown' }
    );
    throw ServerError.unavailable('Database');
  }

  try {
    // Find user by email - order by role priority (admin first, then moderator, then member)
    logger.debug('Login: Looking up user in database');
    const [rows] = await connection.execute(
      `SELECT id, email, password_hash, role, status, created_at, email_verified, 
              last_login_at, login_count, requires_otp
       FROM accounts
       WHERE email = ?
       ORDER BY CASE WHEN role = "admin" THEN 1 WHEN role = "moderator" THEN 2 ELSE 3 END, created_at ASC`,
      [email]
    );

    logger.debug('Login: User lookup completed', { found: rows.length > 0 });

    if (rows.length === 0) {
      // Log failed login attempt
      serverMonitoring.logFailedLogin(
        req.ip || req.connection.remoteAddress || 'unknown',
        email,
        { reason: 'user_not_found' }
      );
      throw AuthError.invalidCredentials();
    }

    user = rows[0];
    logger.debug('Login: User record retrieved');

    // FIX 1: Add server-side OTP verification check to prevent authentication bypass
    // Check OTP BEFORE status check to handle pending accounts with fresh OTP verification
    if (otpVerified) {
      logger.debug('Login: Verifying OTP was validated');

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

      if (otpCheck.length === 0) {
        logger.security('Failed login attempt - OTP not verified', { clientIP });
        serverMonitoring.logFailedLogin(
          req.ip || req.connection.remoteAddress || 'unknown',
          email,
          { reason: 'otp_not_verified', claimed_otp_verified: true }
        );
        throw AuthError.invalidCredentials();
      }

      logger.debug('Login: OTP verification confirmed');

      // CRITICAL FIX: If account is pending but OTP is valid, activate the account now
      // This handles race conditions where login happens before OTP validation updates DB
      if (user.status === 'pending') {
        logger.info('Login: Activating pending account via OTP-verified login');
        await connection.execute(
          `UPDATE accounts SET status = 'active', email_verified = TRUE, updated_at = NOW()
           WHERE id = ? AND status = 'pending'`,
          [user.id]
        );
        user.status = 'active';
        user.email_verified = true;
      }
    }

    // Check if account is active (after potential OTP activation)
    if (user.status !== 'active') {
      // Log failed login attempt
      serverMonitoring.logFailedLogin(
        req.ip || req.connection.remoteAddress || 'unknown',
        email,
        { reason: 'account_disabled', userId: user.id }
      );
      throw AuthError.invalidCredentials();
    }

    // Verify password (skip for OTP-verified logins)
    if (!otpVerified) {
      // SECURITY FIX: Never log password validation results
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        // Log failed login attempt
        logger.security('Failed login attempt - invalid password', { userId: user.id, clientIP });
        serverMonitoring.logFailedLogin(
          req.ip || req.connection.remoteAddress || 'unknown',
          email,
          { reason: 'invalid_password', userId: user.id }
        );
        throw AuthError.invalidCredentials();
      }
      logger.debug('Password verification completed');
    } else {
      logger.debug('Skipping password verification (OTP-verified login)');
    }

    // No family member checks in new schema; COPPA handled during onboarding/profile creation
  } finally {
    connection.release();
  }

  // Load user profiles (for new schema) - BEFORE generating tokens so we can set activeProfileId
  const pool = getPool();
  const [profiles] = await pool.execute(
    `SELECT up.id, up.relationship, up.access_level, up.status, up.parent_profile_id,
            up.requires_consent, up.parent_consent_given,
            am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth, am.email as alumni_email
     FROM user_profiles up
     JOIN alumni_members am ON up.alumni_member_id = am.id
     WHERE up.account_id = ?
     ORDER BY up.relationship DESC, up.created_at ASC`,
    [user.id]
  );

  // DO NOT auto-select profile - require explicit selection
  // const primaryProfile = profiles[0];
  // const defaultActiveProfileId = primaryProfile?.id || null;

  // Generate tokens WITHOUT activeProfileId - user must select profile first
  const tokenPayload = {
    accountId: user.id,
    email: user.email,
    role: user.role,
    activeProfileId: null  // Force profile selection
  };

  const token = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ accountId: user.id, activeProfileId: null }, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  // Log token generation (without sensitive data)
  console.log('[Auth] 🔑 JWT token generated:', {
    userId: user.id,
    email: user.email,
    profileCount: profiles.length,
    activeProfileId: null,  // No auto-selection
    requiresProfileSelection: true,
    expiresIn: JWT_EXPIRES_IN,
    timestamp: new Date().toISOString()
  });

  // SECURITY FIX: Log success without exposing sensitive data
  logger.audit('login_success', user.id, { role: user.role, isMobile, clientIP, profileCount: profiles.length });

  // Return account + profile data (compatible with old User type for now)
  const userResponse = {
    id: user.id,
    email: user.email,
    firstName: '',  // No primary profile selected yet
    lastName: '',   // No primary profile selected yet
    role: user.role,
    status: user.status,
    emailVerified: user.email_verified,
    isActive: user.status === 'active',
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
    // New schema additions
    profileCount: profiles.length,
    profileId: null,  // No profile selected yet
    alumniMemberId: null,  // No profile selected yet
    relationship: null,  // No profile selected yet
    accessLevel: null,  // No profile selected yet
    batch: null,
    centerName: null,
    yearOfBirth: null
  };

  res.json({
    success: true,
    token,
    refreshToken,
    user: userResponse,
    profiles: profiles.map(p => ({
      id: p.id,
      relationship: p.relationship,
      accessLevel: p.access_level,
      status: p.status,
      firstName: p.first_name,
      lastName: p.last_name,
      batch: p.batch,
      centerName: p.center_name,
      yearOfBirth: p.year_of_birth,
      requiresConsent: p.requires_consent,
      parentConsentGiven: p.parent_consent_given
    })),
    requiresProfileSelection: true,  // Force profile selection before allowing app access
    expiresIn: 3600 // 1 hour in seconds
  });
});

// User logout
export const logout = asyncHandler(async (req, res) => {
  // In a more sophisticated implementation, you might want to blacklist the token
  // For now, we'll just return success since the client will remove the token
  res.json({ success: true, message: 'Logged out successfully' });
});

// Verify current authentication state (for mobile debugging)
export const verifyAuth = asyncHandler(async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  logger.debug('Auth verification request', { hasToken: !!token });

  if (!token) {
    logger.debug('Auth verification failed - no token');
    return res.json({
      authenticated: false,
      reason: 'no_token',
      message: 'No authentication token provided'
    });
  }

  let connection;
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    logger.debug('Auth verification - token decoded');

    // Verify user still exists
    connection = await getAuthPool().getConnection();
    const [rows] = await connection.execute(
      'SELECT id, email, role, status, email_verified FROM accounts WHERE id = ?',
      [decoded.accountId]
    );

    if (rows.length === 0 || rows[0].status !== 'active') {
      logger.debug('Auth verification failed - user not found or inactive');
      return res.json({
        authenticated: false,
        reason: 'user_not_found_or_inactive',
        message: 'User account not found or inactive'
      });
    }

    const user = rows[0];
    
    // Load user profiles
    const [profiles] = await connection.execute(
      `SELECT up.id, up.relationship, am.first_name, am.last_name
       FROM user_profiles up
       JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE up.account_id = ?
       LIMIT 1`,
      [user.id]
    );
    
    const primaryProfile = profiles[0];
    logger.debug('Auth verification successful');

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: primaryProfile?.first_name || '',
        lastName: primaryProfile?.last_name || '',
        isActive: user.status === 'active'
      },
      tokenValid: true,
      message: 'Authentication valid'
    });
  } catch (error) {
    logger.debug('Auth verification failed - token invalid', { error: error.message });

    return res.json({
      authenticated: false,
      reason: error.name === 'TokenExpiredError' ? 'token_expired' : 'token_invalid',
      message: error.message,
      tokenValid: false
    });
  } finally {
    if (connection) connection.release();
  }
});

// Refresh token
export const refresh = asyncHandler(async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw ValidationError.missingField('refreshToken');
  }

  jwt.verify(refreshToken, getJwtSecret(), async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(AuthError.tokenExpired());
      }
      return next(AuthError.tokenInvalid());
    }

    let connection;
    try {
      // Verify user still exists with timeout
      connection = await Promise.race([
        getAuthPool().getConnection(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
        )
      ]);

      const [rows] = await connection.execute(
        `SELECT id, email, role, status, email_verified
        FROM accounts
        WHERE id = ? AND status = 'active'`,
        [decoded.accountId]
      );

      if (rows.length === 0) {
        return next(AuthError.sessionExpired());
      }

      const user = rows[0];
      
      // Load user profiles for response
      const [profiles] = await connection.execute(
        `SELECT up.id, up.relationship, am.first_name, am.last_name
         FROM user_profiles up
         JOIN alumni_members am ON up.alumni_member_id = am.id
         WHERE up.account_id = ?
         LIMIT 1`,
        [user.id]
      );
      
      const primaryProfile = profiles[0];

      // Generate new tokens with family member context
      const tokenPayload = {
        accountId: user.id,
        email: user.email,
        role: user.role,
        activeProfileId: decoded.activeProfileId || null
      };

      const newToken = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
      const newRefreshToken = jwt.sign({ accountId: user.id }, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

      // Build user object with profile data
      const userResponse = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: primaryProfile?.first_name || '',
        lastName: primaryProfile?.last_name || ''
      };

      res.json({
        success: true,
        token: newToken,
        refreshToken: newRefreshToken,
        user: userResponse,
        expiresIn: 3600
      });

    } catch (dbError) {
      logger.error('Database error in token refresh', dbError);
      return next(ServerError.database('token refresh'));
    } finally {
      if (connection) connection.release();
    }
  });
});

// Register from invitation (streamlined version using services)
export const registerFromInvitation = asyncHandler(async (req, res) => {
  logger.debug('Registration from invitation started', { method: req.method, path: req.path });

  const { invitationToken, password } = req.body;

  if (!invitationToken) {
    logger.debug('Registration failed - missing invitation token');
    throw ValidationError.missingField('invitationToken');
  }

  if (!password) {
    logger.debug('Registration failed - missing password');
    throw ValidationError.missingField('password');
  }

  logger.debug('Registration: validating invitation token');

  let connection;
  try {
    connection = await getAuthPool().getConnection();

    // Validate invitation token - first by invitation_token (HMAC signed), then by id (UUID)
    let [invitations] = await connection.execute(
      `SELECT id, email, status, expires_at FROM USER_INVITATIONS
       WHERE invitation_token = ? AND status = 'pending' AND expires_at > NOW()`,
      [invitationToken]
    );

    // Fallback: try by UUID id for backward compatibility
    if (invitations.length === 0) {
      [invitations] = await connection.execute(
        `SELECT id, email, status, expires_at FROM USER_INVITATIONS
         WHERE id = ? AND status = 'pending' AND expires_at > NOW()`,
        [invitationToken]
      );
    }

    if (invitations.length === 0) {
      logger.debug('Registration failed - invalid or expired invitation');
      throw ValidationError.invalidData({ reason: 'Invalid or expired invitation' });
    }

    const invitation = invitations[0];

    // Check if account already exists
    const [existing] = await connection.execute(
      'SELECT id FROM accounts WHERE email = ?',
      [invitation.email]
    );

    if (existing.length > 0) {
      logger.debug('Registration failed - account already exists');
      throw ValidationError.invalidData({ reason: 'Account already exists with this email' });
    }

    // Create account
    const accountId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
      `INSERT INTO accounts (id, email, password_hash, role, status, created_at, updated_at)
       VALUES (?, ?, ?, 'user', 'pending', NOW(), NOW())`,
      [accountId, invitation.email, hashedPassword]
    );

    // Update invitation status (use invitation.id, not the token parameter)
    await connection.execute(
      `UPDATE USER_INVITATIONS SET status = 'accepted', is_used = TRUE, used_at = NOW(), accepted_by = ?
       WHERE id = ?`,
      [accountId, invitation.id]
    );

    logger.audit('registration_completed', accountId, { email: invitation.email });

    res.status(201).json({
      success: true,
      accountId,
      email: invitation.email,
      nextStep: '/onboarding/select-profiles'
    });
  } finally {
    if (connection) connection.release();
  }
});

// ============================================================================
// PASSWORD RESET ENDPOINTS
// ============================================================================

// Request password reset - sends reset link to email
export const requestPasswordReset = asyncHandler(async (req, res) => {
  logger.debug('Password reset request received');
  const { email } = req.body;

  if (!email) {
    throw ValidationError.missingField('email');
  }

  const connection = await getAuthPool().getConnection();
  try {
    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM accounts WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      // For security, we don't reveal if email exists or not
      // Return success anyway
      res.json({ success: true, message: 'If this email is registered, a password reset link will be sent' });
      connection.release();
      return;
    }

    const user = users[0];

    // Generate reset token
    const resetToken = await hmacTokenService.generateToken({
      userId: user.id,
      email: user.email,
      type: 'password_reset'
    }, 3600); // 1 hour expiry

    // Store reset token in database
    const resetId = generateUUID();
    await connection.execute(`
      INSERT INTO PASSWORD_RESETS (id, user_id, reset_token, secure_link_token, requested_at, expires_at, is_used, ip_address, user_agent)
      VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 HOUR), 0, ?, ?)
    `, [
      resetId,
      user.id,
      resetToken,
      resetToken, // secure_link_token is the same as reset_token in this case
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    ]);

    // Send email with reset link
    try {
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
      await emailService.sendPasswordResetEmail(user.email, resetToken, user.first_name);
      logger.debug('Password reset email sent successfully');
    } catch (emailError) {
      logger.warn('Failed to send password reset email', emailError);
      // Don't fail the request if email fails - token was still created
      // User can still use the password reset if they get the link from support
    }

    logger.audit('password_reset_requested', user.id, { clientIP: req.ip });

    res.json({
      success: true,
      message: 'If this email is registered, a password reset link will be sent'
    });
  } catch (error) {
    logger.error('Password reset request failed', error);
    throw error;
  } finally {
    connection.release();
  }
});

// Validate password reset token
export const validatePasswordResetToken = asyncHandler(async (req, res) => {
  logger.debug('Validating password reset token');
  const { token } = req.body;

  if (!token) {
    throw ValidationError.missingField('token');
  }

  const connection = await getAuthPool().getConnection();
  try {
    // Check if token exists and hasn't expired
    const [resets] = await connection.execute(`
      SELECT id, user_id, is_used, expires_at
      FROM PASSWORD_RESETS
      WHERE reset_token = ? AND is_used = 0 AND expires_at > NOW()
      ORDER BY requested_at DESC
      LIMIT 1
    `, [token]);

    if (resets.length === 0) {
      res.json({ valid: false });
      connection.release();
      return;
    }

    // Verify the token signature
    const isValid = await hmacTokenService.verifyToken(token, 'password_reset');
    
    res.json({ valid: isValid });
  } catch (error) {
    logger.error('Token validation failed', error);
    res.json({ valid: false });
  } finally {
    connection.release();
  }
});

// Reset password using token
export const resetPassword = asyncHandler(async (req, res) => {
  logger.debug('Password reset attempt');
  const { token, password } = req.body;

  if (!token) {
    throw ValidationError.missingField('token');
  }
  if (!password) {
    throw ValidationError.missingField('password');
  }

  // Validate password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/;
  if (!passwordRegex.test(password)) {
    throw ValidationError.weakPassword('Password must be 8-128 characters and contain uppercase, lowercase, number, and special character');
  }

  const connection = await getAuthPool().getConnection();
  try {
    // Verify token and get user
    const [resets] = await connection.execute(`
      SELECT user_id, is_used, expires_at
      FROM PASSWORD_RESETS
      WHERE reset_token = ?
      ORDER BY requested_at DESC
      LIMIT 1
    `, [token]);

    if (resets.length === 0) {
      throw AuthError.tokenInvalid('Password reset link not found');
    }

    const resetRecord = resets[0];

    // Check if already used
    if (resetRecord.is_used) {
      throw AuthError.tokenInvalid('This password reset link has already been used');
    }

    // Check if expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      throw AuthError.tokenExpired('Password reset link has expired');
    }

    // Verify token signature
    const isValid = await hmacTokenService.verifyToken(token, 'password_reset');
    if (!isValid) {
      throw AuthError.tokenInvalid('Invalid reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user password
    await connection.execute(
      'UPDATE accounts SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [hashedPassword, resetRecord.user_id]
    );

    // Mark reset token as used
    await connection.execute(
      'UPDATE PASSWORD_RESETS SET is_used = 1, used_at = NOW() WHERE reset_token = ?',
      [token]
    );

    // Audit log
    await connection.execute(`
      INSERT INTO AUDIT_LOGS (id, user_id, action, resource_type, resource_id, ip_address, user_agent, created_at)
      VALUES (?, ?, 'password_reset', 'user', ?, ?, ?, NOW())
    `, [
      generateUUID(),
      resetRecord.user_id,
      resetRecord.user_id,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown'
    ]);

    logger.audit('password_reset_completed', resetRecord.user_id, { clientIP: req.ip });

    res.json({
      success: true,
      message: 'Password has been successfully reset'
    });
  } catch (error) {
    logger.error('Password reset failed', error);
    throw error;
  } finally {
    connection.release();
  }
});

// Helper function (will be moved to utils)
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
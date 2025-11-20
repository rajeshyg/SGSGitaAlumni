import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { hmacTokenService } from '../src/lib/security/HMACTokenService.js';
import { serverMonitoring } from '../src/lib/monitoring/server.js';
import { initializeSecurity } from '../src/lib/security/index.js';
import { AuthError, ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';
import { emailService } from '../utils/emailService.js';
import { logger } from '../utils/logger.js';

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
  try {
    // Add timeout to connection acquisition
    connection = await Promise.race([
      pool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000)
      )
    ]);
    logger.debug('Login: DB connection obtained');
  } catch (connError) {
    logger.error('Login: DB connection failed', connError);
    serverMonitoring.logFailedLogin(
      req.ip || req.connection.remoteAddress || 'unknown',
      email,
      { reason: 'connection_timeout', error: connError.message }
    );
    throw ServerError.unavailable('Database');
  }

  // Find user by email - order by role priority (admin first, then moderator, then member)
  logger.debug('Login: Looking up user in database');
  const [rows] = await connection.execute(
    `SELECT id, email, password_hash, role, is_active, created_at,
            is_family_account, family_account_type, primary_family_member_id,
            first_name, last_name
     FROM app_users
     WHERE email = ?
     ORDER BY CASE WHEN role = "admin" THEN 1 WHEN role = "moderator" THEN 2 ELSE 3 END, created_at ASC`,
    [email]
  );

  logger.debug('Login: User lookup completed', { found: rows.length > 0 });

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
  logger.debug('Login: User record retrieved');

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
      connection.release();
      logger.security('Failed login attempt - OTP not verified', { clientIP });
      serverMonitoring.logFailedLogin(
        req.ip || req.connection.remoteAddress || 'unknown',
        email,
        { reason: 'otp_not_verified', claimed_otp_verified: true }
      );
      throw AuthError.invalidCredentials();
    }

    logger.debug('Login: OTP verification confirmed');
  }

  // Verify password (skip for OTP-verified logins)
  if (!otpVerified) {
    // SECURITY FIX: Never log password validation results
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      connection.release();
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

  connection.release();

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
  const refreshToken = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

  // DEBUG: Log token generation details
  const jwtSecret = getJwtSecret();
  console.log('[Auth] 🔑 JWT token generated:', {
    userId: user.id,
    email: user.email,
    expiresIn: JWT_EXPIRES_IN,
    tokenPreview: `${token.substring(0, 20)}...${token.substring(token.length - 20)}`,
    tokenLength: token.length,
    JWT_SECRET_defined: !!jwtSecret,
    JWT_SECRET_source: process.env.JWT_SECRET ? 'process.env.JWT_SECRET' : 'development fallback',
    JWT_SECRET_preview: jwtSecret ? `${jwtSecret.substring(0, 10)}...` : 'undefined',
    timestamp: new Date().toISOString()
  });

  // SECURITY FIX: Log success without exposing sensitive data
  logger.audit('login_success', user.id, { role: user.role, isMobile, clientIP });

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

  try {
    const decoded = jwt.verify(token, getJwtSecret());
    logger.debug('Auth verification - token decoded');

    // Verify user still exists
    const connection = await pool.getConnection();
    const [rows] = await connection.execute(
      'SELECT id, email, role, is_active, first_name, last_name FROM app_users WHERE id = ?',
      [decoded.userId]
    );
    connection.release();

    if (rows.length === 0 || !rows[0].is_active) {
      logger.debug('Auth verification failed - user not found or inactive');
      return res.json({
        authenticated: false,
        reason: 'user_not_found_or_inactive',
        message: 'User account not found or inactive'
      });
    }

    const user = rows[0];
    logger.debug('Auth verification successful');

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: user.is_active
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

      const newToken = jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
      const newRefreshToken = jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

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
      logger.error('Database error in token refresh', dbError);
      return next(ServerError.database('token refresh'));
    }
  });
});

// Register from invitation (streamlined version using services)
export const registerFromInvitation = asyncHandler(async (req, res) => {
  logger.debug('Registration from invitation started', { method: req.method, path: req.path });

  const { invitationToken, additionalData = {} } = req.body;

  if (!invitationToken) {
    logger.debug('Registration failed - missing invitation token');
    throw ValidationError.missingField('invitationToken');
  }

  logger.debug('Registration: validating invitation token');

  // SECURITY FIX: Removed test token backdoor - all tokens must be validated properly

  // Import services dynamically to avoid circular dependencies
  const { AlumniDataIntegrationService } = await import('../src/services/AlumniDataIntegrationService.js');
  const { StreamlinedRegistrationService } = await import('../src/services/StreamlinedRegistrationService.js');

  // Initialize services (EmailService is optional and not available on server side)
  logger.debug('Registration: initializing services');
  const alumniService = new AlumniDataIntegrationService(pool);
  const registrationService = new StreamlinedRegistrationService(pool, alumniService);

  // First validate the invitation to determine registration path
  const validation = await registrationService.validateInvitationWithAlumniData(invitationToken);

  if (!validation.isValid) {
    logger.debug('Registration failed - invalid invitation');
    throw ValidationError.invalidData({ reason: 'Invalid or expired invitation' });
  }

  let user;
  if (validation.canOneClickJoin) {
    // One-click registration with complete alumni data
    logger.debug('Registration: using one-click registration');
    user = await registrationService.completeStreamlinedRegistration(invitationToken, additionalData);
  } else {
    // Registration requiring additional user data
    logger.debug('Registration: using incomplete data registration');
    user = await registrationService.handleIncompleteAlumniData(invitationToken, additionalData);
  }

  logger.audit('registration_completed', user.id, { hasAlumniData: validation.canOneClickJoin });

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
  logger.debug('Creating default preferences for new user');
  const { createDefaultPreferences } = await import('./preferences.js');
  try {
    await createDefaultPreferences(userId);
    logger.debug('Default preferences created successfully');
  } catch (prefError) {
    logger.warn('Failed to create default preferences', prefError);
    // Don't fail registration if preference creation fails
  }

  // CRITICAL FIX: Create family members from invitation data
  // This was missing - causing only 1 record instead of multiple family members
  if (invitationId) {
    try {
      logger.debug(`Fetching invitation ${invitationId} to create family members`);

      let childrenProfiles = [];

      // First try FAMILY_INVITATIONS table
      const [familyInvitationRows] = await connection.execute(
        'SELECT children_profiles FROM FAMILY_INVITATIONS WHERE id = ?',
        [invitationId]
      );

      if (familyInvitationRows.length > 0 && familyInvitationRows[0].children_profiles) {
        childrenProfiles = JSON.parse(familyInvitationRows[0].children_profiles || '[]');
        logger.debug(`Found ${childrenProfiles.length} family members in FAMILY_INVITATIONS`);
      } else {
        // Fallback: check USER_INVITATIONS.invitation_data for familyMembers
        logger.debug('No data in FAMILY_INVITATIONS, checking USER_INVITATIONS...');
        const [userInvitationRows] = await connection.execute(
          'SELECT invitation_data FROM USER_INVITATIONS WHERE id = ?',
          [invitationId]
        );

        if (userInvitationRows.length > 0 && userInvitationRows[0].invitation_data) {
          try {
            const invitationData = JSON.parse(userInvitationRows[0].invitation_data || '{}');
            // Check for familyMembers array in invitation_data
            if (invitationData.familyMembers && Array.isArray(invitationData.familyMembers)) {
              childrenProfiles = invitationData.familyMembers;
              logger.debug(`Found ${childrenProfiles.length} family members in USER_INVITATIONS.invitation_data`);
            } else if (invitationData.children && Array.isArray(invitationData.children)) {
              childrenProfiles = invitationData.children;
              logger.debug(`Found ${childrenProfiles.length} family members in USER_INVITATIONS.invitation_data.children`);
            }
          } catch (parseError) {
            logger.warn('Failed to parse USER_INVITATIONS.invitation_data:', parseError);
          }
        }
      }

      if (childrenProfiles.length > 0) {
        logger.debug(`Creating ${childrenProfiles.length} family members for user ${userId}`);

        // Mark this account as a family account
        await connection.execute(
          `UPDATE app_users
           SET is_family_account = TRUE, family_account_type = 'parent'
           WHERE id = ?`,
          [userId]
        );

        // Create family members for each profile in the invitation
        let primaryMemberId = null;
        for (let i = 0; i < childrenProfiles.length; i++) {
          const profile = childrenProfiles[i];
          const memberId = generateUUID();

          // Calculate age and access levels
          let age = null;
          let canAccess = true;
          let requiresConsent = false;
          let accessLevel = 'full';

          if (profile.birthDate) {
            const today = new Date();
            const birth = new Date(profile.birthDate);
            age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
              age--;
            }

            // COPPA compliance: under 14 = blocked, 14-17 = needs consent, 18+ = full
            if (age < 14) {
              canAccess = false;
              accessLevel = 'blocked';
            } else if (age < 18) {
              requiresConsent = true;
              accessLevel = 'supervised';
              // Auto-grant consent if parent registered them
              canAccess = true;
            }
          }

          const isPrimary = i === 0; // First profile is primary

          logger.debug(`Creating family member ${i + 1}/${childrenProfiles.length}: ${profile.firstName} ${profile.lastName}`);

          await connection.execute(
            `INSERT INTO FAMILY_MEMBERS (
              id, parent_user_id, first_name, last_name, display_name,
              birth_date, current_age, can_access_platform, requires_parent_consent,
              parent_consent_given, parent_consent_date, access_level,
              relationship, is_primary_contact, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              memberId,
              userId,
              profile.firstName || firstName,
              profile.lastName || lastName,
              profile.displayName || `${profile.firstName || firstName} ${profile.lastName || lastName}`,
              profile.birthDate || null,
              age,
              canAccess ? 1 : 0,
              requiresConsent ? 1 : 0,
              requiresConsent ? 1 : 0, // Auto-grant consent for parent-registered children
              requiresConsent ? new Date() : null,
              accessLevel,
              profile.relationship || 'child',
              isPrimary ? 1 : 0,
              canAccess ? 'active' : (requiresConsent ? 'pending_consent' : 'blocked')
            ]
          );

          if (isPrimary) {
            primaryMemberId = memberId;
          }

          logger.debug(`Created family member: ${memberId}`);
        }

        // Set primary family member
        if (primaryMemberId) {
          await connection.execute(
            'UPDATE app_users SET primary_family_member_id = ? WHERE id = ?',
            [primaryMemberId, userId]
          );
          logger.debug(`Set primary family member: ${primaryMemberId}`);
        }

        logger.info(`Successfully created ${childrenProfiles.length} family members for user ${userId}`);
      } else {
        logger.warn(`No family members found in invitation ${invitationId} (checked FAMILY_INVITATIONS and USER_INVITATIONS)`);
      }
    } catch (familyError) {
      logger.error('Failed to create family members:', familyError);
      logger.error('Family error details:', familyError.message);
      // Don't fail registration if family member creation fails
      // The user account was created successfully
    }
  }

  connection.release();

  res.status(201).json({ success: true, user });
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

  const connection = await pool.getConnection();
  try {
    // Check if user exists
    const [users] = await connection.execute(
      'SELECT id, email, first_name, last_name FROM app_users WHERE email = ?',
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

  const connection = await pool.getConnection();
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

  const connection = await pool.getConnection();
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
      'UPDATE app_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
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
// ============================================================================
// OTP ROUTES IMPLEMENTATION
// ============================================================================
// Backend routes for One-Time Password authentication
// Supports email, SMS, and TOTP multi-factor authentication

import mysql from 'mysql2/promise';
import { emailService } from '../utils/emailService.js';
import crypto from 'crypto';

// Get database pool - will be passed from main server
let pool = null;

export function setOTPPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// OTP GENERATION
// ============================================================================

// Helper function to generate random 6-digit OTP
function generateRandomOTP() {
  // Use crypto.randomInt() for cryptographically secure random number generation
  return crypto.randomInt(100000, 1000000).toString();
}

// NEW: Generate and send OTP in one step (for admin testing and user login)
export const generateAndSendOTP = async (req, res) => {
  console.log('🔍 [DEBUG] generateAndSendOTP called with body:', req.body);

  try {
    const { email, type = 'email' } = req.body;
    console.log('🔍 [DEBUG] Extracted email:', email, 'type:', type);

    if (!email) {
      console.log('❌ [DEBUG] Email validation failed - no email provided');
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    console.log('🔍 [DEBUG] Checking database connection...');
    // Check rate limit - max 3 OTPs per hour
    const connection = await pool.getConnection();
    console.log('✅ [DEBUG] Database connection obtained');

    const [rateLimitRows] = await connection.execute(`
      SELECT COUNT(*) as attempts
      FROM OTP_TOKENS
      WHERE email = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [email]);
    console.log('🔍 [DEBUG] Rate limit query result:', rateLimitRows);

    const attempts = rateLimitRows[0]?.attempts || 0;
    console.log('🔍 [DEBUG] Current attempts:', attempts);

    if (attempts >= 3) {
      connection.release();
      console.log('❌ [DEBUG] Rate limit exceeded');
      return res.status(429).json({
        error: 'Rate limit exceeded. Please try again later.',
        remainingAttempts: 0
      });
    }

    // Generate random 6-digit OTP
    const otpCode = generateRandomOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');
    console.log('🔍 [DEBUG] Generated OTP code, expiry minutes:', expiryMinutes);

    // Get user ID if user exists
    console.log('🔍 [DEBUG] Querying for user ID...');
    const [userRows] = await connection.execute(
      'SELECT id FROM app_users WHERE email = ?',
      [email]
    );
    console.log('🔍 [DEBUG] User query result:', userRows);

    const userId = userRows.length > 0 ? userRows[0].id : null;
    console.log('🔍 [DEBUG] User ID:', userId);

    // Insert OTP token - use MySQL NOW() + INTERVAL for expiration to avoid timezone issues
    console.log('🔍 [DEBUG] Inserting OTP token...');
    const [insertResult] = await connection.execute(`
      INSERT INTO OTP_TOKENS (
        email, otp_code, token_type, user_id,
        expires_at, created_at
      ) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
    `, [email, otpCode, 'login', userId, expiryMinutes]);
    console.log('✅ [DEBUG] OTP token inserted successfully, insertId:', insertResult.insertId);

    connection.release();
    console.log('🔍 [DEBUG] Database connection released');

    // Send OTP via email
    console.log('🔍 [DEBUG] Sending OTP email...');
    try {
      await emailService.sendOTPEmail(email, otpCode, expiryMinutes);
      console.log('✅ [DEBUG] OTP email sent successfully');
    } catch (emailError) {
      console.error('❌ [DEBUG] Email send error (OTP still generated):', emailError);
    }

    // Calculate expiry time for response
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    // Log success in development mode (without exposing OTP code)
    if (process.env.NODE_ENV === 'development') {
      console.log(`📧 OTP generated and sent to ${email} (expires: ${expiresAt.toLocaleString()})`);
    }

    console.log('✅ [DEBUG] generateAndSendOTP completed successfully');
    res.json({
      success: true,
      message: 'OTP generated and sent successfully',
      expiresAt: expiresAt.toISOString()
    });

  } catch (error) {
    console.error('❌ [DEBUG] Generate and send OTP error:', error);
    console.error('❌ [DEBUG] Error stack:', error.stack);
    console.error('❌ [DEBUG] Error message:', error.message);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
};

// LEGACY: Manual OTP generation (requires OTP code to be provided) - DEPRECATED
export const generateOTP = async (req, res) => {
  return res.status(410).json({
    error: 'This endpoint is deprecated. Use /api/otp/generate-and-send instead.'
  });
};

// ============================================================================
// OTP VALIDATION
// ============================================================================

export const validateOTP = async (req, res) => {
  try {
    const { email, otpCode, tokenType } = req.body;

    if (!email || !otpCode || !tokenType) {
      return res.status(400).json({
        error: 'Email, OTP code, and token type are required'
      });
    }

    const connection = await pool.getConnection();

    // Find valid OTP token
    const [rows] = await connection.execute(`
      SELECT id, otp_code, expires_at, attempt_count, is_used
      FROM OTP_TOKENS
      WHERE email = ?
        AND token_type = ?
        AND expires_at > NOW()
        AND is_used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `, [email, tokenType]);

    if (rows.length === 0) {
      connection.release();
      return res.json({
        isValid: false,
        token: null,
        remainingAttempts: 3,  // User gets full attempts even if no token exists
        errors: ['No valid OTP found'],
        isExpired: false,
        isRateLimited: false
      });
    }

    const token = rows[0];
    const maxAttempts = 3;
    const currentAttempts = token.attempt_count || 0;

    // Check if max attempts exceeded
    if (currentAttempts >= maxAttempts) {
      connection.release();
      return res.json({
        isValid: false,
        token: { id: token.id },
        remainingAttempts: 0,
        errors: ['Maximum verification attempts exceeded'],
        isExpired: false,
        isRateLimited: true
      });
    }

    // Check OTP code
    const isValid = token.otp_code === otpCode;

    if (isValid) {
      // Mark as used
      await connection.execute(
        'UPDATE OTP_TOKENS SET is_used = TRUE, used_at = NOW() WHERE id = ?',
        [token.id]
      );

      connection.release();

      return res.json({
        isValid: true,
        token: { id: token.id },
        remainingAttempts: maxAttempts - currentAttempts - 1,
        errors: [],
        isExpired: false,
        isRateLimited: false
      });
    } else {
      // Increment attempt count
      const newAttempts = currentAttempts + 1;
      await connection.execute(
        'UPDATE OTP_TOKENS SET attempt_count = ?, last_attempt_at = NOW() WHERE id = ?',
        [newAttempts, token.id]
      );

      connection.release();

      return res.json({
        isValid: false,
        token: { id: token.id },
        remainingAttempts: maxAttempts - newAttempts,
        errors: ['Invalid OTP code'],
        isExpired: false,
        isRateLimited: false
      });
    }

  } catch (error) {
    console.error('Validate OTP error:', error);
    res.status(500).json({
      isValid: false,
      token: null,
      remainingAttempts: 3,  // User gets full attempts even on error
      errors: ['OTP validation failed'],
      isExpired: false,
      isRateLimited: false
    });
  }
};

// ============================================================================
// OTP UTILITY ENDPOINTS
// ============================================================================

// LEGACY: Manual OTP sending (requires OTP code to be provided) - DEPRECATED
export const sendOTP = async (req, res) => {
  return res.status(410).json({
    error: 'This endpoint is deprecated. OTP generation and sending is now combined in /api/otp/generate-and-send.'
  });
};

export const getRemainingAttempts = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    // Get the most recent active OTP token for this email
    const [rows] = await connection.execute(`
      SELECT attempt_count
      FROM OTP_TOKENS
      WHERE email = ?
        AND is_used = FALSE
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `, [email]);

    connection.release();

    const maxAttempts = 3;
    
    // If no active token exists, user can make full 3 attempts
    if (rows.length === 0) {
      return res.json({ 
        remainingAttempts: maxAttempts,
        maxAttempts: maxAttempts
      });
    }

    // Calculate remaining attempts from the most recent token
    const attemptCount = rows[0]?.attempt_count || 0;
    const remaining = Math.max(0, maxAttempts - attemptCount);

    res.json({ 
      remainingAttempts: remaining,
      maxAttempts: maxAttempts
    });

  } catch (error) {
    console.error('Get remaining attempts error:', error);
    res.status(500).json({ error: 'Failed to get remaining attempts' });
  }
};

export const getDailyCount = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    // Count OTPs sent today
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM OTP_TOKENS
      WHERE email = ?
        AND DATE(created_at) = CURDATE()
    `, [email]);

    connection.release();

    res.json({ count: rows[0]?.count || 0 });

  } catch (error) {
    console.error('Get daily count error:', error);
    res.status(500).json({ error: 'Failed to get daily count' });
  }
};

export const checkRateLimit = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    // Count recent OTPs in last hour
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as attempts
      FROM OTP_TOKENS
      WHERE email = ?
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [email]);

    connection.release();

    const attempts = rows[0]?.attempts || 0;
    const maxPerHour = 3;

    res.json({ attempts, allowed: attempts < maxPerHour });

  } catch (error) {
    console.error('Check rate limit error:', error);
    res.status(500).json({ error: 'Failed to check rate limit' });
  }
};

export const resetDailyLimit = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // In a real implementation, this would reset daily counters
    // For now, just return success
    res.json({ success: true, message: 'Daily limit reset' });

  } catch (error) {
    console.error('Reset daily limit error:', error);
    res.status(500).json({ error: 'Failed to reset daily limit' });
  }
};

export const incrementDailyCount = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // In a real implementation, this would increment counters
    // For now, just return success
    res.json({ success: true });

  } catch (error) {
    console.error('Increment daily count error:', error);
    res.status(500).json({ error: 'Failed to increment daily count' });
  }
};

export const cleanupExpired = async (req, res) => {
  try {
    const connection = await pool.getConnection();

    // Delete expired OTP tokens
    const [result] = await connection.execute(
      'DELETE FROM OTP_TOKENS WHERE expires_at < NOW()'
    );

    connection.release();

    res.json({
      success: true,
      deletedCount: result.affectedRows
    });

  } catch (error) {
    console.error('Cleanup expired OTPs error:', error);
    res.status(500).json({ error: 'Failed to cleanup expired OTPs' });
  }
};

// ============================================================================
// MULTI-FACTOR OTP ENDPOINTS (Task 8.2.2)
// ============================================================================

export const setupTOTP = async (req, res) => {
  try {
    const { email, secret } = req.body;

    if (!email || !secret) {
      return res.status(400).json({ error: 'Email and secret are required' });
    }

    const connection = await pool.getConnection();

    // Check if TOTP already exists for user
    const [existing] = await connection.execute(
      'SELECT id FROM USER_TOTP_SECRETS WHERE user_id = (SELECT id FROM app_users WHERE email = ?) AND is_active = TRUE',
      [email]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'TOTP already setup for this user' });
    }

    // Get user ID
    const [userRows] = await connection.execute(
      'SELECT id FROM app_users WHERE email = ?',
      [email]
    );

    if (userRows.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userRows[0].id;

    // Insert TOTP secret
    await connection.execute(`
      INSERT INTO USER_TOTP_SECRETS (
        user_id, secret, created_at
      ) VALUES (?, ?, NOW())
    `, [userId, secret]);

    connection.release();

    res.json({
      success: true,
      message: 'TOTP setup successfully'
    });

  } catch (error) {
    console.error('Setup TOTP error:', error);
    res.status(500).json({ error: 'Failed to setup TOTP' });
  }
};

export const getTOTPStatus = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.execute(`
      SELECT uts.id, uts.is_active, uts.last_used
      FROM USER_TOTP_SECRETS uts
      JOIN app_users u ON u.id = uts.user_id
      WHERE u.email = ? AND uts.is_active = TRUE
      ORDER BY uts.created_at DESC
      LIMIT 1
    `, [email]);

    connection.release();

    res.json({
      hasTOTP: rows.length > 0,
      lastUsed: rows[0]?.last_used || null
    });

  } catch (error) {
    console.error('Get TOTP status error:', error);
    res.status(500).json({ error: 'Failed to get TOTP status' });
  }
};

export const getOTPUserProfile = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      'SELECT phone_number FROM app_users WHERE email = ?',
      [email]
    );

    connection.release();

    res.json({
      phoneNumber: rows[0]?.phone_number || null
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};
// Get active OTP for an email (if not expired and not used)
// Add new endpoint for test OTP generation (returns OTP code for testing)
export const generateTestOTP = async (req, res) => {
  try {
    const { email, tokenType = 'login' } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Only allow in development/testing environments
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Test OTP generation not allowed in production' });
    }

    const connection = await pool.getConnection();

    // Generate random 6-digit OTP
    const otpCode = generateRandomOTP();
    const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '5');

    // Get user ID if user exists
    const [userRows] = await connection.execute(
      'SELECT id FROM app_users WHERE email = ?',
      [email]
    );
    const userId = userRows.length > 0 ? userRows[0].id : null;

    // Insert OTP token
    const [result] = await connection.execute(`
      INSERT INTO OTP_TOKENS (
        email, otp_code, token_type, user_id,
        expires_at, created_at
      ) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE), NOW())
    `, [email, otpCode, tokenType, userId, expiryMinutes]);

    connection.release();

    console.log(`[TEST OTP] Generated OTP ${otpCode} for ${email}`);

    res.json({
      success: true,
      otpCode, // Return OTP code for testing
      expiresAt: new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString(),
      message: 'Test OTP generated successfully'
    });

  } catch (error) {
    console.error('Generate test OTP error:', error);
    res.status(500).json({ error: 'Failed to generate test OTP' });
  }
};

export const getActiveOTP = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    const [rows] = await connection.execute(`
      SELECT otp_code, expires_at, token_type
      FROM OTP_TOKENS
      WHERE email = ?
        AND expires_at > NOW()
        AND is_used = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `, [email]);

    connection.release();

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'No active OTP found',
        hasActiveOtp: false
      });
    }

    res.json({
      hasActiveOtp: true,
      code: rows[0].otp_code,
      expiresAt: rows[0].expires_at,
      tokenType: rows[0].token_type
    });

  } catch (error) {
    console.error('Get active OTP error:', error);
    res.status(500).json({ error: 'Failed to get active OTP' });
  }
};

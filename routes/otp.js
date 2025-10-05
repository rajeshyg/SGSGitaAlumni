// ============================================================================
// OTP ROUTES IMPLEMENTATION
// ============================================================================
// Backend routes for One-Time Password authentication
// Supports email, SMS, and TOTP multi-factor authentication

import mysql from 'mysql2/promise';

// Get database pool - will be passed from main server
let pool = null;

export function setOTPPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// OTP GENERATION
// ============================================================================

export const generateOTP = async (req, res) => {
  try {
    const { email, otpCode, tokenType, userId, phoneNumber, expiresAt } = req.body;

    if (!email || !otpCode || !tokenType) {
      return res.status(400).json({
        error: 'Email, OTP code, and token type are required'
      });
    }

    const connection = await pool.getConnection();

    // Insert OTP token
    const query = `
      INSERT INTO OTP_TOKENS (
        email, otp_code, token_type, user_id, phone_number,
        expires_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const expiresDate = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 5 * 60 * 1000);

    await connection.execute(query, [
      email,
      otpCode,
      tokenType,
      userId || null,
      phoneNumber || null,
      expiresDate
    ]);

    connection.release();

    res.json({
      success: true,
      message: 'OTP generated successfully'
    });

  } catch (error) {
    console.error('Generate OTP error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
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
        remainingAttempts: 0,
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
      remainingAttempts: 0,
      errors: ['OTP validation failed'],
      isExpired: false,
      isRateLimited: false
    });
  }
};

// ============================================================================
// OTP UTILITY ENDPOINTS
// ============================================================================

export const getRemainingAttempts = async (req, res) => {
  try {
    const { email } = req.params;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const connection = await pool.getConnection();

    // Count recent failed attempts in last hour
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as attempts
      FROM OTP_TOKENS
      WHERE email = ?
        AND last_attempt_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
        AND is_used = FALSE
    `, [email]);

    connection.release();

    const attempts = rows[0]?.attempts || 0;
    const maxAttempts = 3;
    const remaining = Math.max(0, maxAttempts - attempts);

    res.json({ remainingAttempts: remaining });

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
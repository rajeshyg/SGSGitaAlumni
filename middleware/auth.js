import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

// JWT Configuration with Lazy Initialization
// SECURITY FIX: Use lazy initialization to avoid ES6 import hoisting issues
// This ensures JWT_SECRET is read AFTER dotenv.config() completes
let JWT_SECRET = null;

function getJwtSecret() {
  if (JWT_SECRET === null) {
    // Fail fast in production if not set
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

// Get database pool - will be passed from main server
let pool = null;

export function setAuthMiddlewarePool(dbPool) {
  pool = dbPool;
}

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // SECURITY FIX: Use logger instead of console.log
    logger.debug('Auth middleware request', { path: req.path, hasToken: !!token });

    if (!token) {
      logger.debug('Auth failed: no token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, getJwtSecret(), async (err, decoded) => {
      if (err) {
        logger.debug('JWT verification failed', { error: err.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      logger.debug('JWT verified successfully');

      let connection;
      try {
        // Verify account still exists and is active
        connection = await pool.getConnection();
        const [accounts] = await connection.execute(
          'SELECT id, email, role, status FROM accounts WHERE id = ? AND status = ?',
          [decoded.accountId, 'active']
        );

        if (accounts.length === 0) {
          logger.debug('Auth failed: account not found or inactive');
          return res.status(401).json({ error: 'Account not found or inactive' });
        }

        const account = accounts[0];

        // Load user profiles for this account
        // Allow active and pending_consent profiles (so users can switch to children needing consent)
        const [profiles] = await connection.execute(
          `SELECT id, alumni_member_id, relationship, parent_profile_id, access_level, status
           FROM user_profiles
           WHERE account_id = ? AND status IN ('active', 'pending_consent')
           ORDER BY relationship DESC, created_at ASC`,
          [account.id]
        );

        // Determine active profile
        let activeProfileId = decoded.activeProfileId;
        
        // If activeProfileId from token doesn't exist in DB, use first profile
        if (activeProfileId && !profiles.some(p => p.id === activeProfileId)) {
          activeProfileId = profiles.length > 0 ? profiles[0].id : null;
        } else if (!activeProfileId && profiles.length > 0) {
          // If no activeProfileId in token, use first profile
          activeProfileId = profiles[0].id;
        }

        // Load active profile details if available
        let activeProfile = null;
        if (activeProfileId) {
          const [profileDetails] = await connection.execute(
            `SELECT id, alumni_member_id, relationship, parent_profile_id, access_level, 
                    requires_consent, parent_consent_given, consent_expiry_date
             FROM user_profiles
             WHERE id = ? AND account_id = ?`,
            [activeProfileId, account.id]
          );

          if (profileDetails.length > 0) {
            activeProfile = profileDetails[0];
            logger.debug('Active profile loaded', { profileId: activeProfileId, accessLevel: activeProfile.access_level });
          }
        }

        // Attach account and profile info to request
        req.session = {
          accountId: account.id,
          email: account.email,
          role: account.role,
          profiles: profiles.map(p => ({
            id: p.id,
            alumniMemberId: p.alumni_member_id,
            relationship: p.relationship,
            accessLevel: p.access_level
          })),
          activeProfileId,
          activeProfile
        };

        // Attach legacy user object for backward compatibility
        req.user = {
          id: account.id,
          email: account.email,
          role: account.role
        };

        logger.debug('Authentication successful', { accountId: account.id, profileCount: profiles.length });
        next();
      } catch (dbError) {
        logger.error('Auth middleware database error', dbError);
        return res.status(500).json({ error: 'Authentication database error' });
      } finally {
        if (connection) connection.release();
      }
    });
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};
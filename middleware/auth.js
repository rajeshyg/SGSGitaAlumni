import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

// JWT Configuration
// SECURITY FIX: Fail fast if JWT_SECRET not set in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development'
  ? 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'
  : null);

if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET not configured. Set JWT_SECRET environment variable.');
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

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        logger.debug('JWT verification failed', { error: err.message });
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      logger.debug('JWT verified successfully');

      try {
        // Verify user still exists and is active
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
          'SELECT id, email, role, is_active FROM app_users WHERE id = ? AND is_active = true',
          [decoded.userId]
        );
        connection.release();

        if (rows.length === 0) {
          logger.debug('Auth failed: user not found or inactive');
          return res.status(401).json({ error: 'User not found or inactive' });
        }

        // Attach user with family member context from JWT
        req.user = {
          ...rows[0],
          activeFamilyMemberId: decoded.activeFamilyMemberId || null,
          isFamilyAccount: decoded.isFamilyAccount || false
        };

        // If family member context exists in JWT, load family member details
        if (req.user.activeFamilyMemberId) {
          try {
            const [familyMembers] = await connection.execute(
              `SELECT id, parent_user_id, first_name, last_name, display_name,
                      current_age, can_access_platform, requires_parent_consent,
                      parent_consent_given, access_level
               FROM FAMILY_MEMBERS
               WHERE id = ? AND parent_user_id = ?`,
              [req.user.activeFamilyMemberId, req.user.id]
            );

            if (familyMembers.length > 0) {
              req.familyMember = familyMembers[0];
              logger.debug('Family member context loaded', {
                familyMemberId: req.familyMember.id,
                accessLevel: req.familyMember.access_level
              });
            }
          } catch (fmError) {
            // Don't fail auth if family member lookup fails - just log it
            logger.error('Failed to load family member context', fmError);
          }
        }

        logger.debug('Authentication successful');
        next();
      } catch (dbError) {
        logger.error('Auth middleware database error', dbError);
        return res.status(500).json({ error: 'Authentication database error' });
      }
    });
  } catch (error) {
    logger.error('Auth middleware error', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};
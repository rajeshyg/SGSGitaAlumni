/**
 * AGE-BASED ACCESS CONTROL MIDDLEWARE
 *
 * COPPA-compliant middleware for controlling platform access based on:
 * - User age (calculated from birth_date)
 * - Parental consent status
 * - Access level (full, supervised, blocked)
 *
 * Usage:
 *   router.get('/protected-route', authenticateToken, requirePlatformAccess(), handler);
 *   router.post('/supervised-feature', authenticateToken, requireSupervisedAccess(), handler);
 */

import db from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AuthError } from '../server/errors/ApiError.js';

/**
 * Get family member details for the authenticated user
 * @param {Object} user - req.user from authenticateToken
 * @returns {Object|null} Family member record or null
 */
async function getFamilyMemberForUser(user) {
  // Check if user has a primary family member
  if (!user.primary_family_member_id) {
    // Not a family account - allow access
    return null;
  }

  const [members] = await db.execute(
    `SELECT id, parent_user_id, current_age, can_access_platform,
            requires_parent_consent, parent_consent_given, access_level,
            first_name, last_name, birth_date
     FROM FAMILY_MEMBERS
     WHERE id = ?`,
    [user.primary_family_member_id]
  );

  return members[0] || null;
}

/**
 * MIDDLEWARE: Require platform access
 * Checks if the family member has can_access_platform flag set to true
 *
 * Blocks access if:
 * - User is under 14 years old (COPPA minimum age)
 * - User is 14-17 without parental consent
 * - Access has been explicitly revoked
 *
 * @returns {Function} Express middleware function
 */
export function requirePlatformAccess() {
  return async (req, res, next) => {
    try {
      const familyMember = await getFamilyMemberForUser(req.user);

      // If not a family account, allow access
      if (!familyMember) {
        return next();
      }

      // Check if family member can access the platform
      if (!familyMember.can_access_platform) {
        logger.security('Platform access denied - no access permission', {
          userId: req.user.id,
          familyMemberId: familyMember.id,
          age: familyMember.current_age,
          accessLevel: familyMember.access_level
        });

        // Determine specific reason for blocking
        if (familyMember.current_age < 14) {
          throw AuthError.forbidden(
            'Platform access is restricted to users 14 years and older (COPPA compliance). Please contact your parent or guardian.'
          );
        } else if (familyMember.requires_parent_consent && !familyMember.parent_consent_given) {
          throw AuthError.forbidden(
            'Parental consent is required for platform access. Please ask your parent or guardian to grant consent.'
          );
        } else {
          throw AuthError.forbidden(
            'Platform access has been restricted for this account. Please contact your parent or guardian.'
          );
        }
      }

      // Attach family member to request for downstream use
      req.familyMember = familyMember;
      next();
    } catch (error) {
      logger.error('Error in requirePlatformAccess middleware', error);
      next(error);
    }
  };
}

/**
 * MIDDLEWARE: Require supervised access (14-17 with consent)
 * Checks if the user is in supervised age range (14-17) and has valid parental consent
 *
 * Use this for features that are available to supervised users
 *
 * @returns {Function} Express middleware function
 */
export function requireSupervisedAccess() {
  return async (req, res, next) => {
    try {
      const familyMember = await getFamilyMemberForUser(req.user);

      // If not a family account, allow access
      if (!familyMember) {
        return next();
      }

      // Check if user requires parental consent (14-17 age group)
      if (!familyMember.requires_parent_consent) {
        // User is 18+ (full access) - allow
        req.familyMember = familyMember;
        return next();
      }

      // User is 14-17 - check for parental consent
      if (!familyMember.parent_consent_given) {
        logger.security('Supervised access denied - no parental consent', {
          userId: req.user.id,
          familyMemberId: familyMember.id,
          age: familyMember.current_age
        });

        throw AuthError.forbidden(
          'This feature requires parental consent. Please ask your parent or guardian to grant consent.'
        );
      }

      // Check if access level is supervised or full
      if (familyMember.access_level === 'blocked') {
        logger.security('Supervised access denied - account blocked', {
          userId: req.user.id,
          familyMemberId: familyMember.id
        });

        throw AuthError.forbidden(
          'Your account access has been restricted. Please contact your parent or guardian.'
        );
      }

      // Attach family member to request
      req.familyMember = familyMember;
      next();
    } catch (error) {
      logger.error('Error in requireSupervisedAccess middleware', error);
      next(error);
    }
  };
}

/**
 * MIDDLEWARE: Require parental consent
 * Verifies that parental consent has been explicitly given
 *
 * Use this for sensitive features that require explicit consent verification
 *
 * @returns {Function} Express middleware function
 */
export function requireParentConsent() {
  return async (req, res, next) => {
    try {
      const familyMember = await getFamilyMemberForUser(req.user);

      // If not a family account, allow access
      if (!familyMember) {
        return next();
      }

      // If user doesn't require consent (18+), allow access
      if (!familyMember.requires_parent_consent) {
        req.familyMember = familyMember;
        return next();
      }

      // User requires consent - verify it's been given
      if (!familyMember.parent_consent_given) {
        logger.security('Parent consent required but not given', {
          userId: req.user.id,
          familyMemberId: familyMember.id,
          age: familyMember.current_age
        });

        throw AuthError.forbidden(
          'Parental consent is required to use this feature. Please ask your parent or guardian to grant consent through the Family Settings.'
        );
      }

      // Verify consent hasn't expired (annual renewal)
      const [consentRecords] = await db.execute(
        `SELECT id, expires_at, is_active
         FROM PARENT_CONSENT_RECORDS
         WHERE family_member_id = ?
           AND consent_given = TRUE
           AND is_active = TRUE
         ORDER BY created_at DESC
         LIMIT 1`,
        [familyMember.id]
      );

      if (consentRecords.length > 0) {
        const consent = consentRecords[0];
        if (new Date(consent.expires_at) < new Date()) {
          logger.security('Parent consent expired', {
            userId: req.user.id,
            familyMemberId: familyMember.id,
            consentId: consent.id,
            expiredAt: consent.expires_at
          });

          throw AuthError.forbidden(
            'Parental consent has expired and requires annual renewal. Please ask your parent or guardian to renew consent.'
          );
        }
      }

      // Attach family member to request
      req.familyMember = familyMember;
      next();
    } catch (error) {
      logger.error('Error in requireParentConsent middleware', error);
      next(error);
    }
  };
}

/**
 * MIDDLEWARE: Check specific access level
 * Ensures the user has a specific access level (full or supervised)
 *
 * @param {String} level - Required access level ('full', 'supervised', or 'blocked')
 * @returns {Function} Express middleware function
 */
export function checkAccessLevel(level) {
  const validLevels = ['full', 'supervised', 'blocked'];

  if (!validLevels.includes(level)) {
    throw new Error(`Invalid access level: ${level}. Must be one of: ${validLevels.join(', ')}`);
  }

  return async (req, res, next) => {
    try {
      const familyMember = await getFamilyMemberForUser(req.user);

      // If not a family account, treat as 'full' access
      if (!familyMember) {
        if (level === 'full' || level === 'supervised') {
          return next();
        } else {
          throw AuthError.forbidden('Access denied.');
        }
      }

      // Check if family member has the required access level
      if (familyMember.access_level !== level) {
        // Allow 'full' access users to access 'supervised' features
        if (level === 'supervised' && familyMember.access_level === 'full') {
          req.familyMember = familyMember;
          return next();
        }

        logger.security('Access level check failed', {
          userId: req.user.id,
          familyMemberId: familyMember.id,
          requiredLevel: level,
          actualLevel: familyMember.access_level
        });

        throw AuthError.forbidden(
          `This feature requires ${level} access level. Your current access level is: ${familyMember.access_level}`
        );
      }

      // Attach family member to request
      req.familyMember = familyMember;
      next();
    } catch (error) {
      logger.error('Error in checkAccessLevel middleware', error);
      next(error);
    }
  };
}

/**
 * MIDDLEWARE: Ensure family member context
 * Populates req.familyMember if user is part of a family account
 * Does NOT block access - only attaches family member data
 *
 * Use this when you need family member data but don't want to block access
 *
 * @returns {Function} Express middleware function
 */
export function requireFamilyMemberContext() {
  return async (req, res, next) => {
    try {
      const familyMember = await getFamilyMemberForUser(req.user);
      req.familyMember = familyMember;
      next();
    } catch (error) {
      logger.error('Error in requireFamilyMemberContext middleware', error);
      next(error);
    }
  };
}

/**
 * Helper function to log age verification audit trail
 * Call this from middleware to create audit records
 *
 * @param {String} familyMemberId - Family member ID
 * @param {Number} age - Current age
 * @param {Date} birthDate - Birth date
 * @param {String} actionTaken - Action taken (enum value)
 * @param {String} context - Check context (enum value)
 * @param {Object} req - Express request object
 */
export async function logAgeVerificationAudit(familyMemberId, age, birthDate, actionTaken, context, req) {
  try {
    await db.execute(
      `INSERT INTO AGE_VERIFICATION_AUDIT (
        id, family_member_id, age_at_check, birth_date,
        action_taken, check_context, ip_address, user_agent, endpoint
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        familyMemberId,
        age,
        birthDate,
        actionTaken,
        context,
        req.ip || 'unknown',
        req.headers['user-agent'] || 'unknown',
        req.path
      ]
    );
  } catch (error) {
    logger.error('Failed to log age verification audit', error);
    // Don't throw - audit logging failure shouldn't block the request
  }
}

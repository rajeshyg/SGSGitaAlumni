/**
 * AGE-BASED ACCESS CONTROL MIDDLEWARE
 *
 * COPPA-compliant middleware for controlling platform access based on:
 * - User age (calculated from year_of_birth in alumni_members)
 * - Parental consent status
 * - Access level (full, supervised, blocked)
 *
 * MIGRATED: Uses accounts + user_profiles + alumni_members schema
 * (replaced legacy primary_family_member_id + FAMILY_MEMBERS references)
 *
 * Usage:
 *   router.get('/protected-route', authenticateToken, requirePlatformAccess(), handler);
 *   router.post('/supervised-feature', authenticateToken, requireSupervisedAccess(), handler);
 */

import db from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AuthError } from '../server/errors/ApiError.js';

/**
 * Get active profile details for the authenticated user
 * MIGRATED: Uses user_profiles + alumni_members instead of FAMILY_MEMBERS
 * @param {Object} user - req.user from authenticateToken
 * @returns {Object|null} Profile record or null if no profile is selected
 */
async function getActiveProfileForUser(user) {
  // Check if user has an active profile set
  if (!user.profileId && !user.active_profile_id) {
    // No active profile selected - return null
    return null;
  }

  const profileId = user.profileId || user.active_profile_id;

  // MIGRATED: Query user_profiles + alumni_members
  const [profiles] = await db.execute(
    `SELECT up.id, up.account_id, up.relationship, up.access_level, up.status,
            up.requires_consent, up.parent_consent_given,
            am.first_name, am.last_name, am.year_of_birth
     FROM user_profiles up
     JOIN alumni_members am ON up.alumni_member_id = am.id
     WHERE up.id = ?`,
    [profileId]
  );

  const profile = profiles[0];
  if (!profile) return null;

  // Calculate current age from year_of_birth
  const currentYear = new Date().getFullYear();
  const currentAge = profile.year_of_birth ? currentYear - profile.year_of_birth : null;

  return {
    ...profile,
    current_age: currentAge,
    can_access_platform: profile.status === 'active' && profile.access_level !== 'blocked'
  };
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
      // MIGRATED: Uses getActiveProfileForUser instead of getFamilyMemberForUser
      const activeProfile = await getActiveProfileForUser(req.user);

      // If no active profile, allow access (account-level access)
      if (!activeProfile) {
        return next();
      }

      // Check if profile can access the platform
      if (!activeProfile.can_access_platform) {
        logger.security('Platform access denied - no access permission', {
          userId: req.user.id,
          profileId: activeProfile.id,
          age: activeProfile.current_age,
          accessLevel: activeProfile.access_level
        });

        // Determine specific reason for blocking
        if (activeProfile.current_age < 14) {
          throw AuthError.forbidden(
            'Platform access is restricted to users 14 years and older (COPPA compliance). Please contact your parent or guardian.'
          );
        } else if (activeProfile.requires_consent && !activeProfile.parent_consent_given) {
          throw AuthError.forbidden(
            'Parental consent is required for platform access. Please ask your parent or guardian to grant consent.'
          );
        } else {
          throw AuthError.forbidden(
            'Platform access has been restricted for this account. Please contact your parent or guardian.'
          );
        }
      }

      // Attach active profile to request for downstream use
      req.activeProfile = activeProfile;
      // @deprecated: Keep familyMember for backward compatibility
      req.familyMember = activeProfile;
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
      // MIGRATED: Uses getActiveProfileForUser instead of getFamilyMemberForUser
      const activeProfile = await getActiveProfileForUser(req.user);

      // If no active profile, allow access
      if (!activeProfile) {
        return next();
      }

      // Check if user requires parental consent (14-17 age group)
      if (!activeProfile.requires_consent) {
        // User is 18+ (full access) - allow
        req.activeProfile = activeProfile;
        req.familyMember = activeProfile; // @deprecated
        return next();
      }

      // User is 14-17 - check for parental consent
      if (!activeProfile.parent_consent_given) {
        logger.security('Supervised access denied - no parental consent', {
          userId: req.user.id,
          profileId: activeProfile.id,
          age: activeProfile.current_age
        });

        throw AuthError.forbidden(
          'This feature requires parental consent. Please ask your parent or guardian to grant consent.'
        );
      }

      // Check if access level is supervised or full
      if (activeProfile.access_level === 'blocked') {
        logger.security('Supervised access denied - account blocked', {
          userId: req.user.id,
          profileId: activeProfile.id
        });

        throw AuthError.forbidden(
          'Your account access has been restricted. Please contact your parent or guardian.'
        );
      }

      // Attach active profile to request
      req.activeProfile = activeProfile;
      req.familyMember = activeProfile; // @deprecated
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
      // MIGRATED: Uses getActiveProfileForUser instead of getFamilyMemberForUser
      const activeProfile = await getActiveProfileForUser(req.user);

      // If no active profile, allow access
      if (!activeProfile) {
        return next();
      }

      // If user doesn't require consent (18+), allow access
      if (!activeProfile.requires_consent) {
        req.activeProfile = activeProfile;
        req.familyMember = activeProfile; // @deprecated
        return next();
      }

      // User requires consent - verify it's been given
      if (!activeProfile.parent_consent_given) {
        logger.security('Parent consent required but not given', {
          userId: req.user.id,
          profileId: activeProfile.id,
          age: activeProfile.current_age
        });

        throw AuthError.forbidden(
          'Parental consent is required to use this feature. Please ask your parent or guardian to grant consent through the Family Settings.'
        );
      }

      // MIGRATED: Verify consent hasn't expired (annual renewal)
      const [consentRecords] = await db.execute(
        `SELECT id, consent_expiry_date, status
         FROM PARENT_CONSENT_RECORDS
         WHERE child_profile_id = ?
           AND status = 'active'
         ORDER BY created_at DESC
         LIMIT 1`,
        [activeProfile.id]
      );

      if (consentRecords.length > 0) {
        const consent = consentRecords[0];
        if (new Date(consent.consent_expiry_date) < new Date()) {
          logger.security('Parent consent expired', {
            userId: req.user.id,
            profileId: activeProfile.id,
            consentId: consent.id,
            expiredAt: consent.consent_expiry_date
          });

          throw AuthError.forbidden(
            'Parental consent has expired and requires annual renewal. Please ask your parent or guardian to renew consent.'
          );
        }
      }

      // Attach active profile to request
      req.activeProfile = activeProfile;
      req.familyMember = activeProfile; // @deprecated
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
      // MIGRATED: Uses getActiveProfileForUser instead of getFamilyMemberForUser
      const activeProfile = await getActiveProfileForUser(req.user);

      // If no active profile, treat as 'full' access
      if (!activeProfile) {
        if (level === 'full' || level === 'supervised') {
          return next();
        } else {
          throw AuthError.forbidden('Access denied.');
        }
      }

      // Check if profile has the required access level
      if (activeProfile.access_level !== level) {
        // Allow 'full' access users to access 'supervised' features
        if (level === 'supervised' && activeProfile.access_level === 'full') {
          req.activeProfile = activeProfile;
          req.familyMember = activeProfile; // @deprecated
          return next();
        }

        logger.security('Access level check failed', {
          userId: req.user.id,
          profileId: activeProfile.id,
          requiredLevel: level,
          actualLevel: activeProfile.access_level
        });

        throw AuthError.forbidden(
          `This feature requires ${level} access level. Your current access level is: ${activeProfile.access_level}`
        );
      }

      // Attach active profile to request
      req.activeProfile = activeProfile;
      req.familyMember = activeProfile; // @deprecated
      next();
    } catch (error) {
      logger.error('Error in checkAccessLevel middleware', error);
      next(error);
    }
  };
}

/**
 * MIDDLEWARE: Ensure profile context
 * Populates req.activeProfile if user has an active profile
 * Does NOT block access - only attaches profile data
 *
 * Use this when you need profile data but don't want to block access
 *
 * @returns {Function} Express middleware function
 */
export function requireProfileContext() {
  return async (req, res, next) => {
    try {
      // MIGRATED: Uses getActiveProfileForUser instead of getFamilyMemberForUser
      const activeProfile = await getActiveProfileForUser(req.user);
      req.activeProfile = activeProfile;
      req.familyMember = activeProfile; // @deprecated
      next();
    } catch (error) {
      logger.error('Error in requireProfileContext middleware', error);
      next(error);
    }
  };
}

// @deprecated - kept for backward compatibility
export const requireFamilyMemberContext = requireProfileContext;

/**
 * Helper function to log age verification audit trail
 * Call this from middleware to create audit records
 * MIGRATED: Uses profile_id instead of family_member_id, year_of_birth instead of birth_date
 *
 * @param {String} profileId - Profile ID
 * @param {Number} age - Current age
 * @param {Number} yearOfBirth - Year of birth
 * @param {String} actionTaken - Action taken (enum value)
 * @param {String} context - Check context (enum value)
 * @param {Object} req - Express request object
 */
export async function logAgeVerificationAudit(profileId, age, yearOfBirth, actionTaken, context, req) {
  try {
    await db.execute(
      `INSERT INTO AGE_VERIFICATION_AUDIT (
        id, profile_id, age_at_check, year_of_birth,
        action_taken, check_context, ip_address, user_agent, endpoint
      ) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profileId,
        age,
        yearOfBirth,
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

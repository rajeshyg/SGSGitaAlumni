import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../server/middleware/errorHandler.js';
import { authenticateToken } from '../middleware/auth.js';
import { ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Database pool will be set by server
let pool = null;

export function setOnboardingPool(dbPool) {
  pool = dbPool;
}

/**
 * GET /api/onboarding/my-alumni
 * Get alumni records matching the logged-in user's email
 * No token needed - uses session email
 */
router.get('/my-alumni', authenticateToken, asyncHandler(async (req, res) => {
  const { email } = req.session;

  if (!email) {
    throw ValidationError.missingField('email in session');
  }

  logger.debug('Fetching alumni for logged-in user', { email });

  let connection;
  try {
    connection = await pool.getConnection();

    // Find alumni records matching user's email
    const [alumni] = await connection.execute(
      `SELECT 
         id, 
         email, 
         first_name, 
         last_name, 
         batch, 
         center_name, 
         year_of_birth,
         CASE WHEN year_of_birth IS NOT NULL 
              THEN YEAR(CURDATE()) - year_of_birth 
              ELSE NULL 
         END as age
       FROM alumni_members 
       WHERE email = ?
       ORDER BY batch DESC`,
      [email]
    );

    // Check which alumni already have profiles for this account
    const [existingProfiles] = await connection.execute(
      `SELECT alumni_member_id FROM user_profiles WHERE account_id = ?`,
      [req.session.accountId]
    );
    const claimedAlumniIds = new Set(existingProfiles.map(p => p.alumni_member_id));

    // Add COPPA status and claimed flag to each alumni
    const alumniWithStatus = alumni.map(a => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      email: a.email,
      batch: a.batch,
      centerName: a.center_name,
      yearOfBirth: a.year_of_birth,
      age: a.age,
      coppaStatus: getCoppaStatus(a.age),
      canCreateProfile: a.age === null || a.age >= 14,
      alreadyClaimed: claimedAlumniIds.has(a.id)
    }));

    res.json({
      success: true,
      email,
      alumni: alumniWithStatus
    });
  } catch (error) {
    logger.error('Fetch my-alumni error', error);
    throw ServerError.database('alumni fetch');
  } finally {
    if (connection) connection.release();
  }
}));

/**
 * GET /api/onboarding/validate-invitation/:token
 * Validate invitation token and return matching alumni with COPPA status
 */
router.get('/validate-invitation/:token', asyncHandler(async (req, res) => {
  const { token } = req.params;

  logger.debug('Validating invitation token', { token: token.substring(0, 20) + '...' });

  let connection;
  try {
    connection = await pool.getConnection();

    // Find invitation by invitation_token
    const [invitations] = await connection.execute(
      `SELECT id, email, invitation_token, status, expires_at, invitation_data, alumni_member_id 
       FROM USER_INVITATIONS
       WHERE invitation_token = ? AND status = 'pending' AND expires_at > NOW()`,
      [token]
    );

    if (invitations.length === 0) {
      logger.debug('Invitation validation failed - invalid or expired');
      return res.status(400).json({ error: 'Invalid or expired invitation' });
    }

    const invitation = invitations[0];
    
    // Parse invitation_data if present
    let invitationData = null;
    if (invitation.invitation_data) {
      try {
        invitationData = typeof invitation.invitation_data === 'string' 
          ? JSON.parse(invitation.invitation_data) 
          : invitation.invitation_data;
      } catch (e) {
        logger.warn('Failed to parse invitation_data', e);
      }
    }

    // Find matching alumni - either by alumni_member_id or by email
    let alumni;
    if (invitation.alumni_member_id) {
      // Specific alumni member targeted
      [alumni] = await connection.execute(
        `SELECT 
           id, 
           email, 
           first_name, 
           last_name, 
           batch, 
           center_name, 
           year_of_birth,
           YEAR(CURDATE()) - year_of_birth as age
         FROM alumni_members 
         WHERE id = ?`,
        [invitation.alumni_member_id]
      );
    } else {
      // Find by email (may return multiple if same email across batches)
      [alumni] = await connection.execute(
        `SELECT 
           id, 
           email, 
           first_name, 
           last_name, 
           batch, 
           center_name, 
           year_of_birth,
           YEAR(CURDATE()) - year_of_birth as age
         FROM alumni_members 
         WHERE email = ?
         ORDER BY batch DESC`,
        [invitation.email]
      );
    }

    // Add COPPA status to each alumni
    const alumniWithCoppa = alumni.map(a => ({
      id: a.id,
      firstName: a.first_name,
      lastName: a.last_name,
      batch: a.batch,
      centerName: a.center_name,
      yearOfBirth: a.year_of_birth,
      age: a.age,
      coppaStatus: getCoppaStatus(a.age),
      canCreateProfile: a.age === null || a.age >= 14
    }));

    res.json({
      valid: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        expiresAt: invitation.expires_at
      },
      alumni: alumniWithCoppa
    });
  } catch (error) {
    logger.error('Invitation validation error', error);
    throw ServerError.database('invitation validation');
  } finally {
    if (connection) connection.release();
  }
}));

/**
 * POST /api/onboarding/select-profiles
 * Create user_profiles for selected alumni members
 * Body: { selections: [{ alumniMemberId, relationship: 'parent'|'child', yearOfBirth? }] }
 */
router.post('/select-profiles', authenticateToken, asyncHandler(async (req, res) => {
  const { accountId, activeProfileId } = req.session;
  const { selections } = req.body;

  if (!selections || !Array.isArray(selections) || selections.length === 0) {
    throw ValidationError.missingField('selections');
  }

  logger.debug('Profile selection started', { accountId, count: selections.length });

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const createdProfiles = [];
    let parentProfileId = null;

    // Separate parent and child selections
    const parentSelections = selections.filter(s => s.relationship === 'parent');
    const childSelections = selections.filter(s => s.relationship === 'child');

    // Create parent profiles first
    for (const selection of parentSelections) {
      // Verify alumni exists
      const [alumni] = await connection.execute(
        'SELECT id, first_name, last_name FROM alumni_members WHERE id = ?',
        [selection.alumniMemberId]
      );

      if (alumni.length === 0) {
        throw ValidationError.invalidData({ reason: `Alumni member ${selection.alumniMemberId} not found` });
      }

      const profileId = uuidv4();
      await connection.execute(
        `INSERT INTO user_profiles 
         (id, account_id, alumni_member_id, relationship, parent_profile_id, 
          access_level, status, created_at, updated_at)
         VALUES (?, ?, ?, 'parent', NULL, 'full', 'active', NOW(), NOW())`,
        [profileId, accountId, selection.alumniMemberId]
      );

      if (!parentProfileId) {
        parentProfileId = profileId;
      }

      createdProfiles.push({
        id: profileId,
        alumniMemberId: selection.alumniMemberId,
        relationship: 'parent',
        accessLevel: 'full'
      });

      logger.debug('Parent profile created', { profileId, alumniId: selection.alumniMemberId });
    }

    // Create child profiles (linked to parent)
    for (const selection of childSelections) {
      // Verify alumni exists
      const [alumni] = await connection.execute(
        'SELECT id, first_name, last_name, year_of_birth FROM alumni_members WHERE id = ?',
        [selection.alumniMemberId]
      );

      if (alumni.length === 0) {
        throw ValidationError.invalidData({ reason: `Alumni member ${selection.alumniMemberId} not found` });
      }

      const alumnus = alumni[0];
      const age = alumnus.year_of_birth 
        ? new Date().getFullYear() - alumnus.year_of_birth 
        : null;

      // Block under 14
      if (age !== null && age < 14) {
        logger.debug('Skipping child profile - under 14', { alumniId: selection.alumniMemberId, age });
        continue;
      }

      const requiresConsent = age !== null && age < 18;
      const profileId = uuidv4();

      await connection.execute(
        `INSERT INTO user_profiles 
         (id, account_id, alumni_member_id, relationship, parent_profile_id, 
          access_level, status, requires_consent, created_at, updated_at)
         VALUES (?, ?, ?, 'child', ?, ?, 'pending', ?, NOW(), NOW())`,
        [
          profileId,
          accountId,
          selection.alumniMemberId,
          parentProfileId,
          requiresConsent ? 'supervised' : 'full',
          requiresConsent ? 1 : 0
        ]
      );

      createdProfiles.push({
        id: profileId,
        alumniMemberId: selection.alumniMemberId,
        relationship: 'child',
        accessLevel: requiresConsent ? 'supervised' : 'full',
        requiresConsent
      });

      logger.debug('Child profile created', { profileId, alumniId: selection.alumniMemberId, age });
    }

    // Update account status
    await connection.execute(
      'UPDATE accounts SET status = \'active\' WHERE id = ?',
      [accountId]
    );

    await connection.commit();

    logger.audit('profiles_created', accountId, { count: createdProfiles.length });

    res.json({
      success: true,
      profiles: createdProfiles,
      requiresConsent: createdProfiles.some(p => p.requiresConsent)
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        logger.error('Rollback error', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}));

/**
 * POST /api/onboarding/collect-yob
 * Collect/update year of birth for alumni member
 */
router.post('/collect-yob', authenticateToken, asyncHandler(async (req, res) => {
  const { alumniMemberId, yearOfBirth } = req.body;

  if (!alumniMemberId || !yearOfBirth) {
    throw ValidationError.missingField(yearOfBirth ? 'alumniMemberId' : 'yearOfBirth');
  }

  // Validate YOB
  const currentYear = new Date().getFullYear();
  if (yearOfBirth < 1900 || yearOfBirth > currentYear) {
    throw ValidationError.invalidData({ reason: 'Invalid year of birth' });
  }

  logger.debug('Collecting year of birth', { alumniMemberId, yearOfBirth });

  let connection;
  try {
    connection = await pool.getConnection();

    await connection.execute(
      'UPDATE alumni_members SET year_of_birth = ? WHERE id = ?',
      [yearOfBirth, alumniMemberId]
    );

    const age = currentYear - yearOfBirth;

    res.json({
      success: true,
      age,
      coppaStatus: getCoppaStatus(age)
    });
  } catch (error) {
    logger.error('Year of birth collection error', error);
    throw ServerError.database('year of birth update');
  } finally {
    if (connection) connection.release();
  }
}));

/**
 * POST /api/onboarding/grant-consent
 * Parent grants parental consent for child profile
 */
router.post('/grant-consent', authenticateToken, asyncHandler(async (req, res) => {
  const { accountId } = req.session;
  const { childProfileId } = req.body;

  if (!childProfileId) {
    throw ValidationError.missingField('childProfileId');
  }

  logger.debug('Granting parental consent', { accountId, childProfileId });

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Verify parent owns this child profile
    const [profiles] = await connection.execute(
      `SELECT id, parent_profile_id FROM user_profiles 
       WHERE id = ? AND account_id = ? AND relationship = 'child'`,
      [childProfileId, accountId]
    );

    if (profiles.length === 0) {
      throw ResourceError.notFound('Child profile', childProfileId);
    }

    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry

    // Update child profile
    await connection.execute(
      `UPDATE user_profiles SET 
         parent_consent_given = 1,
         consent_expiry_date = ?,
         access_level = 'supervised',
         status = 'active'
       WHERE id = ?`,
      [expiresAt, childProfileId]
    );

    // Create consent record (audit trail)
    const consentId = uuidv4();
    await connection.execute(
      `INSERT INTO PARENT_CONSENT_RECORDS 
       (id, child_profile_id, parent_account_id, consent_given_date, consent_expiry_date, status, created_at)
       VALUES (?, ?, ?, NOW(), ?, 'active', NOW())`,
      [consentId, childProfileId, accountId, expiresAt]
    );

    await connection.commit();

    logger.audit('parental_consent_granted', accountId, { childProfileId });

    res.json({
      success: true,
      profileId: childProfileId,
      consentExpiresAt: expiresAt
    });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        logger.error('Rollback error', rollbackError);
      }
    }
    throw error;
  } finally {
    if (connection) connection.release();
  }
}));

/**
 * GET /api/onboarding/profiles
 * Get user's profiles for onboarding status check
 */
router.get('/profiles', authenticateToken, asyncHandler(async (req, res) => {
  const { accountId } = req.session;

  logger.debug('Fetching onboarding profiles', { accountId });

  let connection;
  try {
    connection = await pool.getConnection();

    const [profiles] = await connection.execute(
      `SELECT 
         id, 
         alumni_member_id, 
         relationship, 
         access_level, 
         status,
         requires_consent,
         parent_consent_given,
         consent_expiry_date
       FROM user_profiles
       WHERE account_id = ?
       ORDER BY relationship DESC, created_at ASC`,
      [accountId]
    );

    const transformed = profiles.map(p => ({
      id: p.id,
      alumniMemberId: p.alumni_member_id,
      relationship: p.relationship,
      accessLevel: p.access_level,
      status: p.status,
      requiresConsent: p.requires_consent,
      consentGiven: p.parent_consent_given,
      consentExpiresAt: p.consent_expiry_date
    }));

    res.json({
      success: true,
      profiles: transformed
    });
  } catch (error) {
    logger.error('Fetch profiles error', error);
    throw ServerError.database('profile fetch');
  } finally {
    if (connection) connection.release();
  }
}));

/**
 * Helper function: Determine COPPA status based on age
 */
function getCoppaStatus(age) {
  if (age === null) return 'unknown';
  if (age < 14) return 'blocked';
  if (age < 18) return 'requires_consent';
  return 'full_access';
}

export default router;

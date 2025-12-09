import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';
import { ValidationError, ResourceError } from '../server/errors/ApiError.js';
import { getPool } from '../utils/database.js';

const router = express.Router();
// Don't initialize pool at module load time - do it lazily in route handlers
const getDbPool = () => getPool();

// JWT Configuration
let JWT_SECRET = null;

function getJwtSecret() {
  if (JWT_SECRET === null) {
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

// GET /api/family-members - list profiles for account
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const { accountId } = req.session;

  const [profiles] = await getDbPool().execute(
    `SELECT up.id, up.relationship, up.access_level, up.status, up.parent_profile_id,
            am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth
     FROM user_profiles up
     JOIN alumni_members am ON up.alumni_member_id = am.id
     WHERE up.account_id = ?
     ORDER BY up.relationship DESC, up.created_at ASC`,
    [accountId]
  );

  res.json({ success: true, data: profiles.map(mapProfileRow) });
}));

// GET /api/family-members/:id - fetch single profile
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const profile = await fetchProfile(req.session.accountId, req.params.id);
  if (!profile) {
    throw ResourceError.notFound('Profile');
  }
  res.json({ success: true, data: mapProfileRow(profile) });
}));

// POST /api/family-members - create profile (ad-hoc)
router.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { alumniMemberId, relationship, parentProfileId, yearOfBirth } = req.body;

  if (!alumniMemberId) throw ValidationError.missingField('alumniMemberId');
  if (!relationship) throw ValidationError.missingField('relationship');

  const age = yearOfBirth ? new Date().getFullYear() - Number(yearOfBirth) : null;
  if (age !== null && age < 14) {
    throw ValidationError.invalidData('Profile creation blocked for under 14 (COPPA)');
  }

  const requiresConsent = age !== null && age < 18;
  const accessLevel = requiresConsent ? 'supervised' : 'full';
  const status = requiresConsent ? 'pending_consent' : 'active';

  const id = uuidv4();
  await getDbPool().execute(
    `INSERT INTO user_profiles (
       id, account_id, alumni_member_id, relationship, parent_profile_id,
       access_level, status, requires_consent, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      id,
      req.session.accountId,
      alumniMemberId,
      relationship,
      parentProfileId || null,
      accessLevel,
      status,
      requiresConsent ? 1 : 0
    ]
  );

  const created = await fetchProfile(req.session.accountId, id);
  res.status(201).json({ success: true, data: mapProfileRow(created) });
}));

// POST /api/family-members/:id/switch - session-based active profile
router.post('/:id/switch', authenticateToken, asyncHandler(async (req, res) => {
  const profile = await fetchProfile(req.session.accountId, req.params.id);
  if (!profile) {
    throw ResourceError.notFound('Profile');
  }

  if (profile.access_level === 'blocked') {
    return res.status(403).json({ error: 'Profile access blocked' });
  }

  req.session.activeProfileId = profile.id;

  // Generate new tokens with updated activeProfileId
  const tokenPayload = {
    accountId: req.session.accountId,
    email: req.session.email,
    role: req.session.role,
    activeProfileId: profile.id
  };

  const token = jwt.sign(tokenPayload, getJwtSecret(), { 
    expiresIn: JWT_EXPIRES_IN 
  });

  const refreshTokenPayload = {
    accountId: req.session.accountId,
    activeProfileId: profile.id,
    version: uuidv4()
  };

  const refreshToken = jwt.sign(refreshTokenPayload, getJwtSecret(), { 
    expiresIn: REFRESH_TOKEN_EXPIRES_IN 
  });

  res.json({ 
    success: true, 
    activeProfile: mapProfileRow(profile),
    token,
    refreshToken
  });
}));

// POST /api/family-members/:id/consent/grant - grant consent for supervised profiles
router.post('/:id/consent/grant', authenticateToken, asyncHandler(async (req, res) => {
  const { accountId } = req.session;
  const profile = await fetchProfile(accountId, req.params.id);
  if (!profile) throw ResourceError.notFound('Profile');

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await getDbPool().execute(
    `UPDATE user_profiles SET 
       parent_consent_given = 1,
       consent_expiry_date = ?,
       access_level = 'supervised',
       status = 'active'
     WHERE id = ? AND account_id = ?`,
    [expiresAt, req.params.id, accountId]
  );

  await getDbPool().execute(
    `INSERT INTO PARENT_CONSENT_RECORDS 
       (id, child_profile_id, parent_account_id, consent_given_date, consent_expiry_date, status, created_at)
     VALUES (?, ?, ?, NOW(), ?, 'active', NOW())`,
    [uuidv4(), req.params.id, accountId, expiresAt]
  );

  const updated = await fetchProfile(accountId, req.params.id);
  res.json({ success: true, data: mapProfileRow(updated), consentExpiresAt: expiresAt });
}));

function mapProfileRow(row) {
  return {
    id: row.id,
    alumniMemberId: row.alumni_member_id,
    relationship: row.relationship,
    accessLevel: row.access_level,
    status: row.status,
    parentProfileId: row.parent_profile_id,
    firstName: row.first_name,
    lastName: row.last_name,
    batch: row.batch,
    centerName: row.center_name,
    yearOfBirth: row.year_of_birth
  };
}

async function fetchProfile(accountId, profileId) {
  const [rows] = await getDbPool().execute(
    `SELECT up.*, am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth
     FROM user_profiles up
     JOIN alumni_members am ON up.alumni_member_id = am.id
     WHERE up.id = ? AND up.account_id = ?
     LIMIT 1`,
    [profileId, accountId]
  );
  return rows[0] || null;
}

export default router;

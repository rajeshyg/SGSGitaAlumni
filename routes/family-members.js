/**
 * FAMILY MEMBERS API ROUTES
 * 
 * Endpoints for managing family member profiles
 */

import express from 'express';
import FamilyMemberService from '../server/services/FamilyMemberService.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../server/middleware/validation.js';
import { FamilyMemberCreateSchema, FamilyMemberUpdateSchema } from '../src/schemas/validation/index.js';
import { ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';

const router = express.Router();

/**
 * GET /api/family-members
 * Get all family members for the authenticated user
 */
router.get('/', authenticateToken, asyncHandler(async (req, res) => {
  const members = await FamilyMemberService.getFamilyMembers(req.user.id);
  res.json({ success: true, data: members });
}));

/**
 * GET /api/family-members/:id
 * Get a specific family member
 */
router.get('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const member = await FamilyMemberService.getFamilyMember(
    req.params.id,
    req.user.id
  );

  if (!member) {
    throw ResourceError.notFound('Family member');
  }

  res.json({ success: true, data: member });
}));

/**
 * POST /api/family-members
 * Create a new family member
 */
router.post('/', authenticateToken, validateRequest({ body: FamilyMemberCreateSchema }), asyncHandler(async (req, res) => {
  const { firstName, lastName, displayName, birthDate, relationship, profileImageUrl } = req.body;

  if (!firstName || !lastName) {
    throw ValidationError.missingField('First name and last name');
  }

  const member = await FamilyMemberService.createFamilyMember(req.user.id, {
    firstName,
    lastName,
    displayName,
    birthDate,
    relationship,
    profileImageUrl
  });

  res.status(201).json({ success: true, data: member });
}));

/**
 * PUT /api/family-members/:id
 * Update a family member profile
 */
router.put('/:id', authenticateToken, validateRequest({ body: FamilyMemberUpdateSchema }), asyncHandler(async (req, res) => {
  const member = await FamilyMemberService.updateFamilyMember(
    req.params.id,
    req.user.id,
    req.body
  );

  res.json({ success: true, data: member });
}));

/**
 * DELETE /api/family-members/:id
 * Delete a family member
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const result = await FamilyMemberService.deleteFamilyMember(
    req.params.id,
    req.user.id
  );

  res.json(result);
}));

/**
 * POST /api/family-members/:id/switch
 * Switch to a different family member profile
 * Generates new JWT with updated activeFamilyMemberId
 */
router.post('/:id/switch', authenticateToken, asyncHandler(async (req, res) => {
  console.log('[family-members] Switch profile request:', {
    userId: req.user.id,
    familyMemberId: req.params.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });

  const member = await FamilyMemberService.switchProfile(
    req.user.id,
    req.params.id,
    req.ip,
    req.get('user-agent')
  );

  console.log('[family-members] Profile switched successfully:', member);

  // Generate new JWT with updated family member context
  const jwt = (await import('jsonwebtoken')).default;
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION';
  const JWT_EXPIRES_IN = process.env.NODE_ENV === 'development' ? '24h' : (process.env.JWT_EXPIRES_IN || '1h');

  const tokenPayload = {
    userId: req.user.id,
    email: req.user.email,
    role: req.user.role,
    activeFamilyMemberId: req.params.id,
    isFamilyAccount: true
  };

  const newToken = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  res.json({
    success: true,
    data: member,
    token: newToken, // New JWT with updated family member context
    message: 'Profile switched successfully',
    expiresIn: 3600
  });
}));

/**
 * POST /api/family-members/:id/consent/grant
 * Grant parent consent for a minor
 * Body params (optional): digitalSignature, termsAccepted, termsVersion
 */
router.post('/:id/consent/grant', authenticateToken, asyncHandler(async (req, res) => {
  const consentData = {
    ipAddress: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
    digitalSignature: req.body.digitalSignature || null,
    termsAccepted: req.body.termsAccepted !== undefined ? req.body.termsAccepted : true,
    termsVersion: req.body.termsVersion || '1.0',
    verificationMethod: req.body.verificationMethod || 'email_otp'
  };

  const member = await FamilyMemberService.grantParentConsent(
    req.params.id,
    req.user.id,
    consentData
  );

  res.json({ success: true, data: member, message: 'Consent granted successfully' });
}));

/**
 * POST /api/family-members/:id/consent/revoke
 * Revoke parent consent for a minor
 * Body params (optional): reason - reason for revoking consent
 */
router.post('/:id/consent/revoke', authenticateToken, asyncHandler(async (req, res) => {
  const revocationData = {
    reason: req.body.reason || 'Consent revoked by parent'
  };

  const member = await FamilyMemberService.revokeParentConsent(
    req.params.id,
    req.user.id,
    revocationData
  );

  res.json({ success: true, data: member, message: 'Consent revoked successfully' });
}));

/**
 * POST /api/family-members/:id/birth-date
 * Update birth date and recalculate COPPA access fields
 * Used when birth_date is NULL and age verification is needed
 * Also accepts optional profile updates (currentCenter, profileImageUrl)
 */
router.post('/:id/birth-date', authenticateToken, asyncHandler(async (req, res) => {
  const { birthDate, currentCenter, profileImageUrl } = req.body;

  if (!birthDate) {
    throw ValidationError.missingField('birthDate');
  }

  // Validate date format (YYYY-MM-DD or YYYY)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const yearRegex = /^\d{4}$/;
  
  if (!dateRegex.test(birthDate) && !yearRegex.test(birthDate)) {
    throw ValidationError.invalidField('birthDate', 'Birth date must be in YYYY-MM-DD or YYYY format');
  }

  // Validate it's a valid date (if full date) or year
  let parsedDate;
  if (yearRegex.test(birthDate)) {
    parsedDate = new Date(parseInt(birthDate), 0, 1);
  } else {
    parsedDate = new Date(birthDate);
  }

  if (isNaN(parsedDate.getTime())) {
    throw ValidationError.invalidField('birthDate', 'Invalid date');
  }

  // Validate reasonable range (not in future, not more than 120 years ago)
  const today = new Date();
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 120);

  if (parsedDate > today) {
    throw ValidationError.invalidField('birthDate', 'Birth date cannot be in the future');
  }

  if (parsedDate < minDate) {
    throw ValidationError.invalidField('birthDate', 'Birth date is too far in the past');
  }

  // If additional profile fields are provided, update them first
  if (currentCenter || profileImageUrl) {
    await FamilyMemberService.updateFamilyMember(
      req.params.id,
      req.user.id,
      { currentCenter, profileImageUrl }
    );
  }

  const member = await FamilyMemberService.updateBirthDate(
    req.params.id,
    req.user.id,
    birthDate
  );

  res.json({ success: true, data: member });
}));

/**
 * GET /api/family-members/:id/consent/check
 * Check if consent renewal is needed
 */
router.get('/:id/consent/check', authenticateToken, asyncHandler(async (req, res) => {
  const result = await FamilyMemberService.checkConsentRenewal(req.params.id);
  res.json({ success: true, data: result });
}));

/**
 * GET /api/family-members/:id/consent-history
 * Get consent history for a family member (COPPA audit trail)
 */
router.get('/:id/consent-history', authenticateToken, asyncHandler(async (req, res) => {
  const member = await FamilyMemberService.getFamilyMember(
    req.params.id,
    req.user.id
  );

  if (!member) {
    throw ResourceError.notFound('Family member');
  }

  // Get all consent records for this family member
  const db = (await import('../config/database.js')).default;
  const [consentHistory] = await db.execute(
    `SELECT
      id,
      consent_given,
      consent_timestamp,
      consent_ip_address,
      consent_user_agent,
      digital_signature,
      terms_accepted,
      terms_version,
      verification_method,
      expires_at,
      revoked_at,
      revoked_reason,
      is_active,
      created_at
    FROM PARENT_CONSENT_RECORDS
    WHERE family_member_id = ?
    ORDER BY created_at DESC`,
    [req.params.id]
  );

  res.json({ success: true, data: consentHistory });
}));

/**
 * GET /api/family-members/logs/access
 * Get access logs for all family members
 */
router.get('/logs/access', authenticateToken, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = await FamilyMemberService.getAccessLogs(req.user.id, limit);
  res.json({ success: true, data: logs });
}));

export default router;

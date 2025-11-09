/**
 * FAMILY MEMBERS API ROUTES
 * 
 * Endpoints for managing family member profiles
 */

import express from 'express';
import FamilyMemberService from '../services/FamilyMemberService.js';
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
  res.json({ success: true, data: member, message: 'Profile switched successfully' });
}));

/**
 * POST /api/family-members/:id/consent/grant
 * Grant parent consent for a minor
 */
router.post('/:id/consent/grant', authenticateToken, asyncHandler(async (req, res) => {
  const member = await FamilyMemberService.grantParentConsent(
    req.params.id,
    req.user.id
  );

  res.json({ success: true, data: member, message: 'Consent granted successfully' });
}));

/**
 * POST /api/family-members/:id/consent/revoke
 * Revoke parent consent for a minor
 */
router.post('/:id/consent/revoke', authenticateToken, asyncHandler(async (req, res) => {
  const member = await FamilyMemberService.revokeParentConsent(
    req.params.id,
    req.user.id
  );

  res.json({ success: true, data: member, message: 'Consent revoked successfully' });
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
 * GET /api/family-members/logs/access
 * Get access logs for all family members
 */
router.get('/logs/access', authenticateToken, asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const logs = await FamilyMemberService.getAccessLogs(req.user.id, limit);
  res.json({ success: true, data: logs });
}));

export default router;

/**
 * FAMILY MEMBERS API ROUTES
 * 
 * Endpoints for managing family member profiles
 */

import express from 'express';
import FamilyMemberService from '../services/FamilyMemberService.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/family-members
 * Get all family members for the authenticated user
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const members = await FamilyMemberService.getFamilyMembers(req.user.id);
    res.json({ success: true, data: members });
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/family-members/:id
 * Get a specific family member
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const member = await FamilyMemberService.getFamilyMember(
      req.params.id,
      req.user.id
    );
    
    if (!member) {
      return res.status(404).json({ success: false, error: 'Family member not found' });
    }
    
    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Error fetching family member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/family-members
 * Create a new family member
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, displayName, birthDate, relationship, profileImageUrl } = req.body;
    
    if (!firstName || !lastName) {
      return res.status(400).json({ 
        success: false, 
        error: 'First name and last name are required' 
      });
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
  } catch (error) {
    console.error('Error creating family member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/family-members/:id
 * Update a family member profile
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const member = await FamilyMemberService.updateFamilyMember(
      req.params.id,
      req.user.id,
      req.body
    );
    
    res.json({ success: true, data: member });
  } catch (error) {
    console.error('Error updating family member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/family-members/:id
 * Delete a family member
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await FamilyMemberService.deleteFamilyMember(
      req.params.id,
      req.user.id
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting family member:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/family-members/:id/switch
 * Switch to a different family member profile
 */
router.post('/:id/switch', authenticateToken, async (req, res) => {
  try {
    const member = await FamilyMemberService.switchProfile(
      req.user.id,
      req.params.id,
      req.ip,
      req.get('user-agent')
    );
    
    res.json({ success: true, data: member, message: 'Profile switched successfully' });
  } catch (error) {
    console.error('Error switching profile:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/family-members/:id/consent/grant
 * Grant parent consent for a minor
 */
router.post('/:id/consent/grant', authenticateToken, async (req, res) => {
  try {
    const member = await FamilyMemberService.grantParentConsent(
      req.params.id,
      req.user.id
    );
    
    res.json({ success: true, data: member, message: 'Consent granted successfully' });
  } catch (error) {
    console.error('Error granting consent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/family-members/:id/consent/revoke
 * Revoke parent consent for a minor
 */
router.post('/:id/consent/revoke', authenticateToken, async (req, res) => {
  try {
    const member = await FamilyMemberService.revokeParentConsent(
      req.params.id,
      req.user.id
    );
    
    res.json({ success: true, data: member, message: 'Consent revoked successfully' });
  } catch (error) {
    console.error('Error revoking consent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/family-members/:id/consent/check
 * Check if consent renewal is needed
 */
router.get('/:id/consent/check', authenticateToken, async (req, res) => {
  try {
    const result = await FamilyMemberService.checkConsentRenewal(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error checking consent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/family-members/logs/access
 * Get access logs for all family members
 */
router.get('/logs/access', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await FamilyMemberService.getAccessLogs(req.user.id, limit);
    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

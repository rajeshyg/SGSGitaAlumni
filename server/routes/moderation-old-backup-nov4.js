/**
 * Moderation API Routes
 * 
 * Handles posting moderation workflow:
 * - GET /api/moderation/queue - Get moderation queue with filters
 * - POST /api/moderation/approve - Approve a posting
 * - POST /api/moderation/reject - Reject a posting with feedback
 * - POST /api/moderation/escalate - Escalate a posting to admins
 * - GET /api/moderation/posting/:id - Get full posting details with history
 * 
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

import express from 'express';
import { getPool } from '../../utils/database.js';
import { z } from 'zod';

const router = express.Router();
const pool = getPool();

// Helper function for queries
const query = async (sql, params) => {
  const [rows] = await pool.query(sql, params);
  return rows;
};

// Validation schemas
const ApproveRequestSchema = z.object({
  postingId: z.string().uuid(),
  moderatorNotes: z.string().optional(),
  expiryDate: z.string().datetime().optional()
});

const RejectRequestSchema = z.object({
  postingId: z.string().uuid(),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'DUPLICATE', 'SCAM', 'INCOMPLETE', 'OTHER']),
  feedbackToUser: z.string().min(10).max(500),
  moderatorNotes: z.string().optional()
});

const EscalateRequestSchema = z.object({
  postingId: z.string().uuid(),
  escalationReason: z.enum(['SUSPECTED_SCAM', 'POLICY_QUESTION', 'TECHNICAL_ISSUE', 'OTHER']),
  escalationNotes: z.string().min(10).max(1000)
});

const QueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  domain: z.string().uuid().optional(),
  status: z.preprocess(
    (val) => val === '' || val === 'all' ? undefined : val,
    z.enum(['PENDING', 'ESCALATED']).optional()
  ),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['oldest', 'newest', 'urgent']).default('oldest')
});

// Validation middleware
const validateRequest = (source, schema) => {
  return (req, res, next) => {
    try {
      const data = source === 'query' ? req.query : req.body;
      const validated = schema.parse(data);
      if (source === 'query') {
        req.query = validated;
      } else {
        req.body = validated;
      }
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
};

// Placeholder notification function (will be implemented in Day 5)
const sendModerationNotification = async (type, data) => {
  console.log(`[Notification] ${type}:`, data);
  // TODO: Implement actual email sending
};

/**
 * GET /api/moderation/queue
 * 
 * Get moderation queue with filtering, sorting, and pagination
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 * - domain: Filter by domain UUID
 * - status: Filter by status (PENDING, ESCALATED)
 * - search: Search in title/description
 * - sortBy: Sort order (oldest, newest, urgent)
 */
router.get('/queue', validateRequest('query', QueueQuerySchema), async (req, res) => {
  try {
    const { page, limit, domain, status, search, sortBy } = req.query;
    const offset = (page - 1) * limit;
    
    // Build WHERE clause
    let whereConditions = [];
    let queryParams = [];
    
    // Filter by status (default to PENDING and ESCALATED)
    if (status) {
      whereConditions.push('p.moderation_status COLLATE utf8mb4_unicode_ci = ?');
      queryParams.push(status);
    } else {
      whereConditions.push('p.moderation_status COLLATE utf8mb4_unicode_ci IN (?, ?)');
      queryParams.push('PENDING', 'ESCALATED');
    }
    
    // Filter by domain (through POSTING_DOMAINS junction table)
    if (domain) {
      whereConditions.push('pd.domain_id = ?');
      queryParams.push(domain);
    }
    
    // Search in title and content (note: table uses 'content' not 'description')
    if (search) {
      whereConditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
    }
    
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';
    
    // Build ORDER BY clause
    let orderByClause;
    switch (sortBy) {
      case 'newest':
        orderByClause = 'ORDER BY p.created_at DESC';
        break;
      case 'urgent':
        // Urgent: escalated first, then oldest
        orderByClause = 'ORDER BY (p.moderation_status = "ESCALATED") DESC, p.created_at ASC';
        break;
      case 'oldest':
      default:
        orderByClause = 'ORDER BY p.created_at ASC';
        break;
    }
    
    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total FROM POSTINGS p ${whereClause}`,
      queryParams
    );
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);
    
    // Get queue items
    const postings = await query(
      `SELECT 
        p.id,
        p.title,
        p.content as description,
        p.posting_type,
        pd.domain_id,
        p.moderation_status,
        p.created_at,
        p.expires_at,
        p.version,
        d.name as domain_name,
        u.first_name,
        u.last_name,
        u.email as submitter_email,
        u.id as submitter_id,
        (SELECT COUNT(*) 
         FROM MODERATION_HISTORY mh 
         WHERE mh.posting_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci) as moderation_count,
        (SELECT COUNT(*) 
         FROM MODERATION_HISTORY mh2 
         WHERE mh2.posting_id COLLATE utf8mb4_unicode_ci IN (SELECT id FROM POSTINGS WHERE author_id = u.id) 
         AND mh2.action = 'REJECTED') as submitter_rejection_count
      FROM POSTINGS p
      INNER JOIN app_users u ON p.author_id = u.id
      LEFT JOIN POSTING_DOMAINS pd ON p.id COLLATE utf8mb4_unicode_ci = pd.posting_id COLLATE utf8mb4_unicode_ci AND pd.is_primary = 1
      LEFT JOIN DOMAINS d ON pd.domain_id COLLATE utf8mb4_unicode_ci = d.id COLLATE utf8mb4_unicode_ci
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // Get queue statistics
    const stats = await query(
      `SELECT 
        COUNT(CASE WHEN moderation_status COLLATE utf8mb4_unicode_ci = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN moderation_status COLLATE utf8mb4_unicode_ci = 'ESCALATED' THEN 1 END) as escalated_count,
        COUNT(CASE WHEN moderation_status COLLATE utf8mb4_unicode_ci = 'PENDING' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urgent_count
      FROM POSTINGS
      WHERE moderation_status COLLATE utf8mb4_unicode_ci IN ('PENDING', 'ESCALATED')`
    );
    
    res.json({
      success: true,
      data: {
        postings,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        },
        stats: stats[0]
      }
    });
    
  } catch (error) {
    console.error('Error fetching moderation queue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch moderation queue'
    });
  }
});

/**
 * POST /api/moderation/approve
 * 
 * Approve a posting and make it visible to users
 * Uses optimistic locking to prevent concurrent moderation
 * Sends notification to posting author
 */
router.post('/approve', validateRequest('body', ApproveRequestSchema), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { postingId, moderatorNotes, expiryDate } = req.body;
    const moderatorId = req.user.id;
    
    // Get current posting with lock
    const [postings] = await connection.query(
      'SELECT * FROM POSTINGS WHERE id = ? FOR UPDATE',
      [postingId]
    );
    
    if (postings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Posting not found'
      });
    }
    
    const posting = postings[0];
    
    // Check if already moderated
    if (posting.moderation_status !== 'PENDING' && posting.moderation_status !== 'ESCALATED') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'Posting has already been moderated',
        currentStatus: posting.moderation_status
      });
    }
    
    // Calculate expiry date if not provided
    let finalExpiryDate = expiryDate;
    if (!finalExpiryDate) {
      // MAX(user_specified_date, submission_date + 30 days)
      const submissionPlus30 = new Date(posting.created_at);
      submissionPlus30.setDate(submissionPlus30.getDate() + 30);
      
      if (posting.expires_at) {
        const userDate = new Date(posting.expires_at);
        finalExpiryDate = userDate > submissionPlus30 ? userDate : submissionPlus30;
      } else {
        finalExpiryDate = submissionPlus30;
      }
    }
    
    // Update posting status
    const [updateResult] = await connection.query(
      `UPDATE POSTINGS 
       SET moderation_status = 'APPROVED',
           moderated_by = ?,
           moderated_at = NOW(),
           moderator_notes = ?,
           expires_at = ?,
           version = version + 1
       WHERE id = ? AND version = ?`,
      [moderatorId, moderatorNotes || null, finalExpiryDate, postingId, posting.version]
    );
    
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'Posting was modified by another moderator. Please refresh and try again.'
      });
    }
    
    // Insert moderation history
    await connection.query(
      `INSERT INTO MODERATION_HISTORY (posting_id, moderator_id, action, moderator_notes)
       VALUES (?, ?, 'APPROVED', ?)`,
      [postingId, moderatorId, moderatorNotes || null]
    );
    
    // Commit transaction
    await connection.commit();
    
    // Send notification (outside transaction)
    try {
      await sendModerationNotification('approval', {
        postingId,
        postingTitle: posting.title,
        authorEmail: posting.author_id, // Will need to join with users table
        moderatorName: `${req.user.first_name} ${req.user.last_name}`
      });
    } catch (notifError) {
      console.error('Failed to send approval notification:', notifError);
      // Don't fail the request if notification fails
    }
    
    res.json({
      success: true,
      message: 'Posting approved successfully',
      data: {
        postingId,
        status: 'APPROVED',
        expiresAt: finalExpiryDate
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error approving posting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve posting'
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/moderation/reject
 * 
 * Reject a posting with feedback for the author
 * Sends notification with rejection reason and feedback
 */
router.post('/reject', validateRequest('body', RejectRequestSchema), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { postingId, reason, feedbackToUser, moderatorNotes } = req.body;
    const moderatorId = req.user.id;
    
    // Get current posting with lock
    const [postings] = await connection.query(
      'SELECT * FROM POSTINGS WHERE id = ? FOR UPDATE',
      [postingId]
    );
    
    if (postings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Posting not found'
      });
    }
    
    const posting = postings[0];
    
    // Check if already moderated
    if (posting.moderation_status !== 'PENDING' && posting.moderation_status !== 'ESCALATED') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'Posting has already been moderated',
        currentStatus: posting.moderation_status
      });
    }
    
    // Update posting status
    const [updateResult] = await connection.query(
      `UPDATE POSTINGS 
       SET moderation_status = 'REJECTED',
           moderated_by = ?,
           moderated_at = NOW(),
           rejection_reason = ?,
           moderator_feedback = ?,
           moderator_notes = ?,
           version = version + 1
       WHERE id = ? AND version = ?`,
      [moderatorId, reason, feedbackToUser, moderatorNotes || null, postingId, posting.version]
    );
    
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'Posting was modified by another moderator. Please refresh and try again.'
      });
    }
    
    // Insert moderation history
    await connection.query(
      `INSERT INTO MODERATION_HISTORY (posting_id, moderator_id, action, reason, feedback_to_user, moderator_notes)
       VALUES (?, ?, 'REJECTED', ?, ?, ?)`,
      [postingId, moderatorId, reason, feedbackToUser, moderatorNotes || null]
    );
    
    // Commit transaction
    await connection.commit();
    
    // Send notification (outside transaction)
    try {
      await sendModerationNotification('rejection', {
        postingId,
        postingTitle: posting.title,
        authorEmail: posting.author_id,
        rejectionReason: reason,
        feedback: feedbackToUser,
        moderatorName: `${req.user.first_name} ${req.user.last_name}`
      });
    } catch (notifError) {
      console.error('Failed to send rejection notification:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Posting rejected successfully',
      data: {
        postingId,
        status: 'REJECTED',
        reason
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error rejecting posting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject posting'
    });
  } finally {
    connection.release();
  }
});

/**
 * POST /api/moderation/escalate
 * 
 * Escalate a posting to admin team for review
 * Sends notification to all admins
 */
router.post('/escalate', validateRequest('body', EscalateRequestSchema), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { postingId, escalationReason, escalationNotes } = req.body;
    const moderatorId = req.user.id;
    
    // Get current posting with lock
    const [postings] = await connection.query(
      'SELECT * FROM POSTINGS WHERE id = ? FOR UPDATE',
      [postingId]
    );
    
    if (postings.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: 'Posting not found'
      });
    }
    
    const posting = postings[0];
    
    // Check if already moderated (approved/rejected)
    if (posting.moderation_status === 'APPROVED' || posting.moderation_status === 'REJECTED') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'Cannot escalate an already moderated posting',
        currentStatus: posting.moderation_status
      });
    }
    
    // Update posting status
    const [updateResult] = await connection.query(
      `UPDATE POSTINGS 
       SET moderation_status = 'ESCALATED',
           moderated_by = ?,
           moderated_at = NOW(),
           moderator_notes = ?,
           version = version + 1
       WHERE id = ? AND version = ?`,
      [moderatorId, escalationNotes, postingId, posting.version]
    );
    
    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        error: 'Posting was modified by another moderator. Please refresh and try again.'
      });
    }
    
    // Insert moderation history
    await connection.query(
      `INSERT INTO MODERATION_HISTORY (posting_id, moderator_id, action, reason, moderator_notes)
       VALUES (?, ?, 'ESCALATED', ?, ?)`,
      [postingId, moderatorId, escalationReason, escalationNotes]
    );
    
    // Commit transaction
    await connection.commit();
    
    // Send notification to admins and author (outside transaction)
    try {
      await sendModerationNotification('escalation', {
        postingId,
        postingTitle: posting.title,
        authorEmail: posting.author_id,
        escalationReason,
        escalationNotes,
        moderatorName: `${req.user.first_name} ${req.user.last_name}`
      });
    } catch (notifError) {
      console.error('Failed to send escalation notification:', notifError);
    }
    
    res.json({
      success: true,
      message: 'Posting escalated to admin team successfully',
      data: {
        postingId,
        status: 'ESCALATED',
        escalationReason
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Error escalating posting:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to escalate posting'
    });
  } finally {
    connection.release();
  }
});

/**
 * GET /api/moderation/posting/:id
 * 
 * Get full posting details with submitter info and moderation history
 * Used in the review modal
 */
router.get('/posting/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get posting with submitter details
    const postings = await query(
      `SELECT 
        p.*,
        d.name as domain_name,
        u.id as submitter_id,
        u.first_name as submitter_first_name,
        u.last_name as submitter_last_name,
        u.email as submitter_email,
        u.created_at as submitter_joined_date
      FROM POSTINGS p
      INNER JOIN app_users u ON p.author_id = u.id
      LEFT JOIN POSTING_DOMAINS pd ON p.id COLLATE utf8mb4_unicode_ci = pd.posting_id COLLATE utf8mb4_unicode_ci AND pd.is_primary = 1
      LEFT JOIN DOMAINS d ON pd.domain_id COLLATE utf8mb4_unicode_ci = d.id COLLATE utf8mb4_unicode_ci
      WHERE p.id = ?`,
      [id]
    );
    
    if (postings.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Posting not found'
      });
    }
    
    const posting = postings[0];
    
    // Get submitter's moderation history stats
    const submitterStats = await query(
      `SELECT 
        COUNT(*) as total_postings,
        COUNT(CASE WHEN moderation_status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN moderation_status = 'REJECTED' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN moderation_status = 'PENDING' THEN 1 END) as pending_count
      FROM POSTINGS
      WHERE author_id = ?`,
      [posting.submitter_id]
    );
    
    // Get this posting's moderation history
    const moderationHistory = await query(
      `SELECT 
        mh.*,
        u.first_name as moderator_first_name,
        u.last_name as moderator_last_name
      FROM MODERATION_HISTORY mh
      INNER JOIN app_users u ON mh.moderator_id = u.id
      WHERE mh.posting_id = ?
      ORDER BY mh.created_at DESC`,
      [id]
    );
    
    res.json({
      success: true,
      data: {
        posting,
        submitterStats: submitterStats[0],
        moderationHistory
      }
    });
    
  } catch (error) {
    console.error('Error fetching posting details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posting details'
    });
  }
});

export default router;

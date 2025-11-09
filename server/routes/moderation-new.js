/**
 * Moderation API Routes - REWRITTEN
 * 
 * Complete rewrite addressing database schema corrections:
 * - Fixed bigint type for moderated_by and moderator_id
 * - Proper foreign key constraints
 * - Corrected collation handling
 * - Simplified queries without collation casting
 * 
 * Endpoints:
 * - GET /api/moderation/queue - Get moderation queue with filters
 * - POST /api/moderation/approve - Approve a posting
 * - POST /api/moderation/reject - Reject a posting with feedback
 * - POST /api/moderation/escalate - Escalate a posting to admins
 * - GET /api/moderation/posting/:id - Get full posting details with history
 * 
 * Date: November 4, 2025
 */

import express from 'express';
import { getPool } from '../../utils/database.js';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.js';
import { ValidationError, ResourceError, ServerError } from '../errors/ApiError.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const pool = getPool();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const QueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  domain: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ESCALATED', 'all']).default('all'),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['oldest', 'newest', 'urgent']).default('oldest')
});

const ApproveRequestSchema = z.object({
  postingId: z.string().uuid(),
  moderatorNotes: z.string().max(1000).optional(),
  expiryDate: z.string().datetime().optional()
});

const RejectRequestSchema = z.object({
  postingId: z.string().uuid(),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'DUPLICATE', 'SCAM', 'INCOMPLETE', 'OTHER']),
  feedbackToUser: z.string().min(10).max(500),
  moderatorNotes: z.string().max(1000).optional()
});

const EscalateRequestSchema = z.object({
  postingId: z.string().uuid(),
  escalationReason: z.enum(['SUSPECTED_SCAM', 'POLICY_QUESTION', 'TECHNICAL_ISSUE', 'OTHER']),
  escalationNotes: z.string().min(10).max(1000)
});

// ============================================================================
// VALIDATION MIDDLEWARE (REMOVED - USING SHARED MIDDLEWARE)
// ============================================================================

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const requireModerator = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const [rows] = await pool.query(
      'SELECT id, email, role FROM app_users WHERE id = ?',
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const rawRole = rows[0].role;
    const normalizedRole = typeof rawRole === 'string' ? rawRole.trim().toLowerCase() : '';
    const isModeratorRole = normalizedRole === 'moderator';
    const isAdminRole = normalizedRole === 'admin' || normalizedRole === 'super_admin';

    // Normalize role on the request object so downstream handlers see consistent casing
    if (req.user) {
      req.user.role = normalizedRole || rawRole;
    }

    if (!isModeratorRole && !isAdminRole) {
      return res.status(403).json({
        success: false,
        error: 'Moderator or Admin access required',
        currentRole: rawRole,
        normalizedRole,
        isModeratorRole,
        isAdminRole
      });
    }

    next();
  } catch (error) {
    console.error('Authentication check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication check failed',
      details: error.message
    });
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const sendModerationNotification = async (type, data) => {
  // TODO: Implement email notifications (Day 5)
  console.log(`[Notification] ${type}:`, data);
};

const calculateExpiryDate = (posting, customDate = null) => {
  if (customDate) {
    return new Date(customDate);
  }

  const submissionPlus30 = new Date(posting.created_at);
  submissionPlus30.setDate(submissionPlus30.getDate() + 30);

  if (posting.expires_at) {
    const userDate = new Date(posting.expires_at);
    return userDate > submissionPlus30 ? userDate : submissionPlus30;
  }

  return submissionPlus30;
};

// ============================================================================
// ROUTE: GET /api/moderation/queue
// ============================================================================

router.get('/queue',
  requireModerator,
  validateRequest({ query: QueueQuerySchema }),
  asyncHandler(async (req, res) => {
    // Parse and validate query parameters (validation middleware doesn't transform req.query)
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
    const domain = req.query.domain;
    const status = req.query.status || 'all';
    const search = req.query.search;
    const sortBy = req.query.sortBy || 'oldest';

    const offset = (page - 1) * limit;

    console.log('[MODERATION_QUEUE] Fetching queue with params:', { page, limit, domain, status, search, sortBy });

    // Build WHERE conditions
    const conditions = [];
    const params = [];

    // Status filter - using 'status' field instead of redundant 'moderation_status'
    if (status !== 'all') {
      // Map moderation status to posting status
      if (status === 'PENDING') {
        conditions.push("p.status = 'pending_review'");
      } else if (status === 'ESCALATED') {
        conditions.push("p.status = 'escalated'");
      } else {
        conditions.push('p.status = ?');
        params.push(status);
      }
    } else {
      conditions.push("p.status IN ('pending_review', 'escalated')");
    }

    // Domain filter (through junction table)
    if (domain) {
      conditions.push('pd.domain_id = ?');
      params.push(domain);
    }

    // Search filter
    if (search) {
      conditions.push('(p.title LIKE ? OR p.content LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern);
    }

    const whereClause = conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    console.log('[MODERATION_QUEUE] WHERE clause:', whereClause);
    console.log('[MODERATION_QUEUE] Query params:', params);

    // Build ORDER BY clause
    let orderByClause;
    switch (sortBy) {
      case 'newest':
        orderByClause = 'ORDER BY p.created_at DESC';
        break;
      case 'urgent':
        orderByClause = 'ORDER BY (p.status = "escalated") DESC, p.created_at ASC';
        break;
      case 'oldest':
      default:
        orderByClause = 'ORDER BY p.created_at ASC';
        break;
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(DISTINCT p.id) as total
       FROM POSTINGS p
       LEFT JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
       ${whereClause}`,
      params
    ).catch(err => {
      throw ServerError.database('fetch moderation queue count');
    });
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    console.log('[MODERATION_QUEUE] Total items found:', totalItems);

    // Get queue items with all necessary joins
    const [postings] = await pool.query(
      `SELECT DISTINCT
        p.id,
        p.title,
        p.content as description,
        p.posting_type,
        p.status as moderation_status,
        p.created_at,
        p.expires_at,
        p.version,
        u.id as submitter_id,
        u.first_name,
        u.last_name,
        u.email as submitter_email,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', d.id,
              'name', d.name,
              'domain_level', d.domain_level,
              'is_primary', pd.is_primary
            )
          )
          FROM POSTING_DOMAINS pd
          JOIN DOMAINS d ON pd.domain_id = d.id
          WHERE pd.posting_id = p.id
          ORDER BY pd.is_primary DESC, d.domain_level ASC, d.display_order ASC
        ) as domains,
        (SELECT COUNT(*)
         FROM MODERATION_HISTORY mh
         WHERE mh.posting_id = p.id) as moderation_count,
        (SELECT COUNT(*)
         FROM MODERATION_HISTORY mh2
         INNER JOIN POSTINGS p2 ON mh2.posting_id = p2.id
         WHERE p2.author_id = u.id
         AND mh2.action = 'REJECTED') as submitter_rejection_count
      FROM POSTINGS p
      INNER JOIN app_users u ON p.author_id = u.id
      ${domain ? 'INNER JOIN POSTING_DOMAINS pd_filter ON p.id = pd_filter.posting_id' : ''}
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ).catch(err => {
      throw ServerError.database('fetch moderation queue postings');
    });

    console.log('[MODERATION_QUEUE] Postings fetched:', postings.length);
    if (postings.length > 0) {
      console.log('[MODERATION_QUEUE] First posting:', { id: postings[0].id, title: postings[0].title, status: postings[0].moderation_status });
    }

    // Parse JSON fields for domains
    const parsedPostings = postings.map(posting => {
      let domains = [];
      if (posting.domains) {
        if (typeof posting.domains === 'string') {
          try { domains = JSON.parse(posting.domains); } catch (e) { }
        } else if (Array.isArray(posting.domains)) {
          domains = posting.domains;
        } else if (Buffer.isBuffer(posting.domains)) {
          try { domains = JSON.parse(posting.domains.toString()); } catch (e) { }
        }
      }
      return {
        ...posting,
        domains: Array.isArray(domains) ? domains.filter(d => d) : []
      };
    });

    // Get queue statistics - using 'status' field
    const [stats] = await pool.query(
      `SELECT
        COUNT(CASE WHEN status = 'pending_review' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'escalated' THEN 1 END) as escalated_count,
        COUNT(CASE WHEN status = 'pending_review'
              AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urgent_count
      FROM POSTINGS
      WHERE status IN ('pending_review', 'escalated')`
    ).catch(err => {
      throw ServerError.database('fetch moderation queue statistics');
    });

    res.json({
      success: true,
      data: {
        postings: parsedPostings,
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
  })
);

// ============================================================================
// ROUTE: POST /api/moderation/approve
// ============================================================================

router.post('/approve',
  requireModerator,
  validateRequest({ body: ApproveRequestSchema }),
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { postingId, moderatorNotes, expiryDate } = req.body;
      const moderatorId = req.user.id;

      // Get current posting with row lock
      const [postings] = await connection.query(
        'SELECT * FROM POSTINGS WHERE id = ? FOR UPDATE',
        [postingId]
      ).catch(err => {
        throw ServerError.database('fetch posting for approval');
      });

      if (postings.length === 0) {
        await connection.rollback();
        throw ResourceError.notFound('Posting');
      }

      const posting = postings[0];

      // Check if already moderated
      if (posting.moderation_status !== 'PENDING' && posting.moderation_status !== 'ESCALATED') {
        await connection.rollback();
        throw ValidationError.invalidData('Posting has already been moderated');
      }

      // Calculate final expiry date
      const finalExpiryDate = calculateExpiryDate(posting, expiryDate);

      // Update posting status (moderated_by is now bigint)
      const [updateResult] = await connection.query(
        `UPDATE POSTINGS
         SET moderation_status = 'APPROVED',
             status = 'active',
             moderated_by = ?,
             moderated_at = NOW(),
             moderator_notes = ?,
             expires_at = ?,
             version = version + 1
         WHERE id = ? AND version = ?`,
        [moderatorId, moderatorNotes || null, finalExpiryDate, postingId, posting.version]
      ).catch(err => {
        throw ServerError.database('update posting approval');
      });

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        throw ValidationError.invalidData('Posting was modified by another moderator. Please refresh and try again.');
      }

      // Insert moderation history (moderator_id is now bigint)
      await connection.query(
        `INSERT INTO MODERATION_HISTORY
         (posting_id, moderator_id, action, moderator_notes)
         VALUES (?, ?, 'APPROVED', ?)`,
        [postingId, moderatorId, moderatorNotes || null]
      ).catch(err => {
        throw ServerError.database('insert moderation history');
      });

      await connection.commit();

      // Send notification (async, outside transaction)
      sendModerationNotification('approval', {
        postingId,
        postingTitle: posting.title,
        authorId: posting.author_id,
        moderatorId
      }).catch(err => console.error('Notification failed:', err));

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
      throw error;
    } finally {
      connection.release();
    }
  })
);

// ============================================================================
// ROUTE: POST /api/moderation/reject
// ============================================================================

router.post('/reject',
  requireModerator,
  validateRequest({ body: RejectRequestSchema }),
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { postingId, reason, feedbackToUser, moderatorNotes } = req.body;
      const moderatorId = req.user.id;

      // Get current posting with row lock
      const [postings] = await connection.query(
        'SELECT * FROM POSTINGS WHERE id = ? FOR UPDATE',
        [postingId]
      ).catch(err => {
        throw ServerError.database('fetch posting for rejection');
      });

      if (postings.length === 0) {
        await connection.rollback();
        throw ResourceError.notFound('Posting');
      }

      const posting = postings[0];

      // Check if already moderated
      if (posting.moderation_status !== 'PENDING' && posting.moderation_status !== 'ESCALATED') {
        await connection.rollback();
        throw ValidationError.invalidData('Posting has already been moderated');
      }

      // Update posting status
      const [updateResult] = await connection.query(
        `UPDATE POSTINGS
         SET moderation_status = 'REJECTED',
             status = 'rejected',
             moderated_by = ?,
             moderated_at = NOW(),
             rejection_reason = ?,
             moderator_feedback = ?,
             moderator_notes = ?,
             version = version + 1
         WHERE id = ? AND version = ?`,
        [moderatorId, reason, feedbackToUser, moderatorNotes || null, postingId, posting.version]
      ).catch(err => {
        throw ServerError.database('update posting rejection');
      });

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        throw ValidationError.invalidData('Posting was modified by another moderator. Please refresh and try again.');
      }

      // Insert moderation history
      await connection.query(
        `INSERT INTO MODERATION_HISTORY
         (posting_id, moderator_id, action, reason, feedback_to_user, moderator_notes)
         VALUES (?, ?, 'REJECTED', ?, ?, ?)`,
        [postingId, moderatorId, reason, feedbackToUser, moderatorNotes || null]
      ).catch(err => {
        throw ServerError.database('insert moderation history');
      });

      await connection.commit();

      // Send notification
      sendModerationNotification('rejection', {
        postingId,
        postingTitle: posting.title,
        authorId: posting.author_id,
        rejectionReason: reason,
        feedback: feedbackToUser,
        moderatorId
      }).catch(err => console.error('Notification failed:', err));

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
      throw error;
    } finally {
      connection.release();
    }
  })
);

// ============================================================================
// ROUTE: POST /api/moderation/escalate
// ============================================================================

router.post('/escalate',
  requireModerator,
  validateRequest({ body: EscalateRequestSchema }),
  asyncHandler(async (req, res) => {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const { postingId, escalationReason, escalationNotes } = req.body;
      const moderatorId = req.user.id;

      // Get current posting with row lock
      const [postings] = await connection.query(
        'SELECT * FROM POSTINGS WHERE id = ? FOR UPDATE',
        [postingId]
      ).catch(err => {
        throw ServerError.database('fetch posting for escalation');
      });

      if (postings.length === 0) {
        await connection.rollback();
        throw ResourceError.notFound('Posting');
      }

      const posting = postings[0];

      // Cannot escalate already approved/rejected postings
      if (posting.moderation_status === 'APPROVED' || posting.moderation_status === 'REJECTED') {
        await connection.rollback();
        throw ValidationError.invalidData('Cannot escalate an already moderated posting');
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
      ).catch(err => {
        throw ServerError.database('update posting escalation');
      });

      if (updateResult.affectedRows === 0) {
        await connection.rollback();
        throw ValidationError.invalidData('Posting was modified by another moderator. Please refresh and try again.');
      }

      // Insert moderation history
      await connection.query(
        `INSERT INTO MODERATION_HISTORY
         (posting_id, moderator_id, action, reason, moderator_notes)
         VALUES (?, ?, 'ESCALATED', ?, ?)`,
        [postingId, moderatorId, escalationReason, escalationNotes]
      ).catch(err => {
        throw ServerError.database('insert moderation history');
      });

      await connection.commit();

      // Send notification to admins
      sendModerationNotification('escalation', {
        postingId,
        postingTitle: posting.title,
        authorId: posting.author_id,
        escalationReason,
        escalationNotes,
        moderatorId
      }).catch(err => console.error('Notification failed:', err));

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
      throw error;
    } finally {
      connection.release();
    }
  })
);

// ============================================================================
// ROUTE: GET /api/moderation/posting/:id
// ============================================================================

router.get('/posting/:id',
  requireModerator,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw ValidationError.invalidData('Invalid posting ID format');
    }

    // Get posting with submitter details
    const [postings] = await pool.query(
      `SELECT
        p.*,
        pd.domain_id,
        d.name as domain_name,
        u.id as submitter_id,
        u.first_name as submitter_first_name,
        u.last_name as submitter_last_name,
        u.email as submitter_email,
        u.created_at as submitter_joined_date
      FROM POSTINGS p
      INNER JOIN app_users u ON p.author_id = u.id
      LEFT JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id AND pd.is_primary = 1
      LEFT JOIN DOMAINS d ON pd.domain_id = d.id
      WHERE p.id = ?`,
      [id]
    ).catch(err => {
      throw ServerError.database('fetch posting details');
    });

    if (postings.length === 0) {
      throw ResourceError.notFound('Posting');
    }

    const posting = postings[0];

    // Get submitter's moderation history stats
    const [submitterStats] = await pool.query(
      `SELECT
        COUNT(*) as total_postings,
        COUNT(CASE WHEN moderation_status = 'APPROVED' THEN 1 END) as approved_count,
        COUNT(CASE WHEN moderation_status = 'REJECTED' THEN 1 END) as rejected_count,
        COUNT(CASE WHEN moderation_status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN moderation_status = 'ESCALATED' THEN 1 END) as escalated_count
      FROM POSTINGS
      WHERE author_id = ?`,
      [posting.submitter_id]
    ).catch(err => {
      throw ServerError.database('fetch submitter statistics');
    });

    // Get this posting's moderation history
    const [moderationHistory] = await pool.query(
      `SELECT
        mh.*,
        u.first_name as moderator_first_name,
        u.last_name as moderator_last_name
      FROM MODERATION_HISTORY mh
      INNER JOIN app_users u ON mh.moderator_id = u.id
      WHERE mh.posting_id = ?
      ORDER BY mh.created_at DESC`,
      [id]
    ).catch(err => {
      throw ServerError.database('fetch moderation history');
    });

    // Get all domains (primary, secondary, and areas of interest)
    const [allDomains] = await pool.query(
      `SELECT
        d.id,
        d.name,
        d.domain_level,
        pd.is_primary
      FROM POSTING_DOMAINS pd
      INNER JOIN DOMAINS d ON pd.domain_id = d.id
      WHERE pd.posting_id = ?
      ORDER BY pd.is_primary DESC, d.domain_level, d.display_order`,
      [id]
    ).catch(err => {
      throw ServerError.database('fetch posting domains');
    });

    // Map database field names to frontend expected names
    const mappedPosting = {
      ...posting,
      description: posting.content, // Map content → description
      first_name: posting.submitter_first_name,
      last_name: posting.submitter_last_name,
      submitter_email: posting.submitter_email,
      domains: allDomains // Include all domains as array
    };

    res.json({
      success: true,
      data: {
        posting: mappedPosting,
        submitterStats: submitterStats[0],
        moderationHistory
      }
    });
  })
);

export default router;

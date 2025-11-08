/**
 * Postings API Routes
 * 
 * Endpoints for managing postings (offer/seek support)
 * - GET /api/postings - List postings with filters
 * - GET /api/postings/:id - Get single posting details
 * - POST /api/postings - Create new posting
 * - PUT /api/postings/:id - Update posting
 * - DELETE /api/postings/:id - Delete posting
 * - GET /api/postings/categories - Get all categories
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { validateRequest } from '../server/middleware/validation.js';
import { PostingCreateSchema, PostingUpdateSchema } from '../src/schemas/validation/index.js';
import { ValidationError, ResourceError, ServerError } from '../server/errors/ApiError.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';

const router = express.Router();
let pool;

export const setPostingsPool = (dbPool) => {
  pool = dbPool;
};

/**
 * GET /api/postings
 * List all postings with optional filters
 * 
 * Query params:
 * - type: offer_support | seek_support
 * - category_id: UUID
 * - status: draft | pending_review | approved | active | rejected | expired
 * - domain_id: UUID (filters by posting domains)
 * - tag_id: UUID (filters by posting tags)
 * - author_id: UUID
 * - search: text search in title/content
 * - location_type: remote | in-person | hybrid
 * - urgency: low | medium | high | critical
 * - limit: number (default 20)
 * - offset: number (default 0)
 */
router.get('/', asyncHandler(async (req, res) => {
  const {
    type,
    category_id,
    status,
    domain_id,
    tag_id,
    author_id,
    search,
    location_type,
    urgency,
    limit = 20,
    offset = 0
  } = req.query;

  let query = `
    SELECT DISTINCT
      p.id,
      p.title,
      p.content,
      p.posting_type,
      p.category_id,
      pc.name as category_name,
      p.urgency_level,
      p.location,
      p.location_type,
      p.duration,
      p.contact_name,
      p.contact_email,
      p.contact_phone,
      p.status,
      p.expires_at,
      p.view_count,
      p.interest_count,
      p.max_connections,
      p.is_pinned,
      p.published_at,
      p.created_at,
      p.updated_at,
      u.first_name as author_first_name,
      u.last_name as author_last_name,
      u.email as author_email,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', d.id, 'name', d.name, 'icon', d.icon, 'color_code', d.color_code)
        )
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = p.id
      ) as domains,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'tag_type', t.tag_type)
        )
        FROM POSTING_TAGS pt
        JOIN TAGS t ON pt.tag_id = t.id
        WHERE pt.posting_id = p.id
      ) as tags
    FROM POSTINGS p
    LEFT JOIN app_users u ON p.author_id = u.id
    LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
  `;

  const conditions = [];
  const params = [];

  // Add filters
  if (type) {
    conditions.push('p.posting_type = ?');
    params.push(type);
  }

  if (category_id) {
    conditions.push('p.category_id = ?');
    params.push(category_id);
  }

  if (status) {
    conditions.push('p.status = ?');
    params.push(status);
  } else {
    // Default to only active postings if no status specified
    conditions.push("p.status IN ('active', 'approved')");
  }

  if (author_id) {
    conditions.push('p.author_id = ?');
    params.push(author_id);
  }

  if (location_type) {
    conditions.push('p.location_type = ?');
    params.push(location_type);
  }

  if (urgency) {
    conditions.push('p.urgency_level = ?');
    params.push(urgency);
  }

  if (domain_id) {
    query += ' INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id';
    conditions.push('pd.domain_id = ?');
    params.push(domain_id);
  }

  if (tag_id) {
    query += ' INNER JOIN POSTING_TAGS pt ON p.id = pt.posting_id';
    conditions.push('pt.tag_id = ?');
    params.push(tag_id);
  }

  if (search) {
    conditions.push('(MATCH(p.title, p.content) AGAINST (? IN NATURAL LANGUAGE MODE) OR p.title LIKE ? OR p.content LIKE ?)');
    params.push(search, `%${search}%`, `%${search}%`);
  }

  // Add WHERE clause
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Add ordering and pagination
  query += ' ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC';
  query += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const [postings] = await pool.query(query, params).catch(err => {
    throw ServerError.database('fetch postings');
  });

  // Parse JSON fields - handle both string and already-parsed JSON
  const parsedPostings = postings.map(posting => {
    let domains = [];
    let tags = [];

    // Handle domains - improved parsing for various formats
    if (posting.domains) {
      if (typeof posting.domains === 'string') {
        if (posting.domains.startsWith('[') || posting.domains.startsWith('{')) {
          try {
            domains = JSON.parse(posting.domains);
          } catch (e) {
            console.error('Failed to parse domains JSON:', posting.domains);
          }
        }
      } else if (Array.isArray(posting.domains)) {
        domains = posting.domains;
      } else if (Buffer.isBuffer(posting.domains)) {
        try {
          const str = posting.domains.toString();
          if (str.startsWith('[') || str.startsWith('{')) {
            domains = JSON.parse(str);
          }
        } catch (e) {
          console.error('Failed to parse domains buffer:', e);
        }
      }
    }

    // Handle tags - improved parsing for various formats
    if (posting.tags) {
      if (typeof posting.tags === 'string') {
        if (posting.tags.startsWith('[') || posting.tags.startsWith('{')) {
          try {
            tags = JSON.parse(posting.tags);
          } catch (e) {
            console.error('Failed to parse tags JSON:', posting.tags);
          }
        }
      } else if (Array.isArray(posting.tags)) {
        tags = posting.tags;
      } else if (Buffer.isBuffer(posting.tags)) {
        try {
          const str = posting.tags.toString();
          if (str.startsWith('[') || str.startsWith('{')) {
            tags = JSON.parse(str);
          }
        } catch (e) {
          console.error('Failed to parse tags buffer:', e);
        }
      }
    }

    return {
      ...posting,
      domains: domains || [],
      tags: tags || []
    };
  });

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(DISTINCT p.id) as total FROM POSTINGS p';
  if (domain_id) countQuery += ' INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id';
  if (tag_id) countQuery += ' INNER JOIN POSTING_TAGS pt ON p.id = pt.posting_id';

  if (conditions.length > 0) {
    // Remove LIMIT/OFFSET params for count
    const countParams = params.slice(0, -2);
    countQuery += ' WHERE ' + conditions.join(' AND ');
    const [countResult] = await pool.query(countQuery, countParams).catch(err => {
      throw ServerError.database('fetch postings count');
    });
    const total = countResult[0].total;

    return res.json({
      success: true,
      postings: parsedPostings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parsedPostings.length < total
      }
    });
  }

  res.json({
    success: true,
    postings: parsedPostings,
    pagination: {
      total: parsedPostings.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: false
    }
  });
}));

/**
 * GET /api/postings/categories
 * Get all posting categories
 */
router.get('/categories', asyncHandler(async (req, res) => {
  const [categories] = await pool.query(`
    SELECT
      id,
      name,
      description,
      parent_category_id,
      category_type
    FROM POSTING_CATEGORIES
    WHERE is_active = TRUE
    ORDER BY name ASC
  `).catch(err => {
    throw ServerError.database('fetch posting categories');
  });

  res.json({ success: true, categories });
}));

/**
 * GET /api/postings/my/:userId
 * Get all postings created by a specific user (regardless of status)
 * Used for "My Postings" view
 */
router.get('/my/:userId', authenticateToken, asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  // SECURITY: Ensure user can only access their own postings
  if (req.user.id.toString() !== userId.toString()) {
    throw ValidationError.unauthorized('You can only view your own postings');
  }

  const query = `
    SELECT DISTINCT
      p.id,
      p.title,
      p.content,
      p.posting_type,
      p.category_id,
      pc.name as category_name,
      p.urgency_level,
      p.location,
      p.location_type,
      p.duration,
      p.contact_name,
      p.contact_email,
      p.contact_phone,
      p.status,
      p.moderation_status,
      p.expires_at,
      p.view_count,
      p.interest_count,
      p.max_connections,
      p.is_pinned,
      p.published_at,
      p.created_at,
      p.updated_at,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', d.id, 'name', d.name, 'icon', d.icon, 'color_code', d.color_code, 'domain_level', d.domain_level)
        )
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = p.id
      ) as domains,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'tag_type', t.tag_type)
        )
        FROM POSTING_TAGS pt
        JOIN TAGS t ON pt.tag_id = t.id
        WHERE pt.posting_id = p.id
      ) as tags
    FROM POSTINGS p
    LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
    WHERE p.author_id = ?
    ORDER BY p.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const [postings] = await pool.query(query, [userId, parseInt(limit), parseInt(offset)]).catch(err => {
    throw ServerError.database('fetch user postings');
  });

  console.log(`[GET /api/postings/my/:userId] Retrieved ${postings.length} postings for user ${userId}`);
  console.log('[GET /api/postings/my/:userId] Raw postings from DB:', postings.map(p => ({ id: p.id, title: p.title, status: p.status })));

  // Parse JSON fields
  const parsedPostings = postings.map(posting => {
    let domains = [];
    let tags = [];

    // Parse domains
    if (posting.domains) {
      if (typeof posting.domains === 'string') {
        try { domains = JSON.parse(posting.domains); } catch (e) { }
      } else if (Array.isArray(posting.domains)) {
        domains = posting.domains;
      } else if (Buffer.isBuffer(posting.domains)) {
        try { domains = JSON.parse(posting.domains.toString()); } catch (e) { }
      }
    }

    // Parse tags
    if (posting.tags) {
      if (typeof posting.tags === 'string') {
        try { tags = JSON.parse(posting.tags); } catch (e) { }
      } else if (Array.isArray(posting.tags)) {
        tags = posting.tags;
      } else if (Buffer.isBuffer(posting.tags)) {
        try { tags = JSON.parse(posting.tags.toString()); } catch (e) { }
      }
    }

    return {
      ...posting,
      domains: Array.isArray(domains) ? domains.filter(d => d) : [],
      tags: Array.isArray(tags) ? tags.filter(t => t) : []
    };
  });

  res.json({
    success: true,
    postings: parsedPostings,
    pagination: {
      limit: parseInt(limit),
      offset: parseInt(offset),
      total: parsedPostings.length
    }
  });
}));

/**
 * GET /api/postings/:id
 * Get single posting with full details
 */
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const [postings] = await pool.query(`
    SELECT
      p.*,
      pc.name as category_name,
      pc.description as category_description,
      u.first_name as author_first_name,
      u.last_name as author_last_name,
      u.email as author_email,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', d.id, 'name', d.name, 'description', d.description,
                      'icon', d.icon, 'color_code', d.color_code, 'domain_level', d.domain_level)
        )
        FROM POSTING_DOMAINS pd
        JOIN DOMAINS d ON pd.domain_id = d.id
        WHERE pd.posting_id = p.id
      ) as domains,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', t.id, 'name', t.name, 'tag_type', t.tag_type)
        )
        FROM POSTING_TAGS pt
        JOIN TAGS t ON pt.tag_id = t.id
        WHERE pt.posting_id = p.id
      ) as tags,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT('id', pa.id, 'file_name', pa.file_name, 'file_type', pa.file_type,
                      'file_url', pa.file_url, 'file_size', pa.file_size, 'uploaded_at', pa.uploaded_at)
        )
        FROM POSTING_ATTACHMENTS pa
        WHERE pa.posting_id = p.id
      ) as attachments
    FROM POSTINGS p
    LEFT JOIN app_users u ON p.author_id = u.id
    LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
    WHERE p.id = ?
  `, [id]).catch(err => {
    throw ServerError.database('fetch posting');
  });

  if (postings.length === 0) {
    throw ResourceError.notFound('Posting');
  }

  const posting = postings[0];

  // Parse JSON fields - handle both valid JSON and object strings
  if (posting.domains) {
    if (typeof posting.domains === 'string') {
      if (posting.domains.startsWith('[') || posting.domains.startsWith('{')) {
        try {
          posting.domains = JSON.parse(posting.domains);
        } catch (e) {
          console.error('Failed to parse domains JSON:', posting.domains);
          posting.domains = [];
        }
      } else {
        posting.domains = [];
      }
    } else if (Array.isArray(posting.domains)) {
      posting.domains = posting.domains;
    } else {
      posting.domains = [];
    }
  } else {
    posting.domains = [];
  }

  if (posting.tags) {
    if (typeof posting.tags === 'string') {
      if (posting.tags.startsWith('[') || posting.tags.startsWith('{')) {
        try {
          posting.tags = JSON.parse(posting.tags);
        } catch (e) {
          console.error('Failed to parse tags JSON:', posting.tags);
          posting.tags = [];
        }
      } else {
        posting.tags = [];
      }
    } else if (Array.isArray(posting.tags)) {
      posting.tags = posting.tags;
    } else {
      posting.tags = [];
    }
  } else {
    posting.tags = [];
  }

  if (posting.attachments) {
    if (typeof posting.attachments === 'string') {
      if (posting.attachments.startsWith('[') || posting.attachments.startsWith('{')) {
        try {
          posting.attachments = JSON.parse(posting.attachments);
        } catch (e) {
          console.error('Failed to parse attachments JSON:', posting.attachments);
          posting.attachments = [];
        }
      } else {
        posting.attachments = [];
      }
    } else if (Array.isArray(posting.attachments)) {
      posting.attachments = posting.attachments;
    } else {
      posting.attachments = [];
    }
  } else {
    posting.attachments = [];
  }

  // Increment view count (async, don't wait)
  pool.query('UPDATE POSTINGS SET view_count = view_count + 1 WHERE id = ?', [id]).catch(console.error);

  res.json({ success: true, posting });
}));

/**
 * POST /api/postings
 * Create new posting
 * Requires authentication
 */
router.post('/', authenticateToken, validateRequest({ body: PostingCreateSchema }), asyncHandler(async (req, res) => {
  const {
    title,
    content,
    posting_type,
    category_id,
    urgency_level = 'medium',
    contact_name,
    contact_phone,
    contact_country = 'USA',
    contact_email,
    location,
    location_type = 'remote',
    duration,
    max_connections = 5,
    domain_ids = [],
    tag_ids = [],
    expires_at
  } = req.body;

  // Calculate expiry date (30 days from now if not provided)
  const expiryDate = expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const postingId = uuidv4();

  // Insert posting
  await pool.query(`
    INSERT INTO POSTINGS (
      id, author_id, title, content, posting_type, category_id,
      urgency_level, contact_name, contact_phone, contact_country,
      contact_email, location, location_type, duration,
      max_connections, expires_at, status, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review', NOW())
  `, [
    postingId,
    req.user.id,
    title,
    content,
    posting_type,
    category_id || null,
    urgency_level,
    contact_name,
    contact_phone || null,
    contact_country,
    contact_email,
    location || null,
    location_type,
    duration || null,
    max_connections,
    expiryDate
  ]).catch(err => {
    throw ServerError.database('create posting');
  });

  // Insert domain associations
  if (domain_ids.length > 0) {
    // Mark the first domain as primary (assumes frontend sends primary domain first)
    const domainValues = domain_ids.map((domain_id, index) => [
      uuidv4(),
      postingId,
      domain_id,
      index === 0 ? 1 : 0  // is_primary: 1 for first domain, 0 for others
    ]);
    await pool.query(`
      INSERT INTO POSTING_DOMAINS (id, posting_id, domain_id, is_primary)
      VALUES ?
    `, [domainValues]).catch(err => {
      throw ServerError.database('create posting domain associations');
    });
  }

  // Insert tag associations
  if (tag_ids.length > 0) {
    const tagValues = tag_ids.map(tag_id => [uuidv4(), postingId, tag_id]);
    await pool.query(`
      INSERT INTO POSTING_TAGS (id, posting_id, tag_id)
      VALUES ?
    `, [tagValues]).catch(err => {
      throw ServerError.database('create posting tag associations');
    });
  }

  // Fetch the created posting
  const [postings] = await pool.query('SELECT * FROM POSTINGS WHERE id = ?', [postingId]).catch(err => {
    throw ServerError.database('fetch created posting');
  });

  res.status(201).json({
    success: true,
    message: 'Posting created successfully',
    posting: postings[0]
  });
}));

/**
 * PUT /api/postings/:id
 * Update posting
 * Requires authentication and ownership
 */
router.put('/:id', authenticateToken, validateRequest({ body: PostingUpdateSchema }), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    content,
    category_id,
    urgency_level,
    contact_name,
    contact_phone,
    contact_country,
    contact_email,
    location,
    location_type,
    duration,
    max_connections,
    domain_ids,
    tag_ids
  } = req.body;

  // Check ownership
  const [existingPostings] = await pool.query('SELECT author_id FROM POSTINGS WHERE id = ?', [id]).catch(err => {
    throw ServerError.database('fetch posting');
  });

  if (existingPostings.length === 0) {
    throw ResourceError.notFound('Posting');
  }

  if (existingPostings[0].author_id !== req.user.id) {
    throw ValidationError.unauthorized('You are not authorized to update this posting');
  }

  // Build update query dynamically
  const updates = [];
  const params = [];

  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (content !== undefined) { updates.push('content = ?'); params.push(content); }
  if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
  if (urgency_level !== undefined) { updates.push('urgency_level = ?'); params.push(urgency_level); }
  if (contact_name !== undefined) { updates.push('contact_name = ?'); params.push(contact_name); }
  if (contact_phone !== undefined) { updates.push('contact_phone = ?'); params.push(contact_phone); }
  if (contact_country !== undefined) { updates.push('contact_country = ?'); params.push(contact_country); }
  if (contact_email !== undefined) { updates.push('contact_email = ?'); params.push(contact_email); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  if (location_type !== undefined) { updates.push('location_type = ?'); params.push(location_type); }
  if (duration !== undefined) { updates.push('duration = ?'); params.push(duration); }
  if (max_connections !== undefined) { updates.push('max_connections = ?'); params.push(max_connections); }

  if (updates.length > 0) {
    params.push(id);
    await pool.query(`UPDATE POSTINGS SET ${updates.join(', ')} WHERE id = ?`, params).catch(err => {
      throw ServerError.database('update posting');
    });
  }

  // Update domain associations if provided
  if (domain_ids !== undefined) {
    await pool.query('DELETE FROM POSTING_DOMAINS WHERE posting_id = ?', [id]).catch(err => {
      throw ServerError.database('delete posting domains');
    });
    if (domain_ids.length > 0) {
      // Mark the first domain as primary (assumes frontend sends primary domain first)
      const domainValues = domain_ids.map((domain_id, index) => [
        uuidv4(),
        id,
        domain_id,
        index === 0 ? 1 : 0  // is_primary: 1 for first domain, 0 for others
      ]);
      await pool.query('INSERT INTO POSTING_DOMAINS (id, posting_id, domain_id, is_primary) VALUES ?', [domainValues]).catch(err => {
        throw ServerError.database('insert posting domains');
      });
    }
  }

  // Update tag associations if provided
  if (tag_ids !== undefined) {
    await pool.query('DELETE FROM POSTING_TAGS WHERE posting_id = ?', [id]).catch(err => {
      throw ServerError.database('delete posting tags');
    });
    if (tag_ids.length > 0) {
      const tagValues = tag_ids.map(tag_id => [uuidv4(), id, tag_id]);
      await pool.query('INSERT INTO POSTING_TAGS (id, posting_id, tag_id) VALUES ?', [tagValues]).catch(err => {
        throw ServerError.database('insert posting tags');
      });
    }
  }

  // Fetch updated posting
  const [postings] = await pool.query('SELECT * FROM POSTINGS WHERE id = ?', [id]).catch(err => {
    throw ServerError.database('fetch updated posting');
  });

  res.json({
    success: true,
    message: 'Posting updated successfully',
    posting: postings[0]
  });
}));

/**
 * DELETE /api/postings/:id
 * Archive posting (soft delete - marks as 'archived' instead of hard delete)
 * Requires authentication and ownership
 */
router.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('[DELETE /api/postings/:id] Attempting to delete posting:', id, 'by user:', req.user.id);

  // Check ownership
  const [existingPostings] = await pool.query('SELECT author_id, status FROM POSTINGS WHERE id = ?', [id]).catch(err => {
    console.error('[DELETE /api/postings/:id] Failed to fetch posting:', err.message);
    throw ServerError.database('fetch posting');
  });

  console.log('[DELETE /api/postings/:id] Found postings:', existingPostings);

  if (existingPostings.length === 0) {
    console.log('[DELETE /api/postings/:id] Posting not found');
    throw ResourceError.notFound('Posting');
  }

  if (existingPostings[0].author_id !== req.user.id) {
    console.log('[DELETE /api/postings/:id] Unauthorized - author_id mismatch');
    throw ValidationError.unauthorized('You are not authorized to delete this posting');
  }

  // Soft delete: mark as archived instead of hard delete
  console.log('[DELETE /api/postings/:id] Archiving posting - current status:', existingPostings[0].status);
  const updateResult = await pool.query('UPDATE POSTINGS SET status = ? WHERE id = ?', ['archived', id]).catch(err => {
    console.error('[DELETE /api/postings/:id] Failed to update posting:', err.message);
    throw ServerError.database('archive posting');
  });

  console.log('[DELETE /api/postings/:id] Update result:', updateResult);

  // Verify the update worked
  const [verifyPostings] = await pool.query('SELECT id, status FROM POSTINGS WHERE id = ?', [id]).catch(err => {
    console.error('[DELETE /api/postings/:id] Failed to verify update:', err.message);
  });
  console.log('[DELETE /api/postings/:id] Verification - posting after update:', verifyPostings);

  res.json({
    success: true,
    message: 'Posting archived successfully'
  });
}));

/**
 * GET /api/postings/matched/:userId
 * Get postings matched to user's preferences
 *
 * Matches based on domain hierarchy:
 * - If user has primary domain preference, match all postings with that primary or its children
 * - If user has secondary domain preferences, match postings with those secondaries or their children
 * - If user has area of interest preferences, match postings with those specific areas
 *
 * Query params: Same as GET /api/postings
 */
router.get('/matched/:userId', asyncHandler(async (req, res) => {
  const { userId } = req.params;
    const {
      type,
      category_id,
      status,
      search,
      location_type,
      urgency,
      limit = 20,
      offset = 0
    } = req.query;

    console.log('[Matched Postings] Fetching preferences for user:', userId);

    // Get user preferences
    const [preferences] = await pool.query(`
      SELECT primary_domain_id, secondary_domain_ids, areas_of_interest_ids
      FROM USER_PREFERENCES
      WHERE user_id = ?
    `, [userId]).catch(err => {
      throw ServerError.database('fetch user preferences');
    });

    console.log('[Matched Postings] Query successful, got', preferences.length, 'results');

    console.log('[Matched Postings] Raw preferences:', preferences);

    if (preferences.length === 0) {
      // No preferences set - return all postings
      return res.redirect(307, `/api/postings?${new URLSearchParams(req.query).toString()}`);
    }

    const prefs = preferences[0];
    const primaryDomainId = prefs.primary_domain_id;

    console.log('[Matched Postings] Primary domain ID:', primaryDomainId);
    console.log('[Matched Postings] Secondary domain IDs (raw):', prefs.secondary_domain_ids, 'Type:', typeof prefs.secondary_domain_ids);
    console.log('[Matched Postings] Areas of interest IDs (raw):', prefs.areas_of_interest_ids, 'Type:', typeof prefs.areas_of_interest_ids);

    // Parse JSON fields safely - handle both string JSON and Buffer
    let secondaryDomainIds = [];
    let areasOfInterestIds = [];

    try {
      if (prefs.secondary_domain_ids) {
        if (Buffer.isBuffer(prefs.secondary_domain_ids)) {
          const str = prefs.secondary_domain_ids.toString();
          console.log('[Matched Postings] Buffer to string:', str);
          secondaryDomainIds = JSON.parse(str);
        } else if (typeof prefs.secondary_domain_ids === 'string') {
          console.log('[Matched Postings] Parsing string:', prefs.secondary_domain_ids);
          secondaryDomainIds = JSON.parse(prefs.secondary_domain_ids);
        } else if (Array.isArray(prefs.secondary_domain_ids)) {
          console.log('[Matched Postings] Already an array');
          secondaryDomainIds = prefs.secondary_domain_ids;
        }
      }
      console.log('[Matched Postings] Parsed secondary domain IDs:', secondaryDomainIds);
    } catch (e) {
      console.error('[Matched Postings] Error parsing secondary_domain_ids:', e.message);
      console.error('[Matched Postings] Raw value:', prefs.secondary_domain_ids);
      secondaryDomainIds = [];
    }

    try {
      if (prefs.areas_of_interest_ids) {
        if (Buffer.isBuffer(prefs.areas_of_interest_ids)) {
          const str = prefs.areas_of_interest_ids.toString();
          console.log('[Matched Postings] Buffer to string:', str);
          areasOfInterestIds = JSON.parse(str);
        } else if (typeof prefs.areas_of_interest_ids === 'string') {
          console.log('[Matched Postings] Parsing string:', prefs.areas_of_interest_ids);
          areasOfInterestIds = JSON.parse(prefs.areas_of_interest_ids);
        } else if (Array.isArray(prefs.areas_of_interest_ids)) {
          console.log('[Matched Postings] Already an array');
          areasOfInterestIds = prefs.areas_of_interest_ids;
        }
      }
      console.log('[Matched Postings] Parsed areas of interest IDs:', areasOfInterestIds);
    } catch (e) {
      console.error('[Matched Postings] Error parsing areas_of_interest_ids:', e.message);
      console.error('[Matched Postings] Raw value:', prefs.areas_of_interest_ids);
      areasOfInterestIds = [];
    }

    // Build list of all matching domain IDs
    // MATCHING STRATEGY: Only match on Areas of Interest (most specific level)
    // This ensures we show highly relevant postings, not broad matches
    const matchingDomainIds = new Set();

    // ONLY use Areas of Interest for matching
    // These are the most specific, granular topics the user selected
    areasOfInterestIds.forEach(id => matchingDomainIds.add(id));

    // If user has no areas of interest, fall back to secondary domains
    if (matchingDomainIds.size === 0 && secondaryDomainIds.length > 0) {
      console.log('[Matched Postings] No areas of interest, using secondary domains');
      secondaryDomainIds.forEach(id => matchingDomainIds.add(id));
    }

    // If still no matches, fall back to primary domain
    if (matchingDomainIds.size === 0 && primaryDomainId) {
      console.log('[Matched Postings] No secondary domains, using primary domain');
      matchingDomainIds.add(primaryDomainId);
    }

    if (matchingDomainIds.size === 0) {
      // No matching domains - return empty result
      return res.json({
        postings: [],
        pagination: {
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: false
        },
        matchedDomains: 0
      });
    }

    // Build query to find postings with matching domains
    let query = `
      SELECT DISTINCT
        p.id,
        p.title,
        p.content,
        p.posting_type,
        p.category_id,
        pc.name as category_name,
        p.urgency_level,
        p.location,
        p.location_type,
        p.duration,
        p.contact_name,
        p.contact_email,
        p.contact_phone,
        p.status,
        p.expires_at,
        p.view_count,
        p.interest_count,
        p.max_connections,
        p.is_pinned,
        p.published_at,
        p.created_at,
        p.updated_at,
        u.first_name as author_first_name,
        u.last_name as author_last_name,
        u.email as author_email,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', d.id, 'name', d.name, 'icon', d.icon, 'color_code', d.color_code, 'domain_level', d.domain_level)
          )
          FROM POSTING_DOMAINS pd
          JOIN DOMAINS d ON pd.domain_id = d.id
          WHERE pd.posting_id = p.id
        ) as domains,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', t.id, 'name', t.name, 'tag_type', t.tag_type)
          )
          FROM POSTING_TAGS pt
          JOIN TAGS t ON pt.tag_id = t.id
          WHERE pt.posting_id = p.id
        ) as tags
      FROM POSTINGS p
      LEFT JOIN app_users u ON p.author_id = u.id
      LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
    `;

    const conditions = [];
    const params = [];

    // Add domain matching condition
    conditions.push(`pd.domain_id IN (${Array.from(matchingDomainIds).map(() => '?').join(',')})`);
    params.push(...Array.from(matchingDomainIds));

    // Add other filters
    if (type) {
      conditions.push('p.posting_type = ?');
      params.push(type);
    }

    if (category_id) {
      conditions.push('p.category_id = ?');
      params.push(category_id);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    } else {
      conditions.push("p.status IN ('active', 'approved')");
    }

    if (location_type) {
      conditions.push('p.location_type = ?');
      params.push(location_type);
    }

    if (urgency) {
      conditions.push('p.urgency_level = ?');
      params.push(urgency);
    }

    if (search) {
      conditions.push('(MATCH(p.title, p.content) AGAINST (? IN NATURAL LANGUAGE MODE) OR p.title LIKE ? OR p.content LIKE ?)');
      params.push(search, `%${search}%`, `%${search}%`);
    }

    // Add WHERE clause
    query += ' WHERE ' + conditions.join(' AND ');

    // Add ordering and pagination
    query += ' ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC';
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    console.log('[Matched Postings] Executing query with', params.length, 'params');
    console.log('[Matched Postings] Matching domain IDs count:', matchingDomainIds.size);

    const [postings] = await pool.query(query, params).catch(err => {
      throw ServerError.database('fetch matched postings');
    });

    console.log('[Matched Postings] Query returned', postings.length, 'postings');

    // Parse JSON fields
    const parsedPostings = postings.map(posting => {
      let domains = [];
      let tags = [];

      if (posting.domains) {
        if (typeof posting.domains === 'string') {
          if (posting.domains.startsWith('[') || posting.domains.startsWith('{')) {
            try { domains = JSON.parse(posting.domains); } catch (e) {}
          }
        } else if (Array.isArray(posting.domains)) {
          domains = posting.domains;
        } else if (Buffer.isBuffer(posting.domains)) {
          try {
            const str = posting.domains.toString();
            if (str.startsWith('[') || str.startsWith('{')) {
              domains = JSON.parse(str);
            }
          } catch (e) {}
        }
      }

      if (posting.tags) {
        if (typeof posting.tags === 'string') {
          if (posting.tags.startsWith('[') || posting.tags.startsWith('{')) {
            try { tags = JSON.parse(posting.tags); } catch (e) {}
          }
        } else if (Array.isArray(posting.tags)) {
          tags = posting.tags;
        } else if (Buffer.isBuffer(posting.tags)) {
          try {
            const str = posting.tags.toString();
            if (str.startsWith('[') || str.startsWith('{')) {
              tags = JSON.parse(str);
            }
          } catch (e) {}
        }
      }

      return {
        ...posting,
        domains: domains || [],
        tags: tags || []
      };
    });

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM POSTINGS p
      INNER JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
    `;
    const countParams = params.slice(0, -2); // Remove LIMIT/OFFSET
    countQuery += ' WHERE ' + conditions.join(' AND ');

    const [countResult] = await pool.query(countQuery, countParams).catch(err => {
      throw ServerError.database('fetch matched postings count');
    });
    const total = countResult[0].total;

    console.log('[Matched Postings] Returning', parsedPostings.length, 'postings with', matchingDomainIds.size, 'matched domains');

    res.json({
      success: true,
      postings: parsedPostings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parsedPostings.length < total
      },
      matchedDomains: Array.from(matchingDomainIds).length
    });
}));

/**
 * POST /api/postings/:id/like
 * Toggle like on a posting
 * Requires authentication
 */
router.post('/:id/like', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Check if posting exists
  const [postings] = await pool.query('SELECT id FROM POSTINGS WHERE id = ?', [id]).catch(err => {
    throw ServerError.database('fetch posting');
  });

  if (postings.length === 0) {
    throw ResourceError.notFound('Posting');
  }

  // Check if user already liked this posting
  const [existing] = await pool.query(`
    SELECT id FROM POSTING_LIKES
    WHERE posting_id = ? AND user_id = ?
  `, [id, userId]).catch(err => {
    throw ServerError.database('fetch posting like');
  });

  if (existing.length > 0) {
    // Unlike - remove the like
    await pool.query(`
      DELETE FROM POSTING_LIKES
      WHERE posting_id = ? AND user_id = ?
    `, [id, userId]).catch(err => {
      throw ServerError.database('delete posting like');
    });

    // Decrement interest_count
    await pool.query(`
      UPDATE POSTINGS
      SET interest_count = GREATEST(0, interest_count - 1)
      WHERE id = ?
    `, [id]).catch(err => {
      throw ServerError.database('update posting interest count');
    });
  } else {
    // Like - add the like
    const likeId = uuidv4();
    await pool.query(`
      INSERT INTO POSTING_LIKES (id, posting_id, user_id)
      VALUES (?, ?, ?)
    `, [likeId, id, userId]).catch(err => {
      throw ServerError.database('create posting like');
    });

    // Increment interest_count
    await pool.query(`
      UPDATE POSTINGS
      SET interest_count = interest_count + 1
      WHERE id = ?
    `, [id]).catch(err => {
      throw ServerError.database('update posting interest count');
    });
  }

  // Get updated like count
  const [counts] = await pool.query(`
    SELECT interest_count
    FROM POSTINGS
    WHERE id = ?
  `, [id]).catch(err => {
    throw ServerError.database('fetch posting like count');
  });

  res.json({
    success: true,
    liked: existing.length === 0,
    likeCount: counts[0].interest_count
  });
}));

/**
 * POST /api/postings/:id/comment
 * Add comment to a posting
 * Requires authentication
 */
router.post('/:id/comment', authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  const userId = req.user.id;

  if (!comment || comment.trim().length === 0) {
    throw ValidationError.missingField('comment');
  }

  // Check if posting exists
  const [postings] = await pool.query('SELECT id FROM POSTINGS WHERE id = ?', [id]).catch(err => {
    throw ServerError.database('fetch posting');
  });

  if (postings.length === 0) {
    throw ResourceError.notFound('Posting');
  }

  const commentId = uuidv4();
  await pool.query(`
    INSERT INTO POSTING_COMMENTS (id, posting_id, user_id, comment_text)
    VALUES (?, ?, ?, ?)
  `, [commentId, id, userId, comment]).catch(err => {
    throw ServerError.database('create posting comment');
  });

  // Get updated comment count
  const [counts] = await pool.query(`
    SELECT COUNT(*) as comment_count
    FROM POSTING_COMMENTS
    WHERE posting_id = ?
  `, [id]).catch(err => {
    throw ServerError.database('fetch comment count');
  });

  // Get user info for the response
  const [users] = await pool.query(`
    SELECT first_name, last_name
    FROM app_users
    WHERE id = ?
  `, [userId]).catch(err => {
    throw ServerError.database('fetch user info');
  });

  res.json({
    success: true,
    comment: {
      id: commentId,
      posting_id: id,
      user_id: userId,
      user_name: users.length > 0 ? `${users[0].first_name} ${users[0].last_name}` : 'Anonymous',
      comment_text: comment,
      created_at: new Date()
    },
    commentCount: counts[0].comment_count
  });
}));

/**
 * GET /api/postings/:id/comments
 * Get comments for a posting
 */
router.get('/:id/comments', asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 20, offset = 0 } = req.query;

  const [comments] = await pool.query(`
    SELECT
      pc.id,
      pc.posting_id,
      pc.user_id,
      pc.comment_text,
      pc.created_at,
      u.first_name,
      u.last_name
    FROM POSTING_COMMENTS pc
    LEFT JOIN app_users u ON pc.user_id = u.id
    WHERE pc.posting_id = ?
    ORDER BY pc.created_at DESC
    LIMIT ? OFFSET ?
  `, [id, parseInt(limit), parseInt(offset)]).catch(err => {
    throw ServerError.database('fetch posting comments');
  });

  const [countResult] = await pool.query(`
    SELECT COUNT(*) as total
    FROM POSTING_COMMENTS
    WHERE posting_id = ?
  `, [id]).catch(err => {
    throw ServerError.database('fetch comment count');
  });

  res.json({
    success: true,
    comments: comments.map(c => ({
      ...c,
      user_name: c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : 'Anonymous'
    })),
    total: countResult[0].total
  });
}));

export default router;

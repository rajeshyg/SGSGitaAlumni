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
router.get('/', async (req, res) => {
  try {
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

    const [postings] = await pool.query(query, params);

    // Parse JSON fields - handle both string and already-parsed JSON
    const parsedPostings = postings.map(posting => {
      let domains = [];
      let tags = [];

      // Handle domains - might be string, Buffer, or already parsed
      if (posting.domains) {
        if (typeof posting.domains === 'string') {
          try {
            domains = JSON.parse(posting.domains);
          } catch (e) {
            console.error('Failed to parse domains:', posting.domains);
          }
        } else if (Array.isArray(posting.domains)) {
          domains = posting.domains;
        } else if (Buffer.isBuffer(posting.domains)) {
          try {
            domains = JSON.parse(posting.domains.toString());
          } catch (e) {
            console.error('Failed to parse domains buffer:', e);
          }
        }
      }

      // Handle tags - might be string, Buffer, or already parsed
      if (posting.tags) {
        if (typeof posting.tags === 'string') {
          try {
            tags = JSON.parse(posting.tags);
          } catch (e) {
            console.error('Failed to parse tags:', posting.tags);
          }
        } else if (Array.isArray(posting.tags)) {
          tags = posting.tags;
        } else if (Buffer.isBuffer(posting.tags)) {
          try {
            tags = JSON.parse(posting.tags.toString());
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
      const [countResult] = await pool.query(countQuery, countParams);
      const total = countResult[0].total;

      return res.json({
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
      postings: parsedPostings,
      pagination: {
        total: parsedPostings.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: false
      }
    });
  } catch (error) {
    console.error('Error fetching postings:', error);
    res.status(500).json({ error: 'Failed to fetch postings', details: error.message });
  }
});

/**
 * GET /api/postings/categories
 * Get all posting categories
 */
router.get('/categories', async (req, res) => {
  try {
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
    `);

    res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
  }
});

/**
 * GET /api/postings/:id
 * Get single posting with full details
 */
router.get('/:id', async (req, res) => {
  try {
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
    `, [id]);

    if (postings.length === 0) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    const posting = postings[0];

    // Parse JSON fields
    posting.domains = posting.domains ? JSON.parse(posting.domains) : [];
    posting.tags = posting.tags ? JSON.parse(posting.tags) : [];
    posting.attachments = posting.attachments ? JSON.parse(posting.attachments) : [];

    // Increment view count (async, don't wait)
    pool.query('UPDATE POSTINGS SET view_count = view_count + 1 WHERE id = ?', [id]).catch(console.error);

    res.json({ posting });
  } catch (error) {
    console.error('Error fetching posting:', error);
    res.status(500).json({ error: 'Failed to fetch posting', details: error.message });
  }
});

/**
 * POST /api/postings
 * Create new posting
 * Requires authentication
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
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

    // Validation
    if (!title || !content || !posting_type || !contact_name || !contact_email) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['title', 'content', 'posting_type', 'contact_name', 'contact_email']
      });
    }

    if (!['offer_support', 'seek_support'].includes(posting_type)) {
      return res.status(400).json({ error: 'Invalid posting_type. Must be offer_support or seek_support' });
    }

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
      req.user.userId,
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
    ]);

    // Insert domain associations
    if (domain_ids.length > 0) {
      const domainValues = domain_ids.map(domain_id => [uuidv4(), postingId, domain_id]);
      await pool.query(`
        INSERT INTO POSTING_DOMAINS (id, posting_id, domain_id)
        VALUES ?
      `, [domainValues]);
    }

    // Insert tag associations
    if (tag_ids.length > 0) {
      const tagValues = tag_ids.map(tag_id => [uuidv4(), postingId, tag_id]);
      await pool.query(`
        INSERT INTO POSTING_TAGS (id, posting_id, tag_id)
        VALUES ?
      `, [tagValues]);
    }

    // Fetch the created posting
    const [postings] = await pool.query('SELECT * FROM POSTINGS WHERE id = ?', [postingId]);

    res.status(201).json({ 
      message: 'Posting created successfully', 
      posting: postings[0]
    });
  } catch (error) {
    console.error('Error creating posting:', error);
    res.status(500).json({ error: 'Failed to create posting', details: error.message });
  }
});

/**
 * PUT /api/postings/:id
 * Update posting
 * Requires authentication and ownership
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
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
    const [existingPostings] = await pool.query('SELECT author_id FROM POSTINGS WHERE id = ?', [id]);
    if (existingPostings.length === 0) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    if (existingPostings[0].author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to update this posting' });
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
      await pool.query(`UPDATE POSTINGS SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    // Update domain associations if provided
    if (domain_ids !== undefined) {
      await pool.query('DELETE FROM POSTING_DOMAINS WHERE posting_id = ?', [id]);
      if (domain_ids.length > 0) {
        const domainValues = domain_ids.map(domain_id => [uuidv4(), id, domain_id]);
        await pool.query('INSERT INTO POSTING_DOMAINS (id, posting_id, domain_id) VALUES ?', [domainValues]);
      }
    }

    // Update tag associations if provided
    if (tag_ids !== undefined) {
      await pool.query('DELETE FROM POSTING_TAGS WHERE posting_id = ?', [id]);
      if (tag_ids.length > 0) {
        const tagValues = tag_ids.map(tag_id => [uuidv4(), id, tag_id]);
        await pool.query('INSERT INTO POSTING_TAGS (id, posting_id, tag_id) VALUES ?', [tagValues]);
      }
    }

    // Fetch updated posting
    const [postings] = await pool.query('SELECT * FROM POSTINGS WHERE id = ?', [id]);

    res.json({ 
      message: 'Posting updated successfully', 
      posting: postings[0]
    });
  } catch (error) {
    console.error('Error updating posting:', error);
    res.status(500).json({ error: 'Failed to update posting', details: error.message });
  }
});

/**
 * DELETE /api/postings/:id
 * Delete posting
 * Requires authentication and ownership
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [existingPostings] = await pool.query('SELECT author_id FROM POSTINGS WHERE id = ?', [id]);
    if (existingPostings.length === 0) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    if (existingPostings[0].author_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized to delete this posting' });
    }

    // Delete posting (CASCADE will handle related records)
    await pool.query('DELETE FROM POSTINGS WHERE id = ?', [id]);

    res.json({ message: 'Posting deleted successfully' });
  } catch (error) {
    console.error('Error deleting posting:', error);
    res.status(500).json({ error: 'Failed to delete posting', details: error.message });
  }
});

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
router.get('/matched/:userId', async (req, res) => {
  try {
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
    let preferences;
    try {
      [preferences] = await pool.query(`
        SELECT primary_domain_id, secondary_domain_ids, areas_of_interest_ids
        FROM USER_PREFERENCES
        WHERE user_id = ?
      `, [userId]);
      console.log('[Matched Postings] Query successful, got', preferences.length, 'results');
    } catch (queryError) {
      console.error('[Matched Postings] Query error:', queryError.message);
      console.error('[Matched Postings] Full error:', queryError);
      throw queryError;
    }

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

    // Build list of all matching domain IDs (including hierarchy)
    const matchingDomainIds = new Set();

    // Add user's explicit preferences
    if (primaryDomainId) matchingDomainIds.add(primaryDomainId);
    secondaryDomainIds.forEach(id => matchingDomainIds.add(id));
    areasOfInterestIds.forEach(id => matchingDomainIds.add(id));

    // Get all children of primary domain
    if (primaryDomainId) {
      const [primaryChildren] = await pool.query(`
        SELECT id FROM DOMAINS
        WHERE parent_domain_id = ? OR
              parent_domain_id IN (SELECT id FROM DOMAINS WHERE parent_domain_id = ?)
      `, [primaryDomainId, primaryDomainId]);
      primaryChildren.forEach(child => matchingDomainIds.add(child.id));
    }

    // Get all children of secondary domains
    if (secondaryDomainIds.length > 0) {
      const placeholders = secondaryDomainIds.map(() => '?').join(',');
      const [secondaryChildren] = await pool.query(`
        SELECT id FROM DOMAINS
        WHERE parent_domain_id IN (${placeholders})
      `, secondaryDomainIds);
      secondaryChildren.forEach(child => matchingDomainIds.add(child.id));
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

    const [postings] = await pool.query(query, params);

    // Parse JSON fields
    const parsedPostings = postings.map(posting => {
      let domains = [];
      let tags = [];

      if (posting.domains) {
        if (typeof posting.domains === 'string') {
          try { domains = JSON.parse(posting.domains); } catch (e) {}
        } else if (Array.isArray(posting.domains)) {
          domains = posting.domains;
        } else if (Buffer.isBuffer(posting.domains)) {
          try { domains = JSON.parse(posting.domains.toString()); } catch (e) {}
        }
      }

      if (posting.tags) {
        if (typeof posting.tags === 'string') {
          try { tags = JSON.parse(posting.tags); } catch (e) {}
        } else if (Array.isArray(posting.tags)) {
          tags = posting.tags;
        } else if (Buffer.isBuffer(posting.tags)) {
          try { tags = JSON.parse(posting.tags.toString()); } catch (e) {}
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

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      postings: parsedPostings,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parsedPostings.length < total
      },
      matchedDomains: Array.from(matchingDomainIds).length
    });
  } catch (error) {
    console.error('Error fetching matched postings:', error);
    res.status(500).json({ error: 'Failed to fetch matched postings', details: error.message });
  }
});

/**
 * POST /api/postings/:id/like
 * Toggle like on a posting
 * Requires authentication
 */
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if posting exists
    const [postings] = await pool.query('SELECT id FROM POSTINGS WHERE id = ?', [id]);
    if (postings.length === 0) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    // Check if user already liked this posting
    const [existing] = await pool.query(`
      SELECT id FROM POSTING_LIKES
      WHERE posting_id = ? AND user_id = ?
    `, [id, userId]);

    if (existing.length > 0) {
      // Unlike - remove the like
      await pool.query(`
        DELETE FROM POSTING_LIKES
        WHERE posting_id = ? AND user_id = ?
      `, [id, userId]);

      // Decrement interest_count
      await pool.query(`
        UPDATE POSTINGS
        SET interest_count = GREATEST(0, interest_count - 1)
        WHERE id = ?
      `, [id]);
    } else {
      // Like - add the like
      const likeId = uuidv4();
      await pool.query(`
        INSERT INTO POSTING_LIKES (id, posting_id, user_id)
        VALUES (?, ?, ?)
      `, [likeId, id, userId]);

      // Increment interest_count
      await pool.query(`
        UPDATE POSTINGS
        SET interest_count = interest_count + 1
        WHERE id = ?
      `, [id]);
    }

    // Get updated like count
    const [counts] = await pool.query(`
      SELECT interest_count
      FROM POSTINGS
      WHERE id = ?
    `, [id]);

    res.json({
      success: true,
      liked: existing.length === 0,
      likeCount: counts[0].interest_count
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
});

/**
 * POST /api/postings/:id/comment
 * Add comment to a posting
 * Requires authentication
 */
router.post('/:id/comment', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    // Check if posting exists
    const [postings] = await pool.query('SELECT id FROM POSTINGS WHERE id = ?', [id]);
    if (postings.length === 0) {
      return res.status(404).json({ error: 'Posting not found' });
    }

    const commentId = uuidv4();
    await pool.query(`
      INSERT INTO POSTING_COMMENTS (id, posting_id, user_id, comment_text)
      VALUES (?, ?, ?, ?)
    `, [commentId, id, userId, comment]);

    // Get updated comment count
    const [counts] = await pool.query(`
      SELECT COUNT(*) as comment_count
      FROM POSTING_COMMENTS
      WHERE posting_id = ?
    `, [id]);

    // Get user info for the response
    const [users] = await pool.query(`
      SELECT first_name, last_name
      FROM app_users
      WHERE id = ?
    `, [userId]);

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
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment'
    });
  }
});

/**
 * GET /api/postings/:id/comments
 * Get comments for a posting
 */
router.get('/:id/comments', async (req, res) => {
  try {
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
    `, [id, parseInt(limit), parseInt(offset)]);

    const [countResult] = await pool.query(`
      SELECT COUNT(*) as total
      FROM POSTING_COMMENTS
      WHERE posting_id = ?
    `, [id]);

    res.json({
      success: true,
      comments: comments.map(c => ({
        ...c,
        user_name: c.first_name && c.last_name ? `${c.first_name} ${c.last_name}` : 'Anonymous'
      })),
      total: countResult[0].total
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
});

export default router;

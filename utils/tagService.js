/**
 * Tag Service
 * Task 7.7.3: Tag Management System
 * 
 * Provides business logic for tag management, filtering, and suggestions
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Validate tag name
 * @param {string} name - Tag name to validate
 * @returns {string[]} Array of validation errors (empty if valid)
 */
export function validateTagName(name) {
  const errors = [];
  
  if (!name || typeof name !== 'string') {
    errors.push('Tag name is required');
    return errors;
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 2 || trimmed.length > 50) {
    errors.push('Tag name must be 2-50 characters');
  }
  
  if (!/^[a-zA-Z0-9\s\-\/]+$/.test(trimmed)) {
    errors.push('Tag name can only contain letters, numbers, spaces, hyphens, and slashes');
  }
  
  if (/\s{2,}/.test(trimmed)) {
    errors.push('Tag name cannot contain multiple consecutive spaces');
  }
  
  return errors;
}

/**
 * Get all active approved tags
 * @param {Object} pool - Database connection pool
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of tags
 */
export async function getAllTags(pool, filters = {}) {
  const {
    domain_ids = [],
    category_ids = [],
    tag_type = null,
    limit = 100,
    offset = 0
  } = filters;
  
  let query = `
    SELECT DISTINCT t.id, t.name, t.tag_type, t.usage_count, 
           t.is_active, t.is_approved, t.created_at
    FROM TAGS t
    WHERE t.is_active = TRUE AND t.is_approved = TRUE
  `;
  
  const params = [];
  
  if (tag_type) {
    query += ` AND t.tag_type = ?`;
    params.push(tag_type);
  }
  
  if (domain_ids.length > 0 || category_ids.length > 0) {
    query += `
      AND EXISTS (
        SELECT 1 FROM TAG_DOMAIN_MAPPINGS tdm
        WHERE tdm.tag_id = t.id
        AND (
          tdm.domain_id IS NULL  -- Universal tags
          ${domain_ids.length > 0 ? 'OR tdm.domain_id IN (?)' : ''}
          ${category_ids.length > 0 ? 'OR tdm.category_id IN (?)' : ''}
        )
      )
    `;
    if (domain_ids.length > 0) params.push(domain_ids);
    if (category_ids.length > 0) params.push(category_ids);
  }
  
  query += ` ORDER BY t.usage_count DESC, t.name ASC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const [rows] = await pool.query(query, params);
  return rows;
}

/**
 * Search tags by name (autocomplete)
 * @param {Object} pool - Database connection pool
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of matching tags
 */
export async function searchTags(pool, searchTerm, limit = 20) {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  
  const query = `
    SELECT id, name, tag_type, usage_count
    FROM TAGS
    WHERE is_active = TRUE 
      AND is_approved = TRUE
      AND name LIKE ?
    ORDER BY usage_count DESC, name ASC
    LIMIT ?
  `;
  
  const [rows] = await pool.query(query, [`%${searchTerm.trim()}%`, limit]);
  return rows;
}

/**
 * Get suggested tags based on domain/category context
 * @param {Object} pool - Database connection pool
 * @param {Object} params - Filter parameters
 * @returns {Promise<Array>} Array of suggested tags
 */
export async function getSuggestedTags(pool, params) {
  const {
    domain_ids = [],
    category_ids = [],
    min_relevance = 0.5,
    limit = 50
  } = params;
  
  if (domain_ids.length === 0 && category_ids.length === 0) {
    // Return popular universal tags
    return getPopularTags(pool, limit);
  }
  
  const query = `
    SELECT DISTINCT t.id, t.name, t.tag_type, t.usage_count,
           MAX(tdm.relevance_score) as relevance_score,
           COUNT(DISTINCT pt.posting_id) as usage_in_context
    FROM TAGS t
    LEFT JOIN TAG_DOMAIN_MAPPINGS tdm ON t.id = tdm.tag_id
    LEFT JOIN POSTING_TAGS pt ON t.id = pt.tag_id
    WHERE t.is_active = TRUE 
      AND t.is_approved = TRUE
      AND (
        -- Tags mapped to selected domains
        ${domain_ids.length > 0 ? 'tdm.domain_id IN (?)' : '1=0'}
        ${category_ids.length > 0 ? 'OR tdm.category_id IN (?)' : ''}
        -- Universal tags (no domain/category restriction)
        OR (tdm.domain_id IS NULL AND tdm.category_id IS NULL)
      )
      AND (tdm.relevance_score >= ? OR tdm.domain_id IS NULL)
    GROUP BY t.id, t.name, t.tag_type, t.usage_count
    ORDER BY relevance_score DESC, usage_in_context DESC, t.usage_count DESC
    LIMIT ?
  `;
  
  const params_array = [];
  if (domain_ids.length > 0) params_array.push(domain_ids);
  if (category_ids.length > 0) params_array.push(category_ids);
  params_array.push(min_relevance, limit);
  
  const [rows] = await pool.query(query, params_array);
  return rows;
}

/**
 * Get popular tags by usage count
 * @param {Object} pool - Database connection pool
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>} Array of popular tags
 */
export async function getPopularTags(pool, limit = 20) {
  const query = `
    SELECT id, name, tag_type, usage_count
    FROM TAGS
    WHERE is_active = TRUE AND is_approved = TRUE
    ORDER BY usage_count DESC, name ASC
    LIMIT ?
  `;
  
  const [rows] = await pool.query(query, [limit]);
  return rows;
}

/**
 * Create a new custom tag
 * @param {Object} pool - Database connection pool
 * @param {Object} tagData - Tag data
 * @returns {Promise<Object>} Created tag
 */
export async function createCustomTag(pool, tagData) {
  const { name, created_by, domain_ids = [], category_ids = [] } = tagData;
  
  // Validate tag name
  const errors = validateTagName(name);
  if (errors.length > 0) {
    throw new Error(errors.join(', '));
  }
  
  const trimmedName = name.trim();
  
  // Check if tag already exists
  const [existing] = await pool.query(
    'SELECT id, is_approved FROM TAGS WHERE name = ?',
    [trimmedName]
  );
  
  if (existing.length > 0) {
    if (existing[0].is_approved) {
      return { id: existing[0].id, name: trimmedName, already_exists: true };
    } else {
      // Tag exists but not approved - return it
      return { id: existing[0].id, name: trimmedName, pending_approval: true };
    }
  }
  
  // Create new custom tag
  const tagId = uuidv4();
  await pool.query(
    `INSERT INTO TAGS (id, name, tag_type, is_active, is_approved, created_by)
     VALUES (?, ?, 'custom', TRUE, FALSE, ?)`,
    [tagId, trimmedName, created_by]
  );
  
  // Create suggested domain/category mappings
  for (const domainId of domain_ids) {
    const mappingId = uuidv4();
    await pool.query(
      `INSERT INTO TAG_DOMAIN_MAPPINGS (id, tag_id, domain_id, category_id, relevance_score, mapping_type)
       VALUES (?, ?, ?, NULL, 0.50, 'automatic')`,
      [mappingId, tagId, domainId]
    );
  }
  
  return { id: tagId, name: trimmedName, pending_approval: true };
}

/**
 * Approve a custom tag (admin only)
 * @param {Object} pool - Database connection pool
 * @param {string} tagId - Tag ID
 * @returns {Promise<boolean>} Success status
 */
export async function approveTag(pool, tagId) {
  const [result] = await pool.query(
    'UPDATE TAGS SET is_approved = TRUE WHERE id = ? AND tag_type = \'custom\'',
    [tagId]
  );
  
  return result.affectedRows > 0;
}

/**
 * Track tag usage (increment usage count)
 * @param {Object} pool - Database connection pool
 * @param {string} tagId - Tag ID
 */
export async function trackTagUsage(pool, tagId) {
  await pool.query(
    `UPDATE TAGS 
     SET usage_count = usage_count + 1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [tagId]
  );
}

/**
 * Get tags for a posting
 * @param {Object} pool - Database connection pool
 * @param {string} postingId - Posting ID
 * @returns {Promise<Array>} Array of tags
 */
export async function getPostingTags(pool, postingId) {
  const query = `
    SELECT t.id, t.name, t.tag_type, t.usage_count
    FROM TAGS t
    INNER JOIN POSTING_TAGS pt ON t.id = pt.tag_id
    WHERE pt.posting_id = ?
    ORDER BY t.name ASC
  `;
  
  const [rows] = await pool.query(query, [postingId]);
  return rows;
}

/**
 * Add tags to a posting
 * @param {Object} pool - Database connection pool
 * @param {string} postingId - Posting ID
 * @param {string[]} tagIds - Array of tag IDs
 */
export async function addTagsToPosting(pool, postingId, tagIds) {
  if (!tagIds || tagIds.length === 0) return;
  
  for (const tagId of tagIds) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO POSTING_TAGS (id, posting_id, tag_id)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE id = id`,
      [id, postingId, tagId]
    );
    
    // Track usage
    await trackTagUsage(pool, tagId);
  }
}


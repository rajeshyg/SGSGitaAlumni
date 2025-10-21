/**
 * Tag Routes
 * Task 7.7.3: Tag Management System
 * 
 * API endpoints for tag management, search, and suggestions
 */

import {
  getAllTags,
  searchTags,
  getSuggestedTags,
  getPopularTags,
  createCustomTag,
  approveTag,
  getPostingTags,
  addTagsToPosting,
  validateTagName
} from '../utils/tagService.js';

let pool;

/**
 * Set database pool
 */
export function setTagsPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// PUBLIC TAG ENDPOINTS
// ============================================================================

/**
 * GET /api/tags
 * Get all active approved tags with optional filtering
 */
export const getTags = async (req, res) => {
  try {
    const {
      domain_ids,
      category_ids,
      tag_type,
      limit = 100,
      offset = 0
    } = req.query;
    
    const filters = {
      domain_ids: domain_ids ? domain_ids.split(',') : [],
      category_ids: category_ids ? category_ids.split(',') : [],
      tag_type,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };
    
    const tags = await getAllTags(pool, filters);
    
    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags'
    });
  }
};

/**
 * GET /api/tags/search
 * Search tags by name (autocomplete)
 */
export const searchTagsEndpoint = async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        tags: []
      });
    }
    
    const tags = await searchTags(pool, q, parseInt(limit));
    
    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Error searching tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search tags'
    });
  }
};

/**
 * GET /api/tags/suggested
 * Get suggested tags based on domain/category context
 */
export const getSuggestedTagsEndpoint = async (req, res) => {
  try {
    const {
      domain_ids,
      category_ids,
      min_relevance = 0.5,
      limit = 50
    } = req.query;
    
    const params = {
      domain_ids: domain_ids ? domain_ids.split(',') : [],
      category_ids: category_ids ? category_ids.split(',') : [],
      min_relevance: parseFloat(min_relevance),
      limit: parseInt(limit)
    };
    
    const tags = await getSuggestedTags(pool, params);
    
    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Error fetching suggested tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch suggested tags'
    });
  }
};

/**
 * GET /api/tags/popular
 * Get popular tags by usage count
 */
export const getPopularTagsEndpoint = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const tags = await getPopularTags(pool, parseInt(limit));
    
    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Error fetching popular tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular tags'
    });
  }
};

/**
 * POST /api/tags
 * Create a new custom tag (requires authentication)
 */
export const createTag = async (req, res) => {
  try {
    const { name, domain_ids = [], category_ids = [] } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Validate tag name
    const errors = validateTagName(name);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join(', ')
      });
    }
    
    const result = await createCustomTag(pool, {
      name,
      created_by: userId,
      domain_ids,
      category_ids
    });
    
    res.status(201).json({
      success: true,
      tag: result,
      message: result.already_exists 
        ? 'Tag already exists and is approved'
        : result.pending_approval
        ? 'Tag created and pending approval'
        : 'Tag created successfully'
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create tag'
    });
  }
};

// ============================================================================
// POSTING TAG ENDPOINTS
// ============================================================================

/**
 * GET /api/postings/:id/tags
 * Get all tags for a posting
 */
export const getPostingTagsEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tags = await getPostingTags(pool, id);
    
    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Error fetching posting tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posting tags'
    });
  }
};

/**
 * POST /api/postings/:id/tags
 * Add tags to a posting (requires authentication)
 */
export const addPostingTags = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_ids } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    if (!tag_ids || !Array.isArray(tag_ids) || tag_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'tag_ids array is required'
      });
    }
    
    await addTagsToPosting(pool, id, tag_ids);
    
    res.json({
      success: true,
      message: 'Tags added to posting successfully'
    });
  } catch (error) {
    console.error('Error adding posting tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add tags to posting'
    });
  }
};

// ============================================================================
// ADMIN TAG ENDPOINTS
// ============================================================================

/**
 * POST /api/admin/tags/:id/approve
 * Approve a custom tag (admin only)
 */
export const approveTagEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // TODO: Add admin role check
    // if (!req.user.isAdmin) {
    //   return res.status(403).json({
    //     success: false,
    //     error: 'Admin access required'
    //   });
    // }
    
    const success = await approveTag(pool, id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Tag not found or already approved'
      });
    }
    
    res.json({
      success: true,
      message: 'Tag approved successfully'
    });
  } catch (error) {
    console.error('Error approving tag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve tag'
    });
  }
};

/**
 * GET /api/admin/tags/pending
 * Get all pending custom tags (admin only)
 */
export const getPendingTags = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // TODO: Add admin role check
    
    const [tags] = await pool.query(`
      SELECT t.id, t.name, t.tag_type, t.created_by, t.created_at,
             u.email as creator_email
      FROM TAGS t
      LEFT JOIN app_users u ON t.created_by = u.id
      WHERE t.tag_type = 'custom' AND t.is_approved = FALSE AND t.is_active = TRUE
      ORDER BY t.created_at DESC
    `);
    
    res.json({
      success: true,
      tags,
      count: tags.length
    });
  } catch (error) {
    console.error('Error fetching pending tags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending tags'
    });
  }
};


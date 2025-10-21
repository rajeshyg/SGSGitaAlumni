/**
 * Domain Management Routes
 * Task 7.7.1 - Hierarchical Domain Schema Implementation
 * 
 * Provides API endpoints for domain hierarchy management
 */

import { v4 as uuidv4 } from 'uuid';

let pool;

export const setDomainsPool = (dbPool) => {
  pool = dbPool;
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build hierarchical structure from flat domain list
 */
function buildHierarchy(domains) {
  const hierarchy = {};
  const domainMap = new Map();
  
  // First pass: create map
  domains.forEach(d => {
    domainMap.set(d.id, { ...d, children: {} });
  });
  
  // Second pass: build hierarchy
  domains.forEach(d => {
    if (d.domain_level === 'primary') {
      hierarchy[d.id] = domainMap.get(d.id);
    } else if (d.parent_domain_id) {
      const parent = domainMap.get(d.parent_domain_id);
      if (parent) {
        parent.children[d.id] = domainMap.get(d.id);
      }
    }
  });
  
  return hierarchy;
}

/**
 * Validate domain hierarchy rules
 */
async function validateDomainHierarchy(domain) {
  const errors = [];
  
  // Check primary domain has no parent
  if (domain.domain_level === 'primary' && domain.parent_domain_id) {
    errors.push('Primary domains cannot have a parent');
  }
  
  // Check non-primary has parent
  if (domain.domain_level !== 'primary' && !domain.parent_domain_id) {
    errors.push('Secondary domains and areas must have a parent');
  }
  
  // Check parent exists and has correct level
  if (domain.parent_domain_id) {
    const [parent] = await pool.query(
      'SELECT * FROM DOMAINS WHERE id = ?',
      [domain.parent_domain_id]
    );
    
    if (parent.length === 0) {
      errors.push('Parent domain not found');
    } else {
      const parentDomain = parent[0];
      
      if (domain.domain_level === 'secondary' && parentDomain.domain_level !== 'primary') {
        errors.push('Secondary domains must have primary parent');
      } else if (domain.domain_level === 'area_of_interest' && parentDomain.domain_level !== 'secondary') {
        errors.push('Areas must have secondary parent');
      }
    }
  }
  
  return errors;
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * GET /api/domains
 * Get all active domains with hierarchy
 */
export const getAllDomains = async (req, res) => {
  try {
    const [domains] = await pool.query(`
      SELECT id, name, description, parent_domain_id, 
             domain_level, display_order, icon, color_code, metadata
      FROM DOMAINS
      WHERE is_active = TRUE
      ORDER BY domain_level, display_order, name
    `);

    const hierarchy = buildHierarchy(domains);
    
    res.json({
      success: true,
      domains,
      hierarchy
    });
  } catch (error) {
    console.error('Error fetching domains:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch domains' 
    });
  }
};

/**
 * GET /api/domains/:id
 * Get specific domain details
 */
export const getDomainById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [domain] = await pool.query(
      'SELECT * FROM DOMAINS WHERE id = ? AND is_active = TRUE',
      [id]
    );
    
    if (domain.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Domain not found'
      });
    }
    
    res.json({
      success: true,
      domain: domain[0]
    });
  } catch (error) {
    console.error('Error fetching domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domain'
    });
  }
};

/**
 * GET /api/domains/primary
 * Get only primary domains
 */
export const getPrimaryDomains = async (req, res) => {
  try {
    const [domains] = await pool.query(`
      SELECT id, name, description, icon, color_code, display_order
      FROM DOMAINS
      WHERE domain_level = 'primary' AND is_active = TRUE
      ORDER BY display_order, name
    `);
    
    res.json({
      success: true,
      domains
    });
  } catch (error) {
    console.error('Error fetching primary domains:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch primary domains'
    });
  }
};

/**
 * GET /api/domains/:id/children
 * Get child domains of a specific domain
 */
export const getDomainChildren = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [children] = await pool.query(`
      SELECT id, name, description, domain_level, icon, display_order
      FROM DOMAINS
      WHERE parent_domain_id = ? AND is_active = TRUE
      ORDER BY display_order, name
    `, [id]);
    
    res.json({
      success: true,
      children
    });
  } catch (error) {
    console.error('Error fetching domain children:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domain children'
    });
  }
};

/**
 * GET /api/domains/hierarchy
 * Get complete domain tree structure
 */
export const getDomainHierarchy = async (req, res) => {
  try {
    const [domains] = await pool.query(`
      SELECT id, name, description, parent_domain_id, 
             domain_level, display_order, icon, color_code
      FROM DOMAINS
      WHERE is_active = TRUE
      ORDER BY domain_level, display_order, name
    `);

    const hierarchy = buildHierarchy(domains);
    
    res.json({
      success: true,
      hierarchy
    });
  } catch (error) {
    console.error('Error fetching domain hierarchy:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch domain hierarchy'
    });
  }
};

/**
 * POST /api/admin/domains
 * Create new domain (admin only)
 */
export const createDomain = async (req, res) => {
  try {
    const domain = req.body;
    
    // Validate hierarchy
    const errors = await validateDomainHierarchy(domain);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const id = uuidv4();
    
    await pool.query(`
      INSERT INTO DOMAINS (
        id, name, description, parent_domain_id, domain_level,
        display_order, icon, color_code, metadata, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
    `, [
      id,
      domain.name,
      domain.description || '',
      domain.parent_domain_id || null,
      domain.domain_level,
      domain.display_order || 0,
      domain.icon || null,
      domain.color_code || null,
      domain.metadata ? JSON.stringify(domain.metadata) : null
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Domain created successfully',
      domain_id: id
    });
  } catch (error) {
    console.error('Error creating domain:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        error: 'Domain with this name already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create domain'
    });
  }
};

/**
 * PUT /api/admin/domains/:id
 * Update domain (admin only)
 */
export const updateDomain = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Validate hierarchy if changing parent or level
    if (updates.parent_domain_id !== undefined || updates.domain_level) {
      const errors = await validateDomainHierarchy({ ...updates, id });
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          errors
        });
      }
    }
    
    const updateFields = [];
    const values = [];
    
    if (updates.name) {
      updateFields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      updateFields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.display_order !== undefined) {
      updateFields.push('display_order = ?');
      values.push(updates.display_order);
    }
    if (updates.icon !== undefined) {
      updateFields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.color_code !== undefined) {
      updateFields.push('color_code = ?');
      values.push(updates.color_code);
    }
    if (updates.is_active !== undefined) {
      updateFields.push('is_active = ?');
      values.push(updates.is_active);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    await pool.query(
      `UPDATE DOMAINS SET ${updateFields.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({
      success: true,
      message: 'Domain updated successfully'
    });
  } catch (error) {
    console.error('Error updating domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update domain'
    });
  }
};

/**
 * DELETE /api/admin/domains/:id
 * Delete domain (admin only) - soft delete by setting is_active = false
 */
export const deleteDomain = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Soft delete
    await pool.query(
      'UPDATE DOMAINS SET is_active = FALSE WHERE id = ?',
      [id]
    );
    
    res.json({
      success: true,
      message: 'Domain deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting domain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete domain'
    });
  }
};


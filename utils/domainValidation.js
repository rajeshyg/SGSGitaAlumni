/**
 * Domain Validation Utilities
 * Task 7.7.1 - Hierarchical Domain Schema Implementation
 * 
 * Provides validation functions for domain hierarchy rules
 */

import { getPool } from './database.js';

const pool = getPool();

/**
 * Validate domain hierarchy rules
 * 
 * Rules:
 * 1. Primary domains must NOT have parent_domain_id
 * 2. Secondary domains must have parent_domain_id pointing to primary
 * 3. Areas of interest must have parent_domain_id pointing to secondary
 * 4. Display order must be unique within same parent
 * 5. Circular references not allowed
 * 
 * @param {Object} domain - Domain object to validate
 * @returns {Promise<string[]>} Array of error messages (empty if valid)
 */
export async function validateDomainHierarchy(domain) {
  const errors = [];
  
  // Rule 1: Check primary domain has no parent
  if (domain.domain_level === 'primary' && domain.parent_domain_id) {
    errors.push('Primary domains cannot have a parent');
  }
  
  // Rule 2 & 3: Check non-primary has parent
  if (domain.domain_level !== 'primary' && !domain.parent_domain_id) {
    errors.push('Secondary domains and areas must have a parent');
  }
  
  // Check parent exists and has correct level
  if (domain.parent_domain_id) {
    try {
      const [parent] = await pool.query(
        'SELECT * FROM DOMAINS WHERE id = ?',
        [domain.parent_domain_id]
      );
      
      if (parent.length === 0) {
        errors.push('Parent domain not found');
      } else {
        const parentDomain = parent[0];
        
        // Validate parent level matches child level
        if (domain.domain_level === 'secondary' && parentDomain.domain_level !== 'primary') {
          errors.push('Secondary domains must have primary parent');
        } else if (domain.domain_level === 'area_of_interest' && parentDomain.domain_level !== 'secondary') {
          errors.push('Areas must have secondary parent');
        }
        
        // Rule 5: Check for circular references
        if (domain.id && await hasCircularReference(domain.id, domain.parent_domain_id)) {
          errors.push('Circular reference detected in domain hierarchy');
        }
      }
    } catch (error) {
      errors.push(`Error validating parent domain: ${error.message}`);
    }
  }
  
  // Validate display order
  if (domain.display_order !== undefined) {
    if (domain.display_order < 0 || domain.display_order > 9999) {
      errors.push('Display order must be between 0 and 9999');
    }
  }
  
  return errors;
}

/**
 * Check for circular references in domain hierarchy
 * 
 * @param {string} domainId - Domain ID to check
 * @param {string} parentId - Parent domain ID
 * @returns {Promise<boolean>} True if circular reference exists
 */
async function hasCircularReference(domainId, parentId) {
  const visited = new Set();
  let currentId = parentId;
  
  while (currentId) {
    if (currentId === domainId) {
      return true; // Circular reference found
    }
    
    if (visited.has(currentId)) {
      return true; // Loop detected
    }
    
    visited.add(currentId);
    
    try {
      const [parent] = await pool.query(
        'SELECT parent_domain_id FROM DOMAINS WHERE id = ?',
        [currentId]
      );
      
      if (parent.length === 0) {
        break;
      }
      
      currentId = parent[0].parent_domain_id;
    } catch (error) {
      console.error('Error checking circular reference:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Validate domain name uniqueness
 * 
 * @param {string} name - Domain name to check
 * @param {string} excludeId - Domain ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if name is unique
 */
export async function isDomainNameUnique(name, excludeId = null) {
  try {
    let query = 'SELECT COUNT(*) as count FROM DOMAINS WHERE name = ?';
    const params = [name];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }

    const [rows] = await pool.query(query, params);
    return rows[0].count === 0;
  } catch (error) {
    console.error('Error checking domain name uniqueness:', error);
    return false;
  }
}

/**
 * Get domain by ID
 * 
 * @param {string} domainId - Domain ID
 * @returns {Promise<Object|null>} Domain object or null if not found
 */
export async function getDomainById(domainId) {
  try {
    const [domain] = await pool.query(
      'SELECT * FROM DOMAINS WHERE id = ?',
      [domainId]
    );
    
    return domain.length > 0 ? domain[0] : null;
  } catch (error) {
    console.error('Error fetching domain:', error);
    return null;
  }
}

/**
 * Get all child domains of a parent
 * 
 * @param {string} parentId - Parent domain ID
 * @returns {Promise<Array>} Array of child domains
 */
export async function getChildDomains(parentId) {
  try {
    const [children] = await pool.query(
      'SELECT * FROM DOMAINS WHERE parent_domain_id = ? AND is_active = TRUE ORDER BY display_order, name',
      [parentId]
    );
    
    return children;
  } catch (error) {
    console.error('Error fetching child domains:', error);
    return [];
  }
}

/**
 * Check if domain has any children
 * 
 * @param {string} domainId - Domain ID
 * @returns {Promise<boolean>} True if domain has children
 */
export async function hasChildDomains(domainId) {
  try {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM DOMAINS WHERE parent_domain_id = ?',
      [domainId]
    );

    return rows[0].count > 0;
  } catch (error) {
    console.error('Error checking child domains:', error);
    return false;
  }
}

/**
 * Validate domain can be deleted
 * 
 * @param {string} domainId - Domain ID
 * @returns {Promise<Object>} Object with canDelete boolean and reason
 */
export async function canDeleteDomain(domainId) {
  try {
    // Check if domain has children
    if (await hasChildDomains(domainId)) {
      return {
        canDelete: false,
        reason: 'Cannot delete domain with child domains'
      };
    }
    
    // Check if domain is used in user preferences
    const [prefRows] = await pool.query(
      'SELECT COUNT(*) as count FROM USER_PREFERENCES WHERE primary_domain_id = ?',
      [domainId]
    );

    if (prefRows[0].count > 0) {
      return {
        canDelete: false,
        reason: 'Domain is used in user preferences'
      };
    }

    // Check if domain is used in alumni domains
    const [alumniRows] = await pool.query(
      'SELECT COUNT(*) as count FROM ALUMNI_DOMAINS WHERE domain_id = ?',
      [domainId]
    );

    if (alumniRows[0].count > 0) {
      return {
        canDelete: false,
        reason: 'Domain is used in alumni profiles'
      };
    }
    
    return {
      canDelete: true,
      reason: null
    };
  } catch (error) {
    console.error('Error checking domain deletion:', error);
    return {
      canDelete: false,
      reason: 'Error checking domain usage'
    };
  }
}

/**
 * Build complete domain hierarchy tree
 * 
 * @returns {Promise<Object>} Hierarchical domain structure
 */
export async function buildDomainTree() {
  try {
    const [domains] = await pool.query(`
      SELECT id, name, description, parent_domain_id, 
             domain_level, display_order, icon, color_code
      FROM DOMAINS
      WHERE is_active = TRUE
      ORDER BY domain_level, display_order, name
    `);
    
    const tree = {};
    const domainMap = new Map();
    
    // First pass: create map
    domains.forEach(d => {
      domainMap.set(d.id, { ...d, children: {} });
    });
    
    // Second pass: build hierarchy
    domains.forEach(d => {
      if (d.domain_level === 'primary') {
        tree[d.id] = domainMap.get(d.id);
      } else if (d.parent_domain_id) {
        const parent = domainMap.get(d.parent_domain_id);
        if (parent) {
          parent.children[d.id] = domainMap.get(d.id);
        }
      }
    });
    
    return tree;
  } catch (error) {
    console.error('Error building domain tree:', error);
    return {};
  }
}


/**
 * Domain Validation Unit Tests
 * Task 7.7.1 - Hierarchical Domain Schema Implementation
 *
 * NOTE: These are true unit tests that mock the database layer.
 * For integration tests with a real database, see tests/api/domains-api.test.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';

// Mock the database module before importing validation functions
vi.mock('../../utils/database.js', () => {
  const mockPool = {
    query: vi.fn(),
  };
  return {
    getPool: () => mockPool,
  };
});

import { getPool } from '../../utils/database.js';
import {
  validateDomainHierarchy,
  isDomainNameUnique,
  getDomainById,
  getChildDomains,
  hasChildDomains,
  canDeleteDomain,
  buildDomainTree
} from '../../utils/domainValidation.js';

const mockPool = getPool();
let testDomainIds = [];

// ============================================================================
// TEST DATA
// ============================================================================

const createTestDomains = () => {
  const primaryId = 'test-primary-' + uuidv4();
  const secondaryId = 'test-secondary-' + uuidv4();
  const areaId = 'test-area-' + uuidv4();

  return {
    primary: {
      id: primaryId,
      name: 'Test Primary Domain',
      description: 'Test primary',
      parent_domain_id: null,
      domain_level: 'primary',
      display_order: 1,
      is_active: true,
    },
    secondary: {
      id: secondaryId,
      name: 'Test Secondary Domain',
      description: 'Test secondary',
      parent_domain_id: primaryId,
      domain_level: 'secondary',
      display_order: 1,
      is_active: true,
    },
    area: {
      id: areaId,
      name: 'Test Area Domain',
      description: 'Test area',
      parent_domain_id: secondaryId,
      domain_level: 'area_of_interest',
      display_order: 1,
      is_active: true,
    },
  };
};

// ============================================================================
// TEST SETUP
// ============================================================================

beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();

  // Create fresh test data for each test
  const domains = createTestDomains();
  testDomainIds = [domains.primary.id, domains.secondary.id, domains.area.id];

  // Store test domains for mock queries
  mockPool._testDomains = domains;
});

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe('Domain Hierarchy Validation', () => {
  it('should reject primary domain with parent', async () => {
    const domain = {
      domain_level: 'primary',
      parent_domain_id: testDomainIds[0]
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Primary domains cannot have a parent');
  });

  it('should reject secondary domain without parent', async () => {
    const domain = {
      domain_level: 'secondary',
      parent_domain_id: null
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Secondary domains and areas must have a parent');
  });

  it('should reject area without parent', async () => {
    const domain = {
      domain_level: 'area_of_interest',
      parent_domain_id: null
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Secondary domains and areas must have a parent');
  });

  it('should reject secondary with non-primary parent', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return secondary domain as parent
    mockPool.query.mockResolvedValueOnce([[domains.secondary]]);

    const domain = {
      domain_level: 'secondary',
      parent_domain_id: domains.secondary.id
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Secondary domains must have primary parent');
  });

  it('should reject area with non-secondary parent', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return primary domain as parent
    mockPool.query.mockResolvedValueOnce([[domains.primary]]);

    const domain = {
      domain_level: 'area_of_interest',
      parent_domain_id: domains.primary.id
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Areas must have secondary parent');
  });

  it('should accept valid primary domain', async () => {
    const domain = {
      domain_level: 'primary',
      parent_domain_id: null,
      display_order: 1
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid secondary domain', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return primary domain as parent
    mockPool.query.mockResolvedValueOnce([[domains.primary]]);

    const domain = {
      domain_level: 'secondary',
      parent_domain_id: domains.primary.id,
      display_order: 1
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toHaveLength(0);
  });

  it('should accept valid area domain', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return secondary domain as parent
    mockPool.query.mockResolvedValueOnce([[domains.secondary]]);

    const domain = {
      domain_level: 'area_of_interest',
      parent_domain_id: domains.secondary.id,
      display_order: 1
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid display order', async () => {
    const domain = {
      domain_level: 'primary',
      parent_domain_id: null,
      display_order: -1
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Display order must be between 0 and 9999');
  });

  it('should reject display order too large', async () => {
    const domain = {
      domain_level: 'primary',
      parent_domain_id: null,
      display_order: 10000
    };

    const errors = await validateDomainHierarchy(domain);
    expect(errors).toContain('Display order must be between 0 and 9999');
  });
});

// ============================================================================
// UNIQUENESS TESTS
// ============================================================================

describe('Domain Name Uniqueness', () => {
  it('should detect duplicate domain name', async () => {
    // Mock query to return count > 0 (duplicate found)
    mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

    const isUnique = await isDomainNameUnique('Test Primary Domain');
    expect(isUnique).toBe(false);
  });

  it('should allow unique domain name', async () => {
    // Mock query to return count = 0 (no duplicates)
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);

    const isUnique = await isDomainNameUnique('Unique Domain Name ' + Date.now());
    expect(isUnique).toBe(true);
  });

  it('should exclude current domain when checking uniqueness', async () => {
    // Mock query to return count = 0 (excluding current domain)
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);

    const isUnique = await isDomainNameUnique('Test Primary Domain', testDomainIds[0]);
    expect(isUnique).toBe(true);
  });
});

// ============================================================================
// RETRIEVAL TESTS
// ============================================================================

describe('Domain Retrieval', () => {
  it('should get domain by ID', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return primary domain
    mockPool.query.mockResolvedValueOnce([[domains.primary]]);

    const domain = await getDomainById(domains.primary.id);
    expect(domain).toBeDefined();
    expect(domain.name).toBe('Test Primary Domain');
  });

  it('should return null for non-existent domain', async () => {
    // Mock query to return empty array
    mockPool.query.mockResolvedValueOnce([[]]);

    const domain = await getDomainById(uuidv4());
    expect(domain).toBeNull();
  });

  it('should get child domains', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return secondary domain as child of primary
    mockPool.query.mockResolvedValueOnce([[domains.secondary]]);

    const children = await getChildDomains(domains.primary.id);
    expect(children).toBeInstanceOf(Array);
    expect(children.length).toBeGreaterThan(0);
    expect(children[0].name).toBe('Test Secondary Domain');
  });

  it('should detect domain has children', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return count > 0
    mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

    const hasChildren = await hasChildDomains(domains.primary.id);
    expect(hasChildren).toBe(true);
  });

  it('should detect domain has no children', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return count = 0
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]);

    const hasChildren = await hasChildDomains(domains.area.id);
    expect(hasChildren).toBe(false);
  });
});

// ============================================================================
// DELETION TESTS
// ============================================================================

describe('Domain Deletion Validation', () => {
  it('should prevent deletion of domain with children', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return count > 0 (has children)
    mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]);

    const result = await canDeleteDomain(domains.primary.id);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('child domains');
  });

  it('should allow deletion of domain without children', async () => {
    const domains = mockPool._testDomains;

    // Mock queries for: hasChildren, userPreferences, alumniDomains
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]); // No children
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]); // No user preferences
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]); // No alumni domains

    const result = await canDeleteDomain(domains.area.id);
    expect(result.canDelete).toBe(true);
    expect(result.reason).toBeNull();
  });

  it('should prevent deletion if used in user preferences', async () => {
    const domains = mockPool._testDomains;

    // Mock queries
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]); // No children
    mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]); // Used in preferences

    const result = await canDeleteDomain(domains.primary.id);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('user preferences');
  });

  it('should prevent deletion if used in alumni profiles', async () => {
    const domains = mockPool._testDomains;

    // Mock queries
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]); // No children
    mockPool.query.mockResolvedValueOnce([[{ count: 0 }]]); // No user preferences
    mockPool.query.mockResolvedValueOnce([[{ count: 1 }]]); // Used in alumni profiles

    const result = await canDeleteDomain(domains.secondary.id);
    expect(result.canDelete).toBe(false);
    expect(result.reason).toContain('alumni profiles');
  });
});

// ============================================================================
// HIERARCHY TREE TESTS
// ============================================================================

describe('Domain Tree Building', () => {
  it('should build complete domain tree', async () => {
    const domains = mockPool._testDomains;

    // Mock query to return all domains
    mockPool.query.mockResolvedValueOnce([[
      domains.primary,
      domains.secondary,
      domains.area
    ]]);

    const tree = await buildDomainTree();
    expect(tree).toBeDefined();
    expect(typeof tree).toBe('object');

    // Check that primary domains are at root level
    const primaryDomain = Object.values(tree).find(d => d.name === 'Test Primary Domain');
    expect(primaryDomain).toBeDefined();

    // Check that secondary domains are children of primary
    if (primaryDomain) {
      expect(primaryDomain.children).toBeDefined();
      const secondaryDomain = Object.values(primaryDomain.children).find(d => d.name === 'Test Secondary Domain');
      expect(secondaryDomain).toBeDefined();

      // Check that areas are children of secondary
      if (secondaryDomain) {
        expect(secondaryDomain.children).toBeDefined();
        const areaDomain = Object.values(secondaryDomain.children).find(d => d.name === 'Test Area Domain');
        expect(areaDomain).toBeDefined();
      }
    }
  });

  it('should return empty object if no domains exist', async () => {
    // Mock query to return empty array
    mockPool.query.mockResolvedValueOnce([[]]);

    const tree = await buildDomainTree();
    expect(tree).toBeDefined();
    expect(typeof tree).toBe('object');
    expect(Object.keys(tree).length).toBe(0);
  });
});


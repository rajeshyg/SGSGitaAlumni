# Task 7.7.1: Hierarchical Domain Schema Implementation

**Status:** ✅ Complete
**Priority:** High
**Estimated Time:** 2-3 days
**Actual Time:** 1 day
**Parent Task:** [Task 7.7: Domain Taxonomy & Preferences System](./task-7.7-domain-taxonomy-system.md)
**Completed:** 2025-10-13

## Overview
Implement hierarchical domain structure supporting three levels: Primary Domains → Secondary Domains (Sub-domains) → Areas of Interest. This enables precise categorization and intelligent matching between users.

## Objectives
- Enhance DOMAINS table with hierarchy support
- Create domain hierarchy navigation utilities
- Seed initial domain taxonomy data
- Implement domain validation rules
- Build domain retrieval APIs

## Database Schema Changes

### Enhanced DOMAINS Table
```sql
ALTER TABLE DOMAINS
ADD COLUMN parent_domain_id CHAR(36) NULL AFTER description,
ADD COLUMN domain_level ENUM('primary', 'secondary', 'area_of_interest') NOT NULL DEFAULT 'primary' AFTER parent_domain_id,
ADD COLUMN display_order INT DEFAULT 0 AFTER domain_level,
ADD COLUMN icon VARCHAR(50) AFTER display_order,
ADD CONSTRAINT fk_parent_domain FOREIGN KEY (parent_domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE;

-- Indexes for performance
CREATE INDEX idx_parent_domain ON DOMAINS(parent_domain_id);
CREATE INDEX idx_domain_level ON DOMAINS(domain_level);
CREATE INDEX idx_hierarchy ON DOMAINS(parent_domain_id, domain_level, display_order);
```

### Validation Constraints
```sql
-- Add check constraints
ALTER TABLE DOMAINS
ADD CONSTRAINT check_primary_no_parent 
    CHECK (domain_level = 'primary' AND parent_domain_id IS NULL 
           OR domain_level != 'primary' AND parent_domain_id IS NOT NULL);

ALTER TABLE DOMAINS
ADD CONSTRAINT check_display_order 
    CHECK (display_order >= 0 AND display_order <= 9999);
```

## Seed Data Structure

### Primary Domains
```javascript
const primaryDomains = [
  {
    name: 'Technology',
    description: 'Information technology, software, and digital innovation',
    domain_level: 'primary',
    display_order: 1,
    icon: 'laptop-code',
    color_code: '#3B82F6'
  },
  {
    name: 'Healthcare',
    description: 'Medical, health services, and wellness',
    domain_level: 'primary',
    display_order: 2,
    icon: 'heart-pulse',
    color_code: '#10B981'
  },
  {
    name: 'Business',
    description: 'Business management, entrepreneurship, and commerce',
    domain_level: 'primary',
    display_order: 3,
    icon: 'briefcase',
    color_code: '#8B5CF6'
  }
];
```

### Secondary Domains (Technology)
```javascript
const technologySecondaryDomains = [
  {
    name: 'Software Development',
    parent: 'Technology',
    domain_level: 'secondary',
    display_order: 1,
    icon: 'code'
  },
  {
    name: 'Data Science',
    parent: 'Technology',
    domain_level: 'secondary',
    display_order: 2,
    icon: 'chart-line'
  },
  {
    name: 'Cybersecurity',
    parent: 'Technology',
    domain_level: 'secondary',
    display_order: 3,
    icon: 'shield'
  },
  {
    name: 'Cloud Computing',
    parent: 'Technology',
    domain_level: 'secondary',
    display_order: 4,
    icon: 'cloud'
  }
];
```

### Areas of Interest (Software Development)
```javascript
const softwareDevelopmentAreas = [
  { name: 'Frontend Development', parent: 'Software Development', display_order: 1 },
  { name: 'Backend Development', parent: 'Software Development', display_order: 2 },
  { name: 'Mobile Development', parent: 'Software Development', display_order: 3 },
  { name: 'DevOps', parent: 'Software Development', display_order: 4 },
  { name: 'Quality Assurance', parent: 'Software Development', display_order: 5 }
];
```

## API Endpoints

### Domain Retrieval
```typescript
// GET /api/domains - Get all domains with hierarchy
interface DomainHierarchyResponse {
  domains: Domain[];
  hierarchy: {
    [primaryId: string]: {
      domain: Domain;
      children: {
        [secondaryId: string]: {
          domain: Domain;
          children: Domain[];
        };
      };
    };
  };
}

// GET /api/domains/primary - Get only primary domains
// GET /api/domains/:id/children - Get child domains
// GET /api/domains/tree/:id - Get complete subtree
```

### Implementation Example
```typescript
// routes/domains.js
export const getDomainHierarchy = async (req, res) => {
  try {
    const domains = await pool.query(`
      SELECT id, name, description, parent_domain_id, 
             domain_level, display_order, icon, color_code
      FROM DOMAINS
      WHERE is_active = TRUE
      ORDER BY domain_level, display_order, name
    `);

    const hierarchy = buildHierarchy(domains[0]);
    
    res.json({
      success: true,
      domains: domains[0],
      hierarchy
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function buildHierarchy(domains) {
  const hierarchy = {};
  const domainMap = new Map();
  
  // First pass: create map
  domains.forEach(d => domainMap.set(d.id, { ...d, children: {} }));
  
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
```

## Migration Script

### Step 1: Add Columns
```sql
-- File: migrations/007_add_domain_hierarchy.sql
START TRANSACTION;

-- Add new columns
ALTER TABLE DOMAINS
ADD COLUMN parent_domain_id CHAR(36) NULL,
ADD COLUMN domain_level ENUM('primary', 'secondary', 'area_of_interest') NOT NULL DEFAULT 'primary',
ADD COLUMN display_order INT DEFAULT 0,
ADD COLUMN icon VARCHAR(50);

-- Add foreign key
ALTER TABLE DOMAINS
ADD CONSTRAINT fk_parent_domain 
FOREIGN KEY (parent_domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE;

-- Add indexes
CREATE INDEX idx_parent_domain ON DOMAINS(parent_domain_id);
CREATE INDEX idx_domain_level ON DOMAINS(domain_level);
CREATE INDEX idx_hierarchy ON DOMAINS(parent_domain_id, domain_level, display_order);

COMMIT;
```

### Step 2: Seed Data
```javascript
// File: scripts/seed-domain-hierarchy.js
import { pool } from '../server.js';
import { v4 as uuidv4 } from 'uuid';

const seedDomainHierarchy = async () => {
  console.log('🌱 Seeding domain hierarchy...');
  
  // Insert primary domains
  const techId = await insertDomain({
    name: 'Technology',
    domain_level: 'primary',
    display_order: 1,
    // ... other fields
  });
  
  // Insert secondary domains
  const softwareDevId = await insertDomain({
    name: 'Software Development',
    parent_domain_id: techId,
    domain_level: 'secondary',
    display_order: 1
  });
  
  // Insert areas of interest
  await insertDomain({
    name: 'Frontend Development',
    parent_domain_id: softwareDevId,
    domain_level: 'area_of_interest',
    display_order: 1
  });
  
  console.log('✅ Domain hierarchy seeded successfully');
};

async function insertDomain(domain) {
  const id = uuidv4();
  await pool.query(`
    INSERT INTO DOMAINS (id, name, description, parent_domain_id, 
                        domain_level, display_order, icon, color_code, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)
  `, [id, domain.name, domain.description || '', domain.parent_domain_id,
      domain.domain_level, domain.display_order, domain.icon, domain.color_code]);
  return id;
}

seedDomainHierarchy().catch(console.error);
```

## Validation Rules

### Domain Hierarchy Rules
1. **Primary domains**: Must NOT have parent_domain_id
2. **Secondary domains**: Must have parent_domain_id pointing to primary
3. **Areas of interest**: Must have parent_domain_id pointing to secondary
4. **Display order**: Must be unique within same parent
5. **Circular references**: Not allowed

### Validation Implementation
```typescript
// utils/domainValidation.ts
export async function validateDomainHierarchy(domain) {
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
    const parent = await getDomainById(domain.parent_domain_id);
    if (!parent) {
      errors.push('Parent domain not found');
    } else if (domain.domain_level === 'secondary' && parent.domain_level !== 'primary') {
      errors.push('Secondary domains must have primary parent');
    } else if (domain.domain_level === 'area_of_interest' && parent.domain_level !== 'secondary') {
      errors.push('Areas must have secondary parent');
    }
  }
  
  return errors;
}
```

## Testing Requirements

### Unit Tests
```javascript
describe('Domain Hierarchy', () => {
  test('should retrieve complete hierarchy', async () => {
    const response = await request(app).get('/api/domains');
    expect(response.status).toBe(200);
    expect(response.body.hierarchy).toBeDefined();
  });
  
  test('should enforce primary domain has no parent', async () => {
    const domain = { name: 'Test', domain_level: 'primary', parent_domain_id: 'xyz' };
    const errors = await validateDomainHierarchy(domain);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

## Deliverables
- [x] Database migration script executed (`007_add_domain_hierarchy.sql`)
- [x] Domain hierarchy seeded with initial data (`seed-domain-hierarchy.js`)
- [x] API endpoints implemented and tested (`routes/domains.js`)
- [x] Validation rules enforced (`utils/domainValidation.js`)
- [x] Unit tests created (`tests/unit/domainValidation.test.js`)
- [x] Documentation updated

## Implementation Summary

### Files Created
1. **Migration Script**: `scripts/database/007_add_domain_hierarchy.sql`
   - Creates DOMAINS table with hierarchy support
   - Creates POSTING_DOMAINS junction table
   - Creates ALUMNI_DOMAINS table
   - Adds all necessary indexes

2. **Seed Script**: `scripts/database/seed-domain-hierarchy.js`
   - Seeds 5 primary domains (Technology, Healthcare, Business, Education, Engineering)
   - Seeds 13 secondary domains
   - Seeds 70+ areas of interest
   - Comprehensive domain taxonomy

3. **API Routes**: `routes/domains.js`
   - GET /api/domains - All domains with hierarchy
   - GET /api/domains/primary - Primary domains only
   - GET /api/domains/hierarchy - Complete tree structure
   - GET /api/domains/:id - Specific domain
   - GET /api/domains/:id/children - Child domains
   - POST /api/admin/domains - Create domain (admin)
   - PUT /api/admin/domains/:id - Update domain (admin)
   - DELETE /api/admin/domains/:id - Delete domain (admin)

4. **Validation Utilities**: `utils/domainValidation.js`
   - validateDomainHierarchy() - Enforce hierarchy rules
   - isDomainNameUnique() - Check name uniqueness
   - getDomainById() - Retrieve domain
   - getChildDomains() - Get children
   - hasChildDomains() - Check for children
   - canDeleteDomain() - Validate deletion
   - buildDomainTree() - Build complete tree

5. **Unit Tests**: `tests/unit/domainValidation.test.js`
   - 20+ test cases covering all validation rules
   - Hierarchy validation tests
   - Uniqueness tests
   - Retrieval tests
   - Deletion validation tests
   - Tree building tests

6. **Migration Runner**: `scripts/database/run-domain-migrations.js`
   - Automated migration execution
   - Verification of migration results
   - Error handling and rollback support

## Next Steps
After completion, proceed to:
- [Task 7.7.2: Enhanced Preferences Schema](./task-7.7.2-enhanced-preferences.md)

---

*Sub-task of Task 7.7: Domain Taxonomy & Preferences System*

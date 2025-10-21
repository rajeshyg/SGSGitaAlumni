# Task 7.7: Domain Taxonomy & Preferences System

**Status:** 🟡 Planned
**Priority:** High
**Estimated Time:** 8-10 days
**Dependencies:** Task 7.1 (API Foundation), Task 7.2 (Schema Mapping)

## Overview
Implement a comprehensive hierarchical domain taxonomy system with user preferences, supporting primary domains, secondary domains (sub-domains), and areas of interest. This system enables intelligent categorization of postings and precise matching between help seekers and providers.

## Objectives
- Create hierarchical domain structure (Primary → Secondary → Areas of Interest)
- Implement user preference system for domain selection
- Build reusable tag system with domain/category mappings
- Enable intelligent tag filtering based on selected domains
- Support dynamic configuration of domains and categories

## Business Requirements (from Prototype)

### User Preferences Interface
Users can configure:
1. **Primary Domain**: Single selection (e.g., Technology)
2. **Secondary Domains**: Multiple selections (e.g., Healthcare, Business)
3. **Areas of Interest**: Granular selections within domains
   - Technology: Software Development, AI/ML, Data Science, Cloud Computing, etc.
   - Healthcare: Clinical Medicine, Public Health, Medical Research, etc.
   - Business: Strategy, Marketing, Product Management, etc.

### Posting Creation Interface
When creating postings (offer/seek support):
1. **Domain Selection**: Choose relevant domains from hierarchy
2. **Category Selection**: Select from pre-configured categories
3. **Tag Selection**: Use existing tags or create custom tags
4. **Smart Tag Filtering**: Show only tags relevant to selected domains/categories

## Database Schema Enhancements

### Sub-Tasks
1. **[Task 7.7.1: Hierarchical Domain Schema](./task-7.7.1-hierarchical-domains.md)** - 2-3 days ✅ Complete
2. **[Task 7.7.2: Enhanced Preferences Schema](./task-7.7.2-enhanced-preferences.md)** - 2-3 days ✅ Complete
3. **[Task 7.7.3: Tag Management System](./task-7.7.3-tag-management.md)** - 3-4 days ✅ Complete
4. **[Task 7.7.4: Preferences UI Enhancement](./task-7.7.4-preferences-ui-enhancement.md)** - 2-3 days 🔄 In Progress
5. **[Task 7.7.8: Auto-Matching System](./task-7.7.8-auto-matching-system.md)** - 2-3 days ✅ Complete

## Technical Architecture

### Schema Changes Required

#### 1. Enhanced DOMAINS Table
```sql
-- Updated schema with hierarchy support
CREATE TABLE DOMAINS (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_domain_id CHAR(36) NULL,  -- NEW: For hierarchy
    domain_level ENUM('primary', 'secondary', 'area_of_interest') NOT NULL,  -- NEW
    display_order INT DEFAULT 0,  -- NEW: UI ordering
    icon VARCHAR(50),  -- NEW: UI icon identifier
    color_code VARCHAR(7),  -- Existing
    metadata JSON,  -- Existing
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (parent_domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE,
    INDEX idx_parent_domain (parent_domain_id),
    INDEX idx_domain_level (domain_level),
    INDEX idx_active (is_active)
);
```

#### 2. Enhanced USER_PREFERENCES Table
```sql
-- Comprehensive preferences system
CREATE TABLE USER_PREFERENCES (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    
    -- Domain preferences
    primary_domain_id CHAR(36),  -- NEW: Single primary domain
    secondary_domain_ids JSON,  -- NEW: Array of secondary domain UUIDs
    areas_of_interest_ids JSON,  -- NEW: Array of area UUIDs
    
    -- Posting preferences (existing + new)
    preference_type ENUM('offer_support', 'seek_support', 'both') DEFAULT 'both',
    max_postings INT DEFAULT 5,
    
    -- Notification preferences
    notification_settings JSON DEFAULT '{}',
    
    -- Privacy preferences
    privacy_settings JSON DEFAULT '{}',  -- NEW
    
    -- Interface preferences
    interface_settings JSON DEFAULT '{}',  -- NEW
    
    -- User status
    is_professional BOOLEAN DEFAULT FALSE,
    education_status ENUM('student', 'professional') DEFAULT 'professional',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES USERS(id) ON DELETE CASCADE,
    FOREIGN KEY (primary_domain_id) REFERENCES DOMAINS(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_preferences (user_id),
    INDEX idx_user_id (user_id),
    INDEX idx_primary_domain (primary_domain_id)
);
```

#### 3. New POSTING_DOMAINS Table
```sql
-- Many-to-many relationship for postings and domains
CREATE TABLE POSTING_DOMAINS (
    id CHAR(36) PRIMARY KEY,
    posting_id CHAR(36) NOT NULL,
    domain_id CHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,  -- Distinguish primary vs secondary
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE,
    UNIQUE KEY unique_posting_domain (posting_id, domain_id),
    INDEX idx_posting_id (posting_id),
    INDEX idx_domain_id (domain_id),
    INDEX idx_is_primary (is_primary)
);
```

#### 4. New TAGS Table
```sql
-- Reusable tag system
CREATE TABLE TAGS (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    tag_type ENUM('system', 'custom') DEFAULT 'custom',
    usage_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_tag_type (tag_type),
    INDEX idx_usage_count (usage_count DESC)
);
```

#### 5. New TAG_DOMAIN_MAPPINGS Table
```sql
-- Map tags to relevant domains/categories
CREATE TABLE TAG_DOMAIN_MAPPINGS (
    id CHAR(36) PRIMARY KEY,
    tag_id CHAR(36) NOT NULL,
    domain_id CHAR(36),  -- NULL = applicable to all domains
    category_id CHAR(36),  -- NULL = applicable to all categories
    relevance_score DECIMAL(3,2) DEFAULT 1.00,  -- 0.00 to 1.00
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (tag_id) REFERENCES TAGS(id) ON DELETE CASCADE,
    FOREIGN KEY (domain_id) REFERENCES DOMAINS(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES POSTING_CATEGORIES(id) ON DELETE CASCADE,
    UNIQUE KEY unique_tag_domain_category (tag_id, domain_id, category_id),
    INDEX idx_tag_id (tag_id),
    INDEX idx_domain_id (domain_id),
    INDEX idx_category_id (category_id)
);
```

#### 6. New POSTING_TAGS Table
```sql
-- Many-to-many relationship for postings and tags
CREATE TABLE POSTING_TAGS (
    id CHAR(36) PRIMARY KEY,
    posting_id CHAR(36) NOT NULL,
    tag_id CHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES TAGS(id) ON DELETE CASCADE,
    UNIQUE KEY unique_posting_tag (posting_id, tag_id),
    INDEX idx_posting_id (posting_id),
    INDEX idx_tag_id (tag_id)
);
```

## API Endpoints Required

### Domain Management
```
GET    /api/domains                    # Get all active domains with hierarchy
GET    /api/domains/:id                # Get specific domain details
GET    /api/domains/hierarchy          # Get complete domain tree
GET    /api/domains/primary            # Get all primary domains
GET    /api/domains/:id/children       # Get child domains
POST   /api/admin/domains              # Create new domain (admin only)
PUT    /api/admin/domains/:id          # Update domain (admin only)
DELETE /api/admin/domains/:id          # Delete domain (admin only)
```

### User Preferences
```
GET    /api/preferences/:userId        # Get user preferences
PUT    /api/preferences/:userId        # Update user preferences
GET    /api/preferences/domains        # Get available domains for selection
POST   /api/preferences/validate       # Validate preference configuration
```

### Tag Management
```
GET    /api/tags                       # Get all active tags
GET    /api/tags/search?q=             # Search tags by name
GET    /api/tags/suggested?domains=    # Get suggested tags for domains
POST   /api/tags                       # Create custom tag
GET    /api/tags/:id/mappings          # Get domain/category mappings
POST   /api/admin/tags/:id/map         # Create tag mapping (admin only)
```

### Posting-Domain Integration
```
POST   /api/postings                   # Include domain_ids in request body
GET    /api/postings?domain_ids=       # Filter by domains
GET    /api/postings/:id/domains       # Get posting domains
PUT    /api/postings/:id/domains       # Update posting domains
```

## Implementation Phases

### Phase 1: Database Schema (2-3 days)
- Create migration scripts for all new tables
- Enhance existing DOMAINS table
- Enhance existing USER_PREFERENCES table
- Create indexes for performance
- Seed initial domain hierarchy data

### Phase 2: API Development (3-4 days)
- Implement domain management APIs
- Implement preferences APIs
- Implement tag management APIs
- Add domain/tag integration to posting APIs
- Create validation logic for preferences

### Phase 3: Frontend Integration (3-4 days)
- Build domain selection UI components
- Build preferences configuration page
- Build tag selector with smart filtering
- Integrate with posting creation form
- Add preference persistence

## Data Seeding Strategy

### Initial Domain Hierarchy
```javascript
// Example domain structure
{
  "Technology": {
    level: "primary",
    children: {
      "Software Development": { level: "secondary", areas: [...] },
      "Data Science": { level: "secondary", areas: [...] },
      "Cybersecurity": { level: "secondary", areas: [...] }
    }
  },
  "Healthcare": {
    level: "primary",
    children: {
      "Clinical Medicine": { level: "secondary", areas: [...] },
      "Public Health": { level: "secondary", areas: [...] }
    }
  },
  "Business": {
    level: "primary",
    children: {
      "Strategy & Consulting": { level: "secondary", areas: [...] },
      "Marketing": { level: "secondary", areas: [...] }
    }
  }
}
```

## Validation Rules

### User Preferences Constraints
- Exactly 1 primary domain required
- Maximum 3 secondary domains allowed
- Areas of interest must belong to selected domains
- Cannot select conflicting domain combinations

### Posting Domain Constraints
- At least 1 domain required per posting
- Maximum 5 domains per posting
- Primary domain flag limited to 1 per posting
- Domains must be active and valid

### Tag Constraints
- Tag name: 2-50 characters, alphanumeric + spaces
- Maximum 10 tags per posting
- Custom tags require approval for reuse (admin)
- Tag mappings must reference valid domains/categories

## Performance Considerations

### Indexes Required
```sql
-- Domain hierarchy queries
CREATE INDEX idx_domains_hierarchy ON DOMAINS(parent_domain_id, domain_level);

-- Preference lookups
CREATE INDEX idx_user_preferences_user ON USER_PREFERENCES(user_id);
CREATE INDEX idx_user_preferences_primary ON USER_PREFERENCES(primary_domain_id);

-- Posting domain filtering
CREATE INDEX idx_posting_domains_lookup ON POSTING_DOMAINS(domain_id, posting_id);
CREATE INDEX idx_posting_domains_primary ON POSTING_DOMAINS(is_primary, domain_id);

-- Tag filtering
CREATE INDEX idx_tag_mappings_domain ON TAG_DOMAIN_MAPPINGS(domain_id, tag_id);
CREATE INDEX idx_posting_tags_lookup ON POSTING_TAGS(tag_id, posting_id);
```

### Caching Strategy
- Cache domain hierarchy (TTL: 1 hour)
- Cache tag mappings (TTL: 30 minutes)
- Cache user preferences (TTL: 15 minutes)
- Invalidate on admin updates

## Testing Requirements

### Unit Tests
- Domain hierarchy retrieval
- Preference validation logic
- Tag mapping resolution
- Domain-tag filtering

### Integration Tests
- Complete preference save/retrieve flow
- Posting creation with domains and tags
- Tag suggestion based on domain selection
- Hierarchy navigation

### UI Tests
- Domain selection interface
- Preference configuration page
- Tag selector with filtering
- Responsive design validation

## Success Criteria
- [ ] Hierarchical domain structure implemented and seeded
- [ ] User preferences system fully functional
- [ ] Tag system with domain/category mappings operational
- [ ] Smart tag filtering based on domain selection working
- [ ] All API endpoints implemented and tested
- [ ] Frontend preference page integrated
- [ ] Posting creation integrates domain/tag selection
- [ ] Performance targets met (< 100ms for domain queries)
- [ ] Data validation rules enforced
- [ ] Admin configuration interfaces operational

## Related Documents
- [Task 7.7.1: Hierarchical Domain Schema](./task-7.7.1-hierarchical-domains.md)
- [Task 7.7.2: Enhanced Preferences Schema](./task-7.7.2-enhanced-preferences.md)
- [Task 7.7.3: Tag Management System](./task-7.7.3-tag-management.md)
- [Task 7.7.4: Domain-Category Mappings](./task-7.7.4-domain-mappings.md)
- [Database Schema](../../lib/database/README.md)
- [API Documentation](../../api/README.md)

---

*This task establishes the foundation for intelligent domain categorization and user preference matching.*

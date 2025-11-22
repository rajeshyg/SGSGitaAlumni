# Task 7.7.2: Enhanced Preferences Schema

**Status:** ✅ Complete
**Priority:** High
**Estimated Time:** 2-3 days
**Actual Time:** 1 day
**Parent Task:** [Task 7.7: Domain Taxonomy & Preferences System](./task-7.7-domain-taxonomy-system.md)
**Dependencies:** [Task 7.7.1: Hierarchical Domain Schema](./task-7.7.1-hierarchical-domains.md)
**Completed:** 2025-10-13

## Overview
Enhance the USER_PREFERENCES table to support comprehensive preference configuration including primary domains, secondary domains (sub-domains), areas of interest, notification settings, privacy settings, and interface preferences.

## Objectives
- Expand USER_PREFERENCES with domain selection fields
- Implement preference validation rules
- Build preference configuration APIs
- Create preference UI integration points
- Support preference persistence and retrieval

## Database Schema Changes

### Enhanced USER_PREFERENCES Table
```sql
ALTER TABLE USER_PREFERENCES
-- Domain preferences (NEW)
ADD COLUMN primary_domain_id CHAR(36) AFTER user_id,
ADD COLUMN secondary_domain_ids JSON AFTER primary_domain_id,
ADD COLUMN areas_of_interest_ids JSON AFTER secondary_domain_ids,

-- Privacy preferences (NEW)
ADD COLUMN privacy_settings JSON DEFAULT '{}' AFTER notification_settings,

-- Interface preferences (NEW)
ADD COLUMN interface_settings JSON DEFAULT '{}' AFTER privacy_settings,

-- Constraints
ADD CONSTRAINT fk_primary_domain 
    FOREIGN KEY (primary_domain_id) REFERENCES DOMAINS(id) ON DELETE SET NULL,
    
ADD INDEX idx_primary_domain (primary_domain_id);

-- Update existing fields defaults
ALTER TABLE USER_PREFERENCES
MODIFY COLUMN notification_settings JSON DEFAULT '{"email_notifications": true, "push_notifications": true, "frequency": "daily"}',
MODIFY COLUMN privacy_settings JSON DEFAULT '{"profile_visibility": "all", "show_email": false, "show_phone": false}',
MODIFY COLUMN interface_settings JSON DEFAULT '{"theme": "system", "language": "en", "timezone": "UTC"}';
```

## JSON Field Structures

### secondary_domain_ids
```json
{
  "secondary_domain_ids": [
    "uuid-of-healthcare-domain",
    "uuid-of-business-domain"
  ]
}
```

### areas_of_interest_ids
```json
{
  "areas_of_interest_ids": [
    "uuid-of-software-development",
    "uuid-of-ai-ml",
    "uuid-of-data-science",
    "uuid-of-cloud-computing"
  ]
}
```

### notification_settings
```json
{
  "notification_settings": {
    "email_notifications": true,
    "push_notifications": true,
    "sms_notifications": false,
    "frequency": "immediate",  // immediate, daily, weekly
    "categories": {
      "new_matches": true,
      "interest_confirmations": true,
      "help_requests": true,
      "messages": true,
      "posting_updates": false
    },
    "quiet_hours": {
      "enabled": false,
      "start_time": "22:00",
      "end_time": "08:00"
    }
  }
}
```

### privacy_settings
```json
{
  "privacy_settings": {
    "profile_visibility": "all",  // all, members_only, connections_only
    "show_email": false,
    "show_phone": false,
    "show_linkedin": true,
    "show_location": true,
    "allow_messages_from": "all",  // all, connections_only, none
    "show_in_directory": true,
    "show_expertise_publicly": true
  }
}
```

### interface_settings
```json
{
  "interface_settings": {
    "theme": "system",  // light, dark, system
    "language": "en",
    "timezone": "UTC",
    "date_format": "MM/DD/YYYY",
    "items_per_page": 20,
    "default_view": "grid",  // grid, list
    "compact_mode": false
  }
}
```

## Validation Rules

### Domain Selection Constraints
```typescript
interface DomainValidationRules {
  primaryDomain: {
    required: true;
    count: 1;  // Exactly one
    level: 'primary';
  };
  secondaryDomains: {
    required: false;
    minCount: 0;
    maxCount: 3;
    level: 'secondary';
    parentMustMatch: true;  // Must be children of primary domain
  };
  areasOfInterest: {
    required: false;
    minCount: 0;
    maxCount: 20;  // Reasonable limit
    level: 'area_of_interest';
    parentMustMatch: true;  // Must be children of selected secondary domains
  };
}
```

### Validation Implementation
```typescript
// utils/preferenceValidation.ts
export async function validatePreferences(preferences: UserPreferences): Promise<string[]> {
  const errors: string[] = [];
  
  // 1. Primary domain required
  if (!preferences.primary_domain_id) {
    errors.push('Primary domain is required');
  } else {
    const primaryDomain = await getDomain(preferences.primary_domain_id);
    if (!primaryDomain || primaryDomain.domain_level !== 'primary') {
      errors.push('Invalid primary domain');
    }
  }
  
  // 2. Secondary domains validation
  if (preferences.secondary_domain_ids) {
    const secondaryIds = JSON.parse(preferences.secondary_domain_ids);
    
    if (secondaryIds.length > 3) {
      errors.push('Maximum 3 secondary domains allowed');
    }
    
    for (const domainId of secondaryIds) {
      const domain = await getDomain(domainId);
      
      if (!domain) {
        errors.push(`Secondary domain ${domainId} not found`);
        continue;
      }
      
      if (domain.domain_level !== 'secondary') {
        errors.push(`Domain ${domain.name} is not a secondary domain`);
      }
      
      if (domain.parent_domain_id !== preferences.primary_domain_id) {
        errors.push(`Secondary domain ${domain.name} does not belong to selected primary domain`);
      }
    }
  }
  
  // 3. Areas of interest validation
  if (preferences.areas_of_interest_ids) {
    const areaIds = JSON.parse(preferences.areas_of_interest_ids);
    const secondaryIds = JSON.parse(preferences.secondary_domain_ids || '[]');
    
    if (areaIds.length > 20) {
      errors.push('Maximum 20 areas of interest allowed');
    }
    
    for (const areaId of areaIds) {
      const area = await getDomain(areaId);
      
      if (!area) {
        errors.push(`Area of interest ${areaId} not found`);
        continue;
      }
      
      if (area.domain_level !== 'area_of_interest') {
        errors.push(`${area.name} is not an area of interest`);
      }
      
      // Area must belong to one of selected secondary domains
      if (!secondaryIds.includes(area.parent_domain_id)) {
        errors.push(`Area ${area.name} does not belong to selected secondary domains`);
      }
    }
  }
  
  return errors;
}
```

## API Endpoints

### Preference Retrieval
```typescript
// GET /api/preferences/:userId
// Get user preferences with populated domain details
export const getUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const preferences = await pool.query(`
      SELECT 
        up.*,
        pd.name as primary_domain_name,
        pd.icon as primary_domain_icon,
        pd.color_code as primary_domain_color
      FROM USER_PREFERENCES up
      LEFT JOIN DOMAINS pd ON up.primary_domain_id = pd.id
      WHERE up.user_id = ?
    `, [userId]);
    
    if (preferences[0].length === 0) {
      return res.status(404).json({ error: 'Preferences not found' });
    }
    
    const pref = preferences[0][0];
    
    // Populate secondary domains
    if (pref.secondary_domain_ids) {
      const secondaryIds = JSON.parse(pref.secondary_domain_ids);
      const secondaryDomains = await pool.query(`
        SELECT id, name, icon, color_code
        FROM DOMAINS
        WHERE id IN (?)
      `, [secondaryIds]);
      pref.secondary_domains = secondaryDomains[0];
    }
    
    // Populate areas of interest
    if (pref.areas_of_interest_ids) {
      const areaIds = JSON.parse(pref.areas_of_interest_ids);
      const areas = await pool.query(`
        SELECT id, name, parent_domain_id
        FROM DOMAINS
        WHERE id IN (?)
      `, [areaIds]);
      pref.areas_of_interest = areas[0];
    }
    
    res.json({
      success: true,
      preferences: pref
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Preference Update
```typescript
// PUT /api/preferences/:userId
// Update user preferences with validation
export const updateUserPreferences = async (req, res) => {
  try {
    const { userId } = req.params;
    const preferences = req.body;
    
    // Validate preferences
    const errors = await validatePreferences({
      ...preferences,
      user_id: userId
    });
    
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // Update preferences
    await pool.query(`
      UPDATE USER_PREFERENCES
      SET 
        primary_domain_id = ?,
        secondary_domain_ids = ?,
        areas_of_interest_ids = ?,
        preference_type = ?,
        max_postings = ?,
        notification_settings = ?,
        privacy_settings = ?,
        interface_settings = ?,
        is_professional = ?,
        education_status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `, [
      preferences.primary_domain_id,
      JSON.stringify(preferences.secondary_domain_ids || []),
      JSON.stringify(preferences.areas_of_interest_ids || []),
      preferences.preference_type,
      preferences.max_postings,
      JSON.stringify(preferences.notification_settings),
      JSON.stringify(preferences.privacy_settings),
      JSON.stringify(preferences.interface_settings),
      preferences.is_professional,
      preferences.education_status,
      userId
    ]);
    
    res.json({
      success: true,
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### Domain Options Retrieval
```typescript
// GET /api/preferences/domains/available
// Get available domains based on current selection
export const getAvailableDomains = async (req, res) => {
  try {
    const { primary_domain_id, secondary_domain_ids } = req.query;
    
    // Get primary domains
    const primaryDomains = await pool.query(`
      SELECT id, name, description, icon, color_code
      FROM DOMAINS
      WHERE domain_level = 'primary' AND is_active = TRUE
      ORDER BY display_order, name
    `);
    
    let secondaryDomains = [];
    let areasOfInterest = [];
    
    // Get secondary domains for selected primary
    if (primary_domain_id) {
      const secondaries = await pool.query(`
        SELECT id, name, description, icon
        FROM DOMAINS
        WHERE domain_level = 'secondary' 
          AND parent_domain_id = ?
          AND is_active = TRUE
        ORDER BY display_order, name
      `, [primary_domain_id]);
      secondaryDomains = secondaries[0];
    }
    
    // Get areas for selected secondaries
    if (secondary_domain_ids) {
      const secondaryIds = secondary_domain_ids.split(',');
      const areas = await pool.query(`
        SELECT id, name, parent_domain_id
        FROM DOMAINS
        WHERE domain_level = 'area_of_interest'
          AND parent_domain_id IN (?)
          AND is_active = TRUE
        ORDER BY parent_domain_id, display_order, name
      `, [secondaryIds]);
      areasOfInterest = areas[0];
    }
    
    res.json({
      success: true,
      primary_domains: primaryDomains[0],
      secondary_domains: secondaryDomains,
      areas_of_interest: areasOfInterest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

## Migration Script

```sql
-- File: migrations/008_enhance_user_preferences.sql
START TRANSACTION;

-- Add new columns to USER_PREFERENCES
ALTER TABLE USER_PREFERENCES
ADD COLUMN primary_domain_id CHAR(36) AFTER user_id,
ADD COLUMN secondary_domain_ids JSON AFTER primary_domain_id,
ADD COLUMN areas_of_interest_ids JSON AFTER secondary_domain_ids,
ADD COLUMN privacy_settings JSON DEFAULT '{"profile_visibility": "all", "show_email": false, "show_phone": false}' AFTER notification_settings,
ADD COLUMN interface_settings JSON DEFAULT '{"theme": "system", "language": "en", "timezone": "UTC"}' AFTER privacy_settings;

-- Add foreign key constraint
ALTER TABLE USER_PREFERENCES
ADD CONSTRAINT fk_primary_domain 
FOREIGN KEY (primary_domain_id) REFERENCES DOMAINS(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_primary_domain ON USER_PREFERENCES(primary_domain_id);

-- Update notification_settings default for existing rows
UPDATE USER_PREFERENCES
SET notification_settings = '{"email_notifications": true, "push_notifications": true, "frequency": "daily"}'
WHERE notification_settings IS NULL OR notification_settings = '{}';

COMMIT;
```

## Frontend Integration Points

### Preferences Page Structure
```typescript
// Component structure for /preferences page
interface PreferencesPage {
  tabs: [
    'Profile',      // User profile info
    'Domains',      // Domain selection (focus of this task)
    'Notifications',// Notification preferences
    'Privacy',      // Privacy settings
    'Interface'     // UI preferences
  ];
}

// Domain tab component
interface DomainPreferences {
  primaryDomain: SingleSelect;       // Dropdown, required
  secondaryDomains: MultiSelect;     // Max 3, filtered by primary
  areasOfInterest: CheckboxGroup;    // Filtered by secondaries
}
```

### Example UI Flow
```
1. User selects Primary Domain: "Technology"
   → Secondary domains filtered to show only Technology children
   → Areas of interest cleared

2. User selects Secondary Domains: "Software Development", "Data Science"
   → Areas of interest filtered to show only children of selected secondaries

3. User selects Areas: "Frontend Development", "Machine Learning", "Cloud Computing"
   → Validation ensures areas belong to selected secondaries

4. User clicks Save
   → API validates all selections
   → Updates USER_PREFERENCES
   → Returns success
```

## Default Preferences on User Creation

```typescript
// Create default preferences for new user
export async function createDefaultPreferences(userId: string) {
  await pool.query(`
    INSERT INTO USER_PREFERENCES (
      id, user_id, 
      preference_type, max_postings,
      notification_settings, privacy_settings, interface_settings,
      is_professional, education_status
    ) VALUES (
      UUID(), ?,
      'both', 5,
      '{"email_notifications": true, "push_notifications": true, "frequency": "daily"}',
      '{"profile_visibility": "all", "show_email": false, "show_phone": false}',
      '{"theme": "system", "language": "en", "timezone": "UTC"}',
      FALSE, 'professional'
    )
  `, [userId]);
}
```

## Testing Requirements

### Unit Tests
```javascript
describe('Preference Validation', () => {
  test('should require primary domain', async () => {
    const errors = await validatePreferences({ user_id: 'test' });
    expect(errors).toContain('Primary domain is required');
  });
  
  test('should limit secondary domains to 3', async () => {
    const errors = await validatePreferences({
      primary_domain_id: 'tech-uuid',
      secondary_domain_ids: JSON.stringify(['id1', 'id2', 'id3', 'id4'])
    });
    expect(errors).toContain('Maximum 3 secondary domains allowed');
  });
  
  test('should validate secondary domains belong to primary', async () => {
    // Test implementation
  });
});
```

### Integration Tests
```javascript
describe('Preferences API', () => {
  test('should retrieve user preferences with populated domains', async () => {
    const response = await request(app).get('/api/preferences/user123');
    expect(response.status).toBe(200);
    expect(response.body.preferences.primary_domain_name).toBeDefined();
    expect(response.body.preferences.secondary_domains).toBeArray();
  });
  
  test('should update preferences with validation', async () => {
    const response = await request(app)
      .put('/api/preferences/user123')
      .send({ primary_domain_id: 'tech-uuid' });
    expect(response.status).toBe(200);
  });
});
```

## Deliverables
- [x] Database migration executed (`008_enhance_user_preferences.sql`)
- [x] USER_PREFERENCES table enhanced with domain fields
- [x] Validation logic implemented and tested
- [x] API endpoints created and functional (`routes/preferences.js`)
- [x] Default preferences creation working
- [x] Integration ready for posting creation
- [x] Documentation updated

## Implementation Summary

### Files Created
1. **Migration Script**: `scripts/database/008_enhance_user_preferences.sql`
   - Creates USER_PREFERENCES table with all fields
   - Adds primary_domain_id, secondary_domain_ids, areas_of_interest_ids
   - Adds privacy_settings and interface_settings JSON fields
   - Creates foreign key to DOMAINS table
   - Adds all necessary indexes

2. **API Routes**: `routes/preferences.js`
   - GET /api/preferences/:userId - Get user preferences with populated domains
   - PUT /api/preferences/:userId - Update preferences with validation
   - GET /api/preferences/domains/available - Get available domains for selection
   - POST /api/preferences/validate - Validate preferences without saving
   - createDefaultPreferences() - Helper for new user creation

3. **Validation Functions**:
   - validatePreferences() - Comprehensive preference validation
     * Primary domain required and must be 'primary' level
     * Max 3 secondary domains, must belong to primary
     * Max 20 areas of interest, must belong to secondaries
     * All domains must be active
   - Integrated into routes/preferences.js

4. **Server Integration**: Updated `server.js`
   - Added preferences routes import
   - Set up database pool for preferences
   - Registered all 4 preference endpoints
   - Added authentication middleware where needed

### Validation Rules Implemented
- **Primary Domain**: Required, exactly 1, must be 'primary' level
- **Secondary Domains**: Optional, max 3, must be 'secondary' level, must belong to primary
- **Areas of Interest**: Optional, max 20, must be 'area_of_interest' level, must belong to secondaries
- **JSON Fields**: Proper defaults for notification_settings, privacy_settings, interface_settings

### Database Schema
```sql
USER_PREFERENCES
├── id (CHAR(36) PK)
├── user_id (INT FK → app_users)
├── primary_domain_id (CHAR(36) FK → DOMAINS)
├── secondary_domain_ids (JSON)
├── areas_of_interest_ids (JSON)
├── preference_type (ENUM)
├── max_postings (INT)
├── notification_settings (JSON)
├── privacy_settings (JSON)
├── interface_settings (JSON)
├── is_professional (BOOLEAN)
├── education_status (ENUM)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Next Steps
After completion, proceed to:
- [Task 7.7.3: Tag Management System](./task-7.7.3-tag-management.md)
- Integration with posting creation form
- Preferences UI implementation

---

*Sub-task of Task 7.7: Domain Taxonomy & Preferences System*

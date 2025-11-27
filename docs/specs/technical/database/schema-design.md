---
title: Database Schema Design Patterns
version: 2.0
status: implemented
last_updated: 2025-11-27
applies_to: database
---

# Database Schema Design Patterns

## Overview

Generic schema design patterns and conventions for database architecture, including table relationships, primary/foreign keys, and data type conventions.

**Note**: This document provides patterns and conventions. For feature-specific schemas, see `docs/specs/functional/[feature-name]/db-schema.md`.

## Table Naming Conventions

- **UPPERCASE**: Feature-specific tables (e.g., `ENTITY_NAME`, `FEATURE_DATA`)
- **snake_case**: System/core tables (e.g., `app_users`, `system_config`)

## Common Table Relationship Patterns

### One-to-Many Pattern

```
[PARENT_TABLE] (1) ----< (N) [CHILD_TABLE]
```

**Example**: Users to their items
```
app_users (1) ----< (N) [ENTITY_NAME]
```

### Many-to-Many Pattern (with Junction Table)

```
[TABLE_A] (N) >----< (N) [TABLE_B] (via [JUNCTION_TABLE])
```

**Example**: Items with multiple tags
```
[ENTITY_NAME] (N) >----< (N) [TAG_TABLE] (via [ENTITY_TAG_JOIN])
```

### One-to-One Pattern

```
[TABLE_A] (1) ---- (1) [TABLE_B]
```

**Example**: User preferences
```
app_users (1) ---- (1) [USER_PREFERENCES]
```

## Primary Key Strategy

All tables use UUID (CHAR(36)) as primary keys for:
- Distributed ID generation
- Security (non-sequential)
- Consistency across services

```sql
-- Example primary key definition
CREATE TABLE [TABLE_NAME] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ...
);
```

## Foreign Key Conventions

```sql
-- User reference pattern (INT primary key)
user_id INT NOT NULL,
FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE

-- UUID reference pattern (CHAR(36) primary key)
[entity]_id CHAR(36) NOT NULL,
FOREIGN KEY ([entity]_id) REFERENCES [TABLE_NAME](id) ON DELETE CASCADE
```

## Common Column Types

| Column Type | MySQL Type | Usage |
|------------|------------|-------|
| ID | CHAR(36) | Primary keys, UUIDs |
| User ID | INT | References to app_users |
| Status | ENUM | Predefined status values |
| Timestamps | DATETIME | created_at, updated_at |
| Boolean | TINYINT(1) | Flags (is_active, is_pinned) |
| JSON Data | JSON | Arrays, nested objects |
| Text Content | TEXT | Long-form content |

## Standard Audit Columns

All tables include:

```sql
created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
```

## ENUM Types

### Status Pattern (Generic)
```sql
-- For user/entity status
ENUM('pending', 'active', 'suspended', 'deactivated')

-- For content/workflow status
ENUM('draft', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived')
```

### Type/Classification Pattern
```sql
-- For entity types
ENUM('[TYPE_1]', '[TYPE_2]', '[TYPE_3]')

-- Example: Conversation types
ENUM('DIRECT', 'GROUP')
```

### Role/Permission Pattern
```sql
-- For user roles or permissions
ENUM('OWNER', 'ADMIN', 'MEMBER')
```

## JSON Column Patterns

```sql
-- Array of IDs
secondary_domain_ids JSON DEFAULT '[]',
areas_of_interest_ids JSON DEFAULT '[]',

-- Metadata object
media_metadata JSON DEFAULT NULL
```

## Reference Implementation Patterns

- `server/config/database.js` - Database connection and utilities
- `routes/[feature-name].js` - Feature-specific table operations
- `server/services/[FeatureName]Service.js` - Business logic and database interactions

## Feature-Specific Schemas

For detailed table schemas of specific features:
- See `docs/specs/functional/[feature-name]/db-schema.md`
- Use template: `docs/specs/functional/_TEMPLATE_db-schema.md`

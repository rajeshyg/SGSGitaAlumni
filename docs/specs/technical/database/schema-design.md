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
- **snake_case**: System/core tables (e.g., `authenticated_users`, `system_config`)

## Common Table Relationship Patterns

### One-to-Many Pattern

```
[PARENT_TABLE] (1) ----< (N) [CHILD_TABLE]
```

**Example**: Authors to their posts
```
authors (1) ----< (N) posts
```

**Implementation**:
```sql
CREATE TABLE authors (id INT PRIMARY KEY, ...);
CREATE TABLE posts (
  id CHAR(36) PRIMARY KEY,
  author_id INT NOT NULL,
  FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE
);
```

### Many-to-Many Pattern (with Junction Table)

```
[TABLE_A] (N) >----< (N) [TABLE_B] (via [JUNCTION_TABLE])
```

**Example**: Posts with multiple categories
```
posts (N) >----< (N) categories (via post_categories)
```

**Implementation**:
```sql
CREATE TABLE posts (...);
CREATE TABLE categories (...);
CREATE TABLE post_categories (
  post_id CHAR(36) NOT NULL,
  category_id CHAR(36) NOT NULL,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  UNIQUE KEY (post_id, category_id)
);
```

### One-to-One Pattern

```
[TABLE_A] (1) ---- (1) [TABLE_B]
```

**Example**: User preferences (one per user)
```
users (1) ---- (1) user_preferences
```

**Implementation**:
```sql
CREATE TABLE users (...);
CREATE TABLE user_preferences (
  user_id INT UNIQUE NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
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

### Status Pattern

**Account/User Status**:
```sql
ENUM('pending', 'active', 'suspended', 'deactivated')
-- pending: Initial state, awaiting verification
-- active: Fully functional account
-- suspended: Temporarily blocked
-- deactivated: Permanently disabled by user
```

**Content/Workflow Status**:
```sql
ENUM('draft', 'pending_review', 'approved', 'active', 'rejected', 'archived')
-- draft: Created but not submitted
-- pending_review: Awaiting moderation
-- approved: Passed review
-- active: Published/visible
-- rejected: Failed moderation
-- archived: Soft-deleted
```

### Type/Classification Pattern

**For Discriminating Entity Types**:
```sql
-- Store type in enum to enable polymorphic queries
content_type ENUM('article', 'question', 'guide', 'announcement')

-- Keep types generic; specific names vary by application
[TYPE_FIELD] ENUM('[TYPE_1]', '[TYPE_2]', '[TYPE_3]')
```

### Role/Permission Pattern

**Access Levels**:
```sql
ENUM('full', 'limited', 'view_only', 'read_only')
-- full: All permissions
-- limited: Restricted permissions
-- view_only: Read access only
-- read_only: Alias for view_only
```

**Role-Based Access**:
```sql
ENUM('owner', 'admin', 'moderator', 'member', 'guest')
```

## JSON Column Patterns

**Array of Foreign Keys**:
```sql
-- Store array of related IDs for flexibility
related_item_ids JSON DEFAULT '[]',
-- Example: [36-char-uuid-1, 36-char-uuid-2, ...]
```

**Flexible Metadata Object**:
```sql
-- Store untyped key-value pairs
metadata JSON DEFAULT NULL,
-- Example: {"color": "blue", "priority": "high", "tags": ["urgent", "customer"]}
```

**Settings/Configuration**:
```sql
-- Flexible settings without schema changes
notification_settings JSON DEFAULT '{}',
-- Example: {"email_frequency": "daily", "sms_enabled": false}
```

## Implementation Patterns

**Code locations for patterns**:
- **Connection layer**: `server/config/database.js` or `db/connection.js`
- **Query operations**: `routes/[feature].js` (HTTP layer) or queries in `server/services/`
- **Business logic**: `server/services/[Feature]Service.js` or `business/[feature].js`

## Feature-Specific Schemas

For detailed, project-specific table schemas:
- See `docs/specs/functional/[feature-name]/db-schema.md`
- This technical document provides patterns only
- Functional specs contain concrete table definitions for your project

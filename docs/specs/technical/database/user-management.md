---
title: User Management Database Patterns
version: 2.0
status: implemented
last_updated: 2025-12-02
applies_to: database
---

# User Management Database Patterns

## Overview

Generic patterns and conventions for user account management, hierarchical user relationships, and verification workflows.

**Note**: For project-specific schemas, see `docs/specs/functional/[feature-name]/db-schema.md`.

## Core User Account Pattern

**Purpose**: Single source of truth for user authentication and identity.

```sql
-- Example: Basic user account structure
CREATE TABLE app_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  status ENUM('pending', 'active', 'suspended', 'deactivated') DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at DATETIME,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Hierarchical User Relationships Pattern

**Purpose**: Support parent-child relationships (family members, organizational hierarchy, etc.)

```sql
-- Example: Child/dependent accounts linked to parent user
CREATE TABLE RELATED_ACCOUNTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  parent_user_id INT NOT NULL,
  relationship ENUM('child', 'spouse', 'parent', 'sibling', 'other'),
  access_level ENUM('full', 'limited', 'view_only') DEFAULT 'full',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
```

**Key Decisions**:
- Parent uses INT (auto-increment), child uses UUID for flexibility
- Cascading delete removes child records when parent is deleted
- `access_level` ENUM controls visibility/permissions

## Verification Workflow Pattern

**Purpose**: Track multi-stage verification (email, age, consent, etc.)

```sql
-- Pattern: Add verification columns to user table
-- For each verification type, track: flag, timestamp, method
ALTER TABLE app_users ADD COLUMN (
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at DATETIME,
  age_verified BOOLEAN DEFAULT FALSE,
  age_verified_at DATETIME,
  parent_consent_required BOOLEAN DEFAULT FALSE,
  parent_consent_given BOOLEAN DEFAULT FALSE,
  parent_consent_at DATETIME
);
```

**Variations**:
- Simple: Boolean flags only
- Complex: Add verification method, verified by admin ID, reason codes
- Age: Can derive from birth_date or estimate from other data

## Invitation/Access Request Pattern

**Purpose**: Manage user onboarding via invitation tokens

```sql
-- Example: Invitation workflow
CREATE TABLE ACCESS_REQUESTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) NOT NULL,
  user_id INT,
  invitation_token TEXT NOT NULL,
  invited_by INT NOT NULL,
  status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
  sent_at DATETIME,
  expires_at DATETIME,
  is_used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id),
  FOREIGN KEY (invited_by) REFERENCES app_users(id)
);
```

**Key Decisions**:
- Token stored as TEXT (max 21,000 chars) - tokens are typically 200+ chars
- `is_used` flag prevents reuse
- `expires_at` enables expiry validation at application layer

## User Preferences Pattern

**Purpose**: Store user settings (theme, notifications, interests, etc.) separately from core account

```sql
-- Example: Preferences one-to-one with user
CREATE TABLE USER_PREFERENCES (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id INT UNIQUE NOT NULL,
  notification_settings JSON DEFAULT '{}',
  privacy_settings JSON DEFAULT '{}',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);
```

**Pattern Notes**:
- Use UNIQUE foreign key to maintain one-to-one relationship
- JSON columns allow flexible, untyped settings
- Separating preferences allows easier schema evolution

## Related Documentation

- [Schema Design Patterns](./schema-design.md) - Base table patterns, PKs, FKs
- [Common Column Types](./schema-design.md#common-column-types) - Type strategies
- For project-specific user schemas: `docs/specs/functional/user-management/db-schema.md`

---
title: Database Schema Design
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: database
---

# Database Schema Design

## Overview

Core schema design for the SGS Gita Alumni application, including table relationships, primary/foreign keys, and data type conventions.

## Table Naming Conventions

- **UPPERCASE**: Core domain tables (e.g., `POSTINGS`, `MESSAGES`, `CONVERSATIONS`)
- **snake_case**: Legacy/migrated tables (e.g., `app_users`, `alumni_members`)

## Core Table Relationships

### User Domain

```
app_users (1) ----< (N) FAMILY_MEMBERS
app_users (1) ----< (N) USER_INVITATIONS
app_users (1) ---- (1) USER_PREFERENCES
app_users (1) ---- (1) alumni_members
```

### Content Domain

```
app_users (1) ----< (N) POSTINGS
POSTINGS (N) >----< (N) DOMAINS (via POSTING_DOMAINS)
POSTINGS (N) >----< (N) TAGS (via POSTING_TAGS)
POSTINGS (1) ----< (N) POSTING_COMMENTS
POSTINGS (1) ----< (N) POSTING_LIKES
POSTINGS (1) ----< (N) POSTING_ATTACHMENTS
```

### Messaging Domain

```
CONVERSATIONS (1) ----< (N) MESSAGES
CONVERSATIONS (N) >----< (N) app_users (via CONVERSATION_PARTICIPANTS)
MESSAGES (1) ----< (N) MESSAGE_REACTIONS
```

## Primary Key Strategy

All tables use UUID (CHAR(36)) as primary keys for:
- Distributed ID generation
- Security (non-sequential)
- Consistency across services

```sql
-- Example primary key definition
CREATE TABLE POSTINGS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  ...
);
```

## Foreign Key Conventions

```sql
-- User reference pattern
user_id INT NOT NULL,
FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE

-- UUID reference pattern
posting_id CHAR(36) NOT NULL,
FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE
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

### User Status
```sql
ENUM('pending', 'active', 'suspended', 'deactivated')
```

### Posting Status
```sql
ENUM('draft', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived')
```

### Conversation Type
```sql
ENUM('DIRECT', 'GROUP')
```

### Participant Role
```sql
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

## Reference Files

- `/utils/database.js` - Database connection and utilities
- `/routes/users.js` - User table operations
- `/routes/postings.js` - Posting table operations
- `/routes/chat.js` - Chat table operations

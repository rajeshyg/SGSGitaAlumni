---
title: Content Management Database Patterns
version: 2.0
status: implemented
last_updated: 2025-12-02
applies_to: database
---

# Content Management Database Patterns

## Overview

Generic patterns and conventions for content management, categorization, tagging, engagement, and moderation workflows.

**Note**: For project-specific content schemas, see `docs/specs/functional/[feature-name]/db-schema.md`.

## Content Entity Pattern

**Purpose**: Store user-generated content with core metadata, status, and timestamps.

```sql
-- Example: Basic content/posting structure
CREATE TABLE [CONTENT_TABLE] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status ENUM('draft', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived') DEFAULT 'pending_review',
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at DATETIME,
  expires_at DATETIME,

  FOREIGN KEY (author_id) REFERENCES app_users(id)
);
```

**Variations**:
- Add type discriminator: `content_type ENUM('article', 'question', 'post', ...)`
- Add urgency/priority: `priority ENUM('low', 'medium', 'high')`
- Add ownership: `owner_id INT` (creator vs. current owner)

## Hierarchical Categorization Pattern

**Purpose**: Organize content via parent-child category structure

```sql
-- Example: Multi-level categories (flat table, recursive)
CREATE TABLE [CATEGORIES] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id CHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_category_id) REFERENCES [CATEGORIES](id)
);

-- Link content to categories
CREATE TABLE [CONTENT_CATEGORIES] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id CHAR(36) NOT NULL,
  category_id CHAR(36) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (content_id) REFERENCES [CONTENT_TABLE](id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES [CATEGORIES](id),
  UNIQUE KEY (content_id, category_id)
);
```

**Key Decisions**:
- Single `parent_category_id` creates tree structure (not DAG)
- `is_primary` flag designates main category when content has multiple
- Soft delete: Use `is_active` flag instead of hard DELETE

## Multi-Faceted Tagging Pattern

**Purpose**: Support multiple independent tagging systems (free-form tags, predefined taxonomies, etc.)

```sql
-- Example 1: Simple free-form tags
CREATE TABLE TAGS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  tag_type VARCHAR(50),  -- 'skill', 'technology', 'location', etc.
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE [CONTENT_TAGS] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,

  FOREIGN KEY (content_id) REFERENCES [CONTENT_TABLE](id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES TAGS(id),
  UNIQUE KEY (content_id, tag_id)
);
```

**Variations**:
- Hierarchical domains: Add `domain_level ENUM('primary', 'secondary', 'detail')` to tags
- Weighted tags: Add `relevance_score DECIMAL(3,2)` to junction table
- Tag usage: Track frequency with materialized view or cached count

## Engagement Pattern

**Purpose**: Track user interactions (likes, reactions, views) on content

```sql
-- Likes/interests (toggle relationship)
CREATE TABLE [CONTENT_LIKES] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (content_id) REFERENCES [CONTENT_TABLE](id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  UNIQUE KEY (content_id, user_id)
);

-- Comments/discussion (append-only)
CREATE TABLE [CONTENT_COMMENTS] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id CHAR(36),  -- For nested threads
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (content_id) REFERENCES [CONTENT_TABLE](id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  FOREIGN KEY (parent_comment_id) REFERENCES [CONTENT_COMMENTS](id)
);
```

**Key Decisions**:
- UNIQUE on (content_id, user_id) prevents duplicate likes
- Null `parent_comment_id` = top-level comment
- View count incremented at application layer (not join-based)

## Content Moderation Pattern

**Purpose**: Support review workflow (draft → pending → approved → active)

```sql
-- Status workflow built into main content table
-- OR: Separate audit trail table for complex moderation

CREATE TABLE [MODERATION_AUDIT] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id CHAR(36) NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50),
  reviewed_by INT,
  reason TEXT,
  reviewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (content_id) REFERENCES [CONTENT_TABLE](id),
  FOREIGN KEY (reviewed_by) REFERENCES app_users(id)
);
```

**Pattern Notes**:
- Simple: Use `status` ENUM + `published_at` timestamp
- Complex: Add moderation queue table with reviewer assignments
- Audit trail enables transparency and admin review

## File Attachment Pattern

**Purpose**: Attach files/media to content

```sql
CREATE TABLE [CONTENT_ATTACHMENTS] (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  content_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  file_size INT,
  sort_order INT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (content_id) REFERENCES [CONTENT_TABLE](id) ON DELETE CASCADE
);
```

**Key Decisions**:
- File URL stored (actual files live in storage bucket)
- `file_type` helps with client-side rendering
- `sort_order` allows users to order attachments

## Full-Text Search Pattern

**Purpose**: Enable keyword search on content

```sql
-- Add FULLTEXT index to content table
ALTER TABLE [CONTENT_TABLE] ADD FULLTEXT INDEX ft_search (title, content);

-- Query pattern
SELECT * FROM [CONTENT_TABLE]
WHERE MATCH(title, content) AGAINST (? IN NATURAL LANGUAGE MODE)
  AND status = 'active'
ORDER BY MATCH(title, content) AGAINST (?) DESC;
```

## Related Documentation

- [Schema Design Patterns](./schema-design.md) - Base table patterns, PKs, FKs
- [Common Column Types](./schema-design.md#common-column-types) - Type strategies
- For project-specific content schemas: `docs/specs/functional/[feature-name]/db-schema.md`

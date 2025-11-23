---
title: Content Management Database Schema
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: database
---

# Content Management Database Schema

## Overview

Database schema for postings (offer/seek support), categories, domains, tags, and moderation.

## Tables

### POSTINGS

Main content table for support postings.

```sql
CREATE TABLE POSTINGS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  author_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  posting_type ENUM('offer_support', 'seek_support') NOT NULL,
  category_id CHAR(36),
  urgency_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',

  -- Contact info
  contact_name VARCHAR(200),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_country VARCHAR(100) DEFAULT 'USA',

  -- Location
  location VARCHAR(200),
  location_type ENUM('remote', 'in-person', 'hybrid') DEFAULT 'remote',
  duration VARCHAR(100),

  -- Status
  status ENUM('draft', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived') DEFAULT 'pending_review',
  moderation_status VARCHAR(50),

  -- Metrics
  view_count INT DEFAULT 0,
  interest_count INT DEFAULT 0,
  max_connections INT DEFAULT 5,

  -- Flags
  is_pinned BOOLEAN DEFAULT FALSE,

  -- Timestamps
  expires_at DATETIME,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (author_id) REFERENCES app_users(id),
  FOREIGN KEY (category_id) REFERENCES POSTING_CATEGORIES(id),

  FULLTEXT INDEX (title, content)
);
```

### POSTING_CATEGORIES

Categories for organizing postings.

```sql
CREATE TABLE POSTING_CATEGORIES (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_category_id CHAR(36),
  category_type VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_category_id) REFERENCES POSTING_CATEGORIES(id)
);
```

### DOMAINS

Hierarchical domain structure (Primary > Secondary > Areas of Interest).

```sql
CREATE TABLE DOMAINS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color_code VARCHAR(20),
  domain_level ENUM('primary', 'secondary', 'area_of_interest') NOT NULL,
  parent_domain_id CHAR(36),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_domain_id) REFERENCES DOMAINS(id)
);
```

### POSTING_DOMAINS

Junction table linking postings to domains.

```sql
CREATE TABLE POSTING_DOMAINS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  posting_id CHAR(36) NOT NULL,
  domain_id CHAR(36) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,

  FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
  FOREIGN KEY (domain_id) REFERENCES DOMAINS(id),
  UNIQUE KEY (posting_id, domain_id)
);
```

### TAGS

Free-form tags for postings.

```sql
CREATE TABLE TAGS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  name VARCHAR(100) NOT NULL,
  tag_type VARCHAR(50),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### POSTING_TAGS

Junction table linking postings to tags.

```sql
CREATE TABLE POSTING_TAGS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  posting_id CHAR(36) NOT NULL,
  tag_id CHAR(36) NOT NULL,

  FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES TAGS(id),
  UNIQUE KEY (posting_id, tag_id)
);
```

### POSTING_LIKES

User interest/likes on postings.

```sql
CREATE TABLE POSTING_LIKES (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  posting_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  UNIQUE KEY (posting_id, user_id)
);
```

### POSTING_COMMENTS

Comments on postings.

```sql
CREATE TABLE POSTING_COMMENTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  posting_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  comment_text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id)
);
```

### POSTING_ATTACHMENTS

File attachments for postings.

```sql
CREATE TABLE POSTING_ATTACHMENTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  posting_id CHAR(36) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  file_size INT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE
);
```

## Key Queries

### List Postings with Domains and Tags

```sql
SELECT DISTINCT
  p.*,
  pc.name as category_name,
  u.first_name as author_first_name,
  u.last_name as author_last_name,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('id', d.id, 'name', d.name, 'icon', d.icon)
    )
    FROM POSTING_DOMAINS pd
    JOIN DOMAINS d ON pd.domain_id = d.id
    WHERE pd.posting_id = p.id
  ) as domains,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('id', t.id, 'name', t.name)
    )
    FROM POSTING_TAGS pt
    JOIN TAGS t ON pt.tag_id = t.id
    WHERE pt.posting_id = p.id
  ) as tags
FROM POSTINGS p
LEFT JOIN app_users u ON p.author_id = u.id
LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
WHERE p.status IN ('active', 'approved')
ORDER BY p.is_pinned DESC, p.published_at DESC
LIMIT ? OFFSET ?;
```

### Full-Text Search

```sql
SELECT * FROM POSTINGS
WHERE MATCH(title, content) AGAINST (? IN NATURAL LANGUAGE MODE)
   OR title LIKE ?
   OR content LIKE ?;
```

### Archive Posting (Soft Delete)

```sql
UPDATE POSTINGS SET status = 'archived' WHERE id = ?;
```

## Business Rules

### Expiry Date Enforcement

Minimum 30-day expiry from creation:

```javascript
const minimumExpiryDate = new Date(created_at.getTime() + 30 * 24 * 60 * 60 * 1000);
const finalExpiryDate = userProvidedDate > minimumExpiryDate ? userProvidedDate : minimumExpiryDate;
```

## Reference Files

- `/routes/postings.js` - Posting API endpoints
- `/routes/moderation.js` - Moderation queue management

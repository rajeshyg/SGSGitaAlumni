---
title: Database Schema - Postings
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: postings
---

# Database Schema: Postings

## Overview

Database schema for the postings module, including support postings (offer/seek), categories, domains, tags, and engagement metrics.

**Related Technical Spec**: `docs/specs/technical/database/content-management.md`

## Tables

### POSTINGS

**Purpose**: Main content table for support postings (offer/seek support)

**Schema**:
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

    FULLTEXT INDEX ft_posting_content (title, content),
    INDEX idx_author_id (author_id),
    INDEX idx_status (status),
    INDEX idx_posting_type (posting_type),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| author_id | INT | NOT NULL, FK | Reference to app_users |
| title | VARCHAR(255) | NOT NULL | Posting title |
| content | TEXT | NOT NULL | Posting content |
| posting_type | ENUM | NOT NULL | offer_support, seek_support |
| urgency_level | ENUM | DEFAULT 'medium' | low, medium, high, critical |
| status | ENUM | DEFAULT 'pending_review' | Workflow status |
| expires_at | DATETIME | NULL | Auto-expiration datetime |

---

### POSTING_CATEGORIES

**Purpose**: Categories for organizing postings

**Schema**:
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

    FOREIGN KEY (parent_category_id) REFERENCES POSTING_CATEGORIES(id),
    INDEX idx_parent_category (parent_category_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### POSTING_DOMAINS

**Purpose**: Junction table linking postings to domains (many-to-many)

**Schema**:
```sql
CREATE TABLE POSTING_DOMAINS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    posting_id CHAR(36) NOT NULL,
    domain_id CHAR(36) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (domain_id) REFERENCES DOMAINS(id),
    UNIQUE KEY unique_posting_domain (posting_id, domain_id),

    INDEX idx_posting_id (posting_id),
    INDEX idx_domain_id (domain_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### POSTING_TAGS

**Purpose**: Junction table linking postings to tags (many-to-many)

**Schema**:
```sql
CREATE TABLE POSTING_TAGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    posting_id CHAR(36) NOT NULL,
    tag_id CHAR(36) NOT NULL,

    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES TAGS(id),
    UNIQUE KEY unique_posting_tag (posting_id, tag_id),

    INDEX idx_posting_id (posting_id),
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### TAGS

**Purpose**: Free-form tags for postings

**Schema**:
```sql
CREATE TABLE TAGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(100) NOT NULL UNIQUE,
    tag_type VARCHAR(50),
    usage_count INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_name (name),
    INDEX idx_usage_count (usage_count DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### POSTING_LIKES

**Purpose**: User interest/likes on postings

**Schema**:
```sql
CREATE TABLE POSTING_LIKES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    posting_id CHAR(36) NOT NULL,
    user_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id),
    UNIQUE KEY unique_posting_user_like (posting_id, user_id),

    INDEX idx_posting_id (posting_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### POSTING_COMMENTS

**Purpose**: Comments on postings

**Schema**:
```sql
CREATE TABLE POSTING_COMMENTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    posting_id CHAR(36) NOT NULL,
    user_id INT NOT NULL,
    comment_text TEXT NOT NULL,
    parent_comment_id CHAR(36) NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id),
    FOREIGN KEY (parent_comment_id) REFERENCES POSTING_COMMENTS(id) ON DELETE CASCADE,

    INDEX idx_posting_id (posting_id),
    INDEX idx_user_id (user_id),
    INDEX idx_parent_comment (parent_comment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### POSTING_ATTACHMENTS

**Purpose**: File attachments for postings

**Schema**:
```sql
CREATE TABLE POSTING_ATTACHMENTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    posting_id CHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_url VARCHAR(500) NOT NULL,
    file_size INT,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,

    INDEX idx_posting_id (posting_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
app_users (1) ----< (N) POSTINGS (author)
POSTINGS (N) >----< (N) DOMAINS (via POSTING_DOMAINS)
POSTINGS (N) >----< (N) TAGS (via POSTING_TAGS)
POSTINGS (1) ----< (N) POSTING_LIKES
POSTINGS (1) ----< (N) POSTING_COMMENTS
POSTINGS (1) ----< (N) POSTING_ATTACHMENTS
POSTINGS (N) ---- (1) POSTING_CATEGORIES
POSTING_COMMENTS (1) ----< (N) POSTING_COMMENTS (threaded replies)
```

## ENUM Types

### posting_type
```sql
ENUM('offer_support', 'seek_support')
```

### urgency_level
```sql
ENUM('low', 'medium', 'high', 'critical')
```

### posting_status
```sql
ENUM('draft', 'pending_review', 'approved', 'active', 'rejected', 'expired', 'archived')
```

### location_type
```sql
ENUM('remote', 'in-person', 'hybrid')
```

---

## Common Query Patterns

### Get Posting with All Metadata
```sql
SELECT p.*,
       u.first_name as author_first_name,
       u.last_name as author_last_name,
       pc.name as category_name,
       (SELECT COUNT(*) FROM POSTING_LIKES WHERE posting_id = p.id) as like_count,
       (SELECT COUNT(*) FROM POSTING_COMMENTS WHERE posting_id = p.id) as comment_count
FROM POSTINGS p
JOIN app_users u ON p.author_id = u.id
LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
WHERE p.id = ?;
```

### Get Posting Domains
```sql
SELECT d.id, d.name, d.icon, d.domain_level, pd.is_primary
FROM POSTING_DOMAINS pd
JOIN DOMAINS d ON pd.domain_id = d.id
WHERE pd.posting_id = ?;
```

### Get Posting Tags
```sql
SELECT t.id, t.name, t.tag_type
FROM POSTING_TAGS pt
JOIN TAGS t ON pt.tag_id = t.id
WHERE pt.posting_id = ?;
```

### Search Postings (Full-text)
```sql
SELECT p.*, MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE) as relevance
FROM POSTINGS p
WHERE MATCH(title, content) AGAINST(? IN NATURAL LANGUAGE MODE)
  AND p.status = 'active'
ORDER BY relevance DESC;
```

### Get Active Postings by Domain
```sql
SELECT p.* FROM POSTINGS p
JOIN POSTING_DOMAINS pd ON p.id = pd.posting_id
WHERE pd.domain_id = ?
  AND p.status = 'active'
  AND (p.expires_at IS NULL OR p.expires_at > NOW())
ORDER BY p.is_pinned DESC, p.created_at DESC;
```

---

## Migration Notes

### Version 1.0 (Initial)
- Created POSTINGS table with full workflow support
- Created POSTING_CATEGORIES for hierarchical organization
- Created POSTING_DOMAINS junction for domain associations
- Created POSTING_TAGS junction for tag associations
- Created engagement tables (LIKES, COMMENTS, ATTACHMENTS)

### Expiry Management
- Added `expires_at` with minimum 3-day constraint
- Added `archived` status for expired postings
- Implemented auto-archive job for expired postings

---

## Related

- Technical Spec: `docs/specs/technical/database/content-management.md`
- Functional Spec: `docs/specs/functional/postings/README.md`
- API Routes: `routes/postings.js`, `routes/tags.js`, `routes/domains.js`
- Service Layer: `server/services/PostingService.js`

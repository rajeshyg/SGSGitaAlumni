---
title: Database Schema - Moderation
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: moderation
---

# Database Schema: Moderation

## Overview

Database schema for the content moderation module, including moderation workflow, history tracking, and user reports.

## Tables

### POSTINGS (Moderation Columns)

**Purpose**: Moderation-related columns added to the POSTINGS table

**Schema (moderation columns only)**:
```sql
ALTER TABLE POSTINGS 
ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'PENDING',
ADD COLUMN moderated_by CHAR(36) DEFAULT NULL,
ADD COLUMN moderated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN rejection_reason VARCHAR(50) DEFAULT NULL,
ADD COLUMN moderator_feedback TEXT DEFAULT NULL,
ADD COLUMN moderator_notes TEXT DEFAULT NULL,
ADD COLUMN version INT DEFAULT 1,

CONSTRAINT fk_postings_moderated_by 
  FOREIGN KEY (moderated_by) REFERENCES app_users(id) ON DELETE SET NULL,

INDEX idx_postings_moderation_status (moderation_status, created_at);
```

**Moderation Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| moderation_status | VARCHAR(20) | DEFAULT 'PENDING' | PENDING, APPROVED, REJECTED, FLAGGED |
| moderated_by | CHAR(36) | FK, NULL | Moderator who reviewed |
| moderated_at | TIMESTAMP | NULL | Review timestamp |
| rejection_reason | VARCHAR(50) | NULL | Standardized rejection reason |
| moderator_feedback | TEXT | NULL | Feedback shown to author |
| moderator_notes | TEXT | NULL | Internal notes (not shown to author) |
| version | INT | DEFAULT 1 | Content version for edit tracking |

---

### MODERATION_HISTORY

**Purpose**: Audit trail of all moderation actions

**Schema**:
```sql
CREATE TABLE MODERATION_HISTORY (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    posting_id CHAR(36) NOT NULL,
    moderator_id CHAR(36) NOT NULL,
    action VARCHAR(20) NOT NULL,
    reason VARCHAR(50) DEFAULT NULL,
    feedback_to_user TEXT DEFAULT NULL,
    moderator_notes TEXT DEFAULT NULL,
    previous_status VARCHAR(20) NULL,
    new_status VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_moderation_history_posting
        FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    CONSTRAINT fk_moderation_history_moderator
        FOREIGN KEY (moderator_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_moderation_history_posting (posting_id, created_at DESC),
    INDEX idx_moderation_history_moderator (moderator_id, created_at DESC),
    INDEX idx_moderation_history_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| posting_id | CHAR(36) | NOT NULL, FK | Reference to POSTINGS |
| moderator_id | CHAR(36) | NOT NULL, FK | Moderator who took action |
| action | VARCHAR(20) | NOT NULL | APPROVE, REJECT, FLAG, REQUEST_EDIT |
| reason | VARCHAR(50) | NULL | Rejection/flag reason |
| feedback_to_user | TEXT | NULL | Feedback shown to content author |
| moderator_notes | TEXT | NULL | Internal notes |
| previous_status | VARCHAR(20) | NULL | Status before action |
| new_status | VARCHAR(20) | NULL | Status after action |

---

### CONTENT_REPORTS

**Purpose**: User-submitted reports for inappropriate content

**Schema**:
```sql
CREATE TABLE CONTENT_REPORTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    content_type ENUM('posting', 'comment', 'message', 'profile') NOT NULL,
    content_id CHAR(36) NOT NULL,
    reporter_id BIGINT NOT NULL,
    report_reason ENUM(
        'spam',
        'harassment',
        'inappropriate_content',
        'misinformation',
        'privacy_violation',
        'other'
    ) NOT NULL,
    report_details TEXT NULL,
    status ENUM('pending', 'under_review', 'resolved', 'dismissed') DEFAULT 'pending',
    resolution_notes TEXT NULL,
    resolved_by BIGINT NULL,
    resolved_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (reporter_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES app_users(id) ON DELETE SET NULL,

    INDEX idx_content_type_id (content_type, content_id),
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| content_type | ENUM | NOT NULL | posting, comment, message, profile |
| content_id | CHAR(36) | NOT NULL | ID of reported content |
| reporter_id | BIGINT | NOT NULL, FK | User who submitted report |
| report_reason | ENUM | NOT NULL | Standardized report reason |
| status | ENUM | DEFAULT 'pending' | Report resolution status |

---

### MODERATION_CRITERIA

**Purpose**: Configurable moderation rules and auto-moderation settings

**Schema**:
```sql
CREATE TABLE MODERATION_CRITERIA (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    criteria_type ENUM('keyword', 'pattern', 'threshold', 'rule') NOT NULL,
    criteria_name VARCHAR(100) NOT NULL,
    criteria_value TEXT NOT NULL,
    action ENUM('flag', 'auto_reject', 'require_review', 'warning') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    is_active BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE RESTRICT,

    INDEX idx_criteria_type (criteria_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### MODERATION_QUEUE_METRICS

**Purpose**: Tracking moderation workload and performance

**Schema**:
```sql
CREATE TABLE MODERATION_QUEUE_METRICS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    metric_date DATE NOT NULL,
    moderator_id BIGINT NULL,
    pending_count INT DEFAULT 0,
    approved_count INT DEFAULT 0,
    rejected_count INT DEFAULT 0,
    flagged_count INT DEFAULT 0,
    avg_review_time_seconds INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (moderator_id) REFERENCES app_users(id) ON DELETE SET NULL,

    UNIQUE KEY unique_date_moderator (metric_date, moderator_id),
    INDEX idx_metric_date (metric_date),
    INDEX idx_moderator_id (moderator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
POSTINGS (1) ----< (N) MODERATION_HISTORY
app_users (1) ----< (N) MODERATION_HISTORY (as moderator)
app_users (1) ----< (N) CONTENT_REPORTS (as reporter)
app_users (1) ----< (N) CONTENT_REPORTS (as resolver)
app_users (1) ----< (N) MODERATION_QUEUE_METRICS
```

## ENUM Types

### moderation_status
```sql
-- Values: PENDING, APPROVED, REJECTED, FLAGGED
VARCHAR(20) DEFAULT 'PENDING'
```

### moderation_action
```sql
-- Values: APPROVE, REJECT, FLAG, REQUEST_EDIT
VARCHAR(20)
```

### report_reason
```sql
ENUM('spam', 'harassment', 'inappropriate_content', 'misinformation', 'privacy_violation', 'other')
```

### report_status
```sql
ENUM('pending', 'under_review', 'resolved', 'dismissed')
```

---

## Common Query Patterns

### Get Moderation Queue
```sql
SELECT p.*, u.first_name as author_name, u.email as author_email
FROM POSTINGS p
JOIN app_users u ON p.author_id = u.id
WHERE p.moderation_status = 'PENDING'
ORDER BY p.created_at ASC;
```

### Get Moderation History for Posting
```sql
SELECT mh.*, u.first_name as moderator_name
FROM MODERATION_HISTORY mh
JOIN app_users u ON mh.moderator_id = u.id
WHERE mh.posting_id = ?
ORDER BY mh.created_at DESC;
```

### Get Moderator Performance
```sql
SELECT 
    u.id,
    u.first_name,
    COUNT(*) as total_actions,
    SUM(CASE WHEN mh.action = 'APPROVE' THEN 1 ELSE 0 END) as approvals,
    SUM(CASE WHEN mh.action = 'REJECT' THEN 1 ELSE 0 END) as rejections
FROM MODERATION_HISTORY mh
JOIN app_users u ON mh.moderator_id = u.id
WHERE mh.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY u.id, u.first_name;
```

### Get Pending Reports
```sql
SELECT cr.*, 
       reporter.first_name as reporter_name,
       CASE 
         WHEN cr.content_type = 'posting' THEN p.title
         ELSE NULL
       END as content_title
FROM CONTENT_REPORTS cr
JOIN app_users reporter ON cr.reporter_id = reporter.id
LEFT JOIN POSTINGS p ON cr.content_type = 'posting' AND cr.content_id = p.id
WHERE cr.status IN ('pending', 'under_review')
ORDER BY cr.created_at ASC;
```

---

## Migration Notes

### Version 1.0 (Initial - Task 8 Action 8)
- Added moderation columns to POSTINGS table
- Created MODERATION_HISTORY for audit trail
- Added indexes for moderation queue queries

### Version 1.1 (Content Reports)
- Added CONTENT_REPORTS for user-submitted reports
- Added MODERATION_CRITERIA for auto-moderation rules
- Added MODERATION_QUEUE_METRICS for performance tracking

---

## Related Documentation

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/moderation/README.md`
- API Routes: `routes/postings.js` (moderation endpoints)
- Middleware: `middleware/auth.js` (moderator role check)

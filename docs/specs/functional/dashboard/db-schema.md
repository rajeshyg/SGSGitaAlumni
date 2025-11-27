---
title: Database Schema - Dashboard
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: dashboard
---

# Database Schema: Dashboard

## Overview

Database schema for the dashboard module, including activity feed, user activity tracking, and personalized content.

## Tables

### ACTIVITY_FEED

**Purpose**: Stores activity feed items for the dashboard

**Schema**:
```sql
CREATE TABLE ACTIVITY_FEED (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_id CHAR(36) NOT NULL,
    metadata JSON NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    priority INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_source (source_type, source_id),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_user_feed (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| user_id | BIGINT | NOT NULL, FK | Feed owner |
| activity_type | VARCHAR(50) | NOT NULL | Type of activity |
| title | VARCHAR(255) | NOT NULL | Activity title |
| source_type | VARCHAR(50) | NOT NULL | Source entity type |
| source_id | CHAR(36) | NOT NULL | Source entity ID |
| is_pinned | BOOLEAN | DEFAULT FALSE | Pinned to top |

---

### FEED_ENGAGEMENT

**Purpose**: Tracks user engagement with feed items

**Schema**:
```sql
CREATE TABLE FEED_ENGAGEMENT (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    feed_item_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    engagement_type ENUM('view', 'click', 'like', 'share', 'dismiss') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (feed_item_id) REFERENCES ACTIVITY_FEED(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_feed_item (feed_item_id),
    INDEX idx_user_id (user_id),
    INDEX idx_engagement_type (engagement_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### USER_ACTIVITY_LOG

**Purpose**: Tracks user actions for analytics and personalization

**Schema**:
```sql
CREATE TABLE USER_ACTIVITY_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NULL,
    resource_id CHAR(36) NULL,
    metadata JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    session_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_resource (resource_type, resource_id),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### USER_DASHBOARD_SETTINGS

**Purpose**: Stores user's dashboard customization preferences

**Schema**:
```sql
CREATE TABLE USER_DASHBOARD_SETTINGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    widget_layout JSON NULL,
    hidden_widgets JSON NULL,
    feed_filters JSON NULL,
    quick_actions JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_dashboard (user_id),

    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
app_users (1) ----< (N) ACTIVITY_FEED
ACTIVITY_FEED (1) ----< (N) FEED_ENGAGEMENT
app_users (1) ----< (N) USER_ACTIVITY_LOG
app_users (1) ---- (1) USER_DASHBOARD_SETTINGS
```

## Activity Types

| Type | Description |
|------|-------------|
| `new_posting` | New posting in followed domain |
| `posting_response` | Someone responded to user's posting |
| `new_connection` | New connection accepted |
| `message_received` | New message received |
| `posting_approved` | User's posting was approved |
| `domain_update` | Update in followed domain |

---

## Common Query Patterns

### Get User's Activity Feed
```sql
SELECT af.*, 
       fe.engagement_count
FROM ACTIVITY_FEED af
LEFT JOIN (
    SELECT feed_item_id, COUNT(*) as engagement_count
    FROM FEED_ENGAGEMENT
    GROUP BY feed_item_id
) fe ON af.id = fe.feed_item_id
WHERE af.user_id = ?
  AND (af.expires_at IS NULL OR af.expires_at > NOW())
ORDER BY af.is_pinned DESC, af.priority DESC, af.created_at DESC
LIMIT ? OFFSET ?;
```

### Get User Activity Summary
```sql
SELECT 
    action_type,
    COUNT(*) as count,
    MAX(created_at) as last_activity
FROM USER_ACTIVITY_LOG
WHERE user_id = ?
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY action_type;
```

---

## Related Documentation

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/dashboard/README.md`
- API Routes: `routes/dashboard.js`

---
title: Database Schema - Notifications
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: notifications
---

# Database Schema: Notifications

## Overview

Database schema for the notifications module, including in-app notifications, email delivery tracking, and notification preferences.

## Tables

### NOTIFICATIONS

**Purpose**: Stores in-app notifications for users

**Schema**:
```sql
CREATE TABLE NOTIFICATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    action_url VARCHAR(500) NULL,
    source_type VARCHAR(50) NULL,
    source_id CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_notification_type (notification_type),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_user_unread (user_id, is_read, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| user_id | BIGINT | NOT NULL, FK | Notification recipient |
| notification_type | VARCHAR(50) | NOT NULL | Type category |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification content |
| data | JSON | NULL | Additional metadata |
| is_read | BOOLEAN | DEFAULT FALSE | Read status |
| action_url | VARCHAR(500) | NULL | Link to related content |
| source_type | VARCHAR(50) | NULL | Source entity type |
| source_id | CHAR(36) | NULL | Source entity ID |

---

### USER_NOTIFICATION_PREFERENCES

**Purpose**: Per-notification-type preferences for each user

**Schema**:
```sql
CREATE TABLE USER_NOTIFICATION_PREFERENCES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notification_type (user_id, notification_type),

    INDEX idx_user_id (user_id),
    INDEX idx_notification_type (notification_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| user_id | BIGINT | NOT NULL, FK | User reference |
| notification_type | VARCHAR(50) | NOT NULL | Type category |
| email_enabled | BOOLEAN | DEFAULT TRUE | Email delivery enabled |
| push_enabled | BOOLEAN | DEFAULT TRUE | Push notifications enabled |
| in_app_enabled | BOOLEAN | DEFAULT TRUE | In-app notifications enabled |

---

### email_delivery_logs

**Purpose**: Tracks email delivery status and history

**Schema**:
```sql
CREATE TABLE email_delivery_logs (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NULL,
    email_address VARCHAR(255) NOT NULL,
    email_type VARCHAR(50) NOT NULL,
    subject VARCHAR(500),
    template_id VARCHAR(100),
    status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked') DEFAULT 'pending',
    external_message_id VARCHAR(255),
    sent_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    error_message TEXT,
    error_code VARCHAR(50),
    retry_count INT DEFAULT 0,
    max_retries INT DEFAULT 3,
    next_retry_at TIMESTAMP NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_email_address (email_address),
    INDEX idx_email_type (email_type),
    INDEX idx_status (status),
    INDEX idx_sent_at (sent_at),
    INDEX idx_external_message_id (external_message_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| user_id | BIGINT | FK, NULL | User reference (null for non-user emails) |
| email_address | VARCHAR(255) | NOT NULL | Recipient email |
| email_type | VARCHAR(50) | NOT NULL | invitation, otp, notification, etc. |
| status | ENUM | DEFAULT 'pending' | Delivery status |
| external_message_id | VARCHAR(255) | NULL | Email provider's message ID |

---

### email_templates

**Purpose**: Email template definitions

**Schema**:
```sql
CREATE TABLE email_templates (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    template_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT NULL,
    variables JSON NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_template_key (template_key),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### PUSH_NOTIFICATION_TOKENS

**Purpose**: Stores device tokens for push notifications

**Schema**:
```sql
CREATE TABLE PUSH_NOTIFICATION_TOKENS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    device_token VARCHAR(500) NOT NULL,
    device_type ENUM('ios', 'android', 'web') NOT NULL,
    device_name VARCHAR(200) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_device_token (device_token),

    INDEX idx_user_id (user_id),
    INDEX idx_device_type (device_type),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
app_users (1) ----< (N) NOTIFICATIONS
app_users (1) ----< (N) USER_NOTIFICATION_PREFERENCES
app_users (1) ----< (N) email_delivery_logs
app_users (1) ----< (N) PUSH_NOTIFICATION_TOKENS
```

## ENUM Types

### email_status
```sql
ENUM('pending', 'sent', 'delivered', 'failed', 'bounced', 'opened', 'clicked')
```

### device_type
```sql
ENUM('ios', 'android', 'web')
```

---

## Notification Types

| Type | Description | Default Channels |
|------|-------------|------------------|
| `new_posting` | New posting in followed domain | in-app, push |
| `posting_approved` | Posting was approved | email, in-app |
| `posting_rejected` | Posting was rejected | email, in-app |
| `new_message` | New direct/group message | push, in-app |
| `mention` | User was mentioned | email, push, in-app |
| `connection_request` | New connection request | email, in-app |
| `system_alert` | System announcements | email, in-app |

---

## Common Query Patterns

### Get User's Unread Notifications
```sql
SELECT * FROM NOTIFICATIONS
WHERE user_id = ?
  AND is_read = FALSE
  AND (expires_at IS NULL OR expires_at > NOW())
ORDER BY created_at DESC
LIMIT 50;
```

### Get Notification Preferences
```sql
SELECT 
    np.*,
    COALESCE(unp.email_enabled, TRUE) as email_enabled,
    COALESCE(unp.push_enabled, TRUE) as push_enabled,
    COALESCE(unp.in_app_enabled, TRUE) as in_app_enabled
FROM (
    SELECT 'new_posting' as notification_type
    UNION SELECT 'posting_approved'
    UNION SELECT 'new_message'
    -- ... other types
) np
LEFT JOIN USER_NOTIFICATION_PREFERENCES unp 
    ON unp.notification_type = np.notification_type 
    AND unp.user_id = ?;
```

### Mark Notifications as Read
```sql
UPDATE NOTIFICATIONS
SET is_read = TRUE, read_at = NOW()
WHERE user_id = ? AND id IN (?);
```

### Get Email Delivery Stats
```sql
SELECT 
    email_type,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
    SUM(CASE WHEN status = 'opened' THEN 1 ELSE 0 END) as opened
FROM email_delivery_logs
WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY email_type;
```

---

## Migration Notes

### Version 1.0 (Initial)
- Created NOTIFICATIONS table for in-app notifications
- Created USER_NOTIFICATION_PREFERENCES for granular settings
- Created email_delivery_logs for email tracking
- Created email_templates for template management
- Created PUSH_NOTIFICATION_TOKENS for mobile push

---

## Related

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/notifications/README.md`
- API Routes: `routes/email.js`
- Service Layer: `server/services/NotificationService.js`

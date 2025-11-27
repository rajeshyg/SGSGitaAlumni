---
title: Database Schema - Admin
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: admin
---

# Database Schema: Admin

## Overview

Database schema for the admin module, including system analytics, audit logs, and administrative functions.

**Note**: Admin functionality primarily uses tables from other modules with role-based access control. This document covers admin-specific tables.

## Tables

### SYSTEM_ANALYTICS

**Purpose**: Aggregated system metrics for admin dashboard

**Schema**:
```sql
CREATE TABLE SYSTEM_ANALYTICS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    dimensions JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_metric (metric_date, metric_type, metric_name),

    INDEX idx_metric_date (metric_date),
    INDEX idx_metric_type (metric_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| metric_date | DATE | NOT NULL | Date of metric |
| metric_type | VARCHAR(50) | NOT NULL | users, postings, engagement, etc. |
| metric_name | VARCHAR(100) | NOT NULL | Specific metric name |
| metric_value | DECIMAL(15,2) | NOT NULL | Metric value |
| dimensions | JSON | NULL | Additional breakdowns |

---

### ADMIN_AUDIT_LOG

**Purpose**: Audit trail for administrative actions

**Schema**:
```sql
CREATE TABLE ADMIN_AUDIT_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    admin_id BIGINT NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id VARCHAR(100) NOT NULL,
    action_details JSON NULL,
    previous_state JSON NULL,
    new_state JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (admin_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_admin_id (admin_id),
    INDEX idx_action_type (action_type),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| admin_id | BIGINT | NOT NULL, FK | Admin who performed action |
| action_type | VARCHAR(50) | NOT NULL | create, update, delete, etc. |
| target_type | VARCHAR(50) | NOT NULL | user, posting, domain, etc. |
| target_id | VARCHAR(100) | NOT NULL | ID of affected entity |
| previous_state | JSON | NULL | State before change |
| new_state | JSON | NULL | State after change |

---

### SYSTEM_SETTINGS

**Purpose**: Global system configuration settings

**Schema**:
```sql
CREATE TABLE SYSTEM_SETTINGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    category VARCHAR(50) NOT NULL,
    description TEXT NULL,
    is_sensitive BOOLEAN DEFAULT FALSE,
    updated_by BIGINT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (updated_by) REFERENCES app_users(id) ON DELETE SET NULL,

    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### SCHEDULED_TASKS

**Purpose**: Tracks scheduled system tasks (cleanup, reports, etc.)

**Schema**:
```sql
CREATE TABLE SCHEDULED_TASKS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    task_name VARCHAR(100) NOT NULL UNIQUE,
    task_type VARCHAR(50) NOT NULL,
    schedule_expression VARCHAR(100) NOT NULL,
    last_run_at TIMESTAMP NULL,
    next_run_at TIMESTAMP NULL,
    last_run_status ENUM('success', 'failed', 'running') NULL,
    last_run_duration_ms INT NULL,
    error_message TEXT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_task_name (task_name),
    INDEX idx_next_run (next_run_at),
    INDEX idx_is_enabled (is_enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Referenced Tables (from other modules)

Admin functions primarily interact with:

| Table | Module | Admin Usage |
|-------|--------|-------------|
| `app_users` | user-management | User administration |
| `USER_INVITATIONS` | authentication | Invitation management |
| `POSTINGS` | postings | Content oversight |
| `MODERATION_HISTORY` | moderation | Moderation oversight |
| `DOMAINS` | directory | Domain management |
| `email_delivery_logs` | notifications | Email monitoring |

---

## Table Relationships

```
app_users (1) ----< (N) ADMIN_AUDIT_LOG (as admin)
app_users (1) ----< (N) SYSTEM_SETTINGS (as updater)
```

## Metric Types

| Type | Description |
|------|-------------|
| `users` | User registration, active users, etc. |
| `postings` | Posting creation, engagement |
| `messages` | Messaging activity |
| `moderation` | Moderation queue stats |
| `system` | Server health, performance |

---

## Common Query Patterns

### Get System Metrics for Date Range
```sql
SELECT metric_date, metric_type, metric_name, metric_value
FROM SYSTEM_ANALYTICS
WHERE metric_date BETWEEN ? AND ?
  AND metric_type = ?
ORDER BY metric_date, metric_name;
```

### Get Admin Audit Trail
```sql
SELECT al.*, u.first_name as admin_name, u.email as admin_email
FROM ADMIN_AUDIT_LOG al
JOIN app_users u ON al.admin_id = u.id
WHERE al.created_at >= ?
ORDER BY al.created_at DESC
LIMIT ?;
```

### Get System Settings by Category
```sql
SELECT setting_key, setting_value, setting_type, description
FROM SYSTEM_SETTINGS
WHERE category = ?
  AND is_sensitive = FALSE
ORDER BY setting_key;
```

---

## Migration Notes

### Version 1.0 (Initial)
- Created SYSTEM_ANALYTICS for dashboard metrics
- Created ADMIN_AUDIT_LOG for compliance
- Created SYSTEM_SETTINGS for configuration
- Created SCHEDULED_TASKS for job management

---

## Related Documentation

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/admin/README.md`
- API Routes: `routes/analytics.js`, `routes/monitoring.js`

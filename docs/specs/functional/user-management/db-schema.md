---
title: Database Schema - User Management
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: user-management
---

# Database Schema: User Management

## Overview

Database schema for the user management module, including user accounts, profiles, family members, and preferences.

## Tables

### app_users

**Purpose**: Core user accounts table for authentication and authorization

**Schema**:
```sql
CREATE TABLE app_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    alumni_member_id INT NULL,
    invitation_id CHAR(36) NULL,
    requires_otp BOOLEAN DEFAULT TRUE,
    last_otp_sent TIMESTAMP NULL,
    daily_otp_count INT DEFAULT 0,
    last_otp_reset_date DATE NULL,
    age_verified BOOLEAN DEFAULT FALSE,
    parent_consent_required BOOLEAN DEFAULT FALSE,
    parent_consent_given BOOLEAN DEFAULT FALSE,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    phone VARCHAR(20) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,

    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
    FOREIGN KEY (invitation_id) REFERENCES USER_INVITATIONS(id) ON DELETE SET NULL,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_invitation_id (invitation_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email address |
| password_hash | VARCHAR(255) | NULL | Hashed password (null for OTP-only) |
| role | ENUM | DEFAULT 'user' | user, admin, moderator |
| is_active | BOOLEAN | DEFAULT TRUE | Account active status |
| alumni_member_id | INT | FK, NULL | Link to alumni data |
| requires_otp | BOOLEAN | DEFAULT TRUE | OTP authentication enabled |

---

### user_profiles

**Purpose**: Extended user profile information

**Schema**:
```sql
CREATE TABLE user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    alumni_member_id INT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    display_name VARCHAR(150) NULL,
    bio TEXT NULL,
    avatar_url VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    social_links JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_alumni_member_id (alumni_member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY | Unique profile identifier |
| user_id | BIGINT | NOT NULL, FK | Reference to app_users |
| display_name | VARCHAR(150) | NULL | User's chosen display name |
| bio | TEXT | NULL | User biography |
| avatar_url | VARCHAR(500) | NULL | Profile photo URL |
| social_links | JSON | NULL | Social media links |

---

### FAMILY_MEMBERS

**Purpose**: Individual profiles for family members under a parent account (Netflix-style)

**Schema**:
```sql
CREATE TABLE FAMILY_MEMBERS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    parent_user_id BIGINT NOT NULL,
    alumni_member_id INT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    birth_date DATE NULL,
    age_at_registration INT NULL,
    current_age INT NULL,
    can_access_platform BOOLEAN DEFAULT FALSE,
    requires_parent_consent BOOLEAN DEFAULT FALSE,
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    relationship ENUM('self', 'child', 'spouse', 'sibling', 'guardian') DEFAULT 'child',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(500),
    bio TEXT,
    status ENUM('active', 'inactive', 'suspended', 'pending_consent') DEFAULT 'pending_consent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    last_consent_check_at TIMESTAMP NULL,

    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,

    INDEX idx_parent_user_id (parent_user_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_access_level (access_level),
    INDEX idx_can_access (can_access_platform),
    INDEX idx_status (status),
    INDEX idx_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| parent_user_id | BIGINT | NOT NULL, FK | Parent account holder |
| birth_date | DATE | NULL | For age calculation |
| access_level | ENUM | DEFAULT 'blocked' | full, supervised, blocked |
| relationship | ENUM | DEFAULT 'child' | Relation to parent |

---

### USER_PREFERENCES

**Purpose**: User account preferences and settings

**Schema**:
```sql
CREATE TABLE USER_PREFERENCES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    sms_notifications BOOLEAN DEFAULT FALSE,
    digest_frequency ENUM('daily', 'weekly', 'monthly', 'never') DEFAULT 'weekly',
    privacy_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_preference (user_id),

    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### USER_NOTIFICATION_PREFERENCES

**Purpose**: Granular notification preferences

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

---

### USER_PRIVACY_SETTINGS

**Purpose**: Privacy and visibility settings

**Schema**:
```sql
CREATE TABLE USER_PRIVACY_SETTINGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id BIGINT NOT NULL,
    profile_visibility ENUM('public', 'alumni_only', 'private') DEFAULT 'alumni_only',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_location BOOLEAN DEFAULT TRUE,
    allow_messages_from ENUM('anyone', 'alumni_only', 'connections_only', 'none') DEFAULT 'alumni_only',
    show_activity_status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_privacy (user_id),

    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### FAMILY_ACCESS_LOG

**Purpose**: Tracks family member platform access for auditing

**Schema**:
```sql
CREATE TABLE FAMILY_ACCESS_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    family_member_id CHAR(36) NOT NULL,
    parent_user_id BIGINT NOT NULL,
    access_type ENUM('login', 'profile_switch', 'logout') NOT NULL,
    access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    session_id VARCHAR(255),

    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    INDEX idx_family_member (family_member_id),
    INDEX idx_parent_user (parent_user_id),
    INDEX idx_access_timestamp (access_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
app_users (1) ---- (1) user_profiles
app_users (1) ----< (N) FAMILY_MEMBERS
app_users (1) ---- (1) USER_PREFERENCES
app_users (1) ----< (N) USER_NOTIFICATION_PREFERENCES
app_users (1) ---- (1) USER_PRIVACY_SETTINGS
FAMILY_MEMBERS (1) ----< (N) FAMILY_ACCESS_LOG
alumni_members (1) ---- (1) app_users
alumni_members (1) ---- (1) FAMILY_MEMBERS
```

## ENUM Types

### user_role
```sql
ENUM('user', 'admin', 'moderator')
```

### access_level
```sql
ENUM('full', 'supervised', 'blocked')
```

### relationship
```sql
ENUM('self', 'child', 'spouse', 'sibling', 'guardian')
```

### profile_visibility
```sql
ENUM('public', 'alumni_only', 'private')
```

---

## Common Query Patterns

### Get User with Profile
```sql
SELECT u.*, p.display_name, p.bio, p.avatar_url
FROM app_users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.id = ?;
```

### Get Family Members
```sql
SELECT * FROM FAMILY_MEMBERS
WHERE parent_user_id = ?
  AND status = 'active'
ORDER BY is_primary_contact DESC, first_name;
```

### Get User Preferences
```sql
SELECT * FROM USER_PREFERENCES WHERE user_id = ?;
```

---

## Migration Notes

### Version 1.0 (Initial)
- Created app_users as core authentication table
- Created user_profiles for extended info
- Created FAMILY_MEMBERS for Netflix-style family profiles
- Added USER_PREFERENCES for settings
- Added privacy and notification preferences tables

---

## Related Documentation

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/user-management/README.md`
- API Routes: `routes/users.js`, `routes/preferences.js`, `routes/family-members.js`
- Service Layer: `server/services/UserService.js`

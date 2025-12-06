---
title: Database Schema - User Management
version: 2.0
status: implemented
last_updated: 2025-12-06
applies_to: user-management
change_summary: Consolidated user_profiles into FAMILY_MEMBERS - single source of truth
---

# Database Schema: User Management

## Overview

Database schema for the user management module, including user accounts, family member profiles, and preferences.

### Schema Design Principles (v2.0)

1. **Single Source of Truth**: Profile data lives in ONE table (`FAMILY_MEMBERS`)
2. **Auth Separation**: `app_users` contains authentication data ONLY
3. **No Redundancy**: No duplicate fields across tables
4. **COPPA Compliance**: Age/consent fields in `FAMILY_MEMBERS`

### Schema Consolidation (December 2025)

The `user_profiles` table has been **deprecated** and merged into `FAMILY_MEMBERS`:
- All profile data now stored in `FAMILY_MEMBERS`
- `user_profiles` exists as a VIEW for backward compatibility
- See `migrations/consolidate-user-profiles-to-family-members.sql`

---

## Tables

### app_users

**Purpose**: Core user accounts table for **authentication only**

> ⚠️ **Note**: Profile fields (`first_name`, `last_name`, etc.) in this table are deprecated.
> Use `FAMILY_MEMBERS` for all profile data via `primary_family_member_id`.

**Schema**:
```sql
CREATE TABLE app_users (
    -- Primary key
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Authentication fields
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    
    -- OTP settings
    requires_otp BOOLEAN DEFAULT TRUE,
    last_otp_sent TIMESTAMP NULL,
    daily_otp_count INT DEFAULT 0,
    last_otp_reset_date DATE NULL,
    
    -- Two-factor authentication
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    last_password_change TIMESTAMP NULL,
    
    -- Family account settings
    is_family_account BOOLEAN DEFAULT FALSE,
    family_account_type VARCHAR(50) NULL,
    primary_family_member_id CHAR(36) NULL,
    
    -- Alumni link
    alumni_member_id INT NULL,
    invitation_id CHAR(36) NULL,
    
    -- Login tracking
    last_login_at TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- DEPRECATED profile fields (use FAMILY_MEMBERS instead)
    first_name VARCHAR(100) NULL,      -- DEPRECATED
    last_name VARCHAR(100) NULL,       -- DEPRECATED
    phone VARCHAR(20) NULL,            -- DEPRECATED
    birth_date DATE NULL,              -- DEPRECATED
    profile_image_url VARCHAR(500),    -- DEPRECATED
    bio TEXT,                          -- DEPRECATED
    linkedin_url VARCHAR(500) NULL,    -- DEPRECATED
    current_position VARCHAR(200) NULL,-- DEPRECATED
    company VARCHAR(200) NULL,         -- DEPRECATED
    location VARCHAR(200) NULL,        -- DEPRECATED

    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
    FOREIGN KEY (invitation_id) REFERENCES USER_INVITATIONS(id) ON DELETE SET NULL,
    FOREIGN KEY (primary_family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE SET NULL,

    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_is_active (is_active),
    INDEX idx_primary_family_member (primary_family_member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Columns**:
| Column | Type | Purpose |
|--------|------|---------|
| id | CHAR(36) | UUID primary key |
| email | VARCHAR(255) | Login identifier |
| password_hash | VARCHAR(255) | Auth credential |
| role | ENUM | user/admin/moderator |
| primary_family_member_id | CHAR(36) | FK to user's main profile |
| is_family_account | BOOLEAN | Has multiple family members |

---

### FAMILY_MEMBERS

**Purpose**: **Single source of truth** for all user/family member profile data

This table stores:
- Primary user profiles (relationship='self', is_primary_contact=1)
- Additional family members (children, spouse, etc.)
- COPPA compliance fields (age, consent)
- Alumni data snapshot
- Professional/contact information

**Schema**:
```sql
CREATE TABLE FAMILY_MEMBERS (
    -- Primary key
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Parent account link
    parent_user_id CHAR(36) NOT NULL,
    alumni_member_id INT NULL,
    
    -- Profile information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    bio TEXT,
    profile_image_url VARCHAR(500),
    
    -- Contact information
    phone VARCHAR(20) NULL,
    
    -- Professional information
    linkedin_url VARCHAR(500) NULL,
    current_position VARCHAR(200) NULL,
    company VARCHAR(200) NULL,
    location VARCHAR(200) NULL,
    
    -- Alumni/education data
    graduation_year INT NULL,
    program VARCHAR(100) NULL,
    alumni_data_snapshot JSON NULL,
    
    -- Social links
    social_links JSON NULL,
    
    -- User-provided additional data
    user_additions JSON NULL,
    
    -- Age & COPPA compliance
    birth_date DATE NULL,
    age_at_registration INT NULL,
    current_age INT NULL,
    can_access_platform BOOLEAN DEFAULT FALSE,
    requires_parent_consent BOOLEAN DEFAULT FALSE,
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    last_consent_check_at TIMESTAMP NULL,
    
    -- Access control
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    relationship ENUM('self', 'child', 'spouse', 'sibling', 'guardian') DEFAULT 'child',
    is_primary_contact BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'suspended', 'pending_consent') DEFAULT 'pending_consent',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,

    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,

    INDEX idx_parent_user_id (parent_user_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_access_level (access_level),
    INDEX idx_can_access (can_access_platform),
    INDEX idx_status (status),
    INDEX idx_relationship (relationship),
    INDEX idx_primary_profile (parent_user_id, relationship, is_primary_contact)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Columns**:
| Column | Type | Purpose |
|--------|------|---------|
| id | CHAR(36) | UUID identifier |
| parent_user_id | CHAR(36) | Account owner (app_users.id) |
| relationship | ENUM | 'self' for primary user profile |
| is_primary_contact | BOOLEAN | TRUE for main profile |
| graduation_year | INT | Alumni education info |
| alumni_data_snapshot | JSON | Point-in-time alumni data capture |
| access_level | ENUM | COPPA: full/supervised/blocked |
| birth_date | DATE | For age calculation |

**Finding Primary User Profile**:
```sql
SELECT * FROM FAMILY_MEMBERS 
WHERE parent_user_id = ? AND relationship = 'self' AND is_primary_contact = 1;
```

---

### user_profiles (DEPRECATED - VIEW)

**Purpose**: Backward compatibility view - queries still work, but data comes from FAMILY_MEMBERS

> ⚠️ **DEPRECATED**: This is now a VIEW, not a table. 
> Do not INSERT into this view. Use FAMILY_MEMBERS directly.

**View Definition**:
```sql
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  fm.id,
  fm.parent_user_id AS user_id,
  fm.alumni_member_id,
  fm.first_name,
  fm.last_name,
  fm.display_name,
  fm.bio,
  fm.profile_image_url AS avatar_url,
  fm.phone,
  fm.social_links,
  fm.created_at,
  fm.updated_at,
  fm.graduation_year,
  fm.program,
  fm.alumni_data_snapshot,
  fm.user_additions
FROM FAMILY_MEMBERS fm
WHERE fm.relationship = 'self' AND fm.is_primary_contact = 1;
```

---

### USER_PREFERENCES

**Purpose**: User account preferences and settings

**Schema**:
```sql
CREATE TABLE USER_PREFERENCES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    theme VARCHAR(20) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    preference_type VARCHAR(20) DEFAULT 'both',
    max_postings INT DEFAULT 5,
    notification_settings JSON,
    privacy_settings JSON,
    interface_settings JSON,
    is_professional BOOLEAN DEFAULT FALSE,
    education_status VARCHAR(50) DEFAULT 'professional',
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
    user_id CHAR(36) NOT NULL,
    email_notifications BOOLEAN DEFAULT TRUE,
    email_frequency VARCHAR(20) DEFAULT 'daily',
    posting_updates BOOLEAN DEFAULT TRUE,
    connection_requests BOOLEAN DEFAULT TRUE,
    event_reminders BOOLEAN DEFAULT TRUE,
    weekly_digest BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_notification (user_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### USER_PRIVACY_SETTINGS

**Purpose**: Privacy and visibility settings

**Schema**:
```sql
CREATE TABLE USER_PRIVACY_SETTINGS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id CHAR(36) NOT NULL,
    profile_visibility ENUM('public', 'alumni_only', 'private') DEFAULT 'alumni_only',
    show_email BOOLEAN DEFAULT FALSE,
    show_phone BOOLEAN DEFAULT FALSE,
    show_location BOOLEAN DEFAULT TRUE,
    searchable_by_name BOOLEAN DEFAULT TRUE,
    searchable_by_email BOOLEAN DEFAULT FALSE,
    allow_messaging ENUM('anyone', 'alumni_only', 'connections_only', 'none') DEFAULT 'alumni_only',
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

**Purpose**: Tracks family member platform access for auditing (COPPA compliance)

**Schema**:
```sql
CREATE TABLE FAMILY_ACCESS_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    family_member_id CHAR(36) NOT NULL,
    parent_user_id CHAR(36) NOT NULL,
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
app_users (1) ----< (N) FAMILY_MEMBERS    [Primary relationship]
app_users (1) ---- (1) USER_PREFERENCES
app_users (1) ---- (1) USER_NOTIFICATION_PREFERENCES
app_users (1) ---- (1) USER_PRIVACY_SETTINGS
FAMILY_MEMBERS (1) ----< (N) FAMILY_ACCESS_LOG
alumni_members (1) ---- (0..1) app_users
alumni_members (1) ---- (0..1) FAMILY_MEMBERS

user_profiles = VIEW on FAMILY_MEMBERS (deprecated)
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

### status
```sql
ENUM('active', 'inactive', 'suspended', 'pending_consent')
```

---

## Common Query Patterns

### Get User with Profile (NEW - Recommended)
```sql
SELECT 
  u.id, u.email, u.role, u.status,
  fm.first_name, fm.last_name, fm.display_name, fm.bio,
  fm.profile_image_url, fm.phone, fm.graduation_year, fm.program
FROM app_users u
INNER JOIN FAMILY_MEMBERS fm ON u.primary_family_member_id = fm.id
WHERE u.id = ?;
```

### Get User with Profile (Legacy - Still Works via VIEW)
```sql
SELECT u.*, p.display_name, p.bio, p.avatar_url
FROM app_users u
LEFT JOIN user_profiles p ON u.id = p.user_id
WHERE u.id = ?;
```

### Get All Family Members
```sql
SELECT * FROM FAMILY_MEMBERS
WHERE parent_user_id = ?
ORDER BY is_primary_contact DESC, first_name;
```

### Get Primary User Profile
```sql
SELECT * FROM FAMILY_MEMBERS
WHERE parent_user_id = ? 
  AND relationship = 'self' 
  AND is_primary_contact = 1;
```

---

## Migration Notes

### Version 2.0 (December 2025) - Schema Consolidation
- **DEPRECATED** `user_profiles` table → Now a VIEW
- **MERGED** profile data into `FAMILY_MEMBERS`
- Added columns to `FAMILY_MEMBERS`:
  - `graduation_year`, `program`
  - `alumni_data_snapshot`, `social_links`, `user_additions`
  - `phone`, `linkedin_url`, `current_position`, `company`, `location`
- Migration: `migrations/consolidate-user-profiles-to-family-members.sql`
- Rollback instructions included in migration file

### Version 1.0 (Initial)
- Created app_users as core authentication table
- Created user_profiles for extended info
- Created FAMILY_MEMBERS for Netflix-style family profiles

---

## Related

- Context Bundle: `docs/context-bundles/2025-12-06-user-profile-family-members-schema-analysis.md`
- Migration: `migrations/consolidate-user-profiles-to-family-members.sql`
- Technical Spec: `docs/specs/technical/database/schema-design.md`
- API Routes: `routes/users.js`, `routes/family-members.js`
- Service Layer: `server/services/FamilyMemberService.js`

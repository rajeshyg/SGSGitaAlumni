# Database Redesign Plan

**Date**: 2025-12-07  
**Status**: PROPOSED  
**Author**: AI Assistant with User Direction

---

## Executive Summary

Redesign the database to follow standard patterns:
- **`accounts`** = Authentication + invitation holder (one per email)
- **`user_profiles`** = App users who can post/chat (parents and children 14+)
- **`alumni_members`** = Source of truth for alumni data (admin-managed, includes all ages)

**Key Changes**:
1. Replace confusing `FAMILY_MEMBERS` table with cleaner `user_profiles`
2. Move YOB, current_center, profile_picture to `alumni_members` (source data)
3. Simplify `app_users` → `accounts` (auth-only)
4. COPPA: Children under 14 exist in `alumni_members` only, no app profile created

---

## Design Principles

1. **One email = One account** - Single authentication point
2. **Alumni data is source of truth** - `alumni_members` is admin-managed, read-only for users
3. **App profiles for platform access** - Only users who can access platform have `user_profiles`
4. **COPPA compliant** - Under 14 blocked entirely, 14-17 need consent
5. **Standard relationships** - Parent-child via `parent_profile_id` FK

---

## New Schema

### Table: `accounts`

**Purpose**: Authentication and invitation management (replaces `app_users`)

```sql
CREATE TABLE accounts (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL UNIQUE,
    
    -- Authentication
    password_hash VARCHAR(255) NULL,
    role ENUM('user', 'admin', 'moderator') DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    status ENUM('pending', 'active', 'suspended') DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    
    -- OTP settings
    requires_otp BOOLEAN DEFAULT TRUE,
    last_otp_sent TIMESTAMP NULL,
    daily_otp_count INT DEFAULT 0,
    last_otp_reset_date DATE NULL,
    
    -- Login tracking
    last_login_at TIMESTAMP NULL,
    login_count INT DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Points**:
- No profile data (moved to `user_profiles`)
- No `primary_family_member_id` (active profile is session state, not DB)
- Invitation fields stay in `USER_INVITATIONS` (separate table)

---

### Table: `alumni_members` (Enhanced)

**Purpose**: Source of truth for all alumni data (admin-managed)

```sql
CREATE TABLE alumni_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id VARCHAR(50) UNIQUE,
    
    -- Identity
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),                    -- Shared by family members
    phone VARCHAR(20) NULL,
    
    -- Alumni data
    batch INT COMMENT 'Graduation year',
    result VARCHAR(100),
    center_name VARCHAR(255),              -- Center at graduation
    address TEXT,
    
    -- NEW: Profile data (admin can update)
    year_of_birth INT NULL COMMENT 'YYYY format for COPPA',
    current_center VARCHAR(255) NULL COMMENT 'Current center if different',
    profile_image_url VARCHAR(500) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_student_id (student_id),
    INDEX idx_batch (batch)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Points**:
- **Added**: `year_of_birth`, `current_center`, `profile_image_url`
- Contains ALL alumni including children under 14
- Admin-managed (users cannot edit)
- Email is NOT unique (multiple family members share email)

---

### Table: `user_profiles`

**Purpose**: App users who can access the platform (replaces `FAMILY_MEMBERS`)

```sql
CREATE TABLE user_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Links
    account_id CHAR(36) NOT NULL,
    alumni_member_id INT NOT NULL,         -- Which alumni record this profile represents
    
    -- Relationship
    relationship ENUM('parent', 'child') NOT NULL,
    parent_profile_id CHAR(36) NULL,       -- NULL for parents, set for children
    
    -- Profile overrides (user can customize these)
    display_name VARCHAR(150) NULL,        -- Override alumni name for display
    bio TEXT NULL,
    linkedin_url VARCHAR(500) NULL,
    current_position VARCHAR(200) NULL,
    company VARCHAR(200) NULL,
    location VARCHAR(200) NULL,
    
    -- COPPA Compliance (for children 14-17)
    requires_consent BOOLEAN DEFAULT FALSE,
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    consent_expires_at TIMESTAMP NULL,     -- 1 year from consent
    
    -- Access control
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    status ENUM('active', 'pending_consent', 'suspended') DEFAULT 'pending_consent',
    
    -- Activity
    last_active_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    UNIQUE KEY unique_account_alumni (account_id, alumni_member_id),
    INDEX idx_account_id (account_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_relationship (relationship),
    INDEX idx_access_level (access_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Key Points**:
- Only created for users who CAN access platform (14+ or will be 14+ with consent)
- **Children under 14**: NO entry here (data only in `alumni_members`)
- **Children 14-17**: Entry with `requires_consent=true`, `access_level='blocked'` until consent
- **Parents/Adults 18+**: Entry with `access_level='full'`
- `relationship` = 'parent' or 'child' (simple and clear)
- `parent_profile_id` links child to their parent's profile
- Profile data (name, image) comes from `alumni_members`, user can override display_name/bio

---

### Table: `USER_INVITATIONS` (Keep Existing)

**Purpose**: Invitation lifecycle tracking

```sql
CREATE TABLE USER_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by CHAR(36) NOT NULL,
    invitation_type ENUM('alumni', 'admin') NOT NULL DEFAULT 'alumni',
    status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
    
    -- Tracking
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    accepted_by CHAR(36) NULL,             -- Links to accounts.id after acceptance
    
    -- Metadata
    ip_address VARCHAR(45),
    resend_count INT DEFAULT 0,
    last_resent_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (invited_by) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (accepted_by) REFERENCES accounts(id) ON DELETE SET NULL,
    
    INDEX idx_invitation_token (invitation_token),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Table: `PARENT_CONSENT_RECORDS` (Keep Existing)

**Purpose**: COPPA audit trail

```sql
CREATE TABLE PARENT_CONSENT_RECORDS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    child_profile_id CHAR(36) NOT NULL,    -- The minor's profile
    parent_profile_id CHAR(36) NOT NULL,   -- The consenting parent's profile
    
    -- Consent details
    consent_type ENUM('granted', 'revoked', 'renewed') NOT NULL,
    consent_version VARCHAR(20) DEFAULT '1.0',
    
    -- Audit fields
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (child_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    INDEX idx_child_profile (child_profile_id),
    INDEX idx_parent_profile (parent_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Tables to Update (FK Changes)

### `POSTINGS`

Change `author_id` to reference `user_profiles`:

```sql
ALTER TABLE POSTINGS 
    DROP FOREIGN KEY fk_postings_author,
    MODIFY author_id CHAR(36) NOT NULL,
    ADD CONSTRAINT fk_postings_author 
        FOREIGN KEY (author_id) REFERENCES user_profiles(id);
```

### `USER_PREFERENCES`

Change to reference `accounts` (account-level settings):

```sql
ALTER TABLE USER_PREFERENCES
    DROP FOREIGN KEY fk_preferences_user,
    RENAME COLUMN user_id TO account_id,
    ADD CONSTRAINT fk_preferences_account 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
```

### `USER_NOTIFICATION_PREFERENCES`

Same as above - account-level.

### `USER_PRIVACY_SETTINGS`

Same as above - account-level.

### `POSTING_LIKES`, `POSTING_COMMENTS`

Change to reference `user_profiles`:

```sql
ALTER TABLE POSTING_LIKES
    DROP FOREIGN KEY fk_likes_user,
    MODIFY user_id CHAR(36) NOT NULL,
    ADD CONSTRAINT fk_likes_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id);

ALTER TABLE POSTING_COMMENTS
    DROP FOREIGN KEY fk_comments_user,
    MODIFY user_id CHAR(36) NOT NULL,
    ADD CONSTRAINT fk_comments_user 
        FOREIGN KEY (user_id) REFERENCES user_profiles(id);
```

---

## Tables to Delete

| Table | Reason |
|-------|--------|
| `FAMILY_MEMBERS` | Replaced by `user_profiles` |
| `app_users` | Replaced by `accounts` |
| `FAMILY_ACCESS_LOG` | Already deleted (unused) |
| `FAMILY_INVITATIONS` | Already deleted (unused) |

---

## Entity Relationship Diagram

```
USER_INVITATIONS                    accounts                         
┌─────────────────────┐            ┌─────────────────────┐           
│ id                  │            │ id                  │           
│ email               │            │ email (UNIQUE)      │           
│ invitation_token    │            │ password_hash       │           
│ status              │            │ role                │           
│ invited_by ─────────│───────────>│ status              │           
│ accepted_by ────────│───────────>│                     │           
└─────────────────────┘            └──────────┬──────────┘           
                                              │                      
                                              │ 1:N                  
                                              ▼                      
                                   ┌─────────────────────┐           
alumni_members                     │ user_profiles       │           
┌─────────────────────┐            │─────────────────────│           
│ id                  │<───────────│ alumni_member_id    │           
│ email               │            │ account_id ─────────│──┐        
│ first_name          │            │ relationship        │  │        
│ last_name           │            │ parent_profile_id ──│──┼─┐      
│ batch               │            │ requires_consent    │  │ │      
│ year_of_birth (NEW) │            │ access_level        │  │ │      
│ current_center (NEW)│            │ status              │  │ │      
│ profile_image (NEW) │            └──────────┬──────────┘  │ │      
└─────────────────────┘                       │             │ │      
                                              │ 1:N         │ │      
                                              ▼             │ │      
                                   ┌─────────────────────┐  │ │      
                                   │ POSTINGS            │  │ │      
                                   │─────────────────────│  │ │      
                                   │ author_id ──────────│──┘ │      
                                   │ title, content      │    │      
                                   └─────────────────────┘    │      
                                                              │      
                                   ┌─────────────────────┐    │      
                                   │PARENT_CONSENT_RECORDS│   │      
                                   │─────────────────────│    │      
                                   │ child_profile_id ───│────┘      
                                   │ parent_profile_id ──│────┘      
                                   │ consent_type        │           
                                   └─────────────────────┘           
```

---

## Data Flow Examples

### Example 1: Parent Registration

```
1. Admin sends invitation to mom@family.com
   → USER_INVITATIONS: {email: 'mom@family.com', status: 'pending'}

2. Mom clicks invitation link
   → System finds alumni_members WHERE email = 'mom@family.com'
   → Returns: [{id: 101, name: 'Mom', batch: 2005}, {id: 102, name: 'Son', batch: 2023, yob: 2008}]

3. Mom creates account + selects her profile
   → accounts: {id: 'acc-1', email: 'mom@family.com', status: 'active'}
   → user_profiles: {id: 'prof-1', account_id: 'acc-1', alumni_member_id: 101, 
                     relationship: 'parent', access_level: 'full'}

4. Mom adds Son (age 17, born 2008)
   → user_profiles: {id: 'prof-2', account_id: 'acc-1', alumni_member_id: 102,
                     relationship: 'child', parent_profile_id: 'prof-1',
                     requires_consent: true, access_level: 'blocked'}

5. Mom grants consent for Son
   → user_profiles(prof-2): {parent_consent_given: true, access_level: 'supervised'}
   → PARENT_CONSENT_RECORDS: {child: 'prof-2', parent: 'prof-1', type: 'granted'}
```

### Example 2: Child Under 14

```
1. alumni_members has: {id: 103, name: 'Daughter', batch: 2028, yob: 2013}
   → Age = 12 (under 14)

2. System shows Daughter in alumni list but CANNOT create user_profile
   → UI shows: "Daughter (age 12) - Cannot access platform (COPPA)"
   → Data stays in alumni_members only, no user_profiles entry
```

### Example 3: Future Cross-Email Family Linking

```
Mom's account (mom@family.com):
  - user_profiles: Mom (parent), Son (child)

Dad's account (dad@family.com):  
  - user_profiles: Dad (parent), Daughter (child)

Future: Add family_groups table to link these accounts
  - family_groups: {id: 'fam-1', name: 'Smith Family'}
  - accounts: add family_group_id column
```

---

## COPPA Compliance Summary

| Age | alumni_members | user_profiles | Platform Access |
|-----|----------------|---------------|-----------------|
| Under 14 | ✅ Data exists | ❌ No entry | ❌ Blocked |
| 14-17 | ✅ Data exists | ✅ Entry with `requires_consent=true` | ⚠️ Blocked until parent consent |
| 18+ | ✅ Data exists | ✅ Entry with `access_level='full'` | ✅ Full access |

**COPPA Compliance Points**:
- ✅ No account/email collection from children
- ✅ Minimal data collection (YOB only, not full birthdate)
- ✅ Under 14 cannot access platform at all
- ✅ 14-17 require verifiable parental consent
- ✅ Consent audit trail maintained
- ✅ Consent expires after 1 year (renewal required)

---

## Migration Plan

### Phase 1: Add New Columns to `alumni_members`
```sql
ALTER TABLE alumni_members
    ADD COLUMN year_of_birth INT NULL AFTER address,
    ADD COLUMN current_center VARCHAR(255) NULL AFTER year_of_birth,
    ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER current_center;
```

### Phase 2: Create `accounts` Table
```sql
-- Create accounts from existing app_users
CREATE TABLE accounts AS 
SELECT 
    id, email, password_hash, role, is_active, status,
    email_verified, email_verified_at, requires_otp,
    last_otp_sent, daily_otp_count, last_otp_reset_date,
    last_login_at, login_count, created_at, updated_at
FROM app_users;

ALTER TABLE accounts ADD PRIMARY KEY (id);
ALTER TABLE accounts ADD UNIQUE KEY (email);
```

### Phase 3: Create `user_profiles` Table
```sql
-- Create user_profiles from existing FAMILY_MEMBERS
CREATE TABLE user_profiles AS
SELECT
    fm.id,
    fm.parent_user_id AS account_id,
    fm.alumni_member_id,
    CASE WHEN fm.relationship = 'self' THEN 'parent' ELSE 'child' END AS relationship,
    CASE WHEN fm.relationship != 'self' 
         THEN (SELECT id FROM FAMILY_MEMBERS 
               WHERE parent_user_id = fm.parent_user_id 
               AND relationship = 'self' LIMIT 1)
         ELSE NULL 
    END AS parent_profile_id,
    fm.display_name,
    fm.bio,
    fm.linkedin_url,
    fm.current_position,
    fm.company,
    fm.location,
    fm.requires_parent_consent AS requires_consent,
    fm.parent_consent_given,
    fm.parent_consent_date,
    DATE_ADD(fm.parent_consent_date, INTERVAL 1 YEAR) AS consent_expires_at,
    fm.access_level,
    fm.status,
    fm.last_login_at AS last_active_at,
    fm.created_at,
    fm.updated_at
FROM FAMILY_MEMBERS fm;

-- Add constraints
ALTER TABLE user_profiles ADD PRIMARY KEY (id);
ALTER TABLE user_profiles ADD FOREIGN KEY (account_id) REFERENCES accounts(id);
ALTER TABLE user_profiles ADD FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id);
```

### Phase 4: Update Foreign Keys
```sql
-- Update POSTINGS
ALTER TABLE POSTINGS MODIFY author_id CHAR(36);
-- Data migration: map old app_users.id to new user_profiles.id

-- Update preferences tables
ALTER TABLE USER_PREFERENCES RENAME COLUMN user_id TO account_id;
-- etc.
```

### Phase 5: Update Application Code
- Replace `app_users` references with `accounts`
- Replace `FAMILY_MEMBERS` references with `user_profiles`
- Update queries to join `user_profiles` ↔ `alumni_members` for full profile data
- Update session management (store `account_id` + `active_profile_id`)

### Phase 6: Drop Old Tables
```sql
DROP TABLE FAMILY_MEMBERS;
DROP TABLE app_users;
```

---

## Session Management

**Login Flow**:
1. User authenticates with email/password → validates against `accounts`
2. Fetch all `user_profiles` for this account
3. Store in session: `{account_id, profiles: [...], active_profile_id}`
4. Default active profile = first parent profile

**Profile Switching**:
1. User selects different profile from UI
2. Validate profile belongs to this account
3. Check `access_level` (must not be 'blocked')
4. Update session: `active_profile_id = selected_profile.id`
5. No database update needed (session state only)

**API Requests**:
- Most APIs use `active_profile_id` from session
- Posting, commenting, chatting all reference `user_profiles.id`

---

## Open Questions

1. **OTP_TOKENS table**: Should reference `accounts` instead of `app_users`?
2. **Chat tables**: Need to verify FK references
3. **Existing data migration**: How much test data exists? Full migration or fresh start?

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Create migration scripts
3. [ ] Update backend routes and services
4. [ ] Update frontend services and components
5. [ ] Test migration with dev data
6. [ ] Execute migration

---

## Appendix: Table Comparison

| Old Table | New Table | Notes |
|-----------|-----------|-------|
| `app_users` | `accounts` | Auth only, no profile data |
| `FAMILY_MEMBERS` | `user_profiles` | Cleaner naming, clearer purpose |
| `alumni_members` | `alumni_members` | Enhanced with YOB, current_center, profile_image |
| `USER_INVITATIONS` | `USER_INVITATIONS` | Keep as-is, update FKs |
| `user_profiles` (VIEW) | DELETE | No longer needed |

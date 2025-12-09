# Phase 2: Database Migration Plan

**Date**: 2025-12-07  
**Status**: READY FOR EXECUTION  
**Depends On**: Phase 1 (Specs Rewrite)  
**Duration**: 1 day

---

## Overview

Execute database schema changes to implement new table structure. Since all existing data is test data, we'll use a clean migration approach (delete → recreate).

### Migration Strategy: Clean Slate

**Rationale**: 
- All data is test data (no production users)
- Clean slate avoids complex data migration scripts
- Faster execution with less risk
- Simpler rollback (just re-run old schema)

---

## Pre-Migration Checklist

### Step 0: Backup (Safety)
```powershell
# Create backup even though it's test data
cd c:\React-Projects\SGSGitaAlumni\scripts\database
.\backup-database.ps1
```
- [ ] Backup created at `backups/`

### Step 1: Verify No Active Sessions
```sql
-- Check for active connections
SHOW PROCESSLIST;

-- Terminate if needed (dev only)
-- KILL <process_id>;
```
- [ ] No active user sessions

---

## Execution Steps

### Step 1: Delete Test Data

```sql
-- migration-001-delete-test-data.sql

-- Disable FK checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete from dependent tables first
DELETE FROM POSTING_LIKES;
DELETE FROM POSTING_COMMENTS;
DELETE FROM POSTINGS;
DELETE FROM CONVERSATION_PARTICIPANTS;
DELETE FROM MESSAGES;
DELETE FROM CONVERSATIONS;
DELETE FROM USER_PREFERENCES;
DELETE FROM USER_NOTIFICATION_PREFERENCES;
DELETE FROM USER_PRIVACY_SETTINGS;
DELETE FROM PARENT_CONSENT_RECORDS;
DELETE FROM OTP_TOKENS;
DELETE FROM JWT_REFRESH_TOKENS;

-- Delete from core tables
DELETE FROM FAMILY_MEMBERS;
DELETE FROM USER_INVITATIONS;
DELETE FROM app_users;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify counts
SELECT 'app_users' as tbl, COUNT(*) as cnt FROM app_users
UNION ALL SELECT 'FAMILY_MEMBERS', COUNT(*) FROM FAMILY_MEMBERS
UNION ALL SELECT 'USER_INVITATIONS', COUNT(*) FROM USER_INVITATIONS
UNION ALL SELECT 'POSTINGS', COUNT(*) FROM POSTINGS;
```

- [ ] All test data deleted
- [ ] Counts verified (should be 0)

---

### Step 2: Add YOB Column to alumni_members

```sql
-- migration-002-add-yob-to-alumni.sql

-- Add year_of_birth column (INT)
ALTER TABLE alumni_members
    ADD COLUMN year_of_birth INT NULL COMMENT 'Year of birth (YYYY) for COPPA' AFTER address;

-- Add current_center column
ALTER TABLE alumni_members
    ADD COLUMN current_center VARCHAR(255) NULL COMMENT 'Current center if different from graduation' AFTER year_of_birth;

-- Add profile_image_url column
ALTER TABLE alumni_members
    ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER current_center;

-- Create index for COPPA queries
CREATE INDEX idx_alumni_yob ON alumni_members(year_of_birth);

-- Verify columns added
DESCRIBE alumni_members;
```

- [ ] `year_of_birth` column added (INT)
- [ ] `current_center` column added
- [ ] `profile_image_url` column added
- [ ] Index created

---

### Step 3: Create `accounts` Table

```sql
-- migration-003-create-accounts.sql

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
    INDEX idx_status (status),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table created
DESCRIBE accounts;
```

- [ ] `accounts` table created
- [ ] All columns present
- [ ] Indexes created

---

### Step 4: Create `user_profiles` Table

```sql
-- migration-004-create-user-profiles.sql

CREATE TABLE user_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Links
    account_id CHAR(36) NOT NULL,
    alumni_member_id INT NOT NULL,
    
    -- Relationship
    relationship ENUM('parent', 'child') NOT NULL,
    parent_profile_id CHAR(36) NULL,
    
    -- Profile customization (overrides alumni data)
    display_name VARCHAR(150) NULL,
    bio TEXT NULL,
    linkedin_url VARCHAR(500) NULL,
    current_position VARCHAR(200) NULL,
    company VARCHAR(200) NULL,
    location VARCHAR(200) NULL,
    
    -- COPPA Compliance (for children 14-17)
    requires_consent BOOLEAN DEFAULT FALSE,
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    consent_expires_at TIMESTAMP NULL,
    
    -- Access control
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    status ENUM('active', 'pending_consent', 'suspended') DEFAULT 'pending_consent',
    
    -- Activity
    last_active_at TIMESTAMP NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_profiles_account FOREIGN KEY (account_id) 
        REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_profiles_alumni FOREIGN KEY (alumni_member_id) 
        REFERENCES alumni_members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_profiles_parent FOREIGN KEY (parent_profile_id) 
        REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Constraints
    UNIQUE KEY unique_account_alumni (account_id, alumni_member_id),
    
    -- Indexes
    INDEX idx_account_id (account_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_relationship (relationship),
    INDEX idx_access_level (access_level),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table created
DESCRIBE user_profiles;
```

- [ ] `user_profiles` table created
- [ ] Foreign keys created
- [ ] Indexes created

---

### Step 5: Update USER_INVITATIONS FK

```sql
-- migration-005-update-invitations-fk.sql

-- Update accepted_by to reference accounts instead of app_users
-- First drop existing FK if any
-- ALTER TABLE USER_INVITATIONS DROP FOREIGN KEY fk_invitations_accepted_by;

-- Add new FK (soft reference, no constraint for flexibility)
-- accepted_by will reference accounts.id after acceptance

-- Verify structure
DESCRIBE USER_INVITATIONS;
```

- [ ] USER_INVITATIONS compatible with new schema

---

### Step 6: Update PARENT_CONSENT_RECORDS FKs

```sql
-- migration-006-update-consent-fks.sql

-- Update FKs to reference user_profiles instead of FAMILY_MEMBERS
ALTER TABLE PARENT_CONSENT_RECORDS
    DROP FOREIGN KEY IF EXISTS fk_consent_child,
    DROP FOREIGN KEY IF EXISTS fk_consent_parent;

ALTER TABLE PARENT_CONSENT_RECORDS
    ADD CONSTRAINT fk_consent_child_profile 
        FOREIGN KEY (child_family_member_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
    ADD CONSTRAINT fk_consent_parent_profile 
        FOREIGN KEY (parent_family_member_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Note: Column names may need renaming - check actual schema
DESCRIBE PARENT_CONSENT_RECORDS;
```

- [ ] PARENT_CONSENT_RECORDS FKs updated

---

### Step 7: Drop Old Tables

```sql
-- migration-007-drop-old-tables.sql

-- Disable FK checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop deprecated tables
DROP TABLE IF EXISTS FAMILY_ACCESS_LOG;
DROP TABLE IF EXISTS FAMILY_INVITATIONS;
DROP TABLE IF EXISTS FAMILY_MEMBERS;
DROP TABLE IF EXISTS app_users;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables dropped
SHOW TABLES LIKE 'FAMILY%';
SHOW TABLES LIKE 'app_users';
```

- [ ] `FAMILY_ACCESS_LOG` dropped
- [ ] `FAMILY_INVITATIONS` dropped
- [ ] `FAMILY_MEMBERS` dropped
- [ ] `app_users` dropped

---

### Step 8: Remove Deprecated Columns

```sql
-- migration-008-remove-deprecated-columns.sql

-- Remove birth_date from alumni_members (if exists) - we use year_of_birth now
ALTER TABLE alumni_members DROP COLUMN IF EXISTS birth_date;
ALTER TABLE alumni_members DROP COLUMN IF EXISTS estimated_birth_year;

-- Verify
DESCRIBE alumni_members;
```

- [ ] `birth_date` column removed (if existed)
- [ ] `estimated_birth_year` column removed (if existed)

---

### Step 9: Create Admin Account

```sql
-- migration-009-create-admin.sql

-- Create admin account for testing
INSERT INTO accounts (id, email, password_hash, role, status, email_verified, is_active)
VALUES (
    UUID(),
    'admin@sgsgita.org',
    '$2b$10$...', -- bcrypt hash of admin password
    'admin',
    'active',
    TRUE,
    TRUE
);

-- Verify
SELECT id, email, role, status FROM accounts;
```

- [ ] Admin account created

---

## Post-Migration Verification

### Verify New Schema

```sql
-- Verify all new tables exist
SHOW TABLES;

-- Expected tables (core):
-- accounts
-- user_profiles
-- alumni_members
-- USER_INVITATIONS
-- PARENT_CONSENT_RECORDS

-- Verify dropped tables don't exist
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name IN ('app_users', 'FAMILY_MEMBERS', 'FAMILY_INVITATIONS', 'FAMILY_ACCESS_LOG');
-- Should return 0
```

### Verify Foreign Keys

```sql
-- Check FK relationships
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL;
```

### Verify Indexes

```sql
-- Check indexes on new tables
SHOW INDEX FROM accounts;
SHOW INDEX FROM user_profiles;
SHOW INDEX FROM alumni_members;
```

---

## Migration Script Files to Create

| File | Purpose | Status |
|------|---------|--------|
| `migration-001-delete-test-data.sql` | Clean slate | ☐ |
| `migration-002-add-yob-to-alumni.sql` | Add year_of_birth | ☐ |
| `migration-003-create-accounts.sql` | Create accounts table | ☐ |
| `migration-004-create-user-profiles.sql` | Create user_profiles table | ☐ |
| `migration-005-update-invitations-fk.sql` | Update FKs | ☐ |
| `migration-006-update-consent-fks.sql` | Update consent FKs | ☐ |
| `migration-007-drop-old-tables.sql` | Drop old tables | ☐ |
| `migration-008-remove-deprecated-columns.sql` | Remove old columns | ☐ |
| `migration-009-create-admin.sql` | Create admin user | ☐ |
| `run-all-migrations.js` | Execute all in order | ☐ |

**Location**: `scripts/database/migrations/refactoring/`

---

## Rollback Plan

If migration fails, rollback by:

1. Restore from backup
```powershell
.\restore-database.ps1 -backup "backups/latest.sql"
```

2. Or re-run original schema
```powershell
node scripts/database/execute-schema.js
```

---

## Scripts to DELETE After Migration

These scripts reference old tables and should be deleted:

| Script | Reason |
|--------|--------|
| `add-birth-date-to-alumni-members.sql` | Uses full birth_date |
| `run-add-birth-date-migration.js` | Uses batch-22 formula |
| `create-family-members-tables.sql` | Creates old FAMILY_MEMBERS |
| `create-family-tables-simple.sql` | Creates old tables |
| `migrate-existing-users-to-family.js` | Uses old schema |
| `setup-dev-family-data.js` | Uses old schema |
| `link-family-members-by-email.js` | Uses old schema |
| `link-family-members-for-user.js` | Uses old schema |

**Action**: Move to `scripts/archive/deprecated/` with timestamp

---

## Verification Commands

```powershell
# After migration, verify no code references old tables
grep -r "app_users" routes/ server/ src/
grep -r "FAMILY_MEMBERS" routes/ server/ src/
grep -r "FAMILY_INVITATIONS" routes/ server/ src/
grep -r "FAMILY_ACCESS_LOG" routes/ server/ src/
grep -r "estimated_birth_year" routes/ server/ src/

# These should all return matches (fix in Phase 3)
```

---

## Checklist Summary

| Step | Task | Status |
|------|------|--------|
| 0 | Create backup | ☐ |
| 1 | Delete test data | ☐ |
| 2 | Add YOB to alumni_members | ☐ |
| 3 | Create accounts table | ☐ |
| 4 | Create user_profiles table | ☐ |
| 5 | Update USER_INVITATIONS FK | ☐ |
| 6 | Update PARENT_CONSENT_RECORDS FKs | ☐ |
| 7 | Drop old tables | ☐ |
| 8 | Remove deprecated columns | ☐ |
| 9 | Create admin account | ☐ |
| 10 | Verify schema | ☐ |
| 11 | Move deprecated scripts | ☐ |

---

## Next Phase

After completing Phase 2 (Database Migration):
→ Proceed to [03-api-refactoring-plan.md](./03-api-refactoring-plan.md)

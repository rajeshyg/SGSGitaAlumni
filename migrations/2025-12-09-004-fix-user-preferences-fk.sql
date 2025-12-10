-- Migration: Fix USER_PREFERENCES FK constraint
-- Date: 2025-12-09
-- Purpose: Change FK from app_users (deleted) to accounts table
--          Also fix collation on notification/privacy tables
--
-- Issue: USER_PREFERENCES.user_id has FK to app_users.id but app_users table was dropped
-- This causes inserts to fail with FK constraint errors
--
-- NOTE: Use scripts/debug/fix-preferences-fk.js for safer execution with error handling

-- Step 1: Disable FK checks
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Fix collation on notification/privacy tables (must match accounts table)
ALTER TABLE USER_NOTIFICATION_PREFERENCES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE USER_PRIVACY_SETTINGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Step 3: Drop the broken FK constraint to app_users (may fail if already dropped)
-- ALTER TABLE USER_PREFERENCES DROP FOREIGN KEY fk_user_preferences_user;

-- Step 4: Drop similar broken FKs on notification/privacy tables if they exist
-- (Ignore errors if constraint doesn't exist)
-- ALTER TABLE USER_NOTIFICATION_PREFERENCES DROP FOREIGN KEY fk_user_notification_preferences_account;
-- ALTER TABLE USER_PRIVACY_SETTINGS DROP FOREIGN KEY fk_user_privacy_settings_account;

-- Step 5: Add correct FK constraints to accounts table
ALTER TABLE USER_PREFERENCES
    ADD CONSTRAINT fk_user_preferences_account 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE USER_NOTIFICATION_PREFERENCES
    ADD CONSTRAINT fk_user_notification_preferences_account 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE USER_PRIVACY_SETTINGS
    ADD CONSTRAINT fk_user_privacy_settings_account 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Step 5: Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 6: Verify migration
SELECT 
    TABLE_NAME, 
    CONSTRAINT_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME, 
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME IN ('USER_PREFERENCES', 'USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS')
AND REFERENCED_TABLE_NAME IS NOT NULL;

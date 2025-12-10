-- Migration: Fix USER_PREFERENCES.user_id type
-- Date: 2025-12-09
-- Purpose: Change user_id from bigint (old app_users format) to CHAR(36) (new accounts UUID format)
-- 
-- Background: The refactoring replaced app_users with accounts table.
-- accounts.id is CHAR(36) UUID, but USER_PREFERENCES.user_id was never updated from bigint.

-- Step 1: Check existing data (for reference - all test data will be cleared)
-- SELECT user_id, family_member_id FROM USER_PREFERENCES LIMIT 10;

-- Step 2: Clear existing test data (safe - no production data)
DELETE FROM USER_PREFERENCES;
DELETE FROM USER_NOTIFICATION_PREFERENCES;
DELETE FROM USER_PRIVACY_SETTINGS;

-- Step 3: Drop existing FK constraints if any
SET FOREIGN_KEY_CHECKS = 0;

-- Step 4: Modify user_id column from bigint to CHAR(36)
ALTER TABLE USER_PREFERENCES 
    MODIFY COLUMN user_id CHAR(36) NOT NULL;

ALTER TABLE USER_NOTIFICATION_PREFERENCES 
    MODIFY COLUMN user_id CHAR(36) NOT NULL;

ALTER TABLE USER_PRIVACY_SETTINGS 
    MODIFY COLUMN user_id CHAR(36) NOT NULL;

-- Step 5: Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 6: Add FK constraints to accounts table
-- Note: Using account_id for preferences (account-level settings, not profile-level)
ALTER TABLE USER_PREFERENCES
    ADD CONSTRAINT fk_user_preferences_account 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE USER_NOTIFICATION_PREFERENCES
    ADD CONSTRAINT fk_user_notification_preferences_account 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

ALTER TABLE USER_PRIVACY_SETTINGS
    ADD CONSTRAINT fk_user_privacy_settings_account 
    FOREIGN KEY (user_id) REFERENCES accounts(id) ON DELETE CASCADE;

-- Step 7: Verify migration
DESCRIBE USER_PREFERENCES;
DESCRIBE USER_NOTIFICATION_PREFERENCES;
DESCRIBE USER_PRIVACY_SETTINGS;

-- Verify FK constraints
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME IN ('USER_PREFERENCES', 'USER_NOTIFICATION_PREFERENCES', 'USER_PRIVACY_SETTINGS')
AND REFERENCED_TABLE_NAME IS NOT NULL;

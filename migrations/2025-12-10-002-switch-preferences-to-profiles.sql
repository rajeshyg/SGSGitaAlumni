-- Migration: Switch Preferences FK to user_profiles
-- Date: 2025-12-10
-- Purpose: Change FK from accounts to user_profiles table for preference tables
--          to support profile-based preferences as implemented in the frontend.
--
-- Issue: Frontend sends profileId, but DB expects accountId (FK to accounts).
--        This causes 500 errors when creating default preferences.

-- Step 1: Disable FK checks
SET FOREIGN_KEY_CHECKS = 0;

-- Step 2: Drop existing FK constraints to accounts
-- We attempt to drop the constraints created in 2025-12-09-004-fix-user-preferences-fk.sql
ALTER TABLE USER_PREFERENCES DROP FOREIGN KEY fk_user_preferences_account;
ALTER TABLE USER_NOTIFICATION_PREFERENCES DROP FOREIGN KEY fk_user_notification_preferences_account;
ALTER TABLE USER_PRIVACY_SETTINGS DROP FOREIGN KEY fk_user_privacy_settings_account;

-- Step 3: Truncate tables to remove invalid references (Account IDs)
-- Since we are switching from Account ID to Profile ID, existing data is invalid
TRUNCATE TABLE USER_PREFERENCES;
TRUNCATE TABLE USER_NOTIFICATION_PREFERENCES;
TRUNCATE TABLE USER_PRIVACY_SETTINGS;

-- Step 4: Add new FK constraints to user_profiles
ALTER TABLE USER_PREFERENCES
    ADD CONSTRAINT fk_user_preferences_profile 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE USER_NOTIFICATION_PREFERENCES
    ADD CONSTRAINT fk_user_notification_preferences_profile 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE USER_PRIVACY_SETTINGS
    ADD CONSTRAINT fk_user_privacy_settings_profile 
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Step 5: Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

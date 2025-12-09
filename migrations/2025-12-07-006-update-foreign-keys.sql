-- Migration: Update existing table foreign keys
-- Date: 2025-12-07
-- Purpose: Migrate POSTINGS and other tables to reference new user_profiles instead of app_users

-- Step 1: Disable FK checks for safe migration
SET FOREIGN_KEY_CHECKS = 0;

-- POSTINGS table: Change author_id from app_users (bigint) to user_profiles (char36)
-- Drop existing FK constraints that reference app_users (without IF EXISTS - we'll ignore errors with FK checks off)
ALTER TABLE POSTINGS DROP FOREIGN KEY POSTINGS_ibfk_1;
ALTER TABLE POSTINGS DROP FOREIGN KEY fk_postings_moderated_by;
ALTER TABLE POSTINGS DROP FOREIGN KEY POSTINGS_ibfk_3;
ALTER TABLE POSTINGS DROP FOREIGN KEY POSTINGS_ibfk_4;

-- Change column types to CHAR(36) for UUID
ALTER TABLE POSTINGS 
    MODIFY author_id CHAR(36) NULL,
    MODIFY approved_by CHAR(36) NULL,
    MODIFY rejected_by CHAR(36) NULL,
    MODIFY moderated_by CHAR(36) NULL;

-- Add new FK constraints to user_profiles
ALTER TABLE POSTINGS 
    ADD CONSTRAINT fk_postings_author 
        FOREIGN KEY (author_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_postings_approved_by
        FOREIGN KEY (approved_by) REFERENCES user_profiles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_postings_rejected_by
        FOREIGN KEY (rejected_by) REFERENCES user_profiles(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_postings_moderated_by
        FOREIGN KEY (moderated_by) REFERENCES user_profiles(id) ON DELETE SET NULL;

-- POSTING_COMMENTS: Change user_id from app_users (bigint) to user_profiles (char36)
ALTER TABLE POSTING_COMMENTS
    DROP FOREIGN KEY POSTING_COMMENTS_ibfk_2;

ALTER TABLE POSTING_COMMENTS
    MODIFY user_id CHAR(36) NULL;

ALTER TABLE POSTING_COMMENTS
    ADD CONSTRAINT fk_comments_user
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- POSTING_LIKES: Change user_id from app_users (bigint) to user_profiles (char36)
ALTER TABLE POSTING_LIKES
    DROP FOREIGN KEY POSTING_LIKES_ibfk_2;

ALTER TABLE POSTING_LIKES
    MODIFY user_id CHAR(36) NULL;

ALTER TABLE POSTING_LIKES
    ADD CONSTRAINT fk_likes_user
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- USER_PREFERENCES: Keep as account-level (auth-only table)
-- Will be updated in later migration if FK exists to app_users
-- ALTER TABLE USER_PREFERENCES
--     MODIFY user_id CHAR(36) NULL;

-- Step 2: Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify FK constraints
SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IN ('user_profiles', 'accounts')
ORDER BY TABLE_NAME;

-- Database Schema Migration: Clean Separation of Alumni Data and App Users
-- Migration Date: 2025-09-28
-- Purpose: Eliminate redundant alumni_contacts table and clarify table naming

-- Step 1: Drop alumni_contacts table if it exists (redundant/unused)
DROP TABLE IF EXISTS alumni_contacts;

-- Step 2: Rename alumni_profiles to alumni_members for clarity
RENAME TABLE alumni_profiles TO alumni_members;

-- Step 3: Rename users to app_users for clarity
RENAME TABLE users TO app_users;

-- Step 4: Add foreign key relationship from app_users to alumni_members
ALTER TABLE app_users ADD COLUMN alumni_member_id INT NULL;
ALTER TABLE app_users ADD CONSTRAINT fk_app_users_alumni_member
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL;

-- Step 5: Create index for better query performance
CREATE INDEX idx_app_users_alumni_member ON app_users(alumni_member_id);

-- Verification queries (run these after migration to confirm)
-- SELECT 'alumni_members count:' as info, COUNT(*) as count FROM alumni_members
-- UNION ALL
-- SELECT 'app_users count:' as info, COUNT(*) as count FROM app_users
-- UNION ALL
-- SELECT 'foreign key check:' as info, COUNT(*) as linked_users FROM app_users WHERE alumni_member_id IS NOT NULL;
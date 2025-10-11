-- Database Schema Migration for Simplified Invitation Acceptance
-- Migration Date: 2025-10-07
-- Purpose: Add alumni linking for simple invitation acceptance without forms

-- ========================================
-- STEP 1: ADD ALUMNI LINKING TO USER_INVITATIONS
-- ========================================

-- Add alumni_member_id column for direct linking
ALTER TABLE USER_INVITATIONS
ADD COLUMN alumni_member_id INT NULL AFTER invitation_type,
ADD CONSTRAINT fk_user_invitations_alumni_member
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL;

-- Add simple completion status
ALTER TABLE USER_INVITATIONS
ADD COLUMN completion_status ENUM('pending','alumni_verified','completed') DEFAULT 'pending' AFTER alumni_member_id;

-- Add index for performance
CREATE INDEX idx_user_invitations_alumni_member ON USER_INVITATIONS(alumni_member_id);

-- ========================================
-- STEP 2: ADD ALUMNI LINKING TO APP_USERS
-- ========================================

-- Add alumni member link and join timestamp
ALTER TABLE app_users
ADD COLUMN alumni_member_id INT NULL AFTER id,
ADD COLUMN joined_at TIMESTAMP NULL AFTER alumni_member_id,
ADD CONSTRAINT fk_app_users_alumni_member
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL;

-- Add index for performance
CREATE INDEX idx_app_users_alumni_member ON app_users(alumni_member_id);

-- ========================================
-- STEP 3: LINK EXISTING INVITATIONS TO ALUMNI RECORDS
-- ========================================

-- Link existing alumni-type invitations to alumni members
UPDATE USER_INVITATIONS ui
INNER JOIN alumni_members am ON ui.email = am.email
SET ui.alumni_member_id = am.id,
    ui.completion_status = 'alumni_verified'
WHERE ui.invitation_type = 'alumni'
  AND ui.status = 'pending'
  AND am.email IS NOT NULL
  AND am.email != '';

-- ========================================
-- STEP 4: VERIFICATION QUERIES
-- ========================================

-- Check the updated USER_INVITATIONS table structure
-- DESCRIBE USER_INVITATIONS;

-- Check the updated app_users table structure
-- DESCRIBE app_users;

-- Verify foreign key relationships
-- SELECT
--     TABLE_NAME,
--     COLUMN_NAME,
--     CONSTRAINT_NAME,
--     REFERENCED_TABLE_NAME,
--     REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
-- WHERE TABLE_SCHEMA = DATABASE()
--     AND REFERENCED_TABLE_NAME = 'alumni_members'
--     AND TABLE_NAME IN ('USER_INVITATIONS', 'app_users');

-- Check data integrity after migration
-- SELECT
--     'USER_INVITATIONS' as table_name,
--     COUNT(*) as total_records,
--     SUM(CASE WHEN alumni_member_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_alumni,
--     completion_status,
--     COUNT(*) as status_count
-- FROM USER_INVITATIONS
-- GROUP BY completion_status
-- UNION ALL
-- SELECT
--     'app_users' as table_name,
--     COUNT(*) as total_records,
--     SUM(CASE WHEN alumni_member_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_alumni,
--     'N/A' as completion_status,
--     0 as status_count
-- FROM app_users;

-- ========================================
-- STEP 5: LOG MIGRATION
-- ========================================

-- Log this migration in data_migration_log if the table exists
INSERT INTO data_migration_log (table_name, operation, record_id, migration_script)
VALUES ('database', 'schema_streamlining', 0, 'streamlining-migration.sql')
ON DUPLICATE KEY UPDATE migration_script = 'streamlining-migration.sql';

COMMIT;
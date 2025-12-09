-- Drop old tables that have been replaced
-- Date: 2025-12-08
-- Purpose: Complete Phase 2 migration by removing deprecated tables

-- Disable FK checks for safe dropping
SET FOREIGN_KEY_CHECKS = 0;

-- Drop old tables
DROP TABLE IF EXISTS app_users;
DROP TABLE IF EXISTS FAMILY_MEMBERS;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify tables dropped
SELECT 'Old tables dropped successfully' AS status;
SELECT COUNT(*) as remaining_old_tables
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name IN ('app_users', 'FAMILY_MEMBERS');

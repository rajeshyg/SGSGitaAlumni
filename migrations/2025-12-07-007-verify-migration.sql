-- Migration: Verify migration success
-- Date: 2025-12-07
-- Purpose: Verify all tables and constraints are in place

-- 1. Verify new tables exist
SELECT 
    TABLE_NAME,
    TABLE_TYPE,
    ENGINE
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('accounts', 'user_profiles', 'PARENT_CONSENT_RECORDS')
ORDER BY TABLE_NAME;

-- 2. Verify accounts table structure
DESCRIBE accounts;

-- 3. Verify user_profiles table structure
DESCRIBE user_profiles;

-- 4. Verify PARENT_CONSENT_RECORDS table structure
DESCRIBE PARENT_CONSENT_RECORDS;

-- 5. Verify alumni_members has new columns
DESCRIBE alumni_members;

-- 6. Verify foreign keys are in place
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
    AND (TABLE_NAME IN ('user_profiles', 'PARENT_CONSENT_RECORDS', 'POSTINGS', 'POSTING_COMMENTS', 'POSTING_LIKES')
         OR REFERENCED_TABLE_NAME IN ('accounts', 'user_profiles'))
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 7. Verify data is clean
SELECT 
    'accounts' as table_name, COUNT(*) as row_count FROM accounts
UNION ALL SELECT 'user_profiles', COUNT(*) FROM user_profiles
UNION ALL SELECT 'PARENT_CONSENT_RECORDS', COUNT(*) FROM PARENT_CONSENT_RECORDS
UNION ALL SELECT 'app_users', COUNT(*) FROM app_users
UNION ALL SELECT 'FAMILY_MEMBERS', COUNT(*) FROM FAMILY_MEMBERS;

-- 8. Verify indexes exist
SELECT 
    INDEX_NAME,
    TABLE_NAME,
    COLUMN_NAME
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('accounts', 'user_profiles', 'PARENT_CONSENT_RECORDS', 'alumni_members')
ORDER BY TABLE_NAME, INDEX_NAME;

-- Migration complete
SELECT 'Database schema migration completed successfully' as status;

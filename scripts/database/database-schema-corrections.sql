-- Database Schema Corrections for Task 8.0
-- Fixes critical data corruption and implements proper alumni/user separation
-- Migration Date: 2025-09-29

-- ========================================
-- STEP 1: BACKUP EXISTING DATA
-- ========================================

-- Note: Backups created manually before running this script
-- CREATE TABLE IF NOT EXISTS alumni_members_backup AS SELECT * FROM alumni_members;
-- CREATE TABLE IF NOT EXISTS app_users_backup AS SELECT * FROM app_users;

-- ========================================
-- STEP 2: ADD MISSING COLUMNS TO ALUMNI_MEMBERS
-- ========================================

-- Add first_name column
ALTER TABLE alumni_members ADD COLUMN first_name VARCHAR(100) NULL;

-- Add last_name column
ALTER TABLE alumni_members ADD COLUMN last_name VARCHAR(100) NULL;

-- ========================================
-- STEP 3: CREATE USER_PROFILES TABLE
-- ========================================

-- Create user_profiles table for extended user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    alumni_member_id INT NULL,
    first_name VARCHAR(100) NULL,
    last_name VARCHAR(100) NULL,
    display_name VARCHAR(150) NULL,
    bio TEXT NULL,
    avatar_url VARCHAR(500) NULL,
    phone VARCHAR(20) NULL,
    social_links JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_alumni_member_id (alumni_member_id)
);

-- ========================================
-- STEP 4: RECOVER DATA FROM RAW_CSV_UPLOADS
-- ========================================

-- Update alumni_members with data from raw_csv_uploads
UPDATE alumni_members am
INNER JOIN raw_csv_uploads rcu ON am.student_id = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.studentId'))
SET
    am.first_name = SUBSTRING_INDEX(JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.Name')), ' ', 1),
    am.last_name = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.FamilyName')),
    am.email = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.Email')),
    am.phone = JSON_UNQUOTE(JSON_EXTRACT(rcu.ROW_DATA, '$.Phone'))
WHERE am.first_name IS NULL OR am.email IS NULL;

-- ========================================
-- STEP 5: LINK EXISTING USERS TO ALUMNI MEMBERS
-- ========================================

-- Update app_users to link with alumni_members where possible
UPDATE app_users u
INNER JOIN alumni_members am ON u.id = am.user_id
SET u.alumni_member_id = am.id
WHERE u.alumni_member_id IS NULL;

-- ========================================
-- STEP 6: POPULATE USER_PROFILES FROM EXISTING DATA
-- ========================================

-- Create user profiles for existing users
INSERT INTO user_profiles (user_id, alumni_member_id, first_name, last_name, phone)
SELECT
    u.id,
    u.alumni_member_id,
    COALESCE(u.first_name, am.first_name),
    COALESCE(u.last_name, am.last_name),
    COALESCE(u.phone, am.phone)
FROM app_users u
LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- ========================================
-- STEP 5: LINK EXISTING USERS TO ALUMNI MEMBERS
-- ========================================

-- Update app_users to link with alumni_members where possible
UPDATE app_users u
INNER JOIN alumni_members am ON u.id = am.user_id
SET u.alumni_member_id = am.id
WHERE u.alumni_member_id IS NULL;

-- ========================================
-- STEP 6: POPULATE USER_PROFILES FROM EXISTING DATA
-- ========================================

-- Create user profiles for existing users
INSERT INTO user_profiles (user_id, alumni_member_id, first_name, last_name, phone)
SELECT
    u.id,
    u.alumni_member_id,
    COALESCE(u.first_name, am.first_name),
    COALESCE(u.last_name, am.last_name),
    COALESCE(u.phone, am.phone)
FROM app_users u
LEFT JOIN alumni_members am ON u.alumni_member_id = am.id
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = u.id
);

-- ========================================
-- STEP 7: CLEAN UP AND VALIDATION
-- ========================================

-- Create audit trail table
CREATE TABLE IF NOT EXISTS data_migration_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    old_data JSON NULL,
    new_data JSON NULL,
    migration_script VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log this migration
INSERT INTO data_migration_log (table_name, operation, record_id, migration_script)
VALUES ('database', 'schema_correction', 0, 'database-schema-corrections.sql');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check data integrity after migration
SELECT
    'alumni_members' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) as records_with_first_name,
    SUM(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) as records_with_last_name,
    SUM(CASE WHEN email IS NOT NULL AND email != '' THEN 1 ELSE 0 END) as records_with_email
FROM alumni_members

UNION ALL

SELECT
    'app_users' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) as records_with_first_name,
    SUM(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) as records_with_last_name,
    SUM(CASE WHEN alumni_member_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_alumni
FROM app_users

UNION ALL

SELECT
    'user_profiles' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN first_name IS NOT NULL AND first_name != '' THEN 1 ELSE 0 END) as records_with_first_name,
    SUM(CASE WHEN last_name IS NOT NULL AND last_name != '' THEN 1 ELSE 0 END) as records_with_last_name,
    SUM(CASE WHEN alumni_member_id IS NOT NULL THEN 1 ELSE 0 END) as linked_to_alumni
FROM user_profiles;

SELECT 'Database schema corrections completed successfully' as status;
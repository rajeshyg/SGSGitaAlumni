-- Migration: Add COPPA columns to alumni_members
-- Date: 2025-12-07
-- Purpose: Add year_of_birth, current_center, profile_image_url for Phase 2

-- Check current alumni_members structure
-- DESCRIBE alumni_members;

-- Add columns only if they don't exist
-- MySQL doesn't support IF NOT EXISTS for ADD COLUMN, so we handle errors gracefully

-- Check and add year_of_birth
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'alumni_members' 
AND COLUMN_NAME = 'year_of_birth';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE alumni_members ADD COLUMN year_of_birth INT NULL COMMENT ''Year of birth (YYYY) for COPPA age verification'' AFTER estimated_birth_year',
    'SELECT ''Column year_of_birth already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add current_center
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'alumni_members' 
AND COLUMN_NAME = 'current_center';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE alumni_members ADD COLUMN current_center VARCHAR(255) NULL COMMENT ''Current training center (if different from graduation center)'' AFTER year_of_birth',
    'SELECT ''Column current_center already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add profile_image_url
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'alumni_members' 
AND COLUMN_NAME = 'profile_image_url';

SET @query = IF(@col_exists = 0,
    'ALTER TABLE alumni_members ADD COLUMN profile_image_url VARCHAR(500) NULL COMMENT ''Profile image URL for user profiles'' AFTER current_center',
    'SELECT ''Column profile_image_url already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes only if they don't exist
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'alumni_members' 
AND INDEX_NAME = 'idx_alumni_yob';

SET @query = IF(@index_exists = 0,
    'CREATE INDEX idx_alumni_yob ON alumni_members(year_of_birth)',
    'SELECT ''Index idx_alumni_yob already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'alumni_members' 
AND INDEX_NAME = 'idx_alumni_current_center';

SET @query = IF(@index_exists = 0,
    'CREATE INDEX idx_alumni_current_center ON alumni_members(current_center)',
    'SELECT ''Index idx_alumni_current_center already exists'' AS message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify columns added
DESCRIBE alumni_members;

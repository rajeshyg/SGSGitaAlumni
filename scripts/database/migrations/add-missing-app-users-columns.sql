-- ============================================================================
-- Add Missing Columns to app_users Table
-- ============================================================================
-- This script adds the two_factor_enabled and last_password_change columns
-- that are required by the /api/users/:userId/account-settings endpoint
-- ============================================================================

USE sgsgitaalumni;

-- Add two_factor_enabled column if it doesn't exist
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'sgsgitaalumni'
    AND TABLE_NAME = 'app_users'
    AND COLUMN_NAME = 'two_factor_enabled'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE app_users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0 AFTER login_count',
  'SELECT "Column two_factor_enabled already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_password_change column if it doesn't exist
SET @column_exists = (
  SELECT COUNT(*)
  FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = 'sgsgitaalumni'
    AND TABLE_NAME = 'app_users'
    AND COLUMN_NAME = 'last_password_change'
);

SET @sql = IF(@column_exists = 0,
  'ALTER TABLE app_users ADD COLUMN last_password_change TIMESTAMP NULL AFTER two_factor_enabled',
  'SELECT "Column last_password_change already exists" AS message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verify the columns were added
SELECT 
  COLUMN_NAME,
  DATA_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'sgsgitaalumni'
  AND TABLE_NAME = 'app_users'
  AND COLUMN_NAME IN ('two_factor_enabled', 'last_password_change')
ORDER BY ORDINAL_POSITION;


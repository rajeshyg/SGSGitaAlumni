-- ============================================================================
-- FAMILY MEMBER SYSTEM - DATABASE SCHEMA
-- ============================================================================
-- Created: 2025-10-29
-- Purpose: Support multiple family members sharing one parent email account
-- Features: Netflix-style profiles, age-based access, individual preferences
-- ============================================================================

-- ============================================================================
-- TABLE 1: FAMILY_MEMBERS
-- ============================================================================
-- Stores individual profiles for each family member under a parent account
-- Supports Netflix-style profile switching and individual preferences
-- ============================================================================

CREATE TABLE IF NOT EXISTS FAMILY_MEMBERS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Link to parent account
    parent_user_id BIGINT NOT NULL COMMENT 'The app_users.id of parent account holder',
    
    -- Link to alumni data (if applicable)
    alumni_member_id INT NULL COMMENT 'Links to alumni_members table if this member is an alumnus',
    
    -- Family member personal info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(150),
    
    -- Age verification and access control
    birth_date DATE NULL COMMENT 'For age calculation',
    age_at_registration INT NULL,
    current_age INT NULL COMMENT 'Auto-calculated field, updated periodically',
    
    -- Access permissions
    can_access_platform BOOLEAN DEFAULT FALSE COMMENT '14+ only',
    requires_parent_consent BOOLEAN DEFAULT FALSE COMMENT 'Ages 14-17',
    parent_consent_given BOOLEAN DEFAULT FALSE,
    parent_consent_date TIMESTAMP NULL,
    access_level ENUM('full', 'supervised', 'blocked') DEFAULT 'blocked',
    
    -- Relationship to parent
    relationship ENUM('self', 'child', 'spouse', 'sibling', 'guardian') DEFAULT 'child',
    is_primary_contact BOOLEAN DEFAULT FALSE COMMENT 'True for parent''s own profile',
    
    -- Profile metadata
    profile_image_url VARCHAR(500),
    bio TEXT,
    status ENUM('active', 'inactive', 'suspended', 'pending_consent') DEFAULT 'pending_consent',
    
    -- Tracking
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    last_consent_check_at TIMESTAMP NULL COMMENT 'For annual renewal',
    
    -- Foreign key constraints
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
    
    -- Indexes for performance
    INDEX idx_parent_user_id (parent_user_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_access_level (access_level),
    INDEX idx_can_access (can_access_platform),
    INDEX idx_status (status),
    INDEX idx_relationship (relationship)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individual profiles for family members sharing a parent account';

-- ============================================================================
-- TABLE 2: FAMILY_ACCESS_LOG
-- ============================================================================
-- Tracks when family members access the platform
-- Useful for parent monitoring and security auditing
-- ============================================================================

CREATE TABLE IF NOT EXISTS FAMILY_ACCESS_LOG (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    family_member_id CHAR(36) NOT NULL,
    parent_user_id BIGINT NOT NULL,
    access_type ENUM('login', 'profile_switch', 'logout') NOT NULL,
    access_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    session_id VARCHAR(255),
    
    FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    
    INDEX idx_family_member (family_member_id),
    INDEX idx_parent_user (parent_user_id),
    INDEX idx_access_timestamp (access_timestamp),
    INDEX idx_access_type (access_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit log of family member platform access';

-- ============================================================================
-- MODIFY EXISTING TABLES
-- ============================================================================

-- Modify USER_PREFERENCES to support family member preferences
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'USER_PREFERENCES' 
    AND COLUMN_NAME = 'family_member_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE USER_PREFERENCES ADD COLUMN family_member_id CHAR(36) NULL AFTER user_id 
     COMMENT ''Links to FAMILY_MEMBERS for individual member preferences''',
    'SELECT "Column family_member_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add foreign key if it doesn't exist
SET @fk_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'USER_PREFERENCES' 
    AND CONSTRAINT_NAME = 'fk_family_member_preferences');

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE USER_PREFERENCES ADD CONSTRAINT fk_family_member_preferences 
     FOREIGN KEY (family_member_id) REFERENCES FAMILY_MEMBERS(id) ON DELETE CASCADE',
    'SELECT "Foreign key already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add index if it doesn't exist
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'USER_PREFERENCES' 
    AND INDEX_NAME = 'idx_family_member_preferences');

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE USER_PREFERENCES ADD INDEX idx_family_member_preferences (family_member_id)',
    'SELECT "Index already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Modify app_users table for family account support
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'app_users' 
    AND COLUMN_NAME = 'is_family_account');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE app_users ADD COLUMN is_family_account BOOLEAN DEFAULT FALSE AFTER email 
     COMMENT ''Indicates if this account manages multiple family members''',
    'SELECT "Column is_family_account already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'app_users' 
    AND COLUMN_NAME = 'family_account_type');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE app_users ADD COLUMN family_account_type ENUM(''individual'', ''parent'', ''shared'') DEFAULT ''individual'' 
     AFTER is_family_account COMMENT ''Type of family account''',
    'SELECT "Column family_account_type already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'app_users' 
    AND COLUMN_NAME = 'primary_family_member_id');

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE app_users ADD COLUMN primary_family_member_id CHAR(36) NULL AFTER family_account_type 
     COMMENT ''Currently active family member profile''',
    'SELECT "Column primary_family_member_id already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add indexes for app_users
SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'app_users' 
    AND INDEX_NAME = 'idx_family_account');

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE app_users ADD INDEX idx_family_account (is_family_account)',
    'SELECT "Index idx_family_account already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'app_users' 
    AND INDEX_NAME = 'idx_family_type');

SET @sql = IF(@idx_exists = 0,
    'ALTER TABLE app_users ADD INDEX idx_family_type (family_account_type)',
    'SELECT "Index idx_family_type already exists" AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'Family Members tables created successfully!' AS Status;
SELECT 'Next step: Run migration script to create family members for existing users' AS NextStep;

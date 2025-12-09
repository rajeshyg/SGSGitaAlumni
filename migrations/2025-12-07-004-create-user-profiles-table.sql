-- Migration: Create user_profiles table
-- Date: 2025-12-07
-- Purpose: App user profiles with access control (replaces FAMILY_MEMBERS)
-- Part of: Registration & Onboarding feature

CREATE TABLE IF NOT EXISTS user_profiles (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    
    -- Foreign keys
    account_id CHAR(36) NOT NULL,
    alumni_member_id INT NOT NULL,
    
    -- Relationship
    relationship ENUM('parent', 'child') NOT NULL,
    parent_profile_id CHAR(36) NULL COMMENT 'If child, link to parent profile',
    
    -- Access control (COPPA)
    access_level ENUM('full', 'supervised', 'blocked') NOT NULL DEFAULT 'blocked',
    requires_consent BOOLEAN NOT NULL DEFAULT FALSE,
    parent_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    consent_expiry_date DATE NULL COMMENT 'Parental consent expires 1 year from grant',
    
    -- Profile status
    status ENUM('active', 'suspended', 'deleted') NOT NULL DEFAULT 'active',
    
    -- User-customizable fields
    display_name VARCHAR(255) NULL,
    bio TEXT NULL,
    visibility ENUM('public', 'connections_only', 'private') NOT NULL DEFAULT 'public',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE KEY uk_account_alumni (account_id, alumni_member_id),
    
    -- Foreign keys
    CONSTRAINT fk_user_profiles_account 
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_profiles_alumni 
        FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE RESTRICT,
    CONSTRAINT fk_user_profiles_parent 
        FOREIGN KEY (parent_profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_account_id (account_id),
    INDEX idx_alumni_member_id (alumni_member_id),
    INDEX idx_access_level (access_level),
    INDEX idx_status (status),
    INDEX idx_relationship (relationship),
    INDEX idx_parent_profile_id (parent_profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify table created
DESCRIBE user_profiles;

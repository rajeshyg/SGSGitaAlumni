-- Database Schema Improvements for Alumni Management
-- Date: 2025-09-28
-- Purpose: Improve alumni_members and app_users relationship, add proper constraints and indexes

-- ========================================
-- 1. ADD MISSING COLUMNS TO ALUMNI_MEMBERS
-- ========================================

-- Add email column to alumni_members for better contact management
ALTER TABLE alumni_members ADD COLUMN email VARCHAR(255) NULL AFTER father_name;

-- Add phone column to alumni_members for contact information
ALTER TABLE alumni_members ADD COLUMN phone VARCHAR(20) NULL AFTER email;

-- Add status column to track alumni record status
ALTER TABLE alumni_members ADD COLUMN status ENUM('active', 'inactive', 'pending', 'archived') DEFAULT 'active' AFTER phone;

-- Add invitation tracking columns
ALTER TABLE alumni_members ADD COLUMN invitation_sent_at TIMESTAMP NULL AFTER status;
ALTER TABLE alumni_members ADD COLUMN invitation_accepted_at TIMESTAMP NULL AFTER invitation_sent_at;
ALTER TABLE alumni_members ADD COLUMN last_contact_attempt TIMESTAMP NULL AFTER invitation_accepted_at;

-- ========================================
-- 2. ADD MISSING COLUMNS TO APP_USERS
-- ========================================

-- Add profile columns that should be in app_users (not dependent on alumni_members)
ALTER TABLE app_users ADD COLUMN first_name VARCHAR(255) NULL AFTER email;
ALTER TABLE app_users ADD COLUMN last_name VARCHAR(255) NULL AFTER first_name;
ALTER TABLE app_users ADD COLUMN birth_date DATE NULL AFTER last_name;
ALTER TABLE app_users ADD COLUMN phone VARCHAR(20) NULL AFTER birth_date;
ALTER TABLE app_users ADD COLUMN profile_image_url VARCHAR(500) NULL AFTER phone;
ALTER TABLE app_users ADD COLUMN bio TEXT NULL AFTER profile_image_url;
ALTER TABLE app_users ADD COLUMN linkedin_url VARCHAR(500) NULL AFTER bio;
ALTER TABLE app_users ADD COLUMN current_position VARCHAR(255) NULL AFTER linkedin_url;
ALTER TABLE app_users ADD COLUMN company VARCHAR(255) NULL AFTER current_position;
ALTER TABLE app_users ADD COLUMN location VARCHAR(255) NULL AFTER company;

-- Add user status and verification columns
ALTER TABLE app_users ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active' AFTER location;
ALTER TABLE app_users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER status;
ALTER TABLE app_users ADD COLUMN email_verified_at TIMESTAMP NULL AFTER email_verified;
ALTER TABLE app_users ADD COLUMN last_login_at TIMESTAMP NULL AFTER email_verified_at;
ALTER TABLE app_users ADD COLUMN login_count INT DEFAULT 0 AFTER last_login_at;

-- ========================================
-- 3. IMPROVE FOREIGN KEY CONSTRAINTS
-- ========================================

-- Drop existing foreign key if it exists
ALTER TABLE app_users DROP FOREIGN KEY IF EXISTS fk_app_users_alumni_member;

-- Add improved foreign key constraint with proper naming
ALTER TABLE app_users ADD CONSTRAINT fk_app_users_alumni_member_id
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Add reverse foreign key from alumni_members to app_users
ALTER TABLE alumni_members ADD CONSTRAINT fk_alumni_members_user_id
    FOREIGN KEY (user_id) REFERENCES app_users(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ========================================
-- 4. ADD INDEXES FOR PERFORMANCE
-- ========================================

-- Index on alumni_members email for contact searches
CREATE INDEX idx_alumni_members_email ON alumni_members(email);

-- Index on alumni_members status for filtering
CREATE INDEX idx_alumni_members_status ON alumni_members(status);

-- Index on alumni_members invitation tracking
CREATE INDEX idx_alumni_members_invitation_sent ON alumni_members(invitation_sent_at);
CREATE INDEX idx_alumni_members_invitation_accepted ON alumni_members(invitation_accepted_at);

-- Index on app_users status
CREATE INDEX idx_app_users_status ON app_users(status);

-- Index on app_users email verification
CREATE INDEX idx_app_users_email_verified ON app_users(email_verified);

-- Composite index for user searches
CREATE INDEX idx_app_users_name_search ON app_users(first_name, last_name);

-- ========================================
-- 5. ADD UNIQUE CONSTRAINTS
-- ========================================

-- Ensure email uniqueness in app_users (should already exist)
ALTER TABLE app_users ADD CONSTRAINT uk_app_users_email UNIQUE (email);

-- Ensure student_id uniqueness in alumni_members where not null
CREATE UNIQUE INDEX uk_alumni_members_student_id ON alumni_members(student_id) WHERE student_id IS NOT NULL;

-- ========================================
-- 6. ADD CHECK CONSTRAINTS
-- ========================================

-- Ensure valid email format in alumni_members
ALTER TABLE alumni_members ADD CONSTRAINT chk_alumni_members_email_format 
    CHECK (email IS NULL OR email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure valid email format in app_users
ALTER TABLE app_users ADD CONSTRAINT chk_app_users_email_format 
    CHECK (email REGEXP '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Ensure birth_date is reasonable (not in future, not too old)
ALTER TABLE app_users ADD CONSTRAINT chk_app_users_birth_date 
    CHECK (birth_date IS NULL OR (birth_date <= CURDATE() AND birth_date >= DATE_SUB(CURDATE(), INTERVAL 120 YEAR)));

-- ========================================
-- 7. CREATE INVITATION TRACKING TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS user_invitations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    alumni_member_id INT NULL,
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) NOT NULL UNIQUE,
    invitation_type ENUM('alumni', 'family', 'admin') DEFAULT 'alumni',
    invited_by_user_id BIGINT NULL,
    status ENUM('pending', 'accepted', 'expired', 'cancelled') DEFAULT 'pending',
    expires_at TIMESTAMP NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    created_app_user_id BIGINT NULL,
    metadata JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) ON DELETE SET NULL,
    FOREIGN KEY (invited_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_app_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_invitation_token (invitation_token),
    INDEX idx_invitation_email (email),
    INDEX idx_invitation_status (status),
    INDEX idx_invitation_expires (expires_at),
    INDEX idx_invitation_alumni_member (alumni_member_id)
);

-- ========================================
-- 8. CREATE AUDIT LOG TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS alumni_audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id BIGINT NOT NULL,
    action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    changed_by_user_id BIGINT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    
    -- Foreign key
    FOREIGN KEY (changed_by_user_id) REFERENCES app_users(id) ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_audit_table_record (table_name, record_id),
    INDEX idx_audit_changed_by (changed_by_user_id),
    INDEX idx_audit_changed_at (changed_at)
);

-- ========================================
-- 9. UPDATE EXISTING DATA
-- ========================================

-- Update alumni_members records to have proper status
UPDATE alumni_members SET status = 'active' WHERE status IS NULL;

-- Update app_users records to have proper status
UPDATE app_users SET status = 'active' WHERE status IS NULL;

-- Set email_verified to true for existing users (they're already in the system)
UPDATE app_users SET email_verified = TRUE, email_verified_at = created_at WHERE email_verified = FALSE;

-- ========================================
-- 10. VERIFICATION QUERIES
-- ========================================

-- Check the updated table structures
-- SELECT 'alumni_members columns:' as info;
-- DESCRIBE alumni_members;

-- SELECT 'app_users columns:' as info;
-- DESCRIBE app_users;

-- Check foreign key constraints
-- SELECT 'Foreign key constraints:' as info;
-- SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
-- FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND REFERENCED_TABLE_NAME IS NOT NULL
-- AND TABLE_NAME IN ('app_users', 'alumni_members');

-- Check indexes
-- SELECT 'Indexes:' as info;
-- SHOW INDEX FROM alumni_members;
-- SHOW INDEX FROM app_users;

-- Step 1: Add basic columns to alumni_members and app_users
-- This step adds essential columns without dependencies

-- ========================================
-- 1. ADD BASIC COLUMNS TO ALUMNI_MEMBERS
-- ========================================

-- Add email column to alumni_members
ALTER TABLE alumni_members ADD COLUMN email VARCHAR(255) NULL;

-- Add phone column to alumni_members
ALTER TABLE alumni_members ADD COLUMN phone VARCHAR(20) NULL;

-- Add status column to alumni_members
ALTER TABLE alumni_members ADD COLUMN status ENUM('active', 'inactive', 'pending', 'archived') DEFAULT 'active';

-- Add invitation tracking columns
ALTER TABLE alumni_members ADD COLUMN invitation_sent_at TIMESTAMP NULL;
ALTER TABLE alumni_members ADD COLUMN invitation_accepted_at TIMESTAMP NULL;
ALTER TABLE alumni_members ADD COLUMN last_contact_attempt TIMESTAMP NULL;

-- ========================================
-- 2. ADD BASIC COLUMNS TO APP_USERS
-- ========================================

-- Add profile columns to app_users
ALTER TABLE app_users ADD COLUMN first_name VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN last_name VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN birth_date DATE NULL;
ALTER TABLE app_users ADD COLUMN phone VARCHAR(20) NULL;
ALTER TABLE app_users ADD COLUMN profile_image_url VARCHAR(500) NULL;
ALTER TABLE app_users ADD COLUMN bio TEXT NULL;
ALTER TABLE app_users ADD COLUMN linkedin_url VARCHAR(500) NULL;
ALTER TABLE app_users ADD COLUMN current_position VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN company VARCHAR(255) NULL;
ALTER TABLE app_users ADD COLUMN location VARCHAR(255) NULL;

-- Add user status and verification columns
ALTER TABLE app_users ADD COLUMN status ENUM('active', 'inactive', 'suspended', 'pending') DEFAULT 'active';
ALTER TABLE app_users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE app_users ADD COLUMN email_verified_at TIMESTAMP NULL;
ALTER TABLE app_users ADD COLUMN last_login_at TIMESTAMP NULL;
ALTER TABLE app_users ADD COLUMN login_count INT DEFAULT 0;

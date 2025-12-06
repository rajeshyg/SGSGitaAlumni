-- ============================================================================
-- Migration: Consolidate user_profiles into FAMILY_MEMBERS
-- Date: 2025-12-06
-- Purpose: Eliminate redundant profile tables, single source of truth
-- ============================================================================

-- ============================================================================
-- STEP 1: Add missing columns to FAMILY_MEMBERS
-- These columns were previously in user_profiles
-- NOTE: MySQL doesn't support IF NOT EXISTS for ADD COLUMN
-- Run these one at a time and ignore errors for columns that already exist
-- ============================================================================

-- Alumni/education data
-- Run each ALTER separately. If column exists, you'll get error 1060 - that's OK, continue.
ALTER TABLE FAMILY_MEMBERS ADD COLUMN graduation_year INT NULL;
ALTER TABLE FAMILY_MEMBERS ADD COLUMN program VARCHAR(100) NULL;

-- Alumni data snapshot (JSON blob for point-in-time capture)
ALTER TABLE FAMILY_MEMBERS ADD COLUMN alumni_data_snapshot JSON NULL;

-- Social/contact fields
ALTER TABLE FAMILY_MEMBERS ADD COLUMN social_links JSON NULL;
ALTER TABLE FAMILY_MEMBERS ADD COLUMN phone VARCHAR(20) NULL;

-- Professional fields (from app_users)
ALTER TABLE FAMILY_MEMBERS ADD COLUMN linkedin_url VARCHAR(500) NULL;
ALTER TABLE FAMILY_MEMBERS ADD COLUMN current_position VARCHAR(200) NULL;
ALTER TABLE FAMILY_MEMBERS ADD COLUMN company VARCHAR(200) NULL;
ALTER TABLE FAMILY_MEMBERS ADD COLUMN location VARCHAR(200) NULL;

-- User additions (extra data provided during registration)
ALTER TABLE FAMILY_MEMBERS ADD COLUMN user_additions JSON NULL;

-- ============================================================================
-- STEP 2: Migrate data from user_profiles to FAMILY_MEMBERS
-- Match on parent_user_id = user_id WHERE relationship='self' AND is_primary_contact=1
-- NOTE: In MySQL UPDATE...JOIN, SET comes BEFORE WHERE
-- ============================================================================

UPDATE FAMILY_MEMBERS fm
INNER JOIN user_profiles up ON fm.parent_user_id = up.user_id
SET 
  fm.graduation_year = COALESCE(fm.graduation_year, up.graduation_year),
  fm.program = COALESCE(fm.program, up.program),
  fm.alumni_data_snapshot = COALESCE(fm.alumni_data_snapshot, up.alumni_data_snapshot),
  fm.social_links = COALESCE(fm.social_links, up.social_links),
  fm.phone = COALESCE(fm.phone, up.phone),
  fm.user_additions = COALESCE(fm.user_additions, up.user_additions),
  fm.display_name = COALESCE(fm.display_name, up.display_name),
  fm.bio = COALESCE(fm.bio, up.bio),
  fm.profile_image_url = COALESCE(fm.profile_image_url, up.avatar_url)
WHERE fm.relationship = 'self' AND fm.is_primary_contact = 1;

-- ============================================================================
-- STEP 3: Migrate data from app_users to FAMILY_MEMBERS (professional fields)
-- ============================================================================

UPDATE FAMILY_MEMBERS fm
INNER JOIN app_users au ON fm.parent_user_id = au.id
SET 
  fm.linkedin_url = COALESCE(fm.linkedin_url, au.linkedin_url),
  fm.current_position = COALESCE(fm.current_position, au.current_position),
  fm.company = COALESCE(fm.company, au.company),
  fm.location = COALESCE(fm.location, au.location),
  fm.phone = COALESCE(fm.phone, au.phone),
  fm.bio = COALESCE(fm.bio, au.bio),
  fm.profile_image_url = COALESCE(fm.profile_image_url, au.profile_image_url)
WHERE fm.relationship = 'self' AND fm.is_primary_contact = 1;

-- ============================================================================
-- STEP 4: Rename user_profiles table to preserve data (backup)
-- ============================================================================

RENAME TABLE user_profiles TO user_profiles_deprecated_20251206;

-- ============================================================================
-- STEP 5: Create user_profiles VIEW for backward compatibility
-- Any code still querying user_profiles will continue to work
-- ============================================================================

CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  fm.id,
  fm.parent_user_id AS user_id,
  fm.alumni_member_id,
  fm.first_name,
  fm.last_name,
  fm.display_name,
  fm.bio,
  fm.profile_image_url AS avatar_url,
  fm.phone,
  fm.social_links,
  fm.created_at,
  fm.updated_at,
  fm.graduation_year,
  fm.program,
  fm.alumni_data_snapshot,
  fm.user_additions
FROM FAMILY_MEMBERS fm
WHERE fm.relationship = 'self' AND fm.is_primary_contact = 1;

-- ============================================================================
-- STEP 6: Add indexes for performance (ignore errors if index already exists)
-- ============================================================================

-- Index for finding primary profile
-- MySQL 8.0.29+ supports CREATE INDEX IF NOT EXISTS, older versions will error - ignore if exists
CREATE INDEX idx_fm_primary_profile 
ON FAMILY_MEMBERS (parent_user_id, relationship, is_primary_contact);

-- Index for alumni lookup
CREATE INDEX idx_fm_alumni_member 
ON FAMILY_MEMBERS (alumni_member_id);

-- ============================================================================
-- VERIFICATION QUERIES (run after migration)
-- ============================================================================

-- Check migration success: Count records
-- SELECT 'user_profiles_deprecated_20251206' as tbl, COUNT(*) FROM user_profiles_deprecated_20251206;
-- SELECT 'FAMILY_MEMBERS with profile data' as tbl, COUNT(*) FROM FAMILY_MEMBERS WHERE relationship = 'self';

-- Verify view works
-- SELECT * FROM user_profiles LIMIT 5;

-- Check for any orphaned records (user_profiles without FAMILY_MEMBERS)
-- SELECT up.user_id 
-- FROM user_profiles_deprecated_20251206 up
-- LEFT JOIN FAMILY_MEMBERS fm ON up.user_id = fm.parent_user_id AND fm.relationship = 'self'
-- WHERE fm.id IS NULL;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- DROP VIEW IF EXISTS user_profiles;
-- RENAME TABLE user_profiles_deprecated_20251206 TO user_profiles;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN graduation_year;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN program;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN alumni_data_snapshot;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN social_links;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN user_additions;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN linkedin_url;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN current_position;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN company;
-- ALTER TABLE FAMILY_MEMBERS DROP COLUMN location;

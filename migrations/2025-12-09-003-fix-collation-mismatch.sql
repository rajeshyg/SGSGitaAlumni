-- Migration: Fix collation mismatch
-- Date: 2025-12-09
-- Purpose: Convert accounts and user_profiles to utf8mb4_0900_ai_ci to match existing tables
-- 
-- Error: "Illegal mix of collations (utf8mb4_0900_ai_ci,IMPLICIT) and (utf8mb4_unicode_ci,IMPLICIT)"
-- This happens when joining accounts/user_profiles with other tables

-- Convert accounts table
ALTER TABLE accounts CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Convert user_profiles table  
ALTER TABLE user_profiles CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Verify
SELECT TABLE_NAME, TABLE_COLLATION 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('accounts', 'user_profiles', 'USER_PREFERENCES', 'alumni_members');

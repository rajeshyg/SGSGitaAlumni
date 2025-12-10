-- Migration: Fix collation mismatch for posting-related tables
-- Issue: GET /api/postings returned 500 due to collation mismatch between
--        POSTINGS tables (utf8mb4_0900_ai_ci) and related tables (utf8mb4_unicode_ci)
-- Date: 2025-12-10
-- Status: APPLIED SUCCESSFULLY

-- Disable foreign key checks to allow collation changes on tables with FK constraints
SET FOREIGN_KEY_CHECKS = 0;

-- Fix POSTING_CATEGORIES collation
ALTER TABLE POSTING_CATEGORIES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Fix other posting-related tables with mismatched collations
ALTER TABLE POSTING_DOMAINS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE POSTING_TAGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE DOMAINS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE TAGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
ALTER TABLE TAG_DOMAIN_MAPPINGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verification query (run after migration)
-- SELECT TABLE_NAME, TABLE_COLLATION 
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME IN ('POSTINGS', 'POSTING_CATEGORIES', 'POSTING_DOMAINS', 'POSTING_TAGS', 'DOMAINS', 'TAGS', 'TAG_DOMAIN_MAPPINGS');

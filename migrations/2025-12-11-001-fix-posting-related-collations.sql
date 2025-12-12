-- Migration: Fix Posting Related Tables Collation
-- Date: 2025-12-11
-- Purpose: Standardize collation to utf8mb4_0900_ai_ci to match POSTINGS table
-- Resolves "Illegal mix of collations" errors in JOINs and Subqueries

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Fix POSTING_ATTACHMENTS
ALTER TABLE POSTING_ATTACHMENTS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 2. Fix POSTING_LIKES
ALTER TABLE POSTING_LIKES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- 3. Fix POSTING_COMMENTS
ALTER TABLE POSTING_COMMENTS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SET FOREIGN_KEY_CHECKS = 1;

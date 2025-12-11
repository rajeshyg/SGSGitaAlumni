-- Migration: Fix collation mismatch for chat-related tables
-- Issue: GET /api/conversations returned 500 due to collation mismatch between
--        chat tables (utf8mb4_unicode_ci) and related tables (utf8mb4_0900_ai_ci)
-- Date: 2025-12-10
-- Status: APPLIED SUCCESSFULLY
--
-- Problem: Chat tables were created with utf8mb4_unicode_ci collation, but they join
--          with user_profiles, POSTINGS, accounts, and alumni_members which use
--          utf8mb4_0900_ai_ci. This causes "Illegal mix of collations" errors.
--
-- Solution: Convert all chat-related tables to utf8mb4_0900_ai_ci to match the standard.

-- Disable foreign key checks to allow collation changes on tables with FK constraints
SET FOREIGN_KEY_CHECKS = 0;

-- Fix CONVERSATIONS collation
ALTER TABLE CONVERSATIONS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Fix CONVERSATION_PARTICIPANTS collation
ALTER TABLE CONVERSATION_PARTICIPANTS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Fix MESSAGES collation
ALTER TABLE MESSAGES CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Fix MESSAGE_REACTIONS collation
ALTER TABLE MESSAGE_REACTIONS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Fix MESSAGE_READ_RECEIPTS collation
ALTER TABLE MESSAGE_READ_RECEIPTS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verification query (run after migration)
-- SELECT TABLE_NAME, TABLE_COLLATION 
-- FROM information_schema.TABLES 
-- WHERE TABLE_SCHEMA = DATABASE() 
-- AND TABLE_NAME IN ('CONVERSATIONS', 'CONVERSATION_PARTICIPANTS', 'MESSAGES', 'MESSAGE_REACTIONS', 'MESSAGE_READ_RECEIPTS');


-- Migration: Update Chat Tables for COPPA Refactor
-- Date: 2025-12-09
-- Purpose: Migrate chat tables from app_users (BIGINT) to user_profiles (CHAR(36) UUID)
-- 
-- Problem: Chat tables were created with FK references to app_users(id) which is:
--   1. Now dropped (table doesn't exist)
--   2. Was BIGINT, but user_profiles.id is CHAR(36) UUID
--
-- This migration:
--   1. Drops old FK constraints pointing to non-existent app_users table
--   2. Changes column types from BIGINT to CHAR(36)
--   3. Creates new FK constraints pointing to user_profiles

-- Disable FK checks for safe migration
SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- STEP 1: Drop Old Foreign Keys (referencing app_users)
-- =============================================================================

-- CONVERSATIONS: Drop fk_conversation_creator
ALTER TABLE CONVERSATIONS DROP FOREIGN KEY fk_conversation_creator;

-- CONVERSATION_PARTICIPANTS: Drop fk_participant_user
ALTER TABLE CONVERSATION_PARTICIPANTS DROP FOREIGN KEY fk_participant_user;

-- MESSAGES: Drop fk_message_sender
ALTER TABLE MESSAGES DROP FOREIGN KEY fk_message_sender;

-- MESSAGE_REACTIONS: Drop fk_reaction_user
ALTER TABLE MESSAGE_REACTIONS DROP FOREIGN KEY fk_reaction_user;

-- MESSAGE_READ_RECEIPTS: Drop fk_receipt_user
ALTER TABLE MESSAGE_READ_RECEIPTS DROP FOREIGN KEY fk_receipt_user;

-- =============================================================================
-- STEP 2: Modify Column Types from BIGINT to CHAR(36)
-- =============================================================================

-- CONVERSATIONS.created_by: BIGINT -> CHAR(36)
ALTER TABLE CONVERSATIONS MODIFY COLUMN created_by CHAR(36) NOT NULL 
  COMMENT 'User profile ID who created the conversation';

-- CONVERSATION_PARTICIPANTS.user_id: BIGINT -> CHAR(36)
-- First drop the unique constraint that includes user_id
ALTER TABLE CONVERSATION_PARTICIPANTS DROP INDEX unique_user_conversation;
ALTER TABLE CONVERSATION_PARTICIPANTS MODIFY COLUMN user_id CHAR(36) NOT NULL
  COMMENT 'User profile ID of participant';
-- Recreate the unique constraint
ALTER TABLE CONVERSATION_PARTICIPANTS ADD UNIQUE KEY unique_user_conversation (conversation_id, user_id);

-- MESSAGES.sender_id: BIGINT -> CHAR(36)
ALTER TABLE MESSAGES MODIFY COLUMN sender_id CHAR(36) NOT NULL
  COMMENT 'User profile ID of message sender';

-- MESSAGE_REACTIONS.user_id: BIGINT -> CHAR(36)
-- First drop the unique constraint that includes user_id
ALTER TABLE MESSAGE_REACTIONS DROP INDEX unique_message_user_emoji;
ALTER TABLE MESSAGE_REACTIONS MODIFY COLUMN user_id CHAR(36) NOT NULL
  COMMENT 'User profile ID who reacted';
-- Recreate the unique constraint
ALTER TABLE MESSAGE_REACTIONS ADD UNIQUE KEY unique_message_user_emoji (message_id, user_id, emoji);

-- MESSAGE_READ_RECEIPTS.user_id: BIGINT -> CHAR(36)
-- First drop the unique constraint that includes user_id
ALTER TABLE MESSAGE_READ_RECEIPTS DROP INDEX unique_message_user_read;
ALTER TABLE MESSAGE_READ_RECEIPTS MODIFY COLUMN user_id CHAR(36) NOT NULL
  COMMENT 'User profile ID who read the message';
-- Recreate the unique constraint
ALTER TABLE MESSAGE_READ_RECEIPTS ADD UNIQUE KEY unique_message_user_read (message_id, user_id);

-- =============================================================================
-- STEP 3: Create New Foreign Keys (referencing user_profiles)
-- =============================================================================

-- CONVERSATIONS.created_by -> user_profiles.id
ALTER TABLE CONVERSATIONS 
  ADD CONSTRAINT fk_conversation_creator 
  FOREIGN KEY (created_by) REFERENCES user_profiles(id) ON DELETE RESTRICT;

-- CONVERSATION_PARTICIPANTS.user_id -> user_profiles.id
ALTER TABLE CONVERSATION_PARTICIPANTS 
  ADD CONSTRAINT fk_participant_user 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- MESSAGES.sender_id -> user_profiles.id
ALTER TABLE MESSAGES 
  ADD CONSTRAINT fk_message_sender 
  FOREIGN KEY (sender_id) REFERENCES user_profiles(id) ON DELETE RESTRICT;

-- MESSAGE_REACTIONS.user_id -> user_profiles.id
ALTER TABLE MESSAGE_REACTIONS 
  ADD CONSTRAINT fk_reaction_user 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- MESSAGE_READ_RECEIPTS.user_id -> user_profiles.id
ALTER TABLE MESSAGE_READ_RECEIPTS 
  ADD CONSTRAINT fk_receipt_user 
  FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- =============================================================================
-- STEP 4: Re-enable FK checks
-- =============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- STEP 5: Verification
-- =============================================================================
SELECT 'Chat tables migration complete' as status;

-- Verify new column types
SELECT 
  TABLE_NAME, 
  COLUMN_NAME, 
  COLUMN_TYPE 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('CONVERSATIONS', 'CONVERSATION_PARTICIPANTS', 'MESSAGES', 'MESSAGE_REACTIONS', 'MESSAGE_READ_RECEIPTS')
  AND COLUMN_NAME IN ('created_by', 'user_id', 'sender_id')
ORDER BY TABLE_NAME;

-- Verify new FK constraints
SELECT 
  TABLE_NAME, 
  CONSTRAINT_NAME, 
  REFERENCED_TABLE_NAME 
FROM information_schema.KEY_COLUMN_USAGE 
WHERE CONSTRAINT_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('CONVERSATIONS', 'CONVERSATION_PARTICIPANTS', 'MESSAGES', 'MESSAGE_REACTIONS', 'MESSAGE_READ_RECEIPTS') 
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

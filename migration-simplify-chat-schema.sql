-- ============================================================================
-- Task 8.12: Simplify Chat Schema - Remove Redundant Fields
-- Date: November 10, 2025
-- Goal: Remove is_group, posting_title; simplify type to DIRECT/GROUP only
-- ============================================================================

-- BACKUP FIRST
CREATE TABLE IF NOT EXISTS CONVERSATIONS_BACKUP_20251110 AS 
SELECT * FROM CONVERSATIONS;

-- Check current data
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN posting_id IS NOT NULL THEN 1 ELSE 0 END) as with_posting,
  SUM(CASE WHEN is_group = 1 THEN 1 ELSE 0 END) as is_group_true
FROM CONVERSATIONS
GROUP BY type;

-- ============================================================================
-- STEP 1: Migrate POST_LINKED conversations to DIRECT or GROUP
-- ============================================================================

-- POST_LINKED with 2 participants → DIRECT
UPDATE CONVERSATIONS c
SET c.type = 'DIRECT'
WHERE c.type = 'POST_LINKED'
  AND (
    SELECT COUNT(*) 
    FROM CONVERSATION_PARTICIPANTS cp 
    WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
  ) = 2;

-- POST_LINKED with 3+ participants → GROUP
UPDATE CONVERSATIONS c
SET c.type = 'GROUP'
WHERE c.type = 'POST_LINKED'
  AND (
    SELECT COUNT(*) 
    FROM CONVERSATION_PARTICIPANTS cp 
    WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
  ) > 2;

-- Verify migration
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN posting_id IS NOT NULL THEN 1 ELSE 0 END) as with_posting
FROM CONVERSATIONS
GROUP BY type;

-- ============================================================================
-- STEP 2: Drop redundant columns
-- ============================================================================

-- Drop is_group (redundant with participant count)
ALTER TABLE CONVERSATIONS DROP COLUMN IF EXISTS is_group;

-- Drop posting_title (fetch from POSTINGS table instead)
ALTER TABLE CONVERSATIONS DROP COLUMN IF EXISTS posting_title;

-- ============================================================================
-- STEP 3: Update type enum to only DIRECT and GROUP
-- ============================================================================

-- Modify type to only allow DIRECT and GROUP
ALTER TABLE CONVERSATIONS 
  MODIFY COLUMN type ENUM('DIRECT', 'GROUP') NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check final schema
DESCRIBE CONVERSATIONS;

-- Check data integrity
SELECT 
  type,
  COUNT(*) as count,
  SUM(CASE WHEN posting_id IS NOT NULL THEN 1 ELSE 0 END) as post_linked,
  SUM(CASE WHEN posting_id IS NULL THEN 1 ELSE 0 END) as regular_chat
FROM CONVERSATIONS
GROUP BY type;

-- Check if any conversations lost participants during migration
SELECT 
  c.id,
  c.type,
  c.posting_id,
  COUNT(cp.id) as participant_count
FROM CONVERSATIONS c
LEFT JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id AND cp.left_at IS NULL
GROUP BY c.id, c.type, c.posting_id
HAVING participant_count = 0;

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- To rollback, run:
-- DROP TABLE CONVERSATIONS;
-- CREATE TABLE CONVERSATIONS AS SELECT * FROM CONVERSATIONS_BACKUP_20251110;
-- ============================================================================

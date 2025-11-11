-- ============================================================================
-- Migration: Add Unique Constraint for Group Chats per Posting
-- Date: November 10, 2025
-- Description: Prevents duplicate GROUP conversations for the same posting
-- ============================================================================

-- Add unique index to prevent multiple GROUP conversations for same posting
-- This ensures only one group chat can exist per posting
CREATE UNIQUE INDEX idx_unique_posting_group 
ON CONVERSATIONS (posting_id, type) 
WHERE type = 'GROUP' AND is_archived = FALSE;

-- Note: If your MySQL version doesn't support partial indexes (WHERE clause),
-- use this alternative:
-- CREATE UNIQUE INDEX idx_unique_posting_group 
-- ON CONVERSATIONS (posting_id, type);
-- 
-- Then add application-level logic to also check is_archived = FALSE

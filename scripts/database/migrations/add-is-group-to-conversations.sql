-- Migration: Add is_group column to CONVERSATIONS table
-- Task 8.12: Posts-Chat Integration - Fix group conversation detection
-- Date: 2025-11-09

-- Add is_group column to distinguish 1-on-1 from group conversations
ALTER TABLE CONVERSATIONS 
ADD COLUMN is_group BOOLEAN DEFAULT FALSE 
COMMENT 'TRUE for group chats, FALSE for 1-on-1 conversations';

-- Add index for better query performance
CREATE INDEX idx_conversations_is_group ON CONVERSATIONS(is_group);

-- Update existing POST_LINKED conversations to set is_group based on participant count
UPDATE CONVERSATIONS c
SET c.is_group = (
  SELECT COUNT(*) > 2
  FROM CONVERSATION_PARTICIPANTS cp
  WHERE cp.conversation_id = c.id AND cp.left_at IS NULL
)
WHERE c.type = 'POST_LINKED';

-- Verification query - show counts by type and is_group
SELECT 
  type,
  is_group,
  COUNT(*) as count
FROM CONVERSATIONS
GROUP BY type, is_group
ORDER BY type, is_group;

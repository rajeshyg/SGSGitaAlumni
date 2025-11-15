-- Chat System Migration
-- Task 7.10: Chat & Messaging System
-- Creates tables for conversations, participants, messages, and reactions

-- =====================================================
-- CONVERSATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CONVERSATIONS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DIRECT', 'GROUP', 'POST_LINKED')),
  name VARCHAR(200) DEFAULT NULL COMMENT 'Group name (null for direct chats)',
  posting_id CHAR(36) DEFAULT NULL COMMENT 'Linked posting for POST_LINKED type',
  created_by BIGINT NOT NULL COMMENT 'User who created the conversation',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_message_at TIMESTAMP NULL DEFAULT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP NULL DEFAULT NULL,

  -- Foreign Keys
  CONSTRAINT fk_conversation_posting FOREIGN KEY (posting_id)
    REFERENCES POSTINGS(id) ON DELETE CASCADE,
  CONSTRAINT fk_conversation_creator FOREIGN KEY (created_by)
    REFERENCES app_users(id) ON DELETE RESTRICT,

  -- Indexes for performance
  INDEX idx_conversations_type (type),
  INDEX idx_conversations_posting (posting_id),
  INDEX idx_conversations_created_by (created_by),
  INDEX idx_conversations_last_message (last_message_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- CONVERSATION_PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CONVERSATION_PARTICIPANTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP NULL DEFAULT NULL,
  last_read_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Last time user read messages',
  is_muted BOOLEAN DEFAULT FALSE COMMENT 'User muted notifications',

  -- Foreign Keys
  CONSTRAINT fk_participant_conversation FOREIGN KEY (conversation_id)
    REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
  CONSTRAINT fk_participant_user FOREIGN KEY (user_id)
    REFERENCES app_users(id) ON DELETE CASCADE,

  -- Unique constraint: user can only be in conversation once
  UNIQUE KEY unique_user_conversation (conversation_id, user_id),

  -- Indexes for performance
  INDEX idx_participants_user (user_id),
  INDEX idx_participants_conversation (conversation_id),
  INDEX idx_participants_active (conversation_id, user_id, left_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS MESSAGES (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  sender_id BIGINT NOT NULL,
  content TEXT NOT NULL COMMENT 'Message content (encrypted for privacy)',
  encryption_key_id VARCHAR(100) DEFAULT NULL COMMENT 'Encryption key version identifier',
  message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM')),
  media_url VARCHAR(500) DEFAULT NULL COMMENT 'URL for images/files',
  media_metadata JSON DEFAULT NULL COMMENT 'File size, name, type, etc.',
  reply_to_id CHAR(36) DEFAULT NULL COMMENT 'ID of message being replied to',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP NULL DEFAULT NULL,
  deleted_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete timestamp',
  is_system_message BOOLEAN DEFAULT FALSE COMMENT 'System-generated message',

  -- Foreign Keys
  CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id)
    REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_sender FOREIGN KEY (sender_id)
    REFERENCES app_users(id) ON DELETE RESTRICT,
  CONSTRAINT fk_message_reply FOREIGN KEY (reply_to_id)
    REFERENCES MESSAGES(id) ON DELETE SET NULL,

  -- Indexes for performance
  INDEX idx_messages_conversation_time (conversation_id, created_at DESC),
  INDEX idx_messages_sender (sender_id),
  INDEX idx_messages_type (message_type),
  INDEX idx_messages_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MESSAGE_REACTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS MESSAGE_REACTIONS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  message_id CHAR(36) NOT NULL,
  user_id BIGINT NOT NULL,
  emoji VARCHAR(10) NOT NULL COMMENT 'Emoji character(s)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_reaction_message FOREIGN KEY (message_id)
    REFERENCES MESSAGES(id) ON DELETE CASCADE,
  CONSTRAINT fk_reaction_user FOREIGN KEY (user_id)
    REFERENCES app_users(id) ON DELETE CASCADE,

  -- Unique constraint: user can only react once with same emoji to same message
  UNIQUE KEY unique_message_user_emoji (message_id, user_id, emoji),

  -- Indexes for performance
  INDEX idx_reactions_message (message_id),
  INDEX idx_reactions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MESSAGE READ RECEIPTS (Optional - for tracking who read what)
-- =====================================================
CREATE TABLE IF NOT EXISTS MESSAGE_READ_RECEIPTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  message_id CHAR(36) NOT NULL,
  user_id BIGINT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Foreign Keys
  CONSTRAINT fk_receipt_message FOREIGN KEY (message_id)
    REFERENCES MESSAGES(id) ON DELETE CASCADE,
  CONSTRAINT fk_receipt_user FOREIGN KEY (user_id)
    REFERENCES app_users(id) ON DELETE CASCADE,

  -- Unique constraint: user can only mark message as read once
  UNIQUE KEY unique_message_user_read (message_id, user_id),

  -- Indexes for performance
  INDEX idx_receipts_message (message_id),
  INDEX idx_receipts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Uncomment to verify tables were created:
-- SHOW TABLES LIKE '%CONVERS%';
-- SHOW TABLES LIKE '%MESSAGE%';
-- DESCRIBE CONVERSATIONS;
-- DESCRIBE CONVERSATION_PARTICIPANTS;
-- DESCRIBE MESSAGES;
-- DESCRIBE MESSAGE_REACTIONS;
-- DESCRIBE MESSAGE_READ_RECEIPTS;

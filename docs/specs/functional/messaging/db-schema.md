---
title: Database Schema - Messaging
version: 1.0
status: implemented
last_updated: 2025-11-27
applies_to: messaging
---

# Database Schema: Messaging

## Overview

Database schema for the messaging module, including conversations, direct messages, group chats, and message interactions.

## Tables

### CONVERSATIONS

**Purpose**: Stores conversation metadata for direct and group chats

**Schema**:
```sql
CREATE TABLE CONVERSATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type VARCHAR(20) NOT NULL CHECK (type IN ('DIRECT', 'GROUP', 'POST_LINKED')),
    name VARCHAR(200) DEFAULT NULL,
    posting_id CHAR(36) DEFAULT NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NULL DEFAULT NULL,
    is_archived BOOLEAN DEFAULT FALSE,
    archived_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES app_users(id) ON DELETE RESTRICT,

    INDEX idx_conversations_type (type),
    INDEX idx_conversations_posting (posting_id),
    INDEX idx_conversations_created_by (created_by),
    INDEX idx_conversations_last_message (last_message_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| type | VARCHAR(20) | NOT NULL | DIRECT, GROUP, POST_LINKED |
| name | VARCHAR(200) | NULL | Group name (null for direct) |
| posting_id | CHAR(36) | FK, NULL | Linked posting for POST_LINKED |
| last_message_at | TIMESTAMP | NULL | Last message timestamp |

---

### CONVERSATION_PARTICIPANTS

**Purpose**: Tracks participants in each conversation

**Schema**:
```sql
CREATE TABLE CONVERSATION_PARTICIPANTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    left_at TIMESTAMP NULL DEFAULT NULL,
    last_read_at TIMESTAMP NULL DEFAULT NULL,
    is_muted BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_user_conversation (conversation_id, user_id),

    INDEX idx_participants_user (user_id),
    INDEX idx_participants_conversation (conversation_id),
    INDEX idx_participants_active (conversation_id, user_id, left_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| conversation_id | CHAR(36) | NOT NULL, FK | Reference to conversation |
| user_id | BIGINT | NOT NULL, FK | Reference to app_users |
| role | VARCHAR(20) | DEFAULT 'MEMBER' | ADMIN or MEMBER |
| last_read_at | TIMESTAMP | NULL | Last read timestamp |
| is_muted | BOOLEAN | DEFAULT FALSE | Notifications muted |

---

### MESSAGES

**Purpose**: Stores individual messages within conversations

**Schema**:
```sql
CREATE TABLE MESSAGES (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    conversation_id CHAR(36) NOT NULL,
    sender_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    encryption_key_id VARCHAR(100) DEFAULT NULL,
    message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM')),
    media_url VARCHAR(500) DEFAULT NULL,
    media_metadata JSON DEFAULT NULL,
    reply_to_id CHAR(36) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    edited_at TIMESTAMP NULL DEFAULT NULL,
    deleted_at TIMESTAMP NULL DEFAULT NULL,
    is_system_message BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES app_users(id) ON DELETE RESTRICT,
    FOREIGN KEY (reply_to_id) REFERENCES MESSAGES(id) ON DELETE SET NULL,

    INDEX idx_messages_conversation_time (conversation_id, created_at DESC),
    INDEX idx_messages_sender (sender_id),
    INDEX idx_messages_type (message_type),
    INDEX idx_messages_deleted (deleted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| conversation_id | CHAR(36) | NOT NULL, FK | Parent conversation |
| sender_id | BIGINT | NOT NULL, FK | Message sender |
| content | TEXT | NOT NULL | Message content |
| message_type | VARCHAR(20) | DEFAULT 'TEXT' | TEXT, IMAGE, FILE, LINK, SYSTEM |
| reply_to_id | CHAR(36) | FK, NULL | Reply-to message reference |
| deleted_at | TIMESTAMP | NULL | Soft delete timestamp |

---

### MESSAGE_REACTIONS

**Purpose**: Stores emoji reactions to messages

**Schema**:
```sql
CREATE TABLE MESSAGE_REACTIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    message_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id) REFERENCES MESSAGES(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_message_user_emoji (message_id, user_id, emoji),

    INDEX idx_reactions_message (message_id),
    INDEX idx_reactions_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | CHAR(36) | PRIMARY KEY | UUID identifier |
| message_id | CHAR(36) | NOT NULL, FK | Reference to message |
| user_id | BIGINT | NOT NULL, FK | User who reacted |
| emoji | VARCHAR(10) | NOT NULL | Emoji character(s) |

---

### MESSAGE_READ_RECEIPTS

**Purpose**: Tracks message read status per user

**Schema**:
```sql
CREATE TABLE MESSAGE_READ_RECEIPTS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    message_id CHAR(36) NOT NULL,
    user_id BIGINT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (message_id) REFERENCES MESSAGES(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,

    UNIQUE KEY unique_message_user_read (message_id, user_id),

    INDEX idx_receipts_message (message_id),
    INDEX idx_receipts_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Table Relationships

```
CONVERSATIONS (1) ----< (N) CONVERSATION_PARTICIPANTS
CONVERSATIONS (1) ----< (N) MESSAGES
MESSAGES (1) ----< (N) MESSAGE_REACTIONS
MESSAGES (1) ----< (N) MESSAGE_READ_RECEIPTS
MESSAGES (1) ---- (1) MESSAGES (reply_to_id - self-reference)
app_users (1) ----< (N) CONVERSATION_PARTICIPANTS
app_users (1) ----< (N) MESSAGES
POSTINGS (1) ----< (N) CONVERSATIONS (POST_LINKED type)
```

## ENUM Types

### conversation_type
```sql
CHECK (type IN ('DIRECT', 'GROUP', 'POST_LINKED'))
```

### participant_role
```sql
CHECK (role IN ('ADMIN', 'MEMBER'))
```

### message_type
```sql
CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'LINK', 'SYSTEM'))
```

---

## Common Query Patterns

### Get User's Conversations
```sql
SELECT c.*, 
       cp.last_read_at,
       cp.is_muted,
       (SELECT COUNT(*) FROM MESSAGES m 
        WHERE m.conversation_id = c.id 
          AND m.created_at > COALESCE(cp.last_read_at, '1970-01-01')) as unread_count
FROM CONVERSATIONS c
JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id
WHERE cp.user_id = ? AND cp.left_at IS NULL
ORDER BY c.last_message_at DESC;
```

### Get Conversation Messages
```sql
SELECT m.*, 
       u.first_name as sender_name,
       u.email as sender_email
FROM MESSAGES m
JOIN app_users u ON m.sender_id = u.id
WHERE m.conversation_id = ?
  AND m.deleted_at IS NULL
ORDER BY m.created_at DESC
LIMIT ? OFFSET ?;
```

### Get or Create Direct Conversation
```sql
SELECT c.id FROM CONVERSATIONS c
JOIN CONVERSATION_PARTICIPANTS cp1 ON c.id = cp1.conversation_id AND cp1.user_id = ?
JOIN CONVERSATION_PARTICIPANTS cp2 ON c.id = cp2.conversation_id AND cp2.user_id = ?
WHERE c.type = 'DIRECT';
```

### Get Message Reactions
```sql
SELECT emoji, COUNT(*) as count, 
       GROUP_CONCAT(user_id) as user_ids
FROM MESSAGE_REACTIONS
WHERE message_id = ?
GROUP BY emoji;
```

---

## Migration Notes

### Version 1.0 (Initial - Task 7.10)
- Created CONVERSATIONS for chat metadata
- Created CONVERSATION_PARTICIPANTS for membership
- Created MESSAGES with encryption support
- Created MESSAGE_REACTIONS for emoji responses
- Created MESSAGE_READ_RECEIPTS for read tracking
- Added POST_LINKED type for posting-based discussions

---

## Related

- Technical Spec: `docs/specs/technical/database/schema-design.md`
- Functional Spec: `docs/specs/functional/messaging/README.md`
- API Routes: `routes/chat.js`
- Socket Handler: `server/socket/chatHandler.js`
- Service Layer: `server/services/ChatService.js`

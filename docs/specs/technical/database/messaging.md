---
title: Messaging Database Schema
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: database
---

# Messaging Database Schema

## Overview

Database schema for the real-time chat and messaging system, including conversations, messages, participants, and reactions.

## Tables

### CONVERSATIONS

Chat conversations (direct or group).

```sql
CREATE TABLE CONVERSATIONS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  type ENUM('DIRECT', 'GROUP') NOT NULL,
  name VARCHAR(200),
  posting_id CHAR(36),
  created_by INT NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  last_message_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (posting_id) REFERENCES POSTINGS(id),
  FOREIGN KEY (created_by) REFERENCES app_users(id)
);
```

### CONVERSATION_PARTICIPANTS

Junction table for conversation membership.

```sql
CREATE TABLE CONVERSATION_PARTICIPANTS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  role ENUM('OWNER', 'ADMIN', 'MEMBER') DEFAULT 'MEMBER',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_read_message_id CHAR(36),
  is_muted BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,

  FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  UNIQUE KEY (conversation_id, user_id)
);
```

### MESSAGES

Individual messages within conversations.

```sql
CREATE TABLE MESSAGES (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  conversation_id CHAR(36) NOT NULL,
  sender_id INT NOT NULL,
  content TEXT,
  message_type ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM') DEFAULT 'TEXT',
  media_url VARCHAR(500),
  media_metadata JSON,
  reply_to_id CHAR(36),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  edited_at DATETIME,
  deleted_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (conversation_id) REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES app_users(id),
  FOREIGN KEY (reply_to_id) REFERENCES MESSAGES(id)
);
```

### MESSAGE_REACTIONS

Emoji reactions on messages.

```sql
CREATE TABLE MESSAGE_REACTIONS (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  message_id CHAR(36) NOT NULL,
  user_id INT NOT NULL,
  emoji VARCHAR(50) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (message_id) REFERENCES MESSAGES(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES app_users(id),
  UNIQUE KEY (message_id, user_id, emoji)
);
```

## Key Queries

### Get User's Conversations

```sql
SELECT
  c.*,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT(
        'userId', cp2.user_id,
        'role', cp2.role,
        'firstName', u2.first_name,
        'lastName', u2.last_name
      )
    )
    FROM CONVERSATION_PARTICIPANTS cp2
    JOIN app_users u2 ON cp2.user_id = u2.id
    WHERE cp2.conversation_id = c.id
  ) as participants,
  (
    SELECT COUNT(*)
    FROM MESSAGES m
    WHERE m.conversation_id = c.id
      AND m.created_at > COALESCE(cp.last_read_message_id, '1970-01-01')
      AND m.sender_id != ?
  ) as unread_count
FROM CONVERSATIONS c
JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id
WHERE cp.user_id = ?
  AND c.is_archived = false
ORDER BY c.last_message_at DESC
LIMIT ? OFFSET ?;
```

### Get Messages for Conversation

```sql
SELECT
  m.*,
  u.first_name as sender_first_name,
  u.last_name as sender_last_name,
  (
    SELECT JSON_ARRAYAGG(
      JSON_OBJECT('id', mr.id, 'emoji', mr.emoji, 'userId', mr.user_id)
    )
    FROM MESSAGE_REACTIONS mr
    WHERE mr.message_id = m.id
  ) as reactions
FROM MESSAGES m
JOIN app_users u ON m.sender_id = u.id
WHERE m.conversation_id = ?
  AND m.is_deleted = false
ORDER BY m.created_at DESC
LIMIT ? OFFSET ?;
```

### Find Direct Conversation Between Users

```sql
SELECT c.id
FROM CONVERSATIONS c
JOIN CONVERSATION_PARTICIPANTS cp1 ON c.id = cp1.conversation_id
JOIN CONVERSATION_PARTICIPANTS cp2 ON c.id = cp2.conversation_id
WHERE c.type = 'DIRECT'
  AND c.posting_id = ?
  AND cp1.user_id = ?
  AND cp2.user_id = ?;
```

### Mark Messages as Read

```sql
UPDATE CONVERSATION_PARTICIPANTS
SET last_read_message_id = ?
WHERE conversation_id = ? AND user_id = ?;
```

## WebSocket Events

The messaging system uses Socket.IO for real-time updates:

| Event | Direction | Description |
|-------|-----------|-------------|
| `message:new` | Server->Client | New message in conversation |
| `message:edited` | Server->Client | Message was edited |
| `message:deleted` | Server->Client | Message was deleted |
| `message:reaction` | Server->Client | Reaction added to message |
| `message:read` | Server->Client | Messages marked as read |
| `conversation:created` | Server->Client | New conversation created |
| `conversation:archived` | Server->Client | Conversation archived |

## Reference Files

- `/routes/chat.js` - Chat REST API endpoints
- `/server/services/chatService.js` - Chat business logic
- `/server/socket/chatSocket.js` - WebSocket event handlers

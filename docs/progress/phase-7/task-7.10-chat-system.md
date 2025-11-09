# Task 7.10: Chat & Messaging System

**Status:** 🟡 In Progress (80% Complete)
**Priority:** Medium
**Duration:** 3 weeks (15 days) - 2 weeks completed
**Parent Task:** Phase 7 - Advanced Features
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 11
**Last Updated:** November 8, 2025

## Current Status
- ✅ Backend fully implemented and tested
- ✅ Frontend core components created
- ❌ **Missing:** UI to create new conversations (blocking manual testing)
- ❌ **Missing:** Post-linked chat integration
- ❌ E2E tests need assertion fixes

**See:** [CHAT_SYSTEM_IMPLEMENTATION_STATUS.md](../../CHAT_SYSTEM_IMPLEMENTATION_STATUS.md) for detailed progress.

## Overview
Implement complete real-time chat and messaging system with end-to-end encryption, supporting 1-to-1 direct messaging, group discussions, and post-linked chats tied to specific help requests.

**Requirements:**
- Direct Messaging for one-on-one communication
- Group Discussions for collaborative conversations
- Post-Linked Chats tied to specific help requests
- End-to-end encryption with 1-year retention

## Functional Requirements

### Chat Types

#### 1. Direct Messages (1-to-1)
- Private conversations between two users
- Real-time message delivery
- Read receipts and typing indicators
- Message search within conversation

#### 2. Group Discussions
- Multi-participant conversations (up to 50 members)
- Group admin controls
- Add/remove participants
- Group naming and avatar

#### 3. Post-Linked Chats
- Conversations tied to specific postings
- Auto-created when responding to help requests
- Posting owner can manage conversation
- Chat archived when posting expires

### Features

- **Real-Time Messaging:** WebSocket-based instant delivery
- **Encryption:** End-to-end encryption for all messages
- **Media Sharing:** Images, documents, links
- **Notifications:** Push notifications for new messages
- **Message History:** 1-year retention policy
- **Search:** Full-text search across conversations
- **Reactions:** Emoji reactions to messages
- **Moderation:** Report inappropriate messages

## Technical Requirements

### Database Schema

```sql
CREATE TABLE CONVERSATIONS (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL CHECK (type IN ('DIRECT', 'GROUP', 'POST_LINKED')),
  name VARCHAR(200), -- For group chats
  posting_id UUID REFERENCES POSTINGS(id), -- For post-linked chats
  created_by UUID NOT NULL REFERENCES app_users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP,
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP
);

CREATE TABLE CONVERSATION_PARTICIPANTS (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  role VARCHAR(20) DEFAULT 'MEMBER' CHECK (role IN ('ADMIN', 'MEMBER')),
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP,
  last_read_at TIMESTAMP,
  
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE MESSAGES (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES CONVERSATIONS(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES app_users(id),
  content TEXT NOT NULL, -- Encrypted
  encryption_key_id VARCHAR(100), -- Key version used
  message_type VARCHAR(20) DEFAULT 'TEXT' CHECK (message_type IN ('TEXT', 'IMAGE', 'FILE', 'LINK')),
  media_url VARCHAR(500), -- For images/files
  created_at TIMESTAMP DEFAULT NOW(),
  edited_at TIMESTAMP,
  deleted_at TIMESTAMP,
  is_system_message BOOLEAN DEFAULT false
);

CREATE TABLE MESSAGE_REACTIONS (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES MESSAGES(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id),
  emoji VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(message_id, user_id, emoji)
);

-- Indexes
CREATE INDEX idx_conversations_type ON CONVERSATIONS(type);
CREATE INDEX idx_conversations_posting ON CONVERSATIONS(posting_id);
CREATE INDEX idx_participants_user ON CONVERSATION_PARTICIPANTS(user_id);
CREATE INDEX idx_messages_conversation ON MESSAGES(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON MESSAGES(sender_id);
```

### WebSocket Implementation

```typescript
// Location: src/lib/websocket/ChatWebSocket.ts

export class ChatWebSocket {
  private ws: WebSocket;
  private conversationId: string;

  connect(conversationId: string) {
    this.ws = new WebSocket(`wss://api.gitaconnect.com/chat/${conversationId}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleIncomingMessage(data);
    };
  }

  sendMessage(content: string, type: 'TEXT' | 'IMAGE' | 'FILE' = 'TEXT') {
    const encryptedContent = this.encrypt(content);
    
    this.ws.send(JSON.stringify({
      type: 'NEW_MESSAGE',
      content: encryptedContent,
      messageType: type,
      timestamp: new Date().toISOString()
    }));
  }

  private encrypt(content: string): string {
    // End-to-end encryption implementation
    // Uses Web Crypto API
    return encryptedContent;
  }

  private decrypt(encryptedContent: string): string {
    // Decryption implementation
    return decryptedContent;
  }
}
```

### API Endpoints

```typescript
// GET /api/conversations - List user's conversations
// GET /api/conversations/:id - Get conversation details
// POST /api/conversations - Create new conversation
// GET /api/conversations/:id/messages - Get message history
// POST /api/conversations/:id/messages - Send message
// PUT /api/messages/:id - Edit message
// DELETE /api/messages/:id - Delete message
// POST /api/conversations/:id/participants - Add participant
// DELETE /api/conversations/:id/participants/:userId - Remove participant
// POST /api/messages/:id/reactions - Add reaction
```

### Frontend Components

```typescript
// src/components/chat/ConversationList.tsx - List of conversations
// src/components/chat/ChatWindow.tsx - Main chat interface
// src/components/chat/MessageList.tsx - Message history display
// src/components/chat/MessageInput.tsx - Message composition
// src/components/chat/ParticipantList.tsx - Group participants
```

## Implementation Plan

### Week 1: Foundation
- Days 1-2: Database schema and migrations
- Days 3-4: WebSocket server setup
- Day 5: Basic API endpoints

### Week 2: Core Features
- Days 6-7: Direct messaging
- Days 8-9: Group conversations
- Day 10: Post-linked chats

### Week 3: Advanced Features & Polish
- Days 11-12: Encryption implementation
- Day 13: Media sharing
- Days 14-15: Testing and optimization

## Success Criteria

- [x] Users can send/receive real-time messages (✅ API works, needs conversation creation UI)
- [ ] All messages encrypted end-to-end (Post-MVP feature)
- [ ] Group chats support up to 50 participants (Backend ready, needs UI)
- [ ] Post-linked chats work correctly (Backend ready, needs button on PostingDetailPage)
- [ ] Message history retained for 1 year (✅ Database configured)
- [x] WebSocket connections stable (✅ Implemented and tested)
- [x] Mobile-responsive chat interface (✅ Components are responsive)

## Remaining Work (Est. 4-5 hours)
1. **NewConversationDialog component** - User picker + conversation creation (2-3 hours)
2. **PostingDetailPage integration** - "Message Author" button (1 hour)
3. **Fix E2E test assertions** - Replace fake `|| true` checks (1 hour)
4. **Manual testing** - Verify end-to-end workflow (ongoing)

## Dependencies

### Required Before Starting
- WebSocket server infrastructure
- Media storage (S3 or similar)
- Encryption key management

### Blocks These Tasks
- [Task 7.11: Analytics Dashboard](./task-7.11-analytics-dashboard.md) - Chat data needed

## Related Documentation
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md)
- [Phase 7 README](./README.md)

---

*This task implements the complete messaging infrastructure for platform communication.*

# Messaging System - Functional Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
recommended_model: sonnet
implementation_links:
  - routes/chat.js
  - server/services/chatService.js
  - socket/chatSocket.js
---
```

## Goal
Provide real-time messaging capabilities for 1-to-1 and group conversations, integrated with postings for contextual discussions.

## Code References
- **Backend Routes**: `routes/chat.js`
- **Services**: `server/services/chatService.js`
- **Socket.IO**: `socket/chatSocket.js`
- **Frontend**: `src/pages/Chat.tsx`, `src/components/chat/`

## E2E Tests
- `tests/e2e/chat.spec.ts`

## Features

### 1. Basic Chat
**Status**: Complete

- 1-to-1 direct messaging
- Group conversations
- Message history with pagination
- Read receipts

### 2. Real-time Chat
**Status**: Complete

- WebSocket implementation via Socket.IO
- Typing indicators
- Online presence status
- Instant message delivery

### 3. Post-Linked Chats
**Status**: Complete

- Chats tied to specific postings
- Automatic group creation for posting discussions
- Context link back to original posting

### 4. Message Features
**Status**: Complete

- Edit sent messages
- Delete messages
- Emoji reactions
- Message timestamps

### 5. Chat-Post Integration
**Status**: In Progress

**Requirements**:
- Direct chat initiation from postings
- Context preservation showing posting reference
- Seamless navigation between chat and posting

**Acceptance Criteria**:
- [ ] "Message about this" button on postings
- [ ] Chat shows posting context/preview
- [ ] Click to navigate to original posting
- [ ] Posting author gets chat notification

## Architecture
- Socket.IO server for real-time events
- MySQL for message persistence
- Redis for presence/typing (future)
- JWT authentication for socket connections

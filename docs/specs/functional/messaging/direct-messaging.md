---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Direct Messaging

## Purpose
Enable private one-on-one conversations between alumni.

## User Flow
1. User clicks "Message" on another user's profile
2. Chat window opens
3. User types and sends messages
4. Messages delivered in real-time via Socket.IO
5. Read receipts displayed

## Acceptance Criteria
- ✅ Real-time message delivery
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message persistence
- ✅ Offline message queue
- ✅ Block user functionality

## Implementation
- **Route**: `POST /api/chat/messages`, `GET /api/chat/conversations`
- **File**: `routes/chat.js`
- **Socket.IO**: Message events
- **Frontend**: `src/components/ChatWindow.tsx`
- **Test**: `tests/e2e/chat.spec.ts`

## Related
- [Real-time Notifications](./real-time-notifications.md)
- [Message History](./message-history.md)

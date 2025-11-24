---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Real-time Notifications

## Purpose
Notify users immediately of new messages and chat events via Socket.IO.

## User Flow
1. User receives message while online
2. Socket.IO emits notification event
3. UI displays notification badge/toast
4. Sound/vibration alert (if enabled)
5. Notification clears when message read

## Acceptance Criteria
- ✅ Real-time WebSocket notifications
- ✅ Notification badges on chat icon
- ✅ Toast notifications for new messages
- ✅ Unread message counter
- ✅ Graceful fallback if WebSocket disconnected
- ✅ Notification persistence across page refresh

## Implementation
- **Socket.IO**: `message` and `notification` events
- **File**: Server Socket.IO handlers
- **Frontend**: `src/contexts/SocketContext.tsx`
- **Test**: `tests/e2e/chat.spec.ts`

## Related
- [Direct Messaging](./direct-messaging.md)
- [Group Chats](./group-chats.md)
- [Technical Spec: Event System](../../technical/integration/event-system.md)

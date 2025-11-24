---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Group Chats

## Purpose
Allow multiple users to communicate in shared chat rooms.

## User Flow
1. User creates new group chat
2. User selects participants
3. User names the group
4. Members can send messages to group
5. Messages visible to all members

## Acceptance Criteria
- ✅ Create group with multiple participants
- ✅ Add/remove members
- ✅ Group name and description
- ✅ Real-time message delivery to all members
- ✅ Leave group functionality
- ✅ Group admin controls
- ✅ Unique constraint on group chat members

## Implementation
- **Route**: `POST /api/chat/groups`, `GET /api/chat/groups/:id`
- **File**: `routes/chat.js`
- **Constraint**: `add-unique-group-chat-constraint.sql`
- **Socket.IO**: Room-based messaging
- **Frontend**: `src/components/GroupChat.tsx`
- **Test**: `tests/e2e/chat.spec.ts`

## Related
- [Direct Messaging](./direct-messaging.md)
- [Real-time Notifications](./real-time-notifications.md)

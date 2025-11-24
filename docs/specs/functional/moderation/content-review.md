---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Content Review

## Purpose
Allow moderators to review and approve/reject flagged content.

## User Flow
1. Moderator accesses moderation dashboard
2. System displays queue of flagged content
3. Moderator views content and context
4. Moderator takes action (approve, reject, edit, delete)
5. User notified of decision

## Acceptance Criteria
- ✅ Moderation queue with filters
- ✅ View flagged content with report details
- ✅ Moderator actions: approve, reject, edit, delete
- ✅ Add moderator notes
- ✅ Escalate to admin
- ✅ Audit trail of moderation decisions

## Implementation
- **Route**: Moderation admin routes
- **Table**: `content_moderation_queue`, `moderation_actions`
- **Frontend**: `src/components/admin/ModerationQueue.tsx`
- **Test**: Pending

## Related
- [Moderation Queue](./moderation-queue.md)
- [User Reporting](./user-reporting.md)

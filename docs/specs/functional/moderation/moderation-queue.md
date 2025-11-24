---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Moderation Queue

## Purpose
Centralized dashboard for moderators to manage flagged content.

## User Flow
1. Moderator logs into admin panel
2. Moderator views moderation queue
3. Queue displays flagged items with priority
4. Moderator filters by type, status, date
5. Moderator processes items in queue

## Acceptance Criteria
- ✅ Queue with sortable columns
- ✅ Filter by status (pending, reviewed, escalated)
- ✅ Priority flags for severe violations
- ✅ Batch actions for multiple items
- ✅ Search by user or content keyword
- ✅ Queue statistics dashboard

## Implementation
- **Route**: Admin moderation routes
- **Table**: `content_moderation_queue`
- **Frontend**: `src/components/admin/ModerationQueue.tsx`
- **Test**: Pending

## Related
- [Content Review](./content-review.md)
- [User Reporting](./user-reporting.md)
- [Admin: Moderation Oversight](../admin/moderation-oversight.md)

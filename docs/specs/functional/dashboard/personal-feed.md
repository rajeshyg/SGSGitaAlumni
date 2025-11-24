---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Personal Feed

## Purpose
Display personalized content feed with postings, updates, and activity.

## User Flow
1. User logs in and lands on dashboard
2. System displays personalized feed
3. Feed includes: postings, alumni updates, upcoming events
4. User scrolls to load more content
5. User interacts with feed items

## Acceptance Criteria
- ✅ Chronological feed with pagination
- ✅ Mix of posting types
- ✅ Filter by content type
- ✅ Pull-to-refresh functionality
- ✅ Lazy loading for performance
- ✅ Empty state for new users

## Implementation
- **Route**: `GET /api/dashboard/feed`
- **File**: `routes/dashboard.js`
- **Frontend**: `src/pages/Dashboard.tsx`, `src/components/Feed.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Postings: View Postings](../postings/view-postings.md)
- [Personalization](./personalization.md)

---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# View Postings

## Purpose
Display community postings in a feed with filtering and interaction options.

## User Flow
1. User views personalized feed on dashboard
2. User filters by posting type or tag
3. User clicks post to view full details
4. User can like, comment, or share post

## Acceptance Criteria
- ✅ Chronological feed with pagination
- ✅ Filter by type, tag, date range
- ✅ Post preview with expand option
- ✅ Like/unlike functionality
- ✅ Comment thread display
- ✅ Share to external platforms
- ✅ Expired posts auto-hidden

## Implementation
- **Route**: `GET /api/postings`, `GET /api/postings/:id`
- **File**: `routes/postings.js`
- **Frontend**: `src/components/PostingFeed.tsx`, `src/components/PostingCard.tsx`
- **Test**: `tests/e2e/posting.spec.ts`

## Related
- [Create Posting](./create-posting.md)
- [Dashboard: Personal Feed](../dashboard/personal-feed.md)

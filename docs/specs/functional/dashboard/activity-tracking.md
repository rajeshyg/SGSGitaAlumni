---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Activity Tracking

## Purpose
Track and display user engagement metrics and activity history.

## User Flow
1. User performs actions (post, message, profile view)
2. System logs activity
3. Dashboard displays activity summary
4. User views detailed activity history

## Acceptance Criteria
- ✅ Track user actions (posts created, messages sent, profile views)
- ✅ Display activity timeline
- ✅ Activity statistics (daily, weekly, monthly)
- ✅ Privacy controls for activity visibility
- ✅ Export activity data

## Implementation
- **Route**: `GET /api/dashboard/activity`
- **File**: `routes/dashboard.js`
- **Table**: `user_activity_log`
- **Frontend**: `src/components/ActivityTimeline.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Personal Feed](./personal-feed.md)

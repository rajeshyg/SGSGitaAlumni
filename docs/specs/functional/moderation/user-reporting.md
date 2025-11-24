---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# User Reporting

## Purpose
Enable users to report inappropriate content or behavior.

## User Flow
1. User views problematic content
2. User clicks "Report" button
3. User selects report reason (spam, harassment, etc.)
4. User adds optional comment
5. Report submitted to moderation queue

## Acceptance Criteria
- ✅ Report button on postings, messages, profiles
- ✅ Predefined report categories
- ✅ Optional text explanation
- ✅ Anonymous reporting
- ✅ Prevent duplicate reports
- ✅ User feedback on report status

## Implementation
- **Route**: `POST /api/postings/:id/flag`, `POST /api/users/:id/report`
- **File**: `routes/postings.js`
- **Table**: `user_reports`
- **Frontend**: `src/components/ReportModal.tsx`
- **Test**: Pending

## Related
- [Content Review](./content-review.md)
- [Moderation Queue](./moderation-queue.md)

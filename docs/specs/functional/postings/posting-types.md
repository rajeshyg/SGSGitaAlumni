---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Posting Types

## Purpose
Categorize posts by type to provide context and filtering options.

## User Flow
1. User selects posting type when creating post
2. Form fields adjust based on type
3. Type-specific validation applied
4. Users can filter feed by type

## Acceptance Criteria
- ✅ Job postings (title, company, location, salary range)
- ✅ Events (title, date, time, location)
- ✅ Announcements (title, description, priority)
- ✅ Questions (title, description, tags)
- ✅ General posts (title, description)
- ✅ Type-specific icons and styling
- ✅ Filter feed by posting type

## Implementation
- **Route**: `GET /api/postings?type=job`
- **File**: `routes/postings.js`
- **Column**: `postings.type` (ENUM)
- **Frontend**: `src/components/CreatePosting.tsx`
- **Test**: `tests/e2e/posting.spec.ts`

## Related
- [Create Posting](./create-posting.md)
- [View Postings](./view-postings.md)

---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Create Posting

## Purpose
Allow users to create and publish posts to share with the community.

## User Flow
1. User clicks "Create Post" button
2. User selects posting type (job, event, announcement, etc.)
3. User fills in form fields (title, description, details)
4. User adds tags
5. User sets expiry date (optional)
6. User publishes post

## Acceptance Criteria
- ✅ Multiple posting types (job, event, announcement, question, general)
- ✅ Rich text editor for description
- ✅ Tag autocomplete
- ✅ Optional expiry date
- ✅ Draft save functionality
- ✅ Input validation and sanitization

## Implementation
- **Route**: `POST /api/postings`
- **File**: `routes/postings.js`
- **Frontend**: `src/components/CreatePosting.tsx`
- **Test**: `tests/e2e/posting.spec.ts`

## Related
- [Posting Types](./posting-types.md)
- [Tagging System](./tagging-system.md)
- [Expiry Management](./expiry-management.md)

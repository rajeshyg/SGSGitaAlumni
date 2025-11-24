---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Tagging System

## Purpose
Categorize postings with tags for better discovery and filtering.

## User Flow
1. User types tag in tag input field
2. System suggests existing tags (autocomplete)
3. User selects existing tag or creates new one
4. Tags added to post
5. Users can browse posts by tag

## Acceptance Criteria
- ✅ Tag autocomplete from existing tags
- ✅ Maximum 10 tags per post
- ✅ Tag validation (alphanumeric, max 30 chars)
- ✅ Popular tags displayed
- ✅ Browse posts by tag
- ✅ Tag usage statistics

## Implementation
- **Route**: `GET /api/tags`, `POST /api/tags`, `GET /api/postings/tag/:tag`
- **File**: `routes/tags.js`, `routes/postings.js`
- **Table**: `tags`, `posting_tags`
- **Frontend**: `src/components/TagInput.tsx`
- **Test**: `tests/e2e/posting.spec.ts`

## Related
- [Create Posting](./create-posting.md)
- [View Postings](./view-postings.md)

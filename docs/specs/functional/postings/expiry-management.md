---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Expiry Management

## Purpose
Automatically manage posting lifecycle with expiration dates.

## User Flow
1. User sets expiry date when creating post (or uses default)
2. Post visible in feed until expiry
3. On expiry, post auto-archived
4. User can extend expiry or delete post

## Acceptance Criteria
- ✅ Default expiry: 30 days
- ✅ Minimum expiry: 1 day (enforced by database constraint)
- ✅ Maximum expiry: 365 days
- ✅ Expired posts hidden from main feed
- ✅ User can view own expired posts
- ✅ Extend expiry option for active posts
- ✅ Automated cleanup job

## Implementation
- **Route**: `PUT /api/postings/:id/expiry`
- **File**: `routes/postings.js`
- **Table**: `postings` (expires_at column)
- **Constraint**: `add-posting-expiry-minimum-constraint.sql`
- **Test**: `tests/e2e/posting.spec.ts`

## Related
- [Create Posting](./create-posting.md)
- [View Postings](./view-postings.md)

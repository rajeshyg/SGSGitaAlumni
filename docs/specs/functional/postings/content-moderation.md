---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Content Moderation

## Purpose
Review and moderate postings to ensure community standards compliance.

## User Flow
1. User creates post
2. Post auto-scanned for policy violations
3. If flagged, post held for review
4. Moderator reviews and approves/rejects
5. User notified of decision

## Acceptance Criteria
- ✅ Automated keyword filtering
- ✅ User reporting mechanism
- ✅ Moderation queue for flagged content
- ✅ Moderator actions: approve, reject, edit
- ✅ Appeal process for rejected posts
- ✅ Audit trail for moderation actions

## Implementation
- **Route**: `POST /api/postings/:id/flag`, moderation endpoints in admin routes
- **File**: `routes/postings.js`
- **Table**: `content_moderation_queue`
- **Test**: Pending

## Related
- [Create Posting](./create-posting.md)
- [Moderation: Content Review](../moderation/content-review.md)

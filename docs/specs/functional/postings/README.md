---
version: "1.0"
status: implemented
last_updated: 2025-11-23
module: postings
---

# Postings Module

Create, view, and manage community postings with tagging and moderation.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [Create Posting](./create-posting.md) | Implemented | `tests/e2e/posting.spec.ts` | `routes/postings.js` |
| [View Postings](./view-postings.md) | Implemented | `tests/e2e/posting.spec.ts` | `routes/postings.js` |
| [Expiry Management](./expiry-management.md) | Implemented | `tests/e2e/posting.spec.ts` | `routes/postings.js` |
| [Tagging System](./tagging-system.md) | Implemented | `tests/e2e/posting.spec.ts` | `routes/tags.js` |
| [Content Moderation](./content-moderation.md) | Implemented | Pending | `routes/postings.js` |
| [Posting Types](./posting-types.md) | Implemented | `tests/e2e/posting.spec.ts` | `routes/postings.js` |

## Technical Reference

See [Technical Specs: Database/Content Management](../../technical/database/content-management.md) for schema.

## Key User Flows

1. **Create Post**: Dashboard → New Post → Select type → Add content → Add tags → Set expiry → Publish
2. **View Feed**: Dashboard → Feed → Filter by type/tag → Click post → View details → Interact

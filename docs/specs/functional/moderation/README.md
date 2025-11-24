---
version: "1.0"
status: implemented
last_updated: 2025-11-23
module: moderation
---

# Moderation Module

Content moderation system with automated and manual review processes.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [Content Review](./content-review.md) | Implemented | Pending | Moderation routes |
| [User Reporting](./user-reporting.md) | Implemented | Pending | `routes/postings.js` |
| [Auto Moderation](./auto-moderation.md) | Implemented | Pending | Moderation service |
| [Moderation Queue](./moderation-queue.md) | Implemented | Pending | Admin moderation panel |

## Technical Reference

See [Technical Specs: Security/Input Validation](../../technical/security/input-validation.md) for content filtering.

## Key User Flows

1. **Report Content**: View post → Report button → Select reason → Submit
2. **Moderate Content**: Admin panel → Moderation queue → Review → Approve/reject

---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Auto Moderation

## Purpose
Automatically flag or block content violating community guidelines using keyword filtering.

## User Flow
1. User submits content (post, message, comment)
2. System scans for policy violations
3. If violation detected, content auto-flagged or blocked
4. User notified if content rejected
5. Content added to moderation queue if uncertain

## Acceptance Criteria
- ✅ Keyword-based filtering
- ✅ Profanity detection
- ✅ Spam detection patterns
- ✅ Configurable sensitivity levels
- ✅ False positive handling (appeal)
- ✅ Immediate block for severe violations

## Implementation
- **Service**: Moderation service with keyword lists
- **Table**: `moderation_rules`, `blocked_keywords`
- **Test**: Pending

## Related
- [Content Review](./content-review.md)
- [Moderation Queue](./moderation-queue.md)
- [Technical Spec: Input Validation](../../technical/security/input-validation.md)

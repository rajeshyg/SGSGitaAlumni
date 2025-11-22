# Content Moderation - Functional Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
recommended_model: sonnet
implementation_links:
  - routes/moderation.js
  - server/services/moderationService.js
---
```

## Goal
Ensure community content quality through a review workflow with moderator tools and admin oversight.

## Features

### 1. Content Moderation
**Status**: Complete

- Posting approval/rejection workflow
- Moderation reasons and feedback
- Status tracking (pending/approved/rejected)
- Resubmission capability

### 2. Moderator Review System
**Status**: Complete

- Posting review queue
- Bulk actions
- Moderation history
- Performance metrics

### 3. Admin Tools
**Status**: Complete

- User management (activate/deactivate)
- Content oversight
- Moderator assignment
- System configuration

### 4. Moderation Workflow

1. User submits posting → Status: Pending
2. Moderator reviews → Approve/Reject with reason
3. User notified of decision
4. If rejected, user can edit and resubmit
5. Approved postings appear in feeds

### 5. Reporting System
**Status**: Pending (Future)

- Report inappropriate content
- Report queue for moderators
- Escalation to admins

## API Endpoints
- `GET /api/moderation/queue` - Pending items
- `POST /api/moderation/:id/approve` - Approve
- `POST /api/moderation/:id/reject` - Reject with reason
- `GET /api/admin/users` - User management

## Workflow
1. **Scout**: Identify related files and patterns
2. **Plan**: Design implementation approach
3. **Build**: Implement with tests
4. **Validate**: Run E2E tests and verify

## Dependencies
- Authentication context required for all protected features
- Database connection pool from `server/config/database.js`

## Report
After implementation, document:
- Files modified
- Tests added/updated
- Any deviations from spec

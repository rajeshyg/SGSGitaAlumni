# Content Moderation - Functional Specification

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

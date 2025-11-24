# Dashboard - Functional Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
recommended_model: sonnet
implementation_links:
  - routes/dashboard.js
  - routes/feed.js
---
```

## Goal
Provide a personalized home experience with relevant content, quick actions, and role-based features.

## Code References
- **Backend Routes**: `routes/dashboard.js`, `routes/feed.js`
- **Frontend**: `src/pages/Dashboard.tsx`, `src/pages/MemberDashboard.tsx`
- **Components**: `src/components/dashboard/`

## E2E Tests
- `tests/e2e/dashboard.spec.ts`

## Features

### 1. Member Dashboard
**Status**: Complete

- Role-based feature display (Member/Moderator/Admin)
- Quick action links
- Recent activity summary
- Pending items indicator

### 2. Feed Integration
**Status**: Complete

- Real-time personalized content feed
- Postings matching user preferences
- Recent community activity
- Infinite scroll pagination

### 3. Dashboard Widgets
**Status**: Complete

- My postings summary
- Unread messages count
- Pending approvals (moderators)
- Quick search

### 4. Role-Specific Features

**Member Dashboard**:
- My postings
- Saved/bookmarked items
- Messages
- Profile completion %

**Moderator Dashboard**:
- Pending review queue
- Moderation statistics
- Recent approvals/rejections

**Admin Dashboard**:
- User management shortcuts
- System metrics
- Configuration access

## API Endpoints
- `GET /api/dashboard` - Personalized dashboard data
- `GET /api/feed` - Personalized feed items

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

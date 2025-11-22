# Postings System - Functional Specification

```yaml
---
version: 1.0
status: in-progress
last_updated: 2025-11-22
recommended_model: sonnet
implementation_links:
  - routes/postings.js
  - routes/moderation.js
  - server/services/postingService.js
---
```

## Goal
Enable alumni to create, share, and engage with various types of community postings including jobs, mentorship opportunities, events, and resources.

## Code References
- **Backend Routes**: `routes/postings.js`, `routes/moderation.js`
- **Services**: `server/services/postingService.js`
- **Frontend**: `src/pages/Postings.tsx`, `src/pages/CreatePosting.tsx`
- **Components**: `src/components/postings/`

## E2E Tests
- `tests/e2e/postings.spec.ts`

## Features

### 1. Job Postings
**Status**: Complete

- Create, edit, delete postings
- Posting types: Job, Mentorship, Event, Resource
- Rich text content with formatting
- Moderation workflow for approval

### 2. Domain Taxonomy
**Status**: In Progress

**Requirements**:
- Assign Domain, Sub-Domain, Area to postings
- Hierarchical selection UI
- Search/filter by taxonomy
- Admin management of taxonomy

**Acceptance Criteria**:
- [ ] Posting form includes taxonomy fields
- [ ] Cascading dropdowns for hierarchy
- [ ] Taxonomy values stored with posting
- [ ] Filter postings by taxonomy

### 3. Posting Engagement
**Status**: In Progress

**Requirements**:
- Like/reaction system
- Comment threads
- Share functionality
- View/engagement analytics

**Pending Work**:
- Nested comment replies
- Engagement notifications

### 4. Posting Expiry Logic
**Status**: In Progress (High Priority)

**Requirement**:
- Expiry = MAX(user_specified_date, submission_date + 30 days)
- Visual indicator for expiring soon
- Auto-archive expired postings

**Acceptance Criteria**:
- [ ] Expiry calculated correctly on creation
- [ ] Expired postings hidden from active feeds
- [ ] Users notified before expiry
- [ ] Option to extend expiry

### 5. Chat Integration with Posts
**Status**: In Progress

**Requirements**:
- "Chat about this" button on postings
- Context preserved in chat
- Group chats for popular postings

## API Endpoints
- `GET /api/postings` - List with filters
- `POST /api/postings` - Create new
- `PUT /api/postings/:id` - Update
- `DELETE /api/postings/:id` - Delete
- `POST /api/postings/:id/like` - Toggle like
- `GET /api/postings/:id/comments` - Get comments

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

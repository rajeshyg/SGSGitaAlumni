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

## Implementation Workflow

This feature follows the Scout-Plan-Build workflow documented in `/docs/spec_driven_coding_guide.md`.

### Workflow Documentation
- **Scout Report**: `docs/specs/workflows/postings/scout.md`
  - Discovery of 20+ related files across backend/frontend
  - Current implementation state and gaps analysis
  - API endpoint inventory (implemented, partial, missing)
  - Architecture flows and integration points
  - Risks and recommendations
  
- **Implementation Plan**: `docs/specs/workflows/postings/plan.md`
  - 5-phase implementation strategy with priorities
  - **Phase 1 (CRITICAL)**: Posting expiry logic - MVP blocker
  - **Phase 2 (HIGH)**: Domain taxonomy integration
  - **Phase 3-5 (MEDIUM-LOW)**: Enhanced comments, chat, notifications
  - Database migration plans with rollback scripts
  - Comprehensive testing strategy
  - Rollout plan with risk mitigations
  
- **Task Breakdown**: `docs/specs/workflows/postings/tasks.md`
  - 15 detailed, actionable tasks
  - Task dependencies and complexity estimates
  - Acceptance criteria and testing requirements
  - Implementation order by sprint (4 sprints)

### Dependencies
- Authentication context required for all protected features
- Database connection pool from `server/config/database.js`
- Moderation system for posting approval workflow
- Chat feature for integration (Phase 4)
- Notification system for engagement alerts (Phase 5)

## Implementation Progress

### Completed
- ✅ Basic posting CRUD operations
- ✅ Posting types (Job, Mentorship, Event, Resource)
- ✅ Rich text content support
- ✅ Moderation workflow
- ✅ Like/reaction system

### In Progress (HIGH Priority - See workflows/postings/tasks.md)
- 🔄 **Expiry logic implementation** (Tasks 1-7, Sprint 1)
  - Task 1: Expiry calculation function
  - Task 2: Integration in endpoints
  - Task 3: Database migration
  - Task 4: Auto-archive cron job
  - Task 5-7: UI for expiry display and extension
  
- 🔄 **Domain taxonomy integration** (Tasks 8-13, Sprint 2)
  - Task 8: Taxonomy API endpoints
  - Task 9: Hierarchical selector component
  - Task 10-13: Integration, validation, filtering

### Pending
- ⏳ Nested comment replies (Sprint 3)
- ⏳ Chat integration button (Phase 4)
- ⏳ Engagement notifications (Phase 5)
- ⏳ Advanced analytics
- ⏳ Bookmark/save functionality

## Critical Path to MVP
1. **Expiry Logic** (Sprint 1) - Must complete for MVP
   - Business rule: expiry = MAX(user_date, created_at + 30 days)
   - Auto-archive expired postings daily
   - UI indicators for expiring soon
   - Extend expiry functionality

2. **Taxonomy Integration** (Sprint 2) - High priority for user experience
   - Hierarchical domain/sub-domain/area selection
   - Posting matching based on taxonomy
   - Filter feed by taxonomy

## Report
After implementation, document:
- Files modified
- Tests added/updated
- Any deviations from spec
- Update task status in workflows/postings/tasks.md
- Note any architectural decisions made

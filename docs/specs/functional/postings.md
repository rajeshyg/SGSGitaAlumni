# Postings System - Functional Specification

## Goal
Enable alumni to create, share, and engage with various types of community postings including jobs, mentorship opportunities, events, and resources.

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

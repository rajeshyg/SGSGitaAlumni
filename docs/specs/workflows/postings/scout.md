# Postings System - Scout Report

**Date**: 2025-11-23  
**Feature**: Postings System  
**Status**: In Progress  
**Scout Model**: Haiku/Fast Analysis  

## Discovery Summary

### Related Files Identified

#### Backend Routes
- `routes/postings.js` - Main posting CRUD operations
- `routes/moderation.js` - Content moderation workflows
- `routes/comments.js` (if exists) - Comment management

#### Services
- `server/services/postingService.js` - Business logic for postings
- `server/services/moderationService.js` - Moderation logic
- `server/services/taxonomyService.js` (if exists) - Domain taxonomy

#### Frontend Components
- `src/pages/Postings.tsx` - Postings list/feed page
- `src/pages/CreatePosting.tsx` - Posting creation form
- `src/pages/PostingDetail.tsx` - Single posting view
- `src/components/postings/` - Posting-related components
- `src/components/postings/PostingCard.tsx`
- `src/components/postings/PostingFilters.tsx`

#### Database Schema
- `postings` table - Core posting data
- `posting_types` table - Job, Mentorship, Event, Resource
- `domains`, `sub_domains`, `areas` tables - Taxonomy
- `posting_likes` table - Like/reaction data
- `posting_comments` table - Comment threads
- `moderation_queue` table - Pending approvals

#### Tests
- `tests/e2e/postings.spec.ts` - E2E tests for postings

### Current Implementation State

#### Completed Features
- ✅ Basic posting CRUD (create, read, update, delete)
- ✅ Posting types (Job, Mentorship, Event, Resource)
- ✅ Rich text content support
- ✅ Moderation workflow for approval
- ✅ Basic filtering by type

#### In-Progress Features
- 🔄 Domain Taxonomy Assignment
  - Backend API partially implemented
  - Frontend selection UI incomplete
  - Hierarchical cascading dropdowns needed
  
- 🔄 Posting Engagement
  - Like functionality implemented
  - Comment system partial
  - Nested replies pending
  - Engagement notifications not implemented
  
- 🔄 Posting Expiry Logic (High Priority)
  - Requirement: expiry = MAX(user_date, submission_date + 30)
  - Current: Basic expiry date field exists
  - Missing: Expiry calculation logic
  - Missing: Auto-archive expired postings
  - Missing: Expiring soon indicators

- 🔄 Chat Integration
  - "Chat about this" button concept
  - Backend integration not implemented
  - Context passing to chat not implemented

#### Pending Features
- ⏳ Advanced filtering (by taxonomy, date range)
- ⏳ Posting analytics (views, clicks, engagement)
- ⏳ Share functionality
- ⏳ Bookmark/save postings
- ⏳ Posting notifications to matched users

### Architecture Analysis

#### Posting Creation Flow
```
1. User navigates to Create Posting page
2. Selects posting type (Job/Mentorship/Event/Resource)
3. Fills in form:
   - Title, description
   - Domain, Sub-domain, Area (hierarchical)
   - Expiry date (optional)
   - Additional type-specific fields
4. Client-side validation
5. POST /api/postings with data
6. Backend validates, calculates expiry
7. Posting created with status 'pending'
8. Enters moderation queue
9. Moderator approves/rejects
10. Status changes to 'active'
11. Appears in feeds
```

#### Expiry Logic (To Be Implemented)
```
Calculation:
- User provides optional expiry_date
- Server calculates:
  IF user_expiry_date exists:
    expiry = MAX(user_expiry_date, created_at + 30 days)
  ELSE:
    expiry = created_at + 30 days
    
Auto-Archive Process:
- Cron job runs daily
- SELECT postings WHERE expiry < NOW() AND status = 'active'
- UPDATE status = 'expired'
- Send notifications to posting authors
```

#### Taxonomy Hierarchy Flow
```
Domain Selection:
1. Load all domains from /api/taxonomy/domains
2. User selects domain
3. Load sub-domains: /api/taxonomy/sub-domains?domain_id=X
4. User selects sub-domain
5. Load areas: /api/taxonomy/areas?sub_domain_id=Y
6. User selects area
7. All three IDs sent with posting
```

### Integration Points

#### Dependencies
- **Authentication**: JWT required for creating/editing postings
- **Authorization**: Role-based (Member can create, Moderator can approve)
- **Moderation**: All new postings go through moderation
- **User Preferences**: Feed matches postings to user interests
- **Messaging**: Chat integration for posting discussions

#### Related Features
- Dashboard displays recent postings
- Directory search can include postings
- Notifications for posting status changes
- User profile shows posted content

### Technical Considerations

#### Database Constraints
- Posting title: VARCHAR(200), required
- Description: TEXT, required
- Expiry date: DATETIME, calculated server-side
- Domain/Sub-domain/Area: Foreign keys, required
- Status: ENUM('pending', 'active', 'expired', 'rejected')

#### Performance
- Index on expiry date for efficient queries
- Index on status for filtering active postings
- Index on taxonomy IDs for matching
- Pagination for feed (20 per page)
- Cache active postings count

#### Security
- Validate posting ownership for edit/delete
- Sanitize all text inputs (XSS prevention)
- Rate limit posting creation (max 5 per day)
- Prevent spam/abuse in content
- Moderator approval before publishing

### Risks and Challenges

1. **Expiry Logic Complexity**
   - Risk: Business rule not implemented correctly
   - Impact: Postings expire prematurely or too late
   - Priority: HIGH - affects user experience
   - Mitigation: Clear specification, comprehensive tests

2. **Taxonomy User Experience**
   - Risk: Hierarchical selection confusing
   - Impact: Users select wrong taxonomy, poor matching
   - Mitigation: Clear UI, tooltips, examples

3. **Comment Threading**
   - Risk: Nested replies complex to implement
   - Impact: User engagement limited
   - Mitigation: Start with flat comments, iterate to nested

4. **Moderation Scalability**
   - Risk: Manual moderation bottleneck as platform grows
   - Impact: Delays in posting publication
   - Mitigation: Auto-approval for trusted users, ML-assisted moderation

5. **Chat Integration**
   - Risk: Tight coupling between postings and chat
   - Impact: Changes to one affect the other
   - Mitigation: Well-defined API contract, loose coupling

### Recommendations

#### Priority 1 (HIGH - Complete for MVP)
1. Implement expiry calculation logic (server-side)
2. Add expiry date display and "expiring soon" indicator
3. Create cron job for auto-archiving expired postings
4. Complete taxonomy selection UI with cascading dropdowns

#### Priority 2 (MEDIUM - Shortly after MVP)
1. Enhance comment system with nested replies
2. Implement chat integration button
3. Add engagement notifications
4. Advanced filtering by taxonomy

#### Priority 3 (LOW - Future enhancements)
1. Posting analytics dashboard
2. Share functionality
3. Bookmark/save postings
4. Recommended postings algorithm

### Files to Monitor
- `routes/postings.js` - Core posting endpoints
- `server/services/postingService.js` - Business logic
- `src/pages/CreatePosting.tsx` - Creation form
- `src/pages/Postings.tsx` - Feed display
- Database schema for postings table
- Cron job scripts for expiry handling

### API Endpoints Status

#### Implemented
- ✅ `GET /api/postings` - List postings with filters
- ✅ `POST /api/postings` - Create new posting
- ✅ `GET /api/postings/:id` - Get single posting
- ✅ `PUT /api/postings/:id` - Update posting
- ✅ `DELETE /api/postings/:id` - Delete posting
- ✅ `POST /api/postings/:id/like` - Toggle like

#### Partial
- 🔄 `GET /api/postings/:id/comments` - Get comments (basic)
- 🔄 `POST /api/postings/:id/comments` - Add comment (flat)

#### Missing
- ⏳ `POST /api/postings/:id/chat` - Start chat about posting
- ⏳ `GET /api/taxonomy/domains` - Get all domains
- ⏳ `GET /api/taxonomy/sub-domains` - Get sub-domains
- ⏳ `GET /api/taxonomy/areas` - Get areas
- ⏳ `POST /api/postings/:id/comments/:commentId/reply` - Nested reply

### Next Steps
1. Review scout findings with team
2. Prioritize features (expiry logic first)
3. Create detailed implementation plan
4. Break down into tasks
5. Begin build phase with tests

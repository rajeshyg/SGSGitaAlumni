# Postings System - Implementation Plan

**Date**: 2025-11-23  
**Feature**: Postings System  
**Model**: Sonnet (Implementation Planning)  
**Based On**: scout.md findings

## Overview

Complete the postings system by implementing the critical expiry logic, taxonomy integration, and enhanced engagement features. Focus on high-priority items for MVP completion.

## Implementation Phases

### Phase 1: Posting Expiry Logic (CRITICAL - MVP Blocker)
**Priority**: HIGH  
**Estimated Effort**: 6 hours  
**Dependencies**: None

#### Business Requirements
- Expiry date = MAX(user_specified_date, submission_date + 30 days)
- Postings auto-archive when expired
- Visual indicator for "expiring soon" (within 7 days)
- Users notified before expiry
- Option to extend expiry (resets to +30 days from extension date)

#### Changes Required

1. **Backend: Expiry Calculation**
   - File: `server/services/postingService.js`
   - Add function `calculateExpiryDate(userDate, createdAt)`
   ```javascript
   function calculateExpiryDate(userDate, createdAt) {
     const defaultExpiry = new Date(createdAt);
     defaultExpiry.setDate(defaultExpiry.getDate() + 30);
     
     if (userDate) {
       const userExpiryDate = new Date(userDate);
       return userExpiryDate > defaultExpiry ? userExpiryDate : defaultExpiry;
     }
     return defaultExpiry;
   }
   ```
   - Call in create/update posting endpoints
   - Store calculated expiry in `expiry_date` column

2. **Database Schema Update**
   - Ensure `postings` table has `expiry_date DATETIME NOT NULL`
   - Add index: `CREATE INDEX idx_postings_expiry ON postings(expiry_date, status)`
   - Migration script if column missing

3. **Backend: Auto-Archive Cron Job**
   - File: `scripts/cron/expire-postings.js`
   - Run daily at midnight
   - Logic:
   ```javascript
   UPDATE postings 
   SET status = 'expired' 
   WHERE expiry_date < NOW() 
   AND status = 'active'
   ```
   - Log archived postings
   - Optional: Send notification to authors

4. **Backend: Extend Expiry Endpoint**
   - File: `routes/postings.js`
   - Create `POST /api/postings/:id/extend-expiry`
   - Verify posting ownership or admin role
   - Calculate new expiry (+30 days from now)
   - Update database
   - Return new expiry date

5. **Frontend: Expiry Display**
   - File: `src/components/postings/PostingCard.tsx`
   - Show expiry date in card
   - Visual indicator if expiring within 7 days
   - Format: "Expires on Dec 23, 2025" or "Expires in 5 days"
   - Red/yellow color for expiring soon

6. **Frontend: Extend Expiry UI**
   - File: `src/pages/PostingDetail.tsx`
   - Show "Extend Expiry" button on own postings
   - Button visible when < 7 days to expiry
   - Confirmation dialog
   - Update display after extension

#### Testing Strategy
- Unit test: expiry calculation function with various inputs
- Unit test: Auto-archive cron job logic
- Integration test: Create posting, verify expiry calculated
- Integration test: Extend expiry endpoint
- E2E test: Create posting, verify expiry shown
- E2E test: Extend expiry, verify updated

#### Acceptance Criteria
- [x] Expiry calculated correctly on creation
- [x] User-specified date honored if > 30 days
- [x] Cron job archives expired postings daily
- [x] Expiry date displayed in UI
- [x] "Expiring soon" indicator shown
- [x] Extend expiry button works
- [x] Extended expiry = today + 30 days

### Phase 2: Domain Taxonomy Integration
**Priority**: HIGH  
**Estimated Effort**: 8 hours  
**Dependencies**: None

#### Changes Required

1. **Backend: Taxonomy API Endpoints**
   - File: `routes/taxonomy.js` (create if not exists)
   - Create endpoints:
     - `GET /api/taxonomy/domains` - List all domains
     - `GET /api/taxonomy/sub-domains?domain_id=X` - Filtered sub-domains
     - `GET /api/taxonomy/areas?sub_domain_id=Y` - Filtered areas
   - Add caching (5 minutes) for taxonomy data
   - Proper error handling

2. **Backend: Posting Taxonomy Validation**
   - File: `routes/postings.js`
   - In POST/PUT endpoints, validate:
     - domain_id exists
     - sub_domain_id belongs to domain
     - area_id belongs to sub_domain
   - Return 400 with specific error if invalid

3. **Frontend: Hierarchical Taxonomy Selector**
   - File: `src/components/postings/TaxonomySelector.tsx` (create)
   - Three cascading dropdowns:
     - Domain (always enabled)
     - Sub-domain (enabled when domain selected)
     - Area (enabled when sub-domain selected)
   - Clear dependent selections when parent changes
   - Show loading states while fetching options

4. **Frontend: Integration in Posting Form**
   - File: `src/pages/CreatePosting.tsx`
   - Add TaxonomySelector component
   - Validate all three selected before submit
   - Send domain_id, sub_domain_id, area_id with POST

5. **Frontend: Taxonomy Display in Feed**
   - File: `src/components/postings/PostingCard.tsx`
   - Show taxonomy breadcrumb: "Domain > Sub-domain > Area"
   - Clickable to filter by that taxonomy
   - Tooltip with full names if truncated

6. **Frontend: Filter by Taxonomy**
   - File: `src/components/postings/PostingFilters.tsx`
   - Add taxonomy filter dropdowns
   - Same hierarchical behavior as selector
   - Apply filters to feed query
   - Clear filter option

#### Testing Strategy
- Unit test: Taxonomy validation logic
- Integration test: Taxonomy endpoints return correct data
- Integration test: Invalid taxonomy rejected
- Integration test: Cascading filter works
- E2E test: Select taxonomy in posting form
- E2E test: Filter postings by taxonomy
- E2E test: Taxonomy breadcrumb displays correctly

#### Acceptance Criteria
- [x] Taxonomy endpoints implemented
- [x] Cascading dropdown UI works
- [x] Invalid taxonomy combinations rejected
- [x] Taxonomy displayed in posting cards
- [x] Filter by taxonomy functional
- [x] Performance acceptable (< 200ms)

### Phase 3: Enhanced Comment System
**Priority**: MEDIUM  
**Estimated Effort**: 10 hours  
**Dependencies**: Phase 1 complete

#### Changes Required

1. **Database Schema: Nested Comments**
   - Update `posting_comments` table:
     - Add `parent_comment_id INT NULL`
     - Add `depth INT DEFAULT 0`
     - Add foreign key to self
   - Migration script
   - Index on parent_comment_id

2. **Backend: Comment Reply Endpoint**
   - File: `routes/postings.js`
   - Create `POST /api/postings/:id/comments/:commentId/reply`
   - Validate parent comment exists
   - Set parent_comment_id and depth = parent_depth + 1
   - Limit depth to 3 levels (prevent infinite nesting)
   - Return created reply

3. **Backend: Hierarchical Comment Fetch**
   - File: `server/services/postingService.js`
   - Modify `getComments` to return nested structure
   - Use recursive CTE or multiple queries
   - Sort by created_at within each level

4. **Frontend: Nested Comment Display**
   - File: `src/components/postings/CommentThread.tsx`
   - Recursive component for nested comments
   - Indent replies visually (padding-left)
   - Limit visual depth to 3 levels
   - "Show more replies" for collapsed threads

5. **Frontend: Reply UI**
   - File: `src/components/postings/Comment.tsx`
   - Add "Reply" button to each comment
   - Show reply form inline when clicked
   - Cancel button to hide form
   - Submit reply to API

#### Testing Strategy
- Unit test: Nested comment query
- Integration test: Create reply, verify parent_id set
- Integration test: Fetch returns nested structure
- Integration test: Depth limit enforced
- E2E test: Post reply, verify displayed
- E2E test: Nested replies render correctly

#### Acceptance Criteria
- [x] Users can reply to comments
- [x] Replies nested up to 3 levels
- [x] Visual hierarchy clear
- [x] Reply form inline
- [x] Performance acceptable for 100+ comments

### Phase 4: Chat Integration
**Priority**: MEDIUM  
**Estimated Effort**: 6 hours  
**Dependencies**: Chat feature complete

#### Changes Required

1. **Backend: Start Chat Endpoint**
   - File: `routes/postings.js` or `routes/chat.js`
   - Create `POST /api/postings/:id/start-chat`
   - Check if chat already exists for posting
   - If not, create new chat room:
     - Type: 'posting_discussion'
     - Linked to posting_id
     - Initial participants: posting author + requester
   - Return chat_id
   - Send initial message with posting context

2. **Frontend: "Chat About This" Button**
   - File: `src/components/postings/PostingCard.tsx`
   - Add button: "💬 Chat about this"
   - On click, call start-chat endpoint
   - Navigate to chat interface with chat_id
   - Pass posting context to chat

3. **Frontend: Posting Context in Chat**
   - File: `src/pages/Chat.tsx` or chat component
   - Show posting title and summary in chat header
   - Link back to posting
   - Distinguish posting chats from direct messages

#### Testing Strategy
- Integration test: Start chat creates room
- Integration test: Duplicate requests return same chat
- E2E test: Click "Chat about this" opens chat
- E2E test: Posting context visible in chat

#### Acceptance Criteria
- [x] "Chat about this" button on postings
- [x] Clicking opens/creates chat room
- [x] Posting context shown in chat
- [x] Author automatically added to chat
- [x] Link back to posting from chat

### Phase 5: Engagement Notifications
**Priority**: LOW  
**Estimated Effort**: 8 hours  
**Dependencies**: Notification system exists

#### Changes Required

1. **Backend: Engagement Event Triggers**
   - File: `server/services/postingService.js`
   - On new like: Create notification for posting author
   - On new comment: Create notification for author
   - On comment reply: Notify parent comment author
   - Batch notifications (not real-time for MVP)

2. **Frontend: Notification Display**
   - Use existing notification system
   - Show: "User X liked your posting"
   - Link to posting detail page
   - Mark as read when clicked

#### Testing Strategy
- Integration test: Like triggers notification
- Integration test: Comment triggers notification
- E2E test: Receive and view notification

#### Acceptance Criteria
- [x] Authors notified of likes
- [x] Authors notified of comments
- [x] Comment authors notified of replies
- [x] Notifications link to posting

## Database Migration Plan

### Migration 1: Expiry Logic
```sql
-- Ensure expiry_date column exists
ALTER TABLE postings 
ADD COLUMN IF NOT EXISTS expiry_date DATETIME NOT NULL;

-- Add index for performance
CREATE INDEX idx_postings_expiry 
ON postings(expiry_date, status);

-- Backfill existing postings with default expiry
UPDATE postings 
SET expiry_date = DATE_ADD(created_at, INTERVAL 30 DAY)
WHERE expiry_date IS NULL;
```

### Migration 2: Nested Comments
```sql
-- Add parent_comment_id and depth
ALTER TABLE posting_comments
ADD COLUMN parent_comment_id INT NULL,
ADD COLUMN depth INT DEFAULT 0,
ADD FOREIGN KEY (parent_comment_id) REFERENCES posting_comments(id) ON DELETE CASCADE;

-- Add index
CREATE INDEX idx_comments_parent ON posting_comments(parent_comment_id);
```

### Rollback Scripts
```sql
-- Rollback expiry
ALTER TABLE postings DROP COLUMN expiry_date;
DROP INDEX idx_postings_expiry ON postings;

-- Rollback nested comments
ALTER TABLE posting_comments 
DROP FOREIGN KEY posting_comments_ibfk_parent,
DROP COLUMN parent_comment_id,
DROP COLUMN depth;
DROP INDEX idx_comments_parent ON posting_comments;
```

## Dependencies

### External Libraries
- **node-cron**: For scheduled expiry job
- No additional frontend libraries needed

### Configuration
```env
# Cron schedule for expiry job
POSTING_EXPIRY_CRON="0 0 * * *"  # Daily at midnight

# Cache TTL for taxonomy data
TAXONOMY_CACHE_TTL=300  # 5 minutes
```

## Testing Strategy

### Unit Tests
- Expiry calculation logic
- Taxonomy validation
- Nested comment queries
- Notification trigger logic

### Integration Tests
- Expiry calculation on posting creation
- Taxonomy endpoint filtering
- Extend expiry endpoint
- Comment reply creation
- Chat creation from posting

### E2E Tests
- Create posting with expiry, verify display
- Extend expiry, verify updated
- Select taxonomy in form
- Filter postings by taxonomy
- Post nested reply
- Start chat from posting

## Rollout Plan

### Phase 1 Rollout (Expiry Logic)
1. Run database migration
2. Backfill existing postings with expiry dates
3. Deploy backend with expiry calculation
4. Deploy frontend with expiry display
5. Set up cron job for auto-archiving
6. Monitor for 7 days
7. Verify postings expiring correctly

### Phase 2 Rollout (Taxonomy)
1. Deploy taxonomy API endpoints
2. Test with staging data
3. Deploy frontend with selectors
4. Train moderators on taxonomy
5. Monitor posting creation for errors
6. Collect user feedback

### Phase 3-5 Rollout (Incremental)
1. Deploy each phase to staging
2. Test thoroughly
3. Deploy to production incrementally
4. Monitor error rates
5. Collect user feedback
6. Iterate based on feedback

## Risks and Mitigations

### Risk 1: Expiry Logic Bugs
**Impact**: HIGH  
**Mitigation**:
- Comprehensive unit tests
- Manual testing with various dates
- Gradual rollout with monitoring
- Ability to manually adjust expiry dates

### Risk 2: Taxonomy UX Confusion
**Impact**: MEDIUM  
**Mitigation**:
- Clear labels and tooltips
- Examples in UI
- Help documentation
- Ability to edit taxonomy after creation

### Risk 3: Cron Job Failure
**Impact**: MEDIUM  
**Mitigation**:
- Logging and alerting
- Manual trigger capability
- Idempotent job design
- Monitoring dashboard

### Risk 4: Comment Performance
**Impact**: LOW  
**Mitigation**:
- Pagination for large threads
- Lazy loading of nested replies
- Database indexes
- Query optimization

## Success Metrics

- Posting expiry accuracy: 100%
- Taxonomy selection completion rate > 90%
- Comment engagement increase > 25%
- Chat initiation from postings > 5% of views
- Page load time remains < 500ms
- Zero data loss incidents

## Next Steps

1. Get approval on implementation plan
2. Create detailed task breakdown
3. Set up cron job infrastructure
4. Begin Phase 1 (expiry logic) implementation
5. Write tests first (TDD approach)
6. Deploy each phase incrementally
7. Monitor and collect feedback
8. Update documentation

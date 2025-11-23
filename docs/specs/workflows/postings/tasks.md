# Postings System - Task Breakdown

**Feature**: Postings System  
**Based On**: plan.md  
**Last Updated**: 2025-11-23

---

## Task 1: Implement Expiry Calculation Logic (Backend)
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Medium  
**Phase**: 1 (CRITICAL)

### Objective
Create server-side expiry date calculation function that implements business rule: expiry = MAX(user_date, submission_date + 30 days).

### Context
- File to create: `server/services/postingService.js` (or enhance existing)
- Business rule: Always minimum 30 days, honor user date if longer
- Called during posting creation and updates

### Implementation Details
1. Create `calculateExpiryDate(userDate, createdAt)` function:
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
2. Add comprehensive tests for edge cases:
   - User date = null (should return created_at + 30)
   - User date < 30 days (should return created_at + 30)
   - User date > 30 days (should return user date)
   - Invalid dates (should throw error)
3. Export function for use in routes
4. Document function with JSDoc

### Acceptance Criteria
- [ ] Function correctly calculates expiry for all scenarios
- [ ] Edge cases handled (null, invalid dates)
- [ ] Returns Date object
- [ ] Well-documented with JSDoc
- [ ] Comprehensive unit tests pass

### Testing Requirements
- [ ] Unit test: No user date provided
- [ ] Unit test: User date < 30 days from now
- [ ] Unit test: User date > 30 days from now
- [ ] Unit test: User date = exactly 30 days
- [ ] Unit test: Invalid date format throws error
- [ ] Unit test: Past date handling

---

## Task 2: Integrate Expiry Calculation in Posting Endpoints
**Status**: Not Started  
**Depends On**: Task 1  
**Estimated Complexity**: Low  
**Phase**: 1 (CRITICAL)

### Objective
Use expiry calculation function in POST and PUT endpoints for postings.

### Context
- File to modify: `routes/postings.js`
- Endpoints: POST `/api/postings`, PUT `/api/postings/:id`
- Import from postingService.js

### Implementation Details
1. In POST endpoint:
   - Get user-provided expiry_date (optional)
   - Call calculateExpiryDate(userDate, new Date())
   - Store calculated expiry in database
2. In PUT endpoint:
   - If expiry_date updated, recalculate
   - Use original created_at for calculation
   - Update database
3. Return calculated expiry in response
4. Add validation: user date cannot be in past

### Acceptance Criteria
- [ ] POST endpoint calculates expiry on creation
- [ ] PUT endpoint recalculates if date changed
- [ ] Calculated expiry stored in database
- [ ] Response includes expiry_date field
- [ ] Past dates rejected with 400 error

### Testing Requirements
- [ ] Integration test: Create posting without expiry
- [ ] Integration test: Create posting with expiry < 30 days
- [ ] Integration test: Create posting with expiry > 30 days
- [ ] Integration test: Update posting expiry date
- [ ] Integration test: Past expiry date rejected

---

## Task 3: Database Migration for Expiry Column
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Low  
**Phase**: 1 (CRITICAL)

### Objective
Ensure postings table has expiry_date column with proper index.

### Context
- Table: `postings`
- Column: `expiry_date DATETIME NOT NULL`
- Index needed for performance

### Implementation Details
1. Create migration script `migrations/add-posting-expiry.sql`:
   ```sql
   ALTER TABLE postings 
   ADD COLUMN IF NOT EXISTS expiry_date DATETIME NOT NULL;
   
   CREATE INDEX idx_postings_expiry 
   ON postings(expiry_date, status);
   ```
2. Create rollback script
3. Backfill existing postings:
   ```sql
   UPDATE postings 
   SET expiry_date = DATE_ADD(created_at, INTERVAL 30 DAY)
   WHERE expiry_date IS NULL OR expiry_date = '0000-00-00';
   ```
4. Test migration on dev database
5. Document in migration history

### Acceptance Criteria
- [ ] Migration script created
- [ ] Column added successfully
- [ ] Index created
- [ ] Existing postings backfilled
- [ ] Rollback script tested
- [ ] Documented

### Testing Requirements
- [ ] Test migration execution
- [ ] Test rollback execution
- [ ] Verify index exists
- [ ] Verify backfill correct

---

## Task 4: Create Auto-Archive Cron Job
**Status**: Not Started  
**Depends On**: Task 3  
**Estimated Complexity**: Medium  
**Phase**: 1 (CRITICAL)

### Objective
Create scheduled job to automatically archive expired postings daily.

### Context
- File to create: `scripts/cron/expire-postings.js`
- Schedule: Daily at midnight
- Updates postings status to 'expired'

### Implementation Details
1. Create cron job script:
   ```javascript
   const cron = require('node-cron');
   const db = require('../server/config/database');
   
   cron.schedule('0 0 * * *', async () => {
     console.log('Running expiry job...');
     
     const result = await db.query(`
       UPDATE postings 
       SET status = 'expired' 
       WHERE expiry_date < NOW() 
       AND status = 'active'
     `);
     
     console.log(`Expired ${result.affectedRows} postings`);
   });
   ```
2. Add error handling and logging
3. Make idempotent (safe to run multiple times)
4. Add configuration for schedule
5. Integrate with server startup
6. Optional: Send notifications to authors

### Acceptance Criteria
- [ ] Cron job runs daily at midnight
- [ ] Updates expired postings to 'expired' status
- [ ] Logs results
- [ ] Error handling implemented
- [ ] Idempotent operation
- [ ] Does not affect already expired postings

### Testing Requirements
- [ ] Unit test: Query logic
- [ ] Integration test: Run job, verify expired postings updated
- [ ] Test: Job can run multiple times safely
- [ ] Test: Only active postings affected

---

## Task 5: Add Extend Expiry Endpoint
**Status**: Not Started  
**Depends On**: Task 1, Task 2  
**Estimated Complexity**: Low  
**Phase**: 1

### Objective
Allow posting authors to extend expiry date by 30 days from current date.

### Context
- File to modify: `routes/postings.js`
- Endpoint: POST `/api/postings/:id/extend-expiry`
- Authorization: Owner or admin only

### Implementation Details
1. Create endpoint:
   - Verify authentication (JWT)
   - Check posting ownership or admin role
   - Calculate new expiry: today + 30 days
   - Update database
   - Return new expiry date
2. Add validation:
   - Posting must exist
   - Posting not already expired
3. Add rate limiting (prevent abuse)

### Acceptance Criteria
- [ ] Endpoint extends expiry by 30 days
- [ ] Only owner or admin can extend
- [ ] Cannot extend already expired posting
- [ ] Returns new expiry date
- [ ] Appropriate error messages

### Testing Requirements
- [ ] Integration test: Owner extends expiry successfully
- [ ] Integration test: Non-owner blocked
- [ ] Integration test: Admin can extend any posting
- [ ] Integration test: Cannot extend expired posting

---

## Task 6: Display Expiry Date in Posting Card
**Status**: Not Started  
**Depends On**: Task 2  
**Estimated Complexity**: Low  
**Phase**: 1

### Objective
Show expiry date in posting card with visual indicator for expiring soon.

### Context
- File to modify: `src/components/postings/PostingCard.tsx`
- Show expiry date formatted
- Highlight if expiring within 7 days

### Implementation Details
1. Add expiry date display:
   - Format: "Expires Dec 23, 2025" or "Expires in 5 days"
   - Use relative time if < 7 days
2. Add visual indicator:
   - Yellow/amber color if 7 days or less
   - Red color if 2 days or less
   - Icon: 🕐 or ⏰
3. Add tooltip with exact date/time
4. Style consistently with theme

### Acceptance Criteria
- [ ] Expiry date shown on all posting cards
- [ ] Relative time shown if < 7 days
- [ ] Color coding for urgency
- [ ] Tooltip with exact date/time
- [ ] Accessible (screen reader friendly)

### Testing Requirements
- [ ] E2E test: Verify expiry shown
- [ ] E2E test: Color changes for expiring soon
- [ ] Accessibility test: Screen reader announces expiry

---

## Task 7: Add Extend Expiry Button in Posting Detail
**Status**: Not Started  
**Depends On**: Task 5, Task 6  
**Estimated Complexity**: Low  
**Phase**: 1

### Objective
Provide UI for posting authors to extend expiry date.

### Context
- File to modify: `src/pages/PostingDetail.tsx`
- Button only visible to owner/admin
- Show when < 7 days to expiry

### Implementation Details
1. Add "Extend Expiry" button:
   - Only render for posting owner or admin
   - Only show if expiring within 7 days
   - Show confirmation dialog
2. On click:
   - Call POST `/api/postings/:id/extend-expiry`
   - Show loading state
   - Update expiry date in UI on success
   - Show success toast
   - Show error toast on failure
3. Disable after extension until page refresh

### Acceptance Criteria
- [ ] Button visible only to owner/admin
- [ ] Only shown when expiring within 7 days
- [ ] Confirmation dialog before action
- [ ] UI updates on successful extension
- [ ] Success/error feedback shown
- [ ] Button disabled after extension

### Testing Requirements
- [ ] E2E test: Owner sees and clicks extend button
- [ ] E2E test: Non-owner doesn't see button
- [ ] E2E test: Confirmation dialog shown
- [ ] E2E test: Expiry updated after extension
- [ ] E2E test: Success message displayed

---

## Task 8: Create Taxonomy API Endpoints
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Medium  
**Phase**: 2

### Objective
Implement REST endpoints for hierarchical taxonomy data (domains, sub-domains, areas).

### Context
- File to create: `routes/taxonomy.js`
- Endpoints needed:
  - GET `/api/taxonomy/domains`
  - GET `/api/taxonomy/sub-domains?domain_id=X`
  - GET `/api/taxonomy/areas?sub_domain_id=Y`
- Add caching for performance

### Implementation Details
1. Create GET `/api/taxonomy/domains`:
   - Return all domains
   - Cache for 5 minutes
2. Create GET `/api/taxonomy/sub-domains`:
   - Require domain_id query param
   - Return sub-domains filtered by domain
   - Cache for 5 minutes
3. Create GET `/api/taxonomy/areas`:
   - Require sub_domain_id query param
   - Return areas filtered by sub-domain
   - Cache for 5 minutes
4. Add proper error handling
5. Add response pagination if needed

### Acceptance Criteria
- [ ] All three endpoints implemented
- [ ] Filtering works correctly
- [ ] Data cached appropriately
- [ ] Error handling for invalid IDs
- [ ] Performance < 100ms per request

### Testing Requirements
- [ ] Integration test: Get all domains
- [ ] Integration test: Get sub-domains by domain
- [ ] Integration test: Get areas by sub-domain
- [ ] Integration test: Invalid ID returns 400
- [ ] Integration test: Cache working

---

## Task 9: Implement Hierarchical Taxonomy Selector
**Status**: Not Started  
**Depends On**: Task 8  
**Estimated Complexity**: High  
**Phase**: 2

### Objective
Create reusable React component for hierarchical taxonomy selection.

### Context
- File to create: `src/components/postings/TaxonomySelector.tsx`
- Three cascading dropdowns
- Used in posting form and filters

### Implementation Details
1. Create component with three dropdowns:
   - Domain (always enabled)
   - Sub-domain (enabled when domain selected)
   - Area (enabled when sub-domain selected)
2. State management:
   - Fetch domains on mount
   - Fetch sub-domains when domain changes
   - Fetch areas when sub-domain changes
   - Clear dependent selections on parent change
3. Props:
   - value: {domain_id, sub_domain_id, area_id}
   - onChange: callback with selected values
   - required: boolean (default false)
4. Add loading states for each dropdown
5. Add error handling
6. Style with theme
7. Accessible (keyboard navigation, ARIA labels)

### Acceptance Criteria
- [ ] Three cascading dropdowns render
- [ ] Dropdowns enabled/disabled correctly
- [ ] Selections cleared when parent changes
- [ ] Loading states shown while fetching
- [ ] onChange callback fires with complete selection
- [ ] Keyboard accessible
- [ ] Screen reader friendly

### Testing Requirements
- [ ] Unit test: Dropdown enabling logic
- [ ] Unit test: Clear dependent selections
- [ ] E2E test: Select domain, verify sub-domains load
- [ ] E2E test: Change domain, verify sub-domains cleared
- [ ] E2E test: Complete selection flow
- [ ] Accessibility test: Keyboard navigation

---

## Task 10: Add Taxonomy Validation in Posting Endpoints
**Status**: Not Started  
**Depends On**: Task 8  
**Estimated Complexity**: Low  
**Phase**: 2

### Objective
Validate taxonomy IDs in posting creation/update to ensure data integrity.

### Context
- File to modify: `routes/postings.js`
- Validate POST and PUT endpoints
- Check hierarchy: area → sub-domain → domain

### Implementation Details
1. Add validation middleware:
   - Verify domain_id exists
   - Verify sub_domain_id exists and belongs to domain
   - Verify area_id exists and belongs to sub_domain
2. Return 400 with specific error:
   - "Invalid domain_id"
   - "Sub-domain does not belong to domain"
   - "Area does not belong to sub-domain"
3. Cache taxonomy relationships for performance

### Acceptance Criteria
- [ ] Invalid domain_id rejected
- [ ] Mismatched sub-domain rejected
- [ ] Mismatched area rejected
- [ ] Clear error messages
- [ ] Valid combinations accepted

### Testing Requirements
- [ ] Integration test: Valid taxonomy accepted
- [ ] Integration test: Invalid domain rejected
- [ ] Integration test: Mismatched sub-domain rejected
- [ ] Integration test: Mismatched area rejected

---

## Task 11: Integrate Taxonomy Selector in Posting Form
**Status**: Not Started  
**Depends On**: Task 9, Task 10  
**Estimated Complexity**: Low  
**Phase**: 2

### Objective
Add taxonomy selection to posting creation and edit forms.

### Context
- File to modify: `src/pages/CreatePosting.tsx`
- Add TaxonomySelector component
- Make required for form submission

### Implementation Details
1. Import and render TaxonomySelector
2. Add to form state:
   - domain_id, sub_domain_id, area_id
3. Handle onChange callback
4. Add validation:
   - All three must be selected
   - Show error if incomplete
5. Include in POST/PUT request
6. Show validation errors from API

### Acceptance Criteria
- [ ] Taxonomy selector renders in form
- [ ] Validation requires all three selections
- [ ] Error shown if incomplete
- [ ] Selected taxonomy sent with request
- [ ] Edit form pre-fills current taxonomy

### Testing Requirements
- [ ] E2E test: Cannot submit without taxonomy
- [ ] E2E test: Complete taxonomy selection
- [ ] E2E test: Submit with taxonomy succeeds
- [ ] E2E test: Edit form shows current taxonomy

---

## Task 12: Display Taxonomy in Posting Cards
**Status**: Not Started  
**Depends On**: Task 11  
**Estimated Complexity**: Low  
**Phase**: 2

### Objective
Show taxonomy breadcrumb in posting cards for easy identification.

### Context
- File to modify: `src/components/postings/PostingCard.tsx`
- Display: "Domain > Sub-domain > Area"
- Make clickable to filter

### Implementation Details
1. Add taxonomy display:
   - Format: "Domain > Sub-domain > Area"
   - Truncate if too long
   - Tooltip with full names
2. Style as breadcrumb or pill
3. Make clickable:
   - Click sets filter to that taxonomy
   - Navigate to postings page with filter
4. Add icon (e.g., 🏷️)

### Acceptance Criteria
- [ ] Taxonomy displayed in all posting cards
- [ ] Format is readable and consistent
- [ ] Truncated names show full text in tooltip
- [ ] Clicking filters by that taxonomy
- [ ] Accessible

### Testing Requirements
- [ ] E2E test: Taxonomy shown on cards
- [ ] E2E test: Click taxonomy applies filter
- [ ] E2E test: Tooltip shows full text

---

## Task 13: Add Taxonomy Filtering to Postings Feed
**Status**: Not Started  
**Depends On**: Task 9  
**Estimated Complexity**: Medium  
**Phase**: 2

### Objective
Allow users to filter postings feed by domain, sub-domain, or area.

### Context
- File to modify: `src/components/postings/PostingFilters.tsx`
- Add TaxonomySelector component
- Apply filters to API query

### Implementation Details
1. Add TaxonomySelector to filter panel:
   - Not required (all optional)
   - Partial selection allowed (domain only, domain + sub-domain)
2. Update filter state:
   - Add domain_id, sub_domain_id, area_id
3. Modify API call:
   - Include taxonomy params in query string
   - Backend filters results
4. Add "Clear Filters" button
5. Show active filter count/pills

### Acceptance Criteria
- [ ] Taxonomy selector in filter panel
- [ ] Partial selection allowed
- [ ] Feed updates when filter applied
- [ ] Clear filters button works
- [ ] Active filters displayed
- [ ] URL params updated (for sharing)

### Testing Requirements
- [ ] E2E test: Filter by domain only
- [ ] E2E test: Filter by domain + sub-domain
- [ ] E2E test: Filter by complete taxonomy
- [ ] E2E test: Clear filters resets feed

---

## Task 14: Database Migration for Nested Comments
**Status**: Not Started  
**Depends On**: None  
**Estimated Complexity**: Low  
**Phase**: 3

### Objective
Add database schema support for nested comment replies.

### Context
- Table: `posting_comments`
- Add columns: parent_comment_id, depth

### Implementation Details
1. Create migration `migrations/add-nested-comments.sql`:
   ```sql
   ALTER TABLE posting_comments
   ADD COLUMN parent_comment_id INT NULL,
   ADD COLUMN depth INT DEFAULT 0,
   ADD FOREIGN KEY (parent_comment_id) 
       REFERENCES posting_comments(id) ON DELETE CASCADE;
   
   CREATE INDEX idx_comments_parent 
   ON posting_comments(parent_comment_id);
   ```
2. Create rollback script
3. Test on dev database
4. Document

### Acceptance Criteria
- [ ] Columns added successfully
- [ ] Foreign key constraint works
- [ ] Index created
- [ ] Rollback tested
- [ ] No data loss

### Testing Requirements
- [ ] Test migration execution
- [ ] Test rollback
- [ ] Test cascade delete

---

## Task 15: Implement Comment Reply Endpoint
**Status**: Not Started  
**Depends On**: Task 14  
**Estimated Complexity**: Medium  
**Phase**: 3

### Objective
Create API endpoint for posting replies to comments.

### Context
- File to modify: `routes/postings.js`
- Endpoint: POST `/api/postings/:id/comments/:commentId/reply`

### Implementation Details
1. Create endpoint:
   - Validate parent comment exists
   - Set parent_comment_id
   - Calculate depth = parent_depth + 1
   - Enforce max depth = 3
   - Insert reply
   - Return created reply
2. Add authorization check
3. Add validation for content
4. Handle edge cases

### Acceptance Criteria
- [ ] Endpoint creates reply
- [ ] parent_comment_id set correctly
- [ ] Depth calculated correctly
- [ ] Max depth enforced (reject if > 3)
- [ ] Authorization verified
- [ ] Error handling

### Testing Requirements
- [ ] Integration test: Create reply
- [ ] Integration test: Depth calculated
- [ ] Integration test: Max depth rejected
- [ ] Integration test: Unauthorized blocked

---

## Implementation Order

### Sprint 1: Critical Expiry Logic (Priority: HIGH)
1. Task 3: Database Migration for Expiry
2. Task 1: Expiry Calculation Logic
3. Task 2: Integrate in Endpoints
4. Task 4: Auto-Archive Cron Job
5. Task 6: Display Expiry in Cards
6. Task 5: Extend Expiry Endpoint
7. Task 7: Extend Expiry UI

### Sprint 2: Taxonomy Integration (Priority: HIGH)
8. Task 8: Taxonomy API Endpoints
9. Task 10: Taxonomy Validation
10. Task 9: Taxonomy Selector Component
11. Task 11: Integrate in Posting Form
12. Task 12: Display in Cards
13. Task 13: Filter by Taxonomy

### Sprint 3: Enhanced Comments (Priority: MEDIUM)
14. Task 14: Database Migration for Nested Comments
15. Task 15: Comment Reply Endpoint
16. (Additional frontend tasks for nested display)

### Sprint 4+: Future Enhancements
- Chat integration
- Engagement notifications
- Advanced analytics

## Progress Tracking

Update status for each task:
- **Not Started**: Task not begun
- **In Progress**: Currently being worked on
- **Blocked**: Waiting on dependency or decision
- **Review**: Code complete, awaiting review
- **Complete**: Merged and deployed
- **Verified**: Tested in production

## Notes
- Prioritize expiry logic for MVP
- Taxonomy is high priority for user experience
- Comments can be enhanced iteratively
- All tasks require tests before merge
- Update functional spec after completion

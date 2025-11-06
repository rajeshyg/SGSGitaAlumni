# 🎯 Action 8: Moderator Review System - Detailed Implementation Plan

## Week 1: Backend Infrastructure (Days 1-5)

### Day 1-2: Database Schema & Migration
**Effort:** 16 hours

**Tasks:**
1. Create database migration script
   - Add moderation columns to POSTINGS table
   - Create MODERATION_HISTORY table
   - Create moderation_queue view
   - Add indexes for performance

2. Set up API route structure
   - Create `/api/moderation/*` route file
   - Set up authentication middleware
   - Set up authorization middleware (moderator role)
   - Apply rate limiting

**Files to Create:**
```
migrations/
  └── add-moderation-schema.js

server/routes/
  └── moderation.js
```

**Database Changes:**
```sql
-- POSTINGS table columns
ALTER TABLE POSTINGS
  ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'PENDING',
  ADD COLUMN moderated_by UUID REFERENCES app_users(id),
  ADD COLUMN moderated_at TIMESTAMP,
  ADD COLUMN rejection_reason VARCHAR(50),
  ADD COLUMN moderator_feedback TEXT,
  ADD COLUMN moderator_notes TEXT,
  ADD COLUMN version INT DEFAULT 1; -- For optimistic locking

-- MODERATION_HISTORY table
CREATE TABLE MODERATION_HISTORY (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id UUID NOT NULL REFERENCES POSTINGS(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES app_users(id),
  action VARCHAR(20) NOT NULL,
  reason VARCHAR(50),
  feedback_to_user TEXT,
  moderator_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_postings_moderation_status ON POSTINGS(moderation_status, created_at);
CREATE INDEX idx_moderation_history_posting ON MODERATION_HISTORY(posting_id);
CREATE INDEX idx_moderation_history_moderator ON MODERATION_HISTORY(moderator_id);
```

**Deliverables:**
- [ ] Migration script tested and ready
- [ ] MODERATION_HISTORY table created
- [ ] Moderation columns added to POSTINGS
- [ ] Indexes created for performance
- [ ] API route file structure created
- [ ] Middleware stack configured

### Day 3-4: Approval/Rejection Logic
**Effort:** 16 hours

**Tasks:**
1. Implement GET /api/moderation/queue endpoint
   - Query moderation_queue view
   - Support filtering (domain, status, search)
   - Support sorting (oldest, newest, urgent)
   - Implement pagination
   - Return queue statistics

2. Implement POST /api/moderation/approve endpoint
   - Update posting status to APPROVED
   - Set moderated_by and moderated_at
   - Calculate expiry date (MAX(user_date, submission_date + 30 days))
   - Create history record
   - Use transaction for atomicity
   - Trigger notification

3. Implement POST /api/moderation/reject endpoint
   - Update posting status to REJECTED
   - Save rejection reason and feedback
   - Create history record
   - Use transaction for atomicity
   - Trigger notification

4. Implement POST /api/moderation/escalate endpoint
   - Update posting status to ESCALATED
   - Save escalation notes
   - Create history record
   - Use transaction for atomicity
   - Notify all admins

5. Implement GET /api/moderation/posting/:id endpoint
   - Return full posting details
   - Include submitter profile
   - Include submitter moderation history
   - Include AI insights (placeholder for now)

**API Validation Schemas:**
```typescript
// src/schemas/validation/moderation.ts

export const ApproveRequestSchema = z.object({
  postingId: z.string().uuid(),
  moderatorNotes: z.string().optional(),
  expiryDate: z.string().datetime().optional()
});

export const RejectRequestSchema = z.object({
  postingId: z.string().uuid(),
  reason: z.enum(['SPAM', 'INAPPROPRIATE', 'DUPLICATE', 'SCAM', 'INCOMPLETE', 'OTHER']),
  feedbackToUser: z.string().min(10).max(500),
  moderatorNotes: z.string().optional()
});

export const EscalateRequestSchema = z.object({
  postingId: z.string().uuid(),
  escalationReason: z.enum(['SUSPECTED_SCAM', 'POLICY_QUESTION', 'TECHNICAL_ISSUE', 'OTHER']),
  escalationNotes: z.string().min(10).max(1000)
});

export const QueueQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  domain: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ESCALATED']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['oldest', 'newest', 'urgent']).default('oldest')
});
```

**Deliverables:**
- [ ] Queue endpoint with filters/sort/pagination
- [ ] Approve endpoint with transaction
- [ ] Reject endpoint with transaction
- [ ] Escalate endpoint with transaction
- [ ] Posting detail endpoint with history
- [ ] Input validation schemas
- [ ] Error handling for all endpoints
- [ ] Optimistic locking implemented

### Day 5: Notification System
**Effort:** 8 hours

**Tasks:**
1. Create notification templates
   - Approval email template
   - Rejection email template
   - Escalation email template
   - Daily digest template (optional)

2. Implement notification service
   - Send approval notification to author
   - Send rejection notification with feedback
   - Send escalation notification to admins
   - Queue notifications for reliability

3. Update moderation endpoints to trigger notifications
   - Call notification service after approve
   - Call notification service after reject
   - Call notification service after escalate

**Email Templates:**
```html
<!-- Approval Template -->
Subject: Your posting has been approved!

Hi {{authorName}},

Great news! Your posting "{{postingTitle}}" has been approved and is now live on the platform.

View your posting: {{postingUrl}}

Thank you for contributing to our community!

<!-- Rejection Template -->
Subject: Action needed: Your posting requires changes

Hi {{authorName}},

Your posting "{{postingTitle}}" was not approved for the following reason:

{{moderatorFeedback}}

You can edit your posting and resubmit it for review: {{editUrl}}

If you have questions, please contact our moderator team.

<!-- Escalation Template -->
Subject: Your posting is under additional review

Hi {{authorName}},

Your posting "{{postingTitle}}" is under additional review by our admin team. We'll notify you once a decision is made.

Thank you for your patience.
```

**Deliverables:**
- [ ] Email templates created
- [ ] Notification service integrated
- [ ] Approval notifications working
- [ ] Rejection notifications working
- [ ] Escalation notifications working
- [ ] Notification error handling

## Week 2: Frontend & Testing (Days 6-10)

### Day 6-7: Queue UI
**Effort:** 16 hours

**Tasks:**
1. Create ModerationQueuePage component
   - Page layout with stats dashboard
   - Queue filters (domain, status, search)
   - Sort controls (oldest, newest, urgent)
   - Pagination controls
   - Empty state handling

2. Create queue components
   - ModerationStats card component
   - QueueFilters component
   - PostingQueueList component
   - PostingQueueItem component
   - LoadingState component

3. Implement API integration
   - Fetch queue data with filters
   - Handle loading/error states
   - Implement real-time refresh
   - Handle pagination

**Components:**
```
src/pages/moderator/
  └── ModerationQueuePage.tsx

src/components/moderation/
  ├── ModerationStats.tsx
  ├── QueueFilters.tsx
  ├── PostingQueueList.tsx
  └── PostingQueueItem.tsx
```

**Deliverables:**
- [ ] ModerationQueuePage component
- [ ] Stats dashboard showing metrics
- [ ] Filter controls (domain, status, search)
- [ ] Sort controls working
- [ ] Pagination working
- [ ] Loading/error states
- [ ] Empty state with helpful message
- [ ] Urgent postings highlighted
- [ ] Theme compliance (all colors use CSS variables)

### Day 8-9: Review Modal
**Effort:** 16 hours

**Tasks:**
1. Create PostingReviewModal component
   - Modal layout with posting details
   - Submitter information display
   - Submitter history display
   - AI insights panel (placeholder)
   - Action buttons (Approve, Reject, Escalate)

2. Create action forms
   - RejectionForm with reason dropdown
   - Feedback textarea with validation
   - EscalationForm with reason dropdown
   - Notes textarea for escalation

3. Implement action handlers
   - Handle approve action
   - Handle reject action with feedback
   - Handle escalate action with notes
   - Optimistic UI updates
   - Error handling

4. Add confirmation dialogs
   - Confirm before approve
   - Confirm before reject
   - Confirm before escalate

**Components:**
```
src/components/moderation/
  ├── PostingReviewModal.tsx
  ├── PostingDetailsView.tsx
  ├── SubmitterHistory.tsx
  ├── AIInsightsPanel.tsx (placeholder)
  ├── RejectionForm.tsx
  └── EscalationForm.tsx
```

**Deliverables:**
- [ ] PostingReviewModal component
- [ ] Full posting details display
- [ ] Submitter profile info
- [ ] Submitter history (approval/rejection stats)
- [ ] Rejection form with validation
- [ ] Escalation form with validation
- [ ] Action buttons with loading states
- [ ] Confirmation dialogs
- [ ] Optimistic UI updates
- [ ] Error toasts on failure
- [ ] Theme compliance

### Day 10: Testing & Polish
**Effort:** 8 hours

**Tasks:**
1. Create integration tests
   - Test moderation queue loading
   - Test approve flow
   - Test reject flow
   - Test escalate flow
   - Test concurrent moderation prevention
   - Test notification delivery

2. Create manual test scenarios
   - Test with large queue (50+ items)
   - Test all filter combinations
   - Test sorting options
   - Test pagination edge cases
   - Test rejection reasons
   - Test escalation workflow

3. Performance testing
   - Queue query performance (<100ms)
   - Action execution performance (<2s)
   - UI responsiveness
   - Notification delivery speed

4. Polish and refinements
   - Fix any UI/UX issues
   - Improve error messages
   - Add helpful tooltips
   - Improve loading states

**Test Files:**
```
tests/integration/
  ├── moderation-queue.test.js
  ├── moderation-approve.test.js
  ├── moderation-reject.test.js
  └── moderation-escalate.test.js

docs/testing/
  └── moderation-workflow-test-guide.md
```

**Deliverables:**
- [ ] Integration test suite (4 test files)
- [ ] Manual test guide with scenarios
- [ ] Performance benchmarks met
- [ ] All edge cases handled
- [ ] UI polish complete
- [ ] Documentation updated
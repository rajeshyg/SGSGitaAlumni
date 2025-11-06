# ✅ Action 8 - Moderator Review System - Quick Start Checklist

**Next Session Start:** Use this checklist to begin implementation

---

## 📖 Pre-Implementation (5 minutes)

- [ ] Read handoff document: `NEXT_SESSION_ACTION_8_MODERATOR_REVIEW.md`
- [ ] Review requirements: `task-7.9-moderator-review.md`
- [ ] Verify system status (all green)
- [ ] Confirm prerequisites met

---

## 🗄️ Week 1 - Day 1-2: Database & API Setup (16 hours)

### Database Migration
- [ ] Create file: `migrations/add-moderation-schema.js`
- [ ] Add moderation columns to POSTINGS table
  - [ ] `moderation_status VARCHAR(20) DEFAULT 'PENDING'`
  - [ ] `moderated_by UUID REFERENCES app_users(id)`
  - [ ] `moderated_at TIMESTAMP`
  - [ ] `rejection_reason VARCHAR(50)`
  - [ ] `moderator_feedback TEXT`
  - [ ] `moderator_notes TEXT`
  - [ ] `version INT DEFAULT 1` (optimistic locking)
- [ ] Create MODERATION_HISTORY table
  - [ ] `id UUID PRIMARY KEY`
  - [ ] `posting_id UUID REFERENCES POSTINGS(id)`
  - [ ] `moderator_id UUID REFERENCES app_users(id)`
  - [ ] `action VARCHAR(20)` (APPROVE, REJECT, ESCALATE)
  - [ ] `reason VARCHAR(50)`
  - [ ] `feedback_to_user TEXT`
  - [ ] `moderator_notes TEXT`
  - [ ] `created_at TIMESTAMP`
- [ ] Create indexes
  - [ ] `idx_postings_moderation_status ON POSTINGS(moderation_status, created_at)`
  - [ ] `idx_moderation_history_posting ON MODERATION_HISTORY(posting_id)`
  - [ ] `idx_moderation_history_moderator ON MODERATION_HISTORY(moderator_id)`
- [ ] Create moderation_queue view
- [ ] Test migration script
- [ ] Run migration: `node migrations/add-moderation-schema.js`
- [ ] Verify schema: `DESCRIBE MODERATION_HISTORY`

### API Route Structure
- [ ] Create file: `server/routes/moderation.js`
- [ ] Import required dependencies (express, db, auth middleware)
- [ ] Set up router
- [ ] Apply authentication middleware to all routes
- [ ] Apply authorization middleware (moderator role check)
- [ ] Apply rate limiting (apiRateLimit)
- [ ] Export router
- [ ] Import in `server.js`: `app.use('/api/moderation', moderationRoutes)`

### Validation Schemas
- [ ] Create file: `src/schemas/validation/moderation.ts`
- [ ] Create `QueueQuerySchema` (page, limit, domain, status, search, sortBy)
- [ ] Create `ApproveRequestSchema` (postingId, moderatorNotes, expiryDate)
- [ ] Create `RejectRequestSchema` (postingId, reason, feedbackToUser, moderatorNotes)
- [ ] Create `EscalateRequestSchema` (postingId, escalationReason, escalationNotes)
- [ ] Export all schemas

---

## 🗄️ Week 1 - Day 3-4: API Endpoints (16 hours)

### GET /api/moderation/queue
- [ ] Create route handler
- [ ] Apply validation middleware with QueueQuerySchema
- [ ] Query moderation_queue view
- [ ] Implement filtering (domain, status, search)
- [ ] Implement sorting (oldest, newest, urgent)
- [ ] Implement pagination
- [ ] Calculate queue statistics
- [ ] Return structured response
- [ ] Test endpoint: `curl http://localhost:3001/api/moderation/queue`

### GET /api/moderation/posting/:id
- [ ] Create route handler
- [ ] Fetch posting details
- [ ] Fetch submitter profile
- [ ] Fetch submitter moderation history
  - [ ] Total submissions
  - [ ] Approved count
  - [ ] Rejected count
  - [ ] Recent rejections
- [ ] Add AI insights placeholder
- [ ] Return structured response
- [ ] Test endpoint: `curl http://localhost:3001/api/moderation/posting/{id}`

### POST /api/moderation/approve
- [ ] Create route handler
- [ ] Apply validation middleware with ApproveRequestSchema
- [ ] Start database transaction
- [ ] Update POSTINGS with optimistic lock
  - [ ] Set moderation_status = 'APPROVED'
  - [ ] Set moderated_by = current user
  - [ ] Set moderated_at = NOW()
  - [ ] Calculate expiry_date (MAX(user_date, submission_date + 30 days))
  - [ ] Increment version
  - [ ] WHERE id = ? AND version = ?
- [ ] Check affected rows (throw error if 0)
- [ ] Insert MODERATION_HISTORY record
- [ ] Commit transaction
- [ ] Trigger approval notification (async)
- [ ] Return updated posting
- [ ] Test endpoint with curl

### POST /api/moderation/reject
- [ ] Create route handler
- [ ] Apply validation middleware with RejectRequestSchema
- [ ] Start database transaction
- [ ] Update POSTINGS with optimistic lock
  - [ ] Set moderation_status = 'REJECTED'
  - [ ] Set moderated_by = current user
  - [ ] Set moderated_at = NOW()
  - [ ] Set rejection_reason
  - [ ] Set moderator_feedback
  - [ ] Set moderator_notes
  - [ ] Increment version
  - [ ] WHERE id = ? AND version = ?
- [ ] Check affected rows (throw error if 0)
- [ ] Insert MODERATION_HISTORY record
- [ ] Commit transaction
- [ ] Trigger rejection notification (async)
- [ ] Return updated posting
- [ ] Test endpoint with curl

### POST /api/moderation/escalate
- [ ] Create route handler
- [ ] Apply validation middleware with EscalateRequestSchema
- [ ] Start database transaction
- [ ] Update POSTINGS with optimistic lock
  - [ ] Set moderation_status = 'ESCALATED'
  - [ ] Set moderated_by = current user
  - [ ] Set moderated_at = NOW()
  - [ ] Set moderator_notes (escalation notes)
  - [ ] Increment version
  - [ ] WHERE id = ? AND version = ?
- [ ] Check affected rows (throw error if 0)
- [ ] Insert MODERATION_HISTORY record
- [ ] Commit transaction
- [ ] Trigger escalation notifications to all admins (async)
- [ ] Return updated posting
- [ ] Test endpoint with curl

---

## 🗄️ Week 1 - Day 5: Notification System (8 hours)

### Email Templates
- [ ] Create `server/templates/moderation-approval.html`
- [ ] Create `server/templates/moderation-rejection.html`
- [ ] Create `server/templates/moderation-escalation.html`
- [ ] Create `server/templates/admin-escalation-alert.html`
- [ ] Test template rendering

### Notification Service
- [ ] Create file: `server/services/moderationNotification.js`
- [ ] Create `sendApprovalNotification(posting, author)` function
- [ ] Create `sendRejectionNotification(posting, author, feedback)` function
- [ ] Create `sendEscalationNotification(posting, author)` function
- [ ] Create `sendAdminEscalationAlert(posting, moderator, notes)` function
- [ ] Implement error handling (log but don't fail action)
- [ ] Test notification delivery

### Integration
- [ ] Call `sendApprovalNotification()` in approve endpoint
- [ ] Call `sendRejectionNotification()` in reject endpoint
- [ ] Call `sendEscalationNotification()` in escalate endpoint
- [ ] Call `sendAdminEscalationAlert()` in escalate endpoint
- [ ] Test end-to-end notification flow

---

## 🎨 Week 2 - Day 6-7: Queue UI (16 hours)

### Page Component
- [ ] Create file: `src/pages/moderator/ModerationQueuePage.tsx`
- [ ] Set up page layout
- [ ] Create state for postings, filters, stats
- [ ] Fetch queue data on mount
- [ ] Implement filter handling
- [ ] Implement sort handling
- [ ] Implement pagination handling
- [ ] Implement auto-refresh (every 30 seconds)
- [ ] Add loading states
- [ ] Add error states
- [ ] Add empty state
- [ ] Use theme variables (no hardcoded colors)

### Stats Component
- [ ] Create file: `src/components/moderation/ModerationStats.tsx`
- [ ] Display pending count
- [ ] Display escalated count
- [ ] Display avg review time
- [ ] Display today's reviewed count
- [ ] Use theme variables

### Filters Component
- [ ] Create file: `src/components/moderation/QueueFilters.tsx`
- [ ] Add domain filter dropdown
- [ ] Add status filter (Pending/Escalated)
- [ ] Add search input
- [ ] Add sort dropdown (oldest/newest/urgent)
- [ ] Implement onChange handlers
- [ ] Use theme variables

### Queue List Component
- [ ] Create file: `src/components/moderation/PostingQueueList.tsx`
- [ ] Map postings to PostingQueueItem components
- [ ] Handle empty state
- [ ] Add pagination controls
- [ ] Use theme variables

### Queue Item Component
- [ ] Create file: `src/components/moderation/PostingQueueItem.tsx`
- [ ] Display posting title
- [ ] Display posting description (truncated)
- [ ] Display domain and category
- [ ] Display submitter name
- [ ] Display submission time (relative, e.g., "2 hours ago")
- [ ] Highlight urgent postings
- [ ] Add "Review" button
- [ ] Use theme variables

### Testing
- [ ] Test with empty queue
- [ ] Test with 50+ postings
- [ ] Test all filter combinations
- [ ] Test all sort options
- [ ] Test pagination
- [ ] Test auto-refresh
- [ ] Test theme in light/dark mode

---

## 🎨 Week 2 - Day 8-9: Review Modal (16 hours)

### Modal Component
- [ ] Create file: `src/components/moderation/PostingReviewModal.tsx`
- [ ] Set up modal layout (Dialog component)
- [ ] Fetch posting details on open
- [ ] Create state for action (null, APPROVE, REJECT, ESCALATE)
- [ ] Create state for feedback/notes
- [ ] Handle modal close
- [ ] Use theme variables

### Details View Component
- [ ] Create file: `src/components/moderation/PostingDetailsView.tsx`
- [ ] Display full posting title
- [ ] Display full posting description
- [ ] Display domain and category
- [ ] Display tags
- [ ] Display expiry date
- [ ] Display urgency flag
- [ ] Display submission date
- [ ] Use theme variables

### Submitter History Component
- [ ] Create file: `src/components/moderation/SubmitterHistory.tsx`
- [ ] Display submitter name and email
- [ ] Display total submissions count
- [ ] Display approved count
- [ ] Display rejected count
- [ ] Display recent rejections list
- [ ] Use theme variables

### AI Insights Panel Component
- [ ] Create file: `src/components/moderation/AIInsightsPanel.tsx`
- [ ] Display placeholder message ("AI insights coming soon")
- [ ] Add structure for future scam probability
- [ ] Add structure for future flags
- [ ] Add structure for future recommendations
- [ ] Use theme variables

### Rejection Form Component
- [ ] Create file: `src/components/moderation/RejectionForm.tsx`
- [ ] Add reason dropdown (SPAM, INAPPROPRIATE, DUPLICATE, SCAM, INCOMPLETE, OTHER)
- [ ] Add feedback textarea (required, 10-500 chars)
- [ ] Add moderator notes textarea (optional)
- [ ] Add character counter
- [ ] Validate on submit
- [ ] Use theme variables

### Escalation Form Component
- [ ] Create file: `src/components/moderation/EscalationForm.tsx`
- [ ] Add escalation reason dropdown (SUSPECTED_SCAM, POLICY_QUESTION, TECHNICAL_ISSUE, OTHER)
- [ ] Add escalation notes textarea (required, 10-1000 chars)
- [ ] Add character counter
- [ ] Validate on submit
- [ ] Use theme variables

### Action Handlers
- [ ] Implement handleApprove()
  - [ ] Show confirmation dialog
  - [ ] Call approve API
  - [ ] Show success toast
  - [ ] Close modal
  - [ ] Refresh queue
  - [ ] Handle errors
- [ ] Implement handleReject()
  - [ ] Validate feedback
  - [ ] Call reject API
  - [ ] Show success toast
  - [ ] Close modal
  - [ ] Refresh queue
  - [ ] Handle errors
- [ ] Implement handleEscalate()
  - [ ] Validate notes
  - [ ] Call escalate API
  - [ ] Show success toast
  - [ ] Close modal
  - [ ] Refresh queue
  - [ ] Handle errors

### Testing
- [ ] Test approve flow
- [ ] Test reject flow with all reasons
- [ ] Test escalate flow with all reasons
- [ ] Test validation errors
- [ ] Test optimistic locking (concurrent moderation)
- [ ] Test error handling
- [ ] Test theme in light/dark mode

---

## 🧪 Week 2 - Day 10: Testing & Polish (8 hours)

### Integration Tests
- [ ] Create file: `tests/integration/moderation-queue.test.js`
  - [ ] Test queue loading
  - [ ] Test filtering
  - [ ] Test sorting
  - [ ] Test pagination
  - [ ] Test queue stats
- [ ] Create file: `tests/integration/moderation-approve.test.js`
  - [ ] Test approve action
  - [ ] Test history record creation
  - [ ] Test notification sent
  - [ ] Test optimistic locking
  - [ ] Test expiry date calculation
- [ ] Create file: `tests/integration/moderation-reject.test.js`
  - [ ] Test reject action
  - [ ] Test all rejection reasons
  - [ ] Test feedback requirement
  - [ ] Test history record creation
  - [ ] Test notification sent
- [ ] Create file: `tests/integration/moderation-escalate.test.js`
  - [ ] Test escalate action
  - [ ] Test all escalation reasons
  - [ ] Test notes requirement
  - [ ] Test history record creation
  - [ ] Test admin notifications sent
- [ ] Run all tests: `npm test tests/integration/moderation-*.test.js`

### Manual Testing
- [ ] Create file: `docs/testing/moderation-workflow-test-guide.md`
- [ ] Test with admin user
- [ ] Test with moderator user
- [ ] Test approve 10 postings
- [ ] Test reject 10 postings (different reasons)
- [ ] Test escalate 5 postings
- [ ] Test concurrent moderation (two moderators)
- [ ] Test queue performance with 50+ items
- [ ] Test notification delivery
- [ ] Test email templates

### Performance Testing
- [ ] Measure queue query time (should be <100ms)
- [ ] Measure approve action time (should be <2s)
- [ ] Measure reject action time (should be <2s)
- [ ] Measure escalate action time (should be <2s)
- [ ] Optimize slow queries if needed

### Polish
- [ ] Fix any UI/UX issues found during testing
- [ ] Improve error messages
- [ ] Add helpful tooltips
- [ ] Improve loading states
- [ ] Add confirmation dialogs
- [ ] Review theme compliance

### Documentation
- [ ] Create file: `docs/progress/phase-8/task-8.12-action-8-completion-summary.md`
- [ ] Document all created files
- [ ] Document all API endpoints
- [ ] Document notification templates
- [ ] Document testing results
- [ ] Update main progress document

---

## ✅ Completion Criteria

### Functional
- [ ] Moderators can view pending postings in queue
- [ ] Queue supports filtering by domain and status
- [ ] Queue supports search by keywords
- [ ] Queue supports sorting (oldest/newest/urgent)
- [ ] Pagination works correctly
- [ ] Approve action makes posting visible
- [ ] Reject action sends feedback to user
- [ ] Escalate action notifies all admins
- [ ] Submitter history visible during review
- [ ] All actions create history records

### Technical
- [ ] All moderation actions are atomic
- [ ] Optimistic locking prevents concurrent moderation
- [ ] Notifications sent reliably
- [ ] Queue queries execute in <100ms
- [ ] Actions execute in <2 seconds
- [ ] Full audit trail in MODERATION_HISTORY
- [ ] All APIs have input validation
- [ ] All APIs have rate limiting
- [ ] All database changes use transactions

### User Experience
- [ ] Clear queue organization (urgent first)
- [ ] Easy-to-use review interface
- [ ] Helpful submitter context
- [ ] Fast approve/reject actions
- [ ] Clear feedback to authors
- [ ] Theme compliant (no hardcoded colors)
- [ ] Responsive design
- [ ] Accessible interface

### Testing
- [ ] All integration tests passing
- [ ] Manual test scenarios completed
- [ ] Performance benchmarks met
- [ ] Edge cases handled
- [ ] Concurrent moderation tested
- [ ] Notification delivery verified

### Documentation
- [ ] Completion summary created
- [ ] API endpoints documented
- [ ] Database schema documented
- [ ] Testing guide created
- [ ] User guide created (optional)

---

## 🎯 Success Checklist

Use this final checklist to confirm Action 8 is complete:

- [ ] All 15 files created (backend + frontend + tests + docs)
- [ ] All 5 API endpoints working
- [ ] Database schema updated and tested
- [ ] Complete moderation workflow functional
- [ ] All notifications sending correctly
- [ ] All integration tests passing
- [ ] Manual testing completed successfully
- [ ] Performance benchmarks met
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] No hardcoded colors (theme compliant)
- [ ] No lint errors
- [ ] Ready for production deployment

---

## 📊 Expected File Count

**Backend (6 files):**
1. migrations/add-moderation-schema.js
2. server/routes/moderation.js
3. src/schemas/validation/moderation.ts
4. server/services/moderationNotification.js
5. server/templates/moderation-approval.html
6. server/templates/moderation-rejection.html

**Frontend (10 files):**
1. src/pages/moderator/ModerationQueuePage.tsx
2. src/components/moderation/ModerationStats.tsx
3. src/components/moderation/QueueFilters.tsx
4. src/components/moderation/PostingQueueList.tsx
5. src/components/moderation/PostingQueueItem.tsx
6. src/components/moderation/PostingReviewModal.tsx
7. src/components/moderation/PostingDetailsView.tsx
8. src/components/moderation/SubmitterHistory.tsx
9. src/components/moderation/AIInsightsPanel.tsx
10. src/components/moderation/RejectionForm.tsx
11. src/components/moderation/EscalationForm.tsx

**Testing (5 files):**
1. tests/integration/moderation-queue.test.js
2. tests/integration/moderation-approve.test.js
3. tests/integration/moderation-reject.test.js
4. tests/integration/moderation-escalate.test.js
5. docs/testing/moderation-workflow-test-guide.md

**Documentation (2 files):**
1. docs/progress/phase-8/task-8.12-action-8-completion-summary.md
2. server/templates/moderation-escalation.html (email template)
3. server/templates/admin-escalation-alert.html (email template)

**Total: 23-24 new files**

---

## 🚀 Let's Build!

**Estimated Time:** 2 weeks (80 hours)  
**Expected Completion:** ~November 17, 2025  
**Status:** Ready to start  
**Prerequisites:** ✅ All met  

**First Command:**
```powershell
# Create database migration script
New-Item -ItemType File -Path "migrations\add-moderation-schema.js"
```

**Good luck and happy coding!** 🎉


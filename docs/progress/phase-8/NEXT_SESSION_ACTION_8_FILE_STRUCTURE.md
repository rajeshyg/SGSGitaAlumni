# 📂 Action 8: Moderator Review System - File Structure & Checklist

## 📂 File Structure Summary

### New Files to Create (Total: ~15 files)

**Database:**
```
migrations/
  └── add-moderation-schema.js                  # Database migration
```

**Backend:**
```
server/routes/
  └── moderation.js                             # Moderation API routes

src/schemas/validation/
  └── moderation.ts                             # Zod validation schemas

server/services/
  └── moderationNotification.js                 # Notification service
```

**Frontend:**
```
src/pages/moderator/
  └── ModerationQueuePage.tsx                   # Main queue page

src/components/moderation/
  ├── ModerationStats.tsx                       # Stats dashboard
  ├── QueueFilters.tsx                          # Filter controls
  ├── PostingQueueList.tsx                      # Queue list
  ├── PostingQueueItem.tsx                      # Queue item card
  ├── PostingReviewModal.tsx                    # Review modal
  ├── PostingDetailsView.tsx                    # Posting details
  ├── SubmitterHistory.tsx                      # User history
  ├── AIInsightsPanel.tsx                       # AI insights (placeholder)
  ├── RejectionForm.tsx                         # Rejection form
  └── EscalationForm.tsx                        # Escalation form
```

**Testing:**
```
tests/integration/
  ├── moderation-queue.test.js                  # Queue tests
  ├── moderation-approve.test.js                # Approve flow tests
  ├── moderation-reject.test.js                 # Reject flow tests
  └── moderation-escalate.test.js               # Escalate flow tests

docs/testing/
  └── moderation-workflow-test-guide.md         # Manual test guide
```

**Documentation:**
```
docs/progress/phase-8/
  └── task-8.12-action-8-completion-summary.md  # Completion doc (end of task)
```

## 🎯 Success Checklist

Use this checklist to track progress:

### Week 1: Backend
- [ ] MODERATION_HISTORY table created
- [ ] POSTINGS table updated with moderation columns
- [ ] Indexes created for performance
- [ ] GET /api/moderation/queue endpoint working
- [ ] Queue filtering/sorting/pagination working
- [ ] POST /api/moderation/approve endpoint working
- [ ] POST /api/moderation/reject endpoint working
- [ ] POST /api/moderation/escalate endpoint working
- [ ] GET /api/moderation/posting/:id endpoint working
- [ ] Optimistic locking implemented
- [ ] Transaction handling verified
- [ ] Approval notifications sending
- [ ] Rejection notifications sending
- [ ] Escalation notifications sending

### Week 2: Frontend
- [ ] ModerationQueuePage component created
- [ ] Stats dashboard showing metrics
- [ ] Filter controls working
- [ ] Sort controls working
- [ ] Pagination working
- [ ] PostingReviewModal component created
- [ ] Posting details displayed
- [ ] Submitter history displayed
- [ ] Rejection form with validation
- [ ] Escalation form with validation
- [ ] Approve action working
- [ ] Reject action working
- [ ] Escalate action working
- [ ] Confirmation dialogs implemented
- [ ] Error handling complete
- [ ] Theme compliance verified
- [ ] Integration tests written
- [ ] Manual test guide created
- [ ] Performance benchmarks met

## 📊 Expected Outcomes

### By End of Week 1
- Complete backend moderation system
- All 5 API endpoints working
- Database schema updated
- Notification system functional
- Basic integration tests passing

### By End of Week 2
- Complete frontend moderation UI
- Review modal fully functional
- Queue with filters/sort/pagination
- All user flows tested
- Documentation complete

### Final Deliverables
- 15+ new files (backend, frontend, tests, docs)
- 5 API endpoints protected with rate limiting
- Complete moderation workflow
- Comprehensive test coverage
- User-friendly moderation interface
- Full audit trail in database
- Reliable notification system

## 🔗 Code Examples Reference
- `server/routes/invitation.js` - Similar API route structure
- `src/pages/admin/AlumniMemberManagement.tsx` - Similar admin UI pattern
- `src/components/family/FamilyDashboard.tsx` - Dashboard UI pattern
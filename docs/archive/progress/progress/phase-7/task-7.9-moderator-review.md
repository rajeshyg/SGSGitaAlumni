# Task 7.9: Moderator Review System

**Status:** ✅ Complete
**Priority:** High
**Duration:** 2 weeks (Completed November 2025)
**Parent Task:** Phase 7 - Business Features
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 6

## Overview
Implement complete moderator review workflow for posting approval/rejection, enabling moderators to review user-submitted postings before they appear publicly. This system includes a review queue, approval/rejection APIs, notification system, and scam detection workflows.

**Functional Requirement:** All postings (job postings, mentorship opportunities, help requests) must be reviewed by moderators before becoming visible to other users.

## Functional Requirements

### Review Queue Features

#### Queue View
- **Display:** List of pending postings awaiting moderation
- **Filtering:** By domain, category, submission date, urgency
- **Sorting:** Oldest first, newest first, by domain
- **Search:** By title, description keywords, submitter name
- **Pagination:** 20 items per page
- **Indicators:** Urgent postings highlighted, age of submission shown

#### Posting Detail View
- **Content:** Full posting details (title, description, domain, tags)
- **Metadata:** Submitter info, submission date, last modified
- **History:** Previous moderator actions on this user's postings
- **AI Insights:** Automated scam detection warnings (if available)
- **Actions:** Approve, Reject, Escalate buttons

### Moderation Actions

#### 1. Approve Posting
```typescript
interface ApprovalAction {
  postingId: string;
  moderatorId: string;
  approvedAt: Date;
  moderatorNotes?: string; // Optional internal notes
  expiryDate: Date; // Set to MAX(user_date, submission_date + 30 days)
}
```

#### 2. Reject Posting
```typescript
interface RejectionAction {
  postingId: string;
  moderatorId: string;
  rejectedAt: Date;
  reason: 'SPAM' | 'INAPPROPRIATE' | 'DUPLICATE' | 'SCAM' | 'INCOMPLETE' | 'OTHER';
  feedbackToUser: string; // Required - explains why rejected
  moderatorNotes?: string; // Optional internal notes
}
```

#### 3. Escalate to Admin
```typescript
interface EscalationAction {
  postingId: string;
  moderatorId: string;
  escalatedAt: Date;
  escalationReason: 'SUSPECTED_SCAM' | 'POLICY_QUESTION' | 'TECHNICAL_ISSUE' | 'OTHER';
  escalationNotes: string; // Required explanation
}
```

### Notification System

#### To Posting Author
- **On Approval:** "Your posting '[Title]' has been approved and is now live!"
- **On Rejection:** "Your posting '[Title]' was not approved. Reason: [Feedback]. You can edit and resubmit."
- **On Escalation:** "Your posting '[Title]' is under additional review. You'll be notified soon."

#### To Moderators
- **New Submission:** "New posting submitted in [Domain] - requires review"
- **Escalation:** Email to all admins when posting escalated
- **Daily Summary:** Email digest of pending items

## Technical Requirements

### Database Schema Updates

```sql
-- Add moderation status to POSTINGS table
ALTER TABLE POSTINGS 
  ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'PENDING' CHECK (moderation_status IN ('PENDING', 'APPROVED', 'REJECTED', 'ESCALATED')),
  ADD COLUMN moderated_by UUID REFERENCES app_users(id),
  ADD COLUMN moderated_at TIMESTAMP,
  ADD COLUMN rejection_reason VARCHAR(50),
  ADD COLUMN moderator_feedback TEXT,
  ADD COLUMN moderator_notes TEXT;

-- Create moderation history table
CREATE TABLE MODERATION_HISTORY (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posting_id UUID NOT NULL REFERENCES POSTINGS(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL REFERENCES app_users(id),
  action VARCHAR(20) NOT NULL CHECK (action IN ('APPROVE', 'REJECT', 'ESCALATE')),
  reason VARCHAR(50),
  feedback_to_user TEXT,
  moderator_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_moderation_posting (posting_id),
  INDEX idx_moderation_moderator (moderator_id),
  INDEX idx_moderation_action (action, created_at)
);

-- Create moderation queue view
CREATE VIEW moderation_queue AS
SELECT 
  p.id,
  p.title,
  p.description,
  p.domain_id,
  p.category_id,
  p.created_by,
  p.created_at,
  p.is_urgent,
  p.moderation_status,
  au.first_name || ' ' || au.last_name as submitter_name,
  au.email as submitter_email,
  d.domain_name,
  c.category_name,
  EXTRACT(HOUR FROM (NOW() - p.created_at)) as hours_pending
FROM POSTINGS p
  JOIN app_users au ON p.created_by = au.id
  JOIN DOMAINS d ON p.domain_id = d.id
  JOIN CATEGORIES c ON p.category_id = c.id
WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
ORDER BY 
  CASE WHEN p.is_urgent THEN 0 ELSE 1 END,
  p.created_at ASC;
```

### API Endpoints

#### GET /api/moderation/queue
```typescript
// Query parameters
interface QueueQueryParams {
  page?: number;
  limit?: number;
  domain?: string;
  status?: 'PENDING' | 'ESCALATED';
  search?: string;
  sortBy?: 'oldest' | 'newest' | 'urgent';
}

// Response
interface QueueResponse {
  success: true;
  data: {
    postings: ModerationQueueItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      pendingCount: number;
      escalatedCount: number;
      avgReviewTimeHours: number;
    };
  };
}
```

#### GET /api/moderation/posting/:id
```typescript
// Get full posting details for moderation
interface PostingDetailResponse {
  success: true;
  data: {
    posting: FullPostingDetails;
    submitter: UserProfile;
    submitterHistory: {
      totalSubmissions: number;
      approvedCount: number;
      rejectedCount: number;
      recentRejections: RejectionSummary[];
    };
    aiInsights?: {
      scamProbability: number;
      flags: string[];
      recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
    };
  };
}
```

#### POST /api/moderation/approve
```typescript
// Request
interface ApproveRequest {
  postingId: string;
  moderatorNotes?: string;
  expiryDate?: string; // Optional override
}

// Response
interface ApproveResponse {
  success: true;
  data: {
    posting: UpdatedPosting;
    notificationSent: boolean;
  };
}
```

#### POST /api/moderation/reject
```typescript
// Request
interface RejectRequest {
  postingId: string;
  reason: 'SPAM' | 'INAPPROPRIATE' | 'DUPLICATE' | 'SCAM' | 'INCOMPLETE' | 'OTHER';
  feedbackToUser: string;
  moderatorNotes?: string;
}

// Response
interface RejectResponse {
  success: true;
  data: {
    posting: UpdatedPosting;
    notificationSent: boolean;
  };
}
```

#### POST /api/moderation/escalate
```typescript
// Request
interface EscalateRequest {
  postingId: string;
  escalationReason: 'SUSPECTED_SCAM' | 'POLICY_QUESTION' | 'TECHNICAL_ISSUE' | 'OTHER';
  escalationNotes: string;
}

// Response
interface EscalateResponse {
  success: true;
  data: {
    posting: UpdatedPosting;
    adminNotificationsSent: number;
  };
}
```

### Frontend Components

#### ModerationQueuePage.tsx
```typescript
// Location: src/pages/moderator/ModerationQueuePage.tsx

export function ModerationQueuePage() {
  const [postings, setPostings] = useState<ModerationQueueItem[]>([]);
  const [filters, setFilters] = useState<QueueFilters>({});
  const [stats, setStats] = useState<QueueStats | null>(null);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Moderation Queue</h1>
      
      {/* Stats Cards */}
      <ModerationStats stats={stats} />
      
      {/* Filters */}
      <QueueFilters 
        filters={filters} 
        onChange={setFilters} 
      />
      
      {/* Posting List */}
      <PostingQueue 
        postings={postings}
        onReview={handleReview}
      />
    </div>
  );
}
```

#### PostingReviewModal.tsx
```typescript
// Location: src/components/moderation/PostingReviewModal.tsx

export function PostingReviewModal({ posting, onClose, onAction }) {
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'ESCALATE' | null>(null);
  const [feedback, setFeedback] = useState('');

  return (
    <Dialog open onClose={onClose}>
      <DialogContent className="max-w-4xl">
        {/* Posting Details */}
        <PostingDetailsView posting={posting} />
        
        {/* Submitter History */}
        <SubmitterHistory userId={posting.created_by} />
        
        {/* AI Insights (if available) */}
        {posting.aiInsights && (
          <AIInsightsPanel insights={posting.aiInsights} />
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-4 mt-6">
          <Button 
            onClick={() => handleApprove()} 
            className="bg-green-600"
          >
            Approve
          </Button>
          <Button 
            onClick={() => setAction('REJECT')} 
            className="bg-red-600"
          >
            Reject
          </Button>
          <Button 
            onClick={() => setAction('ESCALATE')} 
            className="bg-yellow-600"
          >
            Escalate
          </Button>
        </div>
        
        {/* Rejection/Escalation Form */}
        {action === 'REJECT' && (
          <RejectionForm 
            onSubmit={handleReject} 
            onCancel={() => setAction(null)} 
          />
        )}
        {action === 'ESCALATE' && (
          <EscalationForm 
            onSubmit={handleEscalate} 
            onCancel={() => setAction(null)} 
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

## Implementation Plan

### Week 1: Backend Foundation

#### Day 1-2: Database & API Setup
- [ ] Create MODERATION_HISTORY table
- [ ] Add moderation columns to POSTINGS table
- [ ] Create moderation_queue view
- [ ] Set up moderation API routes

#### Day 3-4: Approval/Rejection Logic
- [ ] Implement approve endpoint
- [ ] Implement reject endpoint
- [ ] Implement escalate endpoint
- [ ] Add transaction handling for atomic updates

#### Day 5: Notification System
- [ ] Create notification templates
- [ ] Implement approval notifications
- [ ] Implement rejection notifications
- [ ] Implement escalation notifications

### Week 2: Frontend & Testing

#### Day 6-7: Queue UI
- [ ] Create ModerationQueuePage
- [ ] Implement queue filters and sorting
- [ ] Add stats dashboard
- [ ] Implement pagination

#### Day 8-9: Review Modal
- [ ] Create PostingReviewModal
- [ ] Implement submitter history display
- [ ] Add rejection/escalation forms
- [ ] Implement action handlers

#### Day 10: Testing & Polish
- [ ] Integration tests for moderation flow
- [ ] Test notification delivery
- [ ] Test edge cases (concurrent moderation)
- [ ] Performance testing for large queues

## Success Criteria

### Functional
- [ ] Moderators can view pending postings in queue
- [ ] Queue supports filtering, sorting, search
- [ ] Approve action makes posting visible
- [ ] Reject action sends feedback to user
- [ ] Escalate action notifies admins
- [ ] Submitter history visible during review

### Technical
- [ ] All moderation actions are atomic (transactions)
- [ ] Concurrent moderation prevented (optimistic locking)
- [ ] Notifications sent reliably
- [ ] Queue queries optimized (<100ms)
- [ ] History preserved for audit trail

### User Experience
- [ ] Clear queue organization (urgent items first)
- [ ] Easy-to-use review interface
- [ ] Helpful submitter context during review
- [ ] Fast approve/reject actions (<2 seconds)
- [ ] Clear feedback to posting authors

## Testing Checklist

### Unit Tests
- [ ] Approve action updates posting status
- [ ] Reject action creates history record
- [ ] Escalate action sends admin notifications
- [ ] Queue filtering works correctly
- [ ] Expiry date calculation correct

### Integration Tests
- [ ] Approve flow: pending → approved → visible
- [ ] Reject flow: pending → rejected → notification sent
- [ ] Escalate flow: pending → escalated → admin notified
- [ ] Concurrent moderation: two moderators can't act on same posting
- [ ] Queue refresh after action

### Manual Tests
- [ ] Test with 50+ pending postings
- [ ] Test urgency sorting
- [ ] Test rejection with different reasons
- [ ] Test escalation to admins
- [ ] Test notification email delivery

## Dependencies

### Required Before Starting
- [Task 8.2.5: API Input Validation](../phase-8/task-8.2.5-api-validation.md) - Validation complete
- [Task 7.7: Domain Taxonomy System](./task-7.7-domain-taxonomy-system.md) - Domains and categories exist
- Moderator role created in USER_ROLES table

### Blocks These Tasks
- Content moderation quality improvements
- Scam detection AI integration
- Moderator performance analytics

## Related Documentation
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Master plan
- [Requirements Doc](../../functional-requirements/Gita%20Connect%20Application%20-%20Requirements%20document.md) - Moderation requirements
- [Phase 7 README](./README.md) - Phase overview

---

*This task enables human oversight of all user-generated content, ensuring quality and safety on the platform.*

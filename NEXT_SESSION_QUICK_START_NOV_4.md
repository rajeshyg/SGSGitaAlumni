# Quick Start Guide - Next Session (November 4, 2025)

## ✅ Bugs Fixed - Ready to Continue

Both critical moderation queue bugs have been **RESOLVED**:
1. ✅ Backend API validation (500 errors) - FIXED
2. ✅ Frontend Select component (Radix UI) - Already correct

**Test Status:** 7/7 automated tests passing (100% success rate)

---

## 🚀 Action 8 - Current Status

**Phase:** Week 1 - Backend Foundation  
**Progress:** 60% complete

### Completed ✅
- Database schema (MODERATION_HISTORY table)
- API endpoints (queue, approve, reject, escalate, posting details)
- Input validation with Zod schemas
- Queue filtering, sorting, pagination
- Optimistic locking for concurrent moderation

### Remaining for Week 1 🟡
1. **Email notifications** (Day 5 - 1 day)
   - Send approval notifications to posting authors
   - Send rejection notifications with feedback
   - Send escalation notifications to admins
   - File: `server/utils/email.js` or similar

2. **End-to-end testing** (1 day)
   - Create test postings: `node create-test-postings.js`
   - Test full moderation workflow
   - Verify notifications are sent

---

## 📋 Immediate Next Steps

### Step 1: Verify Bug Fixes (15 minutes)
```powershell
# Start servers if not running
npm run dev:server  # Terminal 1
npm run dev         # Terminal 2

# Navigate to moderation queue page
# http://localhost:5173/moderator/queue

# Test all status filter options:
# - All Statuses
# - Pending
# - Escalated

# Verify: No React errors, API returns 200 OK
```

### Step 2: Run Automated Tests (5 minutes)
```powershell
# Test Zod schema validation
node test-queue-schema.js

# Expected: All 7 tests pass
```

### Step 3: Create Test Data (10 minutes)
```powershell
# Create sample postings for moderation queue
node create-test-postings.js

# Verify data in database
```

### Step 4: Begin Email Notifications (Main Task)
See detailed plan below ⬇️

---

## 🎯 Priority Task: Email Notifications

### Overview
Implement email notifications for moderation actions (approve, reject, escalate).

### Implementation Plan

#### 1. Setup Email Service (30 minutes)

**Option A: Nodemailer (Recommended for development)**
```javascript
// server/utils/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@sgsgita.com',
    to,
    subject,
    html
  });
};
```

**Option B: AWS SES (Production)**
```javascript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
// See AWS_SETUP.md for configuration
```

#### 2. Create Email Templates (1 hour)

**File:** `server/templates/moderation-emails.js`

```javascript
export const approvalEmailTemplate = (posting, moderatorName) => ({
  subject: `Your posting "${posting.title}" has been approved`,
  html: `
    <h2>Good news!</h2>
    <p>Your posting has been approved and is now visible to alumni.</p>
    <h3>Posting Details:</h3>
    <ul>
      <li><strong>Title:</strong> ${posting.title}</li>
      <li><strong>Type:</strong> ${posting.posting_type}</li>
      <li><strong>Expires:</strong> ${posting.expires_at}</li>
    </ul>
    <p>Thank you for contributing to the SGS Gita Alumni community!</p>
  `
});

export const rejectionEmailTemplate = (posting, reason, feedback) => ({
  subject: `Your posting "${posting.title}" requires revision`,
  html: `
    <h2>Posting Feedback</h2>
    <p>Your posting could not be approved at this time.</p>
    <h3>Reason:</h3>
    <p><strong>${reason}</strong></p>
    <h3>Feedback:</h3>
    <p>${feedback}</p>
    <p>Please revise and resubmit your posting.</p>
  `
});

export const escalationEmailTemplate = (posting, reason, notes) => ({
  subject: `[ADMIN REVIEW] Posting escalated: "${posting.title}"`,
  html: `
    <h2>Posting Escalated for Admin Review</h2>
    <h3>Reason:</h3>
    <p><strong>${reason}</strong></p>
    <h3>Moderator Notes:</h3>
    <p>${notes}</p>
    <p><a href="${process.env.APP_URL}/moderator/queue">Review Now</a></p>
  `
});
```

#### 3. Update API Routes (30 minutes)

**File:** `server/routes/moderation.js`

Replace the placeholder `sendModerationNotification` function:

```javascript
import { sendEmail } from '../utils/email.js';
import { 
  approvalEmailTemplate, 
  rejectionEmailTemplate,
  escalationEmailTemplate 
} from '../templates/moderation-emails.js';

// In approve endpoint (after line 273):
const [authorData] = await connection.query(
  'SELECT email, first_name FROM app_users WHERE id = ?',
  [posting.author_id]
);

await sendEmail(
  authorData[0].email,
  ...Object.values(approvalEmailTemplate(posting, req.user.first_name))
);

// Similar updates for reject and escalate endpoints
```

#### 4. Test Email Notifications (30 minutes)

```powershell
# Test approval notification
# 1. Go to moderation queue
# 2. Click on a posting
# 3. Click "Approve"
# 4. Check email inbox for approval notification

# Test rejection notification
# 1. Select another posting
# 2. Click "Reject" with reason and feedback
# 3. Check email for rejection notification

# Test escalation notification
# 1. Select a posting
# 2. Click "Escalate to Admin"
# 3. Check admin email for escalation notification
```

---

## 📁 Files to Work With

### Primary Files (Action 8)
```
server/routes/moderation.js          # API endpoints (DONE ✅)
server/utils/email.js                # Create this ⬅️ NEXT
server/templates/moderation-emails.js # Create this ⬅️ NEXT
.env                                 # Add SMTP config ⬅️ NEXT

src/components/moderation/PostingReviewModal.tsx  # Week 2
src/pages/moderator/ModerationQueuePage.tsx       # Week 2
```

### Reference Files
```
BUG_FIX_MODERATION_QUEUE_COMPLETE.md  # Bug fix summary
test-queue-schema.js                   # Schema validation tests
test-moderation-queue-fix.md           # Manual testing guide
```

---

## 🔧 Environment Variables Needed

Add to `.env`:
```bash
# Email Configuration (for development - use Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@sgsgita.com

# App URL (for email links)
APP_URL=http://localhost:5173
```

**Gmail App Password Setup:**
1. Go to Google Account settings
2. Security → 2-Step Verification
3. App passwords → Generate new password
4. Use this password in SMTP_PASS

---

## 📊 Progress Tracking

### Task 8.12 Overall Progress
- ✅ Actions 1-7: Complete (6/15 = 40%)
- 🟡 Action 8: In Progress (Week 1 at 60%)
- 🟡 Actions 9-16: Pending (9/15 = 60%)

### Action 8 Weekly Progress
- ✅ Week 1 Days 1-4: Backend foundation (60% done)
- 🟡 Week 1 Day 5: Email notifications (TODAY)
- 🟡 Week 2: Frontend components
- 🟡 Week 2: Integration & testing

---

## ⚠️ Important Notes

1. **Server Must Be Restarted** after modifying `server/routes/moderation.js`
2. **Test Data Required:** Run `create-test-postings.js` before testing
3. **Authentication Required:** Must be logged in as moderator to access queue
4. **Database Required:** MySQL must be running with proper schema

---

## 🎬 Session Kickoff Commands

```powershell
# 1. Navigate to project
cd c:\React-Projects\SGSGitaAlumni

# 2. Verify bug fixes
node test-queue-schema.js

# 3. Start development servers
# Terminal 1:
npm run dev:server

# Terminal 2:
npm run dev

# 4. Open in browser
start http://localhost:5173/moderator/queue

# 5. Begin email notification implementation
code server/utils/email.js
```

---

## 📖 Key Documentation

- **Task Overview:** `docs/progress/phase-8/task-7.9-moderator-review.md`
- **Bug Fix Details:** `BUG_FIX_MODERATION_QUEUE_COMPLETE.md`
- **Testing Guide:** `test-moderation-queue-fix.md`
- **Architecture:** `ARCHITECTURE.md`
- **API Documentation:** Comments in `server/routes/moderation.js`

---

## ✨ Success Criteria for Today

By end of session, you should have:
- ✅ Email notification system configured
- ✅ Approval emails being sent
- ✅ Rejection emails being sent
- ✅ Escalation emails being sent to admins
- ✅ All three notification types tested manually

**Time Estimate:** 2-3 hours for full email notification implementation

---

**Last Updated:** November 4, 2025  
**Status:** Ready to continue Action 8 implementation  
**Blockers:** None - all critical bugs resolved

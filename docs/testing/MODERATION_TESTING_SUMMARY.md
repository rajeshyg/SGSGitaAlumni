# 🧪 Moderation Workflow Testing Summary

**Date:** November 3, 2025
**Task:** Action 8 - Moderator Review System
**Purpose:** Essential testing procedures for moderation workflow validation

---

## 📋 Quick Setup Checklist

### 1. Database Migration
```powershell
node migrations/add-moderation-schema.js
```
**Verify:** Check MODERATION_HISTORY table exists and POSTINGS has moderation columns

### 2. Test Moderator Account
```powershell
node create-test-moderator.js
```
**Verify:** User has 'moderator' role in database

### 3. Email Configuration
**Required env vars:** EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

---

## 🧪 Critical Test Scenarios

### **Test 1: Queue Loading**
```bash
# Login as moderator
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"moderator@test.com","password":"test123"}'

# Get moderation queue
curl http://localhost:3001/api/moderation/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
**Expected:** 200 status, JSON array of pending postings

### **Test 2: Approve Posting**
```bash
curl -X POST http://localhost:3001/api/moderation/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"postingId":"posting-uuid","moderatorNotes":"Approved"}'
```
**Expected:** 200 status, posting status changes to APPROVED

### **Test 3: Reject Posting**
```bash
curl -X POST http://localhost:3001/api/moderation/reject \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postingId":"posting-uuid",
    "reason":"SPAM",
    "feedbackToUser":"This appears to be spam content",
    "moderatorNotes":"Clear spam posting"
  }'
```
**Expected:** 200 status, posting status changes to REJECTED

### **Test 4: Escalate Posting**
```bash
curl -X POST http://localhost:3001/api/moderation/escalate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "postingId":"posting-uuid",
    "escalationReason":"SUSPECTED_SCAM",
    "escalationNotes":"Needs admin review"
  }'
```
**Expected:** 200 status, posting status changes to ESCALATED

---

## 🔍 Key Validation Points

### Database Changes
- [ ] POSTINGS.moderation_status defaults to 'PENDING'
- [ ] MODERATION_HISTORY table exists with proper indexes
- [ ] Foreign key constraints working
- [ ] Optimistic locking (version column) implemented

### API Endpoints
- [ ] GET /api/moderation/queue returns paginated results
- [ ] POST /api/moderation/approve updates posting and creates history
- [ ] POST /api/moderation/reject updates posting and creates history
- [ ] POST /api/moderation/escalate updates posting and creates history
- [ ] GET /api/moderation/posting/:id returns full posting details

### Security & Authorization
- [ ] Non-moderator users get 403 Forbidden
- [ ] JWT authentication required for all endpoints
- [ ] Role-based access control working
- [ ] Rate limiting applied to moderation endpoints

### Notifications
- [ ] Approval emails sent to posting authors
- [ ] Rejection emails include feedback
- [ ] Escalation notifications sent to admins
- [ ] Email delivery logged and tracked

---

## 🚨 Common Issues & Fixes

### Issue: 403 Forbidden
**Cause:** User not moderator role
**Fix:** Run `node create-test-moderator.js` or update user role in database

### Issue: Empty Queue
**Cause:** No pending postings
**Fix:** Create test postings with `node create-test-postings.js`

### Issue: Email Not Sending
**Cause:** Email config missing
**Fix:** Set EMAIL_* environment variables

### Issue: Database Errors
**Cause:** Migration not run
**Fix:** Run `node migrations/add-moderation-schema.js`

---

## 📊 Performance Benchmarks

- **Queue Load:** < 100ms for 50 postings
- **Moderation Action:** < 2 seconds (including notification)
- **Concurrent Moderators:** Support 10+ simultaneous moderators
- **Database Queries:** Optimized with proper indexes

---

## ✅ Success Criteria

- [ ] All API endpoints return 200 status codes
- [ ] Database transactions complete successfully
- [ ] Posting statuses update correctly
- [ ] History records created for all actions
- [ ] Notifications sent (if email configured)
- [ ] No errors in application logs
- [ ] Performance meets benchmarks

---

*Use this guide to validate the moderation system works end-to-end before proceeding to UI development.*
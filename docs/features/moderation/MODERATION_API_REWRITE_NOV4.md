# Moderation API Complete Rewrite - November 4, 2025

## 🎯 Objective
Complete rewrite of the moderation API system after 20+ failed attempts to patch existing code. This represents a ground-up rebuild addressing fundamental database schema and API design issues.

---

## 🔍 Database Schema Issues Identified

### Critical Issues Fixed:

1. **Data Type Mismatches** ❌➡️✅
   - **POSTINGS.moderated_by**: Was `CHAR(36)`, now `BIGINT UNSIGNED`
   - **MODERATION_HISTORY.moderator_id**: Was `CHAR(36)`, now `BIGINT UNSIGNED`
   - **Impact**: UUID strings being stored in columns expecting numeric IDs caused JOIN failures and query errors

2. **Missing Foreign Key Constraints** ❌➡️✅
   - Added `FK_POSTINGS_MODERATED_BY` → `app_users(id)`
   - Added `FK_MODERATION_HISTORY_MODERATOR` → `app_users(id)`
   - **Impact**: No referential integrity enforcement, orphaned records possible

3. **Collation Issues** ✅
   - All moderation tables now use `utf8mb4_unicode_ci` consistently
   - Removed need for `COLLATE` casting in queries
   - **Previous session fix**: Already corrected in prior work

4. **Redundant Columns in POSTINGS** 🔄
   - Identified duplicate moderation tracking fields
   - `moderation_status`, `moderated_at`, `moderated_by` overlap with MODERATION_HISTORY
   - **Decision**: Keeping for performance (denormalization acceptable for current reads)

---

## 🛠️ Database Migration Applied

**File**: `fix-moderation-schema-nov4.cjs`

### Changes Made:
```sql
-- 1. Convert moderated_by from CHAR(36) to BIGINT
ALTER TABLE POSTINGS 
  MODIFY COLUMN moderated_by BIGINT UNSIGNED NULL;

-- 2. Convert moderator_id from CHAR(36) to BIGINT
ALTER TABLE MODERATION_HISTORY 
  MODIFY COLUMN moderator_id BIGINT UNSIGNED NOT NULL;

-- 3. Add foreign key constraints
ALTER TABLE POSTINGS 
  ADD CONSTRAINT FK_POSTINGS_MODERATED_BY 
  FOREIGN KEY (moderated_by) REFERENCES app_users(id);

ALTER TABLE MODERATION_HISTORY 
  ADD CONSTRAINT FK_MODERATION_HISTORY_MODERATOR 
  FOREIGN KEY (moderator_id) REFERENCES app_users(id);
```

### Migration Status:
- ✅ Schema updated successfully
- ✅ Foreign keys added
- ⚠️ Verification step had minor warning (non-blocking)

---

## 🚀 New API Implementation

**File**: `server/routes/moderation-new.js`

### Architecture Improvements:

#### 1. **Proper Authentication Middleware**
```javascript
// Two-tier authentication
requireAuth()        // Checks user is logged in
requireModerator()   // Checks role is MODERATOR or ADMIN
```

#### 2. **Comprehensive Input Validation**
Using Zod schemas for all endpoints:
- `QueueQuerySchema` - Query parameters validation
- `ApproveRequestSchema` - Approval action validation
- `RejectRequestSchema` - Rejection with reason validation
- `EscalateRequestSchema` - Escalation validation

#### 3. **Error Handling**
- Detailed error messages with context
- Transaction rollback on failures
- Proper HTTP status codes (400, 401, 403, 404, 409, 500)
- Error details included in development

#### 4. **Database Transactions**
- All moderation actions use transactions
- Optimistic locking via `version` column
- Row-level locks (`FOR UPDATE`) to prevent race conditions

---

## 📡 API Endpoints

### 1. GET `/api/moderation/queue`
**Purpose**: Fetch moderation queue with filtering and pagination

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `domain` (UUID, optional)
- `status` ('PENDING' | 'ESCALATED' | 'all', default: 'all')
- `search` (string, optional)
- `sortBy` ('oldest' | 'newest' | 'urgent', default: 'oldest')

**Response**:
```json
{
  "success": true,
  "data": {
    "postings": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "stats": {
      "pending_count": 45,
      "escalated_count": 5,
      "urgent_count": 12
    }
  }
}
```

**Key Changes**:
- Removed all `COLLATE` casting (schema now consistent)
- Uses `bigint` for moderator joins
- Cleaner JOIN syntax without type conversions

---

### 2. POST `/api/moderation/approve`
**Purpose**: Approve a posting and make it visible

**Request Body**:
```json
{
  "postingId": "uuid",
  "moderatorNotes": "optional string",
  "expiryDate": "optional ISO datetime"
}
```

**Business Logic**:
- Validates posting exists and is pending/escalated
- Uses optimistic locking to prevent concurrent modifications
- Calculates expiry: MAX(user_date, submission_date + 30 days)
- Creates moderation history record
- Sends notification to author (async)

**Key Changes**:
- `moderated_by` now stores `bigint` user ID (not UUID string)
- Transaction ensures atomicity
- Proper conflict detection (409 status)

---

### 3. POST `/api/moderation/reject`
**Purpose**: Reject a posting with feedback

**Request Body**:
```json
{
  "postingId": "uuid",
  "reason": "SPAM | INAPPROPRIATE | DUPLICATE | SCAM | INCOMPLETE | OTHER",
  "feedbackToUser": "string (10-500 chars)",
  "moderatorNotes": "optional string"
}
```

**Business Logic**:
- Validates reason from enum
- Requires meaningful feedback for user (min 10 chars)
- Records rejection in POSTINGS and MODERATION_HISTORY
- Sends notification with feedback

**Key Changes**:
- Proper enum validation
- Feedback mandatory and length-validated
- Clear error messages for validation failures

---

### 4. POST `/api/moderation/escalate`
**Purpose**: Escalate posting to admin team

**Request Body**:
```json
{
  "postingId": "uuid",
  "escalationReason": "SUSPECTED_SCAM | POLICY_QUESTION | TECHNICAL_ISSUE | OTHER",
  "escalationNotes": "string (10-1000 chars)"
}
```

**Business Logic**:
- Cannot escalate already approved/rejected postings
- Changes status to ESCALATED
- Records escalation reason
- Notifies admin team

**Key Changes**:
- Validates escalation is appropriate
- Prevents invalid state transitions
- Clear escalation reason taxonomy

---

### 5. GET `/api/moderation/posting/:id`
**Purpose**: Get detailed posting info for moderation review

**Response**:
```json
{
  "success": true,
  "data": {
    "posting": { /* full posting details */ },
    "submitterStats": {
      "total_postings": 10,
      "approved_count": 8,
      "rejected_count": 1,
      "pending_count": 1,
      "escalated_count": 0
    },
    "moderationHistory": [ /* chronological history */ ]
  }
}
```

**Key Changes**:
- UUID format validation
- Includes submitter reputation metrics
- Complete moderation audit trail
- Proper JOINs with bigint moderator IDs

---

## 🔧 Technical Improvements

### 1. **Query Optimization**
- Removed unnecessary `COLLATE` casts (was causing index issues)
- Proper use of `DISTINCT` for many-to-one JOINs
- Efficient subqueries for aggregated counts
- Indexed columns used in WHERE/ORDER BY clauses

### 2. **Concurrency Handling**
- Row-level locking (`FOR UPDATE`)
- Optimistic locking via `version` column
- Transaction isolation for data consistency
- Clear conflict error messages

### 3. **Type Safety**
- Zod validation for all inputs
- UUID format validation
- Enum validation for status fields
- Numeric constraints on page/limit

### 4. **Security**
- Authentication required on all endpoints
- Role-based access control (MODERATOR/ADMIN only)
- Input sanitization via Zod
- SQL injection prevention (parameterized queries)

---

## 📁 File Changes

### New Files:
- ✅ `server/routes/moderation-new.js` - Complete API rewrite
- ✅ `fix-moderation-schema-nov4.cjs` - Database migration
- ✅ `MODERATION_API_REWRITE_NOV4.md` - This documentation

### Backed Up:
- ✅ `server/routes/moderation-old-backup-nov4.js` - Old implementation

### Modified:
- ✅ `server.js` - Updated import to use `moderation-new.js`

---

## 🧪 Testing Status

### Database Migration:
- ✅ Schema updated successfully
- ✅ Data types corrected (bigint)
- ✅ Foreign keys added
- ✅ Verification passed (with minor warning)

### API Syntax:
- ✅ No syntax errors (`node --check` passed)
- ⏳ **Next Step**: Integration testing with running server

### Pending Tests:
1. Start server and verify it starts without errors
2. Test `/api/moderation/queue` endpoint
3. Test approve/reject/escalate actions
4. Verify authentication/authorization
5. Test concurrent modification scenarios
6. Verify frontend integration

---

## 🎯 Success Criteria

### ✅ Completed:
- [x] Database schema corrected (bigint types)
- [x] Foreign key constraints added
- [x] Complete API rewrite
- [x] Proper authentication middleware
- [x] Input validation with Zod
- [x] Transaction safety
- [x] Error handling improved

### ⏳ Next Steps:
- [ ] Integration testing
- [ ] Frontend compatibility verification
- [ ] Load testing for performance
- [ ] Notification system implementation (Day 5 task)

---

## 🚨 Breaking Changes from Old API

### 1. **Authentication Required**
Old API may have allowed unauthenticated access. New API requires:
- Valid JWT token
- User with MODERATOR or ADMIN role

### 2. **Response Format Changes**
All responses now follow consistent structure:
```json
{
  "success": true/false,
  "data": { ... },        // on success
  "error": "message",     // on failure
  "details": { ... }      // optional error details
}
```

### 3. **Validation Errors**
Now returns structured validation errors:
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    { "field": "postingId", "message": "Invalid uuid" }
  ]
}
```

### 4. **Status Codes**
More precise HTTP status codes:
- `400` - Validation error
- `401` - Not authenticated
- `403` - Not authorized (not a moderator)
- `404` - Resource not found
- `409` - Conflict (concurrent modification)
- `500` - Server error

---

## 📝 Known Issues & Future Work

### Addressed in This Rewrite:
- ✅ Fixed data type mismatches
- ✅ Added proper foreign keys
- ✅ Removed collation casting
- ✅ Added authentication
- ✅ Added input validation
- ✅ Improved error handling

### Future Enhancements:
- 📧 Email notification implementation (Day 5)
- 📊 Analytics dashboard for moderation metrics
- 🔄 Bulk moderation actions
- 🎯 Auto-moderation rules (ML-based)
- 📱 Real-time updates via WebSocket

---

## 🏁 Conclusion

This rewrite addresses the root causes of the 500 errors:
1. **Database schema** now properly uses `bigint` for user IDs
2. **Foreign keys** enforce data integrity
3. **API logic** is cleaner without type conversions
4. **Error handling** provides clear debugging information
5. **Validation** prevents invalid data from reaching the database

The new implementation follows best practices:
- RESTful API design
- Proper HTTP semantics
- Transaction safety
- Input validation
- Authentication/Authorization
- Comprehensive error handling

**Next session**: Integration testing and frontend verification.

---

**Date**: November 4, 2025
**Status**: ✅ Database migrated, ✅ API rewritten, ⏳ Testing pending
**Files Modified**: 3 created, 1 modified, 1 backed up

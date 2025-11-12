# Chat API Error Fixes - November 11, 2025

## Overview
Fixed three critical errors in the chat/messaging system that were preventing proper conversation creation and participant management in `PostingDetailPage.tsx`.

## Issues Identified

### Issue 1: Duplicate Key Error on Conversation Creation
**Error:** `ER_DUP_ENTRY` - Duplicate entry for key `idx_unique_active_posting_type`

**Root Cause:**
- The database has a unique constraint `idx_unique_active_posting_type` that prevents multiple active conversations with the same `(posting_id, type)` combination
- When users tried to create a second DIRECT or GROUP conversation for the same posting, it violated this constraint
- The frontend attempted to check for existing conversations before creating new ones, but the check was incomplete

**Location:** `server/services/chatService.js` - `createConversation()` function

**Fix Applied:**
Added pre-creation checks in `createConversation()` to detect existing conversations:
- For DIRECT conversations: Check if same participants + posting already have a conversation
- For GROUP conversations: Prevent duplicates entirely, return existing conversation
- If existing conversation found, return it instead of creating a new one

```javascript
// Check if a conversation with the same posting_id and type already exists
if (postingId) {
  const [existing] = await connection.execute(
    `SELECT c.* FROM CONVERSATIONS c
     WHERE c.posting_id = ? AND c.type = ? AND c.is_archived = FALSE`,
    [postingId, type]
  );

  if (existing.length > 0) {
    // For DIRECT: check same participants
    // For GROUP: return existing
    // ... validation logic ...
  }
}
```

### Issue 2: 404 Error on GET Direct Conversation
**Error:** `No direct conversation found for this posting` (404)

**Root Cause:**
- Frontend correctly checked for existing conversations before creating new ones
- 404 was expected behavior when no conversation existed
- However, this was coupled with Issue 1, making it impossible to create the conversation after the 404

**Location:** `src/pages/PostingDetailPage.tsx` - `handleMessageAuthor()` function

**Status:** 
✅ No fix needed - this was expected behavior. The 404 is handled correctly by the frontend's try-catch, which then proceeds to create a new conversation. Issue 1's fix resolves the downstream creation problem.

### Issue 3: Authorization Error on Group Join
**Error:** `Only admins can add participants` (500)

**Root Cause:**
- The `addParticipant()` function required the requesting user to be an ADMIN of the conversation
- When users tried to join an existing group chat, they weren't yet participants (so not admins)
- This prevented users from self-joining public group discussions

**Location:** `server/services/chatService.js` - `addParticipant()` function

**Fix Applied:**
Modified `addParticipant()` to allow self-join for GROUP conversations:
- Check if `userId === targetUserId` (self-join)
- For GROUP conversations, allow self-join without admin check
- For adding other users, still require ADMIN role
- For non-GROUP types, prevent self-join entirely

```javascript
// For GROUP conversations, allow self-join (user adding themselves)
if (userId !== targetUserId) {
  // Someone trying to add another user - must be admin
  const [participation] = await connection.execute(
    `SELECT role FROM CONVERSATION_PARTICIPANTS
     WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
    [conversationId, userId]
  );

  if (participation.length === 0 || participation[0].role !== 'ADMIN') {
    throw new Error('Only admins can add other participants');
  }
} else if (conversationType !== 'GROUP') {
  // Self-join is only allowed for GROUP conversations
  throw new Error('Cannot join this type of conversation');
}
```

## Files Modified

### 1. `server/services/chatService.js`
**Function:** `createConversation()` (Lines ~30-90)
- Added duplicate detection logic for DIRECT and GROUP conversations
- Returns existing conversation if found instead of creating duplicate
- Validates participant lists match for DIRECT conversations

**Function:** `addParticipant()` (Lines ~915-1000)
- Added conversation type check
- Allows self-join for GROUP conversations without admin requirement
- Maintains admin requirement for adding other users
- Prevents self-join for non-GROUP conversation types

## Database Constraint Context

### `idx_unique_active_posting_type` Index
**Purpose:** Ensures only one active conversation per (posting_id, type) combination

**Implementation:**
```sql
CREATE UNIQUE INDEX idx_unique_active_posting_type 
ON CONVERSATIONS ((CASE WHEN is_archived = FALSE THEN CONCAT(posting_id, '-', type) ELSE NULL END))
```

**Behavior:**
- Enforces uniqueness only for active (non-archived) conversations
- Archived conversations return NULL, which doesn't violate uniqueness
- Prevents scenarios like:
  - Multiple GROUP discussions for one posting
  - Multiple DIRECT conversations with same users on same posting

**Migration File:** `run-unique-group-chat-migration.js`

## Testing

### Test Script: `test-chat-fixes.js`
Created comprehensive test suite covering all three fixes:

**Test 1: DIRECT Conversation Duplicate Prevention**
- Creates first DIRECT conversation
- Attempts to create duplicate with same posting + participants
- ✅ Verifies existing conversation is returned (no duplicate created)

**Test 2: GROUP Conversation Duplicate Prevention**
- Creates first GROUP conversation for posting
- Attempts to create second GROUP conversation for same posting
- ✅ Verifies existing conversation is returned (no duplicate created)

**Test 3: GROUP Self-Join**
- User attempts to join existing GROUP conversation
- ✅ Verifies self-join succeeds without admin requirement

**Run Tests:**
```powershell
node test-chat-fixes.js
```

## Impact

### Before Fixes
❌ Users couldn't message post authors (duplicate key error)
❌ Users couldn't join group discussions (authorization error)
❌ Multiple conversations created for same posting (database inconsistency)

### After Fixes
✅ Direct messaging works correctly
✅ Users can self-join group discussions
✅ Duplicate conversations prevented, existing ones reused
✅ Database constraint respected
✅ Clean error handling and user experience

## Related Documentation
- [Task 7.10: Chat System](./docs/progress/phase-7/task-7.10-chat-system.md)
- Database schema: `CONVERSATIONS` and `CONVERSATION_PARTICIPANTS` tables
- Migration: `run-unique-group-chat-migration.js`

## Workflow Sequences

### Direct Messaging Flow (Fixed)
```
1. User clicks "Message Author" on posting
2. Frontend checks: GET /api/conversations/direct/{postingId}/{authorId}
   → 404 (no existing conversation) ✅ Expected
3. Frontend creates: POST /api/conversations
   → Backend checks for existing conversation
   → If exists: returns existing ✅ Fixed
   → If not: creates new one
4. User navigated to chat with conversation ID
```

### Group Chat Join Flow (Fixed)
```
1. User clicks "Join Group Discussion" on posting
2. Frontend checks: GET /api/conversations/group/{postingId}
   → If exists: conversation found
3. Frontend joins: POST /api/conversations/{id}/add-participant
   → Backend allows self-join for GROUP type ✅ Fixed
4. User added as MEMBER and navigated to chat
```

## Future Considerations

1. **Performance Optimization**
   - Consider caching conversation lookups to reduce duplicate queries
   - Add indexes on `(posting_id, type, is_archived)` if not already present

2. **UX Improvements**
   - Add loading indicators during conversation lookup/creation
   - Show "Joining existing conversation..." message when returning existing

3. **Feature Enhancements**
   - Allow multiple DIRECT conversations per posting with different participant pairs
   - Add group invitation system with approval workflow
   - Implement conversation archival from frontend

---

**Status:** ✅ Complete
**Tested:** ✅ Verified with test suite
**Deployed:** Pending production deployment

# Issue Analysis: Sankari Test User Registration Problems

**Date**: 2025-11-26
**Related Context**: `2025-11-26-birth-date-family-member-fix.md`

---

## Issues Identified

### 1. ✅ Cleanup Script Not Clearing Everything

**Problem**: The cleanup script `cleanup-sankari-test-user.js` doesn't fully reset the test user.

**Root Cause Analysis**:

The cleanup script (lines 31-179) currently handles:
- ✅ `app_users` - DELETED
- ✅ `FAMILY_MEMBERS` (by parent_user_id) - DELETED
- ✅ `FAMILY_MEMBERS` (by alumni_member_id) - DELETED
- ✅ `USER_PREFERENCES` - DELETED
- ✅ `FAMILY_INVITATIONS` - DELETED
- ✅ `USER_INVITATIONS` - **RESET** to pending (NOT deleted)
- ✅ `OTP_TOKENS` - DELETED
- ✅ `alumni_members.invitation_accepted_at` - RESET to NULL

**The Problem**: Line 125-136 **UPDATES** all `USER_INVITATIONS` instead of deleting old ones:

```javascript
// Line 125-136: RESETS ALL invitations (including revoked/used ones)
const [inviteResult] = await connection.execute(
  `UPDATE USER_INVITATIONS
   SET status = 'pending',
       is_used = 0,
       user_id = NULL,
       used_at = NULL,
       completion_status = 'pending',
       updated_at = NOW()
   WHERE email = ?`,
  [EMAIL]
);
```

**Why this causes duplicate invitations**:
1. Admin sends invitation A → creates `USER_INVITATIONS` record 1
2. User registers → record 1 becomes `status='completed'`
3. Cleanup runs → record 1 reset to `status='pending'`
4. Admin sends invitation B → creates `USER_INVITATIONS` record 2 (new pending)
5. **Result**: Now there are 2 pending invitations with different tokens!

**Fix Required**:
```javascript
// DELETE all invitations instead of resetting them
const [inviteResult] = await connection.execute(
  `DELETE FROM USER_INVITATIONS WHERE email = ?`,
  [EMAIL]
);
```

---

### 2. ✅ Admin Shows 2 Invitation Links (One Invalid/Inactive)

**Problem**: Admin panel shows multiple invitation links, but only one works.

**Root Cause**: See issue #1 above. The cleanup script creates orphaned invitations.

**Evidence from routes/alumni.js:405-415**:
```javascript
// Check for existing pending invitation
const [existingRows] = await connection.execute(
  'SELECT id FROM USER_INVITATIONS WHERE email = ? AND status = "pending" FOR UPDATE',
  [member.email]
);

if (existingRows.length > 0) {
  await connection.rollback();
  return res.status(409).json({ error: 'Alumni member already has a pending invitation' });
}
```

**Why you see 2 links**:
- Link 1: Old invitation with **old HMAC token** (from before cleanup)
- Link 2: New invitation with **new HMAC token** (just sent)

The old token fails HMAC validation because it was generated with a different:
- `invitationId`
- `expiresAt` timestamp
- `issuedAt` timestamp

But the token itself was **NOT regenerated** during cleanup, so it's still the old signature.

**Fix**: Delete old invitations instead of resetting them (see Issue #1).

---

### 3. ✅ HMAC Signature Validation Error

**Problem**: "VALIDATE_INVITATION: Invalid HMAC signature: Invalid signature"

**Root Cause**: Token mismatch between database and HMAC payload.

**How HMAC tokens work** (from `HMACTokenService.ts`):

```typescript
// Generation (routes/alumni.js:419-424)
const hmacToken = generateHMACInvitationToken({
  id: invitationId,        // ← NEW UUID every time
  email: member.email,
  invitationType,
  expiresAt: new Date(...)  // ← NEW timestamp every time
});

// Token structure:
{
  payload: {
    invitationId: "uuid-1234",
    email: "sankarijv@gmail.com",
    type: "alumni",
    expiresAt: 1732704000000,  // Unix timestamp
    issuedAt: 1732099200000
  },
  signature: "hmac-sha256-hex"
}
```

**Validation flow** (HMACTokenService.ts:61-82):
1. Decode base64url token
2. Extract payload + signature
3. **Regenerate signature** using current secret + payload
4. Compare regenerated signature with stored signature (constant-time)
5. Check if `expiresAt < Date.now()`

**Why it fails**:
- Cleanup script resets `USER_INVITATIONS.status = 'pending'` but **keeps old invitation_token**
- Old token contains old `invitationId` and `expiresAt`
- When admin "resends" invitation, it creates **NEW** invitation with **NEW** token
- Now there are 2 tokens in database for same email:
  - Token A (old): `invitationId=old-uuid, expiresAt=old-date`
  - Token B (new): `invitationId=new-uuid, expiresAt=new-date`
- Admin UI might display the **old** invitation link (token A)
- User clicks old link → HMAC validates token A payload → looks up database
- Database has **both** records, but the old one's payload doesn't match anymore

**Additional issue**: If `INVITATION_SECRET` environment variable changed, ALL old tokens become invalid.

**Fix**: Delete old invitations instead of resetting (see Issue #1).

---

### 4. ✅ Estimated Birth Year Calculation

**Problem**: How is `estimated_birth_year` calculated? What's the basis?

**Answer**: `estimated_birth_year = batch - 22`

**Location**: `scripts/database/migrations/add-birth-date-to-alumni-members.sql:20-21`

```sql
SET estimated_birth_year = batch - 22
WHERE batch IS NOT NULL AND estimated_birth_year IS NULL;
```

**Basis for calculation**:
- `batch` column = Graduation year (e.g., 2000)
- Assumption: Students graduate at **age 22** (typical college graduation age in India for B.Tech/B.E.)
- Formula: If graduated in 2000, born in 1978 (2000 - 22)

**Age priority hierarchy** (from `AlumniDataIntegrationService.ts:74-83`):

```typescript
// Priority: actual birth_date > estimated_birth_year > graduation_year-based estimate
SELECT
  CASE
    WHEN am.birth_date IS NOT NULL THEN YEAR(CURDATE()) - YEAR(am.birth_date)
    WHEN am.estimated_birth_year IS NOT NULL THEN YEAR(CURDATE()) - am.estimated_birth_year
    ELSE YEAR(CURDATE()) - (am.batch - 22)
  END as calculated_age
```

**Priority**:
1. **Actual `birth_date`** (admin-populated) - MOST ACCURATE
2. **`estimated_birth_year`** (batch - 22) - FALLBACK #1
3. **Calculated from batch** (batch - 22, computed on-the-fly) - FALLBACK #2

**Why age 22?**
- Typical B.Tech/B.E. graduation age in India:
  - Age 18: Join college (12th standard)
  - Age 22: Graduate (4-year degree)
- This is an **estimate** for COPPA compliance (need to know if user is under 13)

**Accuracy concerns**:
- Students who graduated early/late won't match
- Diploma holders (3-year) might be 21
- Students with year drops might be 23-24
- But for COPPA purposes (age 13+), the error margin is acceptable

---

## Summary of Fixes Required

### Fix #1: Update Cleanup Script (HIGH PRIORITY)

**File**: `scripts/archive/oneoff/cleanup-sankari-test-user.js:125-136`

**Change**:
```javascript
// OLD (line 125):
const [inviteResult] = await connection.execute(
  `UPDATE USER_INVITATIONS
   SET status = 'pending', ...
   WHERE email = ?`,
  [EMAIL]
);

// NEW:
const [inviteResult] = await connection.execute(
  `DELETE FROM USER_INVITATIONS WHERE email = ?`,
  [EMAIL]
);
console.log(`✅ Deleted ${inviteResult.affectedRows} invitation(s)`);
```

**Rationale**:
- Prevents duplicate invitations
- Fixes HMAC signature errors
- Admin will create fresh invitation with new token

### Fix #2: Add Invitation Cleanup Verification

**File**: `scripts/archive/oneoff/cleanup-sankari-test-user.js:157-164`

**Add to summary**:
```javascript
console.log('\n📋 Summary:');
console.log(`   - User accounts deleted: ${users.length}`);
console.log(`   - Invitations DELETED: ${inviteResult.affectedRows}`);  // ← Changed
console.log(`   - OTP tokens cleared`);
console.log(`   - Family members deleted`);
console.log(`   - Ready for fresh invitation (admin must resend)`);  // ← Note
```

### Fix #3: Optional - Add Alumni ID Linking

If you want to preserve the link to `alumni_members` records (Sankari and Deepa), add:

```javascript
// OPTIONAL: Link invitations to alumni_member_id (before deletion)
const [alumniMembers] = await connection.execute(
  `SELECT id, first_name, last_name FROM alumni_members WHERE email = ?`,
  [EMAIL]
);

if (alumniMembers.length > 0) {
  console.log(`\nℹ️  Found ${alumniMembers.length} alumni record(s):`);
  alumniMembers.forEach(am => {
    console.log(`   - ${am.first_name} ${am.last_name} (ID: ${am.id})`);
  });
  console.log('   Note: Alumni records preserved, only invitations deleted');
}
```

---

## Test Procedure After Fix

1. **Run cleanup**:
   ```bash
   node scripts/archive/oneoff/cleanup-sankari-test-user.js
   ```

2. **Verify deletion**:
   ```sql
   SELECT COUNT(*) FROM USER_INVITATIONS WHERE email = 'sankarijv@gmail.com';
   -- Should return 0
   ```

3. **Admin sends new invitation**:
   - Admin panel → Select Sankari → Send Invitation
   - Should create **1** new invitation

4. **Verify single invitation**:
   ```sql
   SELECT id, status, created_at FROM USER_INVITATIONS WHERE email = 'sankarijv@gmail.com';
   -- Should return exactly 1 row with status='pending'
   ```

5. **Click invitation link**:
   - Should NOT show HMAC error
   - Should load registration page

6. **Complete registration**:
   - Verify `FAMILY_MEMBERS` created
   - Verify age shows correctly

---

## Additional Notes

### Why the Current Approach Was Broken

The cleanup script tried to be "smart" by reusing existing invitation records:
- ❌ Prevents creating duplicate invitation IDs
- ❌ Preserves invitation history
- ❌ But breaks HMAC signature validation
- ❌ And creates orphaned tokens

**Better approach**: Treat invitations as **disposable tokens**:
- ✅ Delete old invitations completely
- ✅ Let admin create fresh ones
- ✅ HMAC tokens are self-contained (don't need history)
- ✅ Audit trail preserved in email logs

### HMAC Security Design

The HMAC token design is **stateless**:
- Token contains all data needed for validation
- Database only stores the token for lookup
- Changing the token in DB **breaks** the HMAC signature
- This is **by design** to prevent tampering

**Implication**: You can't "reuse" tokens by resetting their status. Each invitation needs a **fresh token**.

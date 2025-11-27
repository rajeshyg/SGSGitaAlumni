# Context Bundle: Birth Date / Age Population Fix for Family Members

**Date**: 2025-11-26  
**Branch**: `claude/resume-sdd-tac-framework-017rX4cUtcnaeY7ESv8aedDt`  
**Status**: 🔴 IN PROGRESS - Registration failing with undefined bind parameter

---

## Problem Statement

Family members show "Age: N/A" after accepting invitation because:
1. `alumni_members` table didn't have `birth_date` column
2. Invitation data didn't include birth date information
3. FAMILY_MEMBERS records weren't being created during registration
4. No fallback to estimate age from graduation year

---

## Changes Completed ✅

### 1. Database Migration
**Files created**:
- `scripts/database/migrations/add-birth-date-to-alumni-members.sql`
- `scripts/database/migrations/run-add-birth-date-migration.js`

**Changes**:
- Added `birth_date` DATE column to `alumni_members`
- Added `estimated_birth_year` INT column (batch - 22)
- Populated 1,280 records with estimated birth year

### 2. Context Documentation Updated
**File**: `docs/specs/context/always-on.md`
- Added "Database: Key Tables & Age Handling" section
- Documents age calculation priority and COPPA rules

### 3. Invitation Flow Updated
**File**: `routes/alumni.js` (sendInvitationToAlumni function ~line 370)
- Query now fetches `birth_date`, `batch`, `estimated_birth_year`
- `invitation_data` JSON now includes:
  - `birthDate` (actual, if available)
  - `graduationYear` (batch)
  - `estimatedBirthYear` (fallback)

### 4. Alumni Data Integration Service
**File**: `src/services/AlumniDataIntegrationService.ts`
- Added `birthDate` and `estimatedBirthYear` to `AlumniProfile` interface
- Updated `fetchAlumniDataForInvitation()` query to include birth_date fields
- Age calculation uses priority: birth_date > estimated_birth_year > graduation_year

### 5. Registration Service
**File**: `src/services/StreamlinedRegistrationService.ts`
- Added `createPrimaryFamilyMember()` method (~line 255)
- Added `createBasicFamilyMember()` method (~line 435)
- Both `completeStreamlinedRegistration()` and `handleIncompleteAlumniData()` now create FAMILY_MEMBERS

### 6. Cleanup Script Fixed
**File**: `scripts/archive/oneoff/cleanup-sankari-test-user.js`
- Fixed .env path (was `..` now `../../..`)
- Fixed column reference (`user_id` → `alumni_member_id`)
- Successfully cleaned up `sankarijv@gmail.com`

---

## Current Issue 🔴

**Error**: Registration fails with "Bind parameters must not contain undefined"

**Location**: `StreamlinedRegistrationService.handleIncompleteAlumniData()` line 393

**Root Cause**: When `alumniProfile` is NULL (no matching alumni record), the code calls `createPrimaryFamilyMember()` which expects an `AlumniProfile` object but receives undefined values.

**Log Evidence**:
```
VALIDATE_INVITATION: Validation result: { isValid: true, errorType: undefined, hasAlumniProfile: false }
[DEBUG] Registration: using incomplete data registration
Error: Bind parameters must not contain undefined
```

**Key insight**: `hasAlumniProfile: false` means no alumni_members record matches `sankarijv@gmail.com`, so `alumniProfile` is null.

---

## Files to Fix

### `src/services/StreamlinedRegistrationService.ts`

**Problem in `handleIncompleteAlumniData()` around line 430**:
```typescript
// Current code (BROKEN):
if (alumniProfile) {
  await this.createPrimaryFamilyMember(connection, userId, alumniProfile, familyMemberId);
} else {
  // createBasicFamilyMember expects mergedData to have all fields
  await this.createBasicFamilyMember(connection, userId, mergedData, familyMemberId);
}
```

**Issue**: `mergedData` comes from user input which is empty `{}` when using one-click join.

**Fix needed**: The `createBasicFamilyMember()` needs to handle missing data gracefully, using invitation data or defaults.

---

## Second Issue: Login OTP for Non-Registered User

**Problem**: When user tries to login with OTP BEFORE accepting invitation, they get HTTP 400 with no friendly message.

**Log**:
```
❌ [DEBUG] Email not found in app_users for login OTP
```

**Location**: `routes/otp.js` - generateAndSendOTP function

**Fix needed**: Return friendly error message like "Please accept your invitation first before logging in."

---

## Test User

**Email**: `sankarijv@gmail.com`
- Has 2 alumni_members records (Sankari and Deepa Jaivadivel)
- Cleanup script resets: app_users, FAMILY_MEMBERS, USER_INVITATIONS to pending
- Run cleanup: `node scripts/archive/oneoff/cleanup-sankari-test-user.js`

---

## Remaining Tasks

1. **Fix undefined bind parameter in StreamlinedRegistrationService.ts**
   - Handle case when `alumniProfile` is null
   - `createBasicFamilyMember()` should use invitation data for firstName/lastName
   - Add null checks for all INSERT parameters

2. **Improve OTP login error message**
   - In `routes/otp.js`, return friendly message for non-registered users
   - Something like: "No account found. Please accept your invitation first."

3. **Test full flow**
   - Run cleanup script
   - Resend invitation from admin
   - Accept invitation
   - Verify FAMILY_MEMBERS created with age
   - Verify profile selector shows correct age

---

## Key Files Reference

| Purpose | File |
|---------|------|
| Registration service | `src/services/StreamlinedRegistrationService.ts` |
| Alumni data service | `src/services/AlumniDataIntegrationService.ts` |
| Invitation creation | `routes/alumni.js` (sendInvitationToAlumni) |
| Registration route | `routes/auth.js` (registerFromInvitation) |
| OTP generation | `routes/otp.js` |
| Family member service | `server/services/FamilyMemberService.js` |
| Cleanup script | `scripts/archive/oneoff/cleanup-sankari-test-user.js` |
| Migration | `scripts/database/migrations/run-add-birth-date-migration.js` |

---

## Commands

```bash
# Run cleanup
node scripts/archive/oneoff/cleanup-sankari-test-user.js

# Run migration (already done)
node scripts/database/migrations/run-add-birth-date-migration.js

# Start dev server
npm run dev
```

---

## Resume Instructions

1. ✅ Read this context bundle
2. ✅ Fixed cleanup script - now DELETES invitations instead of resetting
3. ✅ All 4 issues analyzed in `2025-11-26-issue-analysis.md`
4. 🔴 REMAINING: Fix `StreamlinedRegistrationService.handleIncompleteAlumniData()` - handle null alumniProfile
5. 🔴 REMAINING: Fix `createBasicFamilyMember()` to get data from invitation instead of empty userData
6. Optional: Fix OTP login error message in `routes/otp.js`
7. Optional: Fix batch format issue (B8 vs numeric year)
8. Test with `sankarijv@gmail.com`

## Latest Status Update (2025-11-26)

✅ **Cleanup Script Fixed**: Now deletes invitations completely
- Changed UPDATE to DELETE for USER_INVITATIONS
- Prevents duplicate invitations
- Fixes HMAC signature errors
- Shows preserved alumni records

🔴 **Batch Format Issue Found**:
- `batch` column contains "B8" (string) not numeric year
- Migration calculated `estimated_birth_year = 'B8' - 22 = -22` (invalid)
- Need to either:
  - Store actual graduation years in batch column, OR
  - Skip estimation for non-numeric batch values

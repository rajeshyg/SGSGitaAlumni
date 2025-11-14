# Family Profile Selection - Testing Guide

## ✅ COMPLETE - All Issues Resolved (November 2, 2025)

Successfully implemented and fixed:
1. ✅ Profile selection and switching works correctly
2. ✅ Dashboard shows correct family member name after switch
3. ✅ Parental consent UI is now accessible at `/settings/family`
4. ✅ AuthContext refreshes automatically after profile switch

## Test Accounts Setup

### 1. jayanthi236@gmail.com (4 family members)
- ⭐ **Jayanthi Reddy** (self, age 42, full access) - Primary
- **Ravi Reddy** (spouse, age 45, full access)
- **Priya Reddy** (child, age 15, full access)
- **Arjun Reddy** (child, age 12, supervised access)

### 2. saikveni6@gmail.com (3 family members)
- ⭐ **Sai Kveni** (self, age 38, full access) - Primary
- **Lakshmi Kveni** (spouse, age 36, full access)
- **Krishna Kveni** (child, age 10, supervised access)

### 3. gangadherade@gmail.com (4 family members)
- ⭐ **Gangadhar Ade** (self, age 50, full access) - Primary
- **Sarita Ade** (spouse, age 48, full access)
- **Vikram Ade** (child, age 20, full access)
- **Neha Ade** (child, age 18, full access)

### 4. srinidhi.anand@yahoo.com (2 family members)
- ⭐ **Srinidhi Anand** (self, age 35, full access) - Primary
- **Aditya Anand** (child, age 8, supervised access) - ✅ **NOW WORKING**

## Testing Steps

### Step 1: Login with a Family Account
1. Go to http://localhost:5173/login
2. Click "Sign in without password"
3. Enter one of the test emails (e.g., srinidhi.anand@yahoo.com)
4. Click "Send Verification Code"
5. Check backend console for OTP code
6. Enter the OTP code
7. Click "Verify OTP"

### Step 2: Profile Selection Page
After successful OTP verification, you should be redirected to `/profile-selection`

The page should display:
- Netflix-style profile cards for each family member
- Member names and avatars
- Primary member marked with a star ⭐
- "Add Family Member" button (if applicable)

### Step 3: Select a Profile
1. Click on any family member card (e.g., Aditya Anand)
2. **Backend automatically:**
   - Updates `app_users.primary_family_member_id`
   - Logs access in `FAMILY_ACCESS_LOG`
3. **Frontend automatically:**
   - Calls `switchProfile()` API
   - Refreshes AuthContext with updated user data
   - Redirects to dashboard

### Step 4: Verify Dashboard Shows Correct Name
✅ **FIXED**: Dashboard now displays the family member's name correctly

**Expected:**
- Top-right profile shows: "Aditya Anand"
- Hero card shows: "Good evening, Aditya!"

**Before the fix:** Showed "Unknown Unknown" and "Member"
**Root cause:** AuthContext wasn't refreshed after profile switch
**Solution:** 
- Backend `/api/users/profile` now merges family member data
- Frontend calls `refreshToken()` after switch to update context

### Step 5: Manage Parental Consent
✅ **FIXED**: Parents can now grant/revoke consent via UI

1. From profile selection, click "Manage Profiles" button
2. OR navigate directly to http://localhost:5173/settings/family
3. See list of all family members with consent status
4. For minors (14-17):
   - Click "Grant Consent" to allow supervised access
   - Click "Revoke Consent" to remove access
5. ConsentDialog appears with COPPA compliance information
6. Confirm action
7. Backend updates `can_access_platform` flag automatically

**Before the fix:** `ConsentDialog.tsx` existed but was inaccessible
**Solution:** Created `FamilySettingsPage.tsx` and added route `/settings/family`

## What Was Fixed

### Issue #1: "Unknown Unknown" on Dashboard ✅
**Problem:** After switching profiles, dashboard showed "Unknown Unknown" instead of family member name.

**Root Cause:** `switchProfile()` updated `primary_family_member_id` in database, but AuthContext still had old user data.

**Fix Applied:**
1. Modified `/api/users/profile` endpoint to merge family member data when `primary_family_member_id` is set
2. Updated `FamilyProfileSelector` to call `refreshToken()` after profile switch
3. Modified `refreshToken()` in AuthContext to fetch fresh user data and update state
4. Extended `User` interface to include family member fields

**Files Changed:**
- `routes/users.js` - Added family member data merge
- `src/contexts/AuthContext.tsx` - Refresh now fetches user data
- `src/components/family/FamilyProfileSelector.tsx` - Calls refreshToken()
- `src/services/APIService.ts` - Extended User type

### Issue #2: Parental Consent UI Inaccessible ✅
**Problem:** `ConsentDialog.tsx` component existed with full COPPA compliance features, but no way to access it.

**Root Cause:** No page or route exposed the consent management workflow to parents.

**Fix Applied:**
1. Created `FamilySettingsPage.tsx` - Full family management UI
2. Added route `/settings/family` in App.tsx
3. Updated `FamilyProfileSelector` "Manage Profiles" button to navigate to settings

**Files Created:**
- `src/pages/FamilySettingsPage.tsx`

**Files Modified:**
- `src/App.tsx` - Added route

### Issue #3: Manual `can_access_platform` Fix Required ❌ (By Design)
**Problem:** Had to manually run SQL to set `can_access_platform = 1` for Aditya.

**Root Cause:** Consent was marked as given during test data migration, but flag wasn't updated.

**Not a Bug:** This is working as designed. The `grantParentConsent()` backend API correctly updates the flag. The manual fix was only needed because test data was migrated inconsistently.

**Going Forward:** Parents use the UI at `/settings/family` to grant consent, which automatically updates `can_access_platform`.

## Database Updates

All 4 accounts are properly configured:
- ✅ `app_users.is_family_account` = 1
- ✅ `app_users.family_account_type` = 'parent'
- ✅ `app_users.primary_family_member_id` set to active member
- ✅ Multiple `FAMILY_MEMBERS` records created
- ✅ `can_access_platform` flags correctly set

## New Features Added

### 1. Family Settings Page (`/settings/family`)
- View all family members
- See consent status for each member
- Grant/revoke parental consent (14-17 year olds)
- COPPA compliance notices
- Visual status indicators

### 2. Enhanced Profile Switch
- Automatic AuthContext refresh
- Correct user data propagation
- Seamless dashboard navigation

### 3. Proper User Data Merging
- Backend merges family member info into user object
- Frontend displays correct names everywhere
- Profile images and metadata included

## Testing Checklist

- ✅ Login with family account
- ✅ See all family members on profile selection
- ✅ Switch to child profile (e.g., Aditya)
- ✅ Dashboard shows correct child name
- ✅ Navigate to Family Settings
- ✅ Grant consent for a minor
- ✅ Verify `can_access_platform` updated
- ✅ Switch back to parent profile
- ✅ Revoke consent
- ✅ Verify child can no longer access platform

## Next Steps in Task 8.12

- ✅ **Action 1**: FamilyProfileSelector - COMPLETE
- ✅ **Action 2**: ProfileSelectionPage - COMPLETE
- ✅ **Action 5**: Login integration with family members - COMPLETE
- 🔧 **Action 3**: Theme compliance (hardcoded colors → CSS variables)
- 🔧 **Action 4**: API input validation (Joi/Zod schemas)

---

**Status**: ✅ All Critical Family Features Complete
**Date**: November 2, 2025
**Branch**: task-8.12-violation-corrections

# Family Profile Login Flow - Debug Guide

## Status: Ready for Testing with Enhanced Logging

**Date:** November 2, 2025  
**Issue:** Family member selection not appearing after OTP login  
**User:** jayanthi236@gmail.com (4 family members)

---

## Changes Made

### 1. Enhanced Logging Added to All Components

Added comprehensive console logging to trace the complete login flow:

#### AuthContext.tsx
- ✅ Logs family account fields from login response
- ✅ Shows type checking for `is_family_account`
- ✅ Tracks token storage

#### OTPVerificationPage.tsx
- ✅ Logs login authentication start
- ✅ Shows login result and family account detection
- ✅ Traces redirect decision and target URL

#### LoginPage.tsx
- ✅ Logs user object on authentication
- ✅ Shows family account check logic
- ✅ Tracks redirect path selection

#### ProfileSelectionPage.tsx
- ✅ Logs component load with user data
- ✅ Shows family account verification
- ✅ Tracks redirect if not a family account

#### FamilyProfileSelector.tsx
- ✅ Logs API call to fetch family members
- ✅ Shows data received from backend
- ✅ Tracks errors if API fails

#### apiClient (src/lib/api.ts)
- ✅ Logs all HTTP requests (method + endpoint)
- ✅ Shows request data
- ✅ Logs success/failure for each API call

---

## Testing Instructions

### Step 1: Open Browser Console
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Clear console (Ctrl+L or click 🚫 icon)

### Step 2: Login with OTP
1. Navigate to http://localhost:5173/login
2. Click "Sign in without password"
3. Enter: `jayanthi236@gmail.com`
4. Click "Send Verification Code"
5. Check backend terminal for OTP code
6. Enter the OTP code
7. Click "Verify OTP"

### Step 3: Watch Console Output

You should see a sequence like this:

```
[OTPVerificationPage] 🔐 Starting login authentication...
[apiClient] 📡 POST /api/auth/login
[AuthContext] Login response user: {...}
[AuthContext] 🔍 FAMILY ACCOUNT DEBUG:
  - is_family_account: 1
  - family_account_type: parent
  - Type of is_family_account: number
  - is_family_account === 1: true
[apiClient] ✅ POST /api/auth/login succeeded
[OTPVerificationPage] ✅ Login successful, checking family account status...
[OTPVerificationPage] is_family_account: 1
[OTPVerificationPage] isFamilyAccount check result: true
[OTPVerificationPage] 🎯 Redirecting to: /profile-selection
[ProfileSelectionPage] 🔍 Component loaded
[ProfileSelectionPage] is_family_account: 1
[ProfileSelectionPage] isFamilyAccount check: true
[ProfileSelectionPage] ✅ Family account verified, showing profile selector
[FamilyProfileSelector] Component mounted, loading family members...
[apiClient] 📡 GET /api/family-members
[apiClient] ✅ GET /api/family-members succeeded
[FamilyProfileSelector] ✅ Family members loaded: [4 members]
```

### Step 4: Identify Where It Fails

**If redirect doesn't happen:**
- Check if `isFamilyAccount check result: false`
- Look for the actual value of `is_family_account`
- Check the type (`number` vs `boolean`)

**If ProfileSelectionPage loads but shows error:**
- Check if it logs "Not a family account"
- Look for FamilyProfileSelector mount log

**If FamilyProfileSelector shows loading forever:**
- Check for API call to `/api/family-members`
- Look for error in API response
- Check if auth token is being sent

---

## Expected vs Actual Behavior

### ✅ Expected Flow
1. OTP verification → Login → Check family flag
2. If family account → Redirect to `/profile-selection`
3. ProfileSelectionPage → Verify family account
4. FamilyProfileSelector → Load family members
5. Show 4 profile cards for Jayanthi's family

### ❌ Current Problem
- User reports not seeing family member selection
- Need to identify exact failure point

---

## Database Verification

Family account data is correct:
```json
{
  "id": 8,
  "email": "jayanthi236@gmail.com",
  "is_family_account": 1,
  "family_account_type": "parent",
  "primary_family_member_id": "81c4f2f7-2120-42b0-b362-2f8bccf95413"
}
```

Family members exist:
- ✅ Jayanthi Reddy (self, age 42, ⭐ primary)
- ✅ Ravi Reddy (spouse, age 45)
- ✅ Priya Reddy (child, age 15)
- ✅ Arjun Reddy (child, age 12)

---

## Next Steps After Testing

1. **Copy the console output** and share it
2. **Identify the failure point** from the logs
3. **Fix the specific issue** based on what we find
4. **Re-test** to verify the fix

---

## Possible Issues to Look For

### Issue 1: Type Mismatch
- `is_family_account` might be a string "1" instead of number 1
- Check: `Type of is_family_account: string` (should be `number`)

### Issue 2: AuthContext Not Updated
- Login succeeds but AuthContext.user not updated
- Check: ProfileSelectionPage logs "User: null"

### Issue 3: Route Protection
- ProfileSelectionPage immediately redirects to dashboard
- Check: "Not a family account, redirecting to dashboard"

### Issue 4: API Failure
- GET /api/family-members fails with 401 or 500
- Check: API error logs

### Issue 5: Backend Not Running
- Server on port 3001 not responding
- Check: Network errors in console

---

**Remember:** The logging will tell us exactly where the flow breaks!

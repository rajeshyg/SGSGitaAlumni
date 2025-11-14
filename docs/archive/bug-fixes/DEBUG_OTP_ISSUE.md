# Debug Steps for OTP Issue

## The Problem
Even after clearing tokens and fixing the backend, you're still seeing "Maximum attempts exceeded" on the verification page.

## Root Cause Analysis
The issue is that when `OTPVerificationPage.tsx` loads, it calls `loadRemainingAttempts()` which was setting an error if it received `0` attempts.

## What I Just Fixed

### Frontend Change #1: Removed Auto-Error on Page Load
**File**: `src/pages/OTPVerificationPage.tsx` (lines 98-115)

**Changed**: Removed the line that sets error when attempts is 0 on page load
- The error should ONLY show after a failed validation attempt, not on initial page load
- Now it just logs a warning to console instead

### Frontend Change #2: Added Detailed Logging  
**File**: `src/services/OTPService.ts` (lines 167-182)

**Added**: Extensive console logging to see exactly what the API returns:
```typescript
console.log('[OTPService] API response:', response);
console.log('[OTPService] response.remainingAttempts:', response.remainingAttempts);
console.log('[OTPService] Type:', typeof response.remainingAttempts);
```

## Testing Steps

### 1. Start Fresh
```powershell
# Clear tokens
node clear-otp-tokens.js harshayarlagadda2@gmail.com

# Start server  
npm run dev
```

### 2. Open Browser Console
- Press F12 to open DevTools
- Go to Console tab
- Keep it open while testing

### 3. Test the Flow
1. Navigate to: http://localhost:5173/login
2. Click "Sign in without password"
3. Enter: harshayarlagadda2@gmail.com
4. Click "Send Verification Code"

### 4. Check Console Output
You should see logs like:
```
[OTPService] Requesting remaining attempts for: harshayarlagadda2@gmail.com
[OTPService] API response: {remainingAttempts: 3, maxAttempts: 3}
[OTPService] response.remainingAttempts: 3
[OTPService] Type: number
[OTPService] Returning attempts: 3
[OTPVerificationPage] Checking remaining attempts for: harshayarlagadda2@gmail.com
[OTPVerificationPage] Remaining attempts received: 3
[OTPVerificationPage] Type of attempts: number
```

### 5. Check Backend Console
Should show the OTP code:
```
=================================================================
📧 [OTP Service] EMAIL VERIFICATION CODE (Development Mode)
=================================================================
To: harshayarlagadda2@gmail.com
OTP Code: 123456
Expires: 10/11/2025, 3:45:00 PM
Valid for: 5 minutes
=================================================================
```

## If It Still Shows the Error

### Check Browser Console
Look for what the API is actually returning. If you see:
```
[OTPService] response.remainingAttempts: 0
```

Then the issue is on the backend side.

### Test Backend Directly
```powershell
Invoke-RestMethod "http://localhost:3001/api/otp/remaining-attempts/harshayarlagadda2@gmail.com"
```

Should return:
```json
{
  "remainingAttempts": 3,
  "maxAttempts": 3
}
```

### Possible Issues

1. **Caching**: Clear browser cache, localStorage, and try incognito mode
2. **Old Build**: Frontend might be using old bundled code - do a hard refresh (Ctrl+Shift+R)
3. **Wrong API URL**: Check if frontend is calling the wrong endpoint
4. **CORS**: Check for CORS errors in console

## Quick Fix to Try Right Now

If you're testing and still seeing the error, try this:

1. **Hard Refresh the Browser**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Clear Browser Storage**:
   - Open DevTools (F12)
   - Go to Application tab
   - Click "Clear storage"
   - Click "Clear site data"
3. **Try Incognito Mode**: Open a new incognito/private window and test there

## What to Share With Me

If it still doesn't work, please share:
1. Screenshot of browser console showing the logs
2. Screenshot of backend console
3. The exact error message you see
4. Result of: `Invoke-RestMethod "http://localhost:3001/api/otp/remaining-attempts/harshayarlagadda2@gmail.com"`

This will help me identify exactly where the disconnect is happening!

# OTP Token Type Mismatch - Admin UI vs Login

**Date**: 2025-10-11  
**Issue**: "No valid OTP found" when using Admin-generated OTP for login  
**Test User**: harshayarlagadda2@gmail.com  
**Test OTP**: 342777

---

## 🔴 ROOT CAUSE

**Admin UI and Login Page were using DIFFERENT `token_type` values!**

### What Happened:
1. **Admin UI generates OTP** → Inserts into DB with `token_type = 'registration'`
2. **User tries to login** → Frontend searches for `token_type = 'login'`
3. **Backend query fails** → No match found (registration ≠ login)
4. **User sees error** → "No valid OTP found"

---

## 💀 THE MISMATCH

### Admin UI (InvitationSection.tsx - Line 465):
```typescript
// BEFORE (WRONG):
body: JSON.stringify({ email, type: 'registration' })
//                                   ^^^^^^^^^^^^^^ Wrong type!

// AFTER (FIXED):
body: JSON.stringify({ email, type: 'login' })
//                                   ^^^^^^^ Correct type for login testing
```

### Login Page (LoginPage.tsx - Line 143):
```typescript
await otpService.generateOTP({
  email: formData.email,
  type: 'login'  // ← Expects 'login' type tokens
});
```

### Backend Query (otp.js - Line 175):
```sql
SELECT * FROM OTP_TOKENS
WHERE email = ?
  AND token_type = ?  -- ← Searches for exact match
```

---

## 📊 FLOW DIAGRAM

### Before Fix (BROKEN):
```
Admin UI
  ↓
  POST /api/otp/generate { email, type: 'registration' }
  ↓
Database: OTP_TOKENS
  token_type = 'registration'  ← Token created
  ↓
User enters OTP on login page
  ↓
  POST /api/otp/validate { email, otpCode, tokenType: 'login' }
  ↓
Backend Query:
  WHERE token_type = 'login'  ← Searching for 'login'
  ↓
No match! (registration ≠ login)
  ↓
Response: { isValid: false, errors: ['No valid OTP found'] }
```

### After Fix (WORKS):
```
Admin UI
  ↓
  POST /api/otp/generate { email, type: 'login' }
  ↓
Database: OTP_TOKENS
  token_type = 'login'  ← Token created
  ↓
User enters OTP on login page
  ↓
  POST /api/otp/validate { email, otpCode, tokenType: 'login' }
  ↓
Backend Query:
  WHERE token_type = 'login'  ← Searching for 'login'
  ↓
Match found! ✅
  ↓
Response: { isValid: true }
```

---

## ✅ WHAT WAS FIXED

| File | Line | Change | Reason |
|------|------|--------|--------|
| `InvitationSection.tsx` | 465 | `type: 'registration'` → `type: 'login'` | Admin UI for testing login, not registration |

---

## 🎯 WHY THIS HAPPENED

The Admin UI was originally designed to test **invitation registration flow**, so it used `type: 'registration'`.

But you're using it to test **passwordless login flow**, which requires `type: 'login'`.

**The fix**: Admin UI now generates `'login'` type OTPs by default for testing login functionality.

---

## 🧪 HOW TO TEST

### 1. Rebuild frontend:
```powershell
# In frontend terminal (if using Vite dev server, it auto-reloads)
# No action needed - hot reload should pick up the change
```

### 2. Generate OTP from Admin UI:
- Go to Admin page
- Find user "harshayarlagadda2@gmail.com"
- Click "Generate OTP"
- Copy the OTP code (e.g., 342777)

### 3. Try login:
- Go to login page
- Enter email: harshayarlagadda2@gmail.com
- Click "Use Passwordless Login"
- Click "Send Code"
- Enter the OTP from Admin UI
- **Before Fix**: "No valid OTP found"
- **After Fix**: Login succeeds ✅

---

## 🔍 VERIFICATION QUERY

Check the token type in database:

```sql
SELECT id, email, otp_code, token_type, expires_at, is_used
FROM OTP_TOKENS
WHERE email = 'harshayarlagadda2@gmail.com'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Result:**
- `token_type` should be `'login'` (not `'registration'`)

---

## 📝 RELATED ISSUES

This is connected to the previous mock data issue:
- **Previous Issue**: Backend returned `remainingAttempts: 0` when no token found
- **This Issue**: No token found because of type mismatch

Both are now fixed! 🎉

---

## 🎓 LESSONS LEARNED

1. **Field names must match** - `type` in request must match `token_type` in query
2. **Test data must match use case** - Admin UI for login testing should use `'login'` type
3. **Always check the full flow** - Generation → Storage → Validation
4. **Database queries are exact matches** - `'registration'` ≠ `'login'`

---

**Status**: ✅ FIXED - Admin UI now generates `'login'` type OTPs for passwordless login testing

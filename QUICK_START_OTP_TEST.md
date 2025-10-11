# Quick Start Guide - OTP Authentication Testing

## 🚀 Start Here

### 1. Clear Old Test Data
```powershell
node clear-otp-tokens.js harshayarlagadda2@gmail.com
```

### 2. Start the Application
```powershell
npm run dev
```
Wait for both servers to start:
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

### 3. Test in Browser

**Navigate to**: http://localhost:5173/login

**Steps**:
1. Click "Sign in without password"
2. Enter email: `harshayarlagadda2@gmail.com`
3. Click "Send Verification Code"
4. ✅ **You should see the OTP verification page** (NO "Maximum attempts exceeded" error!)
5. Check backend console for the OTP code:
   ```
   =================================================================
   📧 [OTP Service] EMAIL VERIFICATION CODE (Development Mode)
   =================================================================
   To: harshayarlagadda2@gmail.com
   OTP Code: 123456
   ...
   ```
6. Enter the 6-digit code
7. Click "Verify OTP"
8. ✅ **Should successfully log in!**

---

## 🔍 What Was Fixed?

### Before (BROKEN):
- ❌ "Maximum attempts exceeded" error on verification page
- ❌ OTP code not visible anywhere
- ❌ Email service tried to send (and failed)

### After (FIXED):
- ✅ Verification page shows correctly with 3 attempts
- ✅ OTP code appears in backend console
- ✅ Email service skips sending in dev mode
- ✅ Full login flow works

---

## 📋 Troubleshooting

### Server won't start
```powershell
taskkill /F /IM node.exe
npm run dev
```

### Can't see OTP code in console
Check that `.env` has:
```
NODE_ENV=development
DEV_LOG_OTP=true
```

### Still seeing "Maximum attempts exceeded"
1. Clear browser cache and localStorage
2. Clear OTP tokens: `node clear-otp-tokens.js harshayarlagadda2@gmail.com`
3. Restart server
4. Try again in an incognito/private window

---

## ✅ Success Criteria

You know it's working when:
- [x] No error on verification page
- [x] OTP code visible in backend console
- [x] Can enter OTP and verify successfully
- [x] Successfully logs in to dashboard

---

## 📚 More Details

See `docs/issues/OTP_AUTHENTICATION_FIX_SUMMARY.md` for:
- Complete list of all changes
- Code diffs (before/after)
- Technical explanation of the root cause
- All files modified

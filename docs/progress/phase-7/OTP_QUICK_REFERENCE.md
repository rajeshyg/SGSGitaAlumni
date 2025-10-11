# 🚀 Passwordless Authentication - Quick Reference Card

## ⚡ Quick Start (30 seconds)

```powershell
# Run automated setup
.\quick-start-otp-test.ps1
```

---

## 📧 Find OTP Codes (Development)

**Backend server console:**
```
=============================================================
📧 [EmailService] OTP EMAIL (Development Mode)
=============================================================
To: user@example.com
OTP Code: 123456  ← USE THIS CODE
Expires: 5 minutes
=============================================================
```

---

## 🔗 Key URLs

| Page | URL |
|------|-----|
| Login | `http://localhost:5173/login` |
| Invitation | `http://localhost:5173/invitation/{token}` |
| OTP Verify | `http://localhost:5173/verify-otp/{email}` |
| Dashboard | `http://localhost:5173/dashboard` |

---

## 🎯 Test Flows

### New User (Invitation)
```
1. Open invitation URL
2. Click "Join Alumni Network"
3. Check console for OTP
4. Enter OTP
5. ✅ Redirected to dashboard
```

### Passwordless Login
```
1. Go to /login
2. Click "Sign in without password"
3. Enter email
4. Click "Send Verification Code"
5. Check console for OTP
6. Enter OTP
7. ✅ Redirected to dashboard
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| OTP not in console | Check **backend server** window |
| Can't find OTP | Look for `📧 [EmailService]` in logs |
| Servers not running | Run `.\quick-start-otp-test.ps1` |
| Database error | Check MySQL is running |
| Rate limited | Wait 1 hour or reset in DB |

---

## 💾 Database Quick Checks

```sql
-- Get latest OTP for email
SELECT otp_code, expires_at, is_used 
FROM OTP_TOKENS 
WHERE email = 'test@example.com' 
ORDER BY created_at DESC LIMIT 1;

-- Check if OTP is still valid
SELECT otp_code,
       expires_at > NOW() as is_valid,
       TIMESTAMPDIFF(SECOND, NOW(), expires_at) as seconds_remaining
FROM OTP_TOKENS 
WHERE email = 'test@example.com'
ORDER BY created_at DESC LIMIT 1;
```

---

## ⚙️ Environment (Quick Setup)

**Development (No Email):**
```bash
NODE_ENV=development
DEV_LOG_OTP=true
DEV_SKIP_EMAIL=false
```

**Production (SendGrid):**
```bash
SMTP_PROVIDER=sendgrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-api-key-here
```

---

## 🔒 OTP Rules

- **Length:** 6 digits
- **Expiry:** 5 minutes
- **Max Attempts:** 3 per hour
- **Daily Limit:** 10 OTPs per email
- **Resend Cooldown:** 60 seconds

---

## 📱 API Endpoints

```
POST   /api/otp/generate           - Generate OTP
POST   /api/otp/send              - Send OTP email
POST   /api/otp/validate          - Validate OTP
GET    /api/otp/remaining-attempts/:email
```

---

## 📚 Documentation

| Document | Location |
|----------|----------|
| Setup Guide | `docs/progress/phase-7/PASSWORDLESS_AUTH_SETUP_GUIDE.md` |
| Summary | `docs/progress/phase-7/PASSWORDLESS_AUTH_IMPLEMENTATION_SUMMARY.md` |
| Task Docs | `docs/progress/phase-7/task-7.3-authentication-system.md` |
| Env Template | `.env.example` |

---

## ✅ Success Checklist

- [ ] Servers running
- [ ] .env configured
- [ ] Can create invitation
- [ ] Can accept invitation
- [ ] OTP appears in console
- [ ] Can verify OTP
- [ ] Redirects to dashboard
- [ ] User authenticated
- [ ] Can access protected routes

---

## 🎨 Key Files

| File | Purpose |
|------|---------|
| `utils/emailService.js` | Email sending |
| `routes/otp.js` | OTP API endpoints |
| `src/services/OTPService.ts` | Frontend OTP logic |
| `src/pages/OTPVerificationPage.tsx` | OTP UI |
| `src/pages/InvitationAcceptancePage.tsx` | Invitation flow |
| `src/pages/LoginPage.tsx` | Login with OTP option |

---

**Status:** ✅ Ready for Testing  
**Last Updated:** October 11, 2025  
**Quick Start:** `.\quick-start-otp-test.ps1`

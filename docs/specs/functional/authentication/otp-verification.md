---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# OTP Verification

## Purpose
Verify email ownership during registration and sensitive operations.

## User Flow
1. System generates 6-digit OTP
2. System sends OTP via email
3. User enters OTP in verification form
4. System validates OTP and completes action

## Acceptance Criteria
- ✅ 6-digit numeric OTP
- ✅ 10-minute expiration
- ✅ Maximum 3 attempts per OTP
- ✅ Rate limiting on OTP requests
- ✅ OTP resend functionality
- ✅ Email template with clear instructions

## Implementation
- **Route**: `POST /api/otp/send`, `POST /api/otp/verify`
- **File**: `routes/otp.js`
- **Frontend**: `src/components/OTPInput.tsx`
- **Test**: `tests/e2e/auth.spec.ts`

## Related
- [Registration](./registration.md)
- [Parental Consent](./parental-consent.md)

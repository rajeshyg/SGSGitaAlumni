---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Registration

## Purpose
Enable invited users to create accounts and join the platform.

## User Flow
1. User receives invitation link via email
2. User clicks invitation link
3. System validates invitation token
4. User completes registration form (name, batch, email, password, date of birth)
5. System sends OTP to email
6. User verifies OTP
7. Account created and user logged in

## Acceptance Criteria
- ✅ Invitation-only registration (no public signup)
- ✅ Email OTP verification required
- ✅ Password strength requirements enforced
- ✅ Age captured during registration
- ✅ Invitation token expires after use or 7 days
- ✅ Duplicate email detection

## Implementation
- **Route**: `POST /api/auth/register`
- **File**: `routes/auth.js`, `routes/invitations.js`
- **Frontend**: `src/pages/Register.tsx`
- **Test**: `tests/e2e/auth.spec.ts`

## Related
- [OTP Verification](./otp-verification.md)
- [Age Verification](./age-verification.md)

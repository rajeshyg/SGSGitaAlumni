---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Login

## Purpose
Allow registered users to authenticate and access the platform.

## User Flow
1. User enters email address
2. System displays profile selector if family account
3. User selects profile (if applicable)
4. User enters password
5. System validates credentials and creates session

## Acceptance Criteria
- ✅ Email/password authentication
- ✅ Family profile selection before password entry
- ✅ JWT token issuance on successful login
- ✅ Refresh token mechanism
- ✅ Rate limiting on failed attempts
- ✅ "Remember me" functionality

## Implementation
- **Route**: `POST /api/auth/login`
- **File**: `routes/auth.js`
- **Frontend**: `src/pages/Login.tsx`, `src/pages/ProfileSelection.tsx`
- **Test**: `tests/e2e/auth.spec.ts`

## Related
- [Session Management](./session-management.md)
- [OTP Verification](./otp-verification.md)

---
version: "1.0"
status: implemented
last_updated: 2025-11-23
module: authentication
---

# Authentication Module

Secure, invitation-based authentication system with family account support and age verification.

## Sub-Features

| Feature | Status | E2E Test | Implementation |
|---------|--------|----------|----------------|
| [Login](./login.md) | Implemented | `tests/e2e/auth.spec.ts` | `routes/auth.js` |
| [Registration](./registration.md) | Implemented | `tests/e2e/auth.spec.ts` | `routes/auth.js` |
| [OTP Verification](./otp-verification.md) | Implemented | `tests/e2e/auth.spec.ts` | `routes/otp.js` |
| [Age Verification](./age-verification.md) | In Progress | Pending | `routes/auth.js` |
| [Parental Consent](./parental-consent.md) | In Progress | Pending | `routes/auth.js` |
| [Session Management](./session-management.md) | Implemented | `tests/e2e/auth.spec.ts` | `routes/auth.js`, `middleware/auth.js` |

## Technical Reference

See [Technical Specs: Security/Authentication](../../technical/security/authentication.md) for implementation details.

## Key User Flows

1. **New User Registration**: Invitation → Email OTP → Age verification → (Optional) Parent consent → Profile creation
2. **Family Member Addition**: Existing account → Add family member → Shared email verification → Profile selector
3. **Login**: Email → Profile selection (if family) → Password → Session established

# Authentication & Security - Functional Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
---
```

## Goal
Provide secure, invitation-based authentication with family account support and age verification for the alumni community platform.

## Code References
- **Backend Routes**: `routes/auth.js`, `routes/otp.js`, `routes/invitations.js`
- **Services**: `services/FamilyMemberService.js`, `src/services/StreamlinedRegistrationService.ts`
- **Frontend**: `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/pages/ProfileSelection.tsx`
- **Contexts**: `src/contexts/AuthContext.tsx`

## E2E Tests
- `tests/e2e/auth.spec.ts`

## Features

### 1. Login & Registration
**Status**: Complete

- Invitation-based authentication (no public signup)
- OTP verification via email
- Family account support with shared email
- JWT tokens with refresh mechanism

### 2. Family Accounts
**Status**: Complete

- Shared email for family members with individual profiles
- Netflix-style profile selector on login
- Each family member has own credentials and preferences
- Unified invitation flow for family creation

### 3. Age Verification
**Status**: In Progress

**Requirements**:
- Parent consent required for users under 18
- Supervised access restrictions for young members
- Age collected during registration
- Parental controls for viewing/posting content

**Acceptance Criteria**:
- [ ] Age field captured during registration
- [ ] Users under 13 blocked from registration
- [ ] Users 13-17 require parent email verification
- [ ] Restricted features list enforced for minors

### 4. Password Reset
**Status**: Pending

**Requirements**:
- Secure password reset via email verification
- Token expiry (1 hour)
- Rate limiting on reset requests

**Implementation Notes**:
- Use existing OTP infrastructure
- Add password_reset_tokens table
- Email template for reset link

## Out of Scope
- Social login (Google/Facebook)
- Two-factor authentication (future enhancement)
- Biometric authentication

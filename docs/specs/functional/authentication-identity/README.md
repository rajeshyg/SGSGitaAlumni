---
version: "1.0"
status: active
last_updated: 2025-12-07
description: Authentication & Identity System
---

# Authentication & Identity

## Overview

Handles user authentication, session management, and identity verification. This feature focuses on:
- Login and credential verification
- Session management and profile switching
- OTP-based identity verification
- Password management and recovery
- Account security settings

## Key Principles

1. **One Account per Email**: Single authentication point
2. **Session-Based Profile Switching**: Active profile stored in session, not database
3. **Secure Credentials**: Password hashing and OTP verification
4. **Access Control**: User can only access profiles they own or parent owns
5. **Audit Trail**: Login attempts and sensitive actions logged

## Workflow

```
User visits platform
        ↓
Not logged in → Login page
        ↓
User enters email + password
        ↓
System verifies credentials
        ↓
Valid → Generate session + list user's profiles
        ↓
User selects active profile
        ↓
Session includes: account_id + active_profile_id
        ↓
User can switch profiles (if they own multiple)
```

## Documents

1. **[login.md](./login.md)** - Email + password authentication
2. **[otp-verification.md](./otp-verification.md)** - OTP-based identity verification
3. **[session-management.md](./session-management.md)** - Session creation and lifecycle
4. **[profile-switching.md](./profile-switching.md)** - Switch between owned profiles
5. **[password-management.md](./password-management.md)** - Change password and recovery
6. **[account-settings.md](./account-settings.md)** - Account-level security settings
7. **[db-schema.md](./db-schema.md)** - Database tables

## Success Criteria

- ✅ Users can login with email and password
- ✅ Invalid credentials rejected
- ✅ Sessions created after successful login
- ✅ Session includes active profile context
- ✅ Users can switch between owned profiles
- ✅ Password can be changed with verification
- ✅ Password can be reset via OTP
- ✅ Login attempts rate-limited
- ✅ Sessions expire after inactivity
- ✅ Account-level security settings available

## Related Features

- **[Registration & Onboarding](../registration-onboarding/README.md)** - Creates accounts
- **[Platform Features](../platform-features/README.md)** - Uses authenticated session

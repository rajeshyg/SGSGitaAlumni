---
version: "1.0"
status: active
last_updated: 2025-12-07
description: Registration & Family Onboarding System
---

# Registration & Onboarding

## Overview

Handles user registration from valid invitation and onboarding of family members. Key focuses:
- Account creation from invitation
- Alumni profile discovery and selection
- Year of birth collection (COPPA minimal data)
- Age verification and access level determination
- Parental consent for minors
- User profile creation with access control

## Key Principles

1. **One Account per Email**: Single account entry per email
2. **Explicit Profile Selection**: User selects which alumni profiles to claim
3. **Minimal Data Collection**: YOB as integer only (no full birthdate)
4. **COPPA Compliance**: Under 14 blocked, 14-17 require parental consent, 18+ full access
5. **Clear Relationship Tracking**: Parent or child (not self/spouse/sibling)
6. **Age Conservative**: Calculate age assuming December 31 birthday (latest possible)

## Workflow

```
Valid invitation token accepted
        ↓
Create account + set status='pending'
        ↓
Show matching alumni for user's email
        ↓
User selects profiles + specifies relationship (parent/child)
        ↓
Collect missing YOB (if not in alumni_members)
        ↓
Calculate age for each profile
        ↓
Filter & categorize:
  - Under 14: BLOCKED (show message, don't create profile)
  - 14-17: CREATE with requires_consent=true, access_level='blocked'
  - 18+: CREATE with access_level='full'
        ↓
User grants parental consent for children 14-17 (if they have any)
        ↓
Create user_profiles entries
        ↓
Account status = 'active'
        ↓
Proceed to Authentication
```

## Documents

1. **[registration.md](./registration.md)** - Account creation + OTP verification
2. **[alumni-discovery.md](./alumni-discovery.md)** - Query alumni by email
3. **[profile-selection.md](./profile-selection.md)** - User selects which profiles to claim
4. **[yob-collection.md](./yob-collection.md)** - Year of birth collection
5. **[age-verification.md](./age-verification.md)** - Age calculation and access level
6. **[parental-consent.md](./parental-consent.md)** - Parental consent for minors
7. **[profile-creation.md](./profile-creation.md)** - Create user_profiles entries
8. **[db-schema.md](./db-schema.md)** - New tables: accounts, user_profiles, PARENT_CONSENT_RECORDS

## Database Tables

| Table | Purpose |
|-------|---------|
| `accounts` | Authentication (replaces `app_users`) |
| `user_profiles` | App users with platform access (replaces `FAMILY_MEMBERS`) |
| `PARENT_CONSENT_RECORDS` | Parental consent audit trail |
| `alumni_members` (enhanced) | Source of truth with YOB, current_center, profile_image_url |

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create account from invitation |
| POST | `/api/auth/register/verify-otp` | Verify email OTP |
| GET | `/api/registration/alumni` | Get alumni matches for email |
| POST | `/api/registration/select-profiles` | User selects profiles |
| POST | `/api/registration/add-yob` | Submit YOB for alumni |
| GET | `/api/registration/age-verification` | Get age/access level for selection |
| POST | `/api/registration/grant-consent` | Parent grants consent |
| POST | `/api/registration/complete` | Finalize account + create profiles |

## Success Criteria

- ✅ Account created in single transaction with OTP verified
- ✅ Account status = 'pending' until profile setup complete
- ✅ Alumni matched by email from alumni_members
- ✅ User selects one or more alumni with relationship
- ✅ YOB collected as 4-digit integer
- ✅ Age calculated: current_year - YOB (conservative)
- ✅ Under 14: cannot create profiles, shown blocking message
- ✅ 14-17: profiles created with requires_consent=true
- ✅ 18+: profiles created with access_level='full'
- ✅ Parental consent prompt for 14-17 profiles
- ✅ All profiles created in single transaction
- ✅ Account status = 'active' after completion

## Related Features

- **[Invitation & Access Control](../invitation-access-control/README.md)** - Invitations lead here
- **[Authentication & Identity](../authentication-identity/README.md)** - Login uses accounts created here
- **[Platform Features](../platform-features/README.md)** - Platform access controlled by profiles

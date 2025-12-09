---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Registration

## Purpose

User creates an account from a valid invitation. Account is the authentication identity for the platform.

## User Flow

1. User has valid invitation token from Invitation & Access Control feature
2. System pre-fills email (from token)
3. User enters password and confirms
4. OTP sent to user's email
5. User enters OTP to verify email ownership
6. Account created in 'pending' status
7. User proceeds to alumni discovery

## Acceptance Criteria

- ✅ Email pre-filled and read-only (from invitation token)
- ✅ Password field with strength requirements shown
- ✅ Password confirmation field
- ✅ Confirm password button triggers OTP send
- ✅ OTP sent to verified email address
- ✅ OTP input page shows masked email (***@example.com)
- ✅ OTP expires after 10 minutes
- ✅ User can request resend OTP (rate-limited: once per minute)
- ✅ Invalid OTP shows error, allows retry
- ✅ After valid OTP, account created in database
- ✅ Account status set to 'pending' (not 'active' yet)
- ✅ Invitation marked as 'accepted' with accepted_by and accepted_at
- ✅ User cannot register same email twice
- ✅ Password meets requirements: min 8 chars, at least one uppercase, one number, one special char
- ✅ Session established after successful registration
- ✅ Progress bar shows user is in registration flow

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)
- Cannot contain email address
- Real-time validation feedback

## OTP Rules

- 4-6 digits (configurable)
- Expires after 10 minutes
- Cannot be reused
- Rate limited: max 3 wrong attempts per OTP, then resend required
- Resend available after 1 minute, max 3 resends per registration

## Error Handling

| Error | Message | Recovery |
|-------|---------|----------|
| Weak password | "Password must include uppercase, number, and special character" | Show requirements, user edits |
| Passwords don't match | "Passwords do not match" | User re-enters confirmation |
| OTP expired | "Your code has expired. Request a new one." | Show resend button |
| Invalid OTP | "Incorrect code. You have X attempts left." | User retries |
| Too many OTP attempts | "Too many attempts. Request a new code." | Resend required |
| Email already registered | "An account already exists for this email" | Direct to login or contact support |

## Account Creation Details

- Account created with `status='pending'` (not yet active)
- accounts table entry created
- Invitation marked as 'accepted'
- Session established with account_id
- User redirected to alumni discovery

## Related

- [Invitation Acceptance](../invitation-access-control/invitation-acceptance.md) - Preceding step with valid token
- [Alumni Discovery](./alumni-discovery.md) - Next step
- [Profile Creation](./profile-creation.md) - Final account activation

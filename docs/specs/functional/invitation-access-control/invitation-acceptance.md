---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Invitation Acceptance

## Purpose

User clicks invitation link and validates the token. Upon validation, user proceeds to registration.

## User Flow

1. User receives email with invitation link
2. User clicks: `<base_url>/register?token=<invitation_token>`
3. System validates token:
   - Signature check (HMAC)
   - Expiry check (current time < expires_at)
   - Status check (status != 'revoked')
4. If valid:
   - Pre-fill email from invitation
   - Show available alumni matches for that email
   - User proceeds to Registration & Onboarding
5. If invalid/expired:
   - Show error message with reason
   - Offer option to request resend (requires email input)

## Acceptance Criteria

- ✅ Valid token shows registration form with pre-filled email
- ✅ Email field is read-only (from token)
- ✅ System queries alumni_members for email matches
- ✅ Alumni list displays: name, batch, center (if YOB available, show age/COPPA status)
- ✅ Expired token shows: "Your invitation has expired (valid until: <date>)"
- ✅ Revoked token shows: "This invitation is no longer valid"
- ✅ Invalid signature shows: "Invalid invitation link"
- ✅ Token cannot be reused after account creation
- ✅ User can request resend if token expired
- ✅ Session created with token_id for validation of subsequent steps
- ✅ Rate limiting on validation (prevent brute force)

## Token Validation Process

### Validation Checks
1. Token format validation
2. Signature verification using HMAC
3. Expiry time check
4. Status verification in database
5. Rate limiting check

### Error Scenarios
- Invalid format: Malformed token structure
- Invalid signature: Token tampered with or corrupted
- Expired: Current time past expires_at
- Revoked: Status set to 'revoked' by admin
- Already accepted: Status already set to 'accepted'

### Success Outcome
- Token marked as valid
- Email pre-filled in registration form
- Alumni matches displayed
- Session initialized with invitation context

## Alumni Display

For matching alumni records:
- Show name, batch year, center
- Display age if YOB available
- Show COPPA status (Full Access, Requires Consent, Blocked)
- Multiple matches handled gracefully

## Session Management

Upon valid token:
- Store token in session for verification
- Store email for pre-fill
- Store alumni matches for display
- Session used in next step to prevent token replay

## User Experience

### Valid Token Flow
- Seamless transition to registration
- Pre-filled email removes friction
- Alumni context available for selection
- Clear progress indication

### Invalid Token Flow
- Clear error message explaining issue
- Immediate options for resolution
- Support contact information
- Professional error handling

## Related

- [Invitation Generation](./invitation-generation.md) - Admin creates invitations
- [Invitation Tracking](./invitation-tracking.md) - Admin views status
- [Registration & Onboarding](../registration-onboarding/registration.md) - Next step after validation

---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Invitation Expiry & Revocation

## Purpose

Handle automatic and manual expiration of invitations. Expired/revoked invitations cannot be used to create accounts.

## Lifecycle

```
Created (pending)
  ├── User accepts before expiry → accepted ✅
  ├── Expiry time passes → expired (no access) ❌
  └── Admin revokes → revoked (no access) ❌

Expired/Revoked states:
  └── Cannot be re-activated
  └── Cannot be reused
  └── User can request resend (generates new invitation)
```

## Acceptance Criteria

- ✅ Invitations expire after configured period (default 7 days)
- ✅ Expiry time stored: `created_at + expiry_days`
- ✅ Admin can customize expiry days (1-30 days)
- ✅ Expired invitations cannot be used for registration
- ✅ Validation checks expiry at token validation time
- ✅ No background cleanup job (check at access)
- ✅ Admin can revoke pending invitations
- ✅ Revoked invitations show in admin panel with revoke reason/timestamp
- ✅ Both expired and revoked show clear error messages to users
- ✅ Admin dashboard shows count of expiring-soon invitations (< 1 day)
- ✅ No "reactivate" functionality (user requests resend instead)

## Expiry Rules

### Default Expiry
- Valid for 7 days from creation
- Configurable per admin settings
- Ranges: 1 to 30 days allowed

### Expiry Check
- Checked at token validation time (not background job)
- Compared against current timestamp
- If current time > expires_at, token invalid

### Expiry Status
- Token becomes expired once expiry timestamp passes
- System returns clear "TOKEN_EXPIRED" error
- Admin dashboard shows expired count

## Revocation Rules

### Who Can Revoke
- Admin users only
- Cannot revoke already-accepted invitations
- Cannot revoke already-expired invitations (no point)

### Revocation Effect
- Invitation status changed to 'revoked'
- Original token becomes immediately invalid
- Cannot be undone
- User must request new invitation

### Revocation Audit
- Tracks which admin revoked
- Records timestamp
- Optional reason field
- Visible in invitation details

## Expiry Configuration

Admin settings (backend):
- `default_expiry_days`: 7 (invitations valid for 7 days by default)
- `max_expiry_days`: 30 (admin cannot set beyond 30 days)
- `resend_reset_expiry`: true (resending resets expiry date)

## User-Facing Errors

### Token Expired
```
Message: "Your invitation has expired"
Subtext: "Invitations are valid for 7 days from sending"
CTA: "Request new invitation"
```

### Invitation Revoked
```
Message: "This invitation is no longer valid"
Subtext: "The administrator revoked this invitation"
CTA: "Contact support"
```

## Related

- [Invitation Generation](./invitation-generation.md) - Expiry set at creation
- [Invitation Tracking](./invitation-tracking.md) - Admin manages expiry

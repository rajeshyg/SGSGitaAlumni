---
version: "1.0"
status: active
last_updated: 2025-12-07
description: Invitation & Access Control System
---

# Invitation & Access Control

## Overview

The invitation system establishes the foundational access control that gates entry to the platform. This feature focuses on:
- Admin-controlled invitation generation
- Secure token validation
- Invitation lifecycle management
- User accessibility requirements

## Key Principles

1. **Invitations as Gatekeeping**: Only invited users can create accounts
2. **Secure Tokens**: HMAC-based, cryptographically secure, time-limited
3. **Admin Control**: Full audit trail and management of invitations
4. **Clear States**: pending → accepted/expired/revoked with clear transitions

## Workflow

```
Admin creates invitation
        ↓
System generates unique token + sends email
        ↓
User clicks link with token
        ↓
System validates token (signature + expiry)
        ↓
Token valid → Proceed to Registration
Token invalid/expired → Show error, offer resend
```

## Documents

1. **[invitation-generation.md](./invitation-generation.md)** - Admin creates invitations
2. **[invitation-acceptance.md](./invitation-acceptance.md)** - User validates token and begins registration
3. **[invitation-tracking.md](./invitation-tracking.md)** - Admin views and manages invitations
4. **[invitation-expiry.md](./invitation-expiry.md)** - Automatic and manual expiration
5. **[db-schema.md](./db-schema.md)** - Database tables and relationships

## Database Tables

- `USER_INVITATIONS` - Invitation records with token, status, timestamps

## API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/invitations` | Create single invitation (admin) |
| POST | `/api/invitations/bulk` | Bulk upload invitations (admin) |
| GET | `/api/invitations` | List invitations (admin) |
| GET | `/api/invitations/validate` | Validate token (public) |
| GET | `/api/invitations/:id` | Get invitation details (admin) |
| POST | `/api/invitations/:id/resend` | Resend invitation (admin) |
| POST | `/api/invitations/:id/revoke` | Revoke invitation (admin) |

## Success Criteria

- ✅ Admin can create invitations (single and bulk)
- ✅ System generates cryptographically secure tokens
- ✅ Tokens expire after configured period (default 7 days)
- ✅ Token validation prevents unauthorized access
- ✅ Admin can track all invitations and resend/revoke
- ✅ Email notifications sent reliably
- ✅ Audit trail maintained for all actions

## Frontend Entry Point

Registration modal shown only when accessed via valid invitation token:
- URL: `/register?token=<invitation_token>`
- Invalid/expired: Shows error page with resend option

## Related Features

- **[Registration & Onboarding](../registration-onboarding/README.md)** - Follows successful invitation acceptance
- **[Authentication & Identity](../authentication-identity/README.md)** - Uses accounts created from invitations
- **[Platform Features](../platform-features/README.md)** - Access gated by account status

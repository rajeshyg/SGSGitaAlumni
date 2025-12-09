---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Invitation Generation

## Purpose

Admin creates invitations to control who can register. Invitations are the primary access control mechanism for the platform.

## User Flow

### Single Invitation
1. Admin navigates to admin dashboard → Invitations section
2. Admin enters email address
3. Admin clicks "Send Invitation"
4. System generates invitation and sends email
5. Confirmation shown to admin

### Bulk Invitation (CSV Upload)
1. Admin navigates to admin dashboard → Invitations section
2. Admin clicks "Bulk Upload"
3. Admin selects CSV file (format: one email per line)
4. Admin previews list of emails
5. Admin clicks "Upload"
6. System processes each email and sends invitations
7. Progress shown; completion summary displayed

## Acceptance Criteria

- ✅ Admin can create single invitation with just an email
- ✅ System generates unique HMAC token per invitation
- ✅ Token includes signature for tampering detection
- ✅ Expiry defaults to 7 days, configurable via settings
- ✅ Email sent with invitation link: `<base_url>/register?token=<token>`
- ✅ Invitation stored in `USER_INVITATIONS` with status='pending'
- ✅ Created timestamp and admin user_id recorded
- ✅ Invalid email format rejected
- ✅ Duplicate invitations (same email) handled: show warning, allow override
- ✅ Bulk upload processes CSV line-by-line
- ✅ Bulk upload shows success/failure count
- ✅ Email sending failures logged, admin notified

## Endpoint Details

### POST /api/invitations

Creates a single invitation and sends email immediately.

### POST /api/invitations/bulk

Processes CSV file with multiple emails for batch invitation sending.

### Token Security

Token generation ensures:
- Unique token per invitation (no collisions)
- Signature verification prevents tampering
- Expiry enforced at validation time
- Cannot be reused after acceptance

### Email Template

Invitations sent with:
- Unique registration link with token
- Expiry date clearly stated
- Support contact information
- Clear call-to-action to register

## Database Entries

Each invitation creates `USER_INVITATIONS` record with:
- Unique token
- Email address
- Status tracking
- Created timestamp and admin reference
- Expiry time
- Acceptance tracking fields

## Related

- [Invitation Acceptance](./invitation-acceptance.md) - User validates token
- [Invitation Tracking](./invitation-tracking.md) - Admin views status
- [Invitation Expiry](./invitation-expiry.md) - Token lifecycle

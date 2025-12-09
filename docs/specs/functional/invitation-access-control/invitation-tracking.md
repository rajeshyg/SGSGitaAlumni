---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Invitation Tracking & Management

## Purpose

Admin views all invitations, filters by status, and manages lifecycle (resend, revoke).

## User Flow

1. Admin navigates to Admin Dashboard → Invitations
2. System displays paginated list of invitations
3. Admin can:
   - View invitation details
   - Filter by status (pending, accepted, expired, revoked)
   - Search by email
   - Resend pending invitation
   - Revoke pending invitation
4. Admin sees analytics: total, pending, accepted, expired counts

## Acceptance Criteria

- ✅ Admin sees paginated list (default 25 per page)
- ✅ Each row shows: email, status, sent_at, expires_at
- ✅ Accepted invitations show: accepted_by (email), accepted_at
- ✅ Filter by status dropdown: All, Pending, Accepted, Expired, Revoked
- ✅ Search by email (partial match)
- ✅ Sort by: sent_at, expires_at, status
- ✅ Status badge colors: pending=yellow, accepted=green, expired=gray, revoked=red
- ✅ Admin can resend invitation (generates new token, sends email)
- ✅ Admin can revoke pending invitation (status='revoked', token invalid)
- ✅ Revoked invitations cannot be re-accepted
- ✅ Dashboard shows summary cards: Total Sent, Pending, Accepted %, Expiring Soon

## Admin Dashboard

### Invitations List View
- Paginated table of all invitations
- Sortable columns: email, status, created date, expiry date
- Filterable by status
- Searchable by email address
- Action buttons per invitation: view details, resend, revoke

### Summary Cards
- **Total Sent**: Count of all invitations ever sent
- **Pending**: Count of not-yet-accepted
- **Accepted**: Count of successful registrations
- **Acceptance Rate**: Percentage of accepted vs. sent
- **Expiring Soon**: Count expiring within 24 hours

### Invitation Details
- Email address
- Status with timestamp
- Expiry date
- Created by (admin name)
- Accepted by (if applicable)
- Accept date/time (if applicable)
- Action buttons

## Management Actions

### Resend Invitation
- Available for: pending status
- Generates new token
- Sends new email
- Resets expiry timer
- Updates invitation record

### Revoke Invitation
- Available for: pending status
- Changes status to 'revoked'
- Original token becomes invalid
- No reversal possible
- Optional reason field for audit trail

## Related

- [Invitation Generation](./invitation-generation.md) - Creating invitations
- [Invitation Expiry](./invitation-expiry.md) - Expiration logic

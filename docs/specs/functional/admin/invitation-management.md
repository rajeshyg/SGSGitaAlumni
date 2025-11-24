---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Invitation Management

## Purpose
Generate and manage invitation codes for new user registration.

## User Flow
1. Admin accesses invitation panel
2. Admin generates invitation (single or batch)
3. System creates unique invitation codes
4. Admin shares invitation links via email
5. Admin tracks invitation status (pending, used, expired)

## Acceptance Criteria
- ✅ Generate single invitation
- ✅ Bulk invitation generation
- ✅ View all invitations with status
- ✅ Email invitation directly from admin panel
- ✅ Set expiry dates
- ✅ Revoke unused invitations
- ✅ Track who used each invitation

## Implementation
- **Route**: `GET /api/invitations`, `POST /api/invitations`, `DELETE /api/invitations/:id`
- **File**: `routes/invitations.js` (1052 lines)
- **Frontend**: `src/components/admin/InvitationSection.tsx`
- **Test**: Pending

## Related
- [Authentication: Registration](../authentication/registration.md)
- [User Management](./user-management.md)

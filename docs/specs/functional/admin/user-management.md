---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# User Management

## Purpose
Allow administrators to manage user accounts and permissions.

## User Flow
1. Admin accesses user management panel
2. Admin searches for users
3. Admin views user details
4. Admin performs actions (activate, deactivate, reset password, change role)
5. System applies changes

## Acceptance Criteria
- ✅ View all users with search/filter
- ✅ User details with activity history
- ✅ Activate/deactivate accounts
- ✅ Reset passwords
- ✅ Assign roles (admin, moderator, user)
- ✅ Bulk actions
- ✅ Export user list

## Implementation
- **Route**: Admin user management routes
- **File**: `routes/users.js`
- **Frontend**: `src/components/admin/UserManagement.tsx`
- **Test**: Pending

## Related
- [Invitation Management](./invitation-management.md)
- [System Monitoring](./system-monitoring.md)

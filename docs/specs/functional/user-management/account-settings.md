---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Account Settings

## Purpose
Provide users control over account security and privacy settings.

## User Flow
1. User accesses settings page
2. User views/modifies settings categories:
   - Password change
   - Privacy settings
   - Notification preferences
   - Account deactivation
3. User saves changes
4. System applies settings

## Acceptance Criteria
- ✅ Change password with current password verification
- ✅ Toggle profile visibility (public/alumni-only)
- ✅ Control who can message/contact
- ✅ Manage notification preferences
- ✅ Deactivate account option
- ✅ Data export request

## Implementation
- **Route**: `PUT /api/users/settings`
- **File**: `routes/users.js`
- **Frontend**: `src/pages/Settings.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Preferences](./preferences.md)
- [Profile Management](./profile-management.md)

---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Profile Management

## Purpose
Allow users to view and update their profile information.

## User Flow
1. User navigates to profile/settings page
2. System displays current profile data
3. User edits fields (name, batch, location, bio, etc.)
4. User saves changes
5. System validates and updates profile

## Acceptance Criteria
- ✅ Edit basic info: name, batch, location, bio
- ✅ Update contact details: email, phone
- ✅ Set visibility preferences for profile fields
- ✅ Real-time validation
- ✅ Success/error feedback

## Implementation
- **Route**: `PUT /api/users/profile`
- **File**: `routes/users.js`
- **Frontend**: `src/pages/Settings.tsx`, `src/components/ProfileForm.tsx`
- **Test**: `tests/e2e/dashboard.spec.ts`

## Related
- [Account Settings](./account-settings.md)
- [Profile Photos](./profile-photos.md)

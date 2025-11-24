---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Family Member Management

## Purpose
Allow primary account holders to add/remove family members sharing the same email.

## User Flow
1. Primary user navigates to family settings
2. User clicks "Add Family Member"
3. User enters family member details (name, relationship)
4. System creates linked profile
5. Family member receives invitation email
6. Family member sets password
7. Shared email used for all family profiles

## Acceptance Criteria
- ✅ Add multiple family members to one email
- ✅ Individual credentials per family member
- ✅ Profile selector on login
- ✅ Primary user can manage family members
- ✅ Each member has separate preferences/settings
- ✅ Shared invitation system

## Implementation
- **Route**: `POST /api/family-members`, `GET /api/family-members`, `DELETE /api/family-members/:id`
- **File**: `routes/family-members.js`
- **Service**: `services/FamilyMemberService.js`
- **Frontend**: `src/pages/FamilySettings.tsx`, `src/pages/ProfileSelection.tsx`
- **Test**: `tests/e2e/auth.spec.ts`

## Related
- [Authentication: Login](../authentication/login.md)
- [Authentication: Registration](../authentication/registration.md)

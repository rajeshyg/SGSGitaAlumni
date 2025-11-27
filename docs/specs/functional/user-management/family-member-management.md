---
version: "2.0"
status: implemented
last_updated: 2025-11-26
---

# Family Member Management

## Purpose
Enable family member profiles for alumni accounts with COPPA-compliant age verification and parental consent for minors. **Note**: Family members are pre-populated from institutional records by admin, NOT added by users.

## User Flow

### System Design (Alumni-Only Platform)
**CRITICAL**: This is an **invitation-only Alumni system**. Only individuals certified in previous batches can be in the system. Users CANNOT add arbitrary people.

**Data Flow**:
1. **Admin has complete database** of alumni and their families (from institutional records)
2. **Admin sends invitations** to alumni members
3. **Alumni accepts invitation** and creates account
4. **Alumni sees their family members** (already in database from institutional records)
5. **Parent consent flow** activates for minors (ages 14-17)

### Family Member Access Flow
1. Alumni logs in after accepting admin invitation
2. System displays all family members linked to their account (from institutional database)
3. Alumni can view family member profiles on profile selection screen
4. For minors requiring consent:
   - **Under 14**: Blocked entirely (COPPA compliance)
   - **14-17**: Parent must grant consent via consent modal
   - **18+**: Full platform access
5. Parent clicks on minor's profile → Consent modal appears
6. After consent granted → Minor can access platform with supervised access

### Parent Consent Flow (Ages 14-17)
1. Parent logs in and sees profile selection screen
2. Minor's profile shows "Needs Consent" status
3. Parent clicks on minor's profile
4. **Parent Consent Modal** appears with:
   - Child's name, age, and relationship
   - Consent terms and COPPA acknowledgment checkboxes
   - Optional digital signature field
5. Parent reviews and grants consent
6. System creates audit trail in `PARENT_CONSENT_RECORDS` table
7. Minor's profile status changes to "active" with supervised access
8. Parent is automatically switched to minor's profile
9. Consent expires after 1 year (requires renewal)

## Acceptance Criteria
- ✅ **Admin manages member data**: Family members added/updated by admin from institutional records
- ✅ **Individual profiles**: Each family member has separate profile under shared email
- ✅ **Profile selector**: Netflix-style selector on login
- ✅ **View-only for users**: Alumni can view but not add/edit family member data
- ✅ **Separate preferences**: Each member has individual preferences/settings
- ✅ **Invitation-only**: Admin sends invitations, no public signup
- ✅ **COPPA compliance**: Under 14 blocked entirely
- ✅ **Age verification**: Automatic age calculation from birthdate
- ✅ **Parent consent**: Modal UI for granting consent (14-17)
- ✅ **Consent audit trail**: IP address, timestamp, user agent logged
- ✅ **Consent expiration**: 1-year validity with renewal requirement
- ✅ **Consent revocation**: Parent can revoke consent at any time

## Age Restrictions & Access Levels

| Age Range | Access Level | Status | Platform Access |
|-----------|-------------|---------|-----------------|
| Under 14  | `blocked`   | `blocked` | ❌ No access (COPPA) |
| 14-17     | `supervised` | `pending_consent` → `active` | ⚠️ Requires parent consent |
| 18+       | `full`      | `active` | ✅ Full access |

## Implementation

### Backend
- **Routes**: `routes/family-members.js`
  - `POST /api/family-members` - Create family member
  - `GET /api/family-members` - List all family members
  - `GET /api/family-members/:id` - Get specific member
  - `PUT /api/family-members/:id` - Update member
  - `DELETE /api/family-members/:id` - Delete member
  - `POST /api/family-members/:id/switch` - Switch active profile
  - **`POST /api/family-members/:id/consent/grant`** - Grant parent consent
  - **`POST /api/family-members/:id/consent/revoke`** - Revoke consent
  - **`GET /api/family-members/:id/consent/check`** - Check consent status
  - **`GET /api/family-members/:id/consent-history`** - View consent audit trail
  - `GET /api/family-members/logs/access` - Access logs

- **Service**: `server/services/FamilyMemberService.js`
  - `getFamilyMembers()`, `createFamilyMember()`
  - **`grantParentConsent()`** - Creates consent record
  - **`revokeParentConsent()`** - Marks consent as inactive
  - **`checkConsentRenewal()`** - Checks if consent expired

### Frontend
- **Pages**:
  - `src/pages/FamilySettings.tsx` - Manage family members
  - `src/pages/ProfileSelectionPage.tsx` - Netflix-style profile selector

- **Components**:
  - `src/components/family/FamilyProfileSelector.tsx` - Profile cards
  - `src/components/family/AddFamilyMemberModal.tsx` - Add member form
  - **`src/components/family/ParentConsentModal.tsx`** - Consent UI

- **Services**:
  - `src/services/familyMemberService.ts` - API client

### Database
- **Tables**:
  - `FAMILY_MEMBERS` - Family member profiles
  - **`PARENT_CONSENT_RECORDS`** - COPPA consent audit trail
  - `FAMILY_ACCESS_LOG` - Profile switch activity logs

### Tests
- `tests/e2e/auth.spec.ts` - Family authentication flow

## Related
- [Authentication: Login](../authentication/login.md)
- [Authentication: Registration](../authentication/registration.md)

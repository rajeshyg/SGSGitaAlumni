---
version: "1.0"
status: in-progress
last_updated: 2025-11-23
---

# Age Verification

## Purpose
Ensure COPPA compliance by verifying user age and applying appropriate restrictions.

## User Flow
1. User provides date of birth during registration
2. System calculates age
3. If under 13: Registration blocked
4. If 13-17: Parental consent required
5. If 18+: Full access granted

## Acceptance Criteria
- ✅ Date of birth captured during registration
- ⏳ Age calculated and stored
- ⏳ Users under 13 blocked from registration
- ⏳ Age-appropriate content filtering
- ⏳ Audit trail for age verification

## Implementation
- **Database**: `requires_parent_consent` field in `app_users`
- **Table**: `AGE_VERIFICATION_AUDIT`
- **File**: `routes/auth.js`
- **Test**: Pending

## Related
- [Parental Consent](./parental-consent.md)
- [Registration](./registration.md)
- [Technical Spec: COPPA Compliance](../../technical/security/compliance.md)

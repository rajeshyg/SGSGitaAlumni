---
version: "1.0"
status: in-progress
last_updated: 2025-11-23
---

# Parental Consent

## Purpose
Obtain and record parental consent for users aged 13-17 per COPPA requirements.

## User Flow
1. Minor (13-17) completes registration
2. System prompts for parent email address
3. System sends consent request to parent email
4. Parent clicks verification link
5. Parent reviews terms and grants consent
6. System records consent and activates account

## Acceptance Criteria
- ⏳ Parent email separate from child's account email
- ⏳ Consent verification link with expiration (7 days)
- ⏳ Clear explanation of data collection
- ⏳ Consent timestamp recorded
- ⏳ Ability to revoke consent
- ⏳ Account restrictions until consent granted

## Implementation
- **Database**: `parent_consent_given`, `parent_email` in `app_users`
- **Table**: `PARENT_CONSENT_RECORDS`
- **File**: `routes/auth.js`
- **Test**: Pending

## Related
- [Age Verification](./age-verification.md)
- [Registration](./registration.md)
- [Technical Spec: COPPA Compliance](../../technical/security/compliance.md)

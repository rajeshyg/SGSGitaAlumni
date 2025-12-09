---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Parental Consent

## Purpose

Parent grants legal consent for children aged 14-17 to access the platform, as required by COPPA.

## User Flow

1. User has profiles aged 14-17 requiring consent
2. System presents parental consent form
3. Form shows list of children needing consent
4. Parent reads COPPA disclosure and consent terms
5. Parent confirms they have parental authority
6. Parent grants consent for each child (can grant all at once)
7. Consent recorded in PARENT_CONSENT_RECORDS table
8. Proceeds to profile creation

## Acceptance Criteria

- ✅ Show list of child profiles requiring consent
- ✅ Display each child: name, age, batch
- ✅ Show clear, understandable COPPA disclosure text
- ✅ Parent must actively check "I consent" checkbox
- ✅ Cannot proceed without checking consent
- ✅ Clear explanation of what consent means
- ✅ Parent can consent for multiple children in one action
- ✅ Consent recorded with timestamp and account_id
- ✅ Consent audit trail maintained (PARENT_CONSENT_RECORDS)
- ✅ Consent can be withdrawn later (future feature)
- ✅ Progress indicator shows step in registration flow
- ✅ Skip this step if no children aged 14-17

## COPPA Compliance Points

✅ Informed Consent: Parent reads disclosure
✅ Parental Authority: Parent confirms they have authority
✅ Data Minimization: Only email and YOB collected
✅ Audit Trail: All consents recorded in database
✅ Data Control: Parent can view/delete child data (future)
✅ Transparency: Clear explanation of what consent means

## Disclosure Content

The parental consent form includes:
- Clear statement about COPPA requirements
- Explanation of data collected (email, YOB only)
- Statement about data protection practices
- Parent's rights regarding child's data
- Clear "I consent" checkbox with affirmation text

## Data Stored

### PARENT_CONSENT_RECORDS Entry
For each child profile, record created:
- `parent_profile_id`: Parent's user_profiles.id
- `child_profile_id`: Child's user_profiles.id (created after consent)
- `consent_type`: "parental_consent"
- `consent_given_at`: Current timestamp
- `consent_expires_at`: One year from now
- `status`: "active"

### user_profiles Update
After consent, update child's profile:
- `parent_consent_given`: true
- `access_level`: Changed from 'blocked' to 'supervised'
- `consent_expiry_date`: One year from now

## Consent Expiry

- Consent valid for 12 months
- After expiry, child profile access blocked again
- System sends notification 30 days before expiry
- Parent can renew consent with one click

## Edge Cases

- **Parent has no children 14-17**: Skip this step entirely
- **Parent has one child 14-17**: Show single consent form
- **Parent has multiple children 14-17**: Show all, single "Grant Consent for All" button
- **Parent wants to withhold consent**: Can click Back, child profile not created
- **Parent later withdraws consent**: Admin UI to manage

## Related

- [Age Verification](./age-verification.md) - Determines who needs consent
- [Profile Creation](./profile-creation.md) - Creates profiles after consent
- [PARENT_CONSENT_RECORDS](./db-schema.md) - Database table for consent tracking

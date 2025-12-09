---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Profile Creation

## Purpose

Create user_profiles entries for all eligible profiles and finalize account activation.

## User Flow

1. All previous steps complete:
   - Account created and OTP verified
   - Alumni profiles selected
   - YOB collected
   - Age verified
   - Parental consent obtained (if needed)
2. System creates user_profiles entries in database
3. Links profiles to account and alumni_members
4. Sets relationship, consent status, and access level
5. Account status changed to 'active'
6. Sends welcome email
7. User redirected to login or dashboard

## Acceptance Criteria

- ✅ user_profiles entries created for each eligible profile:
  - All 18+ year olds
  - All 14-17 year olds who received parental consent
  - NOT for under 14 year olds
- ✅ Each profile linked to:
  - The account (account_id)
  - The alumni record (alumni_member_id)
  - Parent profile if child (parent_profile_id)
- ✅ Relationship set: 'parent' or 'child' (no 'self', 'spouse', etc.)
- ✅ COPPA fields set correctly:
  - 18+: access_level='full', requires_consent=false
  - 14-17 with consent: access_level='supervised', requires_consent=true
  - 14-17 without consent: access_level='blocked', requires_consent=true
- ✅ All profiles created in single transaction (all-or-nothing)
- ✅ PARENT_CONSENT_RECORDS created for 14-17 profiles
- ✅ Account status changed to 'active'
- ✅ USER_INVITATIONS status confirmed as 'accepted'
- ✅ Welcome email sent with next steps
- ✅ Session updated with new profiles
- ✅ User can see dashboard after completion

## Creation Logic

### For Each Eligible Profile

Profile marked as 'parent' or account owner:
- Create user_profiles entry
- Set relationship='parent'
- Set access_level='full' (if 18+)
- Set parent_profile_id=NULL
- status='active'

Profile marked as 'child' who is 14-17 with consent:
- Create user_profiles entry
- Set relationship='child'
- Set access_level='supervised'
- Set parent_profile_id=<parent_profile_id>
- Set parent_consent_given=true
- status='active'

Profile marked as 'child' who is 14-17 without consent:
- Create user_profiles entry
- Set relationship='child'
- Set access_level='blocked'
- Set parent_profile_id=<parent_profile_id>
- Set parent_consent_given=false
- status='active'
- (Can only access after parent grants consent)

Profile under 14 years old:
- DO NOT create user_profiles entry
- Data remains in alumni_members only
- No platform access possible

### Transaction Requirements

All profile creation must happen in single database transaction:
- If any profile creation fails, rollback entire transaction
- User sees success/failure message
- On failure, user can retry or contact support

## Account Finalization

After profiles created successfully:

1. Update accounts table:
   - Set status='active' (was 'pending')
   - Set last_login_at=NULL (hasn't logged in yet)

2. Confirm USER_INVITATIONS:
   - Verify status='accepted'
   - Confirm accepted_by=<account_id>

3. Send welcome email:
   - List created profiles
   - Explain what comes next
   - Links to dashboard/login

4. Clear session data:
   - Remove temporary registration data
   - Keep only account_id for next step

## Error Handling

### Partial Failure
If some profiles fail to create:
- Show which profiles succeeded
- Show which failed with reason
- Offer retry option
- Contact support link

### Transaction Rollback
If any critical step fails:
- All profiles rolled back
- Account reverted to 'pending'
- User notified
- Retry button provided

## Related

- [Parental Consent](./parental-consent.md) - Preceding step for minors
- [Age Verification](./age-verification.md) - Determines eligibility
- [Authentication & Identity](../authentication-identity/README.md) - Next feature (login/session)

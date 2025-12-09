---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Age Verification

## Purpose

Calculate age for each selected profile and determine access level based on COPPA compliance rules.

## User Flow

1. User has provided YOB for all selected profiles
2. System calculates age for each: current_year - year_of_birth
3. System categorizes into three groups:
   - Under 14: Cannot access platform (blocked)
   - 14-17: Can access with parental consent
   - 18+: Full access immediately
4. Show user summary of access levels
5. For profiles under 14: explain they cannot use platform
6. For profiles 14-17: proceed to parental consent step
7. For profiles 18+: proceed to profile creation

## Acceptance Criteria

- ✅ Age calculated: current_year - year_of_birth
- ✅ Conservative approach: assume birthday is December 31
- ✅ Display age clearly for each profile
- ✅ Show access level label: "Full Access", "Requires Parental Consent", "Blocked"
- ✅ Under 14 profiles show blocking message with reason (COPPA)
- ✅ 14-17 profiles show consent requirement explanation
- ✅ Under 14 profiles NOT included in profile creation (no user_profiles entry)
- ✅ Summary shows categorization counts
- ✅ Clear next steps explained to user
- ✅ User acknowledges understanding before proceeding
- ✅ Progress indicator shows step in registration flow

## Age Calculation

### Formula
```
Age = Current Year - Year of Birth
Example: 2025 - 2008 = 17 years old
```

### Conservative Assumption
- Assumes birthday is December 31 of birth year
- Rationale: Gives most conservative (youngest) age
- Example: Someone born in 2008 assumed to be 16 until Dec 31, then 17
- Result: No one slips into wrong category due to exact birthdate

## COPPA Categories

### Category 1: Under 14 (BLOCKED)
- Age < 14
- BLOCKED from platform completely
- No user_profiles entry created
- Data remains in alumni_members only
- User shown: "You cannot access the platform yet (COPPA). Check back when you turn 14."

### Category 2: 14-17 (REQUIRES CONSENT)
- Age >= 14 and Age < 18
- Can access platform ONLY with parental consent
- user_profiles created with access_level='blocked'
- Parental consent step required (next)
- User shown: "You can access with parental consent from a parent on this account"

### Category 3: 18+ (FULL ACCESS)
- Age >= 18
- Full platform access immediately
- user_profiles created with access_level='full'
- No consent needed
- Skips parental consent step, goes straight to profile creation

## Threshold Dates

The system uses calendar year boundaries:
- **January 1, 2012 or later**: Age < 14 → BLOCKED
- **Between January 1, 2008 and December 31, 2011**: Age 14-17 → REQUIRES CONSENT
- **December 31, 2007 or earlier**: Age 18+ → FULL ACCESS

## Session Updates

Store age verification results:

```
session.registrationData.profiles = {
  blocked: [{ alumni_member_id: 103, name: "Arjun", age: 12 }],
  requiresConsent: [{ alumni_member_id: 102, name: "Priya", age: 17 }],
  fullAccess: [{ alumni_member_id: 101, name: "Rajesh", age: 39 }]
}
```

## Related

- [YOB Collection](./yob-collection.md) - Previous step collecting birth years
- [Parental Consent](./parental-consent.md) - For 14-17 year old profiles
- [Profile Creation](./profile-creation.md) - Create user_profiles entries

---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Profile Selection

## Purpose

User selects which alumni profiles they want to claim and specifies their relationship (parent or child).

## User Flow

1. User sees all alumni matches from previous step
2. User checks boxes for profiles they want to claim
3. For each selection, user specifies relationship:
   - "This is me" (indicates user is the alumni)
   - "This is my child" (indicates alumni is user's child)
4. User confirms selection
5. System validates at least one profile selected
6. Proceeds to YOB collection for incomplete profiles

## Acceptance Criteria

- ✅ User can select one or more alumni profiles
- ✅ Selection via checkboxes
- ✅ For each checked profile, relationship selector appears
- ✅ Relationship options: "This is me" or "This is my child"
- ✅ "This is me" option assumes user is that alumni member
- ✅ "This is my child" assumes alumni is user's child
- ✅ At least one profile must be selected to continue
- ✅ Cannot select same profile twice
- ✅ Clear visual feedback for selected profiles
- ✅ Back button returns to alumni list
- ✅ Selection persists if user navigates back
- ✅ Progress indicator shows step in registration flow
- ✅ Error message if trying to proceed with no selection

## Selection Logic

### "This is me" Option
- Stores relationship = 'parent' in user_profiles
- Indicates user is claiming this alumni record as their own profile
- User becomes the "parent" or account holder for this profile
- Only one profile can be marked as "This is me" per account (though UI allows multiple, backend enforces)

### "This is my child" Option
- Stores relationship = 'child' in user_profiles
- Indicates alumni is user's child
- Links user's profile to child's profile via parent_profile_id
- Child profile requires parental consent
- Multiple children can be selected

## Validation Rules

- Minimum: 1 profile selected
- Maximum: Unlimited (no hard cap, but UX should warn if > 5)
- Relationship required for each selected profile
- Cannot mark multiple profiles as "This is me" (backend check)
- Must have at least one "This is me" or admit you're a parent

## Data Stored in Session

```
session.registrationData = {
  selectedProfiles: [
    {
      alumni_member_id: 101,
      name: "Rajesh Kumar",
      relationship: "parent",
      year_of_birth: 1986
    },
    {
      alumni_member_id: 102,
      name: "Priya Kumar",
      relationship: "child",
      year_of_birth: 2008
    }
  ]
}
```

## Related

- [Alumni Discovery](./alumni-discovery.md) - Previous step showing list
- [YOB Collection](./yob-collection.md) - Next step to fill missing data
- [Age Verification](./age-verification.md) - Determine access levels

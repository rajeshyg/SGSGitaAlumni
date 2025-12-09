---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Alumni Discovery

## Purpose

Show the user all alumni records matching their email address. These are the profiles they can claim during onboarding.

## User Flow

1. Registration complete, account created
2. System queries alumni_members table for matching email
3. Page displays list of matching alumni with basic information
4. User reviews available profiles
5. User selects which profiles to claim

## Acceptance Criteria

- ✅ System queries alumni_members WHERE email = registered_email
- ✅ Display shows all matches (could be 1 to many profiles)
- ✅ Each profile shows: name (first + last), batch year, center name
- ✅ If year_of_birth exists, show calculated age and COPPA status
- ✅ COPPA status shown: "Full Access", "Requires Parental Consent", or "Blocked (Age < 14)"
- ✅ Empty result: "No alumni records found for your email"
- ✅ Profiles sorted by: batch year (descending), then name (ascending)
- ✅ Show total count: "Found X alumni records"
- ✅ Option to "Check Different Email" if no records (but not change email)
- ✅ Progress indicator shows step in registration flow

## Display Rules

### Name Display
- Format: "FirstName LastName"
- Show full names as stored in alumni_members

### Batch Display
- Format: "Batch: YYYY"
- Clickable to see more about that batch/year

### Center Display
- Format: "Center Name"
- From alumni_members.center_name field

### Age Display (if YOB exists)
- Calculated: current_year - year_of_birth
- Conservative: assumes birthday is Dec 31
- Updated annually (calculated at query time, not stored)

### COPPA Status Display
- **Under 14**: "Blocked (age < 14)"
- **14-17**: "Requires Parental Consent"
- **18+**: "Full Access"
- If YOB missing: Show "Age: Unknown" but allow selection

## Data Source

All data from `alumni_members` table:
- `id` - Unique alumni record ID
- `email` - Email address (can match multiple)
- `first_name`, `last_name` - Full name
- `batch` - Graduation/enrollment year
- `center_name` - Training center location
- `year_of_birth` - For age calculation (nullable)
- `status` - Whether record is active (only show active records)

## Sorting

Default sort order:
1. Primary: batch DESC (recent batches first)
2. Secondary: first_name ASC, last_name ASC

Rationale: Most users will recognize family members by batch year first.

## Edge Cases

- **Same name, different batch**: Both shown with batch to disambiguate
- **Missing YOB**: Show "Age: Unknown", allow selection
- **No center data**: Show "Center: Not Specified"
- **Inactive alumni**: Filtered out (status != 'active')

## Related

- [Registration](./registration.md) - Preceding step
- [Profile Selection](./profile-selection.md) - Next step where user selects which to claim
- [YOB Collection](./yob-collection.md) - Collect missing birth years

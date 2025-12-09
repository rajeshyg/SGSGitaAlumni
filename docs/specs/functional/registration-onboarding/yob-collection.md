---
version: "1.0"
status: active
last_updated: 2025-12-07
---

# Year of Birth Collection

## Purpose

Collect year of birth for alumni profiles that don't have it in the database. This is required for COPPA compliance age verification.

## User Flow

1. User has selected profiles
2. System identifies which profiles have missing year_of_birth
3. For each profile missing YOB, show collection form
4. User enters birth year as 4-digit number
5. System validates year is reasonable (1900 < year < current_year)
6. Collected YOB values stored temporarily in session
7. Proceeds to age verification

## Acceptance Criteria

- ✅ Only profiles with NULL year_of_birth require input
- ✅ Profiles with existing YOB show as read-only
- ✅ Year input as dropdown or text field
- ✅ Dropdown shows: current_year down to 1950 (customizable range)
- ✅ Or text field with validation: 4-digit year, 1900 < year < current_year
- ✅ Error if year is future or before 1900
- ✅ Each profile clearly labeled with name and batch
- ✅ All missing YOBs must be filled before continuing
- ✅ Optional: Predefined options if age can be estimated from batch
- ✅ Progress indicator shows step in registration flow
- ✅ Help text explains why birth year needed (age verification)

## Data Entry Rules

### Dropdown Option
- Shows years: current_year down to 1950
- Selected value becomes user's input
- Clear default: no selection (forces conscious choice)
- Labeled: "Select birth year"

### Text Input Option
- 4-digit year format
- Real-time validation
- Error shown below field if invalid
- Allowed range: 1900 < year < current_year

### Batch-Based Estimation
- If batch available, show suggested years
- Example: Batch 2023 suggests 2004-2006 (assuming enrollment at ~18-20)
- User can override suggestions
- Suggestions shown as quick-select buttons, not auto-filled

## Validation Rules

- Required: Cannot be empty
- Format: 4-digit integer
- Range: 1900 < year < current_year
- If future year entered: "Birth year cannot be in the future"
- If too old (< 1900): "Please enter a valid year"

## Why Year of Birth Only?

COPPA (Children's Online Privacy Protection Act) Compliance:
- Requires minimal data collection from users
- Full birthdate (day + month + year) not necessary
- Year-only collection satisfies age verification requirement
- Reduces privacy/storage risk

## Age Calculation Preview

System shows real-time age calculation:
- Formula: current_year - entered_year
- Conservative assumption: birthday is December 31
- Shows COPPA status alongside age:
  - Under 14: "Blocked - Cannot access platform (COPPA)"
  - 14-17: "Requires Parental Consent"
  - 18+: "Full Access"

## Data Stored in Session

Collected YOBs added to existing session data:

```
session.registrationData.selectedProfiles[].year_of_birth = 2008
```

## Related

- [Profile Selection](./profile-selection.md) - Previous step
- [Age Verification](./age-verification.md) - Next step using collected YOB
- [Parental Consent](./parental-consent.md) - For under-18 profiles

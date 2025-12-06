# Year of Birth Verification for Profile Selection

**Date**: 2025-12-05
**Status**: ✅ IMPLEMENTED
**Related**: COPPA Compliance, Family Profile Selection
**Approach**: Leveraged existing `AddFamilyMemberModal` in edit mode instead of creating redundant component

---

## Problem Statement

Family members created from alumni data often have `birth_date = NULL` because the `alumni_raw_data` table lacks DOB information. Without birth_date, COPPA compliance (parental consent for ages 14-17) never triggers during the registration/onboarding process.

## Solution

Enhanced the profile selection flow to detect NULL birth_date and prompt age verification using the existing `AddFamilyMemberModal` in edit mode. When a user selects a profile with NULL birth_date, they're shown an age verification modal. Upon submission, the system recalculates COPPA access fields and routes accordingly.

---

## User Flow

```
User clicks profile → birth_date is NULL?
  → YES: Show YearOfBirthModal → Submit YOB → Recalculate access →
      • Age < 14: Block access (COPPA)
      • Age 14-17: Show ParentConsentModal (supervised access)
      • Age 18+: Proceed to profile switch (full access)
  → NO: Existing flow (check access_level, status, etc.)
```

---

## Implementation Details

### Files Modified (No Redundant Components)

| File | Changes | Rationale |
|------|---------|-----------|
| `server/services/FamilyMemberService.js` | Added `updateBirthDate()` method | Handles COPPA recalculation on birth date update |
| `routes/family-members.js` | Added `POST /api/family-members/:id/birth-date` | API endpoint for updating birth date |
| `src/services/familyMemberService.ts` | Added `updateBirthDate()` function | Client-side API wrapper |
| `src/components/family/AddFamilyMemberModal.tsx` | Enhanced with edit mode support | Reused for age verification instead of new modal |
| `src/components/family/FamilyProfileSelector.tsx` | Integrated age verification check | Detects NULL birth_date and triggers verification |

### Key Features of Edit Mode

- **Member Info Card**: Shows profile avatar with member name and verification prompt
- **Birth Date Input**: Full date picker (not year dropdown) for accuracy
- **Age Calculation**: Real-time display of age implications (under 14 = blocked, 14-17 = needs consent, 18+ = full access)
- **Automatic Routing**: After verification, seamlessly routes to consent modal or direct profile switch based on age

---

## Implementation Status

| Step | Task | Status |
|------|------|--------|
| 1 | Add `updateBirthDate()` backend method | ✅ Complete |
| 2 | Add POST `/birth-date` endpoint | ✅ Complete |
| 3 | Add `updateBirthDate()` client function | ✅ Complete |
| 4 | Enhance `AddFamilyMemberModal` with edit mode | ✅ Complete |
| 5 | Integrate age verification in profile selector | ✅ Complete |
| 6 | Build verification & deploy to test | ⏭️ Ready for Testing |

---

## Testing Scenarios

| Scenario | Expected Result |
|----------|-----------------|
| Profile with birth_date exists | No YOB modal, existing flow works |
| Profile with NULL birth_date clicked | YOB modal appears |
| YOB submitted, calculated age < 14 | Block message, no platform access |
| YOB submitted, calculated age 14-17 | ParentConsentModal appears next |
| YOB submitted, calculated age 18+ | Direct profile switch to dashboard |
| User closes YOB modal without submitting | No changes, member state unchanged |

---

## COPPA Access Rules Reference

| Age | `access_level` | `status` | `can_access_platform` | `requires_parent_consent` |
|-----|----------------|----------|----------------------|--------------------------|
| < 14 | blocked | blocked | false | false |
| 14-17 | supervised | pending_consent | false | true |
| 18+ | full | active | true | false |

---

## Testing Checklist

- [ ] Click profile with `birth_date = NULL` → Age verification modal appears
- [ ] Submit birth date for age < 14 → Block message displays
- [ ] Submit birth date for age 14-17 → Parent consent modal appears
- [ ] Submit birth date for age 18+ → Auto-switches to profile and navigates to dashboard
- [ ] Cancel age verification → Modal closes, no changes to member
- [ ] Verify age messaging updates in real-time as date changes

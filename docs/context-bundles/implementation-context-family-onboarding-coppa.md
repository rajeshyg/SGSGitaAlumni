# Scout Report - Family Member Onboarding with COPPA

**Date**: 2025-12-07  
**Type**: Implementation Context  
**Status**: Active Scout Document  
**Purpose**: Essential findings and potential approaches for family onboarding implementation

**Related Scout Documents**:
- [scout-01](./scouts/scout-01-database-schema-cleanup.md) - Database schema cleanup analysis
- [scout-02](./scouts/scout-02-module-organization-invitations.md) - Module organization and invitations
- [scout-03](./scouts/scout-03-coppa-compliance-implementation.md) - COPPA compliance implementation
- [scout-04](./scouts/scout-04-alumni-data-pipeline.md) - Alumni data pipeline analysis
- [scout-05](./scouts/scout-05-family-member-import-logic.md) - Family member import logic
- [scout-06](./scouts/scout-06-unified-screen-design.md) - Unified screen design
- [scout-07](./scouts/scout-07-invitation-management.md) - Invitation management analysis
- [scout-08](./scouts/scout-08-functional-specs-reorganization.md) - Functional specs reorganization

---

## Database Schema - Current State

### Active Tables
| Table | Records | Purpose | Status |
|-------|---------|---------|--------|
| app_users | ~100 | Authentication | Active |
| FAMILY_MEMBERS | ~300 | User profiles + COPPA | Active |
| alumni_members | ~1,280 | Alumni source data | Active |
| USER_INVITATIONS | ~200 | Registration tokens | Active |
| raw_csv_uploads | varies | CSV upload staging | Active (source) |
| user_profiles | VIEW | Backward compatibility | Deprecated VIEW |

### Deleted Tables
- FAMILY_INVITATIONS - Deleted (confirmed unused)
- FAMILY_ACCESS_LOG - Deleted (confirmed unused)

### Data Pipeline (3-Step Process)
```
STEP 1: Admin uploads CSV → raw_csv_uploads
STEP 2: Manual Python script → alumni_members  
STEP 3: User registration + COPPA → FAMILY_MEMBERS
```

**Note**: All data except raw_csv_uploads is test data and can be wiped/reloaded if needed.

---

## COPPA Implementation - Current State

### Year-of-Birth Collection
- **Purpose**: COPPA enforcement only (minimize data collection)
- **Storage**: year_of_birth (INT) with 12/31 date for age calculations
- **Thresholds**: Under 14 (blocked), 14-17 (require consent), 18+ (full access)

### Email Verification
- **Method**: OTP-based email verification during registration
- **Status**: Implemented (not self-approved or missing)

### Current COPPA Fields (FAMILY_MEMBERS)
```sql
year_of_birth INT                 -- YYYY format (primary)
birth_date DATE                   -- Computed as 12/31/year_of_birth
current_age INT                   -- Derived from year_of_birth
requires_parent_consent BOOLEAN   -- TRUE if <18
parent_consent_given BOOLEAN      -- Has parent approved
parent_consent_date TIMESTAMP     -- When consent obtained
access_level ENUM                 -- full/supervised/blocked
relationship VARCHAR              -- parent/child/other (user-selected)
```

### Relationship Collection - Identified Issue
- **Current Flaw**: Code assumes first batch user as parent (children often graduate before parents)
- **Potential Approach**: Ask relationship (parent/child), then YOB only if child selected
- **COPPA Consideration**: Minimal data collection approach aligns with compliance requirements

### Current Implementation Status
**Implemented Features**:
1. Age calculation from YOB
2. Threshold detection (14+, 18+)
3. Consent requirement detection
4. Consent grant/revoke APIs
5. Session context (family member in token)
6. Access level enforcement
7. Login consent verification

**Not Yet Implemented**:
- Consent renewal automation
- Audit logging UI

---

## Auto-Import Problem - Current Behavior

### Location
`StreamlinedRegistrationService.ts:215-236`

### Current Flow (Problematic)
```
User completes registration
  ↓
System fetches ALL alumni by email
  ↓
System AUTO-CREATES all as FAMILY_MEMBERS
  ↓
User sees profiles AFTER creation (no selection)
```

### Potential Alternative Flow
```
User completes registration
  ↓
System shows available alumni from alumni_members table
  ↓
User SELECTS which profiles to add
  ↓
User provides relationship + YOB (if child)
  ↓
System verifies COPPA compliance
  ↓
THEN create in FAMILY_MEMBERS table
```

---

## Module Organization - Current State

### Current Files
**Backend Routes**:
- `routes/auth.js` (1,125 lines) - Auth + registration mixed
- `routes/invitations.js` (1,049 lines) - Invitation management
- `routes/family-members.js` - Family + consent endpoints

**Services**:
- `StreamlinedRegistrationService.ts` (768 lines) - 8 responsibilities mixed
- `AlumniDataIntegrationService.ts` (272 lines) - Alumni matching
- `AgeVerificationService.ts` (486 lines) - COPPA logic (64% complete)

### Architecture Considerations
**Open Questions**: 2-module vs 3-module vs 4-module architecture
- Invitation management specs incomplete (see scout-07)
- Module boundaries need clarification (see scout-02)
- See scout-08 for functional specs reorganization analysis

---

## UI Screens - Current State

### Existing Components
1. `ProfileSelectionPage.tsx` - Profile list/switch
2. `FamilySettingsPage.tsx` - Family management
3. `ParentConsentModal.tsx` (271 lines) - Consent UI
4. `RegistrationPage.tsx` - Registration form

### UI Architecture Observations
**Potential unified screen approach**:
(a) Manage profiles during initial registration
(b) Collect relationship and/or YOB
(c) Handle profile swapping

**Current State**: State management scattered across multiple components

---

## Alumni Data - Current State

### alumni_members Table
- **Records**: 1,280 (99.8% complete)
- **Matching**: By email (multiple alumni can share same email)
- **Source**: raw_csv_uploads via manual Python scripts

### Data Quality
- **Completeness**: 99.8-99.9% (missing names in ~1-2 records)
- **Email Matching**: Returns ALL alumni with matching email
- **No unique constraint**: Multiple alumni can share email (family members)

---

## Code Locations - Key Files

### Auto-Import Logic
- `StreamlinedRegistrationService.ts:215-236` - Auto-import loop (needs fixing)
- `StreamlinedRegistrationService.ts:167` - completeStreamlinedRegistration()
- `StreamlinedRegistrationService.ts:376-478` - createAdditionalFamilyMember()

### Alumni Matching
- `AlumniDataIntegrationService.ts:65-97` - fetchAllAlumniMembersByEmail()
- `AlumniDataIntegrationService.ts:100-173` - validateAlumniDataCompleteness()

### COPPA Implementation
- `AgeVerificationService.ts` (486 lines) - Age verification logic
- `routes/family-members.js` - Consent endpoints
- `ParentConsentModal.tsx` (271 lines) - UI for consent

### Database
- `FAMILY_MEMBERS` table - Primary profile table + COPPA fields
- `alumni_members` table - Alumni source (1,280 records)
- `PARENT_CONSENT_RECORDS` table - Consent audit trail

---

## Fields to Remove from Code

### Non-Existent Field
**estimated_birth_year** - Field does not exist in schema
- Remove ALL code references in API/UI
- Remove from queries in AlumniDataIntegrationService
- Replace logic with year_of_birth field

### Age Calculation Fallback Chain (Current)
```sql
CASE 
  WHEN birth_date IS NOT NULL THEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE())
  WHEN estimated_birth_year IS NOT NULL THEN ...  -- Field doesn't exist
  WHEN batch IS NOT NULL THEN YEAR(CURDATE()) - (batch - 22)
  ELSE NULL
END as estimated_age
```
**Note**: estimated_birth_year references found in code but field not in schema

---

## Potential Implementation Areas

### Identified Issues
1. Auto-import bypasses user selection (see line 215-236 in StreamlinedRegistrationService.ts)
2. Relationship assumption logic (first batch = parent)
3. estimated_birth_year field references in code but not in schema
4. State management scattered across components

### Potential Improvements
1. Show-then-select flow for alumni profiles
2. Unified UI for profile selection + family setup + COPPA verification
3. Explicit relationship collection (parent/child)
4. YOB collection only when needed (child profiles, COPPA-compliant)
5. COPPA verification before FAMILY_MEMBERS creation
6. Clean up non-existent field references

---

## Technical Decisions from Analysis

1. **YOB Storage**: INT format with 12/31 date for conservative age calculation
2. **Age Boundary**: December 31 of birth year
3. **COPPA Thresholds**: 14+ minimum, 18+ no consent (hard-coded)
4. **Data Pipeline**: raw_csv_uploads → Python script → alumni_members → FAMILY_MEMBERS
5. **Auto-Import Code**: Located at `StreamlinedRegistrationService.ts:215-236`

---

## Open Questions

1. Module architecture: 2 vs 3 vs 4-module structure (see scout-02, scout-08)
2. Invitation Management: Missing specs and scout document (see scout-07)
3. Unified screen flow and state management approach (see scout-06)

---

**Scout Status**: Active - findings documented for implementation reference

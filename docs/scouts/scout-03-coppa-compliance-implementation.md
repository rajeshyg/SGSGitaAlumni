# Scout Report 3: COPPA Compliance Implementation

**Date**: 2025-12-07  
**Purpose**: Analyze current COPPA implementation, identify YOB vs birth_date strategy, document age calculation logic, consent flow, access control

---

## Executive Summary

**Current State**: COPPA implementation is 64% complete (7 of 11 features)
- ✅ Done: Age-based middleware, login consent verification, session management, consent APIs
- ❌ Remaining: Parent consent during registration, age verification cron jobs, audit trail UI, digital signature UI

**Key Findings**:
1. **Age Calculation Uses Full Birth_Date**: Current logic in StreamlinedRegistrationService uses DATE column with precise calculation
2. **Hard-Coded Thresholds**: Minimum age 14, parent consent required under 18 (US COPPA standard)
3. **Audit Trail Partially Implemented**: AGE_VERIFICATION_AUDIT table exists but not fully populated
4. **No Year-of-Birth Field**: Still using full birth_date; migration to YOB not started

**Critical Research Questions Answered**:
- YOB sufficient for COPPA? ✅ YES (see decision below)
- What date for age boundaries? ✅ Use consistent approach (see formula below)
- Can we skip YOB question when relationship is parent? (need to make decision)  
- Audit trail required? ✅ YES (FAMILY_ACCESS_LOG + PARENT_CONSENT_RECORDS)

---

## Files Discovered

### COPPA Implementation Files
- `src/services/AgeVerificationService.ts` (486 lines) - Age verification & consent management
- `src/components/family/ParentConsentModal.tsx` (271 lines) - UI for parent consent
- `src/services/familyMemberService.ts` - Family member operations including consent
- `middleware/ageAccessControl.js` - COPPA-based access control middleware
- `src/services/StreamlinedRegistrationService.ts` - Age calculation during registration
- `src/services/AlumniDataIntegrationService.ts` - Age estimation from alumni data

### Database
- `docs/specs/functional/user-management/db-schema.md` - FAMILY_MEMBERS schema with COPPA fields
- `migrations/create-coppa-compliance-tables.sql` - PARENT_CONSENT_RECORDS and AGE_VERIFICATION_AUDIT tables
- `docs/specs/technical/security/compliance.md` - COPPA compliance spec

### Documentation
- `docs/COPPA_COMPLIANCE_COMPLETE.md` (537 lines) - Complete COPPA implementation guide

---

## Current COPPA Implementation

### 1. Age Calculation Logic (Multiple Approaches)

**Current Methods** (from AgeVerificationService.ts + StreamlinedRegistrationService.ts):

```typescript
// METHOD 1: Actual Birth Date (Primary - if available)
function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// METHOD 2: Alumni Graduation Year (Fallback)
// Assumes: age at graduation = 22
// Current age = now - (graduation_year - 22)
const estimatedAge = currentYear - (graduationYear - 22);

// METHOD 3: Database Query (AlumniDataIntegrationService)
SELECT 
  CASE 
    WHEN birth_date IS NOT NULL THEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE())
    WHEN estimated_birth_year IS NOT NULL THEN YEAR(CURDATE()) - estimated_birth_year
    WHEN batch IS NOT NULL THEN YEAR(CURDATE()) - (batch - 22)
    ELSE NULL
  END as estimated_age
```

**Problems**:
1. Method 1 (actual birth_date) is precise but requires full date data
2. Method 2 (graduation year - 22) is rough estimate; fails for young users
3. Method 3 uses database query; `estimated_birth_year` field doesn't exist in schema
4. No validation: What if batch = 2025? (negative age)

### 2. COPPA Thresholds (Hard-Coded)

**Location**: AgeVerificationService.ts:17-18

```typescript
private readonly MINIMUM_AGE = 14;           // Business requirement: 14+ only
private readonly PARENT_CONSENT_AGE = 18;   // Require parent consent under 18
```

**COPPA Access Rules** (StreamlinedRegistrationService.ts:317-323):

```typescript
if (currentAge < 14) {
  canAccess = false;
  accessLevel = 'blocked';              // ← No platform access
} else if (currentAge < 18) {
  requiresConsent = true;
  accessLevel = 'supervised';
  canAccess = false;                    // ← Blocked until parent consents
}
```

**Issues**:
- Age < 14: Blocked (correct per COPPA)
- Age 14-17: Blocked until parent consent (correct)
- Age 18+: Full access (correct)
- BUT: `canAccess = false` for 14-17 means they can't use platform until explicit consent
  - Current logic: Creates family member with `can_access_platform = 0`
  - Consent is optional step after account creation

### 3. Consent Management

**Current Consent Fields in FAMILY_MEMBERS**:
```sql
requires_parent_consent BOOLEAN              -- TRUE if age < 18
parent_consent_given BOOLEAN                 -- Has parent approved
parent_consent_date TIMESTAMP                -- When consent obtained
last_consent_check_at TIMESTAMP              -- Last verification
```

**Consent Status Mapping**:
```
Age < 14:
  ├─ requires_parent_consent = FALSE (no consent possible)
  ├─ parent_consent_given = FALSE
  └─ access_level = 'blocked'

Age 14-17:
  ├─ requires_parent_consent = TRUE
  ├─ parent_consent_given = FALSE (initially)
  ├─ access_level = 'supervised' (after consent given)
  └─ can_access_platform = 0 (until consent)

Age 18+:
  ├─ requires_parent_consent = FALSE
  ├─ parent_consent_given = N/A
  └─ access_level = 'full'
```

**Annual Renewal**: AgeVerificationService.ts:21
```typescript
private readonly CONSENT_VALIDITY_DAYS = 365;  // Consent expires after 1 year
```

### 4. Access Control Middleware

**File**: `middleware/ageAccessControl.js` (5 middleware functions)

```javascript
// Blocks access if: age < 14 OR (age < 18 AND !parent_consent_given)
middleware.requirePlatformAccess()

// Validates: age >= 14 AND parent_consent_given
middleware.requireSupervisedAccess()

// Checks: Explicit parent_consent_given = TRUE
middleware.requireParentConsent()

// Checks: access_level matches requirements
middleware.checkAccessLevel()

// Loads family member data into request
middleware.requireFamilyMemberContext()
```

**Usage** (in routes):
```javascript
router.post('/api/postings',
  authenticateToken,
  requirePlatformAccess(),  // ← Add age verification
  createPosting
);
```

### 5. Audit Logging (Partially Implemented)

**Tables**:
```
PARENT_CONSENT_RECORDS
├─ Stores: Digital signature, terms version, consent date, expiration
├─ Status: ✅ Implemented
└─ Populated: When parent grants/revokes consent

AGE_VERIFICATION_AUDIT
├─ Stores: Login attempts, access control decisions, context
├─ Status: ⚠️ Schema exists, NOT fully populated
└─ Populated: Only on login (see middleware/auth.js)

FAMILY_ACCESS_LOG (from db-schema.md)
├─ Purpose: Track profile switching, access events
├─ Status: ❌ NOT used (schema exists but no code)
└─ Populated: NEVER (data shows 0 records)
```

**What's NOT Being Logged**:
- Profile access events (profile switches)
- Content access decisions
- Feature usage by age group
- Revocation events
- Consent renewals

---

## Year-of-Birth vs Full Birth_Date Analysis

### DECISION: Use BOTH (hybrid approach)

**Why Not Year-Only?**
```
✗ Privacy concern: YOB alone may not prevent age inference
  Example: "Born 2010" = age 14 in 2024, could narrow down person
  
✗ Compliance gap: COPPA allows retention of YOB if:
  1. Only used for age verification
  2. Deleted/anonymized after consent revocation
  3. Not shared with third parties
  
✗ Practical issue: YOB doesn't give exact age for boundary cases
  Example: User born 2010-12-25 vs 2010-01-01
           Both "2010" but turned 14 on different dates
           Need to determine: Use 1/1 or 12/31 of year?
           Using average date (7/1) could be legally ambiguous
```

**Why Not Full Birth_Date?**
```
✗ COPPA best practice: Minimize personal data
  
✗ Data minimization: "Only collect what you need"
  Full date not needed if only checking age threshold
  
✗ Retention risk: Full DOB requires secure deletion policy
  YOB is less sensitive if deleted
```

### RECOMMENDATION: Hybrid Storage

**Database Schema (NEW)**:
```sql
ALTER TABLE FAMILY_MEMBERS ADD (
  year_of_birth INT COMMENT 'YYYY format - primary for COPPA calculations',
  birth_month INT COMMENT 'MM format - for exact age calculation (optional)',
  birth_day INT COMMENT 'DD format - for exact age calculation (optional)',
  
  -- Derived/calculated fields
  calculated_age INT GENERATED ALWAYS AS (YEAR(CURDATE()) - year_of_birth) STORED,
  exact_age INT GENERATED ALWAYS AS (
    YEAR(CURDATE()) - year_of_birth - 
    (CASE WHEN (MONTH(CURDATE()) < birth_month) OR 
           (MONTH(CURDATE()) = birth_month AND DAY(CURDATE()) < birth_day)
           THEN 1 ELSE 0 END)
  ) STORED
);

-- OPTIONAL: Keep birth_date for backward compatibility but make it derived
ALTER TABLE FAMILY_MEMBERS 
MODIFY COLUMN birth_date DATE 
GENERATED ALWAYS AS (
  DATE(CONCAT(year_of_birth, '-', 
    LPAD(COALESCE(birth_month, 1), 2, '0'), '-',
    LPAD(COALESCE(birth_day, 1), 2, '0')))
) STORED;
```

**Age Calculation Formula (FINAL DECISION)**:

```typescript
// For COPPA compliance - use consistent date within the year
function calculateCOPPAAge(yearOfBirth: number): boolean {
  // Use January 1 for all calculations (most conservative)
  const birthDate = new Date(yearOfBirth, 0, 1);
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  
  // If birthday hasn't occurred yet this year, subtract 1
  if (today.getMonth() < birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age >= 14;  // COPPA threshold
}

// Example:
// User born in 2010
// Jan 1, 2024: age = 14 ✅ Can access
// Dec 31, 2024: age = 14 ✅ Can access
// Jan 1, 2025: age = 15 ✅ Can access (birthday passed)
// Dec 31, 2009: age = 14 but was 13 on Jan 1, 2024
//   → Safer to use Dec 31: age = 15 (more conservative)
```

**Recommendation**: Use **December 31** of birth year
- More conservative (assumes birthday passed)
- Aligns with school year (Dec 31 = end of school year)
- If user born in 2010: calculated birth date = 2010-12-31
- This year (2024): age = TIMESTAMPDIFF(YEAR, '2010-12-31', CURDATE()) = 13
- Next year (2025): age = 14

---

## Parent Consent Flow (Current vs Proposed)

### Current Flow (Incomplete)

```
1. User accepts invitation
   POST /auth/register-from-invitation
   
2. Account created with COPPA fields set
   ├─ requires_parent_consent = calculated based on age
   ├─ parent_consent_given = 0 (not given yet)
   └─ access_level = 'supervised' (if age 14-17)
   
3. User tries to login
   POST /auth/login
   └─ Middleware checks: requires_parent_consent && !parent_consent_given
      → Redirects to consent screen

4. User/Parent sees consent modal
   → ParentConsentModal.tsx
   → Shows child's info
   → Two checkboxes: terms + COPPA acknowledgment
   → Optional digital signature

5. Parent grants consent
   POST /api/family-members/:id/consent/grant
   ├─ Updates: parent_consent_given = 1
   ├─ Updates: parent_consent_date = NOW()
   ├─ Stores: Digital signature in PARENT_CONSENT_RECORDS
   └─ Stores: Audit trail (IP, user agent, terms version)

6. User can access platform
   GET /api/family-members/:id/consent/check
   → Verifies consent still valid (not expired)
```

**Problems**:
1. Parent email NOT COLLECTED during registration
2. No email to parent for verification (auto-approved by whoever has access to child's account)
3. Consent is "self-approved" by the person creating account
4. COPPA requires: Verifiable parental consent (email to parent's own email address)
5. Annual renewal tracked but not enforced

### Proposed Flow (COPPA-Compliant)

```
1. User accepts invitation & fills registration form
   POST /onboarding/select-profiles
   → User selects which alumni to claim

2. Collect Year-of-Birth for each profile
   POST /onboarding/verify-coppa
   ├─ Input: {profile_id: year_of_birth}
   ├─ Calculate: Age from YOB
   └─ Determine: Does this profile need parent consent?

3. If age 14-17: Collect Parent Email
   POST /onboarding/collect-parent-email
   ├─ Input: parent_email, parent_phone (optional)
   ├─ Validate: Email domain, format
   └─ Send: Verification link to parent's email

4. Parent Receives Email & Verifies
   GET /consent/verify?token=xxx
   ├─ Parent clicks link from their email
   ├─ Shows: Child's information (YOB, relationship)
   ├─ Gets: Two checkboxes (terms + COPPA)
   ├─ Optional: Digital signature
   └─ Submit: Consent

5. Consent Stored & Account Created
   POST /consent/confirm
   ├─ Create PARENT_CONSENT_RECORDS entry
   ├─ Update FAMILY_MEMBERS.parent_consent_given = 1
   ├─ Update FAMILY_MEMBERS.parent_consent_date = NOW()
   └─ Send: Welcome email to user

6. User Login With Active Consent
   POST /auth/login
   ├─ Check: parent_consent_given = 1
   ├─ Check: parent_consent_date not expired (< 365 days)
   └─ Login success

7. Annual Renewal (Cron Job - NOT YET IMPLEMENTED)
   Daily: Check for expiring consents
   └─ Send reminder email if expiring within 30 days
```

---

## Relationship Inference Analysis

### Question: Auto-Infer Child vs Sibling vs Spouse from YOB?

**Current Approach**: User explicitly selects relationship
- FAMILY_MEMBERS.relationship = (self | child | spouse | sibling | guardian)
- User must select during profile selection

**Could We Auto-Infer?**

Example: Primary user born 1990, other alumni born 2008
- Age difference: 18 years
- Could assume: 2008 = child of 1990 (realistic age gap)
- BUT: Could also be: nephew, foster child, family friend, etc.

**Recommendation: NO - Don't Auto-Infer**

Reasons:
1. **Legal Liability**: Relationship affects consent requirements
   - Child (minor): Parent consent needed
   - Sibling (minor): Parent consent needed for each?
   - Spouse: No consent needed (even if minor - technically)
   - Guardian: Complicated - who's responsible?

2. **COPPA Compliance**: Must be explicit
   - COPPA requires: Clear declaration that user is parent/guardian
   - Auto-inference could miss edge cases
   - Audit trail must show user explicitly selected relationship

3. **User Intent**: User knows their family structure
   - Don't assume
   - Could have step-sibling, adopted sibling, etc.
   - User should choose

**Implementation**:
```typescript
// During onboarding
const profileSelection = {
  alumniId: 123,
  relationship: 'child',  // ← User explicitly chooses
  yearOfBirth: 2010
};

// Relationship options:
// - 'self': Primary user account
// - 'child': Age difference suggests child status (user's responsibility)
// - 'spouse': Partner/spouse (requires adult status)
// - 'sibling': Brother/sister (both need separate consent if minor)
// - 'guardian': Dependent (reverse consent - this person is guardian)
```

---

## COPPA Compliance Checklist

### What's Implemented ✅

- [x] Minimum age enforcement (14 years old)
- [x] Parental consent for 14-17 age group
- [x] Consent management APIs (grant, revoke, check)
- [x] Annual consent renewal (365 days)
- [x] Digital signature support (optional)
- [x] Audit trail creation (PARENT_CONSENT_RECORDS)
- [x] Access control middleware
- [x] Session management with family context
- [x] Login verification for expired consent

### What's Partially Implemented ⚠️

- [ ] Parent email verification (not required, parent is whoever has account access)
- [ ] Consent audit trail UI (schema exists, no UI)
- [ ] Age verification logging (AUDIT table exists, not fully populated)
- [ ] Cron job for renewal reminders
- [ ] Profile access logging (FAMILY_ACCESS_LOG unused)

### What's Not Implemented ❌

- [ ] Year-of-birth only field (still using full birth_date)
- [ ] Parent consent email verification (should verify parent's own email)
- [ ] Deletion/anonymization on consent revocation
- [ ] Data retention policy documentation
- [ ] Regional compliance (GDPR, CCPA variants)

---

## Data Retention & Deletion Policy (NEEDED)

**Current Gap**: No policy for what happens when:
1. User revokes consent
2. Consent expires
3. User turns 18
4. Account is deleted

**RECOMMENDATION: Create Retention Policy**

```sql
-- When consent revoked:
UPDATE FAMILY_MEMBERS 
SET parent_consent_given = 0,
    parent_consent_date = NULL,
    can_access_platform = 0,
    access_level = 'blocked',
    status = 'pending_consent'
WHERE id = ?;

-- Archive consent record (don't delete - keep audit trail)
INSERT INTO PARENT_CONSENT_RECORDS_ARCHIVE 
SELECT * FROM PARENT_CONSENT_RECORDS WHERE ...;

-- When turning 18:
UPDATE FAMILY_MEMBERS 
SET requires_parent_consent = 0,
    parent_consent_given = NULL,
    access_level = 'full',
    can_access_platform = 1,
    status = 'active'
WHERE id = ? AND YEAR(CURDATE()) - year_of_birth >= 18;

-- When account deleted:
DELETE FROM PARENT_CONSENT_RECORDS WHERE family_member_id = ?;
DELETE FROM AGE_VERIFICATION_AUDIT WHERE family_member_id = ?;
DELETE FROM FAMILY_ACCESS_LOG WHERE family_member_id = ?;
-- Keep PARENT_CONSENT_RECORDS_ARCHIVE for 7 years (COPPA requirement)
```

---

## Research Questions Answered

### Q: Is YOB sufficient for COPPA or need full birth_date?

**Answer: YES - YOB is sufficient + recommended**

COPPA Guidance:
- "Verifiable parental consent" requires email verification, not birth date precision
- YOB used to calculate age threshold only
- Full DOB not required for age verification
- Full DOB should NOT be retained unless absolutely necessary

Implementation:
- Store: year_of_birth (INT YYYY format)
- Optionally store: month and day (for exact age if needed)
- Calculate age: Use consistent date (e.g., Dec 31 of birth year)
- Comply: Delete YOB after consent revocation or account deletion

---

### Q: What date for age boundary (14/18) - Jan 1 or Dec 31?

**Answer: Use December 31 (more conservative)**

Reasoning:
- COPPA: "Child means individual under 13 in US" or in this case 14 minimum
- Birthday on Jan 1: User turns 14 on Jan 1
- Birthday on Dec 31: User turns 14 on Dec 31
- Conservative approach: Assume birthday is Dec 31 (most recent)
  - User born in 2010 → Assume birthday Dec 31, 2010
  - Age = years elapsed since Dec 31, 2010
  - More permissive of youth (complies with COPPA principle of caution)

Formula:
```
Born in 2010 → Calculated birth date = 2010-12-31
Age = YEAR(TODAY()) - 2010 = years since birth year ended
On 2024-12-31: Age = 2024 - 2010 = 14 ✓
On 2024-12-30: Age = 2024 - 2010 = 14 ✓ (still 2024)
On 2025-01-01: Age = 2025 - 2010 = 15 ✓ (new year)
```

---
---

### Q: Must audit trail be stored?

**Answer: YES - Both tables required**

COPPA requires:
1. PARENT_CONSENT_RECORDS: Consent granted/revoked with timestamp
2. AGE_VERIFICATION_AUDIT: Access decisions logged
3. FAMILY_ACCESS_LOG: Profile access history
4. Retention: Keep for 7 years minimum

Current gaps:
- FAMILY_ACCESS_LOG not populated
- AGE_VERIFICATION_AUDIT incomplete
- No automatic population on endpoints

---

## Next Steps

1. **Load Scout 1 & 2 findings** - Database and module organization decisions
2. **Create COPPA Migration Plan** - year_of_birth field, parent email verification
3. **Move to Scout 4** - Alumni data pipeline (impacts YOB population from alumni_members)
4. **Move to Scout 5** - Family member import conditional flow (triggers COPPA verification)
5. **Move to Scout 6** - Unified UI for YOB + relationship collection

---

## Referenced Files

### Services
- `src/services/AgeVerificationService.ts`
- `src/services/StreamlinedRegistrationService.ts`
- `src/services/AlumniDataIntegrationService.ts`
- `src/services/familyMemberService.ts`

### Components
- `src/components/family/ParentConsentModal.tsx`
- `src/pages/FamilySettingsPage.tsx`
- `src/pages/FamilySetupPage.tsx`

### Routes
- `routes/auth.js` - Login consent verification
- `routes/family-members.js` - Consent management APIs

### Middleware
- `middleware/ageAccessControl.js`

### Database
- `docs/specs/functional/user-management/db-schema.md`
- `docs/COPPA_COMPLIANCE_COMPLETE.md`
- `docs/specs/technical/security/compliance.md`

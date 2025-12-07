# Scout Report 5: Family Member Import Logic (Conditional Flow)

**Date**: 2025-12-07  
**Purpose**: Map current auto-import flow, identify triggers, FK dependencies, transactions; design conditional import

---

## Executive Summary

**Current State**: Family members auto-imported during registration (problematic)
- Fetches ALL alumni with same email
- Creates FAMILY_MEMBERS for each match automatically
- No user selection, no relationship choice, no COPPA verification first

**Critical Problem**: Violates all 5 clarifications:
- ❌ Clarification 1: Not showing families to user for selection
- ❌ Clarification 2: Happens WITHOUT COPPA verification
- ❌ Clarification 3: No explicit relationship selection
- ❌ Clarification 5: Auto-import BEFORE consent, not after

**Proposed Fix**: Convert to conditional flow - Show → Select → Verify COPPA → Consent → Create

---

## Files Discovered

### Auto-Import Implementation
- `src/services/StreamlinedRegistrationService.ts` (768 lines)
  - Line 167: `completeStreamlinedRegistration()` - Main flow
  - Line 215-236: Auto-import loop
  - Line 278-372: `createPrimaryFamilyMember()` - Creates primary
  - Line 376-478: `createAdditionalFamilyMember()` - Auto-creates others

- `src/services/AlumniDataIntegrationService.ts` (272 lines)
  - Line 65-97: `fetchAllAlumniMembersByEmail()` - Fetches matching alumni
  - Line 100-173: `validateAlumniDataCompleteness()` - Data quality check

### Related Services
- `src/services/familyMemberService.ts` - Family member operations
- `src/services/AgeVerificationService.ts` - COPPA age verification
- `src/services/InvitationService.ts` - Invitation lifecycle

### Routes
- `routes/auth.js` - Registration endpoints
- `routes/invitations.js` - Invitation management
- `routes/family-members.js` - Family member endpoints

---

## Current Auto-Import Flow

### The Problem: AUTO-IMPORT DURING REGISTRATION

**Location**: `StreamlinedRegistrationService.ts:215-236`

```typescript
// CURRENT (Problematic)
async completeStreamlinedRegistration(token: string) {
  // 1. Validate invitation
  // 2. Create app_users account
  
  // 3. Create primary FAMILY_MEMBER for first alumni match
  const primaryAlumniSnapshot = this.alumniService.createProfileSnapshot(alumniProfile);
  await this.createPrimaryFamilyMember(connection, userId, alumniProfile, primaryFamilyMemberId, primaryAlumniSnapshot);
  
  // 4. AUTO-IMPORT ALL other alumni with same email
  const allAlumniProfiles = await this.alumniService.fetchAllAlumniMembersByEmail(invitation.email);
  
  for (const otherAlumni of allAlumniProfiles) {
    if (otherAlumni.id === alumniProfile.id) continue;  // Skip primary
    
    // AUTO-CREATE additional family members WITHOUT user consent
    const familyMemberId = uuidv4();
    const alumniSnapshot = this.alumniService.createProfileSnapshot(otherAlumni);
    await this.createAdditionalFamilyMember(connection, userId, otherAlumni, familyMemberId, alumniSnapshot);
    additionalMembersCreated++;
  }
  
  // 5. Update app_users
  await connection.execute(`
    UPDATE app_users
    SET primary_family_member_id = ?, is_family_account = TRUE
    WHERE id = ?
  `, [primaryFamilyMemberId, userId]);
}
```

### The Problems

**Problem 1: User Doesn't See Options**
- Code fetches ALL alumni by email
- No UI to show user: "We found N alumni with your email, select which are you"
- User doesn't know they've been auto-imported

**Problem 2: No Selection Process**
- Implicit assumption: All matches are family members
- What if email shared by unrelated alumni? (Data quality issue)
- User can't claim specific alumni, can't skip others

**Problem 3: No COPPA First**
- Age checked DURING import, not BEFORE showing options
- Should be: Show options → Ask for YOB → Verify COPPA → THEN create

**Problem 4: No Relationship Specified**
- All non-primary imported as relationship='child' (assumption)
- Should be: User selects relationship for each

**Problem 5: Single Transaction**
- Everything in one transaction
- If import fails halfway: partial data left
- If new alumni added: needs account-level permission (no selective rollback)

---

## Current Data Structures & Dependencies

### FK Dependencies

```
USER_INVITATIONS
  ├─ user_id → app_users (NULL initially, filled on registration)
  ├─ alumni_member_id → alumni_members (source alumni)
  └─ accepted_by → app_users (filled on acceptance)

app_users (created during registration)
  ├─ alumni_member_id → alumni_members (primary alumni)
  ├─ primary_family_member_id → FAMILY_MEMBERS (primary profile)
  └─ invitation_id → USER_INVITATIONS (source invitation)

FAMILY_MEMBERS (created per selected alumni)
  ├─ parent_user_id → app_users (account owner)
  ├─ alumni_member_id → alumni_members (which alumni is this?)
  └─ (OPTIONAL) supervisor_id → app_users (parent supervisor)

PARENT_CONSENT_RECORDS (created after consent granted)
  └─ family_member_id → FAMILY_MEMBERS (which profile needs consent)
```

### Transaction Boundaries

**Current**: All in one transaction
```
BEGIN TRANSACTION
  ├─ INSERT app_users
  ├─ INSERT FAMILY_MEMBERS (primary)
  ├─ FOR each other alumni:
  │  └─ INSERT FAMILY_MEMBERS (additional)
  ├─ UPDATE USER_INVITATIONS
  └─ COMMIT/ROLLBACK
```

**Risk**: If alumni_members check fails midway, whole registration fails

### Age Calculation at Import Time

```typescript
// In createPrimaryFamilyMember
let birthDate = alumniProfile.birthDate || null;
let currentAge = null;

if (birthDate) {
  // Calculate from actual birth date
  const today = new Date();
  const birth = new Date(birthDate);
  currentAge = today.getFullYear() - birth.getFullYear();
  // ... adjust for month/day
} else if (alumniProfile.estimatedBirthYear) {
  currentAge = new Date().getFullYear() - alumniProfile.estimatedBirthYear;
  birthDate = `${alumniProfile.estimatedBirthYear}-01-01`;
} else if (alumniProfile.graduationYear) {
  const estimatedBirthYear = alumniProfile.graduationYear - 22;
  currentAge = new Date().getFullYear() - estimatedBirthYear;
  birthDate = `${estimatedBirthYear}-01-01`;
}

// COPPA: Determine access immediately
if (currentAge < 14) accessLevel = 'blocked';
else if (currentAge < 18) accessLevel = 'supervised';
else accessLevel = 'full';
```

**Problem**: Age determined at import time, can't be verified later by user

---

## Proposed: Conditional Import Flow

### New Flow: Show → Select → Verify → Consent → Create

```
1. USER SELECTS ALUMNI
   ├─ Show available alumni (matched by email)
   ├─ For each: name, graduation year, department
   ├─ User checks: "This is me", "This is my child", etc.
   └─ User submits: Selected alumni + relationship

2. COLLECT YEAR-OF-BIRTH
   ├─ For each selected alumni:
   │  ├─ Ask: "What is their year of birth?"
   │  ├─ Suggest: "Graduated 2015 → likely born ~1993"
   │  └─ User confirms/corrects YOB
   └─ Validate: YOB not future date, reasonable range

3. COPPA VERIFICATION
   ├─ Calculate: Age from YOB
   ├─ Determine: Does this profile need parent consent?
   ├─ For age < 14: Block with message "Too young"
   ├─ For age 14-17: Proceed to consent collection
   └─ For age 18+: Proceed to account creation

4. PARENT CONSENT (if needed)
   ├─ Collect: Parent email address
   ├─ Send: Email to parent with verification link
   ├─ Parent: Clicks link, verifies year-of-birth, grants consent
   └─ Continue: After consent received

5. CREATE FAMILY MEMBERS
   ├─ NOW create FAMILY_MEMBERS records
   ├─ For each: Store year_of_birth (NOT full date)
   ├─ Set: access_level based on age & consent
   ├─ Set: relationship from user selection
   └─ Set: parent_consent_given (if age 14-17)

6. COMPLETE ACCOUNT
   ├─ Set: app_users.primary_family_member_id
   ├─ Set: app_users.is_family_account = TRUE
   ├─ Update: USER_INVITATIONS.status = 'accepted'
   └─ Login: User is now authenticated
```

### Refactored Services

**Service Architecture**:
```
AuthService (routes/auth.js)
  ├─ registerFromInvitation()
  │  ├─ Validate invitation
  │  ├─ Create app_users
  │  └─ Call: OnboardingOrchestrationService

OnboardingOrchestrationService (NEW)
  ├─ orchestrateProfileSelection()
  │  ├─ Fetch alumni by email
  │  ├─ Return: Available alumni list
  │  └─ Wait for: User selections + relationships
  │
  ├─ verifyYearOfBirth()
  │  ├─ Collect YOB for each selected
  │  ├─ Call: AgeVerificationService
  │  └─ Return: Age, COPPA requirements
  │
  ├─ collectParentConsent() (if needed)
  │  ├─ Get: Parent email
  │  ├─ Send: Consent email
  │  ├─ Return: Consent token
  │  └─ Wait for: Parent verification
  │
  └─ createFamilyMembersAfterVerification()
     ├─ Create FAMILY_MEMBERS for each verified profile
     ├─ Set: year_of_birth, access_level, consent status
     └─ Return: Created profiles

FamilyMemberService (existing - enhance)
  └─ createFamilyMember() - Create individual profile (with validation)

AgeVerificationService (existing - use)
  └─ verifyAge(), requiresParentConsent() - COPPA logic

ParentConsentService (NEW)
  ├─ generateConsentToken()
  ├─ sendConsentEmail()
  ├─ validateConsentToken()
  └─ recordConsent()
```

---

## API Endpoints (Proposed)

### Step 1: Get Available Alumni

```
GET /invitations/validate?token=xxx
Response:
{
  "invitation": { ... },
  "availableAlumni": [
    {
      "id": 123,
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@alumni.com",
      "graduationYear": 2015,
      "department": "Engineering",
      "isCompleteProfile": true
    },
    { ... }
  ],
  "nextStep": "select_profiles"
}
```

### Step 2: User Selects & Provides Relationships

```
POST /onboarding/select-profiles
Body:
{
  "invitationToken": "xxx",
  "selectedAlumni": [
    {
      "alumniId": 123,
      "relationship": "self",
      "confirmed": true
    },
    {
      "alumniId": 456,
      "relationship": "child",
      "confirmed": true
    }
  ]
}

Response:
{
  "selected": 2,
  "nextStep": "verify_coppa",
  "selectedIds": [123, 456]
}
```

### Step 3: Collect Year-of-Birth

```
POST /onboarding/verify-coppa
Body:
{
  "invitationToken": "xxx",
  "profileData": [
    {
      "alumniId": 123,
      "yearOfBirth": 1990,
      "relationship": "self"
    },
    {
      "alumniId": 456,
      "yearOfBirth": 2010,
      "relationship": "child"
    }
  ]
}

Response:
{
  "profiles": [
    {
      "alumniId": 123,
      "yearOfBirth": 1990,
      "calculatedAge": 34,
      "needsConsent": false,
      "status": "approved"
    },
    {
      "alumniId": 456,
      "yearOfBirth": 2010,
      "calculatedAge": 14,
      "needsConsent": true,
      "status": "pending_consent"
    }
  ],
  "nextStep": "collect_parent_consent"
}
```

### Step 4: Collect Parent Email (if needed)

```
POST /onboarding/collect-parent-email
Body:
{
  "invitationToken": "xxx",
  "parentEmail": "parent@example.com",
  "profileNeedingConsent": 456
}

Response:
{
  "consentEmailSent": true,
  "parentEmail": "parent@example.com",
  "expiresAt": "2025-01-06T12:00:00Z",
  "nextStep": "wait_for_parent_consent"
}
```

### Step 5: Complete Registration (After Parent Consent)

```
POST /auth/complete-onboarding
Body:
{
  "invitationToken": "xxx",
  "password": "secure-password-123"
}

Response:
{
  "success": true,
  "userId": "user-uuid",
  "jwt": "eyJ...",
  "familyMembers": [
    {
      "id": "fm-1",
      "firstName": "John",
      "lastName": "Doe",
      "relationship": "self",
      "accessLevel": "full"
    },
    {
      "id": "fm-2",
      "firstName": "Jane",
      "lastName": "Doe",
      "relationship": "child",
      "accessLevel": "supervised",
      "requiresConsent": false,
      "consentGiven": true
    }
  ]
}
```

---

## Transaction Strategy (NEW)

### Safe Multi-Step Approach

```
BEGIN TRANSACTION
  1. Validate invitation token
     → If invalid: ROLLBACK
  
  2. Check: Is email in USER_INVITATIONS?
     → If not: ROLLBACK
  
  3. Lock: USER_INVITATIONS row (FOR UPDATE)
     → Prevents concurrent registrations
  
  4. Create: app_users record
     → If fails: ROLLBACK
  
  5. Create: Primary FAMILY_MEMBERS record
     → If fails: ROLLBACK
  
  COMMIT transaction  ← Safe point
  
SEPARATE TRANSACTION (for each additional profile):
  BEGIN
    6. Create: FAMILY_MEMBERS (additional)
       → If fails: ROLLBACK only this profile
       → User notified but not blocked
  COMMIT
  
After All:
  FINAL TRANSACTION
    7. Update: USER_INVITATIONS.status = 'accepted'
    8. Update: app_users settings
    COMMIT
```

**Benefits**:
- Core account creation atomic
- Additional profiles don't block registration
- Partial failures graceful
- Clear rollback boundaries

---

## Migration Path: Auto-Import → Conditional

### Phase 1: Add New Endpoints (Parallel Run)

```
1. Create new /onboarding/* endpoints
2. Keep old /auth/register-from-invitation working
3. Create feature flag: USE_CONDITIONAL_IMPORT = false
4. Test new flow in staging
```

### Phase 2: Gradual Migration

```
1. Set: USE_CONDITIONAL_IMPORT = true for 10% of users
2. Monitor: Error rates, completion rates
3. Increase: 25% → 50% → 100%
4. Keep: Old endpoints as fallback
```

### Phase 3: Cleanup

```
1. Remove: Old auto-import code
2. Update: Documentation & playbooks
3. Archive: Old OnboardingOrchestrationService.ts (if kept)
```

---

## Edge Cases to Handle

### Edge Case 1: No Alumni Match
```
Email: person@example.com
Alumni matches: 0

Solution:
1. Show: "No alumni found with your email"
2. Allow: User to continue as non-alumni
3. Set: relationship = 'non_alumni'
4. No COPPA verification needed (non-alumni)
```

### Edge Case 2: Too Many Matches
```
Email: john.doe@company.com
Alumni matches: 47 (unlikely but possible with common name)

Solution:
1. Show: First 10 with search
2. Allow: User to filter by graduation year
3. Validation: User must select at least 1session then proceed with remaining
```

### Edge Case 3: Age < 14
```
Profile has: YOB = 2015 (age 9)

Solution:
1. Show: "This profile is too young for the platform (COPPA)"
2. Allow: User to deselect this profile
3. Can't create: FAMILY_MEMBERS for this profile
```

### Edge Case 4: Relationship Doesn't Match Age
```
User selects: "This is my spouse" but YOB = 2010 (age 14)

Solution:
1. Warn: "Spouse is usually adult age"
2. Confirm: "Are you sure? They're only 14 years old"
3. If confirmed: Proceed (user responsibility to explain)
```

### Edge Case 5: Parent Consent Email Bounces
```
Send consent email → Message.id = xxx, status = 'bounced'

Solution:
1. Poll: EMAIL_DELIVERY_LOG for status
2. If bounced: Prompt user to enter different parent email
3. Resend: Consent email
4. Timeout: 24 hours to receive consent
```

---

## Recommendations

### Priority 1: Implement Conditional Flow (HIGH)

1. **Create OnboardingOrchestrationService**
   - [ ] orchestrateProfileSelection()
   - [ ] verifyYearOfBirth()
   - [ ] collectParentConsent()
   - [ ] createFamilyMembersAfterVerification()

2. **Create /onboarding/* API Endpoints**
   - [ ] GET /invitations/validate (show available alumni)
   - [ ] POST /onboarding/select-profiles
   - [ ] POST /onboarding/verify-coppa
   - [ ] POST /onboarding/collect-parent-email
   - [ ] POST /auth/complete-onboarding

3. **Create ParentConsentService**
   - [ ] generateConsentToken()
   - [ ] sendConsentEmail()
   - [ ] validateConsentToken()
   - [ ] recordConsent()

4. **Refactor StreamlinedRegistrationService**
   - [ ] Remove auto-import logic
   - [ ] Keep only: validateInvitation(), createPrimaryUser()
   - [ ] Move family creation to FamilyMemberService

### Priority 2: Frontend UI (HIGH)

5. **Create Onboarding Flow UI**
   - [ ] ProfileSelectionStep: Show available alumni, user selects
   - [ ] YearOfBirthStep: Collect YOB for each
   - [ ] COPPAVerificationStep: Show COPPA requirements
   - [ ] ParentConsentStep: Collect parent email, show status
   - [ ] CompleteStep: Success message, login

### Priority 3: Testing & Validation (MEDIUM)

6. **Create Test Scenarios**
   - [ ] No matches scenario
   - [ ] Single match scenario
   - [ ] Multiple matches scenario
   - [ ] Age < 14 scenario
   - [ ] Parent consent required scenario
   - [ ] Parent consent bounced scenario
   - [ ] Partial failure (some profiles fail)

### Priority 4: Migration & Deprecation (MEDIUM)

7. **Gradual Migration**
   - [ ] Feature flag: USE_CONDITIONAL_IMPORT
   - [ ] Monitor: Adoption, error rates
   - [ ] Gradual: 10% → 50% → 100%
   - [ ] Deprecate: Old auto-import after stability

---

## Next Steps

1. **Load Scout 3 findings** - COPPA age calculation (impacts YOB collection)
2. **Load Scout 4 findings** - Alumni data pipeline (impacts available alumni)
3. **Design ParentConsentService** - Email verification flow
4. **Move to Scout 6** - Unified UI combining all steps

---

## Referenced Files

### Current Implementation (To Refactor)
- `src/services/StreamlinedRegistrationService.ts`
- `src/services/AlumniDataIntegrationService.ts`

### Services to Create/Enhance
- `src/services/OnboardingOrchestrationService.ts` (NEW)
- `src/services/ParentConsentService.ts` (NEW)
- `src/services/FamilyMemberService.ts` (enhance)
- `src/services/AgeVerificationService.ts` (use)

### Routes
- `routes/auth.js` - Registration
- `routes/invitations.js` - Invitation management
- `routes/family-members.js` - Family operations

### Database
- `docs/specs/functional/user-management/db-schema.md`
- `docs/COPPA_COMPLIANCE_COMPLETE.md`

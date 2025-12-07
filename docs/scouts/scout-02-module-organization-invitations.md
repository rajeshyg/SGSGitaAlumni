# Scout Report 2: Module Organization & Invitation Management

**Date**: 2025-12-07  
**Purpose**: Map current module boundaries, identify overlaps in auth/invitations/alumni, define 4-module architecture (Authentication, Alumni Data, Family Relations, Invitations)

---

## Executive Summary

**Current State**: Mixed concerns across routes/auth.js, routes/invitations.js, services/StreamlinedRegistrationService.ts, and services/AlumniDataIntegrationService.ts

**Problems Identified**:
1. Authentication module handles registration + family onboarding (too broad)
2. Two parallel invitation systems (USER_INVITATIONS + FAMILY_INVITATIONS) in same routes
3. Alumni data logic mixed into registration service
4. Family member auto-import happens during registration (should be conditional)
5. No clear separation of concerns - auth.js does: validation + user creation + family setup

**Proposed 4-Module Architecture**:
```
Module 1: Authentication (Simple & Focused)
├─ Responsibility: JWT tokens, OTP, login/logout, password reset
├─ Routes: /auth/login, /auth/logout, /auth/otp, /auth/password-reset
└─ Files: routes/auth.js (core auth only), services/OTPService.ts

Module 2: Alumni Data (Read-Only Reference)
├─ Responsibility: Alumni data pipeline, schema, matching
├─ Data: alumni_members table, raw_csv_uploads management
├─ Routes: /admin/alumni (for manual data mgmt)
└─ Services: AlumniDataIntegrationService.ts, alumni data pipeline

Module 3: Family Relations (COPPA & Profiles)
├─ Responsibility: Family member profiles, relationships, COPPA compliance
├─ Data: FAMILY_MEMBERS table, consent tracking
├─ Routes: /family-members/* (COPPA, consent, access control)
└─ Services: familyMemberService.ts, AgeVerificationService.ts

Module 4: Invitations & Onboarding (Orchestration)
├─ Responsibility: Coordinate auth + alumni matching + family setup
├─ Routes: /invitations/*, /auth/register (registration flow)
└─ Services: InvitationService.ts, StreamlinedRegistrationService.ts
```

---

## Files Discovered

### Authentication Routes & Services
- **routes/auth.js** (1,125 lines) - Auth endpoints + registration
  - Endpoints: login, logout, verifyAuth, refresh, registerFromInvitation, registerFromFamilyInvitation, requestPasswordReset, validatePasswordResetToken, resetPassword
  - Problems: Mixing auth + registration + family setup logic
  
- **routes/invitations.js** (1,049 lines) - Invitation management
  - Endpoints: getAllInvitations, getFamilyInvitations, createInvitation, createFamilyInvitation, validateInvitation, updateInvitation, resendInvitation, revokeInvitation, createBulkInvitations, acceptFamilyInvitationProfile
  - Problems: Two invitation systems handled together (USER_INVITATIONS + FAMILY_INVITATIONS)

- **middleware/auth.js** - Authentication middleware & JWT verification

### Alumni & Family Services
- **src/services/AlumniDataIntegrationService.ts** (272 lines)
  - Purpose: Alumni data matching, profile validation, relationship inference
  - Key Methods: fetchAllAlumniMembersByEmail(), validateAlumniDataCompleteness(), createProfileSnapshot()
  - Responsibility: Query alumni_members, match to user email, fetch all records for family members sharing email

- **src/services/StreamlinedRegistrationService.ts** (768 lines)
  - Purpose: Orchestrate registration + family setup
  - Key Methods: completeStreamlinedRegistration(), createPrimaryFamilyMember(), createAdditionalFamilyMember()
  - Responsibility: Create user + primary family member + auto-import all alumni matches (CURRENT AUTO-IMPORT FLOW)

- **src/services/familyMemberService.ts** - Family member operations
- **src/services/AgeVerificationService.ts** - Age calculation for COPPA
- **src/services/InvitationService.ts** - Invitation lifecycle

### Family Management Routes
- **routes/family-members.js** - Family profile endpoints
  - Endpoints: GET /, GET /:id, POST /, POST /:id/switch, POST /:id/consent/grant, POST /:id/consent/revoke, POST /:id/birth-date, GET /:id/consent/check, GET /:id/consent-history, GET /logs/access
  - Responsibility: Profile switching, COPPA consent, access logging

---

## Module 1: Authentication (Core - Should Remain Focused)

### Current State
```
routes/auth.js endpoints:
├─ authenticateToken()        ✅ Pure auth middleware
├─ login()                     ✅ OTP + login
├─ logout()                    ✅ Session termination
├─ verifyAuth()                ✅ Token verification
├─ refresh()                   ✅ JWT refresh
├─ registerFromInvitation()    ❌ BLOAT - mixes auth + registration
├─ registerFromFamilyInvitation()  ❌ BLOAT - mixes auth + family setup
├─ requestPasswordReset()      ✅ Pure auth
├─ validatePasswordResetToken()✅ Pure auth
└─ resetPassword()             ✅ Pure auth
```

### The Problem: registerFromInvitation() (auth.js:620)

```typescript
// CURRENT (Mixed Concerns)
export const registerFromInvitation = asyncHandler(async (req, res) => {
  // 1. Validate invitation
  // 2. Validate alumni data
  // 3. Create user account (AUTH)
  // 4. Create primary family member (FAMILY RELATIONS)
  // 5. Auto-import ALL alumni matches (ALUMNI + FAMILY)
  // 6. Create family profiles for each match (FAMILY RELATIONS)
  // 7. Send welcome email (NOTIFICATIONS)
  // ... all in ONE endpoint
});
```

**Current Data Flow**:
```
GET /invitations/{token}                 (validate & show form)
   └─ checks USER_INVITATIONS
   └─ calls AlumniDataIntegrationService.fetchAllAlumniMembersByEmail()
   └─ returns available alumni matches

POST /auth/register-from-invitation      (submit form)
   └─ calls StreamlinedRegistrationService.completeStreamlinedRegistration()
   ├─ Creates app_users record (AUTH CONCERN)
   ├─ Creates primary FAMILY_MEMBERS record (FAMILY CONCERN)
   ├─ Fetches ALL alumni by email AGAIN
   ├─ Creates additional FAMILY_MEMBERS for each match (AUTO-IMPORT PROBLEM)
   ├─ Updates USER_INVITATIONS status (INVITATIONS CONCERN)
   └─ Sends welcome email (NOTIFICATIONS CONCERN)
```

### The Core Issue: AUTO-IMPORT OF FAMILY MEMBERS

**Current Behavior** (StreamlinedRegistrationService.ts:215-236):
```typescript
// Fetch ALL alumni members with this email for family onboarding
const allAlumniProfiles = await this.alumniService.fetchAllAlumniMembersByEmail(invitation.email);
console.log(`👨‍👩‍👧‍👦 Found ${allAlumniProfiles.length} alumni member(s) with email ${invitation.email}`);

// Create additional family members for other alumni with the same email
let additionalMembersCreated = 0;
for (const otherAlumni of allAlumniProfiles) {
  if (otherAlumni.id === alumniProfile.id) continue; // Skip primary
  
  const familyMemberId = uuidv4();
  const alumniSnapshot = this.alumniService.createProfileSnapshot(otherAlumni);
  await this.createAdditionalFamilyMember(connection, userId, otherAlumni, familyMemberId, alumniSnapshot);
  additionalMembersCreated++;
}
```

**Problem**: 
- Family members created WITHOUT explicit user consent
- Happens automatically during registration
- User doesn't get to select which alumni to claim
- **Per Clarification #5**: Should be CONDITIONAL - show matches, get COPPA consent first, THEN add

### Proposed Separation: Authentication Module

```typescript
// PROPOSED - Authentication module (focused)
export const registerFromInvitation = asyncHandler(async (req, res) => {
  // 1. Validate invitation token
  // 2. Create app_users account
  // 3. Mark invitation as accepted
  // 4. Return: user profile, next step (COPPA flow or family setup)
  // 5. Send welcome email
  
  // NO family member creation - delegate to Family Relations module
});

// Invitation module handles orchestration
export const completeOnboarding = asyncHandler(async (req, res) => {
  // 1. Validate user (already has account)
  // 2. Show available alumni matches (from AlumniDataIntegrationService)
  // 3. Collect COPPA year-of-birth
  // 4. Grant/request parent consent
  // 5. Then call Family Relations module to create profiles
});
```

---

## Module 2: Alumni Data (Reference/Read-Only)

### Current State

**Responsibility**: Provide single source of truth for alumni member data

**Key Tables**:
```
alumni_members (1,280 records)
├─ Source: raw_csv_uploads (manual import)
├─ Matches user by: email
└─ Data: first_name, last_name, student_id, batch, center_name, graduation_year, phone

raw_csv_uploads (staging/archive)
└─ ROW_DATA (JSON): Original CSV format - unclear structure, not documented
```

**Current Service**: AlumniDataIntegrationService.ts

```typescript
class AlumniDataIntegrationService {
  // Read-only queries
  async fetchAllAlumniMembersByEmail(email)        // Used in: registration
  async fetchAlumniMemberById(id)                  // Lookup single record
  async validateAlumniDataCompleteness(alumni)    // Check data quality
  async createProfileSnapshot(alumni)             // JSON capture
  async estimateAgeFromGraduationYear(graduationYear)  // Age calculation
}
```

### Problems Identified

1. **Pipeline Unclear**: How is raw_csv_uploads → alumni_members populated?
   - Manual script? Automated? Who owns it?
   - Migration files don't show alumni_members creation

2. **Email Matching Logic**:
   - `fetchAllAlumniMembersByEmail()` returns ALL alumni with that email
   - Assumes multiple family members share email (correct for families)
   - But what if email is shared by different unrelated alumni? (Data quality issue?)

3. **Age Calculation Fallback Chain**:
```typescript
// From AlumniDataIntegrationService - EstimatedAge Calculation
CASE 
  WHEN birth_date IS NOT NULL THEN TIMESTAMPDIFF(YEAR, birth_date, CURDATE())
  WHEN estimated_birth_year IS NOT NULL THEN YEAR(CURDATE()) - estimated_birth_year
  WHEN batch IS NOT NULL THEN YEAR(CURDATE()) - (batch - 22)
  ELSE NULL
END as estimated_age
```

   Questions:
   - Where does `estimated_birth_year` come from? (Not in schema)
   - Should "batch - 22" formula be used for COPPA decisions?
   - Need exact threshold: batch >= 2010 or birth_year <= 2010?

4. **Data Fields in Snapshots**:
   - `alumni_data_snapshot` stored in FAMILY_MEMBERS but structure not defined
   - Should store immutable copy of alumni record at time of family member creation

### Proposed Alumni Data Module

```
Module 2: Alumni Data Management
├─ Responsibility:
│  ├─ Manage alumni_members table (canonical source)
│  ├─ Pipeline: raw_csv_uploads → alumni_members
│  ├─ Provide email matching (for invitations)
│  └─ Store alumni data snapshots in family profiles
│
├─ Services:
│  ├─ AlumniDataIntegrationService (existing - reuse)
│  └─ AlumniDataPipelineService (NEW - import/sync logic)
│
└─ Admin Routes: /admin/alumni
   ├─ GET /list - view alumni members
   ├─ POST /import - upload CSV → raw_csv_uploads
   ├─ POST /sync - process raw_csv_uploads → alumni_members
   └─ GET /:id - view single alumni record
```

---

## Module 3: Family Relations (COPPA & Profiles)

### Current State

**Tables**:
```
FAMILY_MEMBERS (Central Table)
├─ Profile data: first_name, last_name, phone, professional info
├─ Alumni link: alumni_member_id (FK), alumni_data_snapshot (JSON)
├─ COPPA fields: birth_date, current_age, can_access_platform, requires_parent_consent, parent_consent_given, parent_consent_date
├─ Access control: access_level (full/supervised/blocked), relationship (self/child/spouse/sibling/guardian), is_primary_contact, status
└─ Audit: last_login_at

FAMILY_ACCESS_LOG (Unused)
├─ Intended for: COPPA audit trail
└─ Status: ⚠️ NOT POPULATED - schema artifact
```

**Routes** (routes/family-members.js):
```typescript
router.get('/', authenticateToken)                    // List family members
router.get('/:id', authenticateToken)                // Get single member
router.post('/', authenticateToken)                  // Create family member
router.post('/:id/switch', authenticateToken)        // Switch active profile
router.post('/:id/consent/grant', authenticateToken) // Grant parental consent
router.post('/:id/consent/revoke', authenticateToken)// Revoke consent
router.post('/:id/birth-date', authenticateToken)    // Update birth date (for COPPA)
router.get('/:id/consent/check', authenticateToken)  // Check consent status
router.get('/:id/consent-history', authenticateToken)// Audit trail
router.get('/logs/access', authenticateToken)        // Access logs (uses FAMILY_ACCESS_LOG)
```

### Age/COPPA Logic Issues

**Current Age Calculation** (StreamlinedRegistrationService.ts:303-315):
```typescript
// Calculate age from birth_date or estimate from graduation year
let birthDate = alumniProfile.birthDate || null;
let currentAge = null;

if (birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  currentAge = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    currentAge--;
  }
} else if (alumniProfile.estimatedBirthYear) {
  currentAge = new Date().getFullYear() - alumniProfile.estimatedBirthYear;
  birthDate = `${alumniProfile.estimatedBirthYear}-01-01`; // Jan 1 of year
} else if (alumniProfile.graduationYear) {
  const estimatedBirthYear = alumniProfile.graduationYear - 22;
  currentAge = new Date().getFullYear() - estimatedBirthYear;
  birthDate = `${estimatedBirthYear}-01-01`;
}
```

**COPPA Access Rules** (StreamlinedRegistrationService.ts:316-323):
```typescript
if (currentAge !== null) {
  if (currentAge < 14) {
    canAccess = false;
    accessLevel = 'blocked';
  } else if (currentAge < 18) {
    requiresConsent = true;
    accessLevel = 'supervised';
    canAccess = false; // Needs parent consent first
  }
}
```

**Issues Identified**:
1. Age calculation uses calendar year, not full date
   - "currentAge = year - birthYear" doesn't account for month/day
   - Affects boundary cases (turning 14 this year vs next year)

2. Thresholds are hard-coded
   - COPPA threshold: 14 years old (US standard, but what about other countries?)
   - Supervision threshold: 18 years old
   - Should these be configurable?

3. `canAccess = false` even for 14+ without consent seems wrong
   - Should be: 14+ can access; 14-18 need consent; <14 blocked

4. Per CLARIFICATION: Using year-of-birth only, need exact formula
   - Current: Estimate from batch = graduation_year - 22
   - Proposed: Use explicit year_of_birth field
   - Decision: How to handle users born on 12/31 vs 1/1?

### Proposed Family Relations Module

```
Module 3: Family Relations (COPPA & Profiles)
├─ Responsibility:
│  ├─ Profile data (FAMILY_MEMBERS)
│  ├─ COPPA compliance (age, consent)
│  ├─ Family relationships (child, parent, spouse)
│  ├─ Access control (supervised, blocked, full)
│  └─ Audit logging (FAMILY_ACCESS_LOG)
│
├─ Services:
│  ├─ familyMemberService.ts (existing - profile management)
│  ├─ AgeVerificationService.ts (existing - age calculation)
│  ├─ FamilyAccessAuditService.ts (NEW - populate FAMILY_ACCESS_LOG)
│  └─ COPPAComplianceService.ts (NEW - consent & verification)
│
├─ Middleware:
│  ├─ verifyFamilyMemberAccess() - Check access_level
│  ├─ verifyParentConsent() - Check if <18 has consent
│  └─ logFamilyAccess() - Populate FAMILY_ACCESS_LOG
│
└─ Routes: /family-members/*
   ├─ GET / - List family members
   ├─ GET /:id - Get single member
   ├─ POST / - Create profile (after COPPA verification)
   ├─ POST /:id/switch - Switch active profile
   ├─ POST /:id/consent/grant - Grant consent
   ├─ POST /:id/consent/revoke - Revoke consent
   ├─ POST /:id/birth-date - Update YOB
   ├─ GET /:id/consent-history - Audit trail
   └─ GET /logs/access - Access logs
```

---

## Module 4: Invitations & Onboarding (Orchestration)

### Current State

**Tables**:
```
USER_INVITATIONS (Used)
├─ Purpose: Registration tokens for alumni + family members
├─ Status: pending, accepted, expired, revoked
└─ Used by: routes/auth.js + routes/invitations.js

FAMILY_INVITATIONS (⚠️ UNUSED)
├─ Purpose: Batch family invitations (unclear)
├─ Status: pending, partially_accepted, completed
└─ Used by: ??? (NOT FOUND IN ANY ROUTES)
```

**Current Flow**:

```
1. Admin creates invitation
   POST /invitations/create → USER_INVITATIONS record
   
2. Admin sends email with token

3. User clicks link, receives invitation details
   GET /invitations/validate?token=xxx
   ├─ Validates token
   ├─ Fetches alumni by email
   └─ Returns: invitation, available alumni matches, required fields

4. User fills registration form
   POST /auth/register-from-invitation
   ├─ Validates all inputs
   ├─ Creates app_users account
   ├─ Creates primary FAMILY_MEMBERS
   ├─ AUTO-IMPORTS ALL other alumni with same email (PROBLEM)
   ├─ Updates USER_INVITATIONS.status = 'accepted'
   └─ Returns: JWT token + welcome message

5. User is immediately logged in + can switch between all auto-imported profiles
```

**Problem**: Step 4 auto-imports all alumni without:
- Showing which alumni to claim
- Collecting relationship info (child/spouse/sibling)
- Requesting COPPA year-of-birth
- Getting parent consent if <18

### Proposed Onboarding Flow (Per Clarifications)

```
1. Admin creates invitation → USER_INVITATIONS

2. User visits registration link
   GET /invitations/validate?token=xxx
   └─ Returns: invitation details + available alumni

3. User selects which alumni to claim
   POST /onboarding/select-profiles
   ├─ Input: [alumni_id, alumni_id, ...]
   ├─ Store temporary selection
   └─ Next step: COPPA verification

4. User provides year-of-birth for each profile
   POST /onboarding/verify-coppa
   ├─ Input: {profile_id: year_of_birth, ...}
   ├─ Call AgeVerificationService
   ├─ Determine if each profile needs parent consent
   └─ Collect parent contact if needed

5. If <18, request parent consent
   POST /onboarding/request-parent-consent
   ├─ Send email to parent
   ├─ Parent clicks confirmation link
   ├─ Parent confirms year-of-birth
   └─ Mark consent_granted

6. Complete registration
   POST /auth/register-from-invitation
   ├─ Create app_users account
   ├─ Create FAMILY_MEMBERS only for selected + verified profiles
   ├─ Set relationship, access_level, consent status
   └─ Login user

7. User sees profile switcher with only claimed alumni
```

### Proposed Invitations & Onboarding Module

```
Module 4: Invitations & Onboarding (Orchestration)
├─ Responsibility:
│  ├─ Coordinate: Auth + Alumni matching + Family setup
│  ├─ Manage invitation lifecycle (create, send, validate, use)
│  ├─ Orchestrate: COPPA verification → consent collection → family creation
│  └─ Handle: Email to parent, consent verification, profile selection
│
├─ Tables:
│  ├─ USER_INVITATIONS (consolidate both types?)
│  ├─ FAMILY_INVITATIONS (decision: keep or merge?)
│  └─ EMAIL_DELIVERY_LOG (track invitation emails)
│
├─ Services:
│  ├─ InvitationService.ts (existing - create/validate/resend)
│  ├─ StreamlinedRegistrationService.ts (existing - needs refactor)
│  ├─ OnboardingOrchestrationService.ts (NEW - coordinate flow)
│  ├─ COPPAOnboardingService.ts (NEW - COPPA verification + parent consent)
│  └─ ParentConsentService.ts (NEW - parent email + verification)
│
└─ Routes: /invitations/* + /onboarding/* + /auth/register*
   ├─ GET /invitations/validate - Validate token
   ├─ POST /invitations/create - Create invitation (admin)
   ├─ POST /invitations/resend - Resend token
   ├─ POST /invitations/revoke - Revoke invitation
   │
   ├─ POST /onboarding/select-profiles - User selects alumni to claim
   ├─ POST /onboarding/verify-coppa - Collect YOB for each profile
   ├─ POST /onboarding/request-parent-consent - Send consent email
   ├─ GET /onboarding/verify-parent-consent - Parent clicks link
   ├─ POST /onboarding/complete - Finalize registration
   │
   └─ POST /auth/register-from-invitation - Final account creation
```

---

## Module Boundary Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│ AUTHENTICATION MODULE (Focused on Auth)                                 │
├─────────────────────────────────────────────────────────────────────────┤
│ Responsibility: JWT, OTP, login/logout, password reset                  │
│ Routes: /auth/login, /auth/logout, /auth/verify, /auth/refresh         │
│ Tables: (none - relies on app_users from other modules)                │
│ No Profile Management ✅  No Family Setup ✅  No Alumni Matching ✅     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ ALUMNI DATA MODULE (Read-Only Reference)                                │
├─────────────────────────────────────────────────────────────────────────┤
│ Responsibility: Alumni source data, email matching, data quality        │
│ Services: AlumniDataIntegrationService.ts                               │
│ Tables: alumni_members, raw_csv_uploads                                 │
│ Provides: matchAlumniByEmail(), validateCompleteness()                  │
│ Used by: Invitations module (for family selection)                      │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ FAMILY RELATIONS MODULE (COPPA & Profiles)                              │
├─────────────────────────────────────────────────────────────────────────┤
│ Responsibility: Profiles, relationships, COPPA age/consent              │
│ Routes: /family-members/*                                               │
│ Tables: FAMILY_MEMBERS, FAMILY_ACCESS_LOG                               │
│ Services: familyMemberService, AgeVerificationService, COPPAService     │
│ Provides: createProfile(), grantConsent(), verifyAccess()               │
│ Used by: Invitations (for profile creation) + Users (switching)         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ INVITATIONS & ONBOARDING MODULE (Orchestration)                         │
├─────────────────────────────────────────────────────────────────────────┤
│ Responsibility: Coordinate entire onboarding, invitation lifecycle      │
│ Routes: /invitations/*, /onboarding/*, /auth/register                   │
│ Tables: USER_INVITATIONS, FAMILY_INVITATIONS, EMAIL_DELIVERY_LOG       │
│ Uses: Authentication (create user), Alumni (match profiles),            │
│       Family Relations (create profiles after COPPA), Notifications    │
│ Flow: Token validation → alumni selection → COPPA verification →        │
│       parent consent → family profile creation → account creation       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Current Code Issues (To Fix)

### Issue 1: AUTO-IMPORT OF FAMILY MEMBERS

**Location**: routes/auth.js:620 (registerFromInvitation) → StreamlinedRegistrationService.ts:215-236

**Current Behavior**:
```typescript
// Fetch ALL alumni members with this email
const allAlumniProfiles = await this.alumniService.fetchAllAlumniMembersByEmail(invitation.email);

// Auto-create FAMILY_MEMBERS for each one
for (const otherAlumni of allAlumniProfiles) {
  if (otherAlumni.id === alumniProfile.id) continue;
  await this.createAdditionalFamilyMember(...);
}
```

**Problem**: No user consent, no selection, no COPPA verification

**Solution**: Move to conditional flow
1. Show available alumni (don't create yet)
2. User selects which to claim
3. Collect COPPA year-of-birth
4. Get parent consent if needed
5. THEN create profiles (in Family Relations module)

---

### Issue 2: TWO INVITATION TABLES

**Location**: routes/invitations.js handles both USER_INVITATIONS + FAMILY_INVITATIONS

**Current Behavior**:
- USER_INVITATIONS: For individual alumni + family member registrations
- FAMILY_INVITATIONS: For batch family invitations (⚠️ NOT USED ANYWHERE)

**Question**: Is FAMILY_INVITATIONS ever used?
- No routes reference it
- No services populate it
- May be legacy artifact

**Solution**: 
- Option A: Merge into USER_INVITATIONS with batch_size field
- Option B: Delete FAMILY_INVITATIONS if truly unused
- Decision: Needs code audit + decision in Scout 1 findings

---

### Issue 3: MIXED CONCERNS IN registerFromInvitation()

**Location**: routes/auth.js:620

**Current Flow**:
```
1. Validate invitation token (AUTH)
2. Look up invitation details (INVITATIONS)
3. Fetch alumni by email (ALUMNI)
4. Create app_users (AUTH)
5. Create primary FAMILY_MEMBERS (FAMILY)
6. Auto-create additional FAMILY_MEMBERS (FAMILY)
7. Update invitation status (INVITATIONS)
8. Send email (NOTIFICATIONS)
```

**Problem**: One endpoint does 8 different responsibilities

**Solution**: Split into modules
```
Auth Module:  /auth/register-from-invitation
  ├─ Create app_users account
  ├─ Call OnboardingOrchestrationService
  └─ Return JWT + next steps

Invitations Module:  /onboarding/* (orchestration)
  ├─ Show available alumni (from Alumni module)
  ├─ Collect user selections
  ├─ Verify COPPA (from Family Relations module)
  ├─ Request parent consent
  └─ Create family profiles (via Family Relations module)
```

---

### Issue 4: COPPA LOGIC NOT CENTERED

**Location**: StreamlinedRegistrationService.ts:303-323

**Current Approach**:
- Age calculated during registration
- COPPA thresholds applied during family member creation
- No audit trail (FAMILY_ACCESS_LOG not populated)
- Access control happens at profile switch time (routes/family-members.js)

**Problem**: COPPA compliance scattered across multiple modules

**Solution**: Centralize in Family Relations module
- AgeVerificationService: age calculation
- COPPAComplianceService: consent requirements
- FamilyAccessAuditService: log all access
- FAMILY_ACCESS_LOG: populated on every profile access

---

## Dependencies Between Modules

```
Authentication Module (standalone)
├─ Depends on: (none - standalone)
├─ Used by: Invitations module
└─ Provides: JWT tokens, user accounts

Alumni Data Module (standalone)
├─ Depends on: (none - read-only reference)
├─ Used by: Invitations module (for profile selection)
└─ Provides: Alumni records by email

Family Relations Module (semi-standalone)
├─ Depends on: Alumni Data (for alumni snapshots)
├─ Used by: Invitations module (for profile creation)
└─ Provides: Profile creation, access control, COPPA enforcement

Invitations & Onboarding Module (orchestration - depends on all)
├─ Depends on: 
│  ├─ Authentication (create users)
│  ├─ Alumni Data (fetch candidates)
│  ├─ Family Relations (create verified profiles)
│  └─ Notifications (send emails + consent links)
├─ Used by: Public registration flow
└─ Provides: Complete onboarding orchestration
```

---

## Patterns Identified

### Anti-Patterns (To Remove)

1. **God Class - StreamlinedRegistrationService**
   - Does: Invite validation, alumni matching, user creation, family member creation, email sending
   - Should do: Only registration orchestration

2. **Mixed DB Concerns in Auth Routes**
   - routes/auth.js handles: JWT + OTP + user creation + family setup + invitation management
   - Should be: Auth only

3. **Auto-Import Anti-Pattern**
   - Creates profiles without user consent
   - Hides relationship selection from user
   - Skips COPPA verification

### Good Patterns (To Keep)

1. ✅ **Separate Services for Each Domain**
   - AlumniDataIntegrationService (alumni logic)
   - familyMemberService (family logic)
   - AgeVerificationService (age calculation)

2. ✅ **Invitation Lifecycle Management**
   - Token validation, expiration, resend, revoke logic well-designed

3. ✅ **FAMILY_MEMBERS as Single Source of Truth**
   - Consolidation of user_profiles into FAMILY_MEMBERS (v2.0) is good design

---

## Code References

### Current Entry Points
- `routes/auth.js`: authenticateToken (middleware), login, logout, registerFromInvitation, registerFromFamilyInvitation
- `routes/invitations.js`: createInvitation, validateInvitation, getAllInvitations, getFamilyInvitations
- `routes/family-members.js`: GET/, POST/, POST/:id/switch, POST/:id/consent/grant

### Key Functions to Refactor
- `StreamlinedRegistrationService.completeStreamlinedRegistration()` - split this into smaller responsibilities
- `StreamlinedRegistrationService.createAdditionalFamilyMember()` - move to Family Relations module, make it explicit (not auto-import)
- `routes/auth.js:registerFromInvitation()` - extract orchestration logic

### Services to Create/Refactor
- **New**: OnboardingOrchestrationService (coordinate invite → COPPA → family creation)
- **New**: COPPAOnboardingService (COPPA verification + parent consent flow)
- **New**: ParentConsentService (email to parent, consent verification)
- **New**: FamilyAccessAuditService (populate FAMILY_ACCESS_LOG)
- **Refactor**: StreamlinedRegistrationService (split concerns)
- **Enhance**: AgeVerificationService (year-of-birth only, with exact boundary logic)

---

## Research Questions Remaining

### Invitation System Design
- [ ] Is FAMILY_INVITATIONS used or legacy? (Code audit needed)
- [ ] If used, should consolidate with USER_INVITATIONS or keep separate?
- [ ] What's the relationship between invitation_type and table choice?

### Family Member Selection
- [ ] Should relationship be auto-inferred from YOB or collected from user?
- [ ] If auto-inference: What YOB delta makes someone a "child" vs "sibling"?
- [ ] UI: How many profiles can user select simultaneously?

### COPPA Age Calculation
- [ ] For 14/18 threshold: Use 1/1 or 12/31 of birth year?
- [ ] What if YOB = current year (newborn)? Should be blocked, right?
- [ ] Year-of-birth boundaries: born in 2010 = age 14 (year 2024)? Or age 13?

### Parent Consent Flow
- [ ] How should parent consent email work?
   - One consent per profile?
   - One batch consent per family?
   - Consent per platform feature?
- [ ] Should parent be able to revoke consent later?
- [ ] Audit requirements: What must be stored in FAMILY_ACCESS_LOG?

### Module Boundaries
- [ ] Should notifications (email) be separate module or part of each module?
- [ ] Where should admin endpoints live? (Separate admin module?)
- [ ] Should role-based access (moderator, admin) be separate module?

---

## Recommendations

### Priority 1: Define Module Boundaries (HIGH)
1. Clarify FAMILY_INVITATIONS usage (keep or remove)
2. Document exact module responsibilities and API contracts
3. Create skeleton services for each module

### Priority 2: Refactor Registration Flow (HIGH)
4. Split StreamlinedRegistrationService into smaller pieces
5. Remove auto-import logic from registration
6. Create ConditionalFamilySetupService

### Priority 3: Implement COPPA Onboarding (MEDIUM)
7. Create OnboardingOrchestrationService
8. Implement year-of-birth collection (not full birth_date)
9. Implement parent consent flow

### Priority 4: Module Cleanup (MEDIUM)
10. Move family-related endpoints from auth.js to dedicated invitations router
11. Clean up FAMILY_INVITATIONS (remove or consolidate)
12. Populate FAMILY_ACCESS_LOG (for audit compliance)

---

## Next Steps

1. **Load Scout 1 Findings** - Use database schema cleanup decisions
2. **Map Code References** - Grep for all FAMILY_INVITATIONS usage
3. **Create Module Skeleton** - Define exported APIs for each module
4. **Move to Scout 3** - COPPA compliance implementation details
5. **Move to Scout 5** - Detailed family member import logic (conditional flow)

---

## Referenced Files

### Routes
- `routes/auth.js` (1,125 lines)
- `routes/invitations.js` (1,049 lines)
- `routes/family-members.js`

### Services
- `src/services/StreamlinedRegistrationService.ts` (768 lines)
- `src/services/AlumniDataIntegrationService.ts` (272 lines)
- `src/services/familyMemberService.ts`
- `src/services/AgeVerificationService.ts`
- `src/services/InvitationService.ts`

### Middleware
- `middleware/auth.js`

### Database Schema
- `docs/specs/functional/authentication/db-schema.md`
- `docs/specs/functional/user-management/db-schema.md`

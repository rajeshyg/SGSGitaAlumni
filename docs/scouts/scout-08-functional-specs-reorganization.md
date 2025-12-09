# Scout Report 07 - Functional Specs Reorganization

**Date**: 2025-12-07  
**Status**: Brainstorming - Findings Only  
**Purpose**: Analyze current functional specs organization and explore alternatives for clear phase boundaries

---

## Current Organization Analysis

### Current Structure (10 Modules)

```
docs/specs/functional/
├── authentication/         (7 specs - 765 lines auth.js)
├── user-management/        (5 specs - 300 lines family-members.js)
├── admin/                  (6 specs - 1049 lines invitations.js)
├── directory/              (3 specs)
├── postings/               (6 specs)
├── messaging/              (4 specs)
├── dashboard/              (4 specs)
├── moderation/             (4 specs)
├── notifications/          (3 specs)
└── rating/                 (2 specs)
```

### Key Observation: Overlaps Detected

#### Overlap 1: Invitation Management
**Current Location**: `admin/invitation-management.md`  
**Problem**: Invitations are used during registration flow  
**Code**: `routes/invitations.js` (1,049 lines)  
**Referenced In**:
- `authentication/registration.md` - "User receives invitation link"
- `user-management/family-member-management.md` - "Admin sends invitations"
- `admin/invitation-management.md` - Admin management UI

**Question**: Should invitations be in authentication, user-management, admin, or separate phase?

#### Overlap 2: Family Member Management
**Current Location**: `user-management/family-member-management.md`  
**Problem**: Contains registration logic, age verification, and consent flows  
**Code**: Referenced in `routes/auth.js` registration flow  
**Cross-References**:
- `authentication/registration.md` - "Account created and user logged in"
- `authentication/age-verification.md` - Age checks
- `authentication/parental-consent.md` - Consent modal
- `user-management/family-member-management.md` - Profile management

**Question**: Is family onboarding part of authentication/registration or profile management?

#### Overlap 3: Age Verification & Consent
**Current Locations**:
- `authentication/age-verification.md`
- `authentication/parental-consent.md`
- `user-management/family-member-management.md` (contains consent flow)

**Code**: `AgeVerificationService.ts` (486 lines)  
**Problem**: Age verification happens during registration AND when adding family members  
**Question**: Should COPPA compliance be a separate concern or embedded in registration?

---

## Problem Statement

### Why Reorganization is Needed

1. **Unclear Boundaries**: Where does "registration" end and "profile management" begin?
2. **Missing Specs**: Invitation management is under-documented (admin perspective only)
3. **Workflow Confusion**: Family onboarding spans authentication, user-management, and admin
4. **Code vs Specs Mismatch**: Code modules don't align with spec modules
5. **Implementation Confusion**: Developers unsure which spec to follow for cross-cutting features

### Current Pain Points

| Feature | Spec Locations | Code Locations | Problem |
|---------|---------------|----------------|---------|
| Invitations | admin/ | routes/invitations.js, routes/auth.js | Split across 2 specs, 2 routes |
| Registration | authentication/ | routes/auth.js, StreamlinedRegistrationService.ts | Missing family onboarding details |
| Family Setup | user-management/ | StreamlinedRegistrationService.ts, routes/family-members.js | Mixed with post-registration management |
| Age Verification | authentication/ | AgeVerificationService.ts | Used in registration AND family management |

---

## Brainstorming Options

### Option A: 3-Phase Model (Chronological Flow)

**Rationale**: Organize by user journey timeline

```
Phase 1: Onboarding & Access Control
├── invitation-system.md          (Admin sends invites, token generation)
├── registration.md               (Accept invite, create account, OTP)
├── family-discovery.md           (Show alumni records, select profiles)
├── age-verification.md           (COPPA checks, YOB collection)
├── parental-consent.md           (Consent modal, audit trail)
└── initial-profile-setup.md      (Complete profile for first time)

Phase 2: Identity & Profile Management
├── login.md                      (Email + password, profile selection)
├── session-management.md         (JWT, refresh tokens, timeout)
├── profile-editing.md            (Update fields, photo upload)
├── family-profile-management.md  (Switch profiles, add new graduates)
├── account-settings.md           (Password, email, preferences)
└── profile-photos.md             (Upload, crop, display)

Phase 3: Platform Features
├── directory/
├── postings/
├── messaging/
├── dashboard/
├── moderation/
├── notifications/
├── rating/
└── admin/
```

**Pros**:
- Clear chronological flow matches user experience
- Onboarding is complete, self-contained phase
- Family setup is part of onboarding (where it happens)
- No overlap between phases (clear cut-off)

**Cons**:
- "Onboarding" is large (6 specs)
- Admin invitation management separated from other admin features
- Age verification appears twice (onboarding + family management)

**Spec-to-Code Mapping**:
- Phase 1 → `StreamlinedRegistrationService.ts`, `routes/auth.js`, `routes/invitations.js`
- Phase 2 → `routes/family-members.js`, `routes/users.js`, `routes/preferences.js`
- Phase 3 → All other routes

---

### Option B: 4-Phase Model (Separation of Concerns)

**Rationale**: Organize by functional responsibility

```
Phase 1: Access Control & Identity
├── invitation-system.md          (Generate, send, validate invites)
├── registration.md               (Create account, OTP verification)
├── login.md                      (Authenticate, profile selection)
├── session-management.md         (JWT lifecycle, refresh)
└── password-management.md        (Reset, change, requirements)

Phase 2: COPPA Compliance & Family Onboarding
├── family-discovery.md           (Show alumni, select profiles)
├── age-verification.md           (YOB collection, age calculation)
├── parental-consent.md           (Consent modal, grant/revoke)
├── consent-audit-trail.md        (Logging, renewal, expiration)
└── access-levels.md              (blocked/supervised/full)

Phase 3: Profile & Account Management
├── profile-editing.md            (Update profile fields)
├── profile-photos.md             (Upload, manage photos)
├── family-profile-switching.md   (Switch between profiles)
├── add-family-members.md         (Post-registration additions)
├── account-settings.md           (Email, password, preferences)
└── preferences.md                (Notifications, privacy)

Phase 4: Platform Features
├── directory/
├── postings/
├── messaging/
├── dashboard/
├── moderation/
├── notifications/
├── rating/
└── admin/
```

**Pros**:
- Clear separation of concerns (access, compliance, profiles, features)
- COPPA compliance is isolated (easier for legal review)
- Family onboarding is complete, self-contained
- Easy to audit compliance requirements

**Cons**:
- Phase 2 is specialized (only relevant for family accounts)
- More phases to navigate
- Admin invitation management still separated from admin features

**Spec-to-Code Mapping**:
- Phase 1 → `routes/auth.js`, `routes/invitations.js` (auth logic)
- Phase 2 → `StreamlinedRegistrationService.ts`, `AgeVerificationService.ts`
- Phase 3 → `routes/family-members.js`, `routes/users.js`
- Phase 4 → All other routes

---

### Option C: 3-Phase Model (User-Centric with Admin Separation)

**Rationale**: Keep admin separate, organize user features by lifecycle

```
Phase 1: Registration & Onboarding (First-Time Users)
├── invitation-acceptance.md      (Accept invite, validate token)
├── registration.md               (Create account, OTP verification)
├── family-discovery.md           (Show alumni, select profiles)
├── age-verification.md           (COPPA checks, YOB collection)
├── parental-consent.md           (Consent modal for minors)
└── initial-profile-setup.md      (Complete profile fields)

Phase 2: Authentication & Profile Management (Returning Users)
├── login.md                      (Email + password, profile selection)
├── session-management.md         (JWT, refresh tokens)
├── profile-editing.md            (Update profile, photos)
├── family-profile-switching.md   (Switch between profiles)
├── add-family-members.md         (Add new graduates post-registration)
├── account-settings.md           (Password, email, preferences)
└── password-recovery.md          (Reset flow)

Phase 3: Platform Features (All Users)
├── directory/
├── postings/
├── messaging/
├── dashboard/
├── moderation/
├── notifications/
├── rating/
└── admin/                        (Including invitation-management.md)
```

**Pros**:
- Focuses on user perspective (first-time vs returning)
- Admin features stay together in Phase 3
- Clear lifecycle boundary (registration vs usage)
- Smaller phases (6, 7, and many specs)

**Cons**:
- Admin invitation management mixed with platform features
- Age verification appears in Phase 1 and Phase 2 (adding family members)
- Less clear separation of concerns

**Spec-to-Code Mapping**:
- Phase 1 → `StreamlinedRegistrationService.ts`, `routes/auth.js` (registration)
- Phase 2 → `routes/auth.js` (login), `routes/family-members.js`, `routes/users.js`
- Phase 3 → All other routes + `routes/invitations.js`

---

### Option D: 4-Phase Model (Feature-Complete Lifecycle)

**Rationale**: Balance between lifecycle and concerns, keeping invitation complete

```
Phase 1: Invitation & Access Control
├── invitation-generation.md      (Admin creates invitations)
├── invitation-management.md      (Admin UI, status tracking)
├── invitation-acceptance.md      (User clicks link, validates token)
├── invitation-expiry.md          (Expiration, revocation)
└── invitation-audit.md           (Track who invited whom)

Phase 2: Registration & Family Onboarding
├── registration.md               (Create account, OTP verification)
├── family-discovery.md           (Show alumni records, select profiles)
├── relationship-collection.md    (Parent/child, YOB for children)
├── age-verification.md           (COPPA age checks)
├── parental-consent.md           (Consent modal, grant/revoke)
└── profile-creation.md           (Create FAMILY_MEMBERS records)

Phase 3: Authentication & Identity Management
├── login.md                      (Email + password)
├── profile-selection.md          (Family profile selector)
├── session-management.md         (JWT, refresh tokens)
├── profile-switching.md          (Switch during session)
├── password-management.md        (Reset, change)
└── account-settings.md           (Email, preferences)

Phase 4: Platform Features
├── profile-editing.md            (Update profile fields, photos)
├── add-family-members.md         (Post-registration additions)
├── directory/
├── postings/
├── messaging/
├── dashboard/
├── moderation/
├── notifications/
├── rating/
└── admin/ (excluding invitations)
```

**Pros**:
- Invitation system is complete in Phase 1 (both admin + user perspectives)
- Family onboarding is complete in Phase 2 (registration + COPPA)
- Clear phase boundaries with no overlap
- Matches implementation-context-family-onboarding-coppa.md scope

**Cons**:
- 4 phases might be too granular
- Phase 1 has both admin and user perspectives
- More files to maintain

**Spec-to-Code Mapping**:
- Phase 1 → `routes/invitations.js` (1,049 lines - complete module)
- Phase 2 → `StreamlinedRegistrationService.ts`, `AgeVerificationService.ts`, `AlumniDataIntegrationService.ts`
- Phase 3 → `routes/auth.js` (login/session), `routes/family-members.js` (switching)
- Phase 4 → All other routes

---

## Invitation Management - Missing Specs

### Current Coverage (Admin Only)

**Existing Spec**: `admin/invitation-management.md` (52 lines)
- Admin generates invitations (single/bulk)
- Admin views invitation status
- Admin revokes invitations
- Email sending

**Missing User Perspective**:
- What happens when user clicks invitation link?
- How is invitation token validated?
- What if invitation is expired/used?
- How does invitation connect to registration?

### Required New Specs (User Journey)

Based on code analysis (`routes/invitations.js` - 1,049 lines):

#### 1. `invitation-acceptance.md` (User Perspective)
**Purpose**: User clicks invitation link and validates token  
**User Flow**:
1. User receives email with invitation link
2. User clicks link → redirected to `/register?token=xxx`
3. System validates HMAC token (expiry, signature)
4. If valid → show registration form pre-filled with email
5. If invalid → show error with contact admin message

**Acceptance Criteria**:
- ✅ HMAC token validation (signature + expiry)
- ✅ Pre-fill email from invitation
- ✅ Handle expired/invalid tokens gracefully
- ✅ Prevent token reuse

**Code**: `routes/invitations.js` lines 200-350

#### 2. `invitation-generation.md` (Admin Perspective - Detailed)
**Purpose**: Admin creates and sends invitations  
**User Flow**:
1. Admin navigates to invitation panel
2. Admin selects single or bulk mode
3. Admin enters email(s)
4. System generates HMAC tokens
5. System sends emails via emailService
6. Admin sees confirmation + invitation list

**Acceptance Criteria**:
- ✅ Generate cryptographically secure tokens
- ✅ Set expiry (default 7 days)
- ✅ Store invitation record in USER_INVITATIONS
- ✅ Send email with invitation link
- ✅ Bulk upload CSV support

**Code**: `routes/invitations.js` lines 400-600

#### 3. `invitation-tracking.md` (Audit & Analytics)
**Purpose**: Track invitation lifecycle and analytics  
**Features**:
- View invitation status (pending/used/expired)
- See who accepted each invitation
- Track acceptance rate
- Resend invitations
- Audit trail (who invited whom, when)

**Code**: `routes/invitations.js` lines 1-150 (getAllInvitations)

---

## Code vs Specs Alignment

### Current Misalignment

| Code Module | Lines | Current Spec Location | Proposed Spec Location |
|-------------|-------|----------------------|------------------------|
| routes/invitations.js | 1,049 | admin/invitation-management.md (52 lines) | Phase 1: Invitation System (3 specs) |
| StreamlinedRegistrationService.ts | 768 | authentication/registration.md (42 lines) | Phase 2: Registration & Family Onboarding (6 specs) |
| AgeVerificationService.ts | 486 | authentication/age-verification.md (38 lines) | Phase 2: Age Verification (detailed) |
| routes/auth.js | 1,125 | authentication/login.md + registration.md | Phase 2 (registration) + Phase 3 (login) |
| routes/family-members.js | 300 | user-management/family-member-management.md | Phase 3 (switching) + Phase 4 (editing) |

### Recommendation: Specs Should Match Code Organization

**Principle**: Each major code module should have complete spec coverage

Example for `routes/invitations.js` (1,049 lines):
- Current: 1 spec file (52 lines) - 98% under-documented
- Proposed: 3 spec files (invitation-generation, invitation-acceptance, invitation-tracking)

Example for `StreamlinedRegistrationService.ts` (768 lines):
- Current: 1 spec file (42 lines) - 95% under-documented
- Proposed: 6 spec files (registration, family-discovery, relationship-collection, age-verification, parental-consent, profile-creation)

---

## Database Schema Alignment

### Current Schema Documentation

Each functional module has `db-schema.md`:
- `authentication/db-schema.md` - Contains USER_INVITATIONS table
- `user-management/db-schema.md` - Contains FAMILY_MEMBERS, app_users

**Problem**: USER_INVITATIONS is documented in authentication/ but managed via admin/

### Proposed Schema Alignment

**Option 1** (Matches Option D - 4-Phase Model):
```
Phase 1: Invitation & Access Control
└── db-schema.md (USER_INVITATIONS)

Phase 2: Registration & Family Onboarding
└── db-schema.md (FAMILY_MEMBERS, PARENT_CONSENT_RECORDS)

Phase 3: Authentication & Identity Management
└── db-schema.md (app_users, JWT_REFRESH_TOKENS)

Phase 4: Platform Features
└── db-schema.md (all other tables)
```

**Option 2** (Keep current structure, add cross-references):
- Keep schemas where they are
- Add "Related Schemas" section with links
- Example: `admin/invitation-management.md` links to `authentication/db-schema.md#USER_INVITATIONS`

---

## E2E Test Alignment

### Current Test Organization

```
tests/e2e/
├── auth.spec.ts              (Authentication + Family flows)
├── dashboard.spec.ts         (Profile + Directory)
├── posting.spec.ts           (Postings)
├── chat.spec.ts              (Messaging)
└── ...
```

**Problem**: `auth.spec.ts` contains both authentication AND family onboarding tests

### Proposed Test Reorganization (Matches Option D)

```
tests/e2e/
├── invitations.spec.ts       (Invitation generation, acceptance, tracking)
├── registration.spec.ts      (Registration + Family onboarding + COPPA)
├── authentication.spec.ts    (Login, session, profile selection)
├── profile-management.spec.ts (Profile editing, switching, settings)
├── dashboard.spec.ts         (Directory + Dashboard)
├── posting.spec.ts           (Postings)
├── chat.spec.ts              (Messaging)
└── ...
```

---

## Comparison Matrix

| Criteria | Option A (3-Phase Chronological) | Option B (4-Phase Concerns) | Option C (3-Phase User-Centric) | Option D (4-Phase Lifecycle) |
|----------|----------------------------------|----------------------------|----------------------------------|------------------------------|
| **Clear Boundaries** | ✅ Good | ✅ Excellent | ⚠️ Medium (age verification overlap) | ✅ Excellent |
| **No Overlap** | ✅ Yes | ✅ Yes | ⚠️ No (age verification in 2 phases) | ✅ Yes |
| **Matches User Journey** | ✅ Excellent | ⚠️ Medium | ✅ Good | ✅ Good |
| **Admin Features Together** | ❌ No (invitations separated) | ❌ No (invitations separated) | ✅ Yes | ⚠️ Partial (invitations separate) |
| **COPPA Isolation** | ⚠️ Medium (embedded in onboarding) | ✅ Excellent (dedicated phase) | ⚠️ Medium | ✅ Good (Phase 2) |
| **Code Alignment** | ✅ Good | ✅ Good | ⚠️ Medium | ✅ Excellent |
| **Spec-to-Code Ratio** | ✅ Good (fewer phases) | ⚠️ Medium (4 phases) | ✅ Good (fewer phases) | ✅ Excellent (matches modules) |
| **Invitation Coverage** | ⚠️ Partial (admin separated) | ⚠️ Partial (admin separated) | ✅ Complete (with admin) | ✅ Complete (dedicated phase) |
| **Implementation Clarity** | ✅ Good | ✅ Good | ⚠️ Medium | ✅ Excellent |
| **Maintainability** | ✅ Good (3 phases) | ⚠️ Medium (4 phases) | ✅ Good (3 phases) | ✅ Good (clear separation) |

### Scoring Summary

| Option | Total Score | Strengths | Weaknesses |
|--------|-------------|-----------|------------|
| A (3-Phase Chronological) | 7/10 | Clear user journey, fewer phases | Admin features separated |
| B (4-Phase Concerns) | 7/10 | COPPA isolation, clear concerns | More phases, admin separated |
| C (3-Phase User-Centric) | 6/10 | Admin features together | Overlap issues, less clear boundaries |
| D (4-Phase Lifecycle) | 9/10 | Complete invitation coverage, code alignment, no overlap | 4 phases (manageable complexity) |

---

---

## Open Questions for Discussion

1. **Phase Naming**: Should we use "Phase 1, 2, 3, 4" or descriptive names?
   - Option 1: `phase-1-invitations/`, `phase-2-registration/`, etc.
   - Option 2: `01-invitations/`, `02-registration/`, etc.
   - Option 3: `invitations-and-access/`, `registration-and-onboarding/`, etc.

2. **Admin Features**: Should admin features be in Phase 4 or separate "admin" phase?
   - Current: Mixed in phase-4-features/admin/
   - Alternative: Create `phase-5-administration/` for all admin features

3. **Database Schemas**: One schema file per phase or keep current structure?
   - Option 1: Each phase has dedicated db-schema.md
   - Option 2: Keep schemas in feature modules, add cross-references

4. **E2E Tests**: Should we reorganize tests to match phases?
   - Option 1: Reorganize tests (breaking change)
   - Option 2: Keep current tests, update naming/comments
   - Option 3: Add new test files, deprecate old ones gradually

5. **Migration Timeline**: When to execute migration?
   - Option 1: Immediately (before Phase 2 implementation)
   - Option 2: Gradual (create new specs while keeping old ones)
   - Option 3: After current implementation work completes

---

## Next Steps

1. **Review this scout report** and select preferred option (A, B, C, or D)
2. **Decide on phase naming convention** (questions 1-2)
3. **Create missing invitation specs** (3 new specs needed regardless of option)
4. **Expand existing specs** (registration, age-verification, parental-consent under-documented)
5. **Execute migration plan** (if reorganization approved)

---

**Status**: Ready for decision and implementation  
**Dependencies**: None (can start immediately)  
**Impact**: Documentation organization only (no code changes required)

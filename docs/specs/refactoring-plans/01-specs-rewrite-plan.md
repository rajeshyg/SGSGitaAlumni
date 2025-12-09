# Phase 1: Functional Specs Rewrite Plan

**Date**: 2025-12-07  
**Status**: READY FOR EXECUTION  
**Depends On**: None  
**Duration**: 1-2 days

---

## Overview

Reorganize functional specs from 10-module flat structure to 4-phase hierarchical structure aligned with user journey.

### Current Structure (10 Modules)
```
docs/specs/functional/
├── authentication/         (7 specs)
├── user-management/        (5 specs)
├── admin/                  (6 specs)
├── directory/              (3 specs)
├── postings/               (6 specs)
├── messaging/              (4 specs)
├── dashboard/              (4 specs)
├── moderation/             (4 specs)
├── notifications/          (3 specs)
└── rating/                 (2 specs)
```

### New Structure (4 Phases)
```
docs/specs/functional/
├── phase-1-invitation-access-control/
│   ├── README.md
│   ├── db-schema.md
│   ├── invitation-generation.md
│   ├── invitation-acceptance.md
│   ├── invitation-tracking.md
│   └── invitation-expiry.md
│
├── phase-2-registration-onboarding/
│   ├── README.md
│   ├── db-schema.md
│   ├── registration.md
│   ├── alumni-discovery.md
│   ├── profile-selection.md
│   ├── yob-collection.md
│   ├── age-verification.md
│   ├── parental-consent.md
│   └── profile-creation.md
│
├── phase-3-authentication-identity/
│   ├── README.md
│   ├── db-schema.md
│   ├── login.md
│   ├── otp-verification.md
│   ├── session-management.md
│   ├── profile-switching.md
│   ├── password-management.md
│   └── account-settings.md
│
├── phase-4-platform-features/
│   ├── README.md
│   ├── directory/
│   ├── postings/
│   ├── messaging/
│   ├── dashboard/
│   ├── moderation/
│   ├── notifications/
│   ├── rating/
│   └── admin/
│
└── _archive/               (old specs moved here)
```

---

## Execution Checklist

### Step 1: Create New Directory Structure
- [ ] Create `phase-1-invitation-access-control/`
- [ ] Create `phase-2-registration-onboarding/`
- [ ] Create `phase-3-authentication-identity/`
- [ ] Create `phase-4-platform-features/`
- [ ] Create `_archive/`

### Step 2: Write Phase 1 Specs (Invitation & Access Control)

#### 2.1 `invitation-generation.md`
**Purpose**: Admin creates and sends invitations

**Content Requirements**:
- Admin UI for single invitation
- Admin UI for bulk CSV upload
- HMAC token generation (crypto-secure)
- Expiry configuration (default 7 days)
- Email sending via `emailService`
- Database: `USER_INVITATIONS` table

**Acceptance Criteria**:
```markdown
- [ ] Admin can create single invitation with email
- [ ] Admin can upload CSV for bulk invitations
- [ ] System generates unique HMAC token per invitation
- [ ] Token expiry defaults to 7 days, configurable
- [ ] Email sent with invitation link
- [ ] Invitation stored in USER_INVITATIONS with status='pending'
```

**Code References**:
- `routes/invitations.js:400-600` (createInvitation)
- `server/services/InvitationService.ts`

---

#### 2.2 `invitation-acceptance.md`
**Purpose**: User clicks invitation link and validates token

**Content Requirements**:
- User clicks link → `/register?token=xxx`
- HMAC token validation (signature + expiry)
- Pre-fill email from invitation
- Show available alumni matches
- Handle invalid/expired tokens gracefully

**Acceptance Criteria**:
```markdown
- [ ] Valid token shows registration form with pre-filled email
- [ ] Expired token shows "Invitation expired" message
- [ ] Invalid token shows "Invalid invitation" message
- [ ] Available alumni profiles displayed (from alumni_members)
- [ ] Token cannot be reused after acceptance
```

**Code References**:
- `routes/invitations.js:200-350` (validateInvitation)
- `src/services/AlumniDataIntegrationService.ts`

---

#### 2.3 `invitation-tracking.md`
**Purpose**: Admin views invitation status and analytics

**Content Requirements**:
- List all invitations with status
- Filter by status (pending/accepted/expired/revoked)
- View acceptance details (who, when)
- Resend expired invitations
- Revoke pending invitations

**Acceptance Criteria**:
```markdown
- [ ] Admin sees paginated list of all invitations
- [ ] Each invitation shows: email, status, sent_at, expires_at
- [ ] Accepted invitations show: accepted_by, accepted_at
- [ ] Admin can resend invitation (generates new token)
- [ ] Admin can revoke pending invitation
```

**Code References**:
- `routes/invitations.js:1-150` (getAllInvitations)
- `src/pages/admin/InvitationManagementPage.tsx`

---

#### 2.4 `invitation-expiry.md`
**Purpose**: Handle invitation expiration and revocation

**Content Requirements**:
- Automatic expiry after configured period
- Manual revocation by admin
- Expiry check on validation
- No cleanup job needed (check on access)

**Acceptance Criteria**:
```markdown
- [ ] Expired invitations cannot be used
- [ ] Revoked invitations cannot be used
- [ ] Expiry checked at validation time (not background job)
- [ ] Admin can see expired count in dashboard
```

---

#### 2.5 `db-schema.md` (Phase 1)
**Tables**:
- `USER_INVITATIONS` (existing, enhanced)

```sql
CREATE TABLE USER_INVITATIONS (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by CHAR(36) NOT NULL,
    invitation_type ENUM('alumni', 'admin') NOT NULL DEFAULT 'alumni',
    status ENUM('pending', 'accepted', 'expired', 'revoked') DEFAULT 'pending',
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    accepted_at TIMESTAMP NULL,
    accepted_by CHAR(36) NULL,  -- FK to accounts.id
    ip_address VARCHAR(45),
    resend_count INT DEFAULT 0,
    last_resent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_token (invitation_token),
    INDEX idx_status (status),
    INDEX idx_invited_by (invited_by)
);
```

---

### Step 3: Write Phase 2 Specs (Registration & Family Onboarding)

#### 3.1 `registration.md`
**Purpose**: Create account from invitation

**Content Requirements**:
- User creates account (email + password)
- OTP verification for email
- Account status = 'pending' until profile setup
- Single transaction for core records

**Acceptance Criteria**:
```markdown
- [ ] User enters password (min 8 chars, complexity rules)
- [ ] OTP sent to email for verification
- [ ] Account created in `accounts` table
- [ ] Account status = 'pending' (no profile yet)
- [ ] USER_INVITATIONS marked as 'accepted'
```

**Code References**:
- `routes/auth.js` (registerFromInvitation - to be refactored)
- `src/services/StreamlinedRegistrationService.ts` (to be refactored)

---

#### 3.2 `alumni-discovery.md`
**Purpose**: Show alumni records matching user's email

**Content Requirements**:
- Query `alumni_members` WHERE email = invitation.email
- Display: name, batch, center
- Show COPPA status if YOB available
- Handle multiple matches (family scenario)

**Acceptance Criteria**:
```markdown
- [ ] System queries alumni_members by email
- [ ] User sees list of matching alumni profiles
- [ ] Each profile shows: name, batch, center_name
- [ ] If YOB exists, show age and COPPA status
- [ ] Empty result: "No alumni records found for your email"
```

**Code References**:
- `src/services/AlumniDataIntegrationService.ts:fetchAllAlumniMembersByEmail`

---

#### 3.3 `profile-selection.md`
**Purpose**: User selects which profiles to claim

**Content Requirements**:
- User checks profiles they want to claim
- User specifies relationship: "This is me" or "This is my child"
- Minimum 1 selection required
- Cannot select same profile twice

**Acceptance Criteria**:
```markdown
- [ ] User can select one or more alumni profiles
- [ ] For each selection, user chooses relationship (parent/child)
- [ ] At least one profile must be selected
- [ ] "This is me" auto-assigns relationship = 'parent'
- [ ] "This is my child" assigns relationship = 'child'
```

**UI Mockup**:
```
┌─────────────────────────────────────────────┐
│ Select Your Profiles                        │
├─────────────────────────────────────────────┤
│ ☑ Rajesh Kumar (Batch 2005, Mysore)         │
│   ○ This is me  ● This is my child          │
├─────────────────────────────────────────────┤
│ ☑ Priya Kumar (Batch 2023, Mysore)          │
│   ○ This is me  ● This is my child          │
├─────────────────────────────────────────────┤
│ ☐ Arjun Kumar (Batch 2028, Mysore)          │
│   ○ This is me  ○ This is my child          │
└─────────────────────────────────────────────┘
```

---

#### 3.4 `yob-collection.md`
**Purpose**: Collect year of birth for COPPA compliance

**Content Requirements**:
- Collect YOB as 4-digit year (INT)
- Required for profiles without existing YOB
- Validate: 1900 < YOB < current_year
- Store in `alumni_members.year_of_birth`

**Acceptance Criteria**:
```markdown
- [ ] YOB input shows dropdown (1950-current_year)
- [ ] Profiles with existing YOB show read-only value
- [ ] Profiles without YOB require user input
- [ ] Invalid year rejected with error
- [ ] YOB stored as INT in alumni_members
```

**IMPORTANT**: Do NOT collect full birth date. COPPA requires minimal data.

---

#### 3.5 `age-verification.md`
**Purpose**: Calculate age and determine access level

**Content Requirements**:
- Age = current_year - year_of_birth (conservative: assume Dec 31)
- Under 14: BLOCKED (no user_profiles created)
- 14-17: REQUIRES_CONSENT (user_profiles with access_level='blocked')
- 18+: FULL ACCESS (user_profiles with access_level='full')

**Acceptance Criteria**:
```markdown
- [ ] Age calculated as: current_year - YOB
- [ ] Under 14: "Cannot create platform profile (COPPA)"
- [ ] 14-17: Profile created with requires_consent=true
- [ ] 18+: Profile created with access_level='full'
- [ ] Age displayed to user before profile creation
```

**Age Calculation Formula**:
```typescript
// Conservative: assume birthday is Dec 31 of birth year
function calculateAge(yearOfBirth: number): number {
  const currentYear = new Date().getFullYear();
  return currentYear - yearOfBirth;
}

// Access level determination
function getAccessLevel(age: number): 'blocked' | 'supervised' | 'full' {
  if (age < 14) return 'blocked';  // Cannot create profile
  if (age < 18) return 'blocked';  // Needs consent first
  return 'full';
}
```

---

#### 3.6 `parental-consent.md`
**Purpose**: Parent grants consent for children 14-17

**Content Requirements**:
- Parent (account owner) grants consent
- Consent modal with legal text
- Consent stored in `PARENT_CONSENT_RECORDS`
- `user_profiles` updated with consent fields
- Consent expires after 1 year

**Acceptance Criteria**:
```markdown
- [ ] Parent sees consent prompt for child profiles
- [ ] Consent modal shows legal text (COPPA disclosure)
- [ ] Parent clicks "I consent" to grant access
- [ ] PARENT_CONSENT_RECORDS entry created
- [ ] user_profiles.parent_consent_given = true
- [ ] user_profiles.access_level changes to 'supervised'
- [ ] Consent expires after 1 year (renewal required)
```

---

#### 3.7 `profile-creation.md`
**Purpose**: Create user_profiles records

**Content Requirements**:
- Create `user_profiles` for each selected alumni
- Link to `accounts` and `alumni_members`
- Set relationship, consent fields, access_level
- Single transaction for all profiles

**Acceptance Criteria**:
```markdown
- [ ] user_profiles created for each selected alumni (14+)
- [ ] account_id links to accounts table
- [ ] alumni_member_id links to alumni_members table
- [ ] relationship set to 'parent' or 'child'
- [ ] parent_profile_id set for children (links to parent's profile)
- [ ] access_level set based on age/consent
- [ ] All profiles created in single transaction
```

---

#### 3.8 `db-schema.md` (Phase 2)
**Tables**:
- `accounts` (new, replaces `app_users`)
- `user_profiles` (new, replaces `FAMILY_MEMBERS`)
- `alumni_members` (enhanced with YOB)
- `PARENT_CONSENT_RECORDS` (existing)

```sql
-- See database-redesign-plan.md for full schemas
```

---

### Step 4: Write Phase 3 Specs (Authentication & Identity)

#### Files to Create:
- [ ] `login.md` - Email/password login
- [ ] `otp-verification.md` - OTP flow
- [ ] `session-management.md` - JWT lifecycle
- [ ] `profile-switching.md` - Switch active profile (session-based)
- [ ] `password-management.md` - Reset/change password
- [ ] `account-settings.md` - Account preferences
- [ ] `db-schema.md` - Session/JWT tables

---

### Step 5: Write Phase 4 Specs (Platform Features)

#### Subdirectories to Create:
- [ ] `directory/` - Move existing specs
- [ ] `postings/` - Move existing specs
- [ ] `messaging/` - Move existing specs
- [ ] `dashboard/` - Move existing specs
- [ ] `moderation/` - Move existing specs
- [ ] `notifications/` - Move existing specs
- [ ] `rating/` - Move existing specs
- [ ] `admin/` - Move existing specs (except invitation-management)

---

### Step 6: Archive Old Specs

#### Files to Move to `_archive/`:
- [ ] `authentication/` folder
- [ ] `user-management/` folder
- [ ] `admin/invitation-management.md`

#### Files to DELETE (not archive):
- [ ] Any spec referencing `FAMILY_INVITATIONS`
- [ ] Any spec referencing `FAMILY_ACCESS_LOG`
- [ ] Any spec referencing `birth_date` full date collection

---

## Verification Commands

After completion, verify no references to deleted concepts:

```powershell
# Should return 0 matches in new specs
grep -r "FAMILY_INVITATIONS" docs/specs/functional/phase-*
grep -r "FAMILY_ACCESS_LOG" docs/specs/functional/phase-*
grep -r "estimated_birth_year" docs/specs/functional/phase-*
grep -r "birth_date" docs/specs/functional/phase-*  # Except db-schema.md migration notes
grep -r "relationship.*self" docs/specs/functional/phase-*
grep -r "app_users" docs/specs/functional/phase-*
```

---

## Deliverables

| Deliverable | Location | Status |
|-------------|----------|--------|
| Phase 1 specs (4 files) | `phase-1-invitation-access-control/` | ☐ |
| Phase 2 specs (7 files) | `phase-2-registration-onboarding/` | ☐ |
| Phase 3 specs (6 files) | `phase-3-authentication-identity/` | ☐ |
| Phase 4 specs (8 subdirs) | `phase-4-platform-features/` | ☐ |
| Archived old specs | `_archive/` | ☐ |
| Updated README.md | `docs/specs/functional/README.md` | ☐ |

---

## Next Phase

After completing Phase 1 (Specs Rewrite):
→ Proceed to [02-database-migration-plan.md](./02-database-migration-plan.md)

# Scout Report 07 - Invitation Management

**Date**: 2025-12-07  
**Type**: Implementation Context  
**Status**: Active Scout Document  
**Purpose**: Analyze current invitation management implementation, flows, data structures, and integration points for alumni registration

---

## Context & Reference

See: `docs/context-bundles/implementation-context-family-onboarding-coppa.md` for overall onboarding flow and database schema.

---

## Files Discovered

### Invitation Implementation
- `routes/invitations.js` (1,049 lines) - Admin and user invitation endpoints
- `src/services/InvitationService.ts` - Invitation business logic
- `src/components/auth/RegistrationPage.tsx` - User-facing registration with token validation

### Database & Configuration
- `docs/specs/functional/authentication/db-schema.md` - USER_INVITATIONS table schema
- `docs/specs/functional/authentication/invitation-management.md` - Invitation specifications

### Related Integration Points
- `routes/auth.js` (1,125 lines) - Registration flow consuming invitations
- `src/services/StreamlinedRegistrationService.ts` (768 lines) - Uses invitation during user creation
- `middleware/auth.js` - Token validation

---

## Current Invitation Architecture

### USER_INVITATIONS Table Schema

```sql
USER_INVITATIONS
├─ id (VARCHAR PK)                    -- Unique identifier
├─ email (VARCHAR, INDEX)             -- Target email address
├─ invitation_token (VARCHAR, UNIQUE) -- Random token sent in URL
├─ invitation_type (ENUM)             -- 'alumni' | 'family_member' | 'admin'
├─ status (ENUM)                      -- 'pending' | 'used' | 'expired' | 'revoked'
├─ invited_by (FK → app_users)        -- Admin who created invitation
├─ accepted_by (FK → app_users, NULL) -- User who accepted (NULL if pending)
├─ alumni_member_id (FK → alumni_members, NULL) -- Which alumni profile (optional)
├─ created_at (TIMESTAMP)             -- When invitation generated
├─ expires_at (TIMESTAMP)             -- When invitation becomes invalid
├─ used_at (TIMESTAMP, NULL)          -- When user registered with token
├─ notes (TEXT)                       -- Admin notes (bulk upload tracking, etc.)
└─ UNIQUE (email, status, invitation_type) -- Prevent duplicate pending invitations
```

**Key Design**: Single invitation_token uniquely identifies the invitation; email is indexed for lookup.

---

## Invitation Lifecycle

### 1. GENERATION PHASE (Admin)

**Single Invitation Flow**:
```
Admin fills form
  ├─ Email: alumni@example.com
  ├─ Type: alumni | family_member | admin
  └─ Optional: Batch ID, notes
    ↓
Generate invitation_token (random UUID)
    ↓
INSERT into USER_INVITATIONS
  ├─ status = 'pending'
  ├─ expires_at = NOW() + 90 days (configurable)
  └─ invited_by = current_admin_id
    ↓
Send email with registration link
  └─ URL format: /register?token={invitation_token}
    ↓
Return to admin: "Invitation sent"
```

**Bulk Invitation Flow**:
```
Admin uploads CSV file
  ├─ Columns: email, name, invitation_type, batch_id
  └─ Validation: Email format, unique per batch
    ↓
For each row:
  ├─ Check if invitation already exists for this email/type
  ├─ If exists and pending: Skip (prevent duplicates)
  ├─ If exists and used: Create new (new registration attempt)
  └─ If new: Generate token and insert
    ↓
Generate bulk report
  ├─ Total rows processed
  ├─ Invitations created
  ├─ Skipped (duplicates)
  └─ Failed (validation errors)
    ↓
Send bulk emails
    ↓
Return report to admin
```

**Issues with Current Implementation**:
- No deduplication logic: Multiple invitations can be created for same email in bulk upload
- No batch tracking: Related invitations not linked together
- No duplicate detection: Admin can re-upload same CSV, creating duplicate invitations
- Expiration config: Hardcoded in code, not configurable via admin UI

---

### 2. TRANSMISSION PHASE (Email Service)

**Email Template Content**:
```
Subject: "Join SGS Gita Alumni Community"

Body:
"Click here to register: https://alumni.app/register?token={invitation_token}
This link expires in 90 days.
Questions? Contact support@example.com"
```

**Tracking**:
- Email delivery logged in EMAIL_DELIVERY_LOG
- Bounce handling: (Current approach unclear - no bounce processing code found)
- Resend capability: Admin can resend invitation to same email

---

### 3. VALIDATION PHASE (User Registration)

**Token Validation Flow**:
```
User clicks link from email
  └─ URL: /register?token={XXXXX}
    ↓
Frontend calls: GET /api/auth/validate-invitation?token={XXXXX}
    ↓
Backend checks:
  ├─ Does invitation exist? → 404 if not
  ├─ Is status = 'pending'? → 410 Gone if 'used', 'revoked'
  ├─ Is expires_at > NOW()? → 410 Gone if expired
  └─ Return: { email, invitation_type, valid: true }
    ↓
Frontend displays registration form (email field pre-filled)
    ↓
User enters: name, password, phone, etc.
```

**Error Responses**:
```
404: Invitation not found
410: Invitation expired or already used
400: Invalid token format
```

**Current Issues**:
- No UI feedback on WHY token is invalid (expired vs used vs not found)
- No "resend invitation" button from error page
- No rate limiting on validation attempts (possible token enumeration)

---

### 4. ACCEPTANCE PHASE (Registration Completion)

**POST /api/auth/register Flow**:
```
User submits registration form + invitation token
    ↓
Backend validation:
  ├─ Email matches invitation.email? → Reject if mismatch
  ├─ Invitation still valid? → Re-check status/expiration
  └─ Email not already registered? → Reject if duplicate account
    ↓
Create app_users account
    ↓
Update USER_INVITATIONS:
  ├─ status = 'used'
  ├─ accepted_by = new_user_id
  └─ used_at = NOW()
    ↓
Auto-import family members (currently triggered here)
    ↓
Return: auth token + user data
```

**Key Point**: Invitation status changed to 'used' ONLY after successful account creation (in transaction).

---

## Invitation Status State Machine

```
┌─────────────┐
│   PENDING   │  Invitation created, awaiting user registration
└──────┬──────┘
       │
       ├─→ (user registers with token)
       │   ├─ Email doesn't match? → REJECTED (stays PENDING)
       │   └─ Email matches, account created → USED
       │
       ├─→ (admin revokes) → REVOKED
       │
       └─→ (expires_at < NOW()) → EXPIRED
          (status not auto-updated; determined at validation time)

┌───────────┐  
│   USED    │  User registered successfully; invitation consumed
└───────────┘  

┌─────────────┐
│  REVOKED    │  Admin manually revoked; invitation not usable
└─────────────┘

┌─────────────┐
│  EXPIRED    │  Expiration date passed; invitation not usable
└─────────────┘
```

**Key Design Issue**: Expired/Revoked status determined at validation, not via background job. Invitation record still exists with old status until checked.

---

## Integration Points

### 1. Registration Flow (StreamlinedRegistrationService.ts)

**Current Integration**:
```typescript
// At registration completion:
const invitation = await getInvitationByToken(token);

// After successful user creation:
await markInvitationAsUsed(invitation.id, user.id);

// Then trigger auto-import:
const alumniProfiles = await fetchAllAlumniByEmail(invitation.email);
for (const profile of alumniProfiles) {
  createFamilyMember(user.id, profile);  // Currently auto-imports ALL
}
```

**Coupling Issue**: Registration logic depends on invitation.email for alumni matching. If invitation.email differs from registration form email, matching may fail.

### 2. Alumni Matching (AlumniDataIntegrationService.ts)

**Current Logic**:
```sql
SELECT * FROM alumni_members 
WHERE email = ? 
ORDER BY batch DESC
```

**Observation**: Uses invitation.email to find matching alumni. No validation that matched alumni corresponds to the inviting admin's intent.

**Example Issue**:
```
Scenario: Admin creates invitation for "john@example.com" 
(expecting John Doe, batch 2020)

But "john@example.com" has 3 alumni records:
├─ John Doe, batch 2020
├─ John Smith, batch 2018 (same email, different person!)
└─ John Davis, batch 2016

System auto-imports ALL THREE → User gets wrong profiles
```

### 3. Family Member Creation

**Current Logic**: Uses invitation.alumni_member_id (if set during invitation creation)

**Issue**: Invitation creation form doesn't require selecting specific alumni; admin just specifies email.

---

## Identified Data Flows

### Admin-Initiated Invitation
```
Admin dashboard
  └─ Generate invitation for: john@alumni.example.com
      ├─ Type: alumni
      ├─ Expires: 90 days
      └─ Notes: "Batch 2020, Engineering"
        ↓
Email sent: https://alumni.app/register?token=XYZ123
        ↓
John receives email
        ↓
Clicks link → Validation endpoint checks token
        ↓
Registration page displays (email pre-filled)
        ↓
John enters: name, password, phone, year_of_birth
        ↓
Backend: Create account + mark invitation used + auto-import alumni
        ↓
Redirect to profile selection / family setup
```

### Bulk Invitation Upload
```
Admin dashboard
  └─ Upload CSV: emails, names, type
      ├─ Validation: Check format, duplicates
      ├─ Generate invitations for each row
      └─ Send bulk emails
        ↓
Each user receives personalized email with unique token
        ↓
[Same as above for each user]
```

---

## Current Limitations & Gaps

### 1. No Batch Tracking
- Multiple invitations generated in bulk upload not linked
- Admin can't see: "Which invitations were from this batch upload?"
- Difficult to track campaign performance or resend specific batches

### 2. Limited Invitation Metadata
- No campaign/batch identifier
- No invitation source tracking (single vs bulk)
- No custom fields for admin notes or grouping

### 3. Status Determination
- EXPIRED/REVOKED determined at validation time, not stored
- No background job to mark expired invitations
- Invitations marked as 'pending' stay that way forever if not used

### 4. Email Delivery Reliability
- No bounce handling
- No verification that email was sent successfully before responding to admin
- Resend feature exists but no tracking of how many times resent

### 5. Duplicate Prevention
- Weak uniqueness constraint: (email, status, invitation_type)
- Allows multiple pending invitations for same email if status differs
- Bulk upload can create duplicates if uploaded twice

### 6. Token Security
- No rate limiting on validation attempts
- No CAPTCHA on registration page (potential bot attacks)
- No tracking of failed validation attempts

### 7. User Experience
- Error messages don't distinguish: expired vs used vs not found
- No "resend invitation" button on error pages
- Email pre-fill on registration from invitation, but no read-only enforcement

---

## Invitation-Registration Dependency

**Critical Coupling**:
```
Registration requires valid invitation token
  ├─ Can't self-register (open signup disabled)
  ├─ Email must match invitation email
  └─ Invitation limits registration to admin-approved alumni only

However:
  ├─ Invitation doesn't specify WHICH alumni profile user is claiming
  ├─ System auto-imports ALL alumni with matching email
  └─ User has no selection capability (bypassed)
```

**Implication**: Invitation mechanism enforces "admin approval to register" but doesn't enforce "admin approval of specific alumni profiles."

---

## Data Quality Observations

### Invitation-to-Alumni Matching
- Alumni can share email addresses (families, forwarding, etc.)
- Invitation created with email only, no alumni_member_id specified
- During registration, auto-import uses email to fetch ALL alumni
- No way for admin to specify: "This invitation is for John from batch 2020, not John from batch 2018"

### Invitation Validation
- Email format validated at creation
- Duplicate email check: Only within status + type (weak)
- Alumni email match: Case-insensitive (case normalization happens at registration)

---

## Potential Use Cases (Not Currently Fully Addressed)

1. **Re-inviting Expired Invitations**: User missed registration window; admin wants to send new invitation
   - Current: Manual process; no bulk "re-invite expired" feature

2. **Invitation Chains**: Registered user invites family members
   - Current: Not supported; only admin can generate invitations

3. **Invitation Analytics**: Admin wants to see registration rate, bounce rate, etc.
   - Current: No admin dashboard for invitation metrics

4. **Conditional Invitations**: Different expiration, T&C version, etc. for different user types
   - Current: Single expiration and T&C version for all invitations

5. **Invitation Verification**: Ensure invited person actually used the invitation (not shared token)
   - Current: No way to distinguish; same token can be used once, but no audit trail per usage attempt

---

**Scout Status**: Active - findings documented for architectural reference
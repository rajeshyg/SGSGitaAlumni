# Scout Report 6: Unified Screen Design

**Date**: 2025-12-07  
**Purpose**: Map current UI screens for registration, profile selection, COPPA verification; identify consolidation opportunities

---

## Executive Summary

**Current State**: Three separate screens handling related concerns
1. Registration flow screens (ProfileSelectionPage.tsx)
2. Family settings/profile management (FamilySettingsPage.tsx)
3. Age/COPPA verification (ParentConsentModal.tsx)

**Screens to Analyze**:
- ProfileSelectionPage.tsx - Profile switching UI
- FamilySettingsPage.tsx - Family member management
- ParentConsentModal.tsx - Consent collection
- YearOfBirthModal.tsx (if exists) - Age verification
- Registration flow components

**State Management**: Multiple useState hooks, form validation scattered, no centralized onboarding state

---

## Files Discovered

### UI Components
- `src/pages/ProfileSelectionPage.tsx` - Profile selection/switching
- `src/pages/FamilySettingsPage.tsx` - Family settings and management
- `src/components/family/ParentConsentModal.tsx` (271 lines) - Consent modal
- `src/components/family/ParentDashboard.tsx` - Parent view dashboard
- `src/components/family/FamilyMemberCard.tsx` - Family member card component

### Pages/Flows
- `src/pages/FamilySetupPage.tsx` - Family setup page
- `src/pages/RegistrationPage.tsx` (if exists) - Main registration page

### Services (Used by UI)
- `src/services/familyMemberService.ts` - API calls for family operations
- `src/services/AgeVerificationService.ts` - Age verification logic
- `src/services/StreamlinedRegistrationService.ts` - Registration orchestration

### Types & Validation
- `src/types/invitation.ts` - Invitation types
- `src/schemas/` - Validation schemas

---

## Screen-by-Screen Analysis

### Screen 1: ProfileSelectionPage.tsx

**Purpose**: Allow users to select/switch between family member profiles

**Current Functionality**:
- Lists all FAMILY_MEMBERS for current user
- Shows: Name, relationship, age, access_level, consent status
- Actions: Select/switch to profile, view details
- Shows: Badge for "Requires Consent"

**Current State Management**:
```typescript
const [selectedProfile, setSelectedProfile] = useState<FamilyMember | null>(null);
const [loading, setLoading] = useState(false);
const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
```

**Current Validation**:
- Check: is_primary_contact (can always switch to primary)
- Check: access_level (supervised profiles need consent)
- Check: requires_parent_consent && !parent_consent_given (show warning)

**Issues**:
- Only shows profiles that already exist
- No "add new profile" option
- No COPPA flow integration
- No relationship selection UI

---

### Screen 2: FamilySettingsPage.tsx

**Purpose**: Manage family member profiles, grant/revoke consent

**Current Functionality**:
- List all family members with details
- For each: Show age, relationship, access level, consent status
- Actions: Grant consent, revoke consent, edit birth date, view consent history
- Warning: "COPPA Compliance Notice" if members under supervision

**Current State Management**:
```typescript
const [members, setMembers] = useState<FamilyMember[]>([]);
const [loading, setLoading] = useState(false);
const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
const [showConsentModal, setShowConsentModal] = useState(false);
const [editingBirthDate, setEditingBirthDate] = useState<string | null>(null);
```

**Current Actions**:
1. Grant Consent: Opens ParentConsentModal
2. Revoke Consent: Button click → API call → Update state
3. Edit Birth Date: POST /:id/birth-date → Update in FAMILY_MEMBERS
4. View History: GET /:id/consent-history → Show audit log

**Issues**:
- No profile creation flow
- No YOB collection (only edit birth_date)
- Birth date edit requires modal (not shown in this file)
- No relationship editing (assumed static)

---

### Screen 3: ParentConsentModal.tsx

**Purpose**: Collect parental consent for minors 14-17

**Current Functionality**:
- Shows: Child's name, age, graduation year
- Checkboxes: Accept terms, Acknowledge COPPA
- Optional: Digital signature field
- Actions: Grant consent, cancel

**Current State**:
```typescript
const [consentData, setConsentData] = useState({
  termsAccepted: false,
  coppaAcknowledged: false,
  digitalSignature: ''
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [success, setSuccess] = useState(false);
```

**Current Validation**:
- Check: termsAccepted required
- Check: coppaAcknowledged required
- Optional: digitalSignature validation

**API Call**:
```typescript
const updatedMember = await grantConsent(member.id, {
  digitalSignature: consentData.digitalSignature || null,
  termsAccepted: consentData.termsAccepted,
  termsVersion: '1.0'
});
```

**Issues**:
- No parent email collection/verification
- No email sent to parent (auto-approval by account owner)
- Digital signature optional but not enforced
- No timeout or expiration handling in UI

---

### Screen 4: FamilySetupPage.tsx

**Purpose**: Initial family setup during account creation

**Current Functionality**:
- Shows: Available family members
- Note: "Children under 14 cannot access platform"
- Displays: Birth date requirements
- Status: Partial implementation

**Current State**:
```typescript
const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
const [loading, setLoading] = useState(false);
```

**Issues**:
- Unclear where this fits in onboarding
- No profile selection
- No YOB collection
- No consent workflow

---

## Current State Management Pattern

### Scattered State Across Components

```typescript
// ProfileSelectionPage.tsx
const [selectedProfile, setSelectedProfile] = useState<FamilyMember | null>(null);
const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

// FamilySettingsPage.tsx
const [members, setMembers] = useState<FamilyMember[]>([]);
const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
const [showConsentModal, setShowConsentModal] = useState(false);

// ParentConsentModal.tsx
const [consentData, setConsentData] = useState({...});

// FamilySetupPage.tsx
const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
```

**Problems**:
- No centralized context
- Family member list loaded multiple times
- No shared state between registration → COPPA → Family setup
- No orchestration of multi-step flow

---

## Current Form Validation

### Validation Scattered

```typescript
// In ParentConsentModal.tsx
if (!consentData.termsAccepted) {
  setError('You must accept the Terms of Service');
  return;
}

// In FamilySettingsPage.tsx
if (!member.requires_parent_consent) {
  // Don't show consent button
}

// In FamilySetupPage.tsx
const [birthDate, setBirthDate] = useState('');
// No validation shown
```

**Issues**:
- No validation schemas (or schemas not used in these components)
- No centralized error handling
- No field-level validation feedback
- No form state persistence

---

## Current API Integration

### Multiple Independent Calls

```typescript
// Load family members
const response = await familyMemberService.getFamilyMembers();

// Grant consent
const updated = await familyMemberService.grantConsent(memberId, data);

// Edit birth date
await familyMemberService.updateBirthDate(memberId, dateString);

// View consent history
const history = await familyMemberService.getConsentHistory(memberId);

// Check consent status
const status = await familyMemberService.checkConsentStatus(memberId);
```

**Issues**:
- No transaction/atomic operations
- No error recovery
- No optimistic updates
- No cache invalidation strategy

---

## Data Structures Used in UI

### FamilyMember Type (from services)

```typescript
interface FamilyMember {
  id: string;
  parent_user_id: string;
  alumni_member_id?: number;
  first_name: string;
  last_name: string;
  display_name?: string;
  bio?: string;
  profile_image_url?: string;
  phone?: string;
  birth_date?: string;
  current_age?: number;
  can_access_platform: boolean;
  requires_parent_consent: boolean;
  parent_consent_given: boolean;
  parent_consent_date?: string;
  access_level: 'full' | 'supervised' | 'blocked';
  relationship: 'self' | 'child' | 'spouse' | 'sibling' | 'guardian';
  is_primary_contact: boolean;
  status: 'active' | 'inactive' | 'suspended' | 'pending_consent';
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}
```

**UI Usage**:
- ProfileSelectionPage: Displays all fields in list
- FamilySettingsPage: Displays + allows edit of some fields
- ParentConsentModal: Uses name, age, relationship only

---

## Registration Flow Components

### Invitation Validation
- GET /invitations/validate?token=xxx
- Shows: Invitation details, available alumni
- Next: User action (select, provide data, etc.)

### Current Form Elements
- Email input (pre-filled from invitation)
- Password field
- Terms checkbox
- OTP verification (if required)

**Missing**:
- Profile selection
- YOB collection
- Relationship selection
- Parent email input
- COPPA agreement

---

## Issues Identified

### Issue 1: No Unified Onboarding State
- Registration state separate from COPPA state
- COPPA state separate from Family setup state
- No context layer to share state

### Issue 2: No Profile Selection During Registration
- User doesn't see available alumni during signup
- Auto-import happens without user seeing options
- No relationship selection

### Issue 3: YOB Collection Missing
- Birth date field exists in FamilySettingsPage for editing only
- No YOB collection during onboarding
- No YOB validation UI

### Issue 4: Parent Email Collection Missing
- ParentConsentModal doesn't collect parent email
- No email verification to parent
- Consent is auto-approved by account owner

### Issue 5: COPPA Flow Disconnected
- COPPA verification in services only
- UI doesn't orchestrate COPPA flow
- Age requirements shown but not collected

### Issue 6: No Multi-Step Form
- Each screen independent
- No form state persistence across pages
- No progress indication

### Issue 7: Validation Scattered
- No centralized validation schemas
- No field-level error messages
- No form-wide error recovery

---

## Current Screen Flows

### Current Registration Flow (Incomplete)
```
1. Invitation Link
   ↓
2. Registration Form (email, password, OTP)
   ↓
3. Auto-Import (happens in background)
   ↓
4. Account Created
   ↓
5. Login (with auto-granted access if age 18+)
   ↓ (if age 14-17)
6. Prompt: Grant Consent
   ↓
7. ProfileSelectionPage or Dashboard
```

### Current Family Settings Flow
```
1. FamilySettingsPage
   ↓
2. Select member
   ↓
3. Grant/Revoke Consent (if applicable)
   ↓
4. Edit birth date (if available)
   ↓
5. View consent history
```

### Current Profile Selection Flow
```
1. ProfileSelectionPage
   ↓
2. Select profile
   ↓
3. Switch active profile
   ↓
4. Access platform as selected profile
```

---

## Component Tree (Current)

```
App
├─ RegistrationPage
│  ├─ InvitationForm
│  ├─ RegistrationForm
│  └─ OTPVerification
│
├─ ProfileSelectionPage
│  ├─ FamilyMemberList
│  │  └─ FamilyMemberCard[] (for each member)
│  └─ SwitchButton
│
├─ FamilySettingsPage
│  ├─ FamilyMemberList
│  │  └─ FamilyMemberCard[] (for each member)
│  ├─ ConsentSection
│  │  └─ ParentConsentModal (conditional)
│  └─ BirthDateEditor
│
├─ FamilySetupPage
│  ├─ FamilyMemberDisplay
│  └─ SetupForm
│
└─ ParentDashboard
   ├─ FamilyMemberCard[]
   └─ ConsentActions
```

---

## Related Services Used

### familyMemberService.ts
```typescript
async getFamilyMembers(userId?: string): Promise<FamilyMember[]>
async getFamilyMember(id: string): Promise<FamilyMember>
async createFamilyMember(data: FamilyMemberCreateData): Promise<FamilyMember>
async updateFamilyMember(id: string, data: Partial<FamilyMember>): Promise<FamilyMember>
async switchFamilyMember(id: string): Promise<FamilyMember>
async grantConsent(id: string, data: ConsentData): Promise<FamilyMember>
async revokeConsent(id: string, reason: string): Promise<FamilyMember>
async getConsentHistory(id: string): Promise<ConsentRecord[]>
async checkConsentStatus(id: string): Promise<ConsentStatus>
async updateBirthDate(id: string, birthDate: string): Promise<FamilyMember>
```

### AgeVerificationService.ts
```typescript
async verifyAge(birthDate: Date): Promise<AgeVerificationResult>
async collectParentConsent(parentEmail: string, childData: UserRegistrationData): Promise<ParentConsentRecord>
async validateParentConsent(consentToken: string): Promise<boolean>
async renewParentConsent(consentId: string): Promise<ParentConsentRecord>
```

---

## Referenced Files

### Pages/Components
- `src/pages/ProfileSelectionPage.tsx`
- `src/pages/FamilySettingsPage.tsx`
- `src/pages/FamilySetupPage.tsx`
- `src/components/family/ParentConsentModal.tsx`
- `src/components/family/ParentDashboard.tsx`
- `src/components/family/FamilyMemberCard.tsx`

### Services
- `src/services/familyMemberService.ts`
- `src/services/AgeVerificationService.ts`
- `src/services/StreamlinedRegistrationService.ts`

### Types
- `src/types/invitation.ts`
- `src/schemas/` (validation schemas directory)

### Database/API
- `docs/specs/functional/user-management/db-schema.md`
- `routes/family-members.js`
- `routes/auth.js`

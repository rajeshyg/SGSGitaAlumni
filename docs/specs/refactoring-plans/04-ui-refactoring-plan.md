# Phase 4: UI Refactoring Plan

**Date**: 2025-12-07  
**Status**: ✅ COMPLETE (Updated 2025-12-08)  
**Depends On**: Phase 3 (API Refactoring)  
**Duration**: 2-3 days

---

## Overview

Refactor frontend components, services, and types to match new API structure and database schema.

---

## Key Design Decision: Session-Based Onboarding

**IMPORTANT**: The onboarding flow uses the logged-in user's session, NOT invitation tokens.

### Flow:
1. User accepts invitation → registers → verifies OTP → account is active
2. User is now **logged in** with a valid session
3. Onboarding page calls `GET /api/onboarding/my-alumni` using session email
4. Backend queries `alumni_members WHERE email = <session.email>`
5. User claims profiles → enters YOB (inline 4-digit input) → grants consent if needed

### Why No Token?
- After registration + OTP verification, the user is authenticated
- The user's email is known from `req.session.email`
- No need to re-validate identity with a token
- Token was only for: invitation acceptance → registration

---

## File Impact Summary

### Files to MODIFY (Heavy Changes)

| File | Changes |
|------|---------|
| `src/services/APIService.ts` | ✅ Added `getMyAlumni()` method |
| `src/services/familyMemberService.ts` | Update to user_profiles |
| `src/types/*.ts` | Update interfaces |
| `src/pages/onboarding/OnboardingPage.tsx` | ✅ Rewritten for session-based flow |

### New Backend Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/onboarding/my-alumni` | ✅ Returns alumni matching logged-in user's email |

---

## Execution Steps

### Step 1: Update Types

#### 1.1 Create `src/types/accounts.ts`

```typescript
// src/types/accounts.ts - NEW FILE

export interface Account {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'pending' | 'active' | 'suspended';
  emailVerified: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  accountId: string;
  alumniMemberId: number;
  relationship: 'parent' | 'child';
  parentProfileId: string | null;
  
  // From alumni_members (joined)
  firstName: string;
  lastName: string;
  batch: number;
  centerName: string;
  yearOfBirth: number | null;
  
  // Profile customization
  displayName: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  currentPosition: string | null;
  company: string | null;
  location: string | null;
  
  // COPPA
  requiresConsent: boolean;
  parentConsentGiven: boolean;
  parentConsentDate: string | null;
  consentExpiresAt: string | null;
  
  // Access
  accessLevel: 'full' | 'supervised' | 'blocked';
  status: 'active' | 'pending_consent' | 'suspended';
}

export interface SessionState {
  accountId: string;
  email: string;
  profiles: UserProfile[];
  activeProfileId: string | null;
}
```

- [ ] `accounts.ts` created

#### 1.2 Create `src/types/onboarding.ts`

```typescript
// src/types/onboarding.ts - NEW FILE

export interface AlumniMatch {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  batch: number;
  centerName: string;
  yearOfBirth: number | null;
  age: number | null;
  coppaStatus: 'blocked' | 'requires_consent' | 'full_access' | 'unknown';
  canCreateProfile: boolean;
}

export interface ProfileSelection {
  alumniMemberId: number;
  relationship: 'parent' | 'child';
  yearOfBirth?: number;
}

export interface OnboardingState {
  step: 'select_profiles' | 'collect_yob' | 'consent' | 'complete';
  alumniMatches: AlumniMatch[];
  selections: ProfileSelection[];
  profilesNeedingYob: AlumniMatch[];
  profilesNeedingConsent: UserProfile[];
}
```

- [ ] `onboarding.ts` created

#### 1.3 Update `src/types/index.ts`

```typescript
// Add exports
export * from './accounts';
export * from './onboarding';

// DEPRECATE/REMOVE
// export interface FamilyMember { ... } // Old type
```

- [ ] Types exported

---

### Step 2: Update `src/services/APIService.ts`

#### 2.1 Remove deprecated methods

**DELETE these methods**:
```typescript
// DELETE
createFamilyInvitation: async (...) => { ... }
getFamilyInvitations: async (...) => { ... }
acceptFamilyInvitationProfile: async (...) => { ... }
registerFromFamilyInvitation: async (...) => { ... }
```

#### 2.2 Add new onboarding methods

```typescript
// ADD to APIService

// Onboarding
validateInvitation: async (token: string): Promise<{
  valid: boolean;
  invitation: { id: string; email: string; expiresAt: string };
  alumni: AlumniMatch[];
}> => {
  const response = await apiClient.get(`/api/invitations/validate?token=${token}`);
  return response.data;
},

selectProfiles: async (selections: ProfileSelection[]): Promise<{
  success: boolean;
  profiles: UserProfile[];
  requiresConsent: boolean;
}> => {
  const response = await apiClient.post('/api/onboarding/select-profiles', { selections });
  return response.data;
},

collectYob: async (alumniMemberId: number, yearOfBirth: number): Promise<{
  success: boolean;
  age: number;
  coppaStatus: string;
}> => {
  const response = await apiClient.post('/api/onboarding/collect-yob', {
    alumniMemberId,
    yearOfBirth
  });
  return response.data;
},

grantConsent: async (childProfileId: string): Promise<{
  success: boolean;
  expiresAt: string;
}> => {
  const response = await apiClient.post('/api/onboarding/grant-consent', {
    childProfileId
  });
  return response.data;
},
```

#### 2.3 Update profile methods

```typescript
// UPDATE
getProfiles: async (): Promise<UserProfile[]> => {
  const response = await apiClient.get('/api/family-members');
  return response.data;
},

switchProfile: async (profileId: string): Promise<{
  success: boolean;
  activeProfile: UserProfile;
}> => {
  const response = await apiClient.post(`/api/family-members/${profileId}/switch`);
  return response.data;
},
```

- [ ] Deprecated methods removed
- [ ] New onboarding methods added
- [ ] Profile methods updated

---

### Step 3: Update `src/services/familyMemberService.ts`

**Complete rewrite**:
```typescript
// src/services/familyMemberService.ts - REWRITE

import { apiService } from './APIService';
import type { UserProfile } from '../types/accounts';

export async function getProfiles(): Promise<UserProfile[]> {
  return apiService.getProfiles();
}

export async function switchProfile(profileId: string): Promise<UserProfile> {
  const result = await apiService.switchProfile(profileId);
  return result.activeProfile;
}

export async function grantConsent(childProfileId: string): Promise<void> {
  await apiService.grantConsent(childProfileId);
}

export async function revokeConsent(childProfileId: string): Promise<void> {
  await apiService.revokeConsent(childProfileId);
}

// REMOVE these functions - deprecated
// export function createFamilyMember() { ... }
// export function updateBirthDate() { ... }  // Full date - deprecated
```

- [ ] Service rewritten
- [ ] Deprecated functions removed

---

### Step 4: Create Onboarding Components

#### 4.1 Create `src/pages/OnboardingPage.tsx`

```tsx
// src/pages/OnboardingPage.tsx - NEW FILE

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/APIService';
import { AlumniSelector } from '../components/onboarding/AlumniSelector';
import { YOBCollector } from '../components/onboarding/YOBCollector';
import { ConsentStep } from '../components/onboarding/ConsentStep';
import type { AlumniMatch, ProfileSelection, OnboardingState } from '../types/onboarding';

export function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [state, setState] = useState<OnboardingState>({
    step: 'select_profiles',
    alumniMatches: [],
    selections: [],
    profilesNeedingYob: [],
    profilesNeedingConsent: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load alumni matches on mount
  useEffect(() => {
    async function loadAlumni() {
      if (!token) {
        setError('Invalid invitation link');
        return;
      }
      
      try {
        const result = await apiService.validateInvitation(token);
        if (!result.valid) {
          setError('Invitation expired or invalid');
          return;
        }
        
        setState(prev => ({
          ...prev,
          alumniMatches: result.alumni
        }));
      } catch (err) {
        setError('Failed to load invitation');
      } finally {
        setLoading(false);
      }
    }
    
    loadAlumni();
  }, [token]);
  
  // Handle profile selection
  const handleSelectionComplete = async (selections: ProfileSelection[]) => {
    // Check if any need YOB
    const needYob = state.alumniMatches.filter(
      a => selections.some(s => s.alumniMemberId === a.id) && a.yearOfBirth === null
    );
    
    if (needYob.length > 0) {
      setState(prev => ({
        ...prev,
        step: 'collect_yob',
        selections,
        profilesNeedingYob: needYob
      }));
    } else {
      await createProfiles(selections);
    }
  };
  
  // Handle YOB collection complete
  const handleYobComplete = async (updatedSelections: ProfileSelection[]) => {
    await createProfiles(updatedSelections);
  };
  
  // Create profiles
  const createProfiles = async (selections: ProfileSelection[]) => {
    try {
      setLoading(true);
      const result = await apiService.selectProfiles(selections);
      
      if (result.requiresConsent) {
        setState(prev => ({
          ...prev,
          step: 'consent',
          profilesNeedingConsent: result.profiles.filter(p => p.requiresConsent)
        }));
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Failed to create profiles');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle consent complete
  const handleConsentComplete = () => {
    navigate('/dashboard');
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  
  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        {/* Progress indicator */}
        <div className="progress-steps">
          <div className={`step ${state.step === 'select_profiles' ? 'active' : ''}`}>
            1. Select Profiles
          </div>
          <div className={`step ${state.step === 'collect_yob' ? 'active' : ''}`}>
            2. Verify Age
          </div>
          <div className={`step ${state.step === 'consent' ? 'active' : ''}`}>
            3. Consent
          </div>
        </div>
        
        {/* Step content */}
        {state.step === 'select_profiles' && (
          <AlumniSelector
            alumni={state.alumniMatches}
            onComplete={handleSelectionComplete}
          />
        )}
        
        {state.step === 'collect_yob' && (
          <YOBCollector
            profiles={state.profilesNeedingYob}
            selections={state.selections}
            onComplete={handleYobComplete}
          />
        )}
        
        {state.step === 'consent' && (
          <ConsentStep
            profiles={state.profilesNeedingConsent}
            onComplete={handleConsentComplete}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] `OnboardingPage.tsx` created

#### 4.2 Create `src/components/onboarding/AlumniSelector.tsx`

```tsx
// src/components/onboarding/AlumniSelector.tsx - NEW FILE

import React, { useState } from 'react';
import type { AlumniMatch, ProfileSelection } from '../../types/onboarding';

interface Props {
  alumni: AlumniMatch[];
  onComplete: (selections: ProfileSelection[]) => void;
}

export function AlumniSelector({ alumni, onComplete }: Props) {
  const [selections, setSelections] = useState<Map<number, ProfileSelection>>(new Map());
  
  const toggleSelection = (alumniId: number, relationship: 'parent' | 'child') => {
    const newSelections = new Map(selections);
    
    if (newSelections.has(alumniId)) {
      // Update relationship or remove
      const existing = newSelections.get(alumniId)!;
      if (existing.relationship === relationship) {
        newSelections.delete(alumniId);
      } else {
        newSelections.set(alumniId, { ...existing, relationship });
      }
    } else {
      newSelections.set(alumniId, { alumniMemberId: alumniId, relationship });
    }
    
    setSelections(newSelections);
  };
  
  const handleSubmit = () => {
    if (selections.size === 0) {
      alert('Please select at least one profile');
      return;
    }
    onComplete(Array.from(selections.values()));
  };
  
  return (
    <div className="alumni-selector">
      <h2>Select Your Profiles</h2>
      <p>Choose which alumni profiles belong to you or your children.</p>
      
      <div className="alumni-list">
        {alumni.map(a => (
          <div 
            key={a.id} 
            className={`alumni-card ${selections.has(a.id) ? 'selected' : ''} ${!a.canCreateProfile ? 'blocked' : ''}`}
          >
            <div className="alumni-info">
              <strong>{a.firstName} {a.lastName}</strong>
              <span>Batch {a.batch} • {a.centerName}</span>
              {a.age !== null && (
                <span className={`age-badge ${a.coppaStatus}`}>
                  Age: {a.age} ({a.coppaStatus.replace('_', ' ')})
                </span>
              )}
            </div>
            
            {a.canCreateProfile ? (
              <div className="relationship-selector">
                <label>
                  <input
                    type="radio"
                    name={`rel-${a.id}`}
                    checked={selections.get(a.id)?.relationship === 'parent'}
                    onChange={() => toggleSelection(a.id, 'parent')}
                  />
                  This is me
                </label>
                <label>
                  <input
                    type="radio"
                    name={`rel-${a.id}`}
                    checked={selections.get(a.id)?.relationship === 'child'}
                    onChange={() => toggleSelection(a.id, 'child')}
                  />
                  This is my child
                </label>
              </div>
            ) : (
              <div className="blocked-message">
                Cannot create profile (under 14)
              </div>
            )}
          </div>
        ))}
      </div>
      
      <button 
        className="btn-primary" 
        onClick={handleSubmit}
        disabled={selections.size === 0}
      >
        Continue
      </button>
    </div>
  );
}
```

- [ ] `AlumniSelector.tsx` created

#### 4.3 Create `src/components/onboarding/YOBCollector.tsx`

```tsx
// src/components/onboarding/YOBCollector.tsx - NEW FILE

import React, { useState } from 'react';
import { apiService } from '../../services/APIService';
import type { AlumniMatch, ProfileSelection } from '../../types/onboarding';

interface Props {
  profiles: AlumniMatch[];
  selections: ProfileSelection[];
  onComplete: (updatedSelections: ProfileSelection[]) => void;
}

export function YOBCollector({ profiles, selections, onComplete }: Props) {
  const [yobValues, setYobValues] = useState<Map<number, number>>(new Map());
  const [errors, setErrors] = useState<Map<number, string>>(new Map());
  const [loading, setLoading] = useState(false);
  
  const currentYear = new Date().getFullYear();
  const minYear = 1950;
  
  const handleYobChange = (alumniId: number, value: string) => {
    const year = parseInt(value);
    const newYob = new Map(yobValues);
    const newErrors = new Map(errors);
    
    if (isNaN(year)) {
      newYob.delete(alumniId);
    } else if (year < minYear || year > currentYear) {
      newErrors.set(alumniId, `Year must be between ${minYear} and ${currentYear}`);
      newYob.set(alumniId, year);
    } else {
      newErrors.delete(alumniId);
      newYob.set(alumniId, year);
    }
    
    setYobValues(newYob);
    setErrors(newErrors);
  };
  
  const handleSubmit = async () => {
    // Validate all profiles have YOB
    const missing = profiles.filter(p => !yobValues.has(p.id));
    if (missing.length > 0) {
      alert('Please enter year of birth for all profiles');
      return;
    }
    
    if (errors.size > 0) {
      alert('Please fix errors before continuing');
      return;
    }
    
    setLoading(true);
    try {
      // Submit YOB for each profile
      for (const [alumniId, yob] of yobValues) {
        await apiService.collectYob(alumniId, yob);
      }
      
      // Update selections with YOB
      const updatedSelections = selections.map(s => ({
        ...s,
        yearOfBirth: yobValues.get(s.alumniMemberId)
      }));
      
      onComplete(updatedSelections);
    } catch (err) {
      alert('Failed to save year of birth');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="yob-collector">
      <h2>Verify Age</h2>
      <p>We need to verify age for COPPA compliance. Please enter year of birth.</p>
      
      <div className="yob-form">
        {profiles.map(p => (
          <div key={p.id} className="yob-field">
            <label>
              <strong>{p.firstName} {p.lastName}</strong>
              <span className="hint">Batch {p.batch}</span>
            </label>
            <select
              value={yobValues.get(p.id) || ''}
              onChange={(e) => handleYobChange(p.id, e.target.value)}
            >
              <option value="">Select year...</option>
              {Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            {errors.has(p.id) && (
              <span className="error">{errors.get(p.id)}</span>
            )}
            {yobValues.has(p.id) && !errors.has(p.id) && (
              <span className="age-preview">
                Age: {currentYear - yobValues.get(p.id)!}
              </span>
            )}
          </div>
        ))}
      </div>
      
      <button 
        className="btn-primary" 
        onClick={handleSubmit}
        disabled={loading || profiles.some(p => !yobValues.has(p.id))}
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
```

- [ ] `YOBCollector.tsx` created

#### 4.4 Create `src/components/onboarding/ConsentStep.tsx`

```tsx
// src/components/onboarding/ConsentStep.tsx - NEW FILE

import React, { useState } from 'react';
import { apiService } from '../../services/APIService';
import type { UserProfile } from '../../types/accounts';

interface Props {
  profiles: UserProfile[];
  onComplete: () => void;
}

export function ConsentStep({ profiles, onComplete }: Props) {
  const [consented, setConsented] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  
  const handleConsent = async (profileId: string) => {
    setLoading(true);
    try {
      await apiService.grantConsent(profileId);
      setConsented(prev => new Set(prev).add(profileId));
    } catch (err) {
      alert('Failed to grant consent');
    } finally {
      setLoading(false);
    }
  };
  
  const allConsented = profiles.every(p => consented.has(p.id));
  
  return (
    <div className="consent-step">
      <h2>Parental Consent Required</h2>
      <p>
        The following profiles belong to minors (ages 14-17) and require your
        parental consent to access the platform.
      </p>
      
      <div className="consent-list">
        {profiles.map(p => (
          <div key={p.id} className="consent-card">
            <div className="profile-info">
              <strong>{p.firstName} {p.lastName}</strong>
              <span>Age: {new Date().getFullYear() - (p.yearOfBirth || 0)}</span>
            </div>
            
            {consented.has(p.id) ? (
              <span className="consented">✓ Consent granted</span>
            ) : (
              <button
                className="btn-consent"
                onClick={() => handleConsent(p.id)}
                disabled={loading}
              >
                Grant Consent
              </button>
            )}
          </div>
        ))}
      </div>
      
      <div className="consent-legal">
        <p>
          By granting consent, you confirm that you are the parent or legal guardian
          of this child and authorize them to access the SGS Gita Alumni platform
          under supervised access.
        </p>
        <p>
          Consent will expire after 1 year and will need to be renewed.
        </p>
      </div>
      
      <button 
        className="btn-primary" 
        onClick={onComplete}
        disabled={!allConsented}
      >
        Complete Setup
      </button>
    </div>
  );
}
```

- [ ] `ConsentStep.tsx` created

---

### Step 5: Update Existing Components

#### 5.1 Update `AddFamilyMemberModal.tsx`

**Change from full birth date to YOB**:
```tsx
// BEFORE
<input
  type="date"
  name="birthDate"
  value={formData.birthDate}
  onChange={handleChange}
/>

// AFTER
<label>Year of Birth</label>
<select
  name="yearOfBirth"
  value={formData.yearOfBirth}
  onChange={handleChange}
>
  <option value="">Select year...</option>
  {Array.from({ length: currentYear - 1950 + 1 }, (_, i) => currentYear - i).map(year => (
    <option key={year} value={year}>{year}</option>
  ))}
</select>
```

**Remove**:
- `birthDate` field
- Full date validation
- Date picker component

- [ ] Birth date input replaced with YOB dropdown

#### 5.2 Update `FamilyProfileSelector.tsx`

**Update for session-based switching**:
```tsx
// BEFORE
const handleSwitch = async (memberId: string) => {
  await switchFamilyMember(memberId);
  // ... update DB
};

// AFTER
const handleSwitch = async (profileId: string) => {
  const result = await apiService.switchProfile(profileId);
  setActiveProfile(result.activeProfile);
  // Session updated on server, no DB change
};
```

**Update types**:
```tsx
// BEFORE
interface Props {
  members: FamilyMember[];
  activeMemberId: string;
}

// AFTER
interface Props {
  profiles: UserProfile[];
  activeProfileId: string;
}
```

- [ ] Profile switching updated
- [ ] Types updated

#### 5.3 Update `FamilySettingsPage.tsx`

**Replace FAMILY_MEMBERS with user_profiles**:
```tsx
// BEFORE
const { data: members } = useQuery('familyMembers', getFamilyMembers);

// AFTER
const { data: profiles } = useQuery('userProfiles', getProfiles);
```

**Update relationship display**:
```tsx
// BEFORE
{member.relationship === 'self' && <Badge>Primary</Badge>}

// AFTER
{profile.relationship === 'parent' && <Badge>Parent</Badge>}
{profile.relationship === 'child' && <Badge>Child</Badge>}
```

- [ ] Data fetching updated
- [ ] Relationship display updated

#### 5.4 Update `AuthContext.tsx`

**Update session state**:
```tsx
// BEFORE
interface AuthState {
  user: User | null;
  familyMembers: FamilyMember[];
  activeFamilyMemberId: string | null;
}

// AFTER
interface AuthState {
  account: Account | null;
  profiles: UserProfile[];
  activeProfileId: string | null;
}
```

**Update login handler**:
```tsx
// AFTER
const login = async (email: string, password: string) => {
  const result = await apiService.login(email, password);
  setState({
    account: result.account,
    profiles: result.profiles,
    activeProfileId: result.activeProfileId
  });
};
```

- [ ] Session state updated
- [ ] Login handler updated

---

### Step 6: Update Router

**Add onboarding route**:
```tsx
// src/App.tsx or router config

import { OnboardingPage } from './pages/OnboardingPage';

// Add route
<Route path="/onboarding" element={<OnboardingPage />} />
```

**Update registration redirect**:
```tsx
// After registration, redirect to onboarding instead of dashboard
navigate('/onboarding?token=' + token);
```

- [ ] Onboarding route added
- [ ] Registration redirect updated

---

## Files to DELETE

| File | Reason |
|------|--------|
| Components referencing `FAMILY_INVITATIONS` | Deprecated |
| `FamilySetupPage.tsx` (if separate from onboarding) | Replaced by OnboardingPage |
| Old birth date input components | Replaced with YOB |

---

## Verification Commands

```powershell
# After UI refactoring, verify no old references
grep -r "FamilyMember" src/ --include="*.tsx" --include="*.ts"
# Should only find in _archive or migration comments

grep -r "birth_date" src/ --include="*.tsx" --include="*.ts"
# Should return 0 matches

grep -r "birthDate" src/ --include="*.tsx" --include="*.ts"
# Should return 0 matches (except in archived code)

grep -r "relationship.*self" src/ --include="*.tsx" --include="*.ts"
# Should return 0 matches

grep -r "primary_family_member" src/ --include="*.tsx" --include="*.ts"
# Should return 0 matches

grep -r "FAMILY_INVITATIONS" src/ --include="*.tsx" --include="*.ts"
# Should return 0 matches
```

---

## Testing Checklist

After UI refactoring:

- [ ] Registration flow shows alumni selection
- [ ] YOB collection shows dropdown (not date picker)
- [ ] Consent flow shows for child profiles 14-17
- [ ] Under 14 profiles cannot be created (show message)
- [ ] Profile switching works (session-based)
- [ ] Dashboard shows active profile correctly
- [ ] Parent badge shows for parent profiles
- [ ] Child badge shows for child profiles
- [ ] Consent expiry warning shows when near expiry

---

## CSS Updates Needed

Create styles for onboarding components:
- `.onboarding-page`
- `.alumni-selector`
- `.alumni-card`
- `.yob-collector`
- `.consent-step`
- `.age-badge` (with `.blocked`, `.requires_consent`, `.full_access` variants)

---

## Next Phase

After completing Phase 4 (UI Refactoring):
→ Proceed to [05-stale-code-cleanup-checklist.md](./05-stale-code-cleanup-checklist.md)

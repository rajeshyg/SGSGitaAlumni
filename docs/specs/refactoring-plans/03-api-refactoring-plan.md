# Phase 3: API Refactoring Plan

**Date**: 2025-12-07  
**Status**: COMPLETE  
**Depends On**: Phase 2 (Database Migration)  
**Duration**: 2-3 days

---

## Overview

Refactor backend routes and services to use new database schema. This involves:
1. Updating table references (`app_users` → `accounts`, `FAMILY_MEMBERS` → `user_profiles`)
2. Removing deprecated endpoints
3. Creating new onboarding flow endpoints
4. Updating session management

---

## File Impact Summary

### Files to MODIFY (Heavy Changes)

| File | Lines | Changes |
|------|-------|---------|
| `routes/auth.js` | 1,125 | Update table refs, remove family registration |
| `routes/invitations.js` | 1,049 | Remove FAMILY_INVITATIONS routes |
| `routes/family-members.js` | ~300 | Update to user_profiles |
| `src/services/StreamlinedRegistrationService.ts` | 768 | Complete rewrite |
| `src/services/AlumniDataIntegrationService.ts` | 272 | Remove estimated_birth_year |
| `src/services/AgeVerificationService.ts` | ~486 | Update age calculation |
| `src/services/familyMemberService.ts` | ~200 | Update to user_profiles |
| `server/services/FamilyMemberService.js` | ~600 | Update to user_profiles |
| `middleware/auth.js` | ~200 | Add active_profile_id to session |

### Files to DELETE

| File | Reason |
|------|--------|
| Parts of `routes/auth.js` | `registerFromFamilyInvitation` endpoint |
| Parts of `routes/invitations.js` | FAMILY_INVITATIONS routes |

### New Files to CREATE

| File | Purpose |
|------|---------|
| `routes/onboarding.js` | New onboarding flow endpoints |
| `src/services/OnboardingService.ts` | Orchestrate registration + profile creation |
| `src/services/ProfileService.ts` | User profile management |

---

## Execution Steps

### Step 1: Update `routes/auth.js`

#### 1.1 Replace table references

**Find and Replace**:
```
app_users → accounts
FAMILY_MEMBERS → user_profiles
primary_family_member_id → (remove)
```

**Specific Changes**:

```javascript
// BEFORE (login query)
const [users] = await connection.execute(
  'SELECT * FROM app_users WHERE email = ?',
  [email]
);

// AFTER
const [accounts] = await connection.execute(
  'SELECT * FROM accounts WHERE email = ?',
  [email]
);
```

```javascript
// BEFORE (session)
req.session = {
  userId: user.id,
  email: user.email,
  primary_family_member_id: user.primary_family_member_id
};

// AFTER
req.session = {
  accountId: account.id,
  email: account.email,
  profiles: [], // Populated from user_profiles
  activeProfileId: null // Set on profile selection
};
```

- [ ] All `app_users` references replaced
- [ ] Session structure updated

#### 1.2 Remove `registerFromFamilyInvitation` endpoint

**DELETE entire function** (lines ~678-950):
```javascript
// DELETE THIS ENTIRE FUNCTION
export const registerFromFamilyInvitation = asyncHandler(async (req, res) => {
  // ... all code
});
```

**Also remove from `server.js`**:
```javascript
// DELETE this import
import { registerFromFamilyInvitation } from './routes/auth.js';

// DELETE this route
app.post('/api/auth/register-from-family-invitation', ...);
```

- [ ] `registerFromFamilyInvitation` deleted from auth.js
- [ ] Route removed from server.js

#### 1.3 Simplify `registerFromInvitation`

**Before**: Creates user + auto-imports all family members
**After**: Creates account only, redirects to onboarding

```javascript
// REWRITE
export const registerFromInvitation = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  
  // 1. Validate invitation
  const invitation = await validateInvitationToken(token);
  if (!invitation) {
    return res.status(400).json({ error: 'Invalid or expired invitation' });
  }
  
  // 2. Create account only (no profiles yet)
  const accountId = uuidv4();
  const hashedPassword = await bcrypt.hash(password, 10);
  
  await connection.execute(
    `INSERT INTO accounts (id, email, password_hash, status, role)
     VALUES (?, ?, ?, 'pending', 'user')`,
    [accountId, invitation.email, hashedPassword]
  );
  
  // 3. Update invitation status
  await connection.execute(
    `UPDATE USER_INVITATIONS SET status = 'accepted', accepted_by = ?, accepted_at = NOW()
     WHERE id = ?`,
    [accountId, invitation.id]
  );
  
  // 4. Return account ID - frontend redirects to onboarding
  res.status(201).json({
    success: true,
    accountId,
    email: invitation.email,
    nextStep: '/onboarding/select-profiles'
  });
});
```

- [ ] `registerFromInvitation` simplified

---

### Step 2: Update `routes/invitations.js`

#### 2.1 DELETE FAMILY_INVITATIONS routes

**Remove these functions**:
- `getFamilyInvitations` (lines ~149-170)
- `createFamilyInvitation` (lines ~260-335)
- `acceptFamilyInvitationProfile` (lines ~380-420)

**Keep these functions** (but update table refs):
- `getAllInvitations`
- `createInvitation`
- `validateInvitation`
- `resendInvitation`
- `revokeInvitation`
- `createBulkInvitations`

- [ ] FAMILY_INVITATIONS routes deleted
- [ ] Remaining routes updated

#### 2.2 Update `validateInvitation` response

```javascript
// REWRITE to include alumni matches
export const validateInvitation = asyncHandler(async (req, res) => {
  const { token } = req.query;
  
  // 1. Validate token
  const invitation = await validateToken(token);
  if (!invitation) {
    return res.status(400).json({ error: 'Invalid or expired invitation' });
  }
  
  // 2. Fetch matching alumni
  const [alumni] = await connection.execute(
    `SELECT id, first_name, last_name, batch, center_name, year_of_birth,
            CASE 
              WHEN year_of_birth IS NOT NULL THEN YEAR(CURDATE()) - year_of_birth
              ELSE NULL
            END as age
     FROM alumni_members 
     WHERE email = ?`,
    [invitation.email]
  );
  
  // 3. Add COPPA status to each
  const alumniWithCoppa = alumni.map(a => ({
    ...a,
    coppaStatus: getCoppaStatus(a.age),
    canCreateProfile: a.age === null || a.age >= 14
  }));
  
  res.json({
    valid: true,
    invitation: {
      id: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expires_at
    },
    alumni: alumniWithCoppa
  });
});

function getCoppaStatus(age) {
  if (age === null) return 'unknown';
  if (age < 14) return 'blocked';
  if (age < 18) return 'requires_consent';
  return 'full_access';
}
```

- [ ] `validateInvitation` returns alumni matches

---

### Step 3: Create `routes/onboarding.js` (NEW)

```javascript
// routes/onboarding.js - NEW FILE

import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/auth.js';
import { getPool } from '../config/database.js';

const router = Router();

/**
 * POST /api/onboarding/select-profiles
 * User selects which alumni profiles to claim
 */
router.post('/select-profiles', authenticateToken, async (req, res) => {
  const { accountId } = req.session;
  const { selections } = req.body;
  // selections: [{ alumniMemberId, relationship: 'parent'|'child', yearOfBirth? }]
  
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    
    const createdProfiles = [];
    let parentProfileId = null;
    
    // Process parent selections first
    const parentSelections = selections.filter(s => s.relationship === 'parent');
    const childSelections = selections.filter(s => s.relationship === 'child');
    
    // Create parent profiles
    for (const selection of parentSelections) {
      const profile = await createUserProfile(connection, {
        accountId,
        alumniMemberId: selection.alumniMemberId,
        relationship: 'parent',
        yearOfBirth: selection.yearOfBirth
      });
      createdProfiles.push(profile);
      if (!parentProfileId) parentProfileId = profile.id;
    }
    
    // Create child profiles (linked to parent)
    for (const selection of childSelections) {
      const age = selection.yearOfBirth 
        ? new Date().getFullYear() - selection.yearOfBirth 
        : null;
      
      // Block under 14
      if (age !== null && age < 14) {
        continue; // Skip, don't create profile
      }
      
      const profile = await createUserProfile(connection, {
        accountId,
        alumniMemberId: selection.alumniMemberId,
        relationship: 'child',
        parentProfileId,
        yearOfBirth: selection.yearOfBirth,
        requiresConsent: age !== null && age < 18
      });
      createdProfiles.push(profile);
    }
    
    // Update account status
    await connection.execute(
      `UPDATE accounts SET status = 'active' WHERE id = ?`,
      [accountId]
    );
    
    await connection.commit();
    
    res.json({
      success: true,
      profiles: createdProfiles,
      requiresConsent: createdProfiles.some(p => p.requiresConsent)
    });
    
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

/**
 * POST /api/onboarding/collect-yob
 * Collect year of birth for alumni without it
 */
router.post('/collect-yob', authenticateToken, async (req, res) => {
  const { alumniMemberId, yearOfBirth } = req.body;
  
  // Validate YOB
  const currentYear = new Date().getFullYear();
  if (yearOfBirth < 1900 || yearOfBirth > currentYear) {
    return res.status(400).json({ error: 'Invalid year of birth' });
  }
  
  const pool = getPool();
  await pool.execute(
    `UPDATE alumni_members SET year_of_birth = ? WHERE id = ?`,
    [yearOfBirth, alumniMemberId]
  );
  
  const age = currentYear - yearOfBirth;
  res.json({
    success: true,
    age,
    coppaStatus: getCoppaStatus(age)
  });
});

/**
 * POST /api/onboarding/grant-consent
 * Parent grants consent for child profile
 */
router.post('/grant-consent', authenticateToken, async (req, res) => {
  const { accountId } = req.session;
  const { childProfileId } = req.body;
  
  const connection = await getPool().getConnection();
  try {
    // Verify parent owns this child profile
    const [profiles] = await connection.execute(
      `SELECT id, parent_profile_id FROM user_profiles 
       WHERE id = ? AND account_id = ? AND relationship = 'child'`,
      [childProfileId, accountId]
    );
    
    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Child profile not found' });
    }
    
    const childProfile = profiles[0];
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year expiry
    
    // Update child profile
    await connection.execute(
      `UPDATE user_profiles SET 
         parent_consent_given = TRUE,
         parent_consent_date = NOW(),
         consent_expires_at = ?,
         access_level = 'supervised',
         status = 'active'
       WHERE id = ?`,
      [expiresAt, childProfileId]
    );
    
    // Create consent record
    await connection.execute(
      `INSERT INTO PARENT_CONSENT_RECORDS 
         (id, child_family_member_id, parent_family_member_id, consent_type, granted_at)
       VALUES (?, ?, ?, 'granted', NOW())`,
      [uuidv4(), childProfileId, childProfile.parent_profile_id]
    );
    
    res.json({ success: true, expiresAt });
    
  } finally {
    connection.release();
  }
});

// Helper function
async function createUserProfile(connection, data) {
  const id = uuidv4();
  const age = data.yearOfBirth 
    ? new Date().getFullYear() - data.yearOfBirth 
    : null;
  
  const accessLevel = data.requiresConsent ? 'blocked' : 'full';
  const status = data.requiresConsent ? 'pending_consent' : 'active';
  
  await connection.execute(
    `INSERT INTO user_profiles 
       (id, account_id, alumni_member_id, relationship, parent_profile_id,
        requires_consent, access_level, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, data.accountId, data.alumniMemberId, data.relationship,
     data.parentProfileId || null, data.requiresConsent || false,
     accessLevel, status]
  );
  
  // Update alumni_members YOB if provided
  if (data.yearOfBirth) {
    await connection.execute(
      `UPDATE alumni_members SET year_of_birth = ? WHERE id = ? AND year_of_birth IS NULL`,
      [data.yearOfBirth, data.alumniMemberId]
    );
  }
  
  return { id, relationship: data.relationship, requiresConsent: data.requiresConsent };
}

function getCoppaStatus(age) {
  if (age === null) return 'unknown';
  if (age < 14) return 'blocked';
  if (age < 18) return 'requires_consent';
  return 'full_access';
}

export default router;
```

**Add to `server.js`**:
```javascript
import onboardingRoutes from './routes/onboarding.js';
app.use('/api/onboarding', onboardingRoutes);
```

- [ ] `routes/onboarding.js` created
- [ ] Routes registered in server.js

---

### Step 4: Update `routes/family-members.js`

#### 4.1 Replace table references

```javascript
// BEFORE
const [members] = await connection.execute(
  'SELECT * FROM FAMILY_MEMBERS WHERE parent_user_id = ?',
  [userId]
);

// AFTER
const [profiles] = await connection.execute(
  `SELECT up.*, am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth
   FROM user_profiles up
   JOIN alumni_members am ON up.alumni_member_id = am.id
   WHERE up.account_id = ?`,
  [accountId]
);
```

#### 4.2 Update profile switching

```javascript
// BEFORE - updates primary_family_member_id in DB
router.post('/:id/switch', async (req, res) => {
  await connection.execute(
    'UPDATE app_users SET primary_family_member_id = ? WHERE id = ?',
    [profileId, userId]
  );
});

// AFTER - session-based only
router.post('/:id/switch', authenticateToken, async (req, res) => {
  const { id: profileId } = req.params;
  const { accountId, profiles } = req.session;
  
  // Verify profile belongs to account
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' });
  }
  
  // Check access level
  if (profile.accessLevel === 'blocked') {
    return res.status(403).json({ error: 'Profile access blocked' });
  }
  
  // Update session
  req.session.activeProfileId = profileId;
  
  res.json({ success: true, activeProfile: profile });
});
```

- [ ] `FAMILY_MEMBERS` → `user_profiles`
- [ ] Profile switching is session-based

---

### Step 5: Update Services

#### 5.1 Rewrite `StreamlinedRegistrationService.ts`

**DELETE auto-import logic** (lines 215-236):
```typescript
// DELETE THIS BLOCK
const allAlumniProfiles = await this.alumniService.fetchAllAlumniMembersByEmail(invitation.email);
for (const otherAlumni of allAlumniProfiles) {
  // ... auto-import code
}
```

**Simplify to account creation only**:
```typescript
export class StreamlinedRegistrationService {
  async createAccount(email: string, passwordHash: string): Promise<string> {
    const accountId = uuidv4();
    await this.pool.execute(
      `INSERT INTO accounts (id, email, password_hash, status, role)
       VALUES (?, ?, ?, 'pending', 'user')`,
      [accountId, email, passwordHash]
    );
    return accountId;
  }
}
```

- [ ] Auto-import logic deleted
- [ ] Service simplified

#### 5.2 Update `AlumniDataIntegrationService.ts`

**Remove `estimated_birth_year` references**:
```typescript
// DELETE these lines
am.estimated_birth_year,
WHEN am.estimated_birth_year IS NOT NULL THEN YEAR(CURDATE()) - am.estimated_birth_year

// REPLACE with year_of_birth only
am.year_of_birth,
CASE WHEN am.year_of_birth IS NOT NULL 
  THEN YEAR(CURDATE()) - am.year_of_birth 
  ELSE NULL 
END as age
```

**Update interface**:
```typescript
interface AlumniProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  batch: number;
  centerName: string;
  yearOfBirth: number | null;  // Changed from estimatedBirthYear
  age: number | null;          // Calculated
}
```

- [ ] `estimated_birth_year` references removed
- [ ] Using `year_of_birth` only

#### 5.3 Update `AgeVerificationService.ts`

**Simplify age calculation**:
```typescript
export class AgeVerificationService {
  /**
   * Calculate age from year of birth (conservative: assumes Dec 31)
   */
  calculateAge(yearOfBirth: number): number {
    const currentYear = new Date().getFullYear();
    return currentYear - yearOfBirth;
  }
  
  /**
   * Determine access level based on age
   */
  getAccessLevel(age: number | null): 'blocked' | 'supervised' | 'full' {
    if (age === null) return 'blocked'; // Unknown age = blocked
    if (age < 14) return 'blocked';      // Under 14 = no profile
    if (age < 18) return 'blocked';      // 14-17 = needs consent first
    return 'full';                        // 18+ = full access
  }
  
  /**
   * Check if profile requires parental consent
   */
  requiresConsent(age: number | null): boolean {
    if (age === null) return true;
    return age >= 14 && age < 18;
  }
}
```

- [ ] Age calculation simplified
- [ ] No more batch-22 formula

---

### Step 6: Update `middleware/auth.js`

**Update session structure**:
```javascript
// Add profile loading after authentication
export const authenticateToken = async (req, res, next) => {
  // ... existing JWT validation ...
  
  // Load profiles for session
  if (req.session.accountId && !req.session.profiles) {
    const [profiles] = await pool.execute(
      `SELECT up.id, up.relationship, up.access_level, up.status,
              am.first_name, am.last_name
       FROM user_profiles up
       JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE up.account_id = ?`,
      [req.session.accountId]
    );
    req.session.profiles = profiles;
    
    // Set default active profile (first parent profile)
    if (!req.session.activeProfileId && profiles.length > 0) {
      const parentProfile = profiles.find(p => p.relationship === 'parent');
      req.session.activeProfileId = parentProfile?.id || profiles[0].id;
    }
  }
  
  next();
};
```

- [ ] Session includes profiles array
- [ ] Active profile is session-based

---

### Step 7: Update `server.js`

**Remove deprecated imports and routes**:
```javascript
// DELETE these imports
import { registerFromFamilyInvitation } from './routes/auth.js';
import { getFamilyInvitations, createFamilyInvitation } from './routes/invitations.js';

// DELETE these routes
app.post('/api/auth/register-from-family-invitation', ...);
app.get('/api/invitations/family', ...);
app.post('/api/invitations/family', ...);

// ADD new routes
import onboardingRoutes from './routes/onboarding.js';
app.use('/api/onboarding', onboardingRoutes);
```

- [ ] Deprecated routes removed
- [ ] New onboarding routes added

---

## Endpoint Summary

### Endpoints to DELETE

| Endpoint | File | Reason |
|----------|------|--------|
| `POST /api/auth/register-from-family-invitation` | auth.js | Uses old schema |
| `GET /api/invitations/family` | invitations.js | FAMILY_INVITATIONS |
| `POST /api/invitations/family` | invitations.js | FAMILY_INVITATIONS |
| `POST /api/invitations/family/:id/accept` | invitations.js | FAMILY_INVITATIONS |

### Endpoints to MODIFY

| Endpoint | File | Changes |
|----------|------|---------|
| `POST /api/auth/register-from-invitation` | auth.js | Simplified, no auto-import |
| `GET /api/invitations/validate` | invitations.js | Returns alumni matches |
| `GET /api/family-members` | family-members.js | Uses user_profiles |
| `POST /api/family-members/:id/switch` | family-members.js | Session-based |
| `POST /api/family-members/:id/consent/grant` | family-members.js | Uses user_profiles |

### Endpoints to CREATE

| Endpoint | File | Purpose |
|----------|------|---------|
| `POST /api/onboarding/select-profiles` | onboarding.js | Select alumni profiles |
| `POST /api/onboarding/collect-yob` | onboarding.js | Collect year of birth |
| `POST /api/onboarding/grant-consent` | onboarding.js | Parent grants consent |

---

## Verification Commands

```powershell
# After refactoring, verify no old references
grep -r "app_users" routes/ server/ --include="*.js"
grep -r "FAMILY_MEMBERS" routes/ server/ --include="*.js"
grep -r "FAMILY_INVITATIONS" routes/ server/ --include="*.js"
grep -r "FAMILY_ACCESS_LOG" routes/ server/ --include="*.js"
grep -r "estimated_birth_year" routes/ server/ src/ --include="*.ts" --include="*.js"
grep -r "birth_date" routes/ server/ src/ --include="*.ts" --include="*.js"
grep -r "primary_family_member_id" routes/ server/ src/ --include="*.ts" --include="*.js"
grep -r "registerFromFamilyInvitation" routes/ server/ src/ --include="*.ts" --include="*.js"

# Should all return 0 matches (or only in comments/docs)
```

---

## Testing Checklist

After API refactoring:

- [ ] `POST /api/auth/register-from-invitation` creates account only
- [ ] `GET /api/invitations/validate?token=xxx` returns alumni matches
- [ ] `POST /api/onboarding/select-profiles` creates user_profiles
- [ ] `POST /api/onboarding/collect-yob` updates alumni_members
- [ ] `POST /api/onboarding/grant-consent` updates consent fields
- [ ] `POST /api/family-members/:id/switch` updates session only
- [ ] `GET /api/family-members` returns user_profiles + alumni data

---

## Next Phase

After completing Phase 3 (API Refactoring):
→ Proceed to [04-ui-refactoring-plan.md](./04-ui-refactoring-plan.md)

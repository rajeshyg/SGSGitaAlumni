# Task 8.11.2: Login Integration with Family Members

**Status:** ✅ **COMPLETE** (November 3, 2025)
**Priority:** Critical
**Duration:** 3 days (completed)
**Parent Task:** [Task 8.11: Family Member System](./task-8.11-family-member-system.md)
**Related:** [Task 8.12: Violation Corrections](./task-8.12-violation-corrections.md) - Action 5

## Overview
Integrate the FAMILY_MEMBERS table into the login workflow, enabling the system to detect family accounts and provide the appropriate post-login experience (profile selection for family accounts, direct dashboard for individual accounts).

**Business Context:** After successful authentication, the system needs to determine if the user has a family account and query associated family members to enable profile selection.

## Functional Requirements

### Login Flow Enhancement

#### Current Flow (Individual Accounts Only)
```
User Login → Verify Credentials → Create Session → Redirect to Dashboard
```

#### New Flow (Family Account Support)
```
User Login 
  → Verify Credentials
  → Query FAMILY_MEMBERS table
  → Detect Account Type
  → Create Session with Family Context
  → Redirect:
     ├─ Family Account (2+ members) → ProfileSelectionPage
     ├─ Multi-Role Individual → RoleSelectionPage
     └─ Single-Role Individual → Dashboard
```

### Account Type Detection Logic

```typescript
interface AccountTypeDetection {
  isFamilyAccount: boolean;
  familyMemberCount: number;
  primaryFamilyMemberId?: string;
  hasMultipleRoles: boolean;
  roles: ('member' | 'moderator' | 'admin')[];
}

async function detectAccountType(userId: string): Promise<AccountTypeDetection> {
  // Query FAMILY_MEMBERS table
  const familyMembers = await db.query(
    `SELECT * FROM FAMILY_MEMBERS 
     WHERE parent_user_id = $1 
     AND can_access_platform = true 
     AND age >= 14`,
    [userId]
  );

  // Query user roles
  const userRoles = await db.query(
    `SELECT role FROM USER_ROLES WHERE user_id = $1`,
    [userId]
  );

  return {
    isFamilyAccount: familyMembers.length > 1,
    familyMemberCount: familyMembers.length,
    primaryFamilyMemberId: familyMembers[0]?.id,
    hasMultipleRoles: userRoles.length > 1,
    roles: userRoles.map(r => r.role)
  };
}
```

### Session Enhancement

```typescript
interface EnhancedSessionData {
  // Existing fields
  userId: string;
  email: string;
  
  // NEW: Family account fields
  isFamilyAccount: boolean;
  familyAccountType: 'individual' | 'parent' | 'shared';
  primaryFamilyMemberId?: string;
  activeFamilyMemberId?: string; // Set after profile selection
  
  // NEW: Role management
  roles: ('member' | 'moderator' | 'admin')[];
  activeRole?: 'member' | 'moderator' | 'admin'; // Set after role selection
  
  // Existing fields
  createdAt: Date;
  expiresAt: Date;
}
```

## Technical Requirements

### Database Queries

#### Query 1: Get Family Members for User
```sql
-- Get all accessible family members for a parent user
SELECT 
  fm.id,
  fm.first_name,
  fm.last_name,
  fm.date_of_birth,
  fm.relationship,
  fm.profile_image_url,
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(fm.date_of_birth)) >= 18 THEN 'full'
    WHEN EXTRACT(YEAR FROM AGE(fm.date_of_birth)) >= 14 THEN 'supervised'
    ELSE 'blocked'
  END as access_level
FROM FAMILY_MEMBERS fm
WHERE fm.parent_user_id = $1
  AND fm.can_access_platform = true
  AND EXTRACT(YEAR FROM AGE(fm.date_of_birth)) >= 14
ORDER BY fm.created_at ASC;
```

#### Query 2: Get User Roles
```sql
-- Get all roles assigned to a user
SELECT DISTINCT role
FROM USER_ROLES
WHERE user_id = $1;
```

### API Endpoint Updates

#### POST /api/auth/login (Enhanced)

**Request:**
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123!"
}
```

**Response (Family Account):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "parent@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "accountType": {
      "isFamilyAccount": true,
      "familyMemberCount": 3,
      "primaryFamilyMemberId": "member-uuid-1",
      "hasMultipleRoles": false,
      "roles": ["member"]
    },
    "redirectTo": "/profile-selection",
    "requiresProfileSelection": true
  }
}
```

**Response (Individual Account):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "individual@example.com",
      "firstName": "Jane",
      "lastName": "Smith"
    },
    "accountType": {
      "isFamilyAccount": false,
      "familyMemberCount": 0,
      "hasMultipleRoles": true,
      "roles": ["member", "moderator"]
    },
    "redirectTo": "/role-selection",
    "requiresProfileSelection": false,
    "requiresRoleSelection": true
  }
}
```

### Service Layer Implementation

```typescript
// Location: src/services/AuthService.ts

export class AuthService {
  async login(email: string, password: string): Promise<LoginResponse> {
    // 1. Verify credentials
    const user = await this.verifyCredentials(email, password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // 2. Detect account type
    const accountType = await this.detectAccountType(user.id);

    // 3. Create session with family context
    const session = await this.createSessionWithFamilyContext(user, accountType);

    // 4. Determine redirect destination
    const redirectTo = this.determineRedirect(accountType);

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        accountType,
        redirectTo,
        requiresProfileSelection: accountType.isFamilyAccount && accountType.familyMemberCount > 1,
        requiresRoleSelection: accountType.hasMultipleRoles
      }
    };
  }

  private determineRedirect(accountType: AccountTypeDetection): string {
    // Family account with multiple members → profile selection
    if (accountType.isFamilyAccount && accountType.familyMemberCount > 1) {
      return '/profile-selection';
    }

    // Individual with multiple roles → role selection
    if (accountType.hasMultipleRoles) {
      return '/role-selection';
    }

    // Single-role individual → direct to dashboard
    const role = accountType.roles[0];
    return role === 'admin' ? '/admin' : role === 'moderator' ? '/moderator' : '/dashboard';
  }

  private async createSessionWithFamilyContext(
    user: User,
    accountType: AccountTypeDetection
  ): Promise<Session> {
    const sessionData: EnhancedSessionData = {
      userId: user.id,
      email: user.email,
      isFamilyAccount: accountType.isFamilyAccount,
      familyAccountType: accountType.isFamilyAccount ? 'parent' : 'individual',
      primaryFamilyMemberId: accountType.primaryFamilyMemberId,
      roles: accountType.roles,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    return await this.sessionManager.create(sessionData);
  }
}
```

### Frontend Login Handler Update

```typescript
// Location: src/pages/LoginPage.tsx

async function handleLogin(email: string, password: string) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (result.success) {
      // Store account type in context
      updateAuthContext({
        user: result.data.user,
        accountType: result.data.accountType
      });

      // Navigate based on redirect destination
      navigate(result.data.redirectTo);
    } else {
      setError(result.error.message);
    }
  } catch (error) {
    setError('Login failed. Please try again.');
  }
}
```

## Implementation Plan

### Day 1: Backend Integration
**Morning:**
- [ ] Add FAMILY_MEMBERS query to login flow
- [ ] Implement `detectAccountType()` function
- [ ] Create enhanced session data structure
- [ ] Update login API response format

**Afternoon:**
- [ ] Write unit tests for account type detection
- [ ] Test with family account scenarios
- [ ] Test with individual account scenarios
- [ ] Test with multi-role scenarios

### Day 2: Frontend Integration
**Morning:**
- [ ] Update AuthContext to store account type
- [ ] Update login handler to process new response
- [ ] Implement redirect logic based on account type
- [ ] Update session storage with family context

**Afternoon:**
- [ ] Test login flow with family accounts
- [ ] Test login flow with individual accounts
- [ ] Test redirect to ProfileSelectionPage
- [ ] Test redirect to Dashboard

### Day 3: Testing & Edge Cases
**Morning:**
- [ ] Test edge case: No family members found
- [ ] Test edge case: All family members under 14
- [ ] Test edge case: Single family member
- [ ] Test session persistence across page refresh

**Afternoon:**
- [ ] Integration tests for complete login flow
- [ ] Performance testing for family member queries
- [ ] Security testing for session data
- [ ] Documentation updates

## Success Criteria

### Functional
- [ ] Login query includes FAMILY_MEMBERS table lookup
- [ ] Session stores family account context
- [ ] Family accounts redirect to ProfileSelectionPage
- [ ] Individual accounts redirect appropriately
- [ ] Multi-role users see role selection
- [ ] Single-role users skip to dashboard

### Technical
- [ ] Database query optimized (<50ms)
- [ ] Session data structure includes family fields
- [ ] TypeScript types updated for enhanced session
- [ ] Backward compatible with existing sessions

### User Experience
- [ ] Seamless login experience
- [ ] Correct redirect after login
- [ ] No unnecessary profile selection screens
- [ ] Fast account type detection

## Testing Checklist

### Unit Tests
- [ ] `detectAccountType()` with 0 family members
- [ ] `detectAccountType()` with 1 family member
- [ ] `detectAccountType()` with 2+ family members
- [ ] `determineRedirect()` for each account type
- [ ] Session creation with family context

### Integration Tests
- [ ] Login with family account → redirects to /profile-selection
- [ ] Login with individual account → redirects to /dashboard
- [ ] Login with multi-role → redirects to /role-selection
- [ ] Session persists family context across requests
- [ ] Logout clears family session data

### Manual Tests
- [ ] Test with parent email having 3 children
- [ ] Test with individual alumnus account
- [ ] Test with admin account (multi-role)
- [ ] Test with family account where all children <14 (should behave as individual)
- [ ] Test session expiry with family context

## Dependencies

### Required Before Starting
- [Task 8.11.1: FamilyProfileSelector Component](./task-8.11.1-profile-selector.md) - Component exists
- [Task 7.3.1: Profile Selection Page](../phase-7/task-7.3.1-profile-selection-page.md) - Page exists
- FAMILY_MEMBERS table populated with test data

### Blocks These Tasks
- All dashboard and feature tasks (requires proper login flow)
- Family member profile selection workflow
- Role-based access control features

## Related Documentation
- [Task 8.11: Family Member System](./task-8.11-family-member-system.md) - Parent task
- [Task 7.3: Authentication System](../phase-7/task-7.3-authentication-system.md) - Auth foundation
- [Requirements Doc](../../functional-requirements/Gita%20Connect%20Application%20-%20Requirements%20document.md) - Requirement 6

---

*This task bridges authentication and family member features, enabling the Netflix-style profile selection experience.*

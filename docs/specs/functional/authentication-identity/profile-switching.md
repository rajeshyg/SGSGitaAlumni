---
version: "1.1"
status: implemented
last_updated: 2025-12-09
---

# Profile Switching

## Purpose
Allow authenticated users (parents) to switch between their own profile and their children's profiles without re-authenticating, maintaining separate JWT tokens for each active profile context.

## Technical Implementation

### Architecture Overview
- **Session Strategy**: Hybrid Session + JWT approach
- **State Management**: Active profile ID encoded in JWT payload (`activeProfileId`)
- **Token Generation**: New JWT token pair issued on profile switch with updated profile context
- **Middleware Integration**: Session object rebuilt per-request from JWT token, containing active profile context

### Profile Switching Workflow

1. **Authentication Initiation**
   - User logs in via `/api/auth/login`
   - JWT token issued with `activeProfileId: null` (no active profile yet)
   - User redirected to `/onboarding` for profile selection

2. **Profile Selection**
   - User selects target profile from available family members
   - Frontend calls `POST /api/family-members/:id/switch` endpoint
   
3. **Server-Side Processing**
   - Middleware validates JWT token and reconstructs session
   - Profile ownership verified: target profile must belong to user's account
   - Profile status validation: profile must be `active` or `pending_consent`
   - New JWT tokens generated with updated `activeProfileId` in payload
   - Session object updated and rebuilt for subsequent requests
   
4. **Token Propagation to Client**
   - Response includes new access token and refresh token
   - Frontend stores tokens in localStorage/sessionStorage
   - API client re-initialized with new token credentials
   - Chat socket reconnected with new authentication
   - AuthContext state updated with new profile data
   - Page navigation to dashboard with new profile context

### Critical State Transitions

#### Login Flow
```
Login (activeProfileId: null)
  ↓ [redirect to /onboarding]
Profile Selection
  ↓ [POST /api/family-members/:id/switch]
New Token Issued (activeProfileId: <profile_id>)
  ↓ [Frontend stores token, updates context]
Dashboard Access with Profile Context
```

#### Page Refresh After Switch
```
Page Reload
  ↓ [AuthContext checkAuth on mount]
Retrieve Token from Storage (contains activeProfileId)
  ↓ [Middleware validates token]
getCurrentUserProfile uses activeProfileId
  ↓ [Query joins correct profile via activeProfileId]
User State Restored with Switched Profile
```

### Middleware Profile Validation

**Key Implementation Details:**
- JWT middleware extracts `activeProfileId` from token payload
- Session object built with `req.session.activeProfileId` for access by routes
- Profile lookup uses activeProfileId to join correct user_profiles row
- Status filter accepts both `active` and `pending_consent` (prevents reverting to parent profile on consent-pending children)
- Access control enforces profile permissions downstream

### API Endpoint Contract

**Endpoint**: `POST /api/family-members/:id/switch`

**Request Headers:**
- `Authorization: Bearer <jwt_token_with_activeProfileId_or_null>`

**Path Parameters:**
- `id`: UUID of target profile to switch to

**Response on Success (200):**
```json
{
  "success": true,
  "activeProfile": {
    "id": "d77a0ef0-...",
    "firstName": "ChildName",
    "lastName": "FamilyName",
    "relationship": "child",
    "accessLevel": "supervised",
    "batch": "2020",
    "centerName": "SGS Gita Center",
    "yearOfBirth": 2005
  },
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Error Cases:**
- `401 Unauthorized`: Invalid or missing JWT token
- `403 Forbidden`: User does not own the target profile
- `409 Conflict`: Target profile is blocked or deleted
- `422 Unprocessable Entity`: Invalid profile ID format

### Frontend Integration Points

**Service Layer** (`familyMemberService.ts`):
- `switchProfile(profileId: string)`: Calls API endpoint, returns tokens and profile data
- Response includes both `token` and `refreshToken`

**Context Management** (`AuthContext.tsx`):
- `updateTokensAfterProfileSwitch(token, refreshToken, activeProfile)`: 
  - Stores new tokens in secure storage
  - Reinitializes API client with new credentials
  - Reconnects chat socket
  - Updates user state with new profile details
  - Updates localStorage profile cache

**Component Integration** (`FamilyProfileSelector.tsx`):
- Detects tokens in switch response
- Falls back to token refresh if not provided
- Calls `updateTokensAfterProfileSwitch` on context
- Navigates to dashboard after successful switch

**Navigation Handling**:
- `ProtectedRoute` validates `profileId` presence before allowing access
- Missing `profileId` redirects to `/onboarding`
- Users cannot access protected routes without active profile

### Security Guarantees

**Token Scope Limitation:**
- Each JWT valid only for its encoded profile context
- Old tokens become invalid for new profile operations
- Stateless validation: no blacklist needed (JWT payload contains truth)

**Profile Ownership:**
- Backend enforces account-to-profile relationship
- Prevents switching to unrelated family members
- SQL query verified: `WHERE account_id = user_account_id`

**Status Validation:**
- Only profiles with `active` or `pending_consent` status switchable
- Blocks access to deleted/archived profiles
- Parent must explicitly manage child profile access

**Access Level Enforcement:**
- `supervised` profiles restrict endpoint access on backend
- Frontend respects access level for UI feature visibility
- Prevents supervised users from accessing admin-only endpoints

### Error Recovery

**Context Loss During Navigation:**
- `useAuthSafe()` hook gracefully handles context unavailability
- Shows loading state instead of crashing
- Prevents "useAuth must be used within AuthProvider" errors
- Allows recovery from interrupted navigation transitions

**Token Refresh Cycle:**
- If access token expires, refresh token used to obtain new pair
- New tokens maintain current `activeProfileId`
- Seamless profile context persistence across refreshes

**Failed Switch Attempts:**
- Frontend displays error message with recovery action
- User can retry profile selection without re-authentication
- Auth state preserved for subsequent attempts


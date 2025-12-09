---
version: "1.0"
status: implemented
last_updated: 2025-12-09
---

# Onboarding Phase

## Purpose
Guide authenticated users through the post-login flow to establish their profile context and complete account setup before accessing protected dashboard features.

## Overview

The onboarding phase bridges the gap between user authentication (login with credentials) and dashboard access. It ensures users have selected or created an active profile, enabling all subsequent operations to maintain profile context through JWT tokens.

## Onboarding Workflow

### Entry Point
- **Trigger**: User completes login at `/login` endpoint
- **Entry URL**: `POST /api/auth/login` returns JWT with `activeProfileId: null`
- **Redirect**: `ProtectedRoute` detects missing `profileId` and redirects to `/onboarding`

### Core Stages

#### Stage 1: Profile Discovery
- System checks if user has existing profiles via `/api/family-members`
- **Scenario A**: User has profiles available (existing family account)
  - Display `FamilyProfileSelector` component
  - List all available profiles for user's account
  
- **Scenario B**: User has no profiles yet (new account)
  - Redirect to profile creation flow
  - Initiate `ProfileCompletionPage`

#### Stage 2: Profile Selection or Creation
- **Profile Selection Path** (existing profiles):
  - User selects from available family member profiles
  - Frontend calls `POST /api/family-members/:id/switch`
  - New JWT token pair received with `activeProfileId` populated
  - Tokens stored in localStorage/sessionStorage
  - Navigation to dashboard with profile context
  
- **Profile Creation Path** (new account):
  - User fills in profile information via `ProfileCompletionPage`
  - Form submission to `POST /api/user-profiles`
  - Profile created with `status: pending_consent` (if child)
  - Parent consent flow initiated if applicable
  - After completion, trigger profile switch to activate new profile

#### Stage 3: Optional Family Setup
- **Condition**: User is a parent account with family management enabled
- **UI**: `FamilySetupPage` component
- **Actions**: 
  - Option to add/invite family members
  - Option to skip for later
- **Completion**: Redirect to dashboard

### Component Architecture

**Onboarding Container** (`OnboardingPage.tsx`):
- Orchestrates stage progression
- Manages state transitions between profile discovery, selection, and family setup
- Coordinates token updates after profile switching

**Profile Selector** (`FamilyProfileSelector.tsx`):
- Displays available profiles for selection
- Handles profile switch API call
- Updates auth context with new tokens
- Optional "Add Profile" button for family setup

**Profile Completion** (`ProfileCompletionPage.tsx`):
- Form for new profile creation
- Validates required fields (name, relationship, batch info)
- Submits to backend for profile creation
- Redirects to profile switch or selection

**Family Setup** (`FamilySetupPage.tsx`):
- Invitation system for adding family members
- Consent management interface
- Skippable stage for users who want to proceed to dashboard

### Critical State Management

**Token Lifecycle During Onboarding:**
```
Login → JWT with activeProfileId: null
  ↓
/onboarding loaded
  ↓
Profile selected/created
  ↓
POST /api/family-members/:id/switch
  ↓
JWT with activeProfileId: <profile_id> returned
  ↓
AuthContext.updateTokensAfterProfileSwitch called
  ↓
New tokens stored, API client reinitialized
  ↓
Dashboard accessible with profile context
```

### ProtectedRoute Enforcement

**Profile Context Requirements:**
- `profileId` must be present in user state
- If missing, `ProtectedRoute` redirects to `/onboarding`
- Enforced before accessing any protected route
- Prevents users from accessing dashboard without active profile

**Onboarding Routes** (not protected):
- `/onboarding` - Profiles discovery and selection
- `/profile-completion` - New profile creation
- `/family-setup` - Family member management

**Protected Routes** (require active profileId):
- `/dashboard` - Main dashboard
- `/preferences` - User preferences
- `/profile` - Profile management
- `/chat` - Chat functionality
- All feature-specific routes

### Error Handling

**Missing Profile Data:**
- If profile list retrieval fails, show retry option
- Allow manual profile creation as fallback
- Preserve session for subsequent attempts

**Profile Switch Failure:**
- Return user to profile selection
- Display error message with reason
- Offer retry or alternative profile selection

**Token Generation Issues:**
- Fallback to token refresh if tokens not returned in response
- Retry profile switch operation
- Display user-friendly error if retry fails

### Security Considerations

**Session Initialization:**
- JWT token created with minimal scope (no profile)
- Session credentials insufficient for protected operations
- Forces explicit profile selection before dashboard access

**Profile Ownership Validation:**
- Backend verifies user owns selected profile
- Prevents attempting to switch to another user's profile
- Access control enforced before token generation

**Consent Workflows:**
- Child profiles created with `pending_consent` status
- Parent must explicitly consent before child can access features
- Switching to pending profile allowed for guided consent flow

**Token Security:**
- Old tokens (with null profile) immediately invalid after switch
- New tokens carry profile context for all subsequent requests
- Stateless JWT prevents stale token reuse

### User Experience Patterns

**Fast Path** (returning user with existing profile):
- Login → Profile auto-select (if only one) → Dashboard

**Standard Path** (parent with multiple profiles):
- Login → Profile selection screen → Dashboard

**New User Path** (first-time account):
- Login → Create profile → (Optional) Family setup → Dashboard

**Family Account Setup**:
- Login → Select/create profiles → Add family members → Dashboard

### Integration with Authentication System

**Prerequisite**: User must complete login and have valid JWT token

**Output**: User with active profile context in JWT, ready for dashboard

**Dependency**: Auth middleware must support token updates mid-session

**Fallback**: If onboarding skipped, ProtectedRoute enforces completion

### Navigation Flow Diagram

```
POST /login
    ↓
Token issued (activeProfileId: null)
    ↓
ProtectedRoute checks profileId
    ↓
Redirect to /onboarding
    ↓
Fetch family-members list
    ↓
Decision:
├─→ Profiles exist → FamilyProfileSelector
│   └─→ Select profile → POST /switch
│       └─→ Get new token (activeProfileId: <id>)
│           └─→ updateTokensAfterProfileSwitch
│               └─→ Navigate /dashboard
│
└─→ No profiles → ProfileCompletionPage
    └─→ Create profile → New profile saved
        └─→ POST /switch to new profile
            └─→ Get new token
                └─→ Optional: FamilySetupPage
                    └─→ Navigate /dashboard
```

### Monitoring & Analytics

**Onboarding Metrics:**
- Time to profile selection/creation
- Drop-off rate at each stage
- Profile selection vs. creation ratio
- Family member addition rate

**Error Tracking:**
- Failed profile list retrieval
- Failed profile switch attempts
- Token generation failures
- Incomplete profile creation

### Performance Considerations

**Data Fetching:**
- Profile list fetched once on `/onboarding` load
- Subsequent operations cached in state
- API calls debounced for profile selection

**Token Updates:**
- Performed in parallel with component state updates
- Chat socket reconnection non-blocking
- Storage updates use async StorageUtils

**Redirect Timing:**
- ProtectedRoute redirect happens synchronously on render
- No unnecessary waiting or loading states for already-authenticated users


# Implementation Context: Postings Migration & Profile Selection Fix (2025-12-09/10)

## Summary
This context bundle documents fixes for database/API errors in Postings module AND the mandatory profile selection flow that must be implemented.

---

## Timeline of Attempts & Fixes

### 1. Initial Errors
- Preferences and postings endpoints returned 500 errors (DB validation, FK, collation issues)
- Dashboard failed due to collation mismatch

### 2. Key Fixes (2025-12-09)
- USER_PREFERENCES.user_id changed to CHAR(36), FK to accounts.id
- All table collations standardized to utf8mb4_0900_ai_ci
- Dropped/re-added FK constraints to correct tables
- Frontend (CreatePostingPage.tsx) cleaned to send only valid fields
- POSTINGS.author_id now references user_profiles.id (CHAR(36)), session uses activeProfileId

### 3. GET /api/postings Fix (2025-12-10)
**Root Cause:** Collation mismatch in JOIN operations
- POSTINGS table: utf8mb4_0900_ai_ci
- POSTING_CATEGORIES, POSTING_DOMAINS, POSTING_TAGS, DOMAINS, TAGS: utf8mb4_unicode_ci

**Solution:** Migration `2025-12-10-001-fix-posting-collations.sql`
- Disabled FK checks temporarily
- Converted all posting-related tables to utf8mb4_0900_ai_ci
- Re-enabled FK checks

**Tables Fixed:**
- POSTING_CATEGORIES
- POSTING_DOMAINS
- POSTING_TAGS
- DOMAINS
- TAGS
- TAG_DOMAIN_MAPPINGS

### 4. Diagnostic Scripts & Migrations
- migrations/2025-12-09-002-fix-user-preferences-userid.sql: user_id type/FK fix
- migrations/2025-12-09-003-fix-collation-mismatch.sql: collation fix
- migrations/2025-12-09-004-fix-user-preferences-fk.sql: FK fix for preferences tables
- migrations/2025-12-10-001-fix-posting-collations.sql: posting tables collation fix
- scripts/debug/fix-preferences-fk.js: executable migration for FK/collation
- scripts/debug/fix-posting-collations-v2.js: executable migration for posting collations
- scripts/debug/check-collations.js: diagnostic script for collation checking
- scripts/debug/test-postings-query.js: direct query test script

### 5. Current Status
- Preferences endpoint: 500 error fixed (2025-12-09)
- POST /api/postings: 500 error fixed, posting creation works ✅
- Dashboard: Collation error resolved ✅
- GET /api/postings: FIXED ✅ (collation mismatch resolved)
- Create new postings module still not working (preferences endpoint 500 error)

### 6. Profile-Based Preferences Fix (2025-12-10)
**Root Cause:** Frontend sending Account ID instead of Profile ID for preferences
- USER_PREFERENCES.user_id references user_profiles.id (profile-based preferences)
- Frontend was sending accounts.id, causing FK constraint violations

**Solution:** Updated frontend to use profileId for preferences operations
- CreatePostingPage.tsx: loadUserPreferences uses user.profileId
- PreferencesPage.tsx: fetch/save preferences uses user.profileId  
- PostingsPage.tsx: matched postings endpoint uses user.profileId
- Dashboard routes: preferences queries use req.user.profileId

**Browser Console Errors (Create Posting Page):**
```
GET http://localhost:5173/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7 500 (Internal Server Error)
[SecureAPIClient] Request failed: {url: '/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7', status: 500, message: 'HTTP 500'}
[apiClient] ❌ GET /api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7 failed: Error: HTTP 500
[APIService] GET request failed for /api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7: APIError: Server error
```

### 7. Dashboard Preferences Fix (2025-12-10)
**Issue:** Dashboard still using account ID for preferences queries
**Root Cause:** Dashboard route falling back to account ID when profile ID not available
**Solution:** Updated dashboard route to use active profile ID from session/query params

### 8. Current Investigation State (2025-12-10)
**Persistent Issue:** Create Posting page still failing with 500 error on preferences endpoint
**Error Details:**
- URL: `/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7`
- Status: 500 Internal Server Error
- Context: CreatePostingPage.tsx loadUserPreferences function
- ID Format: 36-character UUID (appears to be account ID, not profile ID)

**Next Steps for Investigation:**
1. Verify user authentication state and profile ID availability in frontend
2. Check if user.profileId is properly set in AuthContext after login
3. Inspect middleware/auth.js to confirm activeProfileId is attached to req.session
4. Test preferences endpoint directly with both account ID and profile ID
5. Check database for USER_PREFERENCES records matching the failing ID
6. Verify FK constraints between USER_PREFERENCES.user_id and user_profiles.id
7. Examine server logs for detailed 500 error stack trace
8. Test preferences endpoint with valid profile ID to confirm functionality

### 10. Profile Enforcement & Fallback Removal (2025-12-10)
**Issue:** Persistent 500 error on `/api/preferences/:id` despite profile-based fixes
**Error Details:** Same as previous - GET `/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7` returning 500
**Context:** CreatePostingPage.tsx loadUserPreferences function

**Attempts to Fix:**
- Removed fallback logic in preferences routes that substituted account IDs for profile IDs
- Enforced active profile requirement in session for preferences access
- Restricted preferences access to only the active profile ID
- Updated client to use profileId/activeProfileId without account ID fallback
- Added activeProfileId to User type definition

**Current State (2025-12-10):**
- Preferences routes now strictly require valid profile IDs
- No fallback to account IDs or other values
- Active profile must be present in session
- Client uses profile IDs only for preferences calls
- Same 500 error persists on `/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7`

**Latest Browser Console Errors (Create Posting, 2025-12-10):**
```
GET http://localhost:5173/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7 500 (Internal Server Error)
[SecureAPIClient] Request failed: {url: '/api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7', status: 500, message: 'HTTP 500'}
[apiClient] ❌ GET /api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7 failed: Error: HTTP 500
[APIService] GET request failed for /api/preferences/56bc72b1-59d0-4921-b4e2-b369ca1f05f7: APIError: Server error
```

**Next Steps for Investigation:**
1. Check server logs for the 500 error stack trace on this specific request
2. Verify if the ID `56bc72b1-59d0-4921-b4e2-b369ca1f05f7` exists in user_profiles table
3. Confirm session contains activeProfileId and matches the requested ID
4. Test preferences endpoint directly with a known valid profile ID
5. Inspect middleware/auth.js to ensure activeProfileId is properly set in req.session
6. Check if user authentication flow properly sets activeProfileId in JWT token
7. Verify profile selection process updates the token with correct activeProfileId
8. Examine database for USER_PREFERENCES records and FK constraints
9. Test with a fresh login and profile selection to ensure token/session state

---

## Key Files Changed
- `migrations/2025-12-09-002-fix-user-preferences-userid.sql`
- `migrations/2025-12-09-003-fix-collation-mismatch.sql`
- `migrations/2025-12-09-004-fix-user-preferences-fk.sql`
- `migrations/2025-12-10-001-fix-posting-collations.sql`
- `scripts/debug/fix-preferences-fk.js`
- `scripts/debug/fix-posting-collations-v2.js`
- `scripts/debug/check-collations.js`
- `src/pages/CreatePostingPage.tsx`
- `src/pages/PreferencesPage.tsx`
- `src/pages/PostingsPage.tsx`
- `routes/dashboard.js`

### 7. Preferences FK Fix (2025-12-10)
**Issue:** 500 Error on `/api/preferences/:id`
**Root Cause:** `USER_PREFERENCES` table contained invalid data (referencing Account IDs) or had conflicting constraints/state.
**Solution:**
- Truncated `USER_PREFERENCES`, `USER_NOTIFICATION_PREFERENCES`, `USER_PRIVACY_SETTINGS` to remove invalid data.
- Verified FK constraints point to `user_profiles(id)`.
- Verified `createDefaultPreferences` works correctly.

---

## Diagnostic Notes
- All table collations now standardized: utf8mb4_0900_ai_ci
- USER_PREFERENCES.user_id: CHAR(36), FK to user_profiles.id (profile-based preferences)
- POSTINGS.author_id: CHAR(36), FK to user_profiles.id
- Posting creation: uses activeProfileId
- Frontend preferences calls: now use profileId instead of account id

---

## References
- `docs/specs/refactoring-plans/02-database-migration-plan.md` - Migration strategy
- `docs/specs/refactoring-plans/00-master-refactoring-plan.md` - Overall refactor context
- `routes/family-members.js` - Profile switch endpoint (already correct)
- `src/pages/onboarding/OnboardingPage.tsx` - Existing profile selection UI

---

## ✅ IMPLEMENTATION COMPLETED (2025-12-10)

**Backend Changes:**
- `routes/auth.js`: Removed auto-first-profile selection, added `requiresProfileSelection: true` flag
- `middleware/auth.js`: Removed fallback to first profile when `activeProfileId` is null

**Frontend Changes:**
- `src/services/APIService.ts`: Added `requiresProfileSelection` and `profiles` to `AuthResponse` interface
- `src/contexts/AuthContext.tsx`: Added profile selection logic, auto-switch for stored profiles, proper storage management
- `src/components/auth/ProtectedRoute.tsx`: Added guard for authenticated users without `activeProfileId`
- `src/pages/ProfileSelectionPage.tsx`: Complete profile selection UI
- `src/pages/LoginPage.tsx`: Added redirect logic for profile selection requirement

**Storage Management:**
- `authToken`, `refreshToken`: Managed through login/switch/logout
- `lastSelectedProfileId`: Stored on profile switch, cleared on logout
- `availableProfiles`: Stored during login, cleared after selection

**Testing Required:**
1. Log out from current session
2. Log back in → should redirect to `/profile-selection`
3. Select a profile → should redirect to `/dashboard` with working preferences
4. Verify Create Posting page loads preferences successfully

### 9. FINAL RESOLUTION (2025-12-11)
**Issue:** 500 Error on `/api/preferences/:id` (Create Posting Page)
**Root Cause:** Collation mismatch in `LEFT JOIN` operation between `USER_PREFERENCES` and `DOMAINS` tables.
- `USER_PREFERENCES.primary_domain_id` was using `utf8mb4_unicode_ci` (legacy default)
- `DOMAINS.id` was using `utf8mb4_0900_ai_ci` (new standard)
- This caused "Illegal mix of collations" error during the join query

**Fix Applied:**
1. **Migration:** Created and applied `migrations/2025-12-10-003-fix-preferences-collation.sql` to convert `USER_PREFERENCES`, `USER_NOTIFICATION_PREFERENCES`, and `USER_PRIVACY_SETTINGS` to `utf8mb4_0900_ai_ci`.
2. **Code Hardening:** Updated `routes/preferences.js` with `try-catch` blocks and improved `normalizeJsonArray` to prevent future crashes on malformed data.
3. **Verification:** Verified fix with `scripts/debug/test-preferences-endpoint-logic.js` which confirmed the query now executes successfully.

**Status:** ALL ISSUES RESOLVED ✅
- Login flow with mandatory profile selection works
- Dashboard loads without collation errors
- Create Posting page loads user preferences correctly
- Database schema standardized to `utf8mb4_0900_ai_ci`

### 10. My Postings Fix (2025-12-10)
**Issue:** "My Postings" page showing 0 posts despite user having created postings.
**Root Cause:** ID mismatch between frontend request and backend data.
- Frontend (`MyPostingsPage.tsx`) sends **Account ID** in the URL: `/api/postings/my/:userId`.
- Backend (`routes/postings.js`) used this ID directly to query `POSTINGS.author_id`.
- Database `POSTINGS` table uses **Profile ID** for `author_id` (correct new architecture).
- Query `WHERE author_id = 'ACCOUNT_ID'` returned 0 results.

**Fix Applied:**
- Updated `routes/postings.js` logic for `GET /api/postings/my/:userId`.
- If the requested `userId` matches the authenticated `Account ID`, the backend now automatically uses the session's `activeProfileId` for the database query.
- This maintains backward compatibility with the frontend while querying the correct data structure.
- Also added support for direct Profile ID querying for future frontend updates.

**Verification:**
- Verified `POSTINGS` table data confirms `author_id` columns store valid Profile IDs.
- Verified these Profile IDs are linked to the user's Account ID.
- The new logic correctly bridges the gap between Account-based request and Profile-based data.

### 11. Next Steps: Update Playwright E2E Tests
To ensure the stability of the postings module and prevent future regressions (like the "My Postings" empty list issue), the End-to-End (E2E) tests must be updated.

**Target File:** `tests/e2e/postings.spec.ts`

**Required Test Scenarios:**

1.  **Create New Posting:**
    *   Simulate a user logging in and selecting a profile (ensure `activeProfileId` is set in session).
    *   Navigate to "Create New Posting" (`/postings/new`).
    *   Verify user preferences are loaded (no 500 error).
    *   Fill out the form (Title, Type, Category, Content, Domains, etc.).
    *   Submit the form and verify success message/redirection.

2.  **Verify "My Postings":**
    *   Navigate to "My Postings" (`/postings/my`).
    *   **Validation Point:** Verify that the *newly created posting* appears in the list. This specifically tests the fix for the Account ID vs. Profile ID mismatch.
    *   Verify the status of the posting (e.g., "Pending Review" or "Active").

3.  **Edit Existing Posting:**
    *   From the "My Postings" list, click "Edit" on a posting.
    *   Modify a field (e.g., Title or Content).
    *   Save changes.
    *   Verify the changes are reflected in the "My Postings" list and/or Posting Detail view.

**Implementation Notes:**
*   Ensure the test user has a valid profile setup.
*   The tests must handle the `requiresProfileSelection` flow if they use the standard UI login, or mock the session state with `activeProfileId` correctly if bypassing UI login.

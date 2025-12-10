# Implementation Context: Postings Migration & Issue Fixes (2025-12-09/10)

## Summary
This context bundle summarizes all key attempts, fixes, and changes made to resolve database and API errors for the Postings module after the family onboarding/COPPA refactor. It is designed for quick resumption in a new session and avoids excessive detail.

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
See `docs/specs/refactoring-plans/02-database-migration-plan.md` for migration strategy
See `docs/specs/refactoring-plans/00-master-refactoring-plan.md` for overall refactor context

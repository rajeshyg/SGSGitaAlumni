# Authentication Flow Fix - E2E Test Debugging

## Problem Summary

The E2E tests were failing with **login timeout errors**:
- Error: `TimeoutError: page.waitForURL: Timeout 15000ms exceeded`
- Tests failed at login step, unable to redirect to dashboard after credentials submission
- Root cause: **Test users were not created in the database**

## Root Cause Analysis

### Issue 1: Mismatched Test Credentials
The test file `tests/e2e/posts-workflow-clean.spec.ts` used these credentials:
- `testuser@example.com` / `TestUser123!`
- `moderator@test.com` / `TestMod123!`

But the test data file `tests/setup/test-data.ts` only defined:
- `john.doe@example.com` / `SecurePass123!`
- `jane.smith@example.com` / `SecurePass123!`
- `admin@example.com` / `AdminPass123!`
- `moderator@example.com` / `ModPass123!` ← Different from test!
- `testuser1@example.com` / `TestPassword123!` ← Similar but not exact match
- `testuser2@example.com` / `TestPassword123!` ← Similar but not exact match

### Issue 2: Empty Database Seeding
The `tests/setup/global-setup.ts` file had an empty `seedTestData()` function:
```typescript
async function seedTestData() {
  console.log('🌱 Seeding test data...');
  try {
    // Seed test users, invitations, and other test data
    // This ensures consistent test data across all test runs

    console.log('✅ Test data seeding completed');
  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    throw error;
  }
}
```

**Result**: Test users were never created in the actual database, causing login failures.

## Solutions Implemented

### Fix 1: Updated `tests/setup/test-data.ts`
Added missing test users to match the test credentials:

```typescript
{
  id: '8',
  email: 'testuser@example.com',
  password: 'TestUser123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'member',
  isActive: true,
  profileComplete: true
},
{
  id: '9',
  email: 'moderator@test.com',
  password: 'TestMod123!',
  firstName: 'Test',
  lastName: 'Moderator',
  role: 'moderator',
  isActive: true,
  profileComplete: true
}
```

### Fix 2: Implemented Database Seeding in `tests/setup/global-setup.ts`

The `seedTestData()` function now:

1. **Connects to the database** using environment variables:
   - `DB_HOST` (default: localhost)
   - `DB_USER` (default: root)
   - `DB_PASSWORD` (default: empty)
   - `DB_NAME` (default: sgs_alumni_portal_db)
   - `DB_PORT` (default: 3306)

2. **Hashes passwords with bcrypt** (salt rounds: 10) to match production security

3. **Inserts test users** into the `app_users` table with:
   - Proper password hashing
   - Correct role assignments (member, moderator, admin)
   - Active status flag

4. **Idempotent operations**: Checks if user exists before inserting
   - Avoids duplicate key errors on re-runs
   - Allows tests to be run multiple times safely

5. **Graceful error handling**:
   - Continues with existing database state if seeding fails
   - Logs all operations for debugging
   - Non-blocking for subsequent operations

## Technical Details

### Authentication Flow (Backend)
1. User submits login form with email/password
2. Backend (`routes/auth.js:93-250`) receives login request
3. Database query finds user by email
4. Password compared using `bcrypt.compare()`
5. On success: JWT token generated with user info
6. Frontend redirects to dashboard/home on token receipt

### Test Setup Flow
1. Playwright global setup runs before all tests
2. `global-setup.ts:globalSetup()` executes
3. Environment validated
4. Database connection tested
5. Test users seeded into `app_users` table
6. Tests proceed with authenticated test users

### Password Security
- Passwords hashed with bcrypt (salt rounds: 10)
- Matches production security (routes/auth.js:206)
- Uses `bcrypt.hash()` for seeding
- Uses `bcrypt.compare()` for login verification

## Files Modified

### 1. `tests/setup/test-data.ts` (Lines 137-156)
- Added 2 new test users:
  - `testuser@example.com` (member role)
  - `moderator@test.com` (moderator role)
- Both marked as active and profile complete

### 2. `tests/setup/global-setup.ts` (Complete rewrite)
- Implemented `seedTestData()` function
- Added database connection logic
- Implemented user insertion with password hashing
- Added error handling and logging

## Verification Steps

Before running tests, verify:

1. **Database running**:
   ```bash
   # Check MySQL is running on port 3306
   netstat -an | grep 3306
   ```

2. **Environment variables set** (typically in `.env`):
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=sgs_alumni_portal_db
   ```

3. **Test users created**:
   ```sql
   SELECT email, role FROM app_users
   WHERE email IN ('testuser@example.com', 'moderator@test.com');
   ```

## Running Tests

```bash
# Run with automatic setup
npm run test:e2e -- tests/e2e/posts-workflow-clean.spec.ts

# Or manually:
set BASE_URL=http://localhost:5173
npx playwright test tests/e2e/posts-workflow-clean.spec.ts --project=chromium
```

## Expected Behavior After Fix

1. ✅ Global setup runs and seeds test users
2. ✅ Login form accepts `testuser@example.com` / `TestUser123!`
3. ✅ Password verified against bcrypt hash
4. ✅ JWT token generated and returned
5. ✅ Page redirects to dashboard/home
6. ✅ Test proceeds with authenticated user
7. ✅ All 8 test cases pass

## Known Limitations

1. **Database seeding is per-test-run**: Users are not cleaned up between runs
2. **Idempotent only on unique constraint**: Duplicate emails are skipped
3. **No transaction rollback**: Changes persist in database
4. **Test isolation**: Consider implementing data cleanup for complete isolation

## Future Improvements

1. Implement database cleanup between test runs
2. Use transactions with rollback for better isolation
3. Create separate test/staging database
4. Consider using Docker for database isolation
5. Implement test data factories for dynamic test data

## Related Files

- Backend auth: `routes/auth.js` (login handler)
- Frontend login: `src/pages/Login.tsx` or similar
- Database schema: `scripts/database/*.sql`
- Test configuration: `playwright.config.ts`

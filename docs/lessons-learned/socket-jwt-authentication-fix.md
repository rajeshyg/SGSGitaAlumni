# Socket JWT Authentication Fix - Lessons Learned

**Date:** November 16, 2025
**Issue:** Socket.IO authentication failures with "invalid signature" error
**Impact:** 100% of WebSocket connections failed - chat system completely non-functional
**Resolution Time:** ~4 hours of investigation
**Root Cause:** ES6 import hoisting + module-level constant initialization

---

## The Problem

### Symptoms
Users attempting to connect to chat saw this error in browser console:
```
❌ Chat socket connection error: Error: Authentication error: JsonWebTokenError - invalid signature
```

**Critical Detail:** This happened on EVERY connection, even after:
- Restarting the server
- Clearing browser cache/localStorage
- Fresh login with new tokens
- Restarting the entire machine

### What We Thought vs. Reality

| What We Initially Thought | What It Actually Was |
|--------------------------|---------------------|
| Old expired tokens in localStorage | ❌ Fresh tokens were being generated |
| JWT_SECRET not loaded from .env | ❌ JWT_SECRET was loaded (but at wrong time) |
| Database connection issues | ❌ Database working perfectly |
| Code not committed | ❌ Code was present in working directory |

---

## Root Cause: The Timing Problem

### The Core Issue
Two files initialized `JWT_SECRET` at different times:

**`routes/auth.js` (Token Generation):**
- Initialized `JWT_SECRET` at **module load time** (during ES6 import hoisting)
- Ran BEFORE environment variables were fully available
- Fell back to: `'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'`

**`server/socket/chatSocket.js` (Token Verification):**
- Initialized `JWT_SECRET` at **runtime** (when function called)
- Ran AFTER environment variables were loaded
- Used correct value: `'your-super-secret-jwt-key-change-in-production'`

### The Execution Timeline

```
1. tsx starts loading server.js
   └─ Environment variables being loaded...

2. ES6 imports are HOISTED (run first, before any code)
   ├─ import { login } from './routes/auth.js'
   └─ routes/auth.js executes:
       const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-...'
       └─ process.env.JWT_SECRET is undefined! (not loaded yet)
       └─ Uses fallback: 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'

3. server.js line 4: dotenv.config() completes
   └─ NOW environment variables are fully available

4. server.js line 678: initializeChatSocket(server) called
   └─ chatSocket.js executes:
       const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-...'
       └─ process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-in-production' ✓
       └─ Uses correct secret!
```

### The Evidence (From Server Logs)

**Token Generation (routes/auth.js):**
```javascript
[Auth] 🔑 JWT token generated: {
  JWT_SECRET_preview: 'dev-only-s...',  // ← WRONG!
  JWT_SECRET_source: 'process.env.JWT_SECRET'
}
```

**Token Verification (chatSocket.js):**
```javascript
[Chat Socket] ❌ JWT verification failed: {
  errorName: 'JsonWebTokenError',
  errorMessage: 'invalid signature',
  JWT_SECRET_preview: 'your-super...',  // ← CORRECT!
  JWT_SECRET_source: 'process.env.JWT_SECRET'
}
```

**The smoking gun:** Two different secrets!

---

## The Solution: Lazy Initialization

### What We Changed

**Before (Module-Level Constant - WRONG):**
```javascript
// routes/auth.js - Lines 12-24
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'development'
    ? 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'
    : null
);

// Later...
jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
```

**After (Lazy Initialization - CORRECT):**
```javascript
// routes/auth.js - Lines 16-36
let JWT_SECRET = null;

function getJwtSecret() {
  // Initialize on first access (runtime, not module load time)
  if (JWT_SECRET === null) {
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
    }

    JWT_SECRET = process.env.JWT_SECRET || (
      process.env.NODE_ENV === 'development'
        ? 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'
        : null
    );

    if (!JWT_SECRET) {
      throw new Error('FATAL: JWT_SECRET not configured. Set JWT_SECRET environment variable.');
    }
  }

  return JWT_SECRET;
}

// Later...
jwt.sign(tokenPayload, getJwtSecret(), { expiresIn: '24h' });
```

### Why This Works

**Lazy initialization** delays the secret retrieval until **runtime** (when the function is called), not module load time. By the time `getJwtSecret()` is called:
1. ✅ Server has fully started
2. ✅ `dotenv.config()` has completed
3. ✅ Environment variables are available
4. ✅ `process.env.JWT_SECRET` has the correct value

---

## Files Modified

### Commits
1. **bb65169** - Add comprehensive JWT token diagnostics
   - Added detailed logging to `routes/auth.js` (token generation)
   - Added detailed logging to `server/socket/chatSocket.js` (token verification)
   - This revealed the secret mismatch

2. **5bb8c28** - Implement lazy initialization for JWT_SECRET
   - Converted `routes/auth.js` to use `getJwtSecret()` function
   - Updated all 7 `jwt.sign()` and `jwt.verify()` calls
   - Updated debug logging to use getter function

### Changed Files
```
routes/auth.js                   - Lazy initialization + diagnostic logs
server/socket/chatSocket.js      - Enhanced error logging
```

---

## How to Prevent This Again

### 1. Always Use Lazy Initialization for Environment-Dependent Constants

**DON'T DO THIS:**
```javascript
// ❌ BAD: Module-level initialization
const SECRET_KEY = process.env.SECRET_KEY || 'fallback';
const DATABASE_URL = process.env.DATABASE_URL;
```

**DO THIS INSTEAD:**
```javascript
// ✅ GOOD: Lazy initialization with getter function
let SECRET_KEY = null;

function getSecretKey() {
  if (SECRET_KEY === null) {
    SECRET_KEY = process.env.SECRET_KEY || 'fallback';
  }
  return SECRET_KEY;
}

// Usage: jwt.sign(payload, getSecretKey())
```

### 2. Add Diagnostic Logging for Critical Configuration

When initializing secrets or critical config, log:
```javascript
console.log('[Config] JWT_SECRET loaded:', {
  source: process.env.JWT_SECRET ? 'environment' : 'fallback',
  preview: JWT_SECRET.substring(0, 10) + '...',  // Never log full secret!
  timestamp: new Date().toISOString()
});
```

### 3. Enhanced Error Messages

**DON'T DO THIS:**
```javascript
// ❌ BAD: Generic error that hides the real issue
catch (error) {
  next(new Error('Authentication error: Invalid token'));
}
```

**DO THIS INSTEAD:**
```javascript
// ✅ GOOD: Detailed error with context
catch (error) {
  console.error('[Auth] JWT verification failed:', {
    errorName: error.name,           // 'JsonWebTokenError', 'TokenExpiredError', etc.
    errorMessage: error.message,     // 'invalid signature', 'jwt expired', etc.
    tokenPreview: token.substring(0, 20) + '...',
    JWT_SECRET_source: process.env.JWT_SECRET ? 'env' : 'fallback'
  });

  next(new Error(`Authentication error: ${error.name} - ${error.message}`));
}
```

### 4. Understand ES6 Import Hoisting

**Key Principle:** ES6 `import` statements are hoisted and executed BEFORE any other code in the file, including:
- `dotenv.config()`
- Module-level variable assignments
- Any other initialization code

If you need environment variables in an imported module:
- Use lazy initialization (getter functions)
- OR use dynamic imports (`await import()`) after env is loaded
- OR create a config module that's explicitly loaded first

### 5. Test with Fresh Tokens

When debugging authentication:
1. Clear browser localStorage/sessionStorage
2. Login again (generate fresh token)
3. Check server logs for both token generation AND verification
4. Compare the secret previews - they must match!

---

## Testing Verification

### Before Fix (Broken)
```bash
# Login generates token
[Auth] JWT token generated: JWT_SECRET_preview: 'dev-only-s...'

# Socket connection fails
[Chat Socket] ❌ JWT verification failed: {
  errorName: 'JsonWebTokenError',
  errorMessage: 'invalid signature',
  JWT_SECRET_preview: 'your-super...'
}
```

### After Fix (Working)
```bash
# Login generates token
[Auth] JWT token generated: JWT_SECRET_preview: 'your-super...'

# Socket connection succeeds
[Chat Socket] ✅ Token verified successfully: {
  userId: 6,
  email: 'testuser1@example.com',
  exp: '2025-11-17T23:58:48.000Z'
}
```

### Manual Test Results (Nov 16, 2025)
- ✅ Two users logged in successfully
- ✅ Socket.IO connections authenticated
- ✅ Real-time message exchange working
- ✅ Typing indicators functional
- ✅ Response times: <500ms (message send ~300-480ms)
- ✅ No authentication errors in console

---

## Key Takeaways

### What Worked
✅ **Systematic debugging** - Added detailed logging first to identify the issue
✅ **Industry-standard solution** - Lazy initialization is the professional approach
✅ **Minimal changes** - Only touched configuration, not business logic
✅ **Comprehensive testing** - Verified with multiple users and scenarios

### What We Learned
1. **ES6 import hoisting is real** - Imports execute before `dotenv.config()`
2. **Environment variable timing matters** - Can't assume they're available at module load
3. **Generic errors hide issues** - Detailed logging is critical for diagnosis
4. **Lazy initialization is standard** - Used by professional Node.js applications

### Time Investment
- **Problem discovery:** 10 minutes (user reported error)
- **Initial investigation:** 2 hours (checking tokens, cache, restarts)
- **Root cause identification:** 1 hour (added logging, found mismatch)
- **Solution implementation:** 30 minutes (lazy initialization)
- **Testing and verification:** 30 minutes (manual testing with 2 users)
- **Total:** ~4 hours

### Prevention Cost vs. Fix Cost
- **Prevention:** Adding lazy initialization from the start = 5 minutes
- **Fix:** Debugging and fixing after deployment = 4 hours
- **Ratio:** 48x more expensive to fix than prevent!

---

## References

### Related Documentation
- [Task 7.10: Chat System](../progress/phase-7/task-7.10-chat-system.md)
- [INVITATION-TIMEOUT-FIX-SUMMARY.md](../../INVITATION-TIMEOUT-FIX-SUMMARY.md) - Different issue, similar debugging approach

### Code Locations
- `routes/auth.js:18-36` - JWT_SECRET lazy initialization
- `server/socket/chatSocket.js:16-28` - JWT_SECRET configuration
- `server/socket/chatSocket.js:69-81` - Enhanced error logging

### Related Commits
- `bb65169` - Add comprehensive JWT token diagnostics
- `5bb8c28` - Implement lazy initialization for JWT_SECRET to fix signature mismatch

---

## Checklist for Similar Issues

If you encounter "invalid signature" or JWT errors:

- [ ] Check server logs for both token generation AND verification
- [ ] Compare JWT_SECRET preview values - do they match?
- [ ] Verify environment variables are loaded before secret initialization
- [ ] Check for ES6 import hoisting issues (module-level constants)
- [ ] Test with fresh tokens (clear localStorage, login again)
- [ ] Look for timing differences between token generation and verification
- [ ] Add detailed error logging (error name, message, secret source)
- [ ] Consider lazy initialization for environment-dependent config

---

**Status:** ✅ RESOLVED
**Resolution:** Lazy initialization pattern implemented
**Verification:** Manual testing with 2 users successful
**Production Ready:** Yes

*Never again.*

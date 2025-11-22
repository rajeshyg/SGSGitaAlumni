# Code Quality Audit Report
**SGS Gita Alumni Platform**
**Date:** 2025-11-18
**Branch:** `claude/audit-code-patterns-01RNtVMBNcraX22ZgXHNfTaf`

---

## Executive Summary

This audit identified **68 distinct issues** across the codebase that require attention:

| Severity | Count | Category |
|----------|-------|----------|
| 🔴 **Critical** | 11 | Transaction isolation, SQL injection, secret exposure |
| 🟠 **High** | 23 | Connection handling, N+1 queries, race conditions |
| 🟡 **Medium** | 27 | Error handling, code quality, performance |
| ⚪ **Low** | 7 | Code style, maintainability |

---

## 🔴 Critical Issues

### 1. Transaction Isolation Violations

**Problem:** Service methods called within transactions create their own database connections, breaking transaction isolation.

**Location:** `src/services/StreamlinedRegistrationService.js:223-374`

```javascript
// ❌ PROBLEM
await connection.beginTransaction();
const validation = await this.validateInvitationWithAlumniData(token);
// validateInvitationWithAlumniData creates its OWN connection (line 58)
```

**Impact:**
- Validation runs on different connection than transaction
- Changes in transaction not visible to validation
- Race conditions and data inconsistencies
- Cannot rollback validation operations

**Files Affected:**
- `src/services/StreamlinedRegistrationService.js` (2 methods)
- `src/services/AlumniDataIntegrationService.js` (nested calls)
- `server/services/chatService.js` (all 15 methods)
- `services/FamilyMemberService.js` (all 11 methods)

**Fix Required:** Refactor services to accept optional `connection` parameter

---

### 2. SQL Injection via String Interpolation

**Problem:** LIMIT/OFFSET clauses use string concatenation instead of parameterized queries.

**Locations:**
- `routes/postings.js:169-171, 282-283`
- `routes/alumni.js:168, 326`
- `server/services/chatService.js:635-638`

```javascript
// ❌ VULNERABLE
query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

// ✅ FIX
query += ' LIMIT ? OFFSET ?';
params.push(parseInt(limit) || 20, parseInt(offset) || 0);
```

**Risk:** SQL injection if `parseInt()` fails or receives malicious input

---

### 3. Sensitive Data Exposure in Logs

**Problem:** JWT secrets and OTP codes logged to console.

**Locations:**
- `routes/auth.js:268-278` - JWT_SECRET preview logged
- `routes/otp.js:639, 156-157` - Actual OTP codes logged

```javascript
// ❌ CRITICAL SECURITY ISSUE
console.log('[Auth] 🔑 JWT token generated:', {
    JWT_SECRET_preview: jwtSecret ? `${jwtSecret.substring(0, 10)}...` : 'undefined',
    tokenPreview: `${token.substring(0, 20)}...`
});

console.log(`[TEST OTP] Generated OTP ${otpCode} for ${email}`);
```

**Action:** Remove ALL logging of secrets and tokens immediately

---

### 4. FamilyMemberService Non-Atomic Operations

**Problem:** Multiple database operations without transaction.

**Location:** `services/FamilyMemberService.js:64-149`

```javascript
// Operation 1: Insert family member
const [result] = await db.execute(`INSERT INTO FAMILY_MEMBERS...`);

// Operation 2: Update parent account (SEPARATE CONNECTION!)
await db.execute(`UPDATE app_users SET is_family_account = TRUE...`);

// Operation 3: Fetch created member (ANOTHER CALL!)
const [members] = await db.execute('SELECT * FROM FAMILY_MEMBERS...');
```

**Impact:** If operation 2 or 3 fails, operation 1 already committed → inconsistent state

---

## 🟠 High Severity Issues

### 5. ChatService - No Transaction Support

**Problem:** ALL 15 ChatService methods lack connection parameter support.

**Location:** `server/services/chatService.js`

**Affected Methods:**
- createConversation
- getConversations
- getConversationById
- sendMessage
- getMessages
- editMessage
- deleteMessage
- addReaction / removeReaction
- addParticipant / removeParticipant
- markAsRead / archiveConversation
- getGroupConversationByPostingId
- getDirectConversationByPostingAndUsers

**Current Pattern:**
```javascript
async function createConversation(userId, data) {
  const connection = await getPool().getConnection();
  // ⚠️ NO option to accept injected connection
}
```

**Impact:** Cannot be used within transactions, impossible to implement atomic multi-step operations

---

### 6. N+1 Query Problem - Chat Conversations

**Location:** `server/services/chatService.js:287-357`

```javascript
const [conversations] = await connection.execute(conversationSQL);

for (const conv of conversations) {
    // N queries for last message
    const [lastMessage] = await connection.execute(`SELECT...`);
    // N more queries for participants
    const [participants] = await connection.execute(`SELECT...`);
}
```

**Impact:** 20 conversations = 41 queries (1 + 20×2)

**Fix:** Use JSON aggregation in single query

---

### 7. N+1 Query Problem - Messages

**Location:** `server/services/chatService.js:640-682`

```javascript
const [messages] = await connection.execute(`SELECT...`);
for (const msg of messages) {
    const [reactions] = await connection.execute(
        `SELECT * FROM MESSAGE_REACTIONS WHERE message_id = ?`
    );
}
```

**Impact:** 50 messages = 51 queries

---

### 8. Connection Leaks in Error Paths

**Problem:** Missing `finally` blocks for connection.release()

**Locations:**
- `routes/alumni.js:373-486`
- `routes/invitations.js` (multiple locations)

```javascript
// ❌ PROBLEM
const connection = await pool.getConnection();
try {
    // operations
    if (error) {
        await connection.rollback();
        connection.release();
        return res.status(404).json({ error: 'Not found' });
    }
} catch (error) {
    await connection.rollback();
    connection.release();
}
// ⚠️ NO finally block - leaks if error thrown before catch
```

**Fix:** Always use `finally` block for connection.release()

---

### 9. Race Condition in OTP Generation

**Location:** `routes/otp.js:104-128`

```javascript
const [existingOtps] = await connection.execute(`SELECT...`);
if (existingOtps.length > 0) {
    await connection.execute(`UPDATE OTP_TOKENS SET is_used = TRUE...`);
}
// ⚠️ No transaction or SELECT FOR UPDATE
```

**Impact:** Concurrent requests could create duplicate valid OTPs

**Fix:** Use transaction with `SELECT FOR UPDATE`

---

## 🟡 Medium Severity Issues

### 10. Swallowed Exceptions in JSON Parsing

**Locations:**
- `routes/postings.js:186-203, 390-407`
- `routes/invitations.js:66-87`

```javascript
try {
    domains = JSON.parse(posting.domains);
} catch (e) {
    console.error('Failed to parse domains JSON:', posting.domains);
    // ⚠️ Error swallowed - continues with empty array
}
```

**Impact:** Silent data corruption, users see incomplete data

---

### 11. Inconsistent Error Response Formats

**Problem:** Some endpoints return `{ error: '...' }`, others use `ApiError` format

**Impact:** Frontend cannot reliably parse errors

**Fix:** Standardize on ApiError format throughout

---

### 12. Code Quality Issues

| Issue | Count | Files |
|-------|-------|-------|
| Excessive console.log usage | 261 occurrences | 17 route files |
| Magic numbers/strings | Multiple | All route files |
| Long functions (>100 lines) | 8+ | routes/auth.js, routes/postings.js |
| God object (ChatService) | 1314 lines | server/services/chatService.js |

---

## 📊 Summary by File

### Most Critical Files Requiring Immediate Attention

1. **`src/services/StreamlinedRegistrationService.js`**
   - Transaction isolation violations
   - Nested service calls with separate connections

2. **`server/services/chatService.js`**
   - No transaction support (15 methods)
   - N+1 query problems (2 instances)
   - God object (1314 lines)

3. **`services/FamilyMemberService.js`**
   - Non-atomic multi-step operations
   - All methods use global DB without transaction support

4. **`routes/auth.js`**
   - JWT_SECRET exposure in logs
   - Long login function (190 lines)

5. **`routes/otp.js`**
   - OTP codes logged
   - Race condition in OTP generation
   - Test endpoint available

6. **`routes/postings.js`** & **`routes/alumni.js`**
   - SQL injection in LIMIT/OFFSET
   - Connection leaks in error paths

---

## Recommended Patterns

### ✅ Transaction Management Pattern

```javascript
async serviceMethod(params, connection = null) {
  const conn = connection || await this.pool.getConnection();
  const shouldManageConnection = !connection;
  let transactionStarted = false;

  try {
    if (shouldManageConnection) {
      await conn.beginTransaction();
      transactionStarted = true;
    }

    // Business logic here

    if (shouldManageConnection && transactionStarted) {
      await conn.commit();
    }

    return result;
  } catch (error) {
    if (shouldManageConnection && transactionStarted) {
      await conn.rollback();
    }
    throw error;
  } finally {
    if (shouldManageConnection) {
      conn.release();
    }
  }
}
```

### ✅ Error Handling Pattern

```javascript
try {
  // operations
} catch (error) {
  logger.error('Operation failed', { context, error });
  throw new ApiError.serverError('Operation failed');
} finally {
  if (connection) connection.release();
}
```

---

## Priority Action Items

### This Week (Critical)
1. Remove JWT_SECRET and OTP logging
2. Fix SQL injection in LIMIT/OFFSET clauses
3. Add finally blocks for connection.release()
4. Fix OTP race condition

### This Month (High)
1. Refactor services to accept connection parameters
2. Fix N+1 query problems
3. Implement structured logging
4. Standardize error handling

### This Quarter (Medium)
1. Break down god objects
2. Refactor long functions
3. Add comprehensive tests
4. Replace magic numbers with constants

---

**End of Report**

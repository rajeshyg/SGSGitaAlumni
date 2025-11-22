# Quick Action Plan
**SGS Gita Alumni Platform - Code & File Cleanup**
**Date:** 2025-11-18

> **Note:** Review corresponding audit reports before executing:
> - [CODE_QUALITY_AUDIT.md](./CODE_QUALITY_AUDIT.md)
> - [DUPLICATE_FILES_AUDIT.md](./DUPLICATE_FILES_AUDIT.md)

---

## Phase 1: Immediate Actions (5 minutes)

### 🔴 Critical Security Fixes (DO FIRST)

#### 1.1 Remove Secret Logging
**Files to Edit:**
- `routes/auth.js:268-278` - Remove JWT_SECRET logging
- `routes/otp.js:639, 156-157` - Remove OTP code logging

**Action:**
```bash
# Review and remove these console.log statements manually
# Search for these patterns:
grep -n "JWT_SECRET" routes/auth.js
grep -n "Generated OTP" routes/otp.js
```

---

#### 1.2 Delete Outdated Stub Files
**Safe to delete immediately:**

```bash
# Service stubs (TypeScript versions exist)
rm src/services/EmailService.js
rm src/services/AlumniDataIntegrationService.js
rm src/services/StreamlinedRegistrationService.js

# Security & monitoring stubs
rm src/lib/security/HMACTokenService.js
rm src/lib/monitoring/server.js

# Old backup
rm server/routes/moderation-old-backup-nov4.js
```

**Verification:**
```bash
# Verify .ts versions exist before deleting
ls -lh src/services/EmailService.ts
ls -lh src/services/AlumniDataIntegrationService.ts
ls -lh src/services/StreamlinedRegistrationService.ts
ls -lh src/lib/security/HMACTokenService.ts
ls -lh src/lib/monitoring/server.ts
```

---

## Phase 2: SQL Injection Fixes (30 minutes)

### 🔴 Fix String Interpolation in Queries

**Files to Edit:**

#### 2.1 routes/postings.js
**Lines: 169-171, 282-283, 635-638**

```javascript
// BEFORE (VULNERABLE):
query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

// AFTER (SECURE):
query += ' LIMIT ? OFFSET ?';
params.push(parseInt(limit) || 20, parseInt(offset) || 0);
```

---

#### 2.2 routes/alumni.js
**Lines: 168, 326**

Same fix as above - replace string interpolation with parameterized queries.

---

#### 2.3 server/services/chatService.js
**Lines: 282-283, 635-638**

Same fix as above.

**Test After Changes:**
```bash
# Run your test suite
npm test

# Test the affected endpoints manually
node scripts/test/test-api-quick.js
```

---

## Phase 3: Connection Leak Fixes (1 hour)

### 🟠 Add Finally Blocks

**Files to Edit:**
- `routes/alumni.js:373-486`
- `routes/invitations.js` (multiple locations)

**Pattern to Apply:**

```javascript
// BEFORE:
const connection = await pool.getConnection();
try {
    // operations
    if (error) {
        await connection.rollback();
        connection.release();  // ❌ Early release
        return res.status(404).json({ error: 'Not found' });
    }
} catch (error) {
    await connection.rollback();
    connection.release();  // ❌ May not be reached
}

// AFTER:
const connection = await pool.getConnection();
try {
    // operations
    if (error) {
        await connection.rollback();
        return res.status(404).json({ error: 'Not found' });
    }
} catch (error) {
    await connection.rollback();
    throw error;
} finally {
    connection.release();  // ✅ Always releases
}
```

---

## Phase 4: File Organization (1-2 hours)

### 📂 Reorganize Root-Level Scripts

**Execute these commands in order:**

#### 4.1 Create Directory Structure
```bash
mkdir -p scripts/{archive/{backups,user-specific},database/{check,cleanup,inspect,migrations},dev/{debug,setup},test}
```

---

#### 4.2 Move Archive Files
```bash
# User-specific scripts
mv check-jayanthi-*.js scripts/archive/user-specific/
mv check-duplicate-jayanthi.js scripts/archive/user-specific/
mv cleanup-duplicate-jayanthi.js scripts/archive/user-specific/
```

---

#### 4.3 Move Database Scripts
```bash
# Check scripts
mv check-*.js scripts/database/check/

# Cleanup scripts (except jayanthi - already moved)
mv cleanup-*.js scripts/database/cleanup/

# Migrations
mv fix-collation-ultimate.js scripts/database/migrations/
mv migrate-*.js scripts/database/migrations/
mv run-*-migration.js scripts/database/migrations/
mv recreate-fk.js scripts/database/migrations/
mv reset-test-passwords.js scripts/database/migrations/

# Inspection scripts
mv show-*.js scripts/database/inspect/
```

---

#### 4.4 Move Development Scripts
```bash
# Setup scripts
mv create-*.js scripts/dev/setup/

# Debug scripts
mv diagnose-*.js scripts/dev/debug/
mv debug-*.js scripts/dev/debug/
mv investigate-*.js scripts/dev/debug/
```

---

#### 4.5 Move Test Scripts
```bash
# Move all test scripts
mv test-*.js scripts/test/
```

---

#### 4.6 Delete Obsolete Scripts (After Moving)
```bash
# Delete duplicate collation fixes (keeping ultimate version)
cd scripts/database/migrations
rm fix-all-collations.js fix-app-users-collation.js fix-preferences-collation.js
cd ../../..

# Delete one-off test verification scripts
cd scripts/test
rm test-archive-fix.js test-fixed-moderation-query.js
cd ../..

# Delete OTP clearing duplicates (after creating consolidated version)
rm clear-otp-tokens.js clear-old-otp-tokens.js clear-admin-otp.js
```

---

## Phase 5: Code Refactoring (Multiple Sprints)

### Week 1: Service Layer Refactoring

#### 5.1 StreamlinedRegistrationService
**File:** `src/services/StreamlinedRegistrationService.js`

**Task:** Add connection parameter to methods
- `validateInvitationWithAlumniData(token, connection = null)`
- `handleIncompleteAlumniData(token, additionalInfo, connection = null)`
- `completeStreamlinedRegistration(token, additionalInfo, connection = null)`

---

#### 5.2 AlumniDataIntegrationService
**File:** `src/services/AlumniDataIntegrationService.js`

**Task:** Add connection parameter
- `fetchAlumniDataForInvitation(email, connection = null)`

---

#### 5.3 FamilyMemberService
**File:** `services/FamilyMemberService.js`

**Task:**
1. Add connection parameter to all 11 methods
2. Wrap multi-step operations in transactions
3. Replace `db.execute()` with connection-based approach

---

### Week 2: ChatService Refactoring

#### 5.4 ChatService - All Methods
**File:** `server/services/chatService.js`

**Task:** Add optional connection parameter to all 15 methods:
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

**Pattern:**
```javascript
async function methodName(params, connection = null) {
  const conn = connection || await getPool().getConnection();
  const shouldRelease = !connection;

  try {
    // existing logic
  } finally {
    if (shouldRelease) conn.release();
  }
}
```

---

### Week 3: Performance Optimization

#### 5.5 Fix N+1 Query - Conversations
**File:** `server/services/chatService.js:287-357`

**Task:** Replace loop queries with JSON aggregation

---

#### 5.6 Fix N+1 Query - Messages
**File:** `server/services/chatService.js:640-682`

**Task:** Bulk fetch reactions instead of per-message queries

---

### Week 4: Code Quality Improvements

#### 5.7 Implement Structured Logging
**Task:** Replace 261 console.log statements with structured logger

**Steps:**
1. Install winston or pino: `npm install winston`
2. Create logger configuration
3. Replace console.log throughout codebase
4. Configure log levels per environment

---

#### 5.8 Extract Magic Numbers
**Task:** Create constants file

**File to Create:** `config/constants.js`
```javascript
module.exports = {
  DB_CONNECTION_TIMEOUT_MS: 10000,
  DEFAULT_INVITATION_EXPIRY_DAYS: 7,
  DEFAULT_MAX_POSTINGS: 5,
  OTP_EXPIRY_MINUTES: 5,
  MAX_SEARCH_QUERY_LENGTH: 100,
  DEFAULT_PAGE_SIZE: 20,
};
```

---

## Verification Checklist

After each phase, verify:

### ✅ Phase 1 Verification
- [ ] No JWT_SECRET in logs
- [ ] No OTP codes in logs
- [ ] Stub .js files deleted
- [ ] .ts versions still exist
- [ ] Application starts successfully

### ✅ Phase 2 Verification
- [ ] All LIMIT/OFFSET use parameterized queries
- [ ] No string interpolation in SQL
- [ ] Tests pass
- [ ] Endpoints return correct results

### ✅ Phase 3 Verification
- [ ] All database operations have finally blocks
- [ ] Connection pool metrics show no leaks
- [ ] Load testing doesn't exhaust connections

### ✅ Phase 4 Verification
- [ ] Root directory clean (only essential files)
- [ ] Scripts organized in proper folders
- [ ] README updated with new script locations
- [ ] Package.json scripts updated if needed

### ✅ Phase 5 Verification (Per Week)
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] No regression in functionality
- [ ] Code review completed
- [ ] Documentation updated

---

## Rollback Plan

If issues arise after any phase:

### Immediate Rollback
```bash
# Undo file deletions (if within git history)
git checkout HEAD -- <file-path>

# Revert code changes
git diff HEAD
git checkout -- <file-with-issues>

# Revert entire commit
git revert <commit-hash>
```

### Safe Practice
- Create feature branch for each phase
- Test thoroughly before merging to main
- Keep backups of deleted files for 1 sprint
- Monitor error logs after each deployment

---

## Progress Tracking

| Phase | Status | Assignee | Completion Date |
|-------|--------|----------|-----------------|
| Phase 1: Immediate Actions | ⬜ Not Started | | |
| Phase 2: SQL Injection Fixes | ⬜ Not Started | | |
| Phase 3: Connection Leaks | ⬜ Not Started | | |
| Phase 4: File Organization | ⬜ Not Started | | |
| Phase 5.1: StreamlinedRegistrationService | ⬜ Not Started | | |
| Phase 5.2: AlumniDataIntegrationService | ⬜ Not Started | | |
| Phase 5.3: FamilyMemberService | ⬜ Not Started | | |
| Phase 5.4: ChatService | ⬜ Not Started | | |
| Phase 5.5: N+1 Queries | ⬜ Not Started | | |
| Phase 5.6: Code Quality | ⬜ Not Started | | |

---

**End of Action Plan**

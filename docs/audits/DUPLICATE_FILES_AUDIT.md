# Duplicate Files Audit Report
**SGS Gita Alumni Platform**
**Date:** 2025-11-18
**Branch:** `claude/audit-code-patterns-01RNtVMBNcraX22ZgXHNfTaf`

---

## Executive Summary

**Findings:**
- ✅ **5 JavaScript/TypeScript pairs** - .js files are outdated stubs (DELETE)
- ✅ **1 old backup file** - Can be safely deleted
- 🔄 **15+ utility script duplicates** - Consolidate functionality
- 📂 **87 root-level scripts** - Reorganize into proper structure
- ❌ **6 false positives** - Same name, different purpose (KEEP BOTH)

**Impact:**
- ~25 files ready for immediate deletion
- ~65 files to reorganize
- Improved maintainability and clarity

---

## Part 1: True Duplicates - Safe to Delete

### 1.1 JavaScript Stub Files

These .js files are outdated stubs; the .ts versions have full implementations.

#### Service Stubs (DELETE IMMEDIATELY)

| File to DELETE | Size | Reason | Keep Instead | Size |
|----------------|------|--------|--------------|------|
| `src/services/EmailService.js` | 1.7K | Console.log stub only | `src/services/EmailService.ts` | 12K |
| `src/services/AlumniDataIntegrationService.js` | 3.8K | Basic stub | `src/services/AlumniDataIntegrationService.ts` | 5.6K |
| `src/services/StreamlinedRegistrationService.js` | 14K | Test data stub | `src/services/StreamlinedRegistrationService.ts` | 15K |

**Command:**
```bash
rm src/services/EmailService.js
rm src/services/AlumniDataIntegrationService.js
rm src/services/StreamlinedRegistrationService.js
```

---

#### Security & Monitoring Stubs (DELETE IMMEDIATELY)

| File to DELETE | Size | Reason | Keep Instead | Size |
|----------------|------|--------|--------------|------|
| `src/lib/security/HMACTokenService.js` | 1.9K | Basic impl | `src/lib/security/HMACTokenService.ts` | 3.2K |
| `src/lib/monitoring/server.js` | 2.0K | Stub | `src/lib/monitoring/server.ts` | 8.9K |

**Command:**
```bash
rm src/lib/security/HMACTokenService.js
rm src/lib/monitoring/server.js
```

---

### 1.2 Old Backup Files

| File | Date | Keep Instead |
|------|------|--------------|
| `server/routes/moderation-old-backup-nov4.js` | Nov 4, 2024 | `server/routes/moderation-new.js` |

**Command:**
```bash
rm server/routes/moderation-old-backup-nov4.js
```

**Alternative:** Move to `scripts/archive/backups/` if you prefer to keep backups

---

## Part 2: Duplicate Utility Scripts (Consolidate)

### 2.1 OTP Token Scripts (3 Duplicates)

**Current State:**

| File | Purpose |
|------|---------|
| `clear-otp-tokens.js` | Clears ALL tokens for an email |
| `clear-old-otp-tokens.js` | Clears tokens older than 10 minutes |
| `clear-admin-otp.js` | Hardcoded for specific admin email |

**Recommendation:**
1. Create consolidated `scripts/dev/clear-otp.js` with CLI args
2. Delete all three original files

**New Usage:**
```bash
node scripts/dev/clear-otp.js <email> [--all|--old-only]
```

**Commands After Creating Consolidated Script:**
```bash
rm clear-otp-tokens.js
rm clear-old-otp-tokens.js
rm clear-admin-otp.js
```

---

### 2.2 Collation Fix Scripts (4 Files)

**Current State:**

| File | Size | Coverage |
|------|------|----------|
| `fix-collation-ultimate.js` | 4.7K | ✅ **Most comprehensive** |
| `fix-all-collations.js` | 4.1K | Basic |
| `fix-app-users-collation.js` | 4.9K | app_users table only |
| `fix-preferences-collation.js` | 4.8K | preferences table only |

**Recommendation:**
- **KEEP:** `fix-collation-ultimate.js` (most comprehensive)
- **DELETE:** Other 3 files (likely already applied)

**Commands:**
```bash
# Move the keeper to proper location
mkdir -p scripts/database/migrations
mv fix-collation-ultimate.js scripts/database/migrations/

# Delete the others
rm fix-all-collations.js
rm fix-app-users-collation.js
rm fix-preferences-collation.js
```

---

### 2.3 Collation Check Scripts (4 Files)

**Current Files:**
- `check-collations.js` - Basic check
- `check-join-collations.js` - JOIN-specific
- `check-refresh-collations.js` - Refresh token specific
- `check-moderation-status-collation.js` - Moderation specific

**Recommendation:**
Create single consolidated script with table selection parameter, then delete all 4.

**Commands (after creating consolidated script):**
```bash
rm check-collations.js
rm check-join-collations.js
rm check-refresh-collations.js
rm check-moderation-status-collation.js
```

---

### 2.4 Test Scripts (23 Files in Root)

**Duplicate Chat Tests (Consolidate These 3 → 1):**
- `test-chat-api.js`
- `test-chat-fixes.js`
- `test-chat-conversation-fix.js`

**One-off Fix Verification (Delete These 2):**
- `test-archive-fix.js`
- `test-fixed-moderation-query.js`

**All Other Test Scripts (Move to scripts/test/):**

| Category | Files |
|----------|-------|
| API Tests | test-api-quick.js, test-auth-refresh.js, test-family-api.js, test-feed-api.js, test-moderation-api.js, test-preferences-api.js |
| Flow Tests | test-invitation-flow.js, test-login.js, test-otp-login-flow.js, test-refresh-simple.js |
| Service Tests | test-email-service.js, test-family-service-direct.js, test-hmac-generation.js |
| Feature Tests | test-health.js, test-queue-schema.js, test-send-invitation.js, test-socket-connection.js |

**Commands:**
```bash
mkdir -p scripts/test

# Move all test-*.js files
mv test-*.js scripts/test/

# Delete duplicates and one-offs
cd scripts/test
rm test-chat-fixes.js test-chat-conversation-fix.js
rm test-archive-fix.js test-fixed-moderation-query.js
cd ../..
```

---

### 2.5 Check Scripts (25 Files in Root)

#### User-Specific (Archive - 3 Files)
- `check-jayanthi-email.js`
- `check-jayanthi-invitations.js`
- `check-duplicate-jayanthi.js`

#### Schema Checks (Consider Consolidating - 3 Files)
- `check-alumni-schema.js`
- `check-invitations-schema.js`
- `check-postings-schema.js`

#### General Checks (Organize - 19 Files)
All other `check-*.js` files

**Commands:**
```bash
# Archive user-specific
mkdir -p scripts/archive/user-specific
mv check-jayanthi-*.js scripts/archive/user-specific/
mv check-duplicate-jayanthi.js scripts/archive/user-specific/

# Move remaining to organized location
mkdir -p scripts/database/check
mv check-*.js scripts/database/check/
```

---

### 2.6 Cleanup Scripts (6 Files)

| File | Purpose |
|------|---------|
| `cleanup-all-duplicates.js` | Generic duplicate cleanup |
| `cleanup-duplicate-jayanthi.js` | User-specific (ARCHIVE) |
| `cleanup-duplicate-otps.js` | OTP duplicates |
| `cleanup-old-invitations.js` | Old invitations |
| `cleanup-test-data.js` | Test data |
| `cleanup-truncated-invitations.js` | Truncated invitations |

**Commands:**
```bash
mkdir -p scripts/database/cleanup

# Move all cleanup scripts
mv cleanup-*.js scripts/database/cleanup/

# Archive user-specific
mv scripts/database/cleanup/cleanup-duplicate-jayanthi.js scripts/archive/user-specific/
```

---

### 2.7 Utility Scripts by Category (18 Files)

#### Setup Scripts (5 Files)
- `create-test-moderator.js`
- `create-access-log-table.js`
- `create-fresh-invitation.js`
- `create-test-refresh-user.js`
- `create-test-postings.js`

**Command:**
```bash
mkdir -p scripts/dev/setup
mv create-*.js scripts/dev/setup/
```

---

#### Debug Scripts (5 Files)
- `diagnose-moderation-500.js`
- `diagnose-db-performance.js`
- `debug-preferences.js`
- `investigate-db-schema.js`

**Command:**
```bash
mkdir -p scripts/dev/debug
mv diagnose-*.js debug-*.js investigate-*.js scripts/dev/debug/
```

---

#### Migration Scripts (7 Files)
- `migrate-invitation-token-size.js`
- `migrate-test-accounts-to-family.js`
- `run-add-is-group-migration.js`
- `run-add-archived-status-migration.js`
- `run-unique-group-chat-migration.js`
- `recreate-fk.js`
- `reset-test-passwords.js`

**Command:**
```bash
mkdir -p scripts/database/migrations
mv migrate-*.js run-*-migration.js recreate-fk.js reset-test-passwords.js scripts/database/migrations/
```

---

#### Inspection Scripts (2 Files)
- `show-tables.js`
- `show-family-members-structure.js`

**Command:**
```bash
mkdir -p scripts/database/inspect
mv show-*.js scripts/database/inspect/
```

---

## Part 3: False Positives - Keep Both

These files have similar names but serve **different purposes**:

### ✅ FamilyMemberService (KEEP BOTH)
- `services/FamilyMemberService.js` (10K) - **Backend database service**
- `src/services/familyMemberService.ts` (5.8K) - **Frontend API client**
- **Reason:** Different layers (backend DB vs frontend API)

---

### ✅ EmailService Utils (KEEP BOTH)
- `utils/emailService.js` - **Backend Nodemailer/SES implementation**
- `src/services/EmailService.ts` - **Frontend API client wrapper**
- **Reason:** Different implementations for different contexts

---

### ✅ Logger Files (KEEP ALL THREE)
- `utils/logger.js` (2.9K) - Server logger with sanitization
- `src/utils/logger.js` (767B) - Simple factory function
- `src/utils/logger.ts` (1.5K) - TypeScript logger with history
- **Reason:** Different use cases and contexts

---

### ✅ API Files (KEEP ALL THREE)
- `src/services/APIService.ts` (1267 lines) - Main API service
- `src/services/api.ts` (3 lines) - Re-export wrapper
- `src/lib/api.ts` (216 lines) - API client wrapper
- **Reason:** Different purposes in architecture

---

## Recommended Final Structure

```
SGSGitaAlumni/
├── scripts/
│   ├── archive/
│   │   ├── backups/
│   │   │   └── moderation-old-backup-nov4.js
│   │   └── user-specific/
│   │       ├── check-jayanthi-*.js (3 files)
│   │       └── cleanup-duplicate-jayanthi.js
│   ├── database/
│   │   ├── check/
│   │   │   └── check-*.js (consolidated, ~20 files)
│   │   ├── cleanup/
│   │   │   └── cleanup-*.js (5 files)
│   │   ├── inspect/
│   │   │   └── show-*.js (2 files)
│   │   └── migrations/
│   │       ├── fix-collation-ultimate.js
│   │       └── migrate-*, run-*.js (~7 files)
│   ├── dev/
│   │   ├── debug/
│   │   │   └── diagnose-*, debug-*, investigate-* (5 files)
│   │   ├── setup/
│   │   │   └── create-*.js (5 files)
│   │   └── clear-otp.js (consolidated)
│   └── test/
│       ├── chat-tests.js (consolidated)
│       └── test-*.js (~18 files)
├── src/
│   ├── services/  (TypeScript only - .js stubs deleted)
│   └── lib/       (TypeScript only - .js stubs deleted)
└── (existing structure)
```

---

## Summary Statistics

| Category | Count | Action |
|----------|-------|--------|
| **JS/TS Duplicate Pairs** | 5 | DELETE .js, keep .ts |
| **Old Backups** | 1 | DELETE or archive |
| **OTP Scripts** | 3 | CONSOLIDATE to 1 |
| **Collation Fixes** | 4 | KEEP 1, delete 3 |
| **Collation Checks** | 4 | CONSOLIDATE to 1 |
| **Test Scripts** | 23 | MOVE & consolidate 3 |
| **Check Scripts** | 25 | ORGANIZE by purpose |
| **Cleanup Scripts** | 6 | MOVE to proper location |
| **Utility Scripts** | 18 | ORGANIZE by category |
| **False Positives** | 6 pairs | KEEP BOTH |

**Total Impact:**
- **Files to Delete:** ~25
- **Files to Reorganize:** ~65
- **Space Saved:** ~50KB
- **Maintainability:** Significantly improved

---

**End of Report**

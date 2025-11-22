# Structure & Duplication Prevention - Technical Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
applies_to: all
enforcement: required
---
```

## Goal
Prevent code, file, and data duplication through strict validation rules and automated cleanup mechanisms.

## Code References
- **Validation**: `scripts/validation/validate-structure.js`
- **Cleanup**: `scripts/validation/cleanup-duplicates.js`

## Strict Rules

### 1. One Technical Flow Document per Module
**Rule**: Each module must have exactly ONE `.mmd` (Mermaid) file

**Modules**:
- authentication, user-management, directory, postings
- messaging, dashboard, moderation, notifications, rating

**Location**: `docs/design/{module}.mmd`

**Enforcement**:
```bash
# Run validation
node scripts/validation/validate-structure.js

# Fails if multiple .mmd files exist for same module
```

### 2. One Playwright Test File per Module
**Rule**: Each module should have ONE comprehensive E2E test file

**Location**: `tests/e2e/{module}.spec.ts`

**Allowed test files**:
- `auth.spec.ts` - Authentication flows
- `dashboard.spec.ts` - Dashboard functionality
- `postings.spec.ts` - Posting CRUD and workflows
- `chat.spec.ts` - Messaging functionality
- `moderation.spec.ts` - Moderation workflows

**Consolidation required for**:
- Multiple posting tests → consolidate to `postings.spec.ts`
- Multiple chat tests → consolidate to `chat.spec.ts`

### 3. No Duplicate Files by Content
**Rule**: No two files should have identical content

**Detection**:
- MD5 hash comparison
- Minimum file size: 100 bytes

**Common violations**:
- `.js` stub files when `.ts` exists
- Copy-pasted utilities
- Backup files

### 4. No Similar File Names
**Rule**: Avoid files with same base name in different locations

**Examples to fix**:
- `src/services/EmailService.js` vs `src/services/EmailService.ts`
- `utils/logger.js` vs `src/utils/logger.ts`

**Resolution**: Keep TypeScript version, delete JavaScript stub

### 5. Database Duplicate Prevention
**Rule**: All INSERT operations must handle duplicates

**Patterns to use**:
```sql
-- Option 1: Upsert
INSERT INTO table (col1, col2) VALUES (?, ?)
ON DUPLICATE KEY UPDATE col2 = VALUES(col2)

-- Option 2: Ignore duplicates
INSERT IGNORE INTO table (col1, col2) VALUES (?, ?)

-- Option 3: Explicit check
SELECT COUNT(*) FROM table WHERE unique_col = ?
-- Only INSERT if count = 0
```

**Required unique constraints**:
- `app_users.email`
- `invitations.token`
- `postings.id`
- `conversations.id`

## Validation Scripts

### Pre-commit Hook
Add to `.husky/pre-commit`:
```bash
#!/bin/sh
node scripts/validation/validate-structure.js
```

### CI/CD Integration
Add to GitHub Actions:
```yaml
- name: Validate Structure
  run: node scripts/validation/validate-structure.js
```

### Manual Cleanup
```bash
# Preview what would be removed
node scripts/validation/cleanup-duplicates.js

# Actually remove duplicates
node scripts/validation/cleanup-duplicates.js --execute
```

## Folder Structure Rules

### Allowed Top-Level Directories
```
SGSGitaAlumni/
├── src/                 # Frontend source
├── routes/              # Backend routes
├── services/            # Backend services
├── server/              # Server-specific code
├── tests/               # Test files
├── scripts/             # Utility scripts
├── docs/                # Documentation
├── config/              # Configuration
└── public/              # Static assets
```

### Documentation Structure
```
docs/
├── specs/               # Current specs (source of truth)
├── lessons-learned/     # Historical knowledge
├── audits/              # Code audits
├── fixes/               # Bug fix documentation
└── archive/             # Deprecated docs
```

### Forbidden Patterns
- ❌ Backup files in source (e.g., `file-backup.js`, `file-old.js`)
- ❌ Multiple versions (e.g., `service-v1.js`, `service-v2.js`)
- ❌ User-specific scripts in root (e.g., `check-jayanthi.js`)
- ❌ Scattered guidelines (use `docs/specs/` instead)

## Acceptance Criteria
- [ ] Validation script runs without errors
- [ ] No duplicate files by content hash
- [ ] One .mmd per module
- [ ] One playwright test per module
- [ ] Pre-commit hook installed
- [ ] CI pipeline includes validation

## Running Validation
```bash
# Full validation
node scripts/validation/validate-structure.js

# Expected output:
# ✅ All validations passed!
# 📊 Summary: 0 errors, 0 warnings
```

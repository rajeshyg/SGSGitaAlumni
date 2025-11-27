---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Pre-Commit Validation

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Git pre-commit hooks that validate code before allowing commits
implementation: .husky/pre-commit
---
```

## Overview

**Purpose**: Final quality gate before code enters git history

**Location**: `.husky/pre-commit`

**When**: Runs automatically on `git commit`

---

## Validation Steps

### 1. Project Structure Validation
**Script**: `scripts/core/validate-structure.cjs`
**Checks**:
- Required directories exist
- File organization compliance
- No files in wrong locations

### 2. Documentation Validation
**Script**: `scripts/core/check-documentation.js`
**Checks**:
- Documentation standards compliance
- Required docs exist
- No broken links

### 3. ESLint Checks
**Tool**: ESLint
**Checks**:
- Code style compliance
- No mock data (`no-mock-data.js` rule)
- TypeScript errors

**Note**: Currently bypassed due to 1425 errors (needs cleanup)

### 4. Redundancy Detection
**Script**: `scripts/validation/check-redundancy.js`
**Checks**:
- Duplicate files
- Copy-paste patterns (via `jscpd`)
- Redundant implementations

### 5. Mock Data Detection
**Script**: `scripts/core/detect-mock-data.js`
**Purpose**: Detect fake production code (NOT test mocking)

**IMPORTANT**: Test files are **exempted**. Using mock data in tests is correct.

**Detects in Production Code Only**:
- `faker` usage in non-test files
- `Math.random()` in production code
- Mock data patterns (hardcoded fake data)
- Variables named `mock*` in components/services

---

## Bypassing Pre-Commit

**When allowed**:
```bash
git commit --no-verify -m "docs: update README (no-verify, intentional)"
```

**Use sparingly**: Only for:
- Documentation-only changes
- Urgent hotfixes (fix validation in next commit)
- Known false positives

**Never bypass for**: Production code, security changes, database migrations

---

## Exit Codes

- `0`: All checks passed, commit allowed
- `1`: Warnings, commit allowed (should fix)
- `2`: Errors, commit blocked (must fix)

---

## Troubleshooting

### Problem: Pre-commit fails on redundancy
**Solution**: Remove duplicate file or add to whitelist

### Problem: Pre-commit fails on mock data
**Solution**: 
- If in **production code**: Remove fake/hardcoded data and use real API calls
- If in **test files**: This shouldn't happen - test files are exempt. Check file naming (must include `.test.`, `.spec.`, or be in `__tests__/`)

### Problem: Pre-commit fails on ESLint
**Solution**: Fix ESLint errors or run `npm run lint:fix`

---

## Integration

**Installed via**: Husky (`.husky/pre-commit`)

**Scripts location**: `scripts/validation/` and `scripts/core/`

**Configuration**: `.husky/pre-commit`, `package.json` scripts

---

**Related**: [Real-Time Validation](./real-time-validation.md) - Catch issues earlier

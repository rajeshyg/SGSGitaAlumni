---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Validation Scripts Catalog

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: reference
description: Catalog of all validation scripts and their usage
---
```

## Overview

**Purpose**: Central reference for all validation scripts in the project

**Organization**: `scripts/validation/` and `scripts/core/`

---

## Framework Validation Scripts

### check-redundancy.js
**Location**: `scripts/validation/check-redundancy.js`
**Purpose**: Detect duplicate files and copy-paste patterns
**Used By**: Pre-commit hooks
**Exit Codes**:
- `0`: No duplicates found
- `1`: Warnings (similar files)
- `2`: Errors (exact duplicates)

**Usage**:
```bash
node scripts/validation/check-redundancy.js
```

**Integration**: `jscpd` for copy-paste detection

---

### check-file-locations.cjs
**Location**: `scripts/validation/check-file-locations.cjs`
**Purpose**: Enforce file organization standards
**Used By**: Pre-commit hooks (recommended)
**Exit Codes**:
- `0`: All files in correct locations
- `1`: Warnings (should move but not blocking)
- `2`: Errors (must move, blocks commit)

**Usage**:
```bash
node scripts/validation/check-file-locations.cjs
```

**Checks**:
- SQL files outside migrations/ or schema/
- HTML files in root or src/
- Shell scripts in root
- Check/test scripts in wrong locations
- Generated files not in .gitignore

**Reference**: `docs/specs/technical/file-organization.md`

---

### detect-mock-data.js
**Location**: `scripts/core/detect-mock-data.js`
**Purpose**: Find fake/mock data patterns in **production code only**
**Used By**: Pre-commit hooks

**IMPORTANT**: This script **exempts test files** (`.test.`, `.spec.`, `__tests__/`, etc.)
Test files using mock data, fixtures, and faker is expected and correct.

**Detects in Production Code**:
- `faker` library usage (should only be in tests)
- `Math.random()` for generating IDs (use proper IDs from DB)
- Mock data patterns (hardcoded arrays that should come from APIs)
- Variables named `mock*` in production components

**Usage**:
```bash
node scripts/core/detect-mock-data.js
```

---

### validate-structure.cjs
**Location**: `scripts/core/validate-structure.cjs`
**Purpose**: Validate project structure compliance
**Used By**: Pre-commit hooks, CI/CD
**Checks**:
- Required directories exist
- Files in correct locations
- No root-level clutter

**Usage**:
```bash
node scripts/core/validate-structure.cjs
```

---

### audit-framework.cjs
**Location**: `scripts/validation/audit-framework.cjs`
**Purpose**: Audit framework implementation completeness
**Generates**: Reports on feature status, spec coverage
**Output**: `docs/FEATURE_MATRIX.md`

**Usage**:
```bash
node scripts/validation/audit-framework.cjs
```

---

## Code Quality Scripts

### audit-code-quality.cjs
**Location**: `scripts/validation/audit-code-quality.cjs`
**Purpose**: Generate code quality metrics
**Checks**:
- File sizes
- Code complexity
- Dead code

**Usage**:
```bash
node scripts/validation/audit-code-quality.cjs
```

---

### audit-documentation.cjs
**Location**: `scripts/validation/audit-documentation.cjs`
**Purpose**: Audit documentation completeness
**Checks**:
- Required docs exist
- Spec coverage
- Link validity

**Usage**:
```bash
node scripts/validation/audit-documentation.cjs
```

---

### check-documentation.js
**Location**: `scripts/core/check-documentation.js`
**Purpose**: Validate documentation standards
**Used By**: Pre-commit hooks
**Checks**:
- YAML frontmatter format
- Required sections
- Cross-links

**Usage**:
```bash
node scripts/core/check-documentation.js
```

---

## Planned Hook Scripts

### check-file-duplication.js *(planned)*
**Location**: `scripts/validation/hooks/pre-tool-use/check-file-duplication.js`
**Purpose**: Check for duplicates BEFORE creating files
**Used By**: `.claude/hooks/pre-tool-use.sh`
**Exit 2**: Blocks file creation if duplicate exists

---

### validate-sql-query.js *(planned)*
**Location**: `scripts/validation/hooks/pre-tool-use/validate-sql-query.js`
**Purpose**: Validate SQL queries for injection risks
**Used By**: `.claude/hooks/pre-tool-use.sh`
**Exit 2**: Blocks if string concatenation detected

---

### check-security-pattern.js *(planned)*
**Location**: `scripts/validation/hooks/pre-tool-use/check-security-pattern.js`
**Purpose**: Detect security anti-patterns
**Used By**: `.claude/hooks/pre-tool-use.sh`
**Checks**:
- Logging sensitive data
- Trusting client claims
- Missing rate limiting

---

### validate-service-size.js *(planned)*
**Location**: `scripts/validation/hooks/pre-tool-use/validate-service-size.js`
**Purpose**: Enforce 300-line service limit
**Used By**: `.claude/hooks/pre-tool-use.sh`
**Exit 2**: Blocks if service exceeds 300 lines

---

### validate-connection-cleanup.js *(planned)*
**Location**: `scripts/validation/hooks/post-tool-use/validate-connection-cleanup.js`
**Purpose**: Ensure try/finally for connections
**Used By**: `.claude/hooks/post-tool-use.sh`
**Exit 2**: Blocks if missing try/finally

---

### check-n-plus-one-queries.js *(planned)*
**Location**: `scripts/validation/hooks/post-tool-use/check-n-plus-one-queries.js`
**Purpose**: Detect N+1 query patterns
**Used By**: `.claude/hooks/post-tool-use.sh`
**Warns**: If query inside loop detected

---

## NPM Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "validate": "npm run validate:structure && npm run validate:docs && npm run validate:quality",
    "validate:structure": "node scripts/core/validate-structure.cjs",
    "validate:docs": "node scripts/core/check-documentation.js",
    "validate:quality": "node scripts/validation/check-redundancy.js && node scripts/core/detect-mock-data.js",
    "audit": "npm run audit:framework && npm run audit:code && npm run audit:docs",
    "audit:framework": "node scripts/validation/audit-framework.cjs",
    "audit:code": "node scripts/validation/audit-code-quality.cjs",
    "audit:docs": "node scripts/validation/audit-documentation.cjs"
  }
}
```

---

## Integration Map

```
Development
  ↓
Claude Hooks (real-time)
  ├─ Pre-Tool-Use scripts
  └─ Post-Tool-Use scripts
  ↓
Pre-Commit Hooks (final gate)
  ├─ check-redundancy.js
  ├─ detect-mock-data.js
  ├─ validate-structure.cjs
  └─ check-documentation.js
  ↓
CI/CD (GitHub Actions)
  ├─ All pre-commit scripts
  ├─ ESLint
  ├─ Tests
  └─ Build validation
  ↓
Audits (on-demand)
  ├─ audit-framework.cjs
  ├─ audit-code-quality.cjs
  └─ audit-documentation.cjs
```

---

**Related**:
- [Pre-Commit Validation](./pre-commit-validation.md)
- [Real-Time Validation](./real-time-validation.md)
- [Development Framework](../development-framework/)

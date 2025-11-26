# Project Structure Manifest

```yaml
---
version: 1.0
status: proposed
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Single source of truth for ALL project structure rules - files, folders, naming, and exceptions
---
```

## Executive Summary

This manifest addresses the ROOT CAUSES of structural chaos:

1. **Synonym Problem** → Standardized vocabulary with canonical mappings
2. **Missing Centralization** → Single authoritative manifest
3. **Exception Chaos** → Explicit exception registry with justifications
4. **Scope Gaps** → Full project coverage, not isolated rules

---

## Part 1: Standardized Vocabulary (Synonym Resolution)

### Script Action Names

**CANONICAL**: Use only these terms

| Canonical Term | Purpose | Synonyms to AVOID |
|----------------|---------|-------------------|
| `validate` | Enforce rules, block on failure | ~~check~~, ~~verify~~, ~~audit~~, ~~test~~ |
| `audit` | Generate reports, don't block | ~~check~~, ~~scan~~, ~~analyze~~ |
| `detect` | Find patterns, return results | ~~check~~, ~~scan~~, ~~find~~ |

**Mapping Table**:
```
check-*       → validate-* (if blocking) or detect-* (if not)
verify-*      → validate-*
audit-*       → audit-* (keep for reports only)
diagnose-*    → debug-* (move to scripts/debug/)
investigate-* → debug-* (move to scripts/debug/)
show-*        → debug-* or audit-*
```

### Folder Locations

| Canonical Location | Purpose | FORBIDDEN Alternatives |
|-------------------|---------|------------------------|
| `scripts/validation/` | All validation scripts | ~~scripts/core/validate-*~~, ~~scripts/core/check-*~~ |
| `scripts/debug/` | Diagnostic/investigation scripts | ~~scripts/database/check-*~~, ~~scripts/archive/check/*~~ |
| `scripts/database/` | Schema, migrations, data ops | ~~root check-*.js for DB~~ |
| `src/services/` | Frontend API services | ~~services/~~ (root), ~~src/lib/services/~~ |
| `server/services/` | Backend business logic | ~~services/~~ (root) |

### Data Terminology

| Canonical Term | Use For | Synonyms to AVOID |
|----------------|---------|-------------------|
| `mock` | Test fixtures in test files | ~~fake~~, ~~stub~~, ~~fallback~~ (in production) |
| `fixture` | Test data in test directories | ~~mock data~~, ~~test data~~, ~~sample data~~ |
| `fallback` | Default values in production | NOT for fake data |

---

## Part 2: Canonical Folder Registry

### Root Level

```
/
├── .claude/                 # Claude Code (AI assistant config)
├── .husky/                  # Git hooks
├── config/                  # Shared configuration
├── docs/                    # All documentation
├── migrations/              # Database migrations (SQL)
├── middleware/              # Express middleware
├── routes/                  # Express route handlers
├── scripts/                 # Utility scripts (by category)
├── server/                  # Backend business logic
├── src/                     # Frontend source code
├── tests/                   # All test files
├── public/                  # Static assets
├── eslint-rules/            # Custom ESLint rules
├── terraform/               # Infrastructure as code
├── backups/                 # Database backups (gitignored)
├── redis/                   # Redis configuration
├── test-results/            # Test output (gitignored)
├── playwright-report/       # Playwright reports (gitignored)
└── [config files]           # See allowed list below
```

### Allowed Root Files (Exhaustive List)

```yaml
always_allowed:
  - README.md
  - claude.md
  - index.html
  - package.json
  - package-lock.json
  - server-package.json
  - server.js
  - tsconfig.json
  - tsconfig.node.json
  - vite.config.js
  - vite.config.ts
  - eslint.config.js
  - tailwind.config.js
  - postcss.config.js
  - playwright.config.ts
  - vitest.config.ts
  - docker-compose.yml
  - Dockerfile
  - nginx.conf
  - .gitignore
  - .dockerignore
  - .prettierrc
  - .jscpd.json

conditional_allowed:
  - dump.rdb: "Redis persistence (consider gitignore)"
  
system_generated:
  - eslint-output.json: "Should be gitignored"
  - lint-violations.json: "Should be gitignored"
  - nul: "Windows null device artifact - delete"

forbidden:
  - "*.sql": "Move to migrations/"
  - "*.sh": "Move to scripts/deployment/"
  - "*.ps1": "Move to scripts/deployment/"
  - "check-*.js": "Move to scripts/validation/"
  - "test-*.js": "Move to tests/"
  - "fix-*.js": "Archive or delete"
```

### Scripts Directory (Canonical)

```yaml
scripts/:
  validation/:
    purpose: "Validation scripts that block commits"
    naming: "validate-*.cjs"
    contents:
      - validate-structure.cjs      # Canonical structure validator
      - validate-file-locations.cjs # File placement rules
      - validate-theme-compliance.js
      - deployment-validation.cjs
      - run-full-audit.cjs          # Orchestrator for audits
    
  audit/:
    purpose: "Audit scripts that generate reports (non-blocking)"
    naming: "audit-*.cjs"
    contents:
      - audit-framework.cjs
      - audit-code-quality.cjs
      - audit-documentation.cjs
      # Merged from separate scripts:
      # - audit-file-organization.cjs → MERGE INTO validate-structure
      # - audit-root-clutter.cjs → MERGE INTO validate-structure
  
  database/:
    purpose: "Database operations"
    subfolders:
      migrations/: "SQL migration files"
      schema/: "Schema definitions"
    scripts: "Data operations (backfill, link, execute)"
    
  deployment/:
    purpose: "Deployment and infrastructure"
    contents: "*.sh, *.ps1 deployment scripts"
    
  debug/:
    purpose: "Diagnostic scripts organized by feature"
    subfolders:
      matching/: "Matching system debug"
      preferences/: "Preferences debug"
      database/: "Database diagnostics"
      postings/: "Postings debug"
    # NOTE: All check-* from scripts/database/ move here
    
  core/:
    purpose: "ONLY core infrastructure"
    allowed:
      - delayed-vite.js
      - kill-port.js
      - check-ports.js
    forbidden:
      - validate-*.cjs  # → scripts/validation/
      - check-redundancy.js  # → scripts/validation/detect-redundancy.cjs
      - check-documentation.js  # → scripts/validation/validate-documentation.cjs
      - detect-mock-data.js  # Keep (matches canonical naming)
    
  archive/:
    purpose: "Historical/deprecated scripts"
    rule: "Only archive, never reference from active code"
```

### Source Code (`src/`)

```yaml
src/:
  components/:
    purpose: "Reusable React components"
    
  pages/:
    purpose: "Page-level components (routed)"
    
  hooks/:
    purpose: "Custom React hooks"
    
  contexts/:
    purpose: "React context providers"
    
  services/:
    purpose: "Frontend API service layer"
    rule: "ONLY place for frontend services"
    # NO services/ at root level
    # NO src/lib/services/
    
  utils/:
    purpose: "Frontend utility functions"
    
  types/:
    purpose: "TypeScript type definitions"
    
  lib/:
    purpose: "Third-party integrations, API clients"
    forbidden:
      - "*.sql"
      - "*.html"
      - "README.md in empty folders"
      - "database/ folder with only README"
    
  assets/:
    purpose: "Images, fonts, static assets"
    
  test/:
    purpose: "Test utilities, setup, fixtures"
    # Actual tests go in tests/ (root)
```

### Server Code (`server/`)

```yaml
server/:
  services/:
    purpose: "Backend business logic"
    rule: "< 300 lines per file"
    
  middleware/:
    purpose: "Express middleware"
    
  routes/:
    purpose: "Server-side route handlers (if not using routes/)"
    
  socket/:
    purpose: "Socket.IO handlers"
    
  errors/:
    purpose: "Custom error classes"
```

### Documentation (`docs/`)

```yaml
docs/:
  specs/:
    functional/: "Feature specifications (by module)"
    technical/: "Technical standards (by domain)"
    context/: "AI context files (always-on.md)"
    templates/: "Spec templates"
    workflows/: "Feature workflow documentation"
    
  diagrams/:
    database/: "ER diagrams, Mermaid visualizations"
    architecture/: "System architecture"
    flows/: "User flows, sequence diagrams"
    mermaid/: "Mermaid source files and HTML"
    
  audits/:
    purpose: "Audit reports"
    
  reports/:
    purpose: "Generated reports (consider gitignore)"
    system_generated:
      - FEATURE_MATRIX.md
      - generated-status-report.html
    
  archive/:
    purpose: "Deprecated/historical documentation"
    rule: "No active references to archive/"
    
  context-bundles/:
    purpose: "Session continuity bundles"
    
  fixes/:
    purpose: "Fix summaries"
    
  lessons-learnt/:
    purpose: "Post-mortems and learnings"
```

---

## Part 3: Exception Registry

### Registered Exceptions

| Exception | Location | Justification | Review Date |
|-----------|----------|---------------|-------------|
| `FEATURE_MATRIX.md` | `docs/` | System-generated, StatusDashboard | 2025-12-26 |
| `generated-status-report.html` | `docs/` | System-generated, StatusDashboard | 2025-12-26 |
| `dump.rdb` | root | Redis persistence | 2025-12-26 |
| `services/FamilyMemberService.js` | root | **LEGACY - MUST FIX** | URGENT |
| `src/lib/database/README.md` | src/lib/database/ | **ORPHAN - DELETE** | URGENT |
| `playwright.config.ts` | root | Playwright convention | N/A |
| `vitest.config.ts` | root | Vitest convention | N/A |

### Exception Request Process

1. Add to `exception-requests.md` (new file)
2. Justify why standard location doesn't work
3. Get approval via PR review
4. Add to this manifest with review date
5. Re-evaluate on review date

---

## Part 4: Consolidated Validation Script

### Current State (Fragmented)

```
scripts/core/validate-structure.cjs     # 643 lines - spec structure, duplicates
scripts/core/check-redundancy.js        # 162 lines - 5 functions (3 unrelated)
scripts/core/check-documentation.js     # ~85 lines
scripts/core/detect-mock-data.js        # Mock data detection
scripts/validation/check-file-locations.cjs  # 424 lines - file placement
scripts/validation/audit-file-organization.cjs  # 145 lines - backup patterns
scripts/validation/audit-root-clutter.cjs  # 187 lines - root scripts
```

**Problem**: 7 scripts with overlapping concerns, synonym naming, scattered locations.

### Target State (Consolidated)

```
scripts/validation/
├── validate-project-structure.cjs   # Unified validation (blocks commit)
│   ├── File locations
│   ├── Folder structure
│   ├── Spec structure (technical/functional)
│   ├── Root clutter
│   ├── Orphan detection (README in empty folders)
│   ├── Service location (no root services/)
│   └── Naming convention enforcement
│
├── validate-code-quality.cjs        # Code quality (blocks commit)
│   ├── Duplicate imports
│   ├── File sizes (>300 lines)
│   ├── Duplicate components
│   └── Console statements
│
├── detect-mock-data.cjs             # Mock data (blocks commit)
│
├── audit-codebase.cjs               # Full audit (non-blocking)
│   └── Orchestrates all audits, generates manifests
│
└── lib/
    ├── vocabulary.cjs               # Canonical terms enforcement
    ├── structure-rules.cjs          # Rules from this manifest
    └── reporters.cjs                # Output formatting
```

### Migration from check-redundancy.js

| Current Function | Belongs In |
|-----------------|------------|
| `checkDuplicateImports()` | `validate-code-quality.cjs` |
| `checkDuplicateComponents()` | `validate-code-quality.cjs` |
| `checkUnusedImports()` | ESLint (already has this) - DELETE |
| `checkFileSizes()` | `validate-code-quality.cjs` |
| `checkConsoleStatements()` | ESLint (already has this) - DELETE |

---

## Part 5: Pre-Commit Enforcement

### Updated Pre-Commit Hook

```bash
#!/bin/bash
echo "🔍 Running pre-commit validation..."

# 1. Project structure (files, folders, naming)
echo "📁 Validating project structure..."
node scripts/validation/validate-project-structure.cjs
if [ $? -ne 0 ]; then
  echo "❌ Structure validation failed."
  exit 1
fi

# 2. Code quality
echo "📏 Validating code quality..."
node scripts/validation/validate-code-quality.cjs
if [ $? -ne 0 ]; then
  echo "❌ Code quality validation failed."
  exit 1
fi

# 3. ESLint
echo "📏 Running ESLint..."
npm run lint
if [ $? -ne 0 ]; then
  echo "❌ ESLint failed."
  exit 1
fi

# 4. Mock data detection
echo "🚫 Checking for mock data..."
node scripts/validation/detect-mock-data.cjs
if [ $? -ne 0 ]; then
  echo "❌ Mock data detected!"
  exit 1
fi

echo "✅ All validations passed!"
```

---

## Part 6: Immediate Actions

### Priority 1: Critical Fixes

```bash
# 1. Delete orphan README
git rm src/lib/database/README.md

# 2. Move root services/ to correct location
git mv services/FamilyMemberService.js server/services/FamilyMemberService.js
# Update import in routes/family-members.js:
# FROM: import FamilyMemberService from '../services/FamilyMemberService.js';
# TO:   import FamilyMemberService from '../server/services/FamilyMemberService.js';

# 3. Add to .gitignore
echo "eslint-output.json" >> .gitignore
echo "lint-violations.json" >> .gitignore
echo "nul" >> .gitignore
```

### Priority 2: Script Consolidation

```bash
# Rename with canonical vocabulary
git mv scripts/core/validate-structure.cjs scripts/validation/validate-project-structure.cjs
git mv scripts/validation/check-file-locations.cjs scripts/validation/validate-file-locations.cjs
git mv scripts/core/check-documentation.js scripts/validation/validate-documentation.cjs

# Archive redundant scripts (functionality merged)
git mv scripts/validation/audit-file-organization.cjs scripts/archive/audit-file-organization.cjs
git mv scripts/validation/audit-root-clutter.cjs scripts/archive/audit-root-clutter.cjs

# Move core/check-redundancy.js functions:
# - Useful functions → scripts/validation/validate-code-quality.cjs
# - Duplicate functions (already in ESLint) → DELETE
git rm scripts/core/check-redundancy.js
```

### Priority 3: Vocabulary Enforcement

Create `scripts/validation/lib/vocabulary.cjs`:
```javascript
// Canonical vocabulary enforcement
const CANONICAL_TERMS = {
  scripts: {
    validate: ['check', 'verify'],  // validate replaces these
    audit: ['scan', 'analyze'],
    detect: ['find', 'search'],
    debug: ['diagnose', 'investigate', 'show']
  },
  folders: {
    'scripts/validation/': ['scripts/core/validate-*', 'scripts/core/check-*'],
    'scripts/debug/': ['scripts/database/check-*', 'scripts/archive/check/*'],
    'src/services/': ['services/'],
    'server/services/': ['services/']
  },
  data: {
    mock: ['fake', 'stub'],
    fixture: ['test data', 'sample data'],
    fallback: []  // Don't use for fake data
  }
};

module.exports = { CANONICAL_TERMS };
```

---

## Part 7: Validation Rules Summary

### Blocking Rules (Exit Code 1)

| Rule ID | Description | Check |
|---------|-------------|-------|
| STRUCT-001 | No services/ at root | `services/*.js` exists |
| STRUCT-002 | No README in empty folders | `src/lib/database/README.md` with no other files |
| STRUCT-003 | No SQL in src/ | `src/**/*.sql` |
| STRUCT-004 | No HTML in src/ (except components) | `src/**/*.html` outside components |
| STRUCT-005 | No check-* in database/ | `scripts/database/check-*.js` |
| STRUCT-006 | Validate-* in validation/ | `scripts/core/validate-*` |
| NAME-001 | No synonym script names | `check-*`, `verify-*` outside archive |
| NAME-002 | Service location | `services/` at root level |
| QUAL-001 | File size < 300 lines | Services, components |
| QUAL-002 | No console in production | `src/**/*.ts`, `server/**/*.js` |
| MOCK-001 | No mock data in production | `src/pages/`, `src/components/` |

### Warning Rules (Exit Code 0, Show Warning)

| Rule ID | Description |
|---------|-------------|
| WARN-001 | Missing README in major directories |
| WARN-002 | Files approaching 300 lines (>250) |
| WARN-003 | Scripts in archive/ referenced by active code |
| WARN-004 | Duplicate file names in different locations |

---

## Appendix: Full Folder Tree (Target State)

```
SGSGitaAlumni/
├── .claude/
│   ├── commands/
│   ├── hooks/
│   ├── settings.local.json
│   └── skills/
├── .husky/
│   ├── _/
│   └── pre-commit
├── config/
│   ├── constants.js
│   └── database.js
├── docs/
│   ├── archive/
│   ├── audits/
│   ├── context-bundles/
│   ├── diagrams/
│   │   ├── database/
│   │   ├── mermaid/
│   │   └── architecture/
│   ├── fixes/
│   ├── lessons-learnt/
│   ├── reports/
│   ├── specs/
│   │   ├── context/
│   │   ├── functional/
│   │   ├── technical/
│   │   ├── templates/
│   │   └── workflows/
│   ├── FEATURE_MATRIX.md          # Exception: system-generated
│   └── generated-status-report.html  # Exception: system-generated
├── eslint-rules/
├── middleware/
├── migrations/
├── public/
├── redis/
├── routes/
├── scripts/
│   ├── archive/
│   ├── core/                       # Minimal - only infrastructure
│   │   ├── delayed-vite.js
│   │   ├── kill-port.js
│   │   └── check-ports.js
│   ├── database/
│   │   ├── migrations/
│   │   └── schema/
│   ├── debug/
│   │   ├── database/
│   │   ├── matching/
│   │   ├── postings/
│   │   └── preferences/
│   ├── deployment/
│   └── validation/
│       ├── lib/
│       ├── validate-project-structure.cjs
│       ├── validate-code-quality.cjs
│       ├── validate-documentation.cjs
│       ├── detect-mock-data.cjs
│       └── audit-codebase.cjs
├── server/
│   ├── errors/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   │   ├── chatService.js
│   │   ├── FamilyMemberService.js  # MOVED from root services/
│   │   └── moderationNotification.js
│   └── socket/
├── src/
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   │   └── api/                   # NOT database/ with orphan README
│   ├── pages/
│   ├── schemas/
│   ├── services/                  # Frontend services ONLY
│   ├── test/
│   ├── types/
│   └── utils/
├── terraform/
├── tests/
│   ├── api/
│   ├── database/
│   ├── e2e/
│   └── integration/
├── [allowed root files]
└── .gitignore                     # Updated with generated files
```

---

**This manifest is the SINGLE SOURCE OF TRUTH for project structure.**

**Last Updated**: 2025-11-26  
**Next Review**: 2025-12-26

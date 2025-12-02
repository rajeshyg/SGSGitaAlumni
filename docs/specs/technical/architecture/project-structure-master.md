---
version: 2.0
status: partial
last_updated: 2025-12-02
applies_to: all
enforcement: required
description: Single source of truth for ALL project structure rules - files, folders, naming, and exceptions
related_docs:
  - ../development-framework/ROADMAP.md
  - ../development-framework/file-organization.md
  - ../development-framework/constraints-enforcement.md
---

# Project Structure Manifest

## Executive Summary

This manifest addresses the ROOT CAUSES of structural chaos:

1. **Synonym Problem** → Standardized vocabulary with canonical mappings
2. **Missing Centralization** → Single authoritative manifest
3. **Exception Chaos** → Explicit exception registry with justifications
4. **Scope Gaps** → Full project coverage, not isolated rules

---

## Implementation Status

> **This document is PARTIALLY implemented.** See legend below.

| Status | Meaning |
|--------|---------|
| ✅ FINALIZED | Structure confirmed, implemented, validated |
| 🟡 PARTIAL | Structure exists but needs cleanup/alignment |
| 🔴 TODO | Needs research or implementation |
| ⚠️ STALE | Documented but no longer accurate - needs update |

### Quick Status by Section

| Section | Status | Notes |
|---------|--------|-------|
| Vocabulary (Part 1) | 🟡 PARTIAL | Defined but not enforced via tooling |
| `.claude/` folder | 🔴 TODO | `agents/` folder needs research per roadmap |
| `docs/specs/` folder | ✅ FINALIZED | Structure complete and validated |
| `scripts/validation/` | 🟡 PARTIAL | Exists, needs consolidation |
| `scripts/core/` | ⚠️ STALE | Contains files that should move |
| `scripts/debug/` | ✅ FINALIZED | Structure implemented |
| `src/` folder | ✅ FINALIZED | Standard React structure |
| `server/` folder | ✅ FINALIZED | Structure implemented |
| Exception Registry (Part 3) | ⚠️ STALE | Fixed issues still listed |
| Validation Scripts (Part 4) | 🟡 PARTIAL | Not consolidated as planned |

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

### Root Level ✅ FINALIZED

```
/
├── .claude/                 # Claude Code (AI assistant config) - see details below
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
├── utils/                   # Backend utility scripts
└── [config files]           # See allowed list below
```

### `.claude/` Directory 🔴 NEEDS RESEARCH

> **Alignment with Roadmap**: See `docs/specs/technical/development-framework/ROADMAP.md` Phase 2

**Current State** (as of 2025-12-02):
```
.claude/
├── commands/           # ✅ Implemented - Prime commands
│   ├── prime-api.md
│   ├── prime-auth.md
│   ├── prime-database.md
│   ├── prime-framework.md
│   ├── prime-sdd.md
│   ├── prime-tac.md
│   └── prime-ui.md
├── context.md          # ✅ Implemented
├── hooks/              # 🟡 PARTIAL - Only PostToolUse exists
│   └── post-tool-use-validation.js
├── settings.json       # ✅ Implemented
├── settings.local.json # ✅ Implemented
└── skills/             # ✅ Implemented
    ├── coding-standards.md      # ⚠️ 524 lines - needs split
    ├── duplication-prevention.md
    ├── sdd-tac-workflow/
    │   └── SKILL.md
    └── security-rules.md
```

**Target State** (per agent-engineering.md):
```
.claude/
├── agents/                      # 🔴 TODO - Research needed
│   ├── meta-agent.json          # Agent that creates agents
│   ├── scout-agent.json         # Domain reconnaissance
│   ├── qa-agent.json            # Quality assurance
│   ├── docs-agent.json          # Documentation
│   └── summary-agent.json       # Session summaries
├── commands/                    # ✅ Complete
├── context.md                   # ✅ Complete
├── hooks/
│   ├── post-tool-use-validation.js  # ✅ Exists
│   └── pre-tool-use-constraint.js   # 🔴 TODO (Phase 1.4)
├── settings.json
├── settings.local.json
└── skills/
    ├── coding-standards/        # 🔴 TODO - Split large file
    │   ├── typescript.md
    │   ├── react.md
    │   └── backend.md
    ├── duplication-prevention.md
    ├── project-constraints.md   # 🔴 TODO (Phase 1.5)
    ├── sdd-tac-workflow/
    └── security-rules.md
```

**Research Questions**:
1. Does Claude CLI support `.claude/agents/` directory? (Need to validate)
2. What's the JSON schema for agent configuration?
3. How do agents interact with skills/commands?

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

### Scripts Directory 🟡 PARTIAL

> **Status**: Structure exists but naming/consolidation not complete

**Current State** (as of 2025-12-02):
```yaml
scripts/:
  archive/:        # ✅ FINALIZED - Historical scripts
    
  core/:           # ⚠️ STALE - Contains files that should move
    current_files:
      - check-documentation.js   # → should be validate-documentation.cjs in validation/
      - check-integration-patterns.js
      - check-ports.js           # ✅ OK - infrastructure
      - check-redundancy.js      # → should move to validation/
      - delayed-vite.js          # ✅ OK - infrastructure
      - detect-mock-data.js      # ✅ OK - canonical naming
      - kill-port.js             # ✅ OK - infrastructure
      - MANIFEST.json
      - validate-structure.cjs   # → duplicate, should be in validation/
    allowed_only:
      - delayed-vite.js
      - kill-port.js
      - check-ports.js
      - detect-mock-data.js
      - MANIFEST.json
      
  database/:       # 🟡 PARTIAL - Has check-* files that should move to debug/
    subfolders:
      migrations/: "SQL migration files - ✅ exists"
      schema/:     "Schema definitions - ✅ exists"
    issues:
      - "50+ check-*.js files should move to scripts/debug/database/"
      - "Naming inconsistent (check-* vs debug-*)"
    
  debug/:          # ✅ FINALIZED - Diagnostic scripts by feature
    contents: "19 debug scripts for matching/postings/preferences"
    
  deployment/:     # ✅ FINALIZED
    purpose: "*.sh, *.ps1 deployment scripts"
    
  validation/:     # 🟡 PARTIAL - Exists but not consolidated
    current_files:
      - audit-code-quality.cjs
      - audit-documentation.cjs
      - audit-file-organization.cjs   # → should merge into validate-structure
      - audit-framework.cjs
      - audit-root-clutter.cjs        # → should merge into validate-structure
      - check-file-locations.cjs      # → rename to validate-file-locations.cjs
      - cleanup-duplicates.cjs
      - deployment-validation.cjs
      - run-full-audit.cjs
      - validate-project-structure.cjs # ✅ Main validator
      - validate-structure.cjs         # ⚠️ Duplicate of above?
      - validate-theme-compliance.js
    subfolders:
      rules/:      "✅ Implemented - structure-rules.cjs, exceptions.cjs, etc."
      validators/: "✅ Implemented - file-placement.cjs, naming-conventions.cjs, etc."
      reports/:    "Output reports"
    target_consolidation:
      - validate-project-structure.cjs  # Unified validation
      - validate-code-quality.cjs       # Code quality checks  
      - detect-mock-data.cjs            # Mock data detection
      - audit-codebase.cjs              # Full audit orchestrator
```

**Target State** (per development-framework):
```yaml
scripts/:
  validation/:
    purpose: "Validation scripts that block commits"
    naming: "validate-*.cjs for blocking, audit-*.cjs for reports"
    target_structure:
      - validate-project-structure.cjs   # Unified structure validator
      - validate-code-quality.cjs        # Code quality (file size, duplicates)
      - detect-mock-data.cjs             # Mock data detection
      - audit-codebase.cjs               # Full audit orchestrator
      - deployment-validation.cjs        # Deployment checks
      lib/:
        - vocabulary.cjs     # 🔴 TODO - Canonical terms enforcement
        - structure-rules.cjs # ✅ Exists in rules/
        - reporters.cjs      # 🔴 TODO - Output formatting
      rules/:                # ✅ Exists
      validators/:           # ✅ Exists
    
  core/:
    purpose: "ONLY core infrastructure - minimal files"
    allowed:
      - delayed-vite.js
      - kill-port.js
      - check-ports.js
      - detect-mock-data.js
      - MANIFEST.json
      
  database/:
    purpose: "Database operations ONLY - no check-* scripts"
    subfolders:
      migrations/: "SQL migration files"
      schema/: "Schema definitions"
    scripts: "Data operations (backfill, link, execute, migrate)"
    
  debug/:
    purpose: "Diagnostic scripts organized by feature"
    subfolders:
      matching/:     "Matching system debug"
      preferences/:  "Preferences debug"
      database/:     "Database diagnostics (moved from scripts/database/check-*)"
      postings/:     "Postings debug"
    
  archive/:
    purpose: "Historical/deprecated scripts"
    rule: "Only archive, never reference from active code"
```

### Source Code (`src/`) ✅ FINALIZED

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
    # NO services/ at root level - ✅ VERIFIED: no root services/ exists
    # NO src/lib/services/
    
  utils/:
    purpose: "Frontend utility functions"
    
  types/:
    purpose: "TypeScript type definitions"
    
  schemas/:
    purpose: "Zod/validation schemas"
    
  constants/:
    purpose: "Frontend constants"
    
  config/:
    purpose: "Frontend configuration"
    
  lib/:
    purpose: "Third-party integrations, API clients"
    current_subfolders:
      - accessibility/
      - ai/
      - auth/
      - config/
      - encryption/
      - monitoring/
      - performance/
      - security/
      - socket/
      - testing/
      - theme/
      - utils/
    forbidden:
      - "*.sql"
      - "*.html"
      - "README.md in empty folders"
      - "database/ folder" # ✅ VERIFIED: orphan deleted
    
  assets/:
    purpose: "Images, fonts, static assets"
    
  test/:
    purpose: "Test utilities, setup, fixtures"
    # Actual tests go in tests/ (root)
    
  __tests__/:
    purpose: "Co-located unit tests"
```

### Server Code (`server/`) ✅ FINALIZED

```yaml
server/:
  services/:
    purpose: "Backend business logic"
    rule: "< 300 lines per file"
    current_files:
      - chatService.js
      - FamilyMemberService.js  # ✅ VERIFIED: properly located here
      - moderationNotification.js
    
  middleware/:
    purpose: "Express middleware"
    
  routes/:
    purpose: "Server-side route handlers (if not using routes/)"
    
  socket/:
    purpose: "Socket.IO handlers"
    
  errors/:
    purpose: "Custom error classes"
```

### Documentation (`docs/`) ✅ FINALIZED

> **Status**: Structure complete and validated. See `docs/specs/CONSTITUTION.md` for governance.

```yaml
docs/:
  specs/:                          # ✅ FINALIZED - Complete structure
    CONSTITUTION.md: "Governance rules for specs"
    README.md: "Navigation guide"
    context/:
      - always-on.md              # AI context (44 lines, optimized)
      - RESTRUCTURING_COMPLETE.md
    functional/:                  # Feature specifications by module
      - admin/
      - authentication/
      - dashboard/
      - directory/
      - messaging/
      - moderation/
      - notifications/
      - postings/
      - rating/
      - README.md
      - user-management/
    technical/:                   # Technical standards by domain
      - architecture/            # This document lives here
      - coding-standards/
      - database/
      - deployment/
      - development-framework/   # SDD/TAC framework docs
      - integration/
      - mobile-version/
      - README.md
      - security/
      - testing/
      - ui-standards/
      - validation/
    templates/:                   # Spec templates
      - feature-spec.md
      - implementation-plan.md
      - README-template.md
      - README.md
      - ROADMAP-template.md
      - scout-report.md
      - task-breakdown.md
    workflows/:                   # Feature workflow documentation
      - notifications/
      - postings/
      - rating/
      - user-management/
    
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

## Part 3: Exception Registry ⚠️ NEEDS UPDATE

### Registered Exceptions (Updated 2025-12-02)

| Exception | Location | Justification | Status | Review Date |
|-----------|----------|---------------|--------|-------------|
| `FEATURE_MATRIX.md` | `docs/` | System-generated, StatusDashboard | Active | 2025-12-26 |
| `generated-status-report.html` | `docs/` | System-generated, StatusDashboard | Active | 2025-12-26 |
| `dump.rdb` | root | Redis persistence | Active | 2025-12-26 |
| ~~`services/FamilyMemberService.js`~~ | ~~root~~ | ~~LEGACY~~ | ✅ FIXED | N/A |
| ~~`src/lib/database/README.md`~~ | ~~src/lib/database/~~ | ~~ORPHAN~~ | ✅ DELETED | N/A |
| `playwright.config.ts` | root | Playwright convention | Permanent | N/A |
| `vitest.config.ts` | root | Vitest convention | Permanent | N/A |

### Exception Request Process

1. Add to `exception-requests.md` (new file)
2. Justify why standard location doesn't work
3. Get approval via PR review
4. Add to this manifest with review date
5. Re-evaluate on review date

---

## Part 4: Validation Scripts Consolidation 🟡 PARTIAL

> **Status**: Validation framework exists but consolidation not complete

### Current State (as of 2025-12-02)

```
scripts/validation/
├── audit-code-quality.cjs
├── audit-documentation.cjs
├── audit-file-organization.cjs     # → Should merge into validate-structure
├── audit-framework.cjs
├── audit-root-clutter.cjs          # → Should merge into validate-structure
├── check-file-locations.cjs        # → Rename to validate-file-locations.cjs
├── cleanup-duplicates.cjs
├── deployment-validation.cjs
├── run-full-audit.cjs              # Orchestrator
├── validate-project-structure.cjs  # Main validator
├── validate-structure.cjs          # ⚠️ Duplicate?
├── validate-theme-compliance.js
├── rules/
│   ├── exceptions.cjs              # ✅ Has EXCEPTION_REGISTRY
│   ├── folder-rules.cjs
│   ├── module-rules.cjs
│   └── structure-rules.cjs
├── validators/
│   ├── duplicate-helpers.cjs
│   ├── file-placement.cjs
│   ├── file-uniqueness.cjs
│   ├── naming-conventions.cjs
│   ├── spec-documents.cjs
│   └── spec-helpers.cjs
└── reports/

scripts/core/                        # ⚠️ STALE - files should move
├── check-documentation.js          # → validation/validate-documentation.cjs
├── check-integration-patterns.js
├── check-ports.js                  # ✅ OK
├── check-redundancy.js             # → validation/ or delete (ESLint coverage)
├── delayed-vite.js                 # ✅ OK
├── detect-mock-data.js             # ✅ OK
├── kill-port.js                    # ✅ OK
├── MANIFEST.json
└── validate-structure.cjs          # → Already in validation/ - delete this
```

### Target State (per development-framework roadmap)

```
scripts/validation/
├── validate-project-structure.cjs   # Unified validation (blocks commit)
│   ├── File locations
│   ├── Folder structure
│   ├── Spec structure (technical/functional)
│   ├── Root clutter
│   ├── Orphan detection
│   ├── Service location
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
├── deployment-validation.cjs        # Deployment checks
│
├── lib/                             # 🔴 TODO
│   ├── vocabulary.cjs               # Canonical terms enforcement
│   ├── reporters.cjs                # Output formatting
│   └── [moved from rules/]
│
├── rules/                           # ✅ EXISTS
│   ├── exceptions.cjs               # Needs LOCKED_FILES, STOP_TRIGGERS
│   ├── folder-rules.cjs
│   ├── module-rules.cjs
│   └── structure-rules.cjs
│
└── validators/                      # ✅ EXISTS
    ├── constraint-check.cjs         # 🔴 TODO (Phase 1.2)
    ├── file-placement.cjs
    ├── file-uniqueness.cjs
    ├── naming-conventions.cjs
    └── spec-documents.cjs
```

### Migration Actions Needed

| Current Script | Action | Priority |
|----------------|--------|----------|
| `scripts/core/validate-structure.cjs` | DELETE (duplicate) | High |
| `scripts/core/check-documentation.js` | Move → validation/validate-documentation.cjs | Medium |
| `scripts/core/check-redundancy.js` | Extract useful → validation/, delete rest | Medium |
| `scripts/validation/check-file-locations.cjs` | Rename → validate-file-locations.cjs | Low |
| `scripts/validation/audit-file-organization.cjs` | Merge into validate-structure | Low |
| `scripts/validation/audit-root-clutter.cjs` | Merge into validate-structure | Low |

---

## Part 5: Pre-Commit Enforcement ⚠️ BYPASSED

> **Status**: Pre-commit hook exists but is bypassed due to ESLint errors

### Current Pre-Commit State

```bash
# .husky/pre-commit currently bypassed with --no-verify
# due to 1358 ESLint errors blocking commits
```

### Target Pre-Commit Hook

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

### Blocker Resolution Strategy

Per development-framework roadmap: Fix ESLint errors per-module during feature work.

---

## Part 6: Immediate Actions ⚠️ MOSTLY COMPLETED

### Priority 1: Critical Fixes ✅ COMPLETED

```bash
# 1. Delete orphan README - ✅ DONE (verified: folder doesn't exist)
# git rm src/lib/database/README.md

# 2. Move root services/ - ✅ DONE (verified: no root services/)
# FamilyMemberService.js is already in server/services/

# 3. Add to .gitignore - Status unknown, verify
echo "eslint-output.json" >> .gitignore
echo "lint-violations.json" >> .gitignore
echo "nul" >> .gitignore
```

### Priority 2: Script Consolidation 🔴 NOT STARTED

```bash
# These actions are still pending:

# Delete duplicate from core/
git rm scripts/core/validate-structure.cjs

# Rename with canonical vocabulary
git mv scripts/validation/check-file-locations.cjs scripts/validation/validate-file-locations.cjs
git mv scripts/core/check-documentation.js scripts/validation/validate-documentation.cjs

# Archive redundant scripts (after merging functionality)
git mv scripts/validation/audit-file-organization.cjs scripts/archive/
git mv scripts/validation/audit-root-clutter.cjs scripts/archive/
```

### Priority 3: Vocabulary Enforcement 🔴 NOT STARTED

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

> **Status**: Rules documented, enforcement partial

### Blocking Rules (Exit Code 1)

| Rule ID | Description | Check | Status |
|---------|-------------|-------|--------|
| STRUCT-001 | No services/ at root | `services/*.js` exists | ✅ Passing |
| STRUCT-002 | No README in empty folders | orphan README detection | ✅ Passing |
| STRUCT-003 | No SQL in src/ | `src/**/*.sql` | ✅ Enforced |
| STRUCT-004 | No HTML in src/ (except components) | `src/**/*.html` | ✅ Enforced |
| STRUCT-005 | No check-* in database/ | `scripts/database/check-*.js` | ⚠️ Violations exist |
| STRUCT-006 | Validate-* in validation/ | `scripts/core/validate-*` | ⚠️ Violations exist |
| NAME-001 | No synonym script names | `check-*`, `verify-*` | ⚠️ Not enforced |
| NAME-002 | Service location | `services/` at root level | ✅ Passing |
| QUAL-001 | File size < 300 lines | Services, components | 🟡 Partial |
| QUAL-002 | No console in production | `src/**/*.ts`, `server/**/*.js` | 🟡 ESLint rule |
| MOCK-001 | No mock data in production | `src/pages/`, `src/components/` | ✅ Rule exists |

### Warning Rules (Exit Code 0, Show Warning)

| Rule ID | Description | Status |
|---------|-------------|--------|
| WARN-001 | Missing README in major directories | 🟡 Partial |
| WARN-002 | Files approaching 300 lines (>250) | 🔴 Not implemented |
| WARN-003 | Scripts in archive/ referenced by active code | 🔴 Not implemented |
| WARN-004 | Duplicate file names in different locations | ✅ Implemented |

---

## Appendix A: Full Folder Tree (Target State)

> **Legend**: ✅ Matches actual | 🟡 Partial | 🔴 Needs work

```
SGSGitaAlumni/
├── .claude/                           # 🟡 Missing agents/
│   ├── agents/                        # 🔴 TODO - needs research
│   │   ├── meta-agent.json
│   │   ├── scout-agent.json
│   │   ├── qa-agent.json
│   │   └── ...
│   ├── commands/                      # ✅ Implemented
│   ├── hooks/                         # 🟡 Missing PreToolUse
│   │   ├── post-tool-use-validation.js
│   │   └── pre-tool-use-constraint.js # 🔴 TODO
│   ├── settings.json
│   ├── settings.local.json
│   └── skills/                        # ✅ Implemented
│       ├── coding-standards.md        # ⚠️ Needs split
│       ├── duplication-prevention.md
│       ├── project-constraints.md     # 🔴 TODO
│       ├── sdd-tac-workflow/
│       └── security-rules.md
├── .husky/
│   ├── _/
│   └── pre-commit                     # ⚠️ Bypassed
├── config/                            # ✅ Finalized
│   ├── constants.js
│   └── database.js
├── docs/                              # ✅ Finalized
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
│   ├── specs/                         # ✅ FINALIZED
│   │   ├── CONSTITUTION.md
│   │   ├── context/
│   │   ├── functional/
│   │   ├── technical/
│   │   ├── templates/
│   │   └── workflows/
│   ├── FEATURE_MATRIX.md              # Exception: system-generated
│   └── generated-status-report.html   # Exception: system-generated
├── eslint-rules/                      # ✅ Finalized
├── middleware/                        # ✅ Finalized
├── migrations/                        # ✅ Finalized
├── public/                            # ✅ Finalized
├── redis/                             # ✅ Finalized
├── routes/                            # ✅ Finalized
├── scripts/                           # 🟡 Needs consolidation
│   ├── archive/
│   ├── core/                          # ⚠️ Contains files to move
│   ├── database/
│   │   ├── migrations/
│   │   └── schema/
│   ├── debug/                         # ✅ Finalized
│   ├── deployment/                    # ✅ Finalized
│   └── validation/                    # 🟡 Needs consolidation
│       ├── lib/                       # 🔴 TODO
│       ├── rules/                     # ✅ Implemented
│       ├── validators/                # ✅ Implemented
│       └── reports/
├── server/                            # ✅ Finalized
│   ├── errors/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   │   ├── chatService.js
│   │   ├── FamilyMemberService.js     # ✅ Properly located
│   │   └── moderationNotification.js
│   └── socket/
├── src/                               # ✅ Finalized
│   ├── assets/
│   ├── components/
│   ├── config/
│   ├── constants/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── schemas/
│   ├── services/
│   ├── test/
│   ├── types/
│   ├── utils/
│   └── __tests__/
├── terraform/                         # ✅ Finalized
├── tests/                             # ✅ Finalized
├── utils/                             # ✅ Backend utilities
├── [allowed root files]
└── .gitignore                         # Update with generated files
```

---

## Appendix B: Alignment with Development Framework Roadmap

> **Reference**: `docs/specs/technical/development-framework/ROADMAP.md`

| Roadmap Item | Structure Impact | Status |
|--------------|-----------------|--------|
| Phase 0: Constraints | `rules/exceptions.cjs` needs LOCKED_FILES | 🔴 TODO |
| Phase 1.2: constraint-check.cjs | `validators/constraint-check.cjs` | 🔴 TODO |
| Phase 1.4: PreToolUse hook | `.claude/hooks/pre-tool-use-constraint.js` | 🔴 TODO |
| Phase 1.5: project-constraints skill | `.claude/skills/project-constraints.md` | 🔴 TODO |
| Phase 2.1: Create agents directory | `.claude/agents/` | 🔴 NEEDS RESEARCH |
| Phase 2.2-2.4: Agent implementations | `.claude/agents/*.json` | 🔴 NEEDS RESEARCH |
| Phase 3.1: Split coding-standards | `.claude/skills/coding-standards/` | 🔴 TODO |

---

**This manifest is the SINGLE SOURCE OF TRUTH for project structure.**

**Last Updated**: 2025-12-02  
**Status**: 🟡 PARTIAL - Some structures finalized, others need work  
**Next Review**: 2025-12-26

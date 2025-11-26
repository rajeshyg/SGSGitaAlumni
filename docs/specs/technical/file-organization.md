# File Organization Standard

```yaml
---
version: 1.0
status: active
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Canonical reference for file locations and organization
validation: scripts/validation/check-file-locations.cjs
---
```

## Overview

**Purpose**: Define where every file type belongs to prevent clutter, conflicts, and confusion

**Enforcement**: Pre-commit hook blocks files in wrong locations

---

## Root Directory (Minimal)

### Allowed Files

| File Pattern | Purpose | Examples |
|--------------|---------|----------|
| `README.md` | Project documentation | `README.md` |
| `claude.md` | Claude Code context | `claude.md` |
| `index.html` | Vite entry point | `index.html` |
| `package*.json` | npm configuration | `package.json`, `package-lock.json`, `server-package.json` |
| `tsconfig*.json` | TypeScript config | `tsconfig.json`, `tsconfig.node.json` |
| `vite.config.ts` | Vite configuration | `vite.config.ts` |
| `eslint.config.js` | ESLint configuration | `eslint.config.js` |
| `.*.json` | Tool configurations | `.jscpd.json`, `.prettierrc.json` |

### Allowed Directories

| Directory | Purpose |
|-----------|---------|
| `.claude/` | Claude Code configuration |
| `.husky/` | Git hooks |
| `docs/` | Documentation |
| `migrations/` | Database migrations |
| `scripts/` | Utility scripts |
| `src/` | Source code |
| `server/` | Server code |
| `tests/` | Tests |
| `public/` | Static assets |
| `eslint-rules/` | Custom ESLint rules |

### FORBIDDEN in Root

| File Type | Why Forbidden | Correct Location |
|-----------|---------------|------------------|
| `*.html` (except index.html) | Reports, visualizations | `docs/reports/` or `docs/diagrams/` |
| `*.sql` | Migrations, schemas | `migrations/` or `scripts/database/schema/` |
| `*.sh`, `*.ps1` | Shell scripts | `scripts/deployment/`, `scripts/database/`, etc. |
| `*.txt` | Output files | `.gitignore` or `docs/reports/` |
| `*-output.json` | Generated files | `.gitignore` |
| `*-report.html` | Generated reports | `.gitignore` or `docs/reports/` |

---

## Documentation (`docs/`)

### Structure

```
docs/
├── specs/                          # Specifications (functional + technical)
│   ├── functional/                 # Feature specifications
│   ├── technical/                  # Technical standards
│   └── context/                    # Context files (always-on.md)
├── reports/                        # Generated reports (gitignored or archived)
│   ├── *.html                      # HTML reports
│   ├── *.json                      # JSON reports
│   └── *.md                        # Markdown reports
├── diagrams/                       # Visual diagrams
│   ├── database/                   # Database ER diagrams, Mermaid visualizations
│   ├── architecture/               # System architecture diagrams
│   └── flows/                      # Flow diagrams
├── audits/                         # Audit reports
│   ├── CODE_QUALITY_AUDIT.md
│   ├── FILE_ORGANIZATION_AUDIT.md
│   └── ...
├── context-bundles/                # Session continuity bundles
│   └── YYYY-MM-DD-feature-name.md
├── archive/                        # Deprecated/historical docs
│   ├── root-docs/                  # Old root-level docs
│   ├── guidelines/                 # Old guidelines
│   └── progress/                   # Historical progress reports
├── fixes/                          # Fix documentation
│   └── FEATURE_FIX_SUMMARY.md
└── implementation-reports/         # Implementation tracking
    └── FEATURE_IMPLEMENTATION_REPORT.md
```

### Rules

1. **No SQL files in docs/**: SQL belongs in `migrations/` or `scripts/database/schema/`
2. **No HTML files in docs/ root**: HTML goes in `docs/diagrams/` or `docs/reports/`
3. **Generated reports**: Either gitignored or in `docs/reports/`
4. **Mermaid visualizations**: `docs/diagrams/database/` (not `src/`)

---

## Scripts (`scripts/`)

### Structure

```
scripts/
├── core/                           # Core infrastructure scripts
│   ├── check-documentation.js
│   ├── check-redundancy.js
│   ├── check-ports.js
│   ├── validate-structure.cjs
│   └── detect-mock-data.js
├── validation/                     # Validation and audit scripts
│   ├── check-file-locations.cjs    # NEW: Enforce file organization
│   ├── audit-framework.cjs
│   ├── audit-code-quality.cjs
│   ├── audit-documentation.cjs
│   ├── audit-file-organization.cjs
│   └── run-full-audit.cjs
├── database/                       # Database operations
│   ├── migrations/                 # Migration runner scripts
│   │   ├── create-coppa-compliance-tables.sql
│   │   └── rollback-coppa-compliance-tables.sql
│   ├── schema/                     # Schema files
│   │   ├── core-schema.sql
│   │   └── invitation-system-schema.sql
│   ├── add-account-columns.js      # Schema modification scripts
│   ├── backfill-*.js               # Data backfill scripts
│   └── link-*.js                   # Data linking scripts
├── deployment/                     # Deployment scripts
│   ├── deploy-coppa-migration.sh
│   ├── backup-database.ps1
│   └── restore-database.ps1
├── debug/                          # Feature-specific debugging
│   ├── matching/                   # Matching feature debug scripts
│   ├── preferences/                # Preferences feature debug scripts
│   └── postings/                   # Postings feature debug scripts
└── archive/                        # Historical/one-time scripts
    ├── check/                      # Old check scripts
    ├── test/                       # Old test scripts
    ├── cleanup/                    # Old cleanup scripts
    └── oneoff/                     # One-time migration scripts
```

### Rules

1. **No check scripts in `scripts/database/`**: Database diagnostics go in `scripts/debug/database/` or `scripts/archive/`
2. **SQL migrations**: Either `migrations/` (root) or `scripts/database/migrations/`
3. **SQL schemas**: `scripts/database/schema/`
4. **Deployment scripts**: `scripts/deployment/` (not root)
5. **Debug scripts**: Organize by feature in `scripts/debug/[feature]/`

---

## Source Code (`src/`)

### Structure

```
src/
├── components/                     # React components
├── pages/                          # Page components
├── hooks/                          # Custom hooks
├── contexts/                       # React contexts
├── utils/                          # Frontend utilities
├── services/                       # API service layer
├── types/                          # TypeScript types
├── assets/                         # Images, fonts, etc.
└── lib/                            # Libraries
    └── database/                   # Database utilities (NO SQL, NO HTML)
```

### Rules

1. **NO SQL files in src/**: SQL belongs in `migrations/` or `scripts/database/schema/`
2. **NO HTML files in src/**: Mermaid visualizations go in `docs/diagrams/`
3. **NO test files in src/**: Tests go in `tests/`

---

## Server Code (`server/`)

### Structure

```
server/
├── config/                         # Server configuration
├── services/                       # Business logic (< 300 lines each)
├── middleware/                     # Express middleware
├── utils/                          # Server utilities
└── socket/                         # Socket.IO handlers
```

### Rules

1. **Service size**: < 300 lines per file
2. **NO routes in server/**: Routes go in `routes/` (root)
3. **NO SQL files in server/**: Migrations belong elsewhere

---

## Routes (`routes/`)

### Structure

```
routes/
├── auth.js                         # Authentication routes
├── users.js                        # User management
├── alumni.js                       # Alumni directory
├── postings.js                     # Postings
├── moderation.js                   # Moderation
└── ...
```

### Rules

1. **One file per feature domain**
2. **Routes delegate to services** (thin controllers)

---

## Migrations (`migrations/`)

### Structure

```
migrations/
├── YYYY-MM-DD-HH-MM-description.sql
├── 2024-01-15-create-family-tables.sql
├── 2024-01-16-add-invitation-columns.sql
└── ...
```

**OR** (if using `scripts/database/migrations/`):

```
scripts/database/migrations/
├── YYYY-MM-DD-description.sql
└── ...
```

### Rules

1. **Timestamp prefix**: `YYYY-MM-DD-HH-MM-description.sql`
2. **Descriptive names**: What the migration does
3. **Rollback scripts**: Optional `rollback-description.sql`
4. **No migrations in `scripts/database/` root**: Use subdirectory

---

## Tests (`tests/`)

### Structure

```
tests/
├── unit/                           # Unit tests
│   ├── services/
│   └── utils/
├── integration/                    # Integration tests
│   ├── api/
│   └── database/
├── e2e/                            # End-to-end tests
│   └── *.spec.ts
└── setup/                          # Test setup utilities
    └── test-db.js
```

### Rules

1. **No test files in `scripts/`**: All tests go in `tests/`
2. **No test files in `src/`**: Test files must be in `tests/`
3. **Test utilities**: `tests/setup/`

---

## Generated Files (`.gitignore`)

### Should Be Gitignored

```gitignore
# Generated reports
*-report.html
*-output.json
generated-*.html
lint-violations.json
eslint-output.json

# Build outputs
dist/
build/
.vite/

# Logs
*.log
npm-debug.log*

# Temporary files
*.tmp
.DS_Store
```

---

## Decision Tree: Where Does This File Belong?

```
Is it a configuration file?
├─ YES → Root directory (.eslintrc, tsconfig.json, etc.)
└─ NO ↓

Is it a SQL file?
├─ Migration → migrations/ or scripts/database/migrations/
├─ Schema → scripts/database/schema/
└─ Query → Probably doesn't belong in git (use ORM/query builder)

Is it a script?
├─ Validation/Audit → scripts/validation/
├─ Database operation → scripts/database/
├─ Deployment → scripts/deployment/
├─ Debug → scripts/debug/[feature]/
├─ One-time/Historical → scripts/archive/
└─ Core infrastructure → scripts/core/

Is it HTML?
├─ Entry point → index.html (root)
├─ Report → docs/reports/ or .gitignore
├─ Diagram → docs/diagrams/
└─ Generated → .gitignore

Is it documentation?
├─ Spec → docs/specs/
├─ Report → docs/reports/ or docs/audits/
├─ Diagram → docs/diagrams/
├─ Historical → docs/archive/
└─ README → Relevant directory or root

Is it source code?
├─ Frontend → src/
├─ Backend → server/ or routes/
└─ Test → tests/

Is it temporary/generated?
└─ .gitignore (should not be in repo)
```

---

## Validation

**Script**: `scripts/validation/check-file-locations.cjs`

**Runs**: Pre-commit hook

**Blocks**:
- SQL files outside allowed locations
- HTML files (except index.html) in root
- Shell scripts in root
- Check/test scripts outside proper directories
- Mermaid HTML in src/

**Warns**:
- Files approaching 300 lines (services)
- Missing README in major directories

---

## Migration Guide

### Moving Misplaced Files

**Before moving**:
1. Search codebase for references to old path
2. Update imports/requires
3. Update documentation links
4. Test after moving

**Steps**:
```bash
# Example: Move SQL migration
git mv scripts/database/add-missing-columns.sql migrations/2024-11-26-add-missing-columns.sql

# Example: Move Mermaid HTML
git mv src/lib/database/mermaid/alumni-system.html docs/diagrams/database/alumni-system.html

# Example: Move shell script
git mv deploy-coppa-migration.sh scripts/deployment/deploy-coppa-migration.sh
```

---

## Related Specs

- [Validation Framework](./validation/README.md) - Enforcement via pre-commit
- [Coding Standards](./coding-standards/file-organization.md) - Source code organization
- [Development Framework](./development-framework/duplication-prevention.md) - Before creating files

---

**Summary**: Every file has a canonical location. Validation enforces it. No exceptions.

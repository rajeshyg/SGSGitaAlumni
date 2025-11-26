# File Organization Audit Report

**Date**: 2025-11-26
**Purpose**: Comprehensive audit of misplaced files and scattered validation scripts

---

## Executive Summary

**Issues Found**:
- 4 files in root directory (should be elsewhere)
- 22 SQL migration files in wrong location
- 10 Mermaid HTML visualizations in src/ (should be docs/)
- 22 database check scripts (redundant with validation framework)
- 9 debug check scripts (needs consolidation)

**Impact**: Context overload, file conflicts, confusion about canonical locations

---

## 1. Root Directory Clutter

### Current Issues

| File | Issue | Correct Location |
|------|-------|------------------|
| `mvp_pending_tasks_report.html` | Report in root | `docs/reports/` or `.gitignore` |
| `post_mvp_features_report.html` | Report in root | `docs/reports/` or `.gitignore` |
| `eslint-output.json` | Output in root | `.gitignore` (generated file) |
| `lint-violations.json` | Output in root | `.gitignore` (generated file) |
| `deploy-coppa-migration.sh` | Script in root | `scripts/deployment/` |

### Allowed in Root

| File | Reason |
|------|--------|
| `README.md` | Project documentation |
| `claude.md` | Claude Code context file |
| `index.html` | Vite entry point |
| `package.json`, `package-lock.json` | npm configuration |
| `.jscpd.json` | Tool configuration |
| `tsconfig.json`, `tsconfig.node.json` | TypeScript configuration |
| `server-package.json` | Server-specific config |

---

## 2. SQL Files Organization

### Issues

**22 SQL files in `scripts/database/`** - Mixed migration/schema files:

```
scripts/database/
├── add-archived-status-to-postings.sql           # Migration
├── add-directory-indexes.sql                     # Migration
├── add-invitation-columns-migration.sql          # Migration
├── add-is-group-to-conversations.sql             # Migration
├── add-missing-app-users-columns.sql             # Migration
├── add-user-id-to-invitations-migration.sql      # Migration
├── chat-system-migration.sql                     # Migration
├── create-family-members-tables.sql              # Migration
├── create-family-tables-simple.sql               # Migration
├── create-invitation-tables.sql                  # Schema/Migration
├── database-schema-corrections.sql               # Migration
├── database-schema-improvements.sql              # Migration
├── database-schema-migration.sql                 # Migration
├── email-delivery-logs-table.sql                 # Schema
├── fix-users-table-autoincrement.sql             # Migration
├── migrate-hmac-tokens.sql                       # Migration
├── migrate-multi-factor-otp.sql                  # Migration
├── migrate-to-encryption.sql                     # Migration
├── schema-improvements-step1.sql                 # Migration
├── streamlining-migration.sql                    # Migration
├── task-7.4.1-feed-tables.sql                    # Migration
└── task-7.7.4-preferences-tables.sql             # Migration
```

**1 SQL file in `src/lib/database/schema/`**:
```
src/lib/database/schema/
└── invitation-system-schema.sql                  # Should be in migrations/
```

### Correct Organization

**Option 1: All migrations in `migrations/`** (Recommended):
```
migrations/
├── YYYY-MM-DD-HH-MM-description.sql
├── 2024-01-15-create-family-tables.sql
├── 2024-01-16-add-invitation-columns.sql
└── ...
```

**Option 2: Keep in `scripts/database/migrations/`** (Already exists):
```
scripts/database/migrations/
├── create-coppa-compliance-tables.sql
├── rollback-coppa-compliance-tables.sql
└── ... (move all 22 files here)
```

**Schemas** (if needed separately):
```
scripts/database/schema/
├── core-schema.sql                               # Base schema
├── invitation-system-schema.sql                  # Invitation schema
└── coppa-compliance-schema.sql                   # COPPA schema
```

---

## 3. HTML Files Organization

### Issues

**3 HTML reports in root**:
- `mvp_pending_tasks_report.html`
- `post_mvp_features_report.html`
- `docs/generated-status-report.html`

**10 Mermaid visualizations in `src/lib/database/mermaid/`**:
```
src/lib/database/mermaid/
├── alumni-domain-expertise.html
├── alumni-profiles-visual.html
├── alumni-system-overview-visual.html
├── chat-communication-system.html
├── content-communication-visual.html
├── coppa-compliance-visualization.html
├── core-authentication.html
├── moderation-analytics.html
├── otp-flows-visualization.html
└── postings-content-management.html
```

### Correct Organization

**Reports**:
```
docs/reports/
├── mvp-pending-tasks.html
├── post-mvp-features.html
└── generated-status-report.html
```

**Or add to `.gitignore`** (if generated):
```
# Generated reports
*-report.html
generated-*.html
eslint-output.json
lint-violations.json
```

**Mermaid Visualizations**:
```
docs/diagrams/database/
├── alumni-domain-expertise.html
├── alumni-profiles-visual.html
├── chat-communication-system.html
├── coppa-compliance-visualization.html
└── ...
```

---

## 4. Validation Scripts Scattered

### Active Validation (Proper Locations)

**`scripts/core/`** - Core infrastructure validation:
- `check-documentation.js` - ✅ Correct
- `check-integration-patterns.js` - ✅ Correct
- `check-ports.js` - ✅ Correct (utility)
- `check-redundancy.js` - ✅ Correct
- `validate-structure.cjs` - ✅ Correct

**`scripts/validation/`** - Framework validation:
- `audit-code-quality.cjs` - ✅ Correct
- `audit-documentation.cjs` - ✅ Correct
- `audit-file-organization.cjs` - ✅ Correct
- `audit-framework.cjs` - ✅ Correct
- `audit-root-clutter.cjs` - ✅ Correct
- `run-full-audit.cjs` - ✅ Correct
- `validate-theme-compliance.js` - ✅ Correct

### Database-Specific Validation (Questionable)

**`scripts/database/`** - 22 check scripts:

**Issue**: These are database-specific diagnostics, not general validation.

**Options**:
1. **Keep** if they're used regularly for database debugging
2. **Move to `scripts/debug/database/`** if they're debug tools
3. **Archive** if they're one-time diagnostic scripts

**Current scripts**:
```
scripts/database/
├── check-admin-user.js
├── check-alumni-members.js
├── check-app-users-schema.js
├── check-app-users.js
├── check-foreign-keys.js
├── check-invitations-table.js
├── check-last-names.js
├── check-migration-audit.js
├── check-migration-status.js
├── check-posting-data.js
├── check-preferences-10025.js
├── check-raw-data-format.js
├── check-table-structure.js
├── check-tables.js
├── check-users-table.js
├── test-db.js
├── test-debug-profile.js
└── test-updated-apis.js
```

**Recommendation**: Most are one-time diagnostics → **Archive them**

### Debug Scripts (Needs Organization)

**`scripts/debug/`** - 9 check scripts:
```
scripts/debug/
├── check-categories.js
├── check-matched-postings-detailed.js
├── check-matching-issue.js
├── check-prefs-parsing.js
├── check-raw-prefs.js
├── check-which-match.js
├── test-matched-api.js
├── test-new-matching-logic.js
└── ...
```

**Recommendation**: These are feature-specific debugging → **Keep but organize by feature**:
```
scripts/debug/
├── matching/
│   ├── check-matched-postings-detailed.js
│   ├── check-matching-issue.js
│   └── test-new-matching-logic.js
└── preferences/
    ├── check-categories.js
    ├── check-prefs-parsing.js
    └── check-raw-prefs.js
```

---

## 5. ESLint Rules

**`eslint-rules/no-mock-data.js`** - ✅ Correct location for custom ESLint rules

---

## 6. Archive (Already Proper)

**`scripts/archive/`** - 41+ old check/test scripts properly archived

---

## Recommendations

### TIER 1: Immediate Actions

1. **Add to `.gitignore`**:
   ```
   # Generated reports and outputs
   *-report.html
   generated-*.html
   eslint-output.json
   lint-violations.json
   ```

2. **Move misplaced files**:
   - `deploy-coppa-migration.sh` → `scripts/deployment/`
   - HTML reports → `docs/reports/` or delete (if gitignored)
   - Mermaid HTML → `docs/diagrams/database/`

3. **Consolidate SQL files**:
   - All migrations → `scripts/database/migrations/`
   - Schema files → `scripts/database/schema/`

4. **Archive database check scripts**:
   - One-time diagnostics → `scripts/archive/database/`
   - Keep only actively used scripts

### TIER 2: Create Validation

1. **Create `scripts/validation/check-file-locations.js`**:
   - Enforces file organization rules
   - Runs in pre-commit
   - Blocks commits with misplaced files

2. **Update pre-commit hook**:
   - Add file location check
   - Block SQL files outside `migrations/` or `schema/`
   - Block HTML reports in root

### TIER 3: Documentation

1. **Create `docs/specs/technical/file-organization.md`**:
   - Canonical reference for where files belong
   - Decision tree for new file placement
   - Examples

---

## Summary Statistics

| Category | Count | Status |
|----------|-------|--------|
| **Root clutter** | 4 files | ❌ Needs cleanup |
| **SQL migrations** | 22 files | ❌ Wrong location |
| **Mermaid HTML** | 10 files | ❌ In src/, should be docs/ |
| **Database checks** | 22 scripts | ⚠️ Archive or reorganize |
| **Debug scripts** | 9 scripts | ⚠️ Needs feature-based organization |
| **Active validation** | 12 scripts | ✅ Properly organized |
| **Archived scripts** | 41+ scripts | ✅ Properly archived |

---

**Next Steps**: Create file organization standard spec and validation script

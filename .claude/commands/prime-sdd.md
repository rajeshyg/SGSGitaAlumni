# Prime: SDD (Spec-Driven Development) Framework

Load this for methodology and quality standards.

## Quick Reference

**SDD** = WHAT to build (TAC = HOW to build it)

**Full documentation**: `docs/specs/technical/development-framework/sdd-framework.md`

---

## Core Principles

1. **Specs as Source of Truth** - Code follows specifications
2. **Context Hygiene** - Load only relevant context (R&D Framework)
3. **Scout-Plan-Build** - Systematic phases (see `/prime-tac`)
4. **Validation First** - Quality gates catch errors before commit

---

## R&D Framework: Reduce & Delegate

**Problem**: Loading all context = token bloat, slower sessions

**Solution**: Load context on-demand per domain

**Available Prime Commands**:
- `/prime-auth` - Authentication/authorization patterns
- `/prime-api` - API development standards
- `/prime-database` - Database schema/queries
- `/prime-ui` - UI component patterns
- `/prime-tac` - Execution workflow (Scout-Plan-Build)
- `/prime-sdd` - This file (methodology)

**Rule**: Load ONLY what's needed for current task

---

## Specification Coverage

**Functional Specs** (`docs/specs/functional/[feature]/`):
- authentication, dashboard, directory, messaging, moderation
- notifications, postings, rating, user-management

**Technical Specs** (`docs/specs/technical/`):
- architecture, coding-standards, database, deployment
- integration, security, testing, ui-standards

**Before coding**: Read relevant spec first

---

## Pre-Commit Validation

**Quality Gates** (runs automatically via Husky):
1. ✅ Structure validation - File placement, naming
2. ✅ Documentation - Spec frontmatter, required sections
3. ⚠️ ESLint - (1425 errors, currently bypassed)
4. ✅ Mock data detection - No mock data in production
5. ✅ Redundancy check - Duplicate file detection

**Manual run**: `node scripts/validation/validate-structure.cjs`

**Real-time feedback**: Claude hooks (post-tool-use) validate on write

---

## Skills (Auto-Applied Patterns)

**Location**: `.claude/skills/`

Skills auto-activate when relevant (no manual invocation):
- `coding-standards.md` - Applies when writing code
- `duplication-prevention.md` - Check before creating files
- `security-rules.md` - SQL injection, secrets, auth
- `sdd-tac-workflow/` - Framework patterns

**Rule**: Skills ≤ 5 total. To add new skill, merge or replace existing.

---

## Workflow Integration

**For ANY task**:

1. **Assess complexity**:
   - How many files?
   - Which domains?

2. **Select workflow** (see `/prime-tac`):
   - 1-2 files → Build directly
   - 3-10 files → Scout → Plan → Build
   - 10+ files → Full TAC with parallel agents

3. **Load context**:
   - `/prime-[domain]` for domain knowledge
   - Read relevant specs
   - Check Reference Implementations in `always-on.md`

4. **Execute with quality**:
   - Follow existing patterns
   - Use parameterized queries (no string concatenation)
   - Try/finally for DB connections
   - Run validation before commit

---

## Structure Rules

**Single source of truth**: `scripts/validation/rules/structure-rules.cjs`

**Key rules**:
- `.js` forbidden in `src/` (use `.ts`)
- Scripts use canonical vocabulary: `validate-*`, `audit-*`, `detect-*`
- Specs require YAML frontmatter (version, status, last_updated)
- Module definitions for all features

**Check rules**: `node scripts/validation/validate-structure.cjs`

---

## Reference Implementations

**Location**: `docs/specs/context/always-on.md` (Section: Reference Implementations)

Before writing new code:
1. Check if pattern exists in Reference Implementations
2. Follow existing patterns for: auth, queries, API routes, error handling

**Anti-patterns to avoid**:
- String concatenation in SQL
- Skipping try/finally for connections
- Mock data in production code
- Creating files without checking for duplicates

---

## Success Metrics

Track these for continuous improvement:
- Feature implementation time (before/after SDD)
- Context tokens per task (via `/context`)
- Pre-commit catch rate (errors caught vs escaped)

---

## Full Details

See: `docs/specs/technical/development-framework/sdd-framework.md`
- Module 1-6 detailed breakdown
- Infrastructure status
- Action items and roadmap

# Claude Context - SGSGitaAlumni

**Primary Context**: `docs/specs/context/always-on.md`

---

## Context Management Rules (CRITICAL)

### What Goes Where

| Location | Purpose | When to Create |
|----------|---------|----------------|
| **CLAUDE.md** (this file) | Navigation + essential rules | NEVER add new sections |
| **Skills** (`.claude/skills/`) | Reusable AI patterns | Only for patterns used 5+ times |
| **Commands** (`.claude/commands/`) | Quick context loading | Only 5 prime-* commands exist |
| **Specs** (`docs/specs/`) | Human documentation | Not for AI context |

### Context Budget: ~5 Skills Max

Current skills (DO NOT ADD MORE without removing one):
1. `duplication-prevention.md` - Check before creating
2. `coding-standards.md` - Code quality rules
3. `security-rules.md` - SQL injection, secrets
4. `sdd-tac-workflow/` - Scout-Plan-Build

**To add a new skill**: Merge into existing or replace one.

### Structure Validation

**Single source of truth**: `scripts/validation/structure-rules.cjs`
- Defines allowed extensions per folder
- Canonical vocabulary (validate vs check vs verify)
- Exception registry

Run: `node scripts/validation/structure-rules.cjs` to see rules.

---

## Quick Navigation

**AI Agents**: Read `docs/specs/context/always-on.md` first.

**Context priming**: `/prime-auth`, `/prime-api`, `/prime-database`, `/prime-ui`

**Specs location**:
- Functional: `docs/specs/functional/[feature]/`
- Technical: `docs/specs/technical/`
- Workflows: `docs/specs/workflows/`

---

**Start with `docs/specs/context/always-on.md`**

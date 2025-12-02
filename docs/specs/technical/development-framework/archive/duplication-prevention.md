---
version: 2.0
status: partially-implemented
last_updated: 2025-11-30
---

# Duplication Prevention

```yaml
---
version: 2.0
status: partially-implemented
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: Patterns and practices to prevent creating duplicate code
skill: .claude/skills/duplication-prevention.md
implementation_gaps:
  - STOP trigger before file creation not enforced
  - Skill needs STOP trigger section added
---
```

## Overview

**Problem**: 35% of pain points traced to rampant duplication (87+ scripts, duplicate utilities)

**Solution**: Multi-layer prevention through Scout phase, skills, STOP triggers, and pre-commit validation

---

## Prevention Stack

### Layer 1: STOP Trigger Before File Creation (NEW - Not Yet Implemented)

> **Status**: ❌ STOP trigger not yet added to skill
> **Planned**: Update `.claude/skills/duplication-prevention.md`

Before creating ANY new file, the agent must:

1. **SEARCH**: Use grep/file_search for similar files
2. **ANALYZE**: Could existing file be extended instead?
3. **STOP**: If similar file exists, ask user:
   > "Found similar file at [path]. Options:
   > A) Extend existing file
   > B) Create new (explain why separate)
   > C) Cancel"

**Do NOT proceed until user confirms.**

### Layer 2: Scout Phase (Before Build)
Use reconnaissance to discover existing implementations:
```bash
# Claude CLI with Haiku
claude --model haiku -p "find existing [functionality]"

# Any tool: grep search
grep -r "similar-pattern" src/
```

### Layer 3: Specs as Source of Truth
Reference implementations in `docs/specs/functional/` and `docs/specs/technical/`

### Layer 4: Pre-Commit Validation
- `check-redundancy.js` blocks duplicate commits
- `jscpd` detects copy-paste patterns

### Layer 5: Skills Auto-Knowledge (Claude CLI Only)
`.claude/skills/duplication-prevention.md` auto-activates before file creation

---

## High-Duplication Areas (Always Search First)

| Location | File Count | Search Before Creating |
|----------|------------|------------------------|
| `scripts/` | 87+ scripts | Always check for existing scripts |
| `src/components/` | Many components | Check for similar UI patterns |
| `server/services/` | Business logic | Check for existing service methods |
| `src/utils/` | Frontend utilities | Check both frontend and server utils |
| `server/utils/` | Backend utilities | Check both frontend and server utils |

---

## Implementation Checklist

| Item | Status | Notes |
|------|--------|-------|
| Skill created | ✅ | `.claude/skills/duplication-prevention.md` |
| Scout phase documented | ✅ | In methodology |
| STOP trigger in skill | ❌ Todo | Add 3-step file creation process |
| Pre-commit validation | ⚠️ Bypassed | Blocked by ESLint errors |

---

## Related

- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Scout phase enforces this
- [Coding Standards](./coding-standards.md) - Reuse over duplication
- [File Organization](./file-organization.md) - Where new files belong

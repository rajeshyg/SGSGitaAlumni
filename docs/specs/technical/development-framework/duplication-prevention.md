---
version: 1.0
status: implemented
last_updated: 2025-11-26
---

# Duplication Prevention

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-26
applies_to: all
enforcement: required
description: Patterns and practices to prevent creating duplicate code
skill: .claude/skills/duplication-prevention.md
---
```

## Overview

**Problem**: 35% of pain points traced to rampant duplication (87+ scripts, duplicate utilities)

**Solution**: Multi-layer prevention through Scout phase, skills, and pre-commit validation

---

## Prevention Stack

### Layer 1: Scout Phase (Before Build)
Use Haiku to discover existing implementations:
```bash
claude --model haiku -p "find existing [functionality]"
```

### Layer 2: Specs as Source of Truth
Reference implementations in `docs/specs/functional/` and `docs/specs/technical/`

### Layer 3: Pre-Commit Validation
- `check-redundancy.js` blocks duplicate commits
- `jscpd` detects copy-paste patterns

### Layer 4: Skills Auto-Knowledge
`.claude/skills/duplication-prevention.md` auto-activates before file creation

---

## Implementation Details

**Full patterns and checklist**: See [.claude/skills/duplication-prevention.md](../../../../.claude/skills/duplication-prevention.md)

**Key Rule**: Search FIRST, create SECOND

**High-Duplication Areas**:
- `scripts/` - 87+ scripts exist
- `src/components/` - UI components
- `server/services/` - Business logic
- `src/utils/` & `server/utils/` - Utilities

---

## Related

- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Scout phase enforces this
- [Coding Standards](./coding-standards.md) - Reuse over duplication

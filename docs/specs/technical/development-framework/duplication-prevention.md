---
version: 2.0
status: implemented
last_updated: 2025-11-30
---

# Duplication Prevention

```yaml
---
version: 2.0
status: implemented
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: Patterns and practices to prevent creating duplicate code (Tool-Agnostic)
skill: .claude/skills/duplication-prevention.md
---
```

## Overview

**Problem**: 35% of pain points traced to rampant duplication (87+ scripts, duplicate utilities)

**Solution**: Multi-layer prevention through Phase 0 constraints, Scout phase, skills, and pre-commit validation

---

## STOP Trigger: File Creation

**Before creating ANY new file, STOP and verify:**

### 3-Step File Creation Process

```
1. SEARCH: Find similar files
   # CLI (works with any AI tool)
   grep -r "similar-name" src/
   grep -r "similar-name" server/
   
2. ANALYZE: Could existing file be extended?
   - Read existing files for patterns
   - Check if functionality already exists
   
3. STOP: If similar file exists, ask user:
   "Found similar file at [path]. Options:
   A) Extend existing file
   B) Create new (explain why separate)
   C) Cancel"
```

**Do NOT proceed with file creation until user confirms option B or C.**

---

## Prevention Stack

### Layer 1: Phase 0 Constraints
Check LOCKED files and STOP triggers before any task:
```bash
# Tool-agnostic CLI
node scripts/validation/validators/constraint-check.cjs <file-path>
```

### Layer 2: Scout Phase (Before Build)
Use discovery to find existing implementations:
```bash
# Claude Code CLI
claude --model haiku -p "find existing [functionality]"

# Any AI Tool: Search codebase manually
grep -r "function-name" src/
grep -r "class-name" server/
```

### Layer 3: Specs as Source of Truth
Reference implementations in `docs/specs/functional/` and `docs/specs/technical/`

### Layer 4: Pre-Commit Validation
- `check-redundancy.js` blocks duplicate commits
- `jscpd` detects copy-paste patterns

### Layer 5: Skills Auto-Knowledge (Claude CLI only)
`.claude/skills/duplication-prevention.md` auto-activates before file creation

---

## High-Duplication Areas

**ALWAYS search these directories before creating new files:**

| Directory | Risk | What to Search For |
|-----------|------|-------------------|
| `scripts/` | Very High (87+ scripts exist) | Utility scripts, automation |
| `src/components/` | High | UI components, shared elements |
| `server/services/` | High | Business logic services |
| `src/utils/` & `server/utils/` | High | Utility functions |
| `src/hooks/` | Medium | Custom React hooks |
| `routes/` | Medium | API endpoints |

---

## Tool-Agnostic Commands

### Search for Existing Code
```bash
# Search for similar file names
find . -name "*[pattern]*" -type f

# Search for similar function names
grep -r "functionName" src/ server/

# Search for similar class names
grep -r "ClassName" src/ server/

# Use jscpd for copy-paste detection
npx jscpd src/ --min-lines 5 --min-tokens 50
```

### Run Redundancy Validation
```bash
# Run redundancy check
node scripts/validation/check-redundancy.js

# Run full validation
node scripts/validation/validate-structure.cjs
```

---

## Implementation Details

**Full patterns and checklist**: See [.claude/skills/duplication-prevention.md](../../../../.claude/skills/duplication-prevention.md)

**Key Rule**: Search FIRST, create SECOND

**Self-Checklist Before Creating Files**:
- [ ] Searched high-duplication directories
- [ ] No similar functionality exists
- [ ] User approved if similar file found
- [ ] Following existing patterns

---

## Related

- [Constraints and Validation](./constraints-and-validation.md) - Phase 0 STOP triggers
- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Scout phase enforces this
- [Coding Standards](./coding-standards.md) - Reuse over duplication

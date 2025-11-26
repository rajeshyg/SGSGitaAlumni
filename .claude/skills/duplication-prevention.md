---
name: duplication-prevention
description: Auto-activate before creating any new files, components, utilities, or services. Ensures AI checks for existing implementations before creating new code to prevent the rampant duplication syndrome.
---

# Duplication Prevention Skill

**Critical Project Rule**: Before creating ANY new file, you MUST search the codebase for existing similar implementations.

## When This Skill Applies

Auto-triggers when you're about to:
- Create a new file
- Write a new component
- Implement a new utility function
- Build a new service or middleware
- Add a new route handler

## Mandatory Pre-Creation Checklist

Before creating any new file, you MUST:

### 1. Search for Existing Implementations

Use one of these approaches:
- **Grep** for similar functionality: `pattern: "[keyword]"`
- **Glob** for similar file names: `pattern: "**/*[keyword]*.{js,ts,tsx}"`
- **Task tool** with `subagent_type=Explore` for broader discovery

### 2. Check These High-Duplication Areas

**Scripts**: 87+ root-level scripts exist - check `scripts/` directory:
```
scripts/core/          - Core functionality
scripts/database/      - Database operations
scripts/validation/    - Validation scripts
scripts/archive/       - Historical scripts
```

**Components**: Check for UI component duplicates:
```
src/components/        - Shared components
src/pages/            - Page-specific components
```

**Services**: Check for service duplicates:
```
server/services/      - Business logic services
middleware/           - Middleware functions
routes/               - API route handlers
```

**Utilities**: Check for utility duplicates:
```
src/utils/            - Frontend utilities
server/utils/         - Backend utilities
```

### 3. Review Specs Before Creating

Check specifications first:
- Functional specs: `docs/specs/functional/[domain]/`
- Technical specs: `docs/specs/technical/`
- Existing workflows: `docs/specs/workflows/`

These show canonical implementations - don't duplicate them.

### 4. Use Existing Patterns

If similar code exists:
- ✅ **REUSE**: Import and use the existing implementation
- ✅ **EXTEND**: Add to existing file if cohesive
- ✅ **REFACTOR**: Extract common logic into shared utility
- ❌ **DON'T**: Create a new similar file

## Pre-Commit Protection

This project has automated duplication detection:
- `check-redundancy.js` runs in pre-commit hook
- Blocks commits with duplicate files
- Reports copy-paste patterns via `jscpd`

**Your job**: Prevent duplication BEFORE pre-commit fails.

## Example Workflow

**WRONG**:
```
User: "Create a new email validation utility"
You: *creates src/utils/emailValidator.ts*
Result: Pre-commit fails - src/utils/validation.ts already has email validation
```

**RIGHT**:
```
User: "Create a new email validation utility"
You: "Let me first check for existing email validation..."
*Searches codebase using Grep pattern: "email.*valid"*
You: "Found existing implementation in src/utils/validation.ts:42"
You: "I'll use the existing validateEmail() function instead of creating a duplicate"
Result: No duplication, pre-commit passes
```

## Critical Reminders

1. **Search FIRST, create SECOND**
2. **87+ scripts exist** - very likely your functionality already exists
3. **Specs are source of truth** - check them before implementing
4. **Pre-commit will catch you** - save time by checking upfront

## Integration with SDD/TAC

This skill enhances the Scout phase:
- **Scout phase**: Discover existing implementations (this skill reinforces)
- **Plan phase**: Decide if new file is truly needed
- **Build phase**: Reuse existing code when possible

---

**Remember**: The best code is code that already exists and works. Don't reinvent the wheel.

---
version: 1.0
status: planned
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: LOCKED files, STOP triggers, and tool-agnostic validation infrastructure
---

# Constraints and Validation (Phase 0)

## Overview

**Purpose**: Define and enforce project constraints that must be checked BEFORE any coding task begins.

**Design Principle**: **Tool-Agnostic** - All validation logic lives in `scripts/validation/` as CLI commands runnable by any AI tool.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SINGLE SOURCE OF TRUTH                           │
│            scripts/validation/rules/exceptions.cjs                  │
│                                                                     │
│  exports: LOCKED_FILES, STOP_TRIGGERS, PORT_CONSTRAINTS             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              scripts/validation/validators/                         │
│                 constraint-check.cjs                                │
│                                                                     │
│  - CLI: node constraint-check.cjs <file> [--block]                 │
│  - Module: checkConstraints(path, options)                          │
└─────────────────────────────────────────────────────────────────────┘
           │                    │                      │
           ▼                    ▼                      ▼
   ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐
   │ Claude CLI   │    │  Pre-commit  │    │ Other AI Tools   │
   │   Hooks      │    │   (Husky)    │    │  (run CLI)       │
   │              │    │              │    │                  │
   │ pre-tool-use │    │ calls via    │    │ node constraint- │
   │ post-tool-use│    │ npm script   │    │ check.cjs <file> │
   └──────────────┘    └──────────────┘    └──────────────────┘
```

---

## LOCKED Files

Files that require explicit approval before modification.

### Critical Infrastructure (BLOCK)
| File | Reason | Approval Required |
|------|--------|-------------------|
| `server.js` | Main entry point | ✅ Yes |
| `config/database.js` | Database connection | ✅ Yes |
| `.env*` | Environment secrets | ✅ Yes |

### Security-Sensitive (BLOCK)
| File Pattern | Reason | Approval Required |
|--------------|--------|-------------------|
| `routes/auth.js` | Authentication routes | ✅ Yes |
| `middleware/auth.js` | Auth middleware | ✅ Yes |
| `routes/otp.js` | OTP verification | ✅ Yes |

### Configuration (WARN)
| File | Reason | Action |
|------|--------|--------|
| `package.json` | Dependencies | ⚠️ Warn only |
| `vite.config.js` | Build config | ⚠️ Warn only |
| `eslint.config.js` | Lint rules | ⚠️ Warn only |

---

## STOP Triggers

Actions that require user confirmation before proceeding.

| Action | Message | When |
|--------|---------|------|
| Create migration | "Creating new database migration - confirm schema changes" | Before creating any `.sql` or migration file |
| Delete file | "Deleting file - confirm this is intentional" | Before any file deletion |
| Modify API signature | "Changing API endpoint signature - may break clients" | When changing route parameters or response shape |
| Add dependency | "Adding new npm dependency - confirm necessity" | Before running `npm install <package>` |

---

## Port Constraints (Immutable)

These port assignments should NOT be changed without updating all configurations:

| Service | Port | Notes |
|---------|------|-------|
| Backend API | 3001 | Express server |
| Frontend Dev | 5173 | Vite dev server |

---

## Tool-Agnostic Usage

### For Any AI Tool (Manual)
```bash
# Check if a file is LOCKED
node scripts/validation/validators/constraint-check.cjs server.js

# Check with blocking (returns exit code 1 if blocked)
node scripts/validation/validators/constraint-check.cjs routes/auth.js --block

# Run all validation
node scripts/validation/validate-structure.cjs
```

### For Claude Code CLI (Automatic via Hooks)

**.claude/hooks/pre-tool-use-constraint.js**:
- Runs automatically before file modifications
- Exit code 2 = block the operation
- Uses shared logic from `scripts/validation/validators/constraint-check.cjs`

**.claude/hooks/post-tool-use-validation.js** (existing):
- Runs after file modifications
- Reports warnings and errors
- Uses shared validation logic

### For Pre-commit (Husky)

**.husky/pre-commit**:
- Calls validation scripts
- Blocks commit if constraints violated

---

## Implementation Status

### Phase 1: Foundation (Tool-Agnostic Validation)

| Task | Status | File |
|------|--------|------|
| Add LOCKED_FILES to exceptions.cjs | 🟡 Planned | `scripts/validation/rules/exceptions.cjs` |
| Add STOP_TRIGGERS to exceptions.cjs | 🟡 Planned | `scripts/validation/rules/exceptions.cjs` |
| Add PORT_CONSTRAINTS to exceptions.cjs | 🟡 Planned | `scripts/validation/rules/exceptions.cjs` |
| Create constraint-check.cjs validator | 🟡 Planned | `scripts/validation/validators/constraint-check.cjs` |
| Update PostToolUse hook | 🟡 Planned | `.claude/hooks/post-tool-use-validation.js` |
| Create PreToolUse hook | 🟡 Planned | `.claude/hooks/pre-tool-use-constraint.js` |
| Update settings.json for PreToolUse | 🟡 Planned | `.claude/settings.json` |

---

## Phase 0 Workflow

### Before ANY Coding Task

1. **Load Constraints**
   - Claude CLI: Auto-loaded via `project-constraints` skill
   - Other tools: Read `scripts/validation/rules/exceptions.cjs`

2. **Check LOCKED Files**
   ```bash
   node scripts/validation/validators/constraint-check.cjs <file-path>
   ```
   - If LOCKED → **STOP** and ask for user approval
   - If WARN → Proceed with caution

3. **Check STOP Triggers**
   - Creating migration? → Confirm schema changes
   - Deleting file? → Confirm intention
   - Changing API? → Confirm client impact
   - Adding dependency? → Confirm necessity

4. **Proceed to Scout Phase**
   - Only after constraints are satisfied

### Phase 0 Checklist

```markdown
## Phase 0: Constraints Check
- [ ] Files to modify identified
- [ ] No LOCKED file violations (or user approved)
- [ ] No STOP trigger actions (or user confirmed)
- [ ] Ready to proceed to Scout phase
```

---

## Integration Examples

### Example: Adding a New Feature

```
Task: Add password reset functionality

Phase 0: Constraints Check
├─ Will modify: routes/auth.js (LOCKED - security)
├─ STOP: Requires user approval
├─ User approved? YES
└─ Proceed to Scout

Phase 1: Scout
├─ Find existing auth patterns
├─ Find existing email utilities
└─ Report findings

Phase 2: Plan
├─ Design password reset flow
├─ Identify all file changes
└─ Get human approval

Phase 3: Build
└─ Implement approved plan

Phase 4: Validate
└─ Run all tests and checks
```

### Example: Simple Bug Fix

```
Task: Fix typo in utils.ts

Phase 0: Constraints Check
├─ Will modify: src/utils/utils.ts
├─ Not LOCKED, not WARN
└─ Proceed directly to Build

Phase 3: Build
└─ Fix typo

Phase 4: Validate
└─ Run tests
```

---

## Related Documents

- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Full workflow
- [Security Enforcement](./security-enforcement.md) - Security patterns
- [Duplication Prevention](./duplication-prevention.md) - STOP trigger for file creation

---

## Appendix: Code Samples

### exceptions.cjs Extension

```javascript
/**
 * LOCKED_FILES - Files requiring explicit approval before modification
 * Checked by: hooks (Claude CLI), pre-commit, manual CLI
 */
const LOCKED_FILES = {
  // Server Infrastructure
  critical: [
    { path: 'server.js', reason: 'Main entry point', approvalRequired: true },
    { path: 'config/database.js', reason: 'Database connection', approvalRequired: true },
    { pathPattern: /^\.env(\.\w+)?$/, reason: 'Environment secrets', approvalRequired: true },
  ],
  // Configuration (warn but don't block)
  sensitive: [
    { path: 'package.json', reason: 'Dependencies', warnOnly: true },
    { path: 'vite.config.js', reason: 'Build config', warnOnly: true },
    { path: 'eslint.config.js', reason: 'Lint rules', warnOnly: true },
  ],
  // Auth & Security
  security: [
    { pathPattern: /routes\/auth\.js$/, reason: 'Authentication routes', approvalRequired: true },
    { pathPattern: /middleware\/auth\.js$/, reason: 'Auth middleware', approvalRequired: true },
    { pathPattern: /routes\/otp\.js$/, reason: 'OTP routes', approvalRequired: true },
  ],
};

/**
 * STOP_TRIGGERS - Actions requiring user confirmation
 */
const STOP_TRIGGERS = [
  { action: 'create_migration', message: 'Creating new database migration - confirm schema changes' },
  { action: 'delete_file', message: 'Deleting file - confirm this is intentional' },
  { action: 'modify_api_signature', message: 'Changing API endpoint signature - may break clients' },
  { action: 'add_dependency', message: 'Adding new npm dependency - confirm necessity' },
];

/**
 * PORT_CONSTRAINTS - Immutable port assignments
 */
const PORT_CONSTRAINTS = {
  backend: 3001,
  frontend: 5173,
};

module.exports = { 
  EXCEPTION_REGISTRY, 
  IGNORED_PATHS,
  LOCKED_FILES,
  STOP_TRIGGERS,
  PORT_CONSTRAINTS,
};
```

### constraint-check.cjs Validator

```javascript
#!/usr/bin/env node
/**
 * CONSTRAINT VALIDATOR
 * 
 * Checks if file operations violate locked/sensitive file rules.
 * Runnable as: CLI command, hook import, pre-commit check
 * 
 * Usage:
 *   node scripts/validation/validators/constraint-check.cjs <file-path> [--block]
 *   
 * Exit codes:
 *   0 - OK (or warn-only violation)
 *   1 - Blocked (critical/security violation with --block flag)
 */

const { LOCKED_FILES } = require('../rules/exceptions.cjs');

function checkConstraints(filePath, options = {}) {
  const results = { blocked: false, warnings: [], errors: [] };
  
  for (const [category, rules] of Object.entries(LOCKED_FILES)) {
    for (const rule of rules) {
      const matches = rule.path 
        ? filePath.endsWith(rule.path)
        : rule.pathPattern?.test(filePath);
        
      if (matches) {
        const message = `[${category.toUpperCase()}] ${rule.reason}: ${filePath}`;
        
        if (rule.approvalRequired && options.block) {
          results.errors.push(message);
          results.blocked = true;
        } else if (rule.warnOnly) {
          results.warnings.push(message);
        } else {
          results.errors.push(message);
        }
      }
    }
  }
  
  return results;
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const filePath = args.find(a => !a.startsWith('--'));
  const block = args.includes('--block');
  
  if (!filePath) {
    console.log('Usage: node constraint-check.cjs <file-path> [--block]');
    process.exit(0);
  }
  
  const result = checkConstraints(filePath, { block });
  
  result.warnings.forEach(w => console.warn('⚠️', w));
  result.errors.forEach(e => console.error('🛑', e));
  
  process.exit(result.blocked ? 1 : 0);
}

module.exports = { checkConstraints };
```

---
version: 3.0
status: not-implemented
last_updated: 2025-12-02
applies_to: framework
description: LOCKED files, STOP triggers, and project boundary enforcement
---

# Constraints Enforcement: LOCKED Files, STOP Triggers, Security

---

## Overview

**Problem**: AI agents can accidentally modify critical files, delete important code, or bypass security patterns.

**Solution**: Deterministic constraint enforcement via:
1. **LOCKED files** - Require explicit approval before modification
2. **STOP triggers** - Require confirmation for destructive operations
3. **Security rules** - Enforced patterns for sensitive code
4. **PreToolUse hooks** - Block operations BEFORE they happen

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│              SINGLE SOURCE OF TRUTH                          │
│   scripts/validation/rules/exceptions.cjs                   │
│                                                             │
│   Exports:                                                  │
│   - LOCKED_FILES (critical, sensitive, security)           │
│   - STOP_TRIGGERS (destructive operations)                 │
│   - PORT_CONSTRAINTS (immutable assignments)               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              CONSTRAINT VALIDATOR                            │
│   scripts/validation/validators/constraint-check.cjs        │
│                                                             │
│   - CLI mode: node constraint-check.cjs <file> [--block]   │
│   - Module export: checkConstraints(filePath, options)      │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
    Claude CLI Hooks      Pre-commit Hook      Other AI Tools
    (PreToolUse)          (Husky)              (CLI command)
```

---

## Part 1: LOCKED Files

### Definition

Files that require **explicit human approval** before any modification.

### Categories

| Category | Files | Reason |
|----------|-------|--------|
| **Critical Infrastructure** | `server.js`, `config/database.js`, `.env*` | Core system files |
| **Security-Sensitive** | `routes/auth.js`, `middleware/auth.js`, `routes/otp.js` | Authentication system |
| **Configuration** | `package.json`, `vite.config.js`, `eslint.config.js` | Build/dependency changes |
| **Deployment** | `docker-compose.yml`, `Dockerfile`, `nginx.conf` | Infrastructure |
| **Framework** | `.claude/settings.json`, `.claude/hooks/*` | AI behavior |

### Implementation (TODO - Phase 1.1)

Add to `scripts/validation/rules/exceptions.cjs`:

```javascript
const LOCKED_FILES = {
  critical: [
    { path: 'server.js', reason: 'Main entry point', approvalRequired: true },
    { path: 'config/database.js', reason: 'Database connection', approvalRequired: true },
    { pathPattern: /^\.env(\.\w+)?$/, reason: 'Environment secrets', approvalRequired: true },
  ],
  sensitive: [
    { path: 'package.json', reason: 'Dependencies', warnOnly: true },
    { path: 'vite.config.js', reason: 'Build config', warnOnly: true },
  ],
  security: [
    { pathPattern: /routes\/auth\.js$/, reason: 'Authentication routes', approvalRequired: true },
    { pathPattern: /middleware\/auth\.js$/, reason: 'Auth middleware', approvalRequired: true },
  ],
};
```

### Enforcement Behavior

| Category | PreToolUse Hook | PostToolUse Hook |
|----------|-----------------|------------------|
| `critical` | **BLOCK** (exit 2), ask approval | Report modification |
| `sensitive` | **WARN**, allow | Report modification |
| `security` | **BLOCK** (exit 2), ask approval | Report modification |

### Manual Check (Until Implemented)

```bash
# Check if file is locked
node scripts/validation/validators/constraint-check.cjs server.js --block
# Exit 1 = blocked, Exit 0 = allowed
```

---

## Part 2: STOP Triggers

### Definition

Operations that require **human confirmation** before proceeding.

### Trigger List

| Trigger | Message | Risk |
|---------|---------|------|
| `create_migration` | "Creating new database migration - confirm schema changes" | Schema drift |
| `delete_file` | "Deleting file - confirm this is intentional" | Data loss |
| `modify_api_signature` | "Changing API endpoint signature - may break clients" | Breaking change |
| `add_dependency` | "Adding new npm dependency - confirm necessity" | Supply chain |
| `git_push` | "Pushing to remote - confirm ready" | Premature deploy |
| `drop_table` | "Dropping database table - confirm intentional" | Data loss |
| `chmod_777` | "Setting world-writable permissions - security risk" | Security |
| `sudo_command` | "Running with elevated privileges - confirm necessary" | Security |

### Implementation (TODO - Phase 1.1)

Add to `scripts/validation/rules/exceptions.cjs`:

```javascript
const STOP_TRIGGERS = [
  { action: 'create_migration', pattern: /migrations?\/.*\.(js|sql)$/i, message: 'Creating migration - confirm schema changes' },
  { action: 'delete_file', pattern: null, message: 'Deleting file - confirm intentional' },  // Checked by tool
  { action: 'modify_api', pattern: /routes\/.*\.js$/, message: 'API change - may break clients' },
  { action: 'add_dependency', pattern: /npm\s+install|yarn\s+add/i, message: 'Adding dependency - confirm necessity' },
];
```

### Enforcement Behavior

When STOP trigger detected:
1. Hook outputs warning message
2. **BLOCK** operation (exit 2)
3. Agent must explain and request confirmation
4. Human types "proceed" or "cancel"

---

## Part 3: Port Constraints

### Definition

Immutable port assignments that must never be reassigned.

### Port Registry

| Port | Service | Status |
|------|---------|--------|
| 3001 | Backend API | LOCKED |
| 5173 | Frontend (Vite) | LOCKED |
| 5432 | PostgreSQL | LOCKED |
| 6379 | Redis | LOCKED |

### Implementation (TODO - Phase 1.1)

Add to `scripts/validation/rules/exceptions.cjs`:

```javascript
const PORT_CONSTRAINTS = {
  3001: { service: 'backend', locked: true },
  5173: { service: 'frontend', locked: true },
  5432: { service: 'postgresql', locked: true },
  6379: { service: 'redis', locked: true },
};
```

### Enforcement

- Hook scans for port assignments in code/config
- Block if attempting to reassign locked port
- Allow new ports > 10000 for testing

---

## Part 4: Security Rules

### Enforced Patterns

| Rule | Pattern | Violation |
|------|---------|-----------|
| Parameterized queries | `[?, ?]` in SQL | String concatenation |
| Connection cleanup | `try/finally connection.release()` | Missing release |
| No sensitive logging | Never log passwords, tokens, OTP | Logging secrets |
| Server-side validation | Validate before DB operations | Client-only validation |
| Rate limiting | Auth endpoints rate-limited | Missing limiter |

### Security Skill

**File**: `.claude/skills/security-rules.md`  
**Status**: ✅ Implemented

Auto-triggers when working on:
- `routes/auth.js`, `middleware/auth.js`
- `routes/otp.js`, `config/database.js`
- Any file with `password`, `token`, `secret` keywords

### Historical Vulnerabilities (Resolved)

| Vulnerability | File | Fix |
|---------------|------|-----|
| SQL injection (CVE-2024-001) | Alumni search | Parameterized queries |
| Missing rate limiting | OTP endpoints | Added express-rate-limit |
| Logging passwords | Auth routes | Removed sensitive logs |
| Connection leak | Database queries | Added try/finally |
| XSS in chat | ChatList component | Sanitized input |

---

## Part 5: Hook Implementation

### PreToolUse Hook (TODO - Phase 1.4)

**File**: `.claude/hooks/pre-tool-use-constraint.js`

```javascript
#!/usr/bin/env node
/**
 * PreToolUse Hook: Constraint Enforcement
 * Exit code 2 = BLOCK the operation
 */
const { checkConstraints } = require('../../scripts/validation/validators/constraint-check.cjs');

let eventData = '';
process.stdin.on('data', chunk => eventData += chunk);
process.stdin.on('end', () => {
  const event = JSON.parse(eventData);
  const result = handlePreToolUse(event);
  process.exit(result.blocked ? 2 : 0);
});

function handlePreToolUse(event) {
  const { tool_name, tool_input } = event;
  if (!['Write', 'Edit', 'NotebookEdit'].includes(tool_name)) {
    return { blocked: false };
  }
  
  const filePath = tool_input?.file_path;
  if (!filePath) return { blocked: false };
  
  const result = checkConstraints(filePath, { block: true });
  if (result.blocked) {
    console.log('\n🛑 BLOCKED: This file requires approval before modification.');
    result.errors.forEach(e => console.log('  ' + e));
  }
  return result;
}
```

### settings.json Configuration (TODO - Phase 1.4)

```json
{
  "PreToolUse": [
    {
      "matcher": { "tools": ["Write", "Edit", "NotebookEdit"] },
      "hooks": [
        { "type": "command", "command": "node .claude/hooks/pre-tool-use-constraint.js" }
      ]
    }
  ],
  "PostToolUse": [
    {
      "matcher": { "tools": ["Write", "Edit", "NotebookEdit"] },
      "hooks": [
        { "type": "command", "command": "node .claude/hooks/post-tool-use-validation.js" }
      ]
    }
  ]
}
```

---

## Part 6: Project Boundary

### Forbidden Operations

| Operation | Reason |
|-----------|--------|
| Path traversal (`../`) | Access parent directories |
| Absolute paths outside project | System files |
| Import from external repos | Dependency issues |
| Copy from other projects | License/duplication |

### Enforcement

PreToolUse hook checks:
```javascript
if (filePath.includes('..')) {
  console.error('🚫 BOUNDARY VIOLATION: Path traversal blocked');
  exit(2);
}
```

---

## Implementation Status

| Component | Status | Phase |
|-----------|--------|-------|
| LOCKED_FILES export | 🔴 TODO | 1.1 |
| STOP_TRIGGERS export | 🔴 TODO | 1.1 |
| PORT_CONSTRAINTS export | 🔴 TODO | 1.1 |
| constraint-check.cjs | 🔴 TODO | 1.2 |
| PreToolUse hook | 🔴 TODO | 1.4 |
| PostToolUse integration | 🔴 TODO | 1.3 |
| project-constraints skill | 🔴 TODO | 1.5 |
| Security skill | ✅ Implemented | - |

---

## Manual Enforcement (Until Hooks Ready)

Until PreToolUse hooks are implemented:

1. **Before modifying any file in LOCKED list**: Ask user for approval
2. **Before destructive operations**: Confirm intention
3. **Before changing ports**: Check PORT_CONSTRAINTS
4. **Run validation after changes**:

```bash
node scripts/validation/validate-structure.cjs
```

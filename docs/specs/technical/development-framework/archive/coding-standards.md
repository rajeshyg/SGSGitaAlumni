---
version: 2.0
status: partially-implemented
last_updated: 2025-11-30
---

# Coding Standards

```yaml
---
version: 2.0
status: partially-implemented
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: Code quality standards enforced through skills and validation
skill: .claude/skills/coding-standards.md
implementation_gaps:
  - Skill file too large (419+ lines)
  - Should be split into topic-specific files
  - ESLint pre-commit bypassed
---
```

## Overview

**Purpose**: Maintain high code quality, prevent technical debt, enforce simplicity

**Historical Issues**: 1314-line ChatService god object, resource leaks, N+1 queries

---

## Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Skill created | ✅ | `.claude/skills/coding-standards.md` |
| PostToolUse validation | ✅ | Runs after file edits |
| Pre-commit ESLint | ⚠️ Bypassed | Blocked by existing errors |
| Skill size | ⚠️ Too large | 419+ lines, should split by topic |

### Planned Skill Split (Phase 2)

| File | Content | ~Lines |
|------|---------|--------|
| `coding-standards.md` | Core principles only | ~150 |
| `coding-standards-react.md` | React/component patterns | ~80 |
| `coding-standards-backend.md` | Node/Express patterns | ~80 |
| `coding-standards-database.md` | Query patterns, transactions | ~60 |

**Leverage existing lessons-learnt docs** instead of duplicating:
- `posting-architecture-overhaul.md` - State management, N+1 prevention
- `socketio-real-time-infrastructure.md` - Real-time patterns
- `phase-8-security-vulnerabilities-resolved.md` - Security patterns
- `shared-components-fixes.md` - Component architecture

---

## Core Principles

### 1. Simplicity Over Complexity
Ask: "Is this the simplest solution?"
- Avoid abstractions for one-time operations
- Prefer direct implementations over adapters
- Minimal abstraction layers

### 2. Service Size Limits
**Rule**: Services < 300 lines
If exceeding, split into focused services

### 3. Resource Management
**Rule**: ALWAYS use try/finally for database connections
```javascript
let connection;
try {
  connection = await pool.getConnection();
  // ... operations
} finally {
  if (connection) connection.release();
}
```

### 4. Transaction Support
**Pattern**: Accept optional connection parameter
```javascript
async function createEntity(entityData, connection = null) {
  // Enables transactions across multiple operations
}
```

### 5. N+1 Query Prevention
**Rule**: If loop + query, batch instead
```javascript
// ❌ N+1: Loop with query inside
for (const item of items) {
  item.relatedData = await getRelatedData(item.relatedId);
}

// ✅ Batched: Single query for all related data
const relatedIds = [...new Set(items.map(i => i.relatedId))];
const relatedData = await getRelatedDataByIds(relatedIds);
```

### 6. Avoid God Objects
**Rule**: If > 5 methods, question if it should be split
Split by domain responsibility

### 7. Error Handling
- Log with context (userId, action)
- Don't expose database errors to client
- Return `null` for not found

### 8. Component Size
**Rule**: Components < 300 lines
Extract hooks, utilities, sub-components

---

## ESLint Fix Strategy

> ESLint fixes happen **per-module during feature work**, not as separate framework task.

When working on a module:
1. Fix module's ESLint errors as part of the feature
2. Run `npx eslint --fix` for auto-fixable issues first
3. Address remaining errors manually
4. Commit with feature changes

---

## Related

- [Code Review Checklist](../coding-standards/code-review-checklist.md)
- [TypeScript Standards](../coding-standards/typescript.md)
- [SDD/TAC Methodology](./sdd-tac-methodology.md) - Build phase applies these

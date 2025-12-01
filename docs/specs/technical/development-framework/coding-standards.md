---
version: 2.0
status: implemented
last_updated: 2025-11-30
---

# Coding Standards

```yaml
---
version: 2.0
status: implemented
last_updated: 2025-11-30
applies_to: all
enforcement: required
description: Code quality standards enforced through skills and validation (Tool-Agnostic)
skill: .claude/skills/coding-standards.md
---
```

## Overview

**Purpose**: Maintain high code quality, prevent technical debt, enforce simplicity

**Historical Issues**: 1314-line ChatService god object, resource leaks, N+1 queries

**Planned Improvement**: Split into topic-specific skills (~150 lines core + topic files)
- Core principles (this document)
- React patterns (`coding-standards-react.md`) - planned
- Backend patterns (`coding-standards-backend.md`) - planned
- Database patterns (`coding-standards-database.md`) - planned

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

## Implementation Details

**Full standards and examples**: See [.claude/skills/coding-standards.md](../../../../.claude/skills/coding-standards.md)

**Auto-triggers** (Claude CLI): When working on service files, database code, components

**For other AI tools**: Read `.claude/skills/coding-standards.md` as context

**Self-Checklist**:
- [ ] Service < 300 lines
- [ ] try/finally for connections
- [ ] No N+1 queries
- [ ] No god objects
- [ ] Simplest solution chosen

---

## ESLint Fix Strategy

ESLint fixes happen **per-module during feature work**, not as separate framework task.

When working on a module:
1. Fix module's ESLint errors as part of the feature
2. Run `npx eslint --fix` for auto-fixable issues first
3. Address remaining errors manually
4. Commit with feature changes

This keeps fixes contextual and avoids massive "fix all ESLint" PRs.

---

## Related

- [Code Review Checklist](../coding-standards/code-review-checklist.md)
- [TypeScript Standards](../coding-standards/typescript.md)
- [Code Size Standards](../coding-standards/code-size-standards.md)
- [Historical Lessons](../../lessons-learnt/) - See for detailed case studies

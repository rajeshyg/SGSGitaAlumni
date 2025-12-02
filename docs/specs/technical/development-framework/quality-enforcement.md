---
version: 4.0
status: active
last_updated: 2025-12-02
applies_to: framework
description: AI-assisted development anti-patterns and domain-specific standards reference
---

# Quality Enforcement: AI-Assisted Development Patterns

---

## Overview

This document defines **quality enforcement patterns for AI-assisted development**, focusing on anti-patterns that AI agents commonly introduce. For general coding standards (TypeScript, naming, etc.), see the **Domain-Specific Standards Reference** below.

**Scope**: AI/Agent-specific quality issues that automated tools miss but impact maintainability.

---

## Domain-Specific Standards Reference

> **⚠️ CRITICAL**: Before implementing any task, AI/developer MUST review the relevant domain-specific standards.

| Domain | Standards Location | Review When |
|--------|-------------------|-------------|
| **TypeScript** | `docs/specs/technical/coding-standards/typescript.md` | Any TS/TSX code |
| **Naming** | `docs/specs/technical/coding-standards/naming-conventions.md` | Creating files/variables |
| **Code Size** | `docs/specs/technical/coding-standards/code-size-standards.md` | Any file edit |
| **Code Review** | `docs/specs/technical/coding-standards/code-review-checklist.md` | Pre-commit |
| **Database** | `docs/specs/technical/database/*.md` | DB schema/queries |
| **API Design** | `docs/specs/technical/architecture/api-design.md` | Route development |
| **Security** | `docs/specs/technical/security/*.md` | Auth/data handling |
| **Testing** | `docs/specs/technical/testing/*.md` | Test writing |

---

## AI-Specific Anti-Patterns

These patterns are commonly introduced by AI agents and require explicit enforcement.

### Anti-Pattern 1: God Objects

AI agents often consolidate too much logic into single files for "convenience."

---

## AI-Specific Size Limits

| Metric | Target | Action if Exceeded |
|--------|--------|-------------------|
| Service file | < 300 lines | Split by domain |
| Component file | < 200 lines | Extract sub-components |
| Function | < 50 lines | Extract helpers |
| Nesting | < 3 levels | Flatten or extract |

---

## AI Anti-Patterns: Service Layer

### 1. God Objects (Most Common)

```typescript
// ❌ WRONG: God object (1314 lines)
class ChatService {
  // Everything in one file
}

// ✅ RIGHT: Domain-focused services
class MessageService { }      // ~150 lines
class PresenceService { }     // ~100 lines
class NotificationService { } // ~100 lines
```

### 2. Resource Leaks (Connection Leaks)

```typescript
// ❌ WRONG: Connection leak
async function query() {
  const connection = await pool.getConnection();
  const result = await connection.query(sql);
  return result; // Connection never released!
}

// ✅ RIGHT: try/finally pattern
async function query() {
  const connection = await pool.getConnection();
  try {
    return await connection.query(sql);
  } finally {
    connection.release(); // Always released
  }
}
```

### 3. N+1 Query Pattern

AI often generates sequential queries in loops instead of batch operations.

```typescript
// ❌ WRONG: N+1 queries
const postings = await getPostings();
for (const p of postings) {
  p.author = await getUser(p.userId); // N queries!
}

// ✅ RIGHT: Batch fetch
const postings = await getPostings();
const userIds = [...new Set(postings.map(p => p.userId))];
const users = await getUsersByIds(userIds); // 1 query
const userMap = new Map(users.map(u => [u.id, u]));
postings.forEach(p => p.author = userMap.get(p.userId));
```

### 4. Swallowed Errors

AI agents often catch errors without proper handling, hiding issues.

```typescript
// ❌ WRONG: Swallowed errors
try {
  await riskyOperation();
} catch (e) {
  console.log('Failed'); // No context, no rethrow
}

// ✅ RIGHT: Proper error handling
try {
  await riskyOperation();
} catch (e) {
  logger.error('Operation failed', { error: e.message, context });
  throw new OperationError('Failed to complete operation', { cause: e });
}
```

---

## AI Anti-Patterns: Component Layer

### 1. Over-Coupled Components

```tsx
// ❌ WRONG: Component does too much
function PostingCard({ posting }) {
  // Fetches data, handles state, renders UI, manages side effects
}

// ✅ RIGHT: Separated concerns
function PostingCard({ posting }) {
  // Pure presentation
}

function usePosting(id) {
  // Data fetching hook
}
```

### 2. Prop Drilling (Context Neglect)

```tsx
// ❌ WRONG: Prop drilling
<App user={user}>
  <Layout user={user}>
    <Page user={user}>
      <Component user={user} />

// ✅ RIGHT: Context
const UserContext = createContext();
<UserContext.Provider value={user}>
  <App />
</UserContext.Provider>
```

### 3. Memory Leaks (Missing Effect Cleanup)

AI commonly forgets cleanup in useEffect, causing memory leaks.

```tsx
// ❌ WRONG: Memory leak
useEffect(() => {
  socket.on('message', handler);
  // No cleanup!
}, []);

// ✅ RIGHT: Cleanup function
useEffect(() => {
  socket.on('message', handler);
  return () => socket.off('message', handler);
}, []);
```

---

## AI Anti-Patterns: Database Layer

> **Full database standards**: `docs/specs/technical/database/`

### 1. SQL Injection (String Concatenation)

```javascript
// ❌ WRONG: SQL injection vulnerability
const sql = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ RIGHT: Parameterized
const sql = 'SELECT * FROM users WHERE id = ?';
const result = await query(sql, [userId]);
```

### 2. Missing Transaction Boundaries

```javascript
// ❌ WRONG: Partial updates
await updateUser(userId, data);
await createAuditLog(userId, 'update');
// If second fails, first already committed!

// ✅ RIGHT: Transaction
await withTransaction(async (tx) => {
  await updateUser(tx, userId, data);
  await createAuditLog(tx, userId, 'update');
});
```

### 3. Missing Index Consideration

```sql
-- ❌ WRONG: Full table scan
SELECT * FROM postings WHERE created_at > '2025-01-01';

-- ✅ RIGHT: Index-friendly
CREATE INDEX idx_postings_created_at ON postings(created_at);
SELECT * FROM postings WHERE created_at > '2025-01-01';
```

---

## AI Anti-Patterns: TypeScript

> **Full TypeScript standards**: `docs/specs/technical/coding-standards/typescript.md`

### 1. Overuse of `any` Type

```typescript
// ❌ WRONG
function process(data: any) { }

// ✅ RIGHT
function process(data: ProcessInput) { }

interface ProcessInput {
  id: string;
  value: number;
}
```

### 2. Null Reference Assumptions

```typescript
// ❌ WRONG: Potential null error
const user = await getUser(id);
return user.name; // user might be null!

// ✅ RIGHT: Explicit null handling
const user = await getUser(id);
if (!user) throw new NotFoundError('User not found');
return user.name;
```

---

## AI Anti-Patterns: Testing

> **Full testing standards**: `docs/specs/technical/testing/`

### 1. Testing Implementation Instead of Behavior

```typescript
// ❌ WRONG: Testing implementation
expect(service.privateMethod).toBeCalled();

// ✅ RIGHT: Testing behavior
expect(result.status).toBe('success');
expect(result.data).toMatchObject(expected);
```

### 2. Test State Leakage

```typescript
// ❌ WRONG: Tests depend on each other
let sharedState;
beforeAll(() => sharedState = createState());

// ✅ RIGHT: Independent tests
beforeEach(() => {
  // Fresh state for each test
});
```

---

## Pre-Commit Quality Checklist

### Service Code
- [ ] < 300 lines per service (no god objects)
- [ ] try/finally for all connections
- [ ] No N+1 queries (check loops with DB calls)
- [ ] Proper error handling (no swallowed errors)
- [ ] Parameterized SQL only

### Component Code
- [ ] < 200 lines per component
- [ ] Single responsibility
- [ ] Effect cleanup present
- [ ] No prop drilling (use context)

### Task-Specific Standards Reviewed
- [ ] Relevant domain standards consulted (see table above)

---

## Enforcement Automation

| Enforcement | Tool | Status |
|-------------|------|--------|
| Size limits | ESLint (sonarjs) | ✅ Implemented |
| Resource leaks | ESLint (sonarjs) | ✅ Implemented |
| SQL injection | Manual + skill | ⚠️ Partial |
| Effect cleanup | ESLint (react-hooks) | ✅ Implemented |
| Anti-patterns | `.claude/skills/coding-standards.md` | ✅ Implemented |

---

## References

For deeper patterns, see:
- `docs/lessons-learnt/posting-architecture-overhaul.md` - State management
- `docs/lessons-learnt/phase-8-security-vulnerabilities-resolved.md` - Security
- `docs/lessons-learnt/socketio-real-time-infrastructure.md` - Real-time

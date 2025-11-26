---
name: coding-standards
description: Auto-activate when working on service files, database code, API routes, or any backend/frontend code. Enforces code quality standards to prevent god objects, resource leaks, and over-engineering.
---

# Coding Standards Skill

**Purpose**: Maintain high code quality, prevent technical debt, and enforce simplicity principles.

## When This Skill Applies

Auto-triggers when working on:
- Service files (`server/services/*.js`)
- Database operations (any code using connection pools)
- API route handlers (`routes/*.js`)
- Frontend components (`src/components/**/*.tsx`)
- Utility functions

## Core Principles

### 1. Simplicity Over Complexity

**The Golden Rule**: "Simple over complex" - always ask "Is this the simplest solution?"

**❌ AVOID**:
- Abstractions for one-time operations
- Adapters when direct API calls suffice
- Helper functions used in only one place
- Premature optimization
- Over-engineered architectures

**✅ PREFER**:
- Direct, straightforward implementations
- Standard patterns from existing codebase
- Minimal abstraction layers
- Clear, readable code over clever code

**Example - WRONG (Over-engineered)**:
```javascript
// Creating an adapter for one-time use
class UserServiceAdapter {
  constructor(userService) {
    this.service = userService;
  }

  async getUser(id) {
    return this.service.getUserById(id);
  }
}
```

**Example - RIGHT (Simple)**:
```javascript
// Direct use
const user = await userService.getUserById(id);
```

### 2. Service Size Limits

**Rule**: Services should be **< 300 lines**

If a service exceeds 300 lines:
- ❌ Don't add more code
- ✅ Split into multiple focused services
- ✅ Extract cohesive functionality

**Historical Issue**: `ChatService` grew to 1314 lines (god object)

**How to Split**:
```javascript
// Before: ChatService.js (1314 lines)
// - Message handling
// - Conversation management
// - Notification logic
// - User presence
// - File uploads

// After: Split into focused services
MessageService.js        (180 lines) - Message CRUD
ConversationService.js   (150 lines) - Conversation management
NotificationService.js   (120 lines) - Notification logic
PresenceService.js       (90 lines)  - User presence
FileUploadService.js     (140 lines) - File handling
```

**Checklist for Services**:
- [ ] Service has single, clear responsibility
- [ ] Service is < 300 lines
- [ ] Methods are cohesive (all relate to same domain)
- [ ] If > 5 methods, consider splitting

### 3. Resource Management - ALWAYS Use try/finally

**Critical**: Database connections MUST be released in `finally` blocks

**❌ NEVER DO THIS**:
```javascript
async function getUser(userId) {
  const connection = await pool.getConnection();
  const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
  connection.release(); // ⚠️ Skipped if query throws!
  return rows[0];
}
```

**✅ ALWAYS DO THIS**:
```javascript
async function getUser(userId) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
    return rows[0];
  } finally {
    if (connection) connection.release(); // ✅ Always executed
  }
}
```

**Rule**: Every `pool.getConnection()` MUST have a matching `finally { connection.release() }`

### 4. Transaction Support - Connection Parameter Pattern

**Rule**: Functions that query the database SHOULD accept an optional connection parameter

**Why**: Enables transactions across multiple operations

**✅ IMPLEMENTATION**:
```javascript
// Service method supports transactions
async function createUser(userData, connection = null) {
  const shouldReleaseConnection = !connection;
  let conn = connection;

  try {
    if (!conn) {
      conn = await pool.getConnection();
    }

    const [result] = await conn.query(
      'INSERT INTO users (email, name) VALUES (?, ?)',
      [userData.email, userData.name]
    );

    return result.insertId;
  } finally {
    // Only release if we created the connection
    if (shouldReleaseConnection && conn) {
      conn.release();
    }
  }
}

// Usage in transaction
async function registerUserWithProfile(userData, profileData) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const userId = await createUser(userData, connection);
    await createProfile(userId, profileData, connection);

    await connection.commit();
    return userId;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}
```

**Pattern Benefits**:
- Single operations: no connection passed, auto-managed
- Transactions: connection passed, caller manages
- Prevents connection leaks in complex flows

### 5. N+1 Query Prevention

**Problem**: Loop with query inside = N database calls

**❌ N+1 ANTI-PATTERN**:
```javascript
// Fetches 1 query for posts, then N queries for each post's author
const posts = await getPosts();
for (const post of posts) {
  post.author = await getUser(post.authorId); // ⚠️ N queries!
}
```

**✅ BATCHED QUERY**:
```javascript
// Fetches posts, then 1 query for all authors
const posts = await getPosts();
const authorIds = [...new Set(posts.map(p => p.authorId))];
const authors = await getUsersByIds(authorIds); // ✅ 1 query!
const authorsMap = new Map(authors.map(a => [a.id, a]));

posts.forEach(post => {
  post.author = authorsMap.get(post.authorId);
});
```

**Detection Rule**: If you see `for/map + await query`, consider batching.

**Alternative - SQL JOIN**:
```javascript
// Best: Single query with JOIN
const query = `
  SELECT p.*, u.name as author_name, u.email as author_email
  FROM posts p
  JOIN users u ON p.author_id = u.id
  WHERE p.status = ?
`;
const posts = await connection.query(query, ['published']);
```

### 6. Architecture - Avoid God Objects

**Rule**: If object has > 5 methods, question if it should be split

**Signs of God Object**:
- File > 300 lines
- Many unrelated methods
- Mixed concerns (e.g., auth + email + storage in one service)
- Hard to test due to many dependencies

**Fix**: Split by domain responsibility

**Example**:
```javascript
// Before: UserService (god object)
class UserService {
  createUser()
  updateUser()
  deleteUser()
  sendWelcomeEmail()      // ❌ Email concern
  uploadProfilePhoto()    // ❌ Storage concern
  logUserActivity()       // ❌ Analytics concern
  validatePermissions()   // ❌ Auth concern
}

// After: Focused services
class UserService {
  createUser()
  updateUser()
  deleteUser()
}

class EmailService {
  sendWelcomeEmail()
}

class StorageService {
  uploadProfilePhoto()
}

class AnalyticsService {
  logUserActivity()
}

class PermissionService {
  validatePermissions()
}
```

### 7. Error Handling Standards

**✅ GOOD ERROR HANDLING**:
```javascript
async function getUser(userId) {
  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.query(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (rows.length === 0) {
      return null; // ✅ Return null for not found
    }

    return rows[0];
  } catch (error) {
    // Log with context, but don't expose internals
    logger.error('Failed to get user', { userId, error: error.message });
    throw new Error('Failed to retrieve user'); // ✅ Generic user message
  } finally {
    if (connection) connection.release();
  }
}
```

**Rules**:
- Log errors with context (userId, action)
- Don't expose database errors to client
- Return `null` for not found, not `undefined`
- Use specific error types when needed

### 8. Frontend Component Standards

**Component Size**: < 300 lines (including JSX)

**Component Responsibilities**:
- ✅ Render UI
- ✅ Handle user interactions
- ✅ Manage local state
- ❌ Direct API calls (use hooks/services)
- ❌ Business logic (extract to utilities)
- ❌ Complex calculations (extract to functions)

**Example - Component Too Large**:
```tsx
// ❌ 450 lines, mixed concerns
function UserDashboard() {
  // 50 lines of state
  // 100 lines of API logic
  // 200 lines of calculations
  // 100 lines of JSX
}
```

**Example - Split Properly**:
```tsx
// ✅ Focused components

// hooks/useUserData.ts (50 lines) - Data fetching
// utils/userCalculations.ts (70 lines) - Calculations
// components/UserStats.tsx (80 lines) - Stats display
// components/UserActions.tsx (90 lines) - Action buttons
// components/UserDashboard.tsx (120 lines) - Main layout
```

### 9. File Organization

**Backend Files**:
```
server/
├── services/          # Business logic (< 300 lines each)
├── routes/            # API endpoints (thin, delegate to services)
├── middleware/        # Request processing (auth, validation, etc.)
├── config/            # Configuration (database, env)
└── utils/             # Shared utilities
```

**Frontend Files**:
```
src/
├── components/        # Reusable UI components
├── pages/             # Page components
├── hooks/             # Custom React hooks
├── contexts/          # React contexts
├── services/          # API service layer
└── utils/             # Frontend utilities
```

**Rule**: Files go in their appropriate directory, not in root.

### 10. Code Review Self-Checklist

Before marking task complete, verify:

**Services**:
- [ ] Service < 300 lines
- [ ] Single responsibility
- [ ] Methods are cohesive
- [ ] try/finally for all connections
- [ ] Optional connection parameter for queries
- [ ] No N+1 queries

**Database Code**:
- [ ] Parameterized queries (security-rules.md)
- [ ] Connection released in finally
- [ ] Transaction support via connection param
- [ ] Proper error handling

**Components**:
- [ ] Component < 300 lines
- [ ] No direct API calls (use hooks)
- [ ] No complex business logic (extract)
- [ ] Proper prop types/interfaces

**General**:
- [ ] Simplest solution chosen
- [ ] No premature abstractions
- [ ] No god objects
- [ ] Follows existing patterns
- [ ] Properly tested

## Integration with Other Skills

This skill complements:
- **security-rules.md**: Database query security
- **duplication-prevention.md**: Reuse before creating
- **sdd-tac-workflow**: Scout phase finds existing patterns

## 🚨 Production Code vs Test Code - CRITICAL DISTINCTION

### Production Code MUST Use Real APIs/Database

**The Problem**: AI often creates "fake production code" - UI that appears functional but has NO real API/database connectivity. This includes:
- Hardcoded data displayed in components
- Mock UI with static values
- Fallback data that bypasses API calls
- "Demo mode" implementations delivered as production-ready

**❌ NEVER IN PRODUCTION CODE**:
```typescript
// ❌ Hardcoded fake data in a component
const Dashboard = () => {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
  ];
  return <UserList users={users} />; // This is FAKE - not connected to API!
};

// ❌ Fallback that bypasses real data
const getAlumniCount = () => {
  return 42; // Hardcoded! Should fetch from API
};

// ❌ Mock data disguised as real
const mockPosts = generateFakePosts(10);
export default function Feed() {
  return <PostList posts={mockPosts} />; // NOT production ready!
}
```

**✅ CORRECT PRODUCTION CODE**:
```typescript
// ✅ Real API call
const Dashboard = () => {
  const { data: users, loading } = useQuery('/api/users');
  if (loading) return <Spinner />;
  return <UserList users={users} />;
};

// ✅ Real database query
const getAlumniCount = async () => {
  const result = await db.query('SELECT COUNT(*) FROM alumni');
  return result[0].count;
};

// ✅ Real API integration
export default function Feed() {
  const { posts, loading } = usePosts();
  return <PostList posts={posts} loading={loading} />;
}
```

### Test Code CAN and SHOULD Use Test Data

**Test files are EXEMPT** from mock data rules. Using fixtures, mocks, and test data is:
- ✅ **Expected** in unit tests
- ✅ **Correct** for integration tests (with test database)
- ✅ **Standard practice** across the industry

**✅ ALLOWED IN TEST FILES**:
```typescript
// ✅ Test fixtures are fine
const testUser = { id: 1, name: 'Test User', email: 'test@test.com' };

// ✅ Faker in test files is fine
import { faker } from '@faker-js/faker';
const mockUsers = Array.from({ length: 10 }, () => ({
  name: faker.person.fullName(),
  email: faker.internet.email()
}));

// ✅ Mocking API calls in tests is fine
vi.mock('../services/api', () => ({
  fetchUsers: vi.fn().mockResolvedValue([testUser])
}));
```

### ESLint Enforcement

The `no-mock-data` ESLint rules are:
- **ENABLED** for `src/components/**`, `src/pages/**`, `server/**`
- **DISABLED** for `*.test.*`, `*.spec.*`, `__tests__/**`, `tests/**`

This is configured in `eslint.config.js`.

### Pre-Commit Detection

`scripts/core/detect-mock-data.js` runs on commit and:
- **SKIPS** test files (`.test.`, `.spec.`, `__tests__`, etc.)
- **FLAGS** mock patterns in production code only

### Self-Check Questions

Before delivering production code, ask:
1. "Does this component fetch real data or is it hardcoded?"
2. "Will this work if I delete the hardcoded values?"
3. "Is there actual API/database connectivity?"
4. "Am I using fallback data that bypasses the real implementation?"

If any answer is concerning, **fix it before claiming production-ready**.

## Historical Issues (Never Repeat)

1. **ChatService 1314 lines**: God object, hard to maintain → Split into focused services
2. **Missing finally blocks**: Connection leaks under errors → Always use try/finally
3. **N+1 queries in feed**: Slow performance → Use batching or JOINs
4. **Over-engineered Feed System**: Deleted due to complexity → Keep it simple

## When in Doubt

Ask yourself:
1. "Is this the simplest solution?"
2. "Is this file getting too large?"
3. "Am I creating abstractions I'll actually use?"
4. "Does this query run in a loop?" (N+1 check)
5. "Will this connection be released on error?"

---

**Remember**: Code should be simple, focused, and maintainable. "Good code is code that's easy to delete."

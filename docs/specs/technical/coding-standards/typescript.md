---
title: TypeScript Patterns
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: frontend
enforcement: required
eslint_rules:
  - "@typescript-eslint/no-explicit-any"
  - "@typescript-eslint/explicit-function-return-type"
  - "@typescript-eslint/prefer-interface"
---

# TypeScript Patterns

## Type Safety Requirements

### Strict Mode
TypeScript strict mode must be enabled in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

### No `any` Types

```typescript
// Bad: Using any type
function processData(data: any): any {
  return data.value
}

// Good: Using unknown with type guards
function processData(data: unknown): string {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return String((data as { value: unknown }).value)
  }
  throw new Error('Invalid data format')
}
```

**ESLint Rule**: `@typescript-eslint/no-explicit-any`

### Explicit Return Types

```typescript
// Bad: Implicit return type
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Good: Explicit return type
function calculateTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0)
}
```

**ESLint Rule**: `@typescript-eslint/explicit-function-return-type`

## Interface Patterns

### Interface Over Type for Objects

```typescript
// Bad: Type alias for object shapes
type User = {
  id: string
  name: string
  email: string
}

// Good: Interface for object shapes
interface User {
  id: string
  name: string
  email: string
}
```

**Reason**: Interfaces are more extensible and provide better error messages.

### Extending Interfaces

```typescript
// Good: Interface extension
interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

interface User extends BaseEntity {
  name: string
  email: string
  role: UserRole
}

interface Post extends BaseEntity {
  title: string
  content: string
  authorId: string
}
```

### Props Interfaces

```typescript
// Good: Component props interface
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick
}) => {
  // Implementation
}
```

## Generic Usage

### Generic Functions

```typescript
// Good: Generic utility function
function getById<T extends { id: string }>(
  items: T[],
  id: string
): T | undefined {
  return items.find(item => item.id === id)
}

// Usage
const user = getById(users, '123')  // Type: User | undefined
const post = getById(posts, '456')  // Type: Post | undefined
```

### Generic Components

```typescript
// Good: Generic list component
interface ListProps<T> {
  items: T[]
  renderItem: (item: T) => React.ReactNode
  keyExtractor: (item: T) => string
}

function List<T>({ items, renderItem, keyExtractor }: ListProps<T>) {
  return (
    <ul>
      {items.map(item => (
        <li key={keyExtractor(item)}>{renderItem(item)}</li>
      ))}
    </ul>
  )
}
```

### Constrained Generics

```typescript
// Good: Constrained generic for API responses
interface ApiResponse<T> {
  data: T
  status: number
  message: string
}

async function fetchData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url)
  return response.json()
}
```

## Type Guards

### Custom Type Guards

```typescript
// Good: Type guard function
interface User {
  type: 'user'
  name: string
  email: string
}

interface Admin {
  type: 'admin'
  name: string
  permissions: string[]
}

function isAdmin(person: User | Admin): person is Admin {
  return person.type === 'admin'
}

// Usage
function handlePerson(person: User | Admin) {
  if (isAdmin(person)) {
    // person is Admin here
    console.log(person.permissions)
  } else {
    // person is User here
    console.log(person.email)
  }
}
```

## Utility Types

### Common Utility Types

```typescript
// Partial - make all properties optional
type UpdateUser = Partial<User>

// Pick - select specific properties
type UserCredentials = Pick<User, 'email' | 'password'>

// Omit - exclude specific properties
type PublicUser = Omit<User, 'password' | 'salt'>

// Required - make all properties required
type CompleteUser = Required<User>

// Readonly - make all properties readonly
type ImmutableUser = Readonly<User>
```

## Discriminated Unions

```typescript
// Good: Discriminated union for state management
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }

function UserProfile({ state }: { state: AsyncState<User> }) {
  switch (state.status) {
    case 'idle':
      return <p>Click to load user</p>
    case 'loading':
      return <Spinner />
    case 'success':
      return <UserCard user={state.data} />
    case 'error':
      return <Error message={state.error} />
  }
}
```

## Type Location

All shared types should be in `src/types/`:
```
src/types/
├── user.ts      # User-related types
├── auth.ts      # Authentication types
├── api.ts       # API response types
├── posting.ts   # Posting types
└── index.ts     # Re-exports
```

## Related Documentation

- [Naming Conventions](./naming-conventions.md)

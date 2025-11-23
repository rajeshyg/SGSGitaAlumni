---
title: Naming Conventions
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
enforcement: required
eslint_rules:
  - "camelcase"
  - "@typescript-eslint/naming-convention"
---

# Naming Conventions

## File Naming

### kebab-case for Files
All files should use kebab-case (lowercase with hyphens):

```
# Good
user-profile.tsx
auth-service.ts
format-date.ts
api-endpoints.ts

# Bad
UserProfile.tsx
authService.ts
formatDate.ts
apiEndpoints.ts
```

### Exceptions
- React component files may use PascalCase: `UserProfile.tsx`
- Test files match their source: `UserProfile.test.tsx`
- Type definition files: `user.d.ts`

## Component Naming

### PascalCase for Components

```typescript
// Good: PascalCase component names
function UserProfile() { }
function NavigationMenu() { }
function DashboardLayout() { }

// Bad: Other cases
function userProfile() { }
function user_profile() { }
function USERPROFILE() { }
```

### Descriptive Names

```typescript
// Good: Descriptive component names
function UserProfileCard() { }
function PostingListItem() { }
function AuthenticationForm() { }

// Bad: Vague or abbreviated names
function Card() { }           // Too generic
function UPC() { }            // Unclear abbreviation
function Item() { }           // Not descriptive
```

## Variable Naming

### camelCase for Variables and Functions

```typescript
// Good: camelCase
const userName = 'John'
const isActive = true
function getUserById(id: string) { }
function handleFormSubmit() { }

// Bad: Other cases
const user_name = 'John'
const IsActive = true
function GetUserById(id: string) { }
```

### UPPER_SNAKE_CASE for Constants

```typescript
// Good: Constants
const API_ENDPOINTS = {
  USERS: '/api/users',
  POSTS: '/api/posts'
}
const MAX_RETRY_COUNT = 3
const DEFAULT_PAGE_SIZE = 20

// Bad: Other cases for constants
const apiEndpoints = { }
const maxRetryCount = 3
```

### Boolean Prefixes

```typescript
// Good: Boolean prefixes
const isLoading = true
const hasError = false
const canEdit = true
const shouldFetch = true

// Bad: No boolean prefix
const loading = true
const error = false
const edit = true
```

## Naming by Type

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with `use` | `useAuth.ts` |
| Services | PascalCase | `AuthService.ts` |
| Utils | camelCase | `formatDate.ts` |
| Constants | UPPER_SNAKE | `API_ENDPOINTS` |
| CSS Modules | camelCase | `styles.userCard` |
| Interfaces | PascalCase with `I` prefix (optional) | `User` or `IUser` |
| Types | PascalCase | `UserRole` |
| Enums | PascalCase | `UserStatus` |

## Hooks Naming

```typescript
// Good: Hooks with use prefix
function useAuth() { }
function useLocalStorage() { }
function usePagination() { }
function useDebounce() { }

// Bad: Missing use prefix
function auth() { }
function getLocalStorage() { }
```

## Event Handler Naming

```typescript
// Good: handle prefix for event handlers
function handleClick() { }
function handleSubmit() { }
function handleInputChange() { }
function handleUserSelect() { }

// Good: on prefix for props
interface ButtonProps {
  onClick?: () => void
  onSubmit?: () => void
  onChange?: (value: string) => void
}
```

## Import Organization

### Order of Imports
1. React/Node built-ins
2. External packages
3. Internal aliases (@/)
4. Relative imports
5. Styles

```typescript
// Good: Properly organized imports
import React from 'react'
import { useState, useEffect } from 'react'

import { Button } from '@radix-ui/react-button'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useTheme } from '@/lib/theme/hooks'
import { api } from '@/lib/api'

import { formatDate } from '../utils/date'

import styles from './Component.module.css'
```

```typescript
// Bad: Mixed import organization
import React, { useState } from 'react'
import { Button } from '../ui/button'
import api from './api'
import styles from './styles.css'
import { z } from 'zod'
```

### Import Grouping with Blank Lines

```typescript
// Good: Blank lines between groups
import React from 'react'

import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'

// Bad: No separation
import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
```

## Type/Interface Naming

```typescript
// Good: Clear type names
interface User {
  id: string
  name: string
}

interface UserFormData {
  name: string
  email: string
}

type UserRole = 'admin' | 'moderator' | 'user'

type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
```

### Props Interface Naming

```typescript
// Good: ComponentNameProps pattern
interface ButtonProps { }
interface UserCardProps { }
interface PostingListProps { }

// Acceptable: Just Props for simple components
interface Props { }  // Only in small, focused files
```

## Database Naming

### Tables: snake_case plural
```sql
app_users
postings
conversations
```

### Columns: snake_case
```sql
user_id
created_at
is_active
```

### Foreign Keys: tablename_id
```sql
user_id
posting_id
conversation_id
```

## API Endpoint Naming

### RESTful patterns with kebab-case
```typescript
const API_ENDPOINTS = {
  USERS: '/api/users',
  USER_PROFILE: '/api/users/:id/profile',
  USER_SETTINGS: '/api/user-settings',
  POSTINGS: '/api/postings',
  POSTING_COMMENTS: '/api/postings/:id/comments'
}
```

## ESLint Configuration

```javascript
// .eslintrc.js
{
  rules: {
    'camelcase': ['error', { properties: 'never' }],
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: ['camelCase', 'UPPER_CASE', 'PascalCase']
      },
      {
        selector: 'function',
        format: ['camelCase', 'PascalCase']
      },
      {
        selector: 'typeLike',
        format: ['PascalCase']
      }
    ]
  }
}
```

## Related Documentation

- [TypeScript Patterns](./typescript.md)
- [File Organization](./file-organization.md)

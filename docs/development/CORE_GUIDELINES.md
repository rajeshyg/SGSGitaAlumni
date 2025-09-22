# Core Development Guidelines

This document outlines the fundamental coding standards, patterns, and best practices for the SGSGita Alumni project.

## 📏 Code Quality Standards

### File Size Limits
- **Maximum 300 lines** per file (general files)
- **Maximum 500 lines** per component file
- **Maximum 50 lines** per function
- **Reason**: AI context optimization and maintainability
- **ESLint**: Configured with component-specific overrides (see eslint.config.js)

### Function Complexity
- Functions should have a single responsibility
- Use early returns to reduce nesting
- Extract complex logic into smaller functions

### Import Organization
```typescript
// ✅ Good: Group related imports
import React from 'react'
import { useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { useTheme } from '@/lib/theme/hooks'
import { api } from '@/lib/api'

// ❌ Bad: Mixed import styles
import React, { useState } from 'react'
import { Button } from '../ui/button'
import api from './api'
```

## 🧪 Testing Guidelines

### Test File Organization
```
src/components/Button.tsx    # Component
src/components/Button.test.tsx # Test file (same directory)
```

### Test Patterns
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Principles
- Test user interactions, not implementation details
- Use descriptive test names
- Mock external dependencies
- Test edge cases and error states

## 🔒 Security-First Development Patterns

### Secure Data Handling
```typescript
// ✅ Secure data validation and sanitization
import { z } from 'zod'
import DOMPurify from 'dompurify'

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().min(13).max(120)
})

function sanitizeUserInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong'],
    ALLOWED_ATTR: []
  })
}

function validateAndSanitizeUser(data: unknown) {
  const validatedData = UserSchema.parse(data)
  return {
    ...validatedData,
    name: sanitizeUserInput(validatedData.name)
  }
}
```

### Authentication State Management
```typescript
// ✅ Secure authentication hook
function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    if (token) {
      validateToken(token)
        .then(setUser)
        .catch(() => {
          localStorage.removeItem('authToken')
          setUser(null)
        })
        .finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (credentials: LoginCredentials) => {
    const { user, token } = await authService.login(credentials)
    localStorage.setItem('authToken', token)
    setUser(user)
  }

  const logout = () => {
    localStorage.removeItem('authToken')
    setUser(null)
  }

  return { user, isLoading, login, logout }
}
```

## 🚫 Anti-Patterns to Avoid

### ❌ Large Components
```typescript
// Don't do this
function MassiveComponent() {
  // 500+ lines of code
  // Multiple responsibilities
  // Hard to test and maintain
}

// ✅ Do this instead
function UserProfile() {
  return (
    <div>
      <UserHeader />
      <UserDetails />
      <UserActions />
    </div>
  )
}
```

### ❌ Console Statements
```typescript
// ❌ Don't leave debug code
console.log('User data:', userData)
console.error('This should not happen')

// ✅ Use proper logging
import { logger } from '@/lib/logger'
logger.debug('User data processed', { userId: user.id })
logger.error('Authentication failed', { error })
```

### ❌ Duplicate Code
```typescript
// ❌ Don't repeat similar logic
function formatUserName(user: User) {
  return `${user.firstName} ${user.lastName}`
}

function formatAuthorName(author: Author) {
  return `${author.firstName} ${author.lastName}`
}

// ✅ Extract common logic
function formatFullName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`
}
```

### ❌ Deep Nesting
```typescript
// ❌ Hard to read
function processUser(user: User) {
  if (user) {
    if (user.isActive) {
      if (user.permissions) {
        if (user.permissions.canEdit) {
          // Do something
        }
      }
    }
  }
}

// ✅ Use early returns
function processUser(user: User) {
  if (!user) return
  if (!user.isActive) return
  if (!user.permissions?.canEdit) return
  
  // Do something
}
```

## 🌐 Platform-Specific Development Guidelines

### Mobile-First Component Development
```typescript
// ✅ Mobile-optimized component
const ResponsiveCard: React.FC<CardProps> = ({ children, ...props }) => {
  return (
    <Card 
      className={cn(
        "w-full max-w-sm mx-auto", // Mobile-first
        "md:max-w-md lg:max-w-lg", // Progressive enhancement
        props.className
      )}
      {...props}
    >
      {children}
    </Card>
  )
}
```

### Touch Interaction Patterns
```typescript
// ✅ Touch-optimized interactions
const TouchButton: React.FC<ButtonProps> = ({ children, ...props }) => {
  return (
    <Button
      className={cn(
        "min-h-[44px] min-w-[44px]", // Touch target size
        "active:scale-95 transition-transform", // Touch feedback
        props.className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
```

## 🔧 Tool Usage

See [Tool Usage Guide](../TOOL_USAGE.md) for detailed setup and configuration of all development tools including ESLint, SonarJS, jscpd, Husky, Vitest, Sentry, and Bundle Analyzer.

## 📋 Code Review Checklist

See [Code Review Checklist](../CODE_REVIEW_CHECKLIST.md) for comprehensive pre-review and review-time quality checks.

## 🤖 AI Assistant Guidelines

See [AI Collaboration Guidelines](../AI_COLLABORATION_GUIDELINES.md) for comprehensive AI assistance protocols and best practices.

## 📚 Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ESLint Rules](https://eslint.org/docs/rules/)

For component-specific patterns and theme development, see:
- [Component Patterns](./COMPONENT_PATTERNS.md)
- [Theme System](./THEME_SYSTEM.md)

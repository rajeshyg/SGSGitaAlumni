---
title: File Organization
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
enforcement: required
eslint_rules:
  - "max-lines"
  - "max-lines-per-function"
  - "complexity"
---

# File Organization

## File Size Limits

### Maximum Lines Per File
- **General files**: 500 lines maximum
- **Component files**: 800 lines maximum (due to JSX verbosity)

**ESLint Rule**: `max-lines`

```javascript
// .eslintrc.js
{
  rules: {
    'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }]
  }
}
```

### When Files Exceed Limits

```typescript
// Bad: Massive component file (500+ lines)
function MassiveComponent() {
  // Hundreds of lines of code
  // Multiple responsibilities
  // Hard to test and maintain
}

// Good: Split into smaller components
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

## Function Size Limits

### Maximum Lines Per Function
- **All functions**: 50 lines maximum
- **Complexity score**: Maximum 10

**ESLint Rules**: `max-lines-per-function`, `complexity`

```javascript
// .eslintrc.js
{
  rules: {
    'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
    'complexity': ['error', 10]
  }
}
```

### Function Complexity

```typescript
// Bad: Deep nesting (high complexity)
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

// Good: Early returns (low complexity)
function processUser(user: User) {
  if (!user) return
  if (!user.isActive) return
  if (!user.permissions?.canEdit) return

  // Do something
}
```

### Single Responsibility

```typescript
// Bad: Function doing multiple things
function handleUserSubmit(formData: FormData) {
  // Validate data
  // Transform data
  // Call API
  // Update state
  // Show notification
  // Navigate away
}

// Good: Split into focused functions
function handleUserSubmit(formData: FormData) {
  const validatedData = validateUserData(formData)
  const transformedData = transformForApi(validatedData)
  await submitUser(transformedData)
  showSuccessNotification()
  navigateToProfile()
}
```

## Directory Structure

### Frontend Source (`src/`)
```
src/
├── components/     # React components
│   ├── ui/         # Base UI components (Button, Card, etc.)
│   ├── forms/      # Form components
│   └── layout/     # Layout components (Header, Footer, etc.)
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── services/       # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
└── styles/         # Global styles
```

### Backend Source
```
routes/              # API route handlers
services/            # Business logic services
server/              # Server-specific code
config/              # Configuration files
```

### Test Files
```
tests/
├── e2e/            # Playwright E2E tests
├── unit/           # Unit tests
└── integration/    # Integration tests
```

### Documentation
```
docs/
├── specs/          # Current specifications (source of truth)
├── lessons-learned/# Historical knowledge
├── audits/         # Code audits
├── fixes/          # Bug fix documentation
└── archive/        # Deprecated documentation
```

## Forbidden Patterns

### Files to Avoid
- Backup files: `file-backup.js`, `file-old.js`
- Multiple versions: `service-v1.js`, `service-v2.js`
- User-specific scripts: `check-jayanthi.js`
- Duplicate stubs: `EmailService.js` when `EmailService.ts` exists

### Resolution
```bash
# Bad: Keep both JS and TS versions
src/services/EmailService.js   # Delete this
src/services/EmailService.ts   # Keep this

# Good: Only TypeScript version
src/services/EmailService.ts
```

## Component File Structure

```typescript
// Good: Consistent component file structure
import React from 'react'
import { useState, useEffect } from 'react'

// External imports
import { Button } from '@/components/ui/button'

// Internal imports
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from '@/utils/date'

// Types
interface UserCardProps {
  user: User
  onEdit?: () => void
}

// Constants
const MAX_NAME_LENGTH = 50

// Component
export function UserCard({ user, onEdit }: UserCardProps) {
  // Hooks first
  const [isExpanded, setIsExpanded] = useState(false)

  // Event handlers
  const handleToggle = () => setIsExpanded(!isExpanded)

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}

// Subcomponents (if small)
function UserAvatar({ src }: { src: string }) {
  return <img src={src} alt="Avatar" />
}
```

## Test File Organization

```
src/components/Button.tsx       # Component
src/components/Button.test.tsx  # Test file (same directory)
```

```typescript
// Good: Test file structure
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

## Module Organization

### One File Per Module
Each major module should have exactly one:
- `.mmd` (Mermaid) flow diagram in `docs/design/`
- E2E test file in `tests/e2e/`

**Modules**: authentication, user-management, directory, postings, messaging, dashboard, moderation, notifications, rating

## Validation

Run structure validation:
```bash
node scripts/validation/validate-structure.js
```

Expected output:
```
All validations passed!
Summary: 0 errors, 0 warnings
```

## Related Documentation

- [Naming Conventions](./naming-conventions.md)

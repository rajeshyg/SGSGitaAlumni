# Development Guidelines

This document outlines the coding standards, patterns, and best practices for the SGSGita Alumni project.

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
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Principles
- Test user interactions, not implementation details
- Use descriptive test names
- Test error states and edge cases
- Mock external dependencies

## 🎨 Component Patterns

### Component Structure
```typescript
interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  loading?: boolean
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  loading = false
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant }))}
      onClick={onClick}
      disabled={loading}
    >
      {loading ? 'Loading...' : children}
    </button>
  )
}
```

### Custom Hook Patterns
```typescript
// ✅ Good: Extract complex logic
export function useDataFetching(url: string) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchData()
  }, [url])

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await fetch(url)
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchData }
}
```

## 🌐 Platform-Specific Development Guidelines

### Mobile-First Component Development
```typescript
// ✅ Mobile-optimized component
export function ResponsiveButton({ children, onClick }: ButtonProps) {
  return (
    <button
      className="min-h-[44px] px-4 py-2 touch-manipulation
                active:scale-95 transition-transform duration-150
                focus:outline-none focus:ring-2 focus:ring-blue-500"
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

### Touch Interaction Patterns
```typescript
// ✅ Touch-optimized interactions
export function SwipeableCard({ children, onSwipe }: CardProps) {
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)

  const handleTouchStart = (e: TouchEvent) => setTouchStart(e.targetTouches[0].clientX)
  const handleTouchMove = (e: TouchEvent) => setTouchEnd(e.targetTouches[0].clientX)

  const handleTouchEnd = () => {
    const distance = touchStart - touchEnd
    if (Math.abs(distance) > 50) {
      onSwipe(distance > 0 ? 'left' : 'right')
    }
  }

  return (
    <div onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      {children}
    </div>
  )
}
```

### Cross-Platform Responsive Patterns
```typescript
// ✅ Platform-adaptive component
export function AdaptiveLayout({ children }: LayoutProps) {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth
      if (width < 768) setDeviceType('mobile')
      else if (width < 1024) setDeviceType('tablet')
      else setDeviceType('desktop')
    }

    checkDevice()
    window.addEventListener('resize', checkDevice)
    return () => window.removeEventListener('resize', checkDevice)
  }, [])

  const layouts = { mobile: MobileLayout, tablet: TabletLayout, desktop: DesktopLayout }
  const LayoutComponent = layouts[deviceType]
  return <LayoutComponent>{children}</LayoutComponent>
}
```

## ♿ Accessibility Development Practices

### Semantic HTML and ARIA
```typescript
// ✅ Accessible form component
export function AccessibleForm({ onSubmit }: FormProps) {
 const [errors, setErrors] = useState<Record<string, string>>({})

 return (
   <form
     onSubmit={onSubmit}
     role="form"
     aria-labelledby="form-title"
   >
     <h2 id="form-title">Contact Information</h2>

     <div>
       <label htmlFor="email" className="sr-only">
         Email Address (required)
       </label>
       <input
         id="email"
         type="email"
         aria-required="true"
         aria-describedby={errors.email ? "email-error" : undefined}
         aria-invalid={!!errors.email}
       />
       {errors.email && (
         <span id="email-error" role="alert" className="text-red-600">
           {errors.email}
         </span>
       )}
     </div>
   </form>
 )
}
```

### Keyboard Navigation
```typescript
// ✅ Keyboard-accessible component
export function KeyboardNavigableMenu({ items }: MenuProps) {
 const [focusedIndex, setFocusedIndex] = useState(0)

 const handleKeyDown = (e: KeyboardEvent) => {
   switch (e.key) {
     case 'ArrowDown':
       e.preventDefault()
       setFocusedIndex(prev => Math.min(prev + 1, items.length - 1))
       break
     case 'ArrowUp':
       e.preventDefault()
       setFocusedIndex(prev => Math.max(prev - 1, 0))
       break
     case 'Enter':
     case ' ':
       e.preventDefault()
       items[focusedIndex].onClick()
       break
   }
 }

 return (
   <ul role="menu" onKeyDown={handleKeyDown}>
     {items.map((item, index) => (
       <li key={item.id}>
         <button
           role="menuitem"
           tabIndex={index === focusedIndex ? 0 : -1}
           aria-current={index === focusedIndex}
           onClick={item.onClick}
         >
           {item.label}
         </button>
       </li>
     ))}
   </ul>
 )
}
```

## 🎨 Theme & Component Enhancement Guidelines

### CSS Variable Strategy

#### Essential Variables Only
- Limit CSS variables to **12-15 essential ones** per component type
- Focus on semantic naming over specific styling
- Prioritize reusability across multiple themes

```typescript
// ✅ Good: Essential table variables
interface TableThemeVariables {
  '--table-container': string;      // Background container
  '--table-header': string;         // Header background
  '--table-row-hover': string;      // Row hover state
  '--table-border': string;         // Border color
  '--table-freeze-shadow': string;  // Frozen column shadow
}

// ❌ Avoid: Too many specific variables
interface OverlySpecificVariables {
  '--table-header-text-color-primary': string;
  '--table-header-text-color-secondary': string;
  '--table-header-border-top-color': string;
  // ... 70+ variables
}
```

#### Variable Naming Convention
```typescript
// Pattern: --{component}-{element}-{state}
'--table-header'           // Component element
'--table-row-hover'        // Component element state
'--button-primary-active'  // Component variant state
'--badge-grade-a'          // Component semantic variant
```

### Theme Configuration Structure

#### Enhance Existing Themes
Always enhance existing theme files rather than creating new ones:

```typescript
// ✅ Enhance existing theme
// src/lib/theme/configs/dark.ts
export const darkTheme: ThemeConfiguration = {
  // ... existing configuration
  componentOverrides: {
    // ... existing overrides
    table: {
      container: 'hsl(222.2 84% 4.9%)',
      header: 'hsl(217.2 32.6% 17.5%)',
      rowHover: 'hsl(217.2 32.6% 17.5%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      freezeShadow: '2px 0 4px rgba(0,0,0,0.3)'
    }
  }
}
```

#### Semantic Color Usage
Prefer shadcn/ui semantic colors over custom CSS variables:

```typescript
// ✅ Preferred: Use shadcn/ui semantic colors
<Badge variant="destructive">Error</Badge>
<Badge className="bg-green-500">Success</Badge>

// ❌ Avoid: Custom CSS variables for simple cases
<Badge style={{ backgroundColor: 'var(--custom-error-color)' }}>Error</Badge>
```

### Performance Requirements

#### Theme Switching Performance
- Maintain **< 200ms** theme switching performance
- Use CSS variables for real-time updates
- Avoid JavaScript-based style calculations during theme changes

```typescript
// ✅ Performance-optimized theme switching
const applyTheme = (theme: ThemeConfiguration) => {
  // Batch CSS variable updates
  const root = document.documentElement;
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
```

## 🧩 Component Enhancement Guidelines

### Enhancement vs. Replacement Strategy

#### Always Enhance First
Before creating new components, enhance existing ones:

```typescript
// ✅ Enhance existing component
interface AdvancedTableProps extends TableProps {
  selection?: SelectionConfig;
  groupHeaders?: GroupHeaderConfig[];
  frozenColumns?: FrozenColumnsConfig;
  // ... additional features
}

// ❌ Avoid: Complete replacement
interface BrandNewTableProps {
  // Rebuilding everything from scratch
}
```

#### Wrapper Pattern for Complex Features
For significant enhancements, use the wrapper pattern:

```typescript
// ✅ Wrapper pattern
export function AdvancedDataTable<T>(props: AdvancedDataTableProps<T>) {
  // Advanced logic here
  return (
    <div className="advanced-table-wrapper">
      <Table {...baseTableProps}>
        {/* Enhanced content */}
      </Table>
    </div>
  );
}
```

### Component Architecture Standards

#### File Organization
```
src/components/ui/
├── advanced-data-table.tsx     # New advanced component
├── table.tsx                   # Original shadcn/ui component (unchanged)
├── enhanced-table.tsx          # Legacy component (if exists)
└── index.ts                    # Export all components
```

#### Export Strategy
```typescript
// src/components/ui/index.ts
export { Table } from './table'                    // Original
export { AdvancedDataTable } from './advanced-data-table'  // New
export type { AdvancedDataTableProps } from './advanced-data-table'
```

### TypeScript Standards

#### Interface Design
```typescript
// ✅ Comprehensive interface design
export interface AdvancedDataTableProps<T = any> {
  // Core data
  data: T[];
  columns: ColumnDef<T>[];

  // Feature configurations
  selection?: SelectionConfig<T>;
  groupHeaders?: GroupHeaderConfig[];
  frozenColumns?: FrozenColumnsConfig;
  mobile?: MobileConfig;

  // Behavior props
  searchable?: boolean;
  sortable?: boolean;
  pagination?: boolean;

  // Event handlers
  onRowClick?: (row: T) => void;
  onSelectionChange?: (rows: T[]) => void;

  // Styling
  className?: string;
}
```

#### Generic Type Support
```typescript
// ✅ Proper generic type usage
export function AdvancedDataTable<T = any>({
  data,
  columns,
  onRowClick
}: AdvancedDataTableProps<T>) {
  const handleRowClick = (row: T) => {
    onRowClick?.(row); // Type-safe callback
  };
}
```

### Performance Standards

#### Component Size Limits
- **Maximum 500 lines** per component file
- Split large components into smaller, focused components
- Use composition over inheritance

#### Lazy Loading Implementation
```typescript
// ✅ Implement lazy loading for large datasets
import { lazy, Suspense } from 'react';

const AdvancedDataTable = lazy(() => import('./advanced-data-table'));

export function LazyAdvancedDataTable(props: AdvancedDataTableProps) {
  return (
    <Suspense fallback={<TableSkeleton />}>
      <AdvancedDataTable {...props} />
    </Suspense>
  );
}
```

## 🔧 Implementation Process

### Phase 1: Analysis & Planning
1. **Analyze Requirements** - Understand the specific enhancement needs
2. **Review Existing Components** - Check what can be reused or enhanced
3. **Plan Architecture** - Design the enhancement strategy
4. **Create Task Breakdown** - Use task management tools for complex work

### Phase 2: Implementation
1. **Enhance Themes First** - Add necessary CSS variables and theme support
2. **Implement Core Features** - Build the main functionality
3. **Add Advanced Features** - Implement complex features like frozen columns
4. **Mobile Optimization** - Ensure responsive design and touch support

### Phase 3: Testing & Validation
1. **Cross-Theme Testing** - Verify functionality across all themes
2. **Performance Testing** - Ensure < 200ms theme switching
3. **Accessibility Testing** - Maintain WCAG 2.1 AA compliance
4. **Mobile Testing** - Validate responsive behavior

## 📚 Best Practices Summary

### ✅ Do's
- Enhance existing components before creating new ones
- Use semantic shadcn/ui colors when possible
- Limit CSS variables to 12-15 essential ones
- Maintain < 200ms theme switching performance
- Implement lazy loading for large components
- Use TypeScript generics for type safety
- Follow the wrapper pattern for complex enhancements

### ❌ Don'ts
- **Don't override theme CSS variables in static CSS files** (breaks theme switching)
- Don't create 70+ CSS variables for maintainability
- Don't replace working components unnecessarily
- Don't exceed 500 lines per component file
- Don't break existing theme switching performance
- Don't ignore mobile optimization
- Don't skip accessibility compliance
- Don't create redundant functionality

## 🎯 Success Criteria

### Quality Metrics
- **Performance**: < 200ms theme switching maintained
- **Accessibility**: WCAG 2.1 AA compliance
- **TypeScript**: 100% type coverage
- **Bundle Size**: Minimal increase (< 10KB per enhancement)
- **Maintainability**: Clear, documented, reusable code

### Feature Completeness
- All features work across 4 existing themes
- Mobile-responsive design implemented
- Touch-friendly interactions for mobile
- Proper error handling and loading states
- Comprehensive TypeScript support

### CSS Variable Management Rules

#### Critical Rule: Never Override Theme Variables in CSS
```css
/* ❌ NEVER DO THIS: Static CSS variables break theme switching */
:root {
  --muted: 210 40% 96%;          /* Overrides theme system */
  --background: 0 0% 100%;       /* Prevents dark mode */
  --foreground: 222.2 84% 4.9%;  /* Breaks theme injection */
}

/* ✅ CORRECT: Only non-theme static variables */
:root {
  --radius: 0.5rem;             /* Layout constant */
  --table-row-height: 48px;     /* Component constant */
  --table-selection-width: 48px; /* Component constant */
}
```

#### Component Styling Rules
```typescript
// ✅ ALWAYS use dynamic CSS variables in components
<div style={{ backgroundColor: 'hsl(var(--muted))' }}>
<thead style={{ backgroundColor: 'hsl(var(--muted))' }}>

// ❌ NEVER use hardcoded classes that conflict with theme system
<div className="bg-gray-100"> // Breaks dark mode
<thead className="bg-muted">  // May conflict with CSS overrides
```

## 🔒 Security-First Development Patterns

### Secure Data Handling
```typescript
// ✅ Secure data validation and sanitization
export function SecureUserProfile({ user }: ProfileProps) {
 // Input validation
 const validateInput = (input: string): boolean => {
   const sanitized = input.replace(/[<>]/g, '')
   return sanitized.length > 0 && sanitized.length < 100
 }

 // Secure API calls
 const updateProfile = async (data: UserData) => {
   try {
     const response = await fetch('/api/user/profile', {
       method: 'PUT',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': `Bearer ${getAuthToken()}`
       },
       body: JSON.stringify(data)
     })

     if (!response.ok) {
       throw new Error('Update failed')
     }

     // Log successful update for audit
     logSecurityEvent('profile_updated', { userId: user.id })
   } catch (error) {
     logSecurityEvent('profile_update_failed', { userId: user.id, error })
     throw error
   }
 }

 return (
   <form onSubmit={handleSubmit}>
     {/* Form fields with validation */}
   </form>
 )
}
```

### Authentication State Management
```typescript
// ✅ Secure authentication hook
export function useSecureAuth() {
 const [user, setUser] = useState<User | null>(null)
 const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null)

 useEffect(() => {
   // Check session expiry
   const checkSession = () => {
     if (sessionExpiry && new Date() > sessionExpiry) {
       logout()
     }
   }

   const interval = setInterval(checkSession, 60000) // Check every minute
   return () => clearInterval(interval)
 }, [sessionExpiry])

 const login = async (credentials: LoginCredentials) => {
   try {
     const response = await fetch('/api/auth/login', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(credentials)
     })

     if (response.ok) {
       const { user, token, expiresAt } = await response.json()
       setUser(user)
       setSessionExpiry(new Date(expiresAt))
       // Secure token storage
       sessionStorage.setItem('auth_token', token)
     }
   } catch (error) {
     throw new Error('Login failed')
   }
 }

 const logout = () => {
   setUser(null)
   setSessionExpiry(null)
   sessionStorage.removeItem('auth_token')
   // Clear any cached sensitive data
   clearSensitiveCache()
 }

 return { user, login, logout, isAuthenticated: !!user }
}
```

## 🚫 Anti-Patterns to Avoid

### ❌ Large Components
```typescript
// Don't do this
export function HugeComponent() {
  // 200+ lines of mixed logic
  // API calls, state management, UI rendering
  // Hard to test, maintain, and understand
}
```

### ❌ Console Statements
```typescript
// ❌ Don't leave debug code
console.log('Debug info')
console.error('Error occurred')

// ✅ Use proper logging or remove
// Remove console statements before committing
```

### ❌ Duplicate Code
```typescript
// ❌ Don't repeat similar logic
const formatDate1 = (date) => date.toLocaleDateString()
const formatDate2 = (date) => date.toLocaleDateString()

// ✅ Extract to utility
export const formatDate = (date: Date) => date.toLocaleDateString()
```

### ❌ Deep Nesting
```typescript
// ❌ Hard to read
if (condition1) {
  if (condition2) {
    if (condition3) {
      // Deep nesting
    }
  }
}

// ✅ Use early returns
if (!condition1) return
if (!condition2) return
if (!condition3) return
// Main logic here
```

## 🔧 Tool Usage

See [Tool Usage Guide](TOOL_USAGE.md) for detailed setup and configuration of all development tools including ESLint, SonarJS, jscpd, Husky, Vitest, Sentry, and Bundle Analyzer.

## 📋 Code Review Checklist

See [Code Review Checklist](CODE_REVIEW_CHECKLIST.md) for comprehensive pre-review and review-time quality checks.

## 🤖 AI Assistant Guidelines

See [AI Collaboration Guidelines](AI_COLLABORATION_GUIDELINES.md) for comprehensive AI assistance protocols and best practices.

## 📚 Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
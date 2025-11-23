---
title: Component Patterns
version: 1.0
status: active
last_updated: 2025-11-23
category: technical-specs
applies_to: frontend
framework: React + TypeScript
---

# Component Patterns

This document outlines component architecture patterns, best practices, and implementation guidelines for building reusable, maintainable components.

## Component Structure Patterns

### Basic Component Pattern

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
// Extract complex logic into hooks
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

## Component Enhancement Guidelines

### Enhancement vs. Replacement Strategy

#### Always Enhance First
Before creating new components, enhance existing ones:

```typescript
// Enhance existing Button component
interface EnhancedButtonProps extends ButtonProps {
  icon?: React.ReactNode
  tooltip?: string
}

export function EnhancedButton({ icon, tooltip, children, ...props }: EnhancedButtonProps) {
  return (
    <Tooltip content={tooltip}>
      <Button {...props}>
        {icon && <span className="mr-2">{icon}</span>}
        {children}
      </Button>
    </Tooltip>
  )
}
```

#### Wrapper Pattern for Complex Features
For significant enhancements, use the wrapper pattern:

```typescript
// Wrapper pattern for complex functionality
export function AsyncButton({ onAsyncClick, ...props }: AsyncButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await onAsyncClick()
    } finally {
      setLoading(false)
    }
  }

  return <Button {...props} loading={loading} onClick={handleClick} />
}
```

## Component Architecture Standards

### File Organization

```
src/components/ui/
├── button/
│   ├── Button.tsx           # Main component
│   ├── Button.test.tsx      # Tests
│   ├── Button.stories.tsx   # Storybook stories
│   └── index.ts            # Exports
```

### Export Strategy

```typescript
// src/components/ui/index.ts
export { Button } from './button'
export { Card } from './card'
export { Input } from './input'
```

## TypeScript Standards

### Interface Design

```typescript
// Comprehensive interface design
interface ComponentProps {
  // Required props first
  children: React.ReactNode

  // Optional props with defaults
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'

  // Event handlers
  onClick?: (event: React.MouseEvent) => void
  onFocus?: (event: React.FocusEvent) => void

  // HTML attributes
  className?: string
  disabled?: boolean

  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
}
```

### Generic Type Support

```typescript
// Proper generic type usage
interface SelectProps<T> {
  options: T[]
  value?: T
  onChange: (value: T) => void
  getLabel: (option: T) => string
  getValue: (option: T) => string
}

export function Select<T>({ options, value, onChange, getLabel, getValue }: SelectProps<T>) {
  // Implementation
}
```

## Performance Standards

### Component Size Limits
- **Maximum 500 lines** per component file
- Split large components into smaller, focused components
- Use composition over inheritance

### Lazy Loading Implementation

```typescript
// Implement lazy loading for large datasets
const VirtualizedList: React.FC<ListProps> = ({ items, renderItem }) => {
  const [visibleItems, setVisibleItems] = useState<Item[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Load more items
        }
      })
    })

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      {visibleItems.map(renderItem)}
    </div>
  )
}
```

## Form Patterns

### Controlled Form Components

```typescript
// Controlled form field pattern
interface FormFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

export function FormField({ label, value, onChange, error, required }: FormFieldProps) {
  const id = useId()

  return (
    <div className="space-y-2">
      <label htmlFor={id}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  )
}
```

## Loading and Error States

### Loading State Pattern

```typescript
// Skeleton loading pattern
export function CardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  )
}

// Usage with loading state
export function DataCard({ data, loading, error }: DataCardProps) {
  if (loading) return <CardSkeleton />
  if (error) return <ErrorState error={error} />
  return <Card data={data} />
}
```

### Error State Pattern

```typescript
// Error state with recovery action
interface ErrorStateProps {
  error: Error
  onRetry?: () => void
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="font-bold text-red-800">Something went wrong</h3>
      <p className="text-red-600">{error.message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-red-700 underline">
          Try again
        </button>
      )}
    </div>
  )
}
```

## Compound Component Pattern

```typescript
// Compound component for complex UI
const Card = ({ children }: { children: React.ReactNode }) => {
  return <div className="border rounded-lg shadow">{children}</div>
}

Card.Header = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4 border-b font-bold">{children}</div>
}

Card.Body = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4">{children}</div>
}

Card.Footer = ({ children }: { children: React.ReactNode }) => {
  return <div className="p-4 border-t bg-gray-50">{children}</div>
}

// Usage
<Card>
  <Card.Header>Title</Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Actions</Card.Footer>
</Card>
```

## Accessibility in Components

### Accessible Form Component

```typescript
// Accessible form component
export function AccessibleInput({ label, error, ...props }: InputProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className={cn(
          "w-full px-3 py-2 border rounded-md",
          error ? "border-red-500" : "border-gray-300"
        )}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
```

### Keyboard Navigation

```typescript
// Keyboard-accessible component
export function KeyboardNavigableList({ items, onSelect }: ListProps) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const listRef = useRef<HTMLUListElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(items[focusedIndex])
        break
    }
  }

  return (
    <ul ref={listRef} onKeyDown={handleKeyDown} role="listbox">
      {items.map((item, index) => (
        <li
          key={item.id}
          role="option"
          aria-selected={index === focusedIndex}
          className={cn(
            "px-4 py-2 cursor-pointer",
            index === focusedIndex && "bg-blue-100"
          )}
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

## Code References

- Base components: `src/components/ui/`
- Form components: `src/components/forms/`
- Layout components: `src/components/layout/`

## Related Documentation

- [Theme System](./theme-system.md)
- [Accessibility Standards](./accessibility.md)
- [Responsive Design](./responsive-design.md)

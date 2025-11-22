# Component Patterns

This document outlines component architecture patterns, best practices, and implementation guidelines for building reusable, maintainable components.

## 🎨 Component Structure Patterns

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

## 🧩 Component Enhancement Guidelines

### Enhancement vs. Replacement Strategy

#### Always Enhance First
Before creating new components, enhance existing ones:

```typescript
// ✅ Enhance existing Button component
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
// ✅ Wrapper pattern for complex functionality
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

### Component Architecture Standards

#### File Organization
```
src/components/ui/
├── button/
│   ├── Button.tsx           # Main component
│   ├── Button.test.tsx      # Tests
│   ├── Button.stories.tsx   # Storybook stories
│   └── index.ts            # Exports
```

#### Export Strategy
```typescript
// src/components/ui/index.ts
export { Button } from './button'
export { Card } from './card'
export { Input } from './input'
```

### TypeScript Standards

#### Interface Design
```typescript
// ✅ Comprehensive interface design
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

#### Generic Type Support
```typescript
// ✅ Proper generic type usage
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

### Performance Standards

#### Component Size Limits
- **Maximum 500 lines** per component file
- Split large components into smaller, focused components
- Use composition over inheritance

#### Lazy Loading Implementation
```typescript
// ✅ Implement lazy loading for large datasets
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

## 🌐 Cross-Platform Component Patterns

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

## ♿ Accessibility Component Patterns

### Semantic HTML and ARIA
```typescript
// ✅ Accessible form component
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
// ✅ Keyboard-accessible component
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

For theme-specific component development, see [Theme System](./THEME_SYSTEM.md).
For core development standards, see [Core Guidelines](./CORE_GUIDELINES.md).

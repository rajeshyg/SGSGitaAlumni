# Accessibility Implementation Guide

This document provides detailed implementation examples and code patterns for achieving WCAG 2.1 AA compliance as defined in the [Accessibility Compliance Standards](../standards/ACCESSIBILITY_COMPLIANCE.md).

## ♿ Semantic HTML & ARIA Implementation

### Proper Document Structure
```typescript
// ✅ Semantic HTML structure
const ArticlePage: React.FC = () => {
  return (
    <article>
      <header>
        <h1>Main Article Title</h1>
        <p>Published on <time dateTime="2024-01-15">January 15, 2024</time></p>
      </header>

      <nav aria-label="Table of contents">
        <ol>
          <li><a href="#section1">Section 1</a></li>
          <li><a href="#section2">Section 2</a></li>
        </ol>
      </nav>

      <section id="section1" aria-labelledby="section1-heading">
        <h2 id="section1-heading">Section 1: Introduction</h2>
        <p>Content here...</p>
      </section>

      <section id="section2" aria-labelledby="section2-heading">
        <h2 id="section2-heading">Section 2: Details</h2>
        <p>Content here...</p>
      </section>

      <footer>
        <p>Article footer information</p>
      </footer>
    </article>
  )
}
```

### ARIA Labels and Descriptions
```typescript
// ✅ Comprehensive ARIA implementation
const AccessibleForm: React.FC = () => {
  const [errors, setErrors] = useState<Record<string, string>>({})

  return (
    <form
      role="form"
      aria-labelledby="form-title"
      onSubmit={handleSubmit}
    >
      <h2 id="form-title">Contact Information</h2>

      <div>
        <label htmlFor="email" id="email-label">
          Email Address <span aria-label="(required)">(required)</span>
        </label>
        <input
          id="email"
          type="email"
          aria-labelledby="email-label"
          aria-describedby={errors.email ? "email-error" : "email-help"}
          aria-required="true"
          aria-invalid={!!errors.email}
          autoComplete="email"
        />
        <span id="email-help" className="sr-only">
          Enter your email address for contact purposes
        </span>
        {errors.email && (
          <span
            id="email-error"
            role="alert"
            aria-live="polite"
            className="text-red-600"
          >
            {errors.email}
          </span>
        )}
      </div>

      <button
        type="submit"
        aria-describedby="submit-help"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Submitting...' : 'Submit Form'}
      </button>
      <span id="submit-help" className="sr-only">
        Click to submit the contact form
      </span>
    </form>
  )
}
```

## ⌨️ Keyboard Navigation Implementation

### Focus Management
```typescript
// ✅ Keyboard navigation system
const KeyboardNavigation: React.FC = () => {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const itemRefs = useRef<(HTMLElement | null)[]>([])

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => prev < items.length - 1 ? prev + 1 : 0)
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => prev > 0 ? prev - 1 : items.length - 1)
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        handleItemSelect(items[focusedIndex])
        break
    }
  }

  useEffect(() => {
    itemRefs.current[focusedIndex]?.focus()
  }, [focusedIndex])

  return (
    <ul role="listbox" aria-label="Select an option" onKeyDown={handleKeyDown} tabIndex={0}>
      {items.map((item, index) => (
        <li
          key={item.id}
          ref={el => itemRefs.current[index] = el}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={-1}
          onClick={() => handleItemSelect(item)}
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

### Skip Links Implementation
```typescript
// ✅ Skip navigation links
const SkipLinks: React.FC = () => {
  return (
    <div className="skip-links">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 
                   bg-blue-600 text-white p-2 z-50"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-32
                   bg-blue-600 text-white p-2 z-50"
      >
        Skip to navigation
      </a>
    </div>
  )
}
```

## 🔊 Screen Reader Support

### Live Regions for Dynamic Content
```typescript
// ✅ Screen reader announcements
const LiveRegionAnnouncements: React.FC = () => {
  const [announcement, setAnnouncement] = useState('')
  const [status, setStatus] = useState('')

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAnnouncement(message)
    } else {
      setStatus(message)
    }
    
    // Clear after announcement
    setTimeout(() => {
      setAnnouncement('')
      setStatus('')
    }, 1000)
  }

  return (
    <>
      {/* For urgent announcements */}
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
      
      {/* For status updates */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {status}
      </div>
    </>
  )
}
```

### Accessible Data Tables
```typescript
// ✅ Accessible data table
const AccessibleDataTable: React.FC<TableProps> = ({ data, columns }) => {
  return (
    <table role="table" aria-label="Student grades">
      <caption className="sr-only">
        Student grades for the current semester. Use arrow keys to navigate.
      </caption>
      
      <thead>
        <tr role="row">
          {columns.map((column, index) => (
            <th
              key={column.id}
              role="columnheader"
              scope="col"
              aria-sort={column.sortDirection || 'none'}
              tabIndex={0}
              onClick={() => handleSort(column.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSort(column.id)
                }
              }}
            >
              {column.title}
              {column.sortDirection && (
                <span aria-hidden="true">
                  {column.sortDirection === 'asc' ? ' ↑' : ' ↓'}
                </span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row.id} role="row">
            {columns.map((column, colIndex) => (
              <td
                key={`${row.id}-${column.id}`}
                role={colIndex === 0 ? 'rowheader' : 'gridcell'}
                scope={colIndex === 0 ? 'row' : undefined}
              >
                {row[column.id]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

## 🎨 Color and Contrast Implementation

### Color Contrast Utilities
```typescript
// ✅ Color contrast utilities
export const colorContrast = {
  // WCAG AA compliant color combinations
  text: {
    primary: 'text-gray-900 dark:text-gray-100',     // 21:1 contrast
    secondary: 'text-gray-700 dark:text-gray-300',   // 12.6:1 contrast
    muted: 'text-gray-600 dark:text-gray-400',       // 7:1 contrast
  },
  
  background: {
    primary: 'bg-white dark:bg-gray-900',
    secondary: 'bg-gray-50 dark:bg-gray-800',
    accent: 'bg-blue-50 dark:bg-blue-900',
  },
  
  interactive: {
    link: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200',
    button: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500',
  }
}

// Contrast checking utility
export const checkContrast = (foreground: string, background: string): boolean => {
  // Implementation would calculate actual contrast ratio
  // Return true if ratio meets WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
  return calculateContrastRatio(foreground, background) >= 4.5
}
```

### High Contrast Mode Support
```typescript
// ✅ High contrast theme support
export const highContrastTheme = {
  colors: {
    background: '#000000',
    foreground: '#ffffff',
    primary: '#ffffff',
    secondary: '#ffff00',
    accent: '#00ffff',
    destructive: '#ff0000',
    border: '#ffffff',
    input: '#000000',
    ring: '#ffffff',
  },
  
  // CSS custom properties for high contrast
  cssVariables: {
    '--background': '0 0% 0%',
    '--foreground': '0 0% 100%',
    '--primary': '0 0% 100%',
    '--primary-foreground': '0 0% 0%',
    '--secondary': '60 100% 50%',
    '--secondary-foreground': '0 0% 0%',
    '--accent': '180 100% 50%',
    '--accent-foreground': '0 0% 0%',
    '--destructive': '0 100% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '0 0% 100%',
    '--input': '0 0% 0%',
    '--ring': '0 0% 100%',
  }
}
```

## 🎭 Motion and Animation Implementation

### Reduced Motion Support
```typescript
// ✅ Respecting user motion preferences
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}

// Usage in components
const AnimatedComponent: React.FC = () => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'transition-all duration-300',
        prefersReducedMotion && 'transition-none'
      )}
      style={{
        transform: prefersReducedMotion ? 'none' : 'translateY(-10px)',
        animation: prefersReducedMotion ? 'none' : 'fadeIn 0.3s ease-in-out'
      }}
    >
      Content with respectful animations
    </div>
  )
}
```

## 🧪 Accessibility Testing Implementation

### Automated Testing Utilities
```typescript
// ✅ Accessibility testing utilities
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

export const testAccessibility = async (component: ReactWrapper) => {
  const results = await axe(component.getDOMNode())
  expect(results).toHaveNoViolations()
}

// Usage in tests
describe('AccessibleComponent', () => {
  it('should have no accessibility violations', async () => {
    const wrapper = render(<AccessibleComponent />)
    await testAccessibility(wrapper)
  })

  it('should be keyboard navigable', async () => {
    const wrapper = render(<AccessibleComponent />)
    const firstButton = wrapper.find('button').first()
    
    firstButton.simulate('keydown', { key: 'Tab' })
    expect(document.activeElement).toBe(firstButton.getDOMNode())
  })
})
```

For complete accessibility compliance requirements, see [Accessibility Compliance Standards](../standards/ACCESSIBILITY_COMPLIANCE.md).

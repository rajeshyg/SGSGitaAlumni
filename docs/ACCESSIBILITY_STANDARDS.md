# Accessibility Standards

This document outlines comprehensive accessibility standards and implementation guidelines for achieving WCAG 2.1 AA compliance, ensuring that applications are usable by people with diverse abilities and assistive technologies.

## 🎯 WCAG 2.1 AA Compliance Overview

### Four Core Principles (POUR)
- **Perceivable**: Information and user interface components must be presentable to users in ways they can perceive
- **Operable**: User interface components and navigation must be operable
- **Understandable**: Information and the operation of user interface must be understandable
- **Robust**: Content must be robust enough that it can be interpreted reliably by a wide variety of user agents

### Conformance Levels
- **A (Lowest)**: Basic accessibility support
- **AA (Recommended)**: Enhanced accessibility with important barriers removed
- **AAA (Highest)**: Highest accessibility with all barriers removed

## ♿ Implementation Guidelines

### 1. Semantic HTML & ARIA

#### Proper Document Structure
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

#### ARIA Labels and Descriptions
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

### 2. Keyboard Navigation

#### Focus Management
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
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={index === focusedIndex ? 0 : -1}
          ref={(el) => itemRefs.current[index] = el}
          className="p-2 cursor-pointer outline-none focus:bg-blue-100 focus:ring-2 focus:ring-blue-500"
        >
          {item.label}
        </li>
      ))}
    </ul>
  )
}
```

#### Skip Links
```typescript
// ✅ Skip navigation links
const SkipLinks: React.FC = () => {
  return (
    <nav aria-label="Skip navigation">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                   bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
                   bg-blue-600 text-white px-4 py-2 rounded z-50"
      >
        Skip to navigation
      </a>
    </nav>
  )
}
```

### 3. Screen Reader Support

#### Live Regions for Dynamic Content
```typescript
// ✅ Screen reader announcements
const ScreenReaderAnnouncer: React.FC = () => {
  const [announcements, setAnnouncements] = useState<string[]>([])
  const announcerRef = useRef<HTMLDivElement>(null)

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message])

    // Clear announcements after screen readers have processed them
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1))
    }, 1000)
  }, [])

  return (
    <div
      ref={announcerRef}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {announcements.map((announcement, index) => (
        <div key={index}>{announcement}</div>
      ))}
    </div>
  )
}

// Usage
const DataTable: React.FC = () => {
  const announce = useAnnouncer()

  const handleSort = (column: string) => {
    // Sort data
    announce(`Table sorted by ${column} column`)
  }

  const handleFilter = (filter: string) => {
    // Apply filter
    announce(`${items.length} items found matching ${filter}`)
  }

  return (
    // Table implementation
  )
}
```

#### Accessible Data Tables
```typescript
// ✅ Accessible data table
const AccessibleDataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  sortable = true
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (columnId: string) => {
    if (!sortable) return

    if (sortColumn === columnId) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  return (
    <table
      role="table"
      aria-label="Data table"
      aria-rowcount={data.length}
      aria-colcount={columns.length}
    >
      <thead>
        <tr role="row">
          {columns.map((column, index) => (
            <th
              key={column.id}
              role="columnheader"
              aria-sort={
                sortColumn === column.id
                  ? sortDirection === 'asc' ? 'ascending' : 'descending'
                  : 'none'
              }
              aria-colindex={index + 1}
              scope="col"
            >
              {sortable ? (
                <button
                  onClick={() => handleSort(column.id)}
                  className="flex items-center gap-2 hover:bg-gray-100 px-2 py-1 rounded"
                  aria-label={`Sort by ${column.label}`}
                >
                  {column.label}
                  {sortColumn === column.id && (
                    <span aria-hidden="true">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ) : (
                column.label
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, rowIndex) => (
          <tr key={row.id} role="row" aria-rowindex={rowIndex + 2}>
            {columns.map((column, colIndex) => (
              <td
                key={column.id}
                role="gridcell"
                aria-colindex={colIndex + 1}
                headers={`${column.id}-header`}
              >
                {column.render ? column.render(row) : row[column.id]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
```

### 4. Color and Contrast

#### Color Contrast Compliance
```typescript
// ✅ Color contrast utilities (See src/constants/accessibility.ts)
import { COLOR_CONTRAST, AccessibilityUtils } from '@/constants/accessibility'

// Usage:
const isAccessible = AccessibilityUtils.isContrastValid(
  foregroundColor,
  backgroundColor,
  'normal', // or 'large'
  'AA' // or 'AAA'
)

// Direct access to standards:
const normalTextAA = COLOR_CONTRAST.NORMAL_TEXT.AA // 4.5
const largeTextAA = COLOR_CONTRAST.LARGE_TEXT.AA   // 3.0
```

// Usage in components
const AccessibleButton: React.FC<ButtonProps> = ({ variant, children }) => {
  const colors = {
    primary: {
      background: '#0066cc',
      foreground: '#ffffff'
    },
    secondary: {
      background: '#f0f0f0',
      foreground: '#333333'
    }
  }

  const currentColors = colors[variant]

  // Validate contrast in development
  if (process.env.NODE_ENV === 'development') {
    const isAccessible = ColorContrast.isAccessible(
      currentColors.foreground,
      currentColors.background
    )

    if (!isAccessible) {
      console.warn(`Button variant "${variant}" fails contrast requirements`)
    }
  }

  return (
    <button
      style={{
        backgroundColor: currentColors.background,
        color: currentColors.foreground
      }}
    >
      {children}
    </button>
  )
}
```

#### High Contrast Mode Support
```typescript
// ✅ High contrast theme support (See src/constants/accessibility.ts)
import { HIGH_CONTRAST_THEME } from '@/constants/accessibility'

// Usage:
const theme = HIGH_CONTRAST_THEME
const backgroundColor = theme.colors.background // '#000000'
const textColor = theme.colors.text.primary     // '#ffffff'
```

const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isHighContrast
}

const AccessibleComponent: React.FC = () => {
  const isHighContrast = useHighContrast()

  return (
    <div
      style={{
        backgroundColor: isHighContrast
          ? HighContrastTheme.colors.background
          : '#ffffff',
        color: isHighContrast
          ? HighContrastTheme.colors.text.primary
          : '#333333'
      }}
    >
      Content
    </div>
  )
}
```

### 5. Motion and Animation

#### Reduced Motion Support
```typescript
// ✅ Respecting user motion preferences (See src/constants/accessibility.ts)
import { MOTION_PREFERENCES } from '@/constants/accessibility'

const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOTION_PREFERENCES.REDUCED_MOTION.QUERY)
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return prefersReducedMotion
}
```

const AccessibleAnimation: React.FC = () => {
  const prefersReducedMotion = useReducedMotion()

  return (
    <div
      className={cn(
        'transition-all duration-300',
        {
          'transition-none': prefersReducedMotion
        }
      )}
      style={{
        animation: prefersReducedMotion ? 'none' : 'slideIn 0.3s ease-out'
      }}
    >
      Animated content
    </div>
  )
}
```

### 6. Error Handling and Validation

#### Accessible Form Validation
```typescript
// ✅ Accessible form validation
const AccessibleFormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  description,
  children
}) => {
  const fieldId = useId()
  const errorId = useId()
  const descriptionId = useId()

  const ariaDescribedBy = [
    description && descriptionId,
    error && errorId
  ].filter(Boolean).join(' ')

  return (
    <div>
      <label
        htmlFor={fieldId}
        className={cn(
          'block text-sm font-medium mb-2',
          { 'text-red-600': error }
        )}
      >
        {label}
        {required && (
          <span aria-label="required" className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-gray-600 mb-2">
          {description}
        </p>
      )}

      <div className="relative">
        {React.cloneElement(children as React.ReactElement, {
          id: fieldId,
          'aria-describedby': ariaDescribedBy || undefined,
          'aria-required': required,
          'aria-invalid': !!error
        })}
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="mt-1 text-sm text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}
```

## 🧪 Testing for Accessibility

### Automated Accessibility Testing
```typescript
// ✅ Accessibility testing utilities (See src/constants/accessibility.ts)
import { AccessibilityUtils, COLOR_CONTRAST } from '@/constants/accessibility'

// Usage:
const hasRequiredAria = AccessibilityUtils.isKeyboardNavigable(element)
const isContrastValid = AccessibilityUtils.isContrastValid(
  foregroundColor,
  backgroundColor,
  'normal',
  'AA'
)
```

// Jest accessibility tests
describe('Accessibility Tests', () => {
  it('should have proper ARIA labels', () => {
    render(<AccessibleButton>Click me</AccessibleButton>)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-label')
    expect(AccessibilityTestUtils.hasRequiredAria(button, 'button')).toBe(true)
  })

  it('should be keyboard navigable', () => {
    render(<AccessibleButton>Click me</AccessibleButton>)
    const button = screen.getByRole('button')

    button.focus()
    expect(button).toHaveFocus()
    expect(AccessibilityTestUtils.isKeyboardNavigable(button)).toBe(true)
  })

  it('should have sufficient color contrast', () => {
    render(<AccessibleButton variant="primary">Click me</AccessibleButton>)
    const button = screen.getByRole('button')

    const styles = window.getComputedStyle(button)
    const isAccessible = AccessibilityTestUtils.checkContrast(
      styles.color,
      styles.backgroundColor
    )

    expect(isAccessible).toBe(true)
  })
})
```

### Manual Accessibility Testing Checklist
- [ ] **Keyboard Navigation**: All interactive elements accessible via Tab/Enter/Space
- [ ] **Screen Reader**: Content readable and navigable with screen readers
- [ ] **Color Contrast**: All text meets WCAG AA contrast requirements
- [ ] **Focus Indicators**: Visible focus indicators on all interactive elements
- [ ] **Semantic HTML**: Proper heading hierarchy and landmark regions
- [ ] **Form Labels**: All form fields have associated labels
- [ ] **Error Messages**: Form errors announced to screen readers
- [ ] **Alt Text**: Meaningful alternative text for all images
- [ ] **Language**: Document language properly set
- [ ] **Zoom**: Content remains usable at 200% zoom

## 📊 Accessibility Compliance Monitoring

### Automated Compliance Checking
```typescript
// ✅ Continuous accessibility monitoring
class AccessibilityMonitor {
  private violations: AccessibilityViolation[] = []

  scanForViolations(): void {
    // Check for missing alt text
    const images = document.querySelectorAll('img:not([alt])')
    images.forEach(img => {
      this.reportViolation({
        type: 'missing-alt',
        element: img,
        message: 'Image missing alt attribute',
        severity: 'error'
      })
    })

    // Check for insufficient color contrast
    const textElements = document.querySelectorAll('*')
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element)
      if (!AccessibilityTestUtils.checkContrast(styles.color, styles.backgroundColor)) {
        this.reportViolation({
          type: 'contrast',
          element: element as HTMLElement,
          message: 'Insufficient color contrast',
          severity: 'warning'
        })
      }
    })

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
    inputs.forEach(input => {
      const label = document.querySelector(`label[for="${input.id}"]`)
      if (!label) {
        this.reportViolation({
          type: 'missing-label',
          element: input as HTMLElement,
          message: 'Form input missing associated label',
          severity: 'error'
        })
      }
    })
  }

  private reportViolation(violation: AccessibilityViolation): void {
    this.violations.push(violation)

    // Send to monitoring service
    this.sendToMonitoring(violation)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Accessibility violation: ${violation.message}`)
    }
  }

  getViolations(): AccessibilityViolation[] {
    return [...this.violations]
  }
}
```

This comprehensive accessibility standards document provides the foundation for creating inclusive web applications that meet WCAG 2.1 AA compliance requirements and serve users with diverse abilities effectively.
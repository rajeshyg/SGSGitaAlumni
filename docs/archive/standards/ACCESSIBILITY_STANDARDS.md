# Accessibility Standards (index)

This file is a high-level pointer. The authoritative accessibility standards and implementation guidance live in the `docs/standards` folder.

Primary documents:

- [Accessibility Compliance (authoritative)](standards/ACCESSIBILITY_COMPLIANCE.md) — WCAG 2.1 AA requirements, testing criteria, and compliance metrics
- [Accessibility Implementation Guide (examples & patterns)](accessibility/IMPLEMENTATION_GUIDE.md)

If you need implementation examples or the full technical reference, open the documents above. Large implementation content has been moved to the dedicated `docs/standards/ACCESSIBILITY_COMPLIANCE.md` and `docs/progress/phase-6/task-6.9-accessibility-automation-part-a.md` / `-part-b.md` files.

For changes to the standards document, update `docs/standards/ACCESSIBILITY_COMPLIANCE.md` and then update any referencing pages.

#### ARIA Labels and Descriptions
```typescript
// ✅ ARIA implementation
<form role="form" aria-labelledby="form-title">
  <h2 id="form-title">Contact Form</h2>

  <label htmlFor="email" id="email-label">
    Email <span aria-label="required">(required)</span>
  </label>
  <input
    id="email"
    type="email"
    aria-labelledby="email-label"
    aria-describedby="email-help"
    aria-required="true"
    aria-invalid={!!errors.email}
  />

  <span id="email-help" className="sr-only">
    Enter your email address
  </span>

  <button type="submit" aria-describedby="submit-help">
    Submit
  </button>
  <span id="submit-help" className="sr-only">
    Submit the form
  </span>
</form>
```

### 2. Keyboard Navigation

#### Focus Management
```typescript
// ✅ Keyboard navigation
<ul role="listbox" aria-label="Options" tabIndex={0}>
  {items.map((item, index) => (
    <li
      key={item.id}
      role="option"
      aria-selected={index === focusedIndex}
      tabIndex={index === focusedIndex ? 0 : -1}
      className="focus:bg-blue-100"
    >
      {item.label}
    </li>
  ))}
</ul>
```

#### Skip Links
```typescript
// ✅ Skip navigation links
<nav aria-label="Skip navigation">
  <a href="#main-content" className="sr-only focus:not-sr-only">
    Skip to main content
  </a>
  <a href="#navigation" className="sr-only focus:not-sr-only">
    Skip to navigation
  </a>
</nav>
```

### 3. Screen Reader Support

#### Live Regions for Dynamic Content
```typescript
// ✅ Screen reader announcements
<div aria-live="polite" aria-atomic="true" className="sr-only">
  Status: {message}
</div>

// Usage in components
<div aria-live="polite">
  Table sorted by {column}
</div>
```

#### Accessible Data Tables
```typescript
// ✅ Accessible data table
<table role="table" aria-label="Data table">
  <thead>
    <tr role="row">
      <th role="columnheader" scope="col">Name</th>
      <th role="columnheader" scope="col" aria-sort="none">Age</th>
      <th role="columnheader" scope="col">City</th>
    </tr>
  </thead>
  <tbody>
    <tr role="row">
      <td role="gridcell">John</td>
      <td role="gridcell">25</td>
      <td role="gridcell">New York</td>
    </tr>
  </tbody>
</table>
```

### 4. Color and Contrast

#### Color Contrast Compliance
```typescript
// ✅ Color contrast utilities
import { COLOR_CONTRAST } from '@/constants/accessibility'

// Usage:
const normalTextAA = COLOR_CONTRAST.NORMAL_TEXT.AA // 4.5
const largeTextAA = COLOR_CONTRAST.LARGE_TEXT.AA   // 3.0

// Component usage
<button style={{ background: '#0066cc', color: '#ffffff' }}>
  High contrast button
</button>
```
```

#### High Contrast Mode Support
```typescript
// ✅ High contrast theme support
import { HIGH_CONTRAST_THEME } from '@/constants/accessibility'

const useHighContrast = () => {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    setIsHighContrast(mediaQuery.matches)
    // Handle changes...
  }, [])

  return isHighContrast
}

// Usage
<div style={{
  backgroundColor: isHighContrast ? '#000000' : '#ffffff',
  color: isHighContrast ? '#ffffff' : '#333333'
}}>
  Content
</div>
```
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
<label htmlFor="email" className={error ? 'text-red-600' : ''}>
  Email {required && <span aria-label="required">*</span>}
</label>

<input
  id="email"
  aria-describedby={error ? 'error' : 'help'}
  aria-required={required}
  aria-invalid={!!error}
/>

{description && <p id="help">{description}</p>}

{error && (
  <p id="error" role="alert" aria-live="polite">
    {error}
  </p>
)}
```

## 🧪 Testing for Accessibility

### Automated Accessibility Testing
```typescript
// ✅ Accessibility testing utilities
import { AccessibilityUtils } from '@/constants/accessibility'

// Usage:
const hasRequiredAria = AccessibilityUtils.isKeyboardNavigable(element)
const isContrastValid = AccessibilityUtils.isContrastValid(fg, bg, 'normal', 'AA')

// Jest accessibility tests
describe('Accessibility Tests', () => {
  it('should have proper ARIA labels', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('aria-label')
  })

  it('should be keyboard navigable', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    button.focus()
    expect(button).toHaveFocus()
  })

  it('should have sufficient color contrast', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button')
    const styles = window.getComputedStyle(button)
    expect(AccessibilityUtils.checkContrast(styles.color, styles.backgroundColor)).toBe(true)
  })
})
```
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
    console.warn(`Accessibility violation: ${violation.message}`)
  }

  getViolations(): AccessibilityViolation[] {
    return [...this.violations]
  }
}
```

This comprehensive accessibility standards document provides the foundation for creating inclusive web applications that meet WCAG 2.1 AA compliance requirements and serve users with diverse abilities effectively.
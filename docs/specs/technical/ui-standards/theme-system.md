---
title: Theme System
version: 1.0
status: active
last_updated: 2025-11-23
category: technical-specs
applies_to: frontend
priority: critical
---

# Theme System

This document outlines the theme development guidelines, CSS variable management, and performance requirements for the SGSGita Alumni project's theming system.

> **CRITICAL**: This is the authoritative source for theme standards. Violations of these standards cause theme switching failures and visual inconsistencies like those seen in StatusDashboard.

## CSS Variable Strategy

### Essential Variables Only
- Limit CSS variables to **12-15 essential ones** per component type
- Focus on semantic naming over specific styling
- Prioritize reusability across multiple themes

```typescript
// Good: Essential table variables
interface TableThemeVariables {
  '--table-container': string;      // Background container
  '--table-header': string;         // Header background
  '--table-row-hover': string;      // Row hover state
  '--table-border': string;         // Border color
  '--table-freeze-shadow': string;  // Frozen column shadow
}

// Avoid: Too many specific variables
interface OverlySpecificVariables {
  '--table-header-text-color-primary': string;
  '--table-header-text-color-secondary': string;
  '--table-header-border-top-color': string;
  // ... 70+ variables
}
```

### Variable Naming Convention
```typescript
// Pattern: --{component}-{element}-{state}
'--table-header'           // Component element
'--table-row-hover'        // Component element state
'--button-primary-active'  // Component variant state
'--badge-grade-a'          // Component semantic variant
```

## Theme Configuration Structure

### Enhance Existing Themes
Always enhance existing theme files rather than creating new ones:

```typescript
// Enhance existing theme
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

### Semantic Color Usage
Prefer shadcn/ui semantic colors over custom CSS variables:

```typescript
// Preferred: Use shadcn/ui semantic colors
<Badge variant="destructive">Error</Badge>
<Badge className="bg-green-500">Success</Badge>

// Avoid: Custom CSS variables for simple cases
<Badge style={{ backgroundColor: 'var(--custom-error-color)' }}>Error</Badge>
```

## Performance Requirements

### Theme Switching Performance
- Maintain **< 200ms** theme switching performance
- Use CSS variables for real-time updates
- Avoid JavaScript-based style calculations during theme changes

```typescript
// Performance-optimized theme switching
const applyTheme = (theme: ThemeConfiguration) => {
  // Batch CSS variable updates
  const root = document.documentElement;
  Object.entries(theme.cssVariables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}
```

## CSS Variable Management Rules

### Critical Rule: Never Override Theme Variables in CSS

```css
/* NEVER DO THIS: Static CSS variables break theme switching */
.my-component {
  --table-container: #ffffff; /* This overrides theme switching */
  background: var(--table-container);
}

/* ALWAYS DO THIS: Let themes control variables */
.my-component {
  background: var(--table-container); /* Theme-controlled */
}
```

### Component Styling Rules

```typescript
// ALWAYS use dynamic CSS variables in components
const TableComponent = () => {
  return (
    <div
      className="table-container"
      style={{
        backgroundColor: 'var(--table-container)',
        borderColor: 'var(--table-border)'
      }}
    >
      {/* Component content */}
    </div>
  )
}

// NEVER hardcode theme-specific values
const BadTableComponent = () => {
  return (
    <div
      className="table-container"
      style={{
        backgroundColor: '#ffffff', // Breaks dark theme
        borderColor: '#e5e7eb'      // Not theme-aware
      }}
    >
      {/* Component content */}
    </div>
  )
}
```

## Theme Development Process

### Phase 1: Analysis & Planning
1. **Analyze Requirements** - Understand the specific enhancement needs
2. **Review Existing Components** - Check what can be reused or enhanced
3. **Identify CSS Variables** - Determine essential variables needed
4. **Plan Theme Integration** - Ensure compatibility with all 4 themes

### Phase 2: Implementation
1. **Enhance Themes First** - Add necessary CSS variables and theme support
2. **Implement Core Features** - Build the main functionality
3. **Apply Responsive Design** - Ensure mobile-first approach
4. **Test Cross-Theme Compatibility** - Verify functionality across all themes

### Phase 3: Testing & Validation
1. **Cross-Theme Testing** - Verify functionality across all themes
2. **Performance Testing** - Ensure < 200ms theme switching
3. **Accessibility Testing** - Verify WCAG 2.1 AA compliance
4. **Mobile Testing** - Test on various device sizes

## Theme Development Checklist

### Do's
- Enhance existing components before creating new ones
- Use semantic shadcn/ui colors when possible
- Limit CSS variables to 12-15 essential ones per component
- Test across all 4 existing themes
- Maintain < 200ms theme switching performance
- Follow mobile-first responsive design
- Ensure WCAG 2.1 AA accessibility compliance

### Don'ts
- **Don't override theme CSS variables in static CSS files** (breaks theme switching)
- Don't create 70+ CSS variables for maintainability
- Don't hardcode theme-specific colors in components
- Don't create new theme files without approval
- Don't sacrifice performance for visual complexity
- Don't ignore mobile responsiveness
- Don't skip accessibility testing

## Theme-Specific Implementation Examples

### Dynamic Theme Variables

```typescript
// Theme-aware component styling
const useThemeStyles = (componentType: string) => {
  const { theme } = useTheme()

  return useMemo(() => ({
    container: {
      backgroundColor: `var(--${componentType}-container)`,
      borderColor: `var(--${componentType}-border)`,
      color: `var(--${componentType}-text)`
    },
    header: {
      backgroundColor: `var(--${componentType}-header)`,
      borderBottomColor: `var(--${componentType}-border)`
    }
  }), [theme, componentType])
}
```

### Theme Configuration Extension

```typescript
// Extending theme configurations
interface ExtendedThemeConfig extends ThemeConfiguration {
  customComponents: {
    advancedTable: {
      container: string
      header: string
      rowHover: string
      border: string
      freezeShadow: string
    }
  }
}

// Apply to all existing themes
export const enhancedDarkTheme: ExtendedThemeConfig = {
  ...darkTheme,
  customComponents: {
    advancedTable: {
      container: 'hsl(222.2 84% 4.9%)',
      header: 'hsl(217.2 32.6% 17.5%)',
      rowHover: 'hsl(217.2 32.6% 17.5%)',
      border: 'hsl(217.2 32.6% 17.5%)',
      freezeShadow: '2px 0 4px rgba(0,0,0,0.3)'
    }
  }
}
```

## Code References

- Theme Provider: `src/contexts/ThemeContext.tsx`
- CSS Variables: `src/styles/theme.css`
- Theme Configurations: `src/lib/theme/configs/`
- Component Styles: `src/styles/components/`

## Related Documentation

- [Component Patterns](./component-patterns.md)
- [Accessibility Standards](./accessibility.md)
- [Responsive Design](./responsive-design.md)

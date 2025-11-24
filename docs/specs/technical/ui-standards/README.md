---
title: UI Standards Overview
version: 1.0
status: active
last_updated: 2025-11-23
category: technical-specs
applies_to: frontend
---

# UI Standards

This directory contains comprehensive UI/UX standards and guidelines for the SGS Gita Alumni project.

## Technology Stack

- **Framework**: React 18+ with TypeScript
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS custom properties
- **Theme System**: Custom theme provider with 4 themes

## Documentation Structure

| Document | Description |
|----------|-------------|
| [theme-system.md](./theme-system.md) | **Critical** - CSS variables, theme configuration, performance requirements |
| [accessibility.md](./accessibility.md) | WCAG 2.1 AA compliance, ARIA patterns, keyboard navigation |
| [responsive-design.md](./responsive-design.md) | Mobile-first approach, breakpoints, touch targets |
| [component-patterns.md](./component-patterns.md) | Component architecture, compound components, form patterns |

## Key Principles

1. **Theme-First Development** - All colors must use CSS variables; no hardcoded values
2. **Accessibility Required** - WCAG 2.1 AA compliance is mandatory
3. **Mobile-First** - Design for mobile, enhance for desktop
4. **Component Reuse** - Enhance existing components before creating new ones

## Code References

- Theme Provider: `src/contexts/ThemeContext.tsx`
- CSS Variables: `src/styles/theme.css`
- UI Components: `src/components/ui/`
- Theme Configurations: `src/lib/theme/configs/`

## Quick Start

```typescript
// Using theme-aware styling
import { useTheme } from '@/contexts/ThemeContext'

const MyComponent = () => {
  return (
    <div style={{
      backgroundColor: 'var(--background)',
      color: 'var(--foreground)'
    }}>
      Content
    </div>
  )
}
```

## Related Documentation

- [Core Technical Standards](../README.md)
- [Database Standards](../database/README.md)
- [Architecture Standards](../architecture/README.md)

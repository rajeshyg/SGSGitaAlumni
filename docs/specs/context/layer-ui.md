# UI Context Layer

Load this when working on frontend features.

## Architecture
- React 18 with TypeScript
- CSS Modules for styling
- Theme variables for colors
- Mobile-first responsive design

## Key Directories
- `src/components/` - Reusable UI components
- `src/pages/` - Page components
- `src/services/` - API client services
- `src/styles/` - Global styles and themes

## Patterns
- Use theme CSS variables (no hardcoded colors)
- TypeScript interfaces for all props
- Error boundaries for component isolation
- Loading states for async operations

## Accessibility (WCAG 2.1 AA)
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast ratios

## Component Reuse
Check existing components before creating new ones:
- Modal, DataTable, FormBuilder
- Button, Input, Select variants

## Related Specs
- `docs/specs/technical/ui-standards.md`
- `docs/specs/technical/code-standards.md`

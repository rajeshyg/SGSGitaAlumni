---
title: Coding Standards Overview
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
enforcement: required
---

# Coding Standards Overview

## Code Quality Philosophy

The SGS Gita Alumni project maintains high code quality through:

1. **Consistency** - Uniform patterns across the codebase
2. **Readability** - Code that is self-documenting and easy to understand
3. **Maintainability** - Small, focused functions and files
4. **Type Safety** - Strict TypeScript usage throughout
5. **Automated Enforcement** - Tools that catch issues before review

## Tool Stack

### ESLint
- Primary linter for JavaScript/TypeScript
- Includes SonarJS plugin for code quality
- Configuration: `.eslintrc.js`

### TypeScript
- Strict mode enabled
- No implicit any types
- Configuration: `tsconfig.json`

### Prettier
- Automatic code formatting
- Configuration: `.prettierrc`
- Settings: 2-space indentation, single quotes, no semicolons

### jscpd
- Duplicate code detection
- Run: `npm run check-redundancy`

### Husky
- Pre-commit hooks for automated checks
- Configuration: `.husky/`

## Standards Documentation

| Document | Purpose |
|----------|---------|
| [TypeScript Patterns](./typescript.md) | Type safety, interfaces, generics |
| [File Organization](./file-organization.md) | Structure, size limits, directories |
| [Naming Conventions](./naming-conventions.md) | Files, components, variables |
| [Code Review Checklist](./code-review-checklist.md) | Review process and checklists |

## Quick Reference

### File Size Limits
- General files: 500 lines maximum
- Component files: 800 lines maximum
- Functions: 50 lines maximum

### Naming Summary
- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Import Order
1. React/Node built-ins
2. External packages
3. Internal aliases (@/)
4. Relative imports
5. Styles

## Enforcement

All standards are enforced through:
- Pre-commit hooks (Husky)
- CI/CD pipeline checks
- Code review process
- ESLint rules

Run all checks locally:
```bash
npm run lint              # ESLint
npm run check-redundancy  # jscpd
npm run test:run          # Tests
npm run build             # Build verification
```

## Related Documentation

For detailed coding standards, see the individual specification files in this directory.

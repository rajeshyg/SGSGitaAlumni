# Code Standards - Technical Specification

```yaml
---
version: 1.0
status: implemented
last_updated: 2025-11-22
---
```

## Goal
Maintain consistent, high-quality code across the codebase with clear patterns and practices.

## Implementation Status: In Progress

### 1. TypeScript Standards
**Status**: Complete (Frontend)

**Code References**:
- TSConfig: `tsconfig.json`
- Type definitions: `src/types/`

**Requirements**:
- Strict mode enabled
- No `any` types (use `unknown`)
- Explicit return types on functions
- Interface over type for objects

### 2. Code Style
**Status**: Complete

**Code References**:
- ESLint config: `.eslintrc.js`
- Prettier config: `.prettierrc`

**Patterns**:
- 2-space indentation
- Single quotes
- No semicolons (Prettier default)
- Max line length: 100

### 3. Naming Conventions
**Status**: Complete

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `UserProfile.tsx` |
| Hooks | camelCase with use | `useAuth.ts` |
| Services | PascalCase | `AuthService.ts` |
| Utils | camelCase | `formatDate.ts` |
| Constants | UPPER_SNAKE | `API_ENDPOINTS` |
| CSS Modules | camelCase | `styles.userCard` |

### 4. File Organization
**Status**: Complete

```
src/
├── components/     # React components
│   ├── ui/         # Base UI components
│   ├── forms/      # Form components
│   └── layout/     # Layout components
├── contexts/       # React contexts
├── hooks/          # Custom hooks
├── services/       # API services
├── types/          # TypeScript types
├── utils/          # Utility functions
└── styles/         # Global styles
```

### 5. Import Order
**Status**: Complete

1. React/Node built-ins
2. External packages
3. Internal aliases (@/)
4. Relative imports
5. Styles

### 6. Backend Standards
**Status**: In Progress

**Code References**:
- Routes: `routes/`
- Services: `services/`

**Pending Improvements** (from audit):
- Parameterized SQL queries
- Connection pool management
- Structured logging
- Magic number extraction

## Quality Metrics
- Test coverage: 80% minimum
- No ESLint errors
- No TypeScript errors
- Bundle size < 500KB (gzipped)

## Archived Guidelines
Historical reference: `docs/archive/guidelines/DEVELOPMENT_GUIDELINES.md`, `QUALITY_STANDARDS.md`

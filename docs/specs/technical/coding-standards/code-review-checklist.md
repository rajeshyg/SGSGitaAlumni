---
title: Code Review Checklist
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
enforcement: required
---

# Code Review Checklist

## Pre-Review Automated Checks

All automated checks must pass before requesting review:

### Required Checks
- [ ] **ESLint passes**: `npm run lint` - no errors or warnings
- [ ] **jscpd passes**: `npm run check-redundancy` - no duplicates
- [ ] **Tests pass**: `npm run test:run` - all green
- [ ] **Build succeeds**: `npm run build` - no errors
- [ ] **No console statements**: No `console.log/error/warn` in production code
- [ ] **File sizes OK**: Files within limits (500/800 lines)
- [ ] **Function sizes OK**: Functions within 50 lines
- [ ] **Complexity OK**: Functions under complexity score of 10

### Pre-commit Hook
These run automatically via Husky:
```bash
npm run lint
npm run check-redundancy
npm run test:run
```

## Manual Review Items

### Structure and Organization

- [ ] **File naming**: Follows kebab-case convention
- [ ] **Component naming**: PascalCase with descriptive names
- [ ] **Import organization**: Grouped by type (React, UI, utils)
- [ ] **Folder structure**: Follows established patterns
- [ ] **No duplicate files**: Check for similar implementations

### Code Quality

- [ ] **TypeScript types**: All props and state properly typed
- [ ] **No `any` types**: Use `unknown` with type guards
- [ ] **Explicit return types**: Functions have return types
- [ ] **Error handling**: Try/catch blocks where appropriate
- [ ] **Loading states**: Proper indicators for async operations
- [ ] **Early returns**: Avoid deep nesting

```typescript
// Bad
if (user) {
  if (user.isActive) {
    // code
  }
}

// Good
if (!user) return
if (!user.isActive) return
// code
```

### Testing

- [ ] **Test coverage**: Critical paths covered
- [ ] **Test naming**: Descriptive test names
- [ ] **Edge cases**: Error, loading, empty states tested
- [ ] **User interactions**: Click, keyboard, form tests
- [ ] **Mocks**: External dependencies mocked

## Security Checklist

### Data Protection
- [ ] **No sensitive data committed**: API keys, passwords, secrets
- [ ] **Input validation**: User inputs validated and sanitized
- [ ] **SQL injection prevention**: Parameterized queries used
- [ ] **XSS prevention**: User input properly escaped
- [ ] **Authentication**: Protected routes secured

### Security Best Practices
- [ ] **Data encryption**: Sensitive data encrypted in transit
- [ ] **Session management**: Secure token handling
- [ ] **CSRF protection**: State-changing operations protected
- [ ] **Content Security Policy**: CSP headers configured
- [ ] **Audit logging**: Sensitive operations logged

```typescript
// Good: Input validation
import { z } from 'zod'
import DOMPurify from 'dompurify'

const UserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email()
})

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong']
  })
}
```

## Accessibility Checklist

### WCAG 2.1 AA Compliance
- [ ] **Color contrast**: Ratios >= 4.5:1 (normal), >= 3:1 (large text)
- [ ] **Keyboard navigation**: All elements accessible via Tab/Enter/Space
- [ ] **Screen reader support**: Semantic HTML with ARIA labels
- [ ] **Focus management**: Visible focus indicators, logical tab order
- [ ] **Form accessibility**: Labels, errors properly associated
- [ ] **Image accessibility**: Alt text for meaningful images
- [ ] **Heading hierarchy**: Proper h1-h6 structure, no skipped levels

```typescript
// Good: Accessible button
<button
  aria-label="Close dialog"
  onClick={handleClose}
  onKeyDown={(e) => e.key === 'Escape' && handleClose()}
>
  <CloseIcon aria-hidden="true" />
</button>
```

## UI/UX Consistency

- [ ] **Design system**: Uses established components
- [ ] **Responsive design**: Mobile, tablet, desktop
- [ ] **Theme support**: Works with all theme variants
- [ ] **Touch targets**: Minimum 44px for mobile
- [ ] **CSS variables**: Never override theme variables in static CSS

## Performance Checklist

- [ ] **No unnecessary re-renders**: Memoization where needed
- [ ] **Efficient algorithms**: Appropriate time/space complexity
- [ ] **Bundle size**: Check with `npm run analyze-bundle`
- [ ] **Lazy loading**: Large components code-split
- [ ] **Image optimization**: Proper formats and sizes

## Redundancy Prevention

### Code Duplication
- [ ] **No duplicate components**: Check for similar UI patterns
- [ ] **No duplicate utilities**: Search for similar helper functions
- [ ] **No duplicate API calls**: Check for repeated fetch logic
- [ ] **No duplicate styles**: CSS classes consolidated
- [ ] **No duplicate types**: Interfaces in shared files

### Database
- [ ] **No duplicate tables**: Check existing schema
- [ ] **No duplicate fields**: Review existing columns
- [ ] **Consistent naming**: Follow database conventions
- [ ] **Proper indexing**: Performance considerations

## State Synchronization

- [ ] **Backend validation**: UI checks server state before actions
- [ ] **Optimistic updates**: Proper rollback on API failure
- [ ] **Conflict resolution**: Handle concurrent operations
- [ ] **Loading states**: Prevent duplicate requests
- [ ] **Error recovery**: Failed operations restore previous state

## Review Comments Template

### Approving with Suggestions
```markdown
**Approved** with suggestions:

**Strengths:**
- Clean component structure
- Good TypeScript usage
- Comprehensive test coverage

**Suggestions:**
- Consider extracting [logic] into a custom hook
- Add error boundary for [component]
- Consider loading state for [operation]
```

### Requesting Changes
```markdown
**Changes Requested**

**Required Changes:**
- [ ] Fix TypeScript error in [file:line]
- [ ] Add test coverage for [functionality]
- [ ] Remove console statement in [file:line]

**Questions:**
- Is there a reason for [implementation choice]?
- Have you considered [alternative]?

**Blocking Issues:**
- [ ] ESLint errors must be resolved
- [ ] Tests are failing
```

## Continuous Improvement

### Retrospective Questions
- What patterns emerged in recent reviews?
- Are there common issues we should automate?
- Do our guidelines need updating?
- Are there new tools that could help?

### Process Updates
- Update checklist based on findings
- Add new automated checks as needed
- Refine standards based on team feedback

## Related Documentation

- [TypeScript Patterns](./typescript.md)
- [File Organization](./file-organization.md)
- [Naming Conventions](./naming-conventions.md)

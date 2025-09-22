# Code Review Checklist

This checklist ensures code quality and prevents technical debt accumulation.

## 🔍 Pre-Review Checks

### Automated Quality Gates
- [ ] **ESLint + SonarJS passes**: `npm run lint` shows no errors or warnings
- [ ] **jscpd check passes**: `npm run check-redundancy` shows no duplicates
- [ ] **Tests pass**: `npm run test:run` all green
- [ ] **Build succeeds**: `npm run build` completes without errors
- [ ] **Bundle analysis reviewed**: `npm run analyze-bundle` checked for size issues
- [ ] **No console statements**: Search shows no `console.log/error/warn`
- [ ] **File sizes OK**: General files ≤ 500 lines, component files ≤ 800 lines (ESLint validated)
- [ ] **Function sizes OK**: No functions exceed 50 lines
- [ ] **Complexity OK**: No functions exceed complexity score of 10

### Manual Code Review

#### 📁 Structure & Organization
- [ ] **File naming**: Follows kebab-case convention
- [ ] **Component naming**: PascalCase with descriptive names
- [ ] **Import organization**: Grouped by type (React, UI, utils, etc.)
- [ ] **Folder structure**: Follows established patterns
- [ ] **No duplicate files**: Check for similar implementations

#### 🔧 Code Quality
- [ ] **TypeScript types**: All props and state properly typed
- [ ] **Error handling**: Try/catch blocks where appropriate
- [ ] **Loading states**: Proper loading indicators for async operations
- [ ] **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- [ ] **Performance**: No unnecessary re-renders, efficient algorithms

#### 🧪 Testing
- [ ] **Test coverage**: See [Quality Metrics](standards/QUALITY_METRICS.md#testing-standards) for coverage requirements
- [ ] **Test naming**: Descriptive test names following patterns
- [ ] **Edge cases**: Error states, loading states, empty states tested
- [ ] **User interactions**: Click, keyboard, form interactions tested
- [ ] **Mock data**: External dependencies properly mocked

#### 🎨 UI/UX Consistency
- [ ] **Design system**: Uses established components and patterns
- [ ] **Responsive design**: Works on mobile, tablet, desktop
- [ ] **Theme support**: Works with all theme variants
- [ ] **Consistent spacing**: Follows design system spacing
- [ ] **Proper contrast**: Text meets accessibility standards
- [ ] **CSS variables**: Never override theme variables in static CSS files
- [ ] **CSS variable limits**: Maximum 12-15 essential variables per component type
- [ ] **Semantic colors**: Prefer shadcn/ui semantic colors over custom CSS variables
- [ ] **Dynamic styling**: Use CSS variables for real-time theme switching

#### 🔒 Security & Best Practices
- [ ] **No sensitive data**: API keys, passwords not committed
- [ ] **Input validation**: User inputs properly validated/sanitized
- [ ] **SQL injection**: Parameterized queries used
- [ ] **XSS prevention**: User input properly escaped
- [ ] **Authentication**: Protected routes properly secured

#### ♿ Accessibility Compliance
- [ ] **WCAG 2.1 AA**: Color contrast ratios ≥ 4.5:1 (normal), ≥ 3:1 (large text)
- [ ] **Keyboard navigation**: All interactive elements accessible via Tab/Enter/Space
- [ ] **Screen reader support**: Semantic HTML with proper ARIA labels
- [ ] **Focus management**: Visible focus indicators with logical tab order
- [ ] **Form accessibility**: Labels, error messages, fieldsets properly associated
- [ ] **Image accessibility**: Alt text for meaningful images, decorative images marked
- [ ] **Heading hierarchy**: Proper h1-h6 structure without skipping levels
- [ ] **Language attributes**: Document and content language properly set

#### 🔐 Security Compliance
- [ ] **Data encryption**: Sensitive data encrypted at rest and in transit
- [ ] **Authentication security**: Multi-factor authentication implemented
- [ ] **Session management**: Automatic timeout with secure token handling
- [ ] **Input sanitization**: All user inputs validated and sanitized
- [ ] **CSRF protection**: State-changing operations protected
- [ ] **Content Security Policy**: CSP headers properly configured
- [ ] **Audit logging**: Sensitive operations logged for compliance
- [ ] **Vulnerability scanning**: No critical/high severity vulnerabilities

#### 🌐 Cross-Platform Compatibility
- [ ] **Mobile optimization**: Touch targets ≥44px, swipe gestures supported
- [ ] **Tablet support**: Multi-touch gestures, orientation changes handled
- [ ] **Desktop functionality**: Keyboard shortcuts, mouse interactions work
- [ ] **Responsive design**: Works across all breakpoints (320px to 4K)
- [ ] **Browser compatibility**: Chrome, Firefox, Safari, Edge support
- [ ] **Platform adaptation**: UI patterns adapt to platform conventions
- [ ] **Performance parity**: Consistent performance across all platforms
- [ ] **Offline capability**: Core functionality works without network

#### ⚡ Native-First Performance
- [ ] **Instant loading**: See [Performance Targets](standards/PERFORMANCE_TARGETS.md#loading-performance) for FCP requirements
- [ ] **Smooth animations**: 60fps animations with < 16ms frame time
- [ ] **Aggressive caching**: Service worker cache hit rate > 80%
- [ ] **Bundle optimization**: See [Performance Targets](standards/PERFORMANCE_TARGETS.md#bundle-size-targets) for size limits
- [ ] **Memory efficiency**: < 50MB heap size, no memory leaks
- [ ] **Touch responsiveness**: < 100ms touch response time
- [ ] **Offline-first**: Core features work without network connection

## 🚫 Redundancy Prevention

### Code Duplication
- [ ] **No duplicate components**: Check for similar UI patterns
- [ ] **No duplicate utilities**: Search for similar helper functions
- [ ] **No duplicate API calls**: Check for repeated data fetching logic
- [ ] **No duplicate styles**: CSS classes consolidated
- [ ] **No duplicate types**: Interfaces consolidated in shared files

### Database & Schema
- [ ] **No duplicate tables**: Check existing schema before creating new tables
- [ ] **No duplicate fields**: Review existing columns before adding new ones
- [ ] **Consistent naming**: Follow established database naming conventions
- [ ] **Proper indexing**: Performance considerations for new fields
- [ ] **Data relationships**: Foreign keys and constraints properly defined

### Configuration & Environment
- [ ] **No duplicate config**: Check existing environment variables
- [ ] **No duplicate settings**: Review existing configuration files
- [ ] **Consistent naming**: Environment variable naming conventions
- [ ] **Documentation**: New config variables documented

## 📋 Review Comments Template

### For Approving with Suggestions
```
✅ **Approved** with suggestions for improvement:

**Strengths:**
- Clean component structure
- Good TypeScript usage
- Comprehensive test coverage (meets quality standards)

**Suggestions:**
- Consider extracting [specific logic] into a custom hook
- Add error boundary for [component name]
- Consider adding loading state for [async operation]
```

### For Requesting Changes
```
🔄 **Changes Requested**

**Required Changes:**
- [ ] Fix TypeScript error in [file:line]
- [ ] Add test coverage for [specific functionality] (see quality standards)
- [ ] Remove console statement in [file:line]
- [ ] Break down large function in [file:function]

**Questions:**
- Is there a reason for [specific implementation choice]?
- Have you considered [alternative approach]?

**Blocking Issues:**
- [ ] ESLint errors must be resolved
- [ ] Tests are failing
- [ ] Security vulnerability identified
```

## 🤖 AI Assistant Review Guidelines

See [AI Collaboration Guidelines](AI_COLLABORATION_GUIDELINES.md) for comprehensive AI review protocols and automated quality checks.

## 📊 Quality Metrics

See [Quality Standards](QUALITY_STANDARDS.md) for comprehensive quality metrics, targets, and monitoring guidelines.

## 🔄 Continuous Improvement

### Retrospective Questions
- What patterns emerged in recent reviews?
- Are there common issues we should automate?
- Do our guidelines need updating?
- Are there new tools that could help?

### Process Updates
- Update this checklist based on findings
- Add new automated checks as needed
- Refine coding standards based on team feedback
- Incorporate lessons learned from incidents
# Development Guidelines

This document provides an overview of the development standards and practices for the SGSGita Alumni project. For detailed implementation guidance, see the linked documents below.

## 📋 Development Documentation Structure

This development framework is organized into focused documents:

- **[Core Guidelines](./development/CORE_GUIDELINES.md)** - Fundamental coding standards, testing, and security practices
- **[Component Patterns](./development/COMPONENT_PATTERNS.md)** - Component architecture, patterns, and cross-platform development
- **[Theme System](./development/THEME_SYSTEM.md)** - Theme development, CSS variables, and performance requirements

## 📏 Quick Reference

### File Size Limits
→ **See [Quality Metrics](./standards/QUALITY_METRICS.md#file-size-standards)** for authoritative file size standards

### Key Principles
- **Security First**: All code must follow security-first development patterns
- **Mobile First**: Components must be mobile-optimized and touch-friendly
- **Accessibility**: WCAG 2.1 AA compliance required
- **Performance**: < 200ms theme switching, optimized bundle sizes
- **Testing**: Comprehensive test coverage with user-focused testing

### Component Development
- **Enhance First**: Always enhance existing components before creating new ones
- **Theme Aware**: All components must work across all 4 existing themes
- **Responsive**: Mobile-first responsive design required
- **Accessible**: Proper ARIA labels and keyboard navigation

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<Button onClick={handleClick}>Click me</Button>)
    await user.click(screen.getByText('Click me'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Principles
- Test user interactions, not implementation details
- Use descriptive test names
- Test error states and edge cases
- Mock external dependencies

## 🎨 Component Patterns

### Component Structure
→ **See [Component Patterns](./development/COMPONENT_PATTERNS.md#component-structure)** for detailed component structure patterns and TypeScript interfaces.

### Custom Hook Patterns
→ **See [Component Patterns](./development/COMPONENT_PATTERNS.md#custom-hooks)** for custom hook patterns and data fetching implementations.

## 🌐 Platform-Specific Development Guidelines

### Mobile-First Component Development
→ **See [Component Patterns](./development/COMPONENT_PATTERNS.md#mobile-first-development)** for mobile-optimized component patterns and touch interactions.

### Cross-Platform Responsive Patterns
→ **See [Component Patterns](./development/COMPONENT_PATTERNS.md#responsive-patterns)** for platform-adaptive layouts and responsive design patterns.


## ♿ Accessibility Development Practices

### Semantic HTML and ARIA
→ **See [Accessibility Implementation Guide](./accessibility/IMPLEMENTATION_GUIDE.md#semantic-html)** for accessible form components and ARIA patterns.

### Keyboard Navigation
→ **See [Accessibility Implementation Guide](./accessibility/IMPLEMENTATION_GUIDE.md#keyboard-navigation)** for keyboard-accessible components and navigation patterns.

## 🎨 Theme & Component Enhancement Guidelines

### CSS Variable Strategy
→ **See [Theme System](./development/THEME_SYSTEM.md#css-variables)** for CSS variable strategy, naming conventions, and theme configuration patterns.

### Theme Configuration Structure
→ **See [Theme System](./development/THEME_SYSTEM.md#theme-configuration)** for theme enhancement patterns and semantic color usage.

### Performance Requirements
→ **See [Theme System](./development/THEME_SYSTEM.md#performance-requirements)** for theme switching performance standards and optimization techniques.

## 🧩 Component Enhancement Guidelines

### Enhancement vs. Replacement Strategy
→ **See [Component Patterns](./development/COMPONENT_PATTERNS.md#enhancement-patterns)** for component enhancement strategies, wrapper patterns, and architecture standards.

### TypeScript Standards
→ **See [Component Patterns](./development/COMPONENT_PATTERNS.md#typescript-patterns)** for interface design, generic type support, and TypeScript best practices.
### Performance Standards
→ **See [Quality Metrics](./standards/QUALITY_METRICS.md#file-size-standards)** for component size standards and lazy loading implementation patterns.

## 🔧 Implementation Process

### Phase 1: Analysis & Planning
1. **Analyze Requirements** - Understand the specific enhancement needs
2. **Review Existing Components** - Check what can be reused or enhanced
3. **Plan Architecture** - Design the enhancement strategy
4. **Create Task Breakdown** - Use task management tools for complex work

### Phase 2: Implementation
1. **Enhance Themes First** - Add necessary CSS variables and theme support
2. **Implement Core Features** - Build the main functionality
3. **Add Advanced Features** - Implement complex features like frozen columns
4. **Mobile Optimization** - Ensure responsive design and touch support

### Phase 3: Testing & Validation
1. **Cross-Theme Testing** - Verify functionality across all themes
2. **Performance Testing** - Ensure < 200ms theme switching
3. **Accessibility Testing** - Maintain WCAG 2.1 AA compliance
4. **Mobile Testing** - Validate responsive behavior

## 📚 Best Practices Summary

### ✅ Do's
- Enhance existing components before creating new ones
- Use semantic shadcn/ui colors when possible
- Limit CSS variables to 12-15 essential ones
- Maintain < 200ms theme switching performance
- Implement lazy loading for large components
- Use TypeScript generics for type safety
- Follow the wrapper pattern for complex enhancements

### ❌ Don'ts
- **Don't override theme CSS variables in static CSS files** (breaks theme switching)
- Don't create 70+ CSS variables for maintainability
- Don't replace working components unnecessarily
- Don't exceed component file size limits (see [Quality Metrics](./standards/QUALITY_METRICS.md))
- Don't break existing theme switching performance
- Don't ignore mobile optimization
- Don't skip accessibility compliance
- Don't create redundant functionality

## 🎯 Success Criteria

### Quality Metrics
- **Performance**: < 200ms theme switching maintained
- **Accessibility**: WCAG 2.1 AA compliance
- **TypeScript**: 100% type coverage
- **Bundle Size**: See [Performance Targets](standards/PERFORMANCE_TARGETS.md#bundle-size-targets) for authoritative limits
- **Maintainability**: Clear, documented, reusable code

### Feature Completeness
- All features work across 4 existing themes
- Mobile-responsive design implemented
- Touch-friendly interactions for mobile
- Proper error handling and loading states
- Comprehensive TypeScript support

### CSS Variable Management Rules
→ **See [Theme System](./development/THEME_SYSTEM.md#css-variable-rules)** for critical CSS variable management rules and component styling guidelines.

## 🔒 Security-First Development Patterns

### Secure Data Handling
→ **See [Security Implementation Guide](./security/IMPLEMENTATION_GUIDE.md#secure-data-handling)** for secure data validation, sanitization, and API communication patterns.

### Authentication State Management
→ **See [Security Implementation Guide](./security/IMPLEMENTATION_GUIDE.md#authentication-patterns)** for secure authentication hooks and session management.

## 🚫 Anti-Patterns to Avoid

→ **See [Core Guidelines](./development/CORE_GUIDELINES.md#anti-patterns)** for detailed anti-patterns to avoid including large components, console statements, duplicate code, and deep nesting.

## 🔧 Tool Usage

See [Tool Usage Guide](TOOL_USAGE.md) for detailed setup and configuration of all development tools including ESLint, SonarJS, jscpd, Husky, Vitest, Sentry, and Bundle Analyzer.

## 📋 Code Review Checklist

See [Code Review Checklist](CODE_REVIEW_CHECKLIST.md) for comprehensive pre-review and review-time quality checks.

## 🤖 AI Assistant Guidelines

See [AI Collaboration Guidelines](AI_COLLABORATION_GUIDELINES.md) for comprehensive AI assistance protocols and best practices.

## 📚 Resources

- [React Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
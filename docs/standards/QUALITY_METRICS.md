# Quality Metrics

**⚠️ AUTHORITATIVE DOCUMENT**: This is the single source of truth for all code quality metrics in the SGSGitaAlumni project. All other documents must reference this document, not duplicate its content.

<!-- Anchor mappings for cross-doc links -->
<a id="testing-standards"></a>
<a id="file-size-standards"></a>
<a id="file-sizes"></a>
<a id="function-size-limits"></a>
<a id="complexity-scores"></a>

## 📏 File Size Standards

### File Length Limits
- **General Files**: 500 lines maximum (increased from 300)
  - Utilities, hooks, services, configuration files
  - Reason: AI context optimization and maintainability
- **Component Files**: 800 lines maximum (increased from 500)
  - React components with comprehensive functionality
  - Strategy: Split large components into smaller, focused components
- **Documentation Files**: Varies by type (see [Documentation Standards](../DOCUMENTATION_STANDARDS.md))

### Function Size Standards
- **Maximum Function Length**: 50 lines
- **Reason**: Single responsibility and testability
- **Strategy**: Extract complex logic into smaller functions
- **Exception Handling**: Error handling may extend function length slightly

### Complexity Standards
- **Cyclomatic Complexity**: Maximum score of 10
- **Cognitive Complexity**: Keep functions simple and focused
- **Nested Depth**: Maximum 3 levels of nesting
- **Early Returns**: Preferred over deep nesting

## 🧪 Testing Standards

### Coverage Requirements
- **Unit Test Coverage**: > 80%
- **Critical Path Coverage**: 100% for business logic
- **Integration Test Coverage**: Key user workflows
- **E2E Test Coverage**: Critical user journeys (future implementation)

### Test Quality Metrics
- **Test Execution Time**: < 10 seconds for unit tests
- **Test Reliability**: > 99% pass rate (flaky tests not tolerated)
- **Test Maintainability**: Tests should be easy to understand and update
- **Test Documentation**: Clear test names and descriptions

## 🔧 Code Quality Rules

### ESLint + SonarJS Compliance
- **Error Tolerance**: 0 errors allowed
- **Warning Tolerance**: 0 warnings allowed
- **Redundancy Detection**: 0 code clones detected (jscpd)
- **Build Success Rate**: 100% successful compilation

### TypeScript Standards
- **Type Coverage**: 100% for new code
- **Any Type Usage**: Prohibited (use unknown instead)
- **Strict Mode**: Enabled for all TypeScript files
- **Type Safety**: No type assertions without justification

## 🚫 Anti-Patterns Prevention

### Code Quality Violations
- **Console Statements**: Prohibited in production code
- **Unused Imports**: Must be removed
- **Duplicate Imports**: Not allowed
- **Dead Code**: Must be eliminated
- **Magic Numbers**: Use named constants

### Performance Anti-Patterns
- **Unnecessary Re-renders**: Must be optimized
- **Memory Leaks**: Zero tolerance
- **Inefficient Algorithms**: Must be optimized
- **Large Bundle Increases**: Monitored and controlled

## 📊 Automated Quality Gates

### Pre-Commit Checks
- **ESLint Validation**: Must pass before commit
- **Test Execution**: All tests must pass
- **File Size Validation**: Enforce size limits
- **Duplicate Detection**: Scan for code clones
- **Type Checking**: TypeScript compilation must succeed

### CI/CD Quality Gates
- **Build Verification**: Successful compilation required
- **Test Execution**: Full test suite must pass
- **Bundle Analysis**: Size within limits
- **Security Scan**: No vulnerabilities allowed
- **Accessibility Audit**: WCAG 2.1 AA compliance

## 🎯 Quality Improvement Metrics

### Code Maintainability
- **Maintainability Index**: > 70
- **Technical Debt Ratio**: < 5%
- **Duplication Rate**: < 3%
- **Comment Density**: 10-30% (meaningful comments only)

### Development Velocity
- **Code Review Time**: < 24 hours average
- **Bug Fix Time**: < 48 hours for critical issues
- **Feature Development**: Predictable velocity
- **Refactoring Frequency**: Regular, planned refactoring

## 📈 Quality Monitoring

### Continuous Monitoring
- **Daily Quality Reports**: Automated generation
- **Trend Analysis**: Track quality metrics over time
- **Regression Detection**: Alert on quality degradation
- **Team Metrics**: Individual and team performance

### Quality Dashboards
- **Real-time Metrics**: Live quality status
- **Historical Trends**: Quality improvement over time
- **Comparative Analysis**: Before/after comparisons
- **Goal Tracking**: Progress toward quality targets

## 🔧 Tool Configuration

### ESLint Configuration
```javascript
// Key rules enforced
{
  "max-lines": ["error", 300],           // General files
  "max-lines-per-function": ["error", 50], // Function size
  "complexity": ["error", 10],           // Complexity limit
  "no-console": "error",                 // No console statements
  "no-duplicate-imports": "error"        // No duplicate imports
}
```

### Component-Specific Overrides
```javascript
// Component files get higher limits
{
  "files": ["src/components/**/*.tsx"],
  "rules": {
    "max-lines": ["error", 500]         // Component files
  }
}
```

## 📋 Quality Checklist

### Code Review Requirements
- [ ] File size within limits (300/500 lines)
- [ ] Function size within limits (50 lines)
- [ ] Complexity score acceptable (< 10)
- [ ] No console statements
- [ ] Proper TypeScript types
- [ ] Comprehensive error handling
- [ ] Tests written and passing
- [ ] No ESLint errors or warnings
- [ ] No duplicate code detected

### Performance Quality
- [ ] No unnecessary re-renders
- [ ] Efficient algorithms used
- [ ] Bundle size impact assessed
- [ ] Lazy loading implemented where appropriate
- [ ] Memory usage optimized

## 🔗 Referenced By

The following documents reference these quality metrics:
- [Development Guidelines](../DEVELOPMENT_GUIDELINES.md)
- [AI Collaboration Guidelines](../AI_COLLABORATION_GUIDELINES.md)
- [Code Review Checklist](../CODE_REVIEW_CHECKLIST.md)
- [Quality Standards](../QUALITY_STANDARDS.md)

**⚠️ Update Notice**: Changes to this document affect multiple other documents. Ensure all references remain consistent when making updates.

## 🚀 Quality Improvement Roadmap

### Current State
- Basic quality gates implemented
- Manual quality checks in place
- Standard tooling configured

### Phase 1: Automation
- Automated quality reporting
- Enhanced pre-commit hooks
- CI/CD integration improvements

### Phase 2: Advanced Metrics
- Predictive quality analysis
- Advanced code complexity metrics
- Quality trend forecasting

This document serves as the definitive source for all code quality metrics and standards in the SGSGitaAlumni project.

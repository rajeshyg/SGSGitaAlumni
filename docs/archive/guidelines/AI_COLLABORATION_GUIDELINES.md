# 🤖 AI Collaboration Guidelines

This document provides comprehensive guidelines for AI assistants working on the SGSGita Alumni project, ensuring consistent quality, efficient collaboration, and adherence to project standards.

## 🎯 Core Principles

### Quality First
- **Zero Compromise**: Never sacrifice code quality for speed
- **Standards Compliance**: Follow all established patterns and rules
- **Proactive Quality Checks**: Run tools before suggesting changes

### Efficiency Optimization
- **Context Awareness**: Respect 300-line file limits for optimal AI processing
- **Structured Communication**: Use clear, actionable suggestions
- **Documentation Updates**: Keep documentation current with code changes

## 🛠️ Tool Integration Protocol

### Pre-Implementation Checks
```bash
# Always run before suggesting code changes
npm run lint                    # ESLint + SonarJS (catches redundancy)
npm run check-redundancy        # jscpd (duplicate detection)
npm run test:run               # Unit tests
npm run analyze-bundle         # Performance impact
```

### Code Generation Standards
```typescript
// ✅ AI-Generated Code Standards
interface ComponentProps {
  // Always include proper TypeScript types
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}

export function MyComponent({ onClick, disabled, children }: ComponentProps) {
  // Clean, well-structured code
  // No console statements
  // Under 50 lines per function
  // Comprehensive error handling with Sentry
  // Follows established patterns

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-primary"
    >
      {children}
    </button>
  )
}
```
## 🔄 Integration Logic Patterns

Follow the [Integration Patterns](standards/INTEGRATION_PATTERNS.md) standards for all data operations and API integrations.

### State Synchronization
- **Always validate server state before UI actions** to ensure data consistency
- Implement backend-first architecture for reliable state management
- Use optimistic updates with automatic rollback on failure

### Conflict Prevention
- **Implement guards against duplicate operations** using `useOperationGuard` hook
- Prevent concurrent modifications to the same resource
- Provide clear user feedback for conflicting actions

### Error Recovery
- **Provide clear recovery paths for all error scenarios**
- Handle specific HTTP status codes (409 Conflict, 429 Rate Limited, etc.)
- Implement exponential backoff and retry logic for transient failures

### Loading States
- **Show feedback for all async operations** with consistent loading indicators
- Prevent user interactions during loading states
- Use skeleton screens or progress bars for better UX

### Optimistic Updates
- **Update UI immediately for responsive user experience**
- Rollback changes on failure with user notification
- Maintain data integrity across the application

---

## 💻 Code Generation Standards

### AI-Generated Integration Code Example

```typescript
// ✅ AI-Generated Integration Code using useDataOperation hook
import { useDataOperation } from '@/hooks/useDataOperation';
import { APIService } from '@/services/APIService';

interface UserProfileData {
  name: string;
  email: string;
}

function UserProfileUpdater({ userId }: { userId: string }) {
  const { execute, isLoading, error, resetError } = useDataOperation();

  const handleUpdate = async (profileData: UserProfileData) => {
    // State validation before API call
    if (!profileData.name?.trim() || !profileData.email?.trim()) {
      throw new Error('Name and email are required');
    }

    await execute(
      () => APIService.updateUserProfile(userId, profileData),
      {
        operationId: `update-profile-${userId}`,
        onSuccess: (result) => {
          console.log('Profile updated successfully', result);
          // Update local state or trigger refresh
        },
        onError: (err) => handleSpecificError(err)
      }
    );
  };

  // Proper error handling with specific HTTP status codes
  const handleSpecificError = (error: any) => {
    switch (error.status) {
      case 409: // Conflict
        alert('Profile was modified by another user. Please refresh and try again.');
        break;
      case 429: // Too Many Requests
        alert('Too many requests. Please wait a moment before trying again.');
        break;
      case 422: // Validation Error
        alert(`Validation error: ${error.response?.data?.message || 'Invalid data'}`);
        break;
      case 401: // Unauthorized
        alert('Session expired. Please log in again.');
        break;
      case 403: // Forbidden
        alert('You do not have permission to perform this action.');
        break;
      default:
        alert('An error occurred. Please try again.');
    }
    resetError();
  };

  return (
    <div>
      {isLoading && <div className="loading">Updating profile...</div>}
      {error && <div className="error">{error.message}</div>}
      <button
        onClick={() => handleUpdate({ name: 'John Doe', email: 'john@example.com' })}
        disabled={isLoading}
      >
        {isLoading ? 'Updating...' : 'Update Profile'}
      </button>
    </div>
  );
}
```

This example demonstrates:
- **Operation guards** to prevent duplicate execution using unique `operationId`
- **State validation** before API calls to ensure data integrity
- **Comprehensive error recovery patterns** with specific HTTP status code handling
- **Loading states** with disabled buttons during operations
- **Error boundaries** with user-friendly messages and recovery actions

For complete integration patterns and hooks, see [Integration Patterns](standards/INTEGRATION_PATTERNS.md).

---


## 🔍 Redundancy Prevention

### Code Duplication Detection
1. **Search First**: Always search for existing implementations
2. **Pattern Matching**: Use established component patterns
3. **Registry Check**: Consult component index files
4. **jscpd Verification**: Run duplicate detection on new code

### Database & Schema Prevention
- Check existing table structures before suggesting new ones
- Review migration history for duplicate field additions
- Validate configuration changes against existing settings

## 📋 Development Workflow

### 1. Analysis Phase
- Review project structure and existing patterns
- Identify relevant files and dependencies
- Assess impact on bundle size and performance

### 2. Implementation Phase
- Generate code following established conventions
- Include comprehensive error handling
- Add appropriate TypeScript types
- Write tests for new functionality

### 3. Quality Assurance Phase
- Run complete quality pipeline
- Verify no redundancy introduced
- Check file size limits maintained
- Ensure bundle impact is acceptable

### 4. Documentation Phase
- Update relevant documentation
- Add code comments for complex logic
- Update component registries if needed

## 🚫 What AI Assistants Must Avoid

### Code Quality Violations
- ❌ Console statements in production code
- ❌ Files exceeding 300 lines
- ❌ Functions exceeding 50 lines
- ❌ Missing TypeScript types
- ❌ Unused imports or variables

### Redundancy Issues
- ❌ Duplicate component creation
- ❌ Copy-paste without refactoring
- ❌ Repeated utility functions
- ❌ Duplicate database fields
- ❌ Redundant configuration

### Performance Issues
- ❌ Large bundle size increases
- ❌ Unnecessary re-renders
- ❌ Missing lazy loading
- ❌ Inefficient algorithms

## ✅ What AI Assistants Must Do

### Quality Assurance
- ✅ Run quality checks before suggesting changes
- ✅ Follow established code patterns
- ✅ Include comprehensive error handling
- ✅ Write tests for new functionality
- ✅ Respect file and function size limits

### Collaboration
- ✅ Document changes and rationale
- ✅ Update relevant documentation
- ✅ Communicate impact on bundle size
- ✅ Suggest improvements to existing code
- ✅ Ask clarifying questions when needed

### Error Handling
```typescript
// ✅ Always include Sentry-integrated error boundaries
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>

// ✅ Use error handler hooks
import { useErrorHandler } from '@/components/ErrorBoundary'

const handleError = useErrorHandler()
// Errors automatically sent to Sentry
```

## 📊 Quality Metrics Targets

For complete and authoritative metrics, see [Documentation Standards](DOCUMENTATION_STANDARDS.md#standardized-metrics).

### Code Quality
- **ESLint + SonarJS**: 0 errors, 0 warnings
- **jscpd Duplicates**: 0 code clones detected
- **Test Coverage**: See [Quality Metrics](standards/QUALITY_METRICS.md#testing-standards)
- **Build**: Successful completion

### Performance
- **Bundle Size**: See [Performance Targets](standards/PERFORMANCE_TARGETS.md#bundle-size-targets)
- **First Contentful Paint**: See [Performance Targets](standards/PERFORMANCE_TARGETS.md#loading-performance)
- **Error Rate**: See [Performance Targets](standards/PERFORMANCE_TARGETS.md#error-rate-targets)

### File Standards
- **Maximum File Size**: 300 lines (general), 500 lines (components)
- **Maximum Function Size**: 50 lines
- **Complexity Score**: < 10

## 🔧 Tool-Specific Guidelines

### ESLint + SonarJS
- Address all linting errors before suggesting code
- Fix SonarJS redundancy warnings immediately
- Use `npm run lint:fix` for auto-fixable issues

### jscpd (Duplicate Detection)
- Run `npm run check-redundancy` after generating code
- Review HTML reports for duplicate patterns
- Refactor duplicates into shared utilities

### Sentry Integration
- Always include error boundaries for new components
- Use proper error context in Sentry captures
- Test error scenarios in development

### Bundle Analyzer
- Run `npm run analyze-bundle` before adding dependencies
- Monitor impact of new features on bundle size
- Optimize imports to reduce bundle bloat

## 📚 Documentation Responsibilities

### When Making Changes
- Update relevant documentation files
- Add JSDoc comments for complex functions
- Update component registries
- Document breaking changes

### File References
- Use relative paths in documentation
- Keep links up-to-date
- Update cross-references when files are moved

## 🚨 Error Scenarios & Recovery

### Common Issues
- **Large Files**: Break down into smaller components
- **Complex Functions**: Extract logic into custom hooks
- **Bundle Bloat**: Use dynamic imports and lazy loading
- **Type Errors**: Ensure proper TypeScript types

### Recovery Steps
1. Run quality checks to identify issues
2. Refactor code to meet standards
3. Test changes thoroughly
4. Update documentation
5. Verify no regressions

## 📈 Continuous Improvement

### Learning from Reviews
- Study code review feedback
- Identify patterns in corrections
- Update guidelines based on findings
- Share learnings with team

### Quality Monitoring
- Track quality metrics over time
- Identify areas for improvement
- Update standards based on project evolution
- Maintain high collaboration standards

---

## 📋 Quick Reference Checklist

### Before Code Generation
- [ ] Searched for existing implementations
- [ ] Checked component registry
- [ ] Reviewed file size limits
- [ ] Assessed bundle impact
- [ ] Integration patterns reviewed (see INTEGRATION_PATTERNS.md)

### During Implementation
- [ ] Proper TypeScript types included
- [ ] Error handling with Sentry
- [ ] Tests written for new code
- [ ] File size under 300 lines
- [ ] Function size under 50 lines
- [ ] State synchronization implemented
- [ ] Operation guards used for async operations
- [ ] Error recovery paths provided
- [ ] Loading states implemented
- [ ] Optimistic updates with rollback

### After Implementation
- [ ] Quality pipeline passes
- [ ] No redundancy detected
- [ ] Documentation updated
- [ ] Bundle size acceptable
- [ ] Error scenarios tested
- [ ] Integration patterns validated

This comprehensive guide ensures AI assistants contribute effectively while maintaining the highest standards of code quality and project consistency.
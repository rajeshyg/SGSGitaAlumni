# Integration Patterns

**⚠️ AUTHORITATIVE DOCUMENT**: This is the single source of truth for all integration patterns in the SGSGitaAlumni project. All other documents must reference this document, not duplicate its content.

## 🎯 Core Principles

### State Synchronization
- **Backend-First Architecture**: All state changes originate from the backend to ensure consistency
- **Optimistic Updates**: UI updates immediately but rolls back on failure with clear user feedback
- **Conflict Resolution**: Last-write-wins with user notification for concurrent modifications
- **Offline Resilience**: Graceful degradation when network connectivity is lost

### API Integration
- **RESTful Design**: Consistent HTTP methods and status code usage
- **Idempotent Operations**: Safe retry of failed requests without side effects
- **Versioned APIs**: Explicit API versioning for backward compatibility
- **Rate Limiting Awareness**: Respect server rate limits with exponential backoff

### User Experience
- **Loading States**: Clear indication of asynchronous operations
- **Error Boundaries**: Graceful error handling with actionable user guidance
- **Progressive Enhancement**: Core functionality works without JavaScript
- **Accessibility First**: All integration patterns support screen readers and keyboard navigation

## 🔧 Implementation Patterns

### State Management with Backend-First Approach

```typescript
// src/services/IntegrationService.ts
import { APIService } from './APIService';

interface StateManager<T> {
  getState(): T;
  updateState(updates: Partial<T>): Promise<T>;
  subscribe(callback: (state: T) => void): () => void;
}

class BackendFirstStateManager<T> implements StateManager<T> {
  private state: T;
  private subscribers = new Set<(state: T) => void>();
  private pendingUpdates = new Map<string, Promise<T>>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  getState(): T {
    return { ...this.state };
  }

  async updateState(updates: Partial<T>): Promise<T> {
    const updateId = crypto.randomUUID();

    // Prevent concurrent updates to the same resource
    if (this.pendingUpdates.has(updateId)) {
      throw new Error('Update already in progress');
    }

    // Optimistic update
    const optimisticState = { ...this.state, ...updates };
    this.notifySubscribers(optimisticState);

    try {
      // Backend-first: Always sync with server
      const serverState = await this.syncWithBackend(updates);
      this.state = serverState;
      this.notifySubscribers(serverState);
      return serverState;
    } catch (error) {
      // Rollback on failure
      this.notifySubscribers(this.state);
      throw error;
    } finally {
      this.pendingUpdates.delete(updateId);
    }
  }

  private async syncWithBackend(updates: Partial<T>): Promise<T> {
    // Implementation depends on specific API endpoint
    // This is a generic pattern - concrete implementations would use APIService
    throw new Error('syncWithBackend must be implemented by subclass');
  }

  private notifySubscribers(state: T): void {
    this.subscribers.forEach(callback => callback(state));
  }

  subscribe(callback: (state: T) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
}
```

### Conflict Prevention Using Operation Guards

```typescript
// src/hooks/useOperationGuard.ts
import { useState, useCallback, useRef } from 'react';

interface OperationGuardOptions {
  timeout?: number;
  onTimeout?: () => void;
  onConflict?: () => void;
}

export function useOperationGuard(options: OperationGuardOptions = {}) {
  const { timeout = 30000, onTimeout, onConflict } = options;
  const [isActive, setIsActive] = useState(false);
  const activeOperations = useRef(new Set<string>());

  const guard = useCallback(async <T>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    // Check for conflicting operations
    if (activeOperations.current.has(operationId)) {
      onConflict?.();
      throw new Error(`Operation ${operationId} already in progress`);
    }

    activeOperations.current.add(operationId);
    setIsActive(true);

    const timeoutId = setTimeout(() => {
      activeOperations.current.delete(operationId);
      setIsActive(false);
      onTimeout?.();
    }, timeout);

    try {
      const result = await operation();
      return result;
    } finally {
      clearTimeout(timeoutId);
      activeOperations.current.delete(operationId);
      setIsActive(activeOperations.current.size > 0);
    }
  }, [timeout, onTimeout, onConflict]);

  return { guard, isActive };
}
```

### Error Recovery Patterns with HTTP Status Code Handling

```typescript
// src/services/ErrorRecoveryService.ts
import { APIService } from './APIService';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

interface ErrorHandler {
  canHandle(error: any): boolean;
  handle(error: any, context: ErrorContext): Promise<any>;
}

interface ErrorContext {
  operation: string;
  attempt: number;
  originalError: any;
}

class ErrorRecoveryService {
  private static readonly DEFAULT_RETRY_CONFIG: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2
  };

  private handlers: ErrorHandler[] = [
    new NetworkErrorHandler(),
    new AuthenticationErrorHandler(),
    new ServerErrorHandler(),
    new ValidationErrorHandler()
  ];

  async executeWithRecovery<T>(
    operation: () => Promise<T>,
    operationName: string,
    retryConfig: Partial<RetryConfig> = {}
  ): Promise<T> {
    const config = { ...ErrorRecoveryService.DEFAULT_RETRY_CONFIG, ...retryConfig };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const context: ErrorContext = {
          operation: operationName,
          attempt,
          originalError: error
        };

        // Try to handle the error
        const handler = this.handlers.find(h => h.canHandle(error));
        if (handler) {
          try {
            return await handler.handle(error, context);
          } catch (handlerError) {
            // Handler failed, continue to retry logic
            lastError = handlerError;
          }
        }

        // If not the last attempt, wait before retrying
        if (attempt < config.maxAttempts) {
          const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffFactor, attempt - 1),
            config.maxDelay
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

class NetworkErrorHandler implements ErrorHandler {
  canHandle(error: any): boolean {
    return !navigator.onLine || error.code === 'NETWORK_ERROR';
  }

  async handle(error: any, context: ErrorContext): Promise<any> {
    if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    }

    // For network errors, always retry
    throw error; // Let retry logic handle it
  }
}

class AuthenticationErrorHandler implements ErrorHandler {
  canHandle(error: any): boolean {
    return error.status === 401 || error.status === 403;
  }

  async handle(error: any, context: ErrorContext): Promise<any> {
    if (error.status === 401) {
      // Token expired, try refresh
      try {
        await APIService.refreshToken();
        // Retry the original operation
        throw new Error('RETRY_OPERATION');
      } catch (refreshError) {
        throw new Error('Authentication failed. Please log in again.');
      }
    }

    throw new Error('Access denied. You do not have permission to perform this action.');
  }
}

class ServerErrorHandler implements ErrorHandler {
  canHandle(error: any): boolean {
    return error.status >= 500 && error.status < 600;
  }

  async handle(error: any, context: ErrorContext): Promise<any> {
    if (context.attempt < 3) {
      // Server errors may be transient, allow retry
      throw error;
    }

    throw new Error('Server error occurred. Please try again later or contact support.');
  }
}

class ValidationErrorHandler implements ErrorHandler {
  canHandle(error: any): boolean {
    return error.status === 400 || error.status === 422;
  }

  async handle(error: any, context: ErrorContext): Promise<any> {
    // Validation errors should not be retried
    const message = error.response?.data?.message || 'Invalid data provided. Please check your input.';
    throw new Error(message);
  }
}

// Usage example
const errorRecovery = new ErrorRecoveryService();

async function updateUserProfile(userId: string, profileData: any) {
  return errorRecovery.executeWithRecovery(
    () => APIService.updateUserProfile(userId, profileData),
    'updateUserProfile'
  );
}
```

## 🛡️ Quality Gates and Automated Validation

### Pre-Integration Checks
- **Type Safety**: All integration code must pass TypeScript compilation
- **API Contract Validation**: Request/response schemas must match API specifications
- **Error Handling Coverage**: All error paths must be handled appropriately
- **Performance Budget**: Integration operations must meet [performance targets](../PERFORMANCE_TARGETS.md#api-performance)

### Automated Testing Requirements
- **Unit Test Coverage**: > 80% for all integration service methods
- **Integration Tests**: End-to-end API workflows must be tested
- **Error Scenario Coverage**: All HTTP status codes must have test cases
- **Load Testing**: API endpoints must handle expected concurrent users

### Code Quality Standards
- **Function Size Limits**: Integration functions must not exceed [50 lines](../QUALITY_METRICS.md#function-size-limits)
- **Complexity Score**: Cyclomatic complexity must be < [10](../QUALITY_METRICS.md#complexity-scores)
- **Error Handling**: All integration points must have comprehensive error handling
- **Logging Standards**: Appropriate logging for debugging and monitoring

### Continuous Integration Gates
- **ESLint Compliance**: Zero errors or warnings in integration code
- **Type Coverage**: 100% TypeScript coverage for integration modules
- **Bundle Size Impact**: Integration code must not exceed bundle size budgets
- **Security Scan**: Automated security vulnerability scanning

## 🔗 Integration with Existing Standards

### Quality Standards Compliance
→ **See [Quality Metrics](../QUALITY_METRICS.md)** for code quality requirements
→ **See [Performance Targets](../PERFORMANCE_TARGETS.md)** for API performance standards
→ **See [Security Requirements](../SECURITY_REQUIREMENTS.md)** for API security patterns

### Development Guidelines
→ **See [Development Guidelines](../DEVELOPMENT_GUIDELINES.md)** for coding standards
→ **See [Testing Guide](../development/TESTING_GUIDE.md)** for testing patterns
→ **See [Component Patterns](../development/COMPONENT_PATTERNS.md)** for UI integration patterns

### Documentation Standards
→ **See [Documentation Standards](../DOCUMENTATION_STANDARDS.md)** for documentation requirements
→ **See [API Documentation](../API_DOCUMENTATION.md)** for API integration details

## 📋 Implementation Checklist

### State Management
- [ ] Backend-first architecture implemented
- [ ] Optimistic updates with rollback on failure
- [ ] Conflict prevention mechanisms in place
- [ ] Offline state synchronization handled

### API Integration
- [ ] Consistent error handling across all endpoints
- [ ] Proper HTTP status code interpretation
- [ ] Rate limiting and retry logic implemented
- [ ] API versioning strategy documented

### User Experience
- [ ] Loading states for all async operations
- [ ] Clear error messages with actionable guidance
- [ ] Progressive enhancement for core functionality
- [ ] Accessibility compliance maintained

### Quality Assurance
- [ ] Automated tests for all integration patterns
- [ ] Performance budgets monitored and enforced
- [ ] Security requirements validated
- [ ] Code quality standards met

This document serves as the definitive source for all integration patterns and standards in the SGSGitaAlumni project. All implementations must adhere to these patterns to ensure consistent, reliable, and maintainable integrations.
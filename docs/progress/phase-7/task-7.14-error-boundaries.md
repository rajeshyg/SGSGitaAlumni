# Task 7.14: Error Boundary Implementation

**Status:** 🟡 Planned
**Priority:** High
**Duration:** 2 days
**Parent Task:** Phase 7 - Quality & Stability
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 9

## Overview
Wrap all page-level components with React Error Boundaries to gracefully handle runtime errors, prevent white screens, and provide fallback UI with error recovery options.

**Problem:** JavaScript errors in React components crash the entire app, showing a blank white screen to users with no way to recover except refreshing.

**Solution:** Implement error boundaries at strategic levels to catch errors, display user-friendly fallback UI, log errors for debugging, and provide recovery options.

## Functional Requirements

### Error Boundary Levels

#### 1. App-Level Error Boundary
- **Location:** Wraps entire app
- **Purpose:** Catch catastrophic errors
- **Fallback:** Full-page error screen with reload button
- **Logging:** Send to error tracking service

#### 2. Page-Level Error Boundaries
- **Location:** Wrap each route/page component
- **Purpose:** Isolate page-specific errors
- **Fallback:** Page error with navigation to home
- **Logging:** Log page path and error details

#### 3. Feature-Level Error Boundaries (Optional)
- **Location:** Wrap complex features (e.g., posting creation, family member selector)
- **Purpose:** Isolate feature failures
- **Fallback:** Feature-specific error with retry button
- **Logging:** Log feature name and error context

### Fallback UI Features

#### App-Level Fallback
```tsx
<div className="min-h-screen flex items-center justify-center bg-background">
  <Card className="max-w-md p-8 text-center">
    <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
    <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
    <p className="text-muted-foreground mb-6">
      We encountered an unexpected error. Please try reloading the page.
    </p>
    <Button onClick={() => window.location.reload()}>
      Reload Page
    </Button>
  </Card>
</div>
```

#### Page-Level Fallback
```tsx
<div className="container mx-auto py-12">
  <Card className="max-w-2xl mx-auto p-8">
    <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
    <h2 className="text-xl font-semibold mb-2">Page Error</h2>
    <p className="text-muted-foreground mb-4">
      This page encountered an error. You can try going back or return to the home page.
    </p>
    <div className="flex gap-4 justify-center">
      <Button variant="outline" onClick={() => window.history.back()}>
        Go Back
      </Button>
      <Button onClick={() => window.location.href = '/'}>
        Go Home
      </Button>
    </div>
  </Card>
</div>
```

## Technical Requirements

### Error Boundary Component

```typescript
// Location: src/components/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  level: 'app' | 'page' | 'feature';
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary Caught:', error);
      console.error('Error Info:', errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to error tracking service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // TODO: Integrate with error tracking service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Send to backend logging endpoint
    fetch('/api/errors/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData)
    }).catch(console.error);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use level-specific fallback
      switch (this.props.level) {
        case 'app':
          return <AppLevelFallback onReset={this.handleReset} />;
        case 'page':
          return <PageLevelFallback onReset={this.handleReset} />;
        case 'feature':
          return <FeatureLevelFallback onReset={this.handleReset} />;
        default:
          return <DefaultFallback onReset={this.handleReset} />;
      }
    }

    return this.props.children;
  }
}
```

### Fallback Components

```typescript
// Location: src/components/error-fallbacks/AppLevelFallback.tsx

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  onReset: () => void;
}

export function AppLevelFallback({ onReset }: Props) {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md p-8 text-center">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-foreground">
          Something went wrong
        </h1>
        <p className="text-muted-foreground mb-6">
          We encountered an unexpected error. Please try reloading the page.
          If the problem persists, contact support.
        </p>
        <div className="flex gap-4 justify-center">
          <Button variant="outline" onClick={onReset}>
            Try Again
          </Button>
          <Button onClick={handleReload}>
            Reload Page
          </Button>
        </div>
      </Card>
    </div>
  );
}

// Location: src/components/error-fallbacks/PageLevelFallback.tsx

import { AlertTriangle } from 'lucide-react';

export function PageLevelFallback({ onReset }: Props) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="max-w-2xl mx-auto p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-foreground">
          Page Error
        </h2>
        <p className="text-muted-foreground mb-4">
          This page encountered an error. You can try again or return to a previous page.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="outline" onClick={handleGoBack}>
            Go Back
          </Button>
          <Button variant="outline" onClick={onReset}>
            Try Again
          </Button>
          <Button onClick={handleGoHome}>
            Go Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### App Integration

```typescript
// Location: src/App.tsx

import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary level="app">
      <Router>
        <Routes>
          <Route path="/" element={
            <ErrorBoundary level="page">
              <HomePage />
            </ErrorBoundary>
          } />
          
          <Route path="/dashboard" element={
            <ErrorBoundary level="page">
              <DashboardPage />
            </ErrorBoundary>
          } />
          
          <Route path="/postings/create" element={
            <ErrorBoundary level="page">
              <CreatePostingPage />
            </ErrorBoundary>
          } />
          
          {/* All other routes with error boundaries */}
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

### Feature-Level Example

```typescript
// Location: src/pages/CreatePostingPage.tsx

export function CreatePostingPage() {
  return (
    <div className="container mx-auto py-8">
      <h1>Create Posting</h1>
      
      {/* Wrap complex feature with its own error boundary */}
      <ErrorBoundary level="feature" fallback={
        <PostingCreationError />
      }>
        <PostingCreationForm />
      </ErrorBoundary>
    </div>
  );
}
```

## Implementation Plan

### Day 1: Core Implementation
**Morning:**
- [ ] Create ErrorBoundary component
- [ ] Create AppLevelFallback component
- [ ] Create PageLevelFallback component
- [ ] Create FeatureLevelFallback component

**Afternoon:**
- [ ] Wrap App component with app-level boundary
- [ ] Wrap all route components with page-level boundaries
- [ ] Test error boundary with intentional errors
- [ ] Implement error logging endpoint

### Day 2: Testing & Polish
**Morning:**
- [ ] Test error boundaries on each page
- [ ] Test recovery mechanisms (reset, reload, navigate)
- [ ] Test error logging to backend
- [ ] Verify theme compliance in fallback UIs

**Afternoon:**
- [ ] Add feature-level boundaries to complex components
- [ ] Create error boundary test utilities
- [ ] Update documentation
- [ ] Final cross-browser testing

## Success Criteria

### Stability
- [ ] No white screen errors anywhere in the app
- [ ] All pages have error boundary protection
- [ ] Errors are caught and displayed gracefully
- [ ] Users can recover from errors without losing data

### User Experience
- [ ] Clear, user-friendly error messages
- [ ] Multiple recovery options (retry, go back, go home)
- [ ] Consistent error UI across all error types
- [ ] Theme-compliant error displays

### Developer Experience
- [ ] Errors logged to console in development
- [ ] Errors sent to tracking service in production
- [ ] Easy to add new error boundaries
- [ ] Error boundary test helpers available

## Testing Checklist

### Manual Tests
- [ ] Throw error in HomePage → see page-level fallback
- [ ] Throw error in DashboardPage → see page-level fallback
- [ ] Throw error in App.tsx → see app-level fallback
- [ ] Click "Try Again" → error clears, component remounts
- [ ] Click "Go Home" → navigates to home page
- [ ] Click "Reload" → page reloads

### Automated Tests
```typescript
describe('ErrorBoundary', () => {
  it('catches errors and displays fallback', () => {
    const ThrowError = () => { throw new Error('Test error'); };
    
    render(
      <ErrorBoundary level="page">
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(screen.getByText(/page error/i)).toBeInTheDocument();
  });

  it('calls onError callback', () => {
    const onError = jest.fn();
    const ThrowError = () => { throw new Error('Test'); };
    
    render(
      <ErrorBoundary level="page" onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalled();
  });

  it('resets error state on reset', () => {
    // Test reset functionality
  });
});
```

### Cross-Browser Tests
- [ ] Chrome: Error boundaries work correctly
- [ ] Firefox: Error boundaries work correctly
- [ ] Safari: Error boundaries work correctly
- [ ] Edge: Error boundaries work correctly
- [ ] Mobile browsers: Error boundaries work correctly

## Dependencies

### Required Before Starting
- [ ] React 16.8+ (Error Boundaries support)
- [ ] Theme system with CSS variables
- [ ] Basic routing structure

### Blocks These Tasks
- Improved app stability and reliability
- Better error reporting and monitoring
- Enhanced user experience during errors

## Related Documentation
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Master plan
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Phase 7 README](./README.md) - Phase overview

---

*This task prevents app crashes and provides graceful error recovery, significantly improving user experience and app stability.*

# Task 7.1.1: API Error Response Standards

**Status:** 🟡 Planned
**Priority:** High
**Duration:** 3 days
**Parent Task:** [Task 7.1: API Foundation](./task-7.1-api-foundation.md)
**Related:** [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Action 8

## Overview
Standardize all API error responses across the application to follow a consistent format. This ensures predictable error handling on the frontend, better debugging, and improved developer experience.

**Current Problem:** APIs return inconsistent error formats - some return `{ error: "message" }`, others `{ message: "error" }`, and some use HTTP status codes without response bodies.

**Target Format:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": {}  // Optional additional context
  }
}
```

## Functional Requirements

### Error Response Structure

#### Standard Success Response
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
}
```

#### Standard Error Response
```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Optional additional context
    timestamp?: string;     // ISO 8601 timestamp
    path?: string;          // API endpoint path
    requestId?: string;     // For tracking/debugging
  };
}
```

### Error Code Categories

#### Authentication Errors (AUTH_*)
```typescript
const AUTH_ERRORS = {
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password',
  AUTH_ACCOUNT_LOCKED: 'Account has been locked due to too many failed attempts',
  AUTH_SESSION_EXPIRED: 'Your session has expired. Please login again.',
  AUTH_UNAUTHORIZED: 'You are not authorized to access this resource',
  AUTH_TOKEN_INVALID: 'Invalid authentication token',
  AUTH_TOKEN_EXPIRED: 'Authentication token has expired'
};
```

#### Validation Errors (VALIDATION_*)
```typescript
const VALIDATION_ERRORS = {
  VALIDATION_ERROR: 'Invalid request data',
  VALIDATION_MISSING_FIELD: 'Required field is missing',
  VALIDATION_INVALID_FORMAT: 'Field has invalid format',
  VALIDATION_OUT_OF_RANGE: 'Value is out of acceptable range',
  VALIDATION_DUPLICATE: 'Value already exists'
};
```

#### Resource Errors (RESOURCE_*)
```typescript
const RESOURCE_ERRORS = {
  RESOURCE_NOT_FOUND: 'The requested resource was not found',
  RESOURCE_CONFLICT: 'Resource already exists',
  RESOURCE_GONE: 'Resource is no longer available',
  RESOURCE_LOCKED: 'Resource is currently locked'
};
```

#### Permission Errors (PERMISSION_*)
```typescript
const PERMISSION_ERRORS = {
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  PERMISSION_ROLE_REQUIRED: 'This action requires a specific role',
  PERMISSION_OWNER_ONLY: 'Only the resource owner can perform this action'
};
```

#### Rate Limiting Errors (RATE_*)
```typescript
const RATE_LIMIT_ERRORS = {
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',
  RATE_LIMIT_BLOCKED: 'You have been temporarily blocked due to excessive requests'
};
```

#### Server Errors (SERVER_*)
```typescript
const SERVER_ERRORS = {
  SERVER_ERROR: 'An unexpected error occurred',
  SERVER_DATABASE_ERROR: 'Database operation failed',
  SERVER_SERVICE_UNAVAILABLE: 'Service is temporarily unavailable',
  SERVER_TIMEOUT: 'Request timed out'
};
```

### HTTP Status Code Mapping

```typescript
const ERROR_CODE_TO_HTTP_STATUS = {
  // Authentication - 401
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_TOKEN_INVALID: 401,
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_SESSION_EXPIRED: 401,
  
  // Authorization - 403
  AUTH_UNAUTHORIZED: 403,
  PERMISSION_DENIED: 403,
  PERMISSION_ROLE_REQUIRED: 403,
  PERMISSION_OWNER_ONLY: 403,
  
  // Not Found - 404
  RESOURCE_NOT_FOUND: 404,
  
  // Conflict - 409
  RESOURCE_CONFLICT: 409,
  VALIDATION_DUPLICATE: 409,
  
  // Gone - 410
  RESOURCE_GONE: 410,
  
  // Locked - 423
  RESOURCE_LOCKED: 423,
  AUTH_ACCOUNT_LOCKED: 423,
  
  // Too Many Requests - 429
  RATE_LIMIT_EXCEEDED: 429,
  RATE_LIMIT_BLOCKED: 429,
  
  // Validation - 400
  VALIDATION_ERROR: 400,
  VALIDATION_MISSING_FIELD: 400,
  VALIDATION_INVALID_FORMAT: 400,
  VALIDATION_OUT_OF_RANGE: 400,
  
  // Server Errors - 500
  SERVER_ERROR: 500,
  SERVER_DATABASE_ERROR: 500,
  SERVER_SERVICE_UNAVAILABLE: 503,
  SERVER_TIMEOUT: 504
};
```

## Technical Requirements

### Error Handler Class

```typescript
// Location: src/lib/errors/ApiError.ts

export class ApiError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;

  constructor(
    code: string,
    message: string,
    statusCode?: number,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode || ERROR_CODE_TO_HTTP_STATUS[code] || 500;
    this.details = details;
  }

  toJSON(): ErrorResponse {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
        timestamp: new Date().toISOString()
      }
    };
  }
}

// Helper factory functions
export const AuthError = {
  invalidCredentials: () => 
    new ApiError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 401),
  
  sessionExpired: () => 
    new ApiError('AUTH_SESSION_EXPIRED', 'Your session has expired. Please login again.', 401),
  
  unauthorized: () => 
    new ApiError('AUTH_UNAUTHORIZED', 'You are not authorized to access this resource', 403)
};

export const ValidationError = {
  invalidData: (details: any) => 
    new ApiError('VALIDATION_ERROR', 'Invalid request data', 400, details),
  
  missingField: (field: string) => 
    new ApiError('VALIDATION_MISSING_FIELD', `Required field '${field}' is missing`, 400, { field }),
  
  duplicate: (field: string) => 
    new ApiError('VALIDATION_DUPLICATE', `${field} already exists`, 409, { field })
};

export const ResourceError = {
  notFound: (resource: string) => 
    new ApiError('RESOURCE_NOT_FOUND', `${resource} not found`, 404, { resource }),
  
  conflict: (resource: string) => 
    new ApiError('RESOURCE_CONFLICT', `${resource} already exists`, 409, { resource })
};
```

### Global Error Handler Middleware

```typescript
// Location: src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../lib/errors/ApiError';

export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error for debugging
  console.error('API Error:', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp: new Date().toISOString(),
        path: req.path,
        requestId: req.headers['x-request-id']
      }
    });
  }

  // Handle Zod validation errors
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle database errors
  if (err.name === 'QueryFailedError' || err.code === '23505') {
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_DATABASE_ERROR',
        message: 'Database operation failed',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle all other errors as internal server errors
  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
}
```

### Route Implementation Examples

#### Before (Inconsistent)
```typescript
// ❌ WRONG - Multiple error formats
router.post('/api/auth/login', async (req, res) => {
  const user = await findUser(req.body.email);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const valid = await validatePassword(user, req.body.password);
  if (!valid) {
    return res.status(401).send('Invalid password');
  }
  
  res.json({ user });
});
```

#### After (Consistent)
```typescript
// ✅ CORRECT - Standardized error format
router.post('/api/auth/login', async (req, res, next) => {
  try {
    const user = await findUser(req.body.email);
    if (!user) {
      throw ResourceError.notFound('User');
    }
    
    const valid = await validatePassword(user, req.body.password);
    if (!valid) {
      throw AuthError.invalidCredentials();
    }
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
});
```

## Implementation Plan

### Day 1: Core Infrastructure
**Morning:**
- [ ] Create `ApiError` class
- [ ] Create error factory functions
- [ ] Define all error codes and messages
- [ ] Create error-to-HTTP-status mapping

**Afternoon:**
- [ ] Create global error handler middleware
- [ ] Update server.js to use error handler
- [ ] Write unit tests for ApiError class
- [ ] Test error handler with various error types

### Day 2: Route Updates
**Morning:**
- [ ] Update authentication routes
- [ ] Update invitation routes
- [ ] Update family member routes
- [ ] Update user profile routes

**Afternoon:**
- [ ] Update posting routes
- [ ] Update moderation routes
- [ ] Update domain/category routes
- [ ] Test all updated routes

### Day 3: Frontend & Documentation
**Morning:**
- [ ] Update frontend API service to handle new format
- [ ] Create error display components
- [ ] Update error handling in forms
- [ ] Test error display across UI

**Afternoon:**
- [ ] Document all error codes
- [ ] Update API documentation
- [ ] Create error code reference guide
- [ ] Final testing and validation

## Success Criteria

### Consistency
- [ ] All API endpoints return `{ success, error }` format
- [ ] All error codes follow naming convention
- [ ] All HTTP status codes mapped correctly
- [ ] All errors include timestamp and path

### Developer Experience
- [ ] TypeScript types for all error responses
- [ ] Clear error code naming
- [ ] Helpful error messages
- [ ] Easy to add new error types

### User Experience
- [ ] User-friendly error messages
- [ ] Consistent error display in UI
- [ ] Clear guidance on how to fix errors
- [ ] No technical jargon in user-facing messages

## Testing Checklist

### Unit Tests
- [ ] ApiError class creates correct structure
- [ ] Error factories create correct codes
- [ ] HTTP status codes mapped correctly
- [ ] toJSON() method formats properly

### Integration Tests
- [ ] Global error handler catches all errors
- [ ] Validation errors formatted correctly
- [ ] Database errors formatted correctly
- [ ] Unhandled errors return SERVER_ERROR

### Manual Tests
- [ ] Test invalid login → AUTH_INVALID_CREDENTIALS
- [ ] Test missing field → VALIDATION_MISSING_FIELD
- [ ] Test resource not found → RESOURCE_NOT_FOUND
- [ ] Test permission denied → PERMISSION_DENIED
- [ ] Test rate limit → RATE_LIMIT_EXCEEDED

## Dependencies

### Required Before Starting
- [ ] Express server setup complete
- [ ] Basic routing structure in place

### Blocks These Tasks
- Better error handling across all features
- Improved debugging and monitoring
- Better user experience for error states

## Related Documentation
- [Task 7.1: API Foundation](./task-7.1-api-foundation.md) - Parent task
- [Task 8.12: Violation Corrections](../phase-8/task-8.12-violation-corrections.md) - Master plan
- [Phase 7 README](./README.md) - Phase overview

---

*This task establishes consistent error handling across the entire API surface, improving reliability and developer experience.*

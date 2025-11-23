---
version: "1.0"
status: implemented
last_updated: 2025-11-23
applies_to: all
enforcement: required
---

# Error Handling Architecture

## Overview

This document describes the standardized error handling system implemented across the SGS Gita Alumni platform. All API endpoints return consistent, structured error responses with clear error codes for debugging and user-facing error handling.

## Error Response Format

### Success Response (HTTP 200-299)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

### Error Response (HTTP 400-599)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly error message",
    "details": {
      "field": "email",
      "value": "invalid"
    },
    "timestamp": "2025-11-08T10:30:00.000Z",
    "path": "/api/auth/login",
    "requestId": "req-uuid-123"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Always `false` for errors |
| `error.code` | string | Machine-readable error code |
| `error.message` | string | User-friendly error message |
| `error.details` | object | Optional additional error context |
| `error.timestamp` | string | ISO-8601 timestamp of error |
| `error.path` | string | API endpoint path where error occurred |
| `error.requestId` | string | (Optional) Unique request identifier |

## Error Code Reference

### Authentication Errors (401)

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password | - |
| `AUTH_SESSION_EXPIRED` | 401 | Your session has expired. Please log in again. | - |
| `AUTH_TOKEN_INVALID` | 401 | Invalid authentication token | - |
| `AUTH_TOKEN_EXPIRED` | 401 | Authentication token has expired | - |
| `AUTH_UNAUTHORIZED` | 401 | You do not have permission to access this resource | - |

### Validation Errors (400)

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `VALIDATION_ERROR` | 400 | Invalid request data | `{ field, message }[]` |
| `VALIDATION_MISSING_FIELD` | 400 | Required field '...' is missing | `{ fieldName }` |
| `VALIDATION_DUPLICATE` | 409 | A record with this value already exists | `{ field, value }` |

### Resource Errors (404)

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `RESOURCE_NOT_FOUND` | 404 | ... not found | `{ resourceType, resourceId }` |
| `RESOURCE_DELETED` | 410 | The requested resource has been deleted | `{ resourceId }` |

### Permission Errors (403)

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `PERMISSION_DENIED` | 403 | You do not have permission to perform this action | `{ requiredRole }` |
| `RESOURCE_LOCKED` | 423 | Resource is locked and cannot be modified | - |

### Rate Limiting (429)

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests. Please try again later. | `{ retryAfter }` |

### Server Errors (500-599)

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `SERVER_ERROR` | 500 | An unexpected error occurred | - |
| `SERVER_DATABASE_ERROR` | 500 | Database operation failed | (dev only) |
| `SERVER_UNAVAILABLE` | 503 | Service temporarily unavailable | `{ retryAfter }` |
| `SERVER_TIMEOUT` | 504 | Request timed out | - |

## Backend Implementation

### Error Classes

**Implementation**: `/server/errors/ApiError.js`

```javascript
// Create authentication errors
throw AuthError.invalidCredentials();
// Returns: 401 with code AUTH_INVALID_CREDENTIALS

// Create validation errors
throw ValidationError.missingField('email');
// Returns: 400 with code VALIDATION_MISSING_FIELD

// Create resource errors
throw ResourceError.notFound('Posting');
// Returns: 404 with code RESOURCE_NOT_FOUND
```

### Global Error Handler

**Implementation**: `/server/middleware/errorHandler.js`

The error handler middleware:
1. Catches all thrown errors (ApiError instances and others)
2. Converts them to standardized response format
3. Handles special cases (JWT errors, MySQL errors, Zod validation errors)
4. Returns appropriate HTTP status codes
5. Includes request path and timestamp for debugging

```javascript
// Must be registered AFTER all routes in server.js
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
// ... more routes ...

// Error handlers come last
app.use(notFoundHandler);  // 404 handler
app.use(errorHandler);     // Global error handler
```

### Async Handler Wrapper

**Implementation**: `/server/middleware/errorHandler.js`

```javascript
import { asyncHandler } from '../middleware/errorHandler.js';

// Wrap async route handlers to auto-catch errors
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  res.json({ success: true, data: user });
  // Any thrown errors automatically caught and formatted
}));
```

### Database Error Handling

```javascript
const connection = await pool.getConnection();
try {
  await connection.beginTransaction();
  // operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

## Frontend Implementation

### Error Flow

1. **SecureAPIClient** (`/src/lib/security/SecureAPIClient.ts`)
   - Detects error format in response
   - Extracts code, message, details
   - Creates Error with properties: `code`, `status`, `details`, `isStandardError`

2. **apiClient** (`/src/lib/api.ts`)
   - Receives error from SecureAPIClient
   - Converts to appropriate error class:
     - `AuthenticationError` for AUTH_* codes and 401/403 status
     - `APIError` for other errors

3. **APIService** (`/src/services/APIService.ts`)
   - Catches errors from apiClient
   - Re-throws with user-friendly message

4. **UI Components**
   - Catch errors using try-catch
   - Display appropriate user message

### Error Handling Utilities

**Implementation**: `/src/utils/errorHandling.ts`

```typescript
// Convert any error to standardized ApiError interface
const apiError = handleApiError(error);

// Get user-friendly error message
const message = getErrorMessage(error);

// Check error type
isAuthError(error)         // Check if authentication error
isNetworkError(error)      // Check if network error
isValidationError(error)   // Check if validation error

// Retry with exponential backoff
await withRetry(async () => {
  return await apiClient.post('/api/endpoint', data);
}, { maxAttempts: 3, backoff: true });
```

### Frontend Error Boundaries

**Status**: Pending

```tsx
// src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}
```

### Component Error Handling Example

```typescript
import { AuthenticationError, APIError } from '@/utils/errorHandling';

async function handleLogin(email: string, password: string) {
  try {
    const response = await APIService.login({ email, password });
    localStorage.setItem('authToken', response.token);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      showErrorAlert('Invalid credentials. Please try again.');
    } else if (error instanceof APIError) {
      if (error.code === 'VALIDATION_ERROR') {
        showErrorAlert(`Validation error: ${error.message}`);
      } else {
        showErrorAlert(error.message);
      }
    } else {
      showErrorAlert('An unexpected error occurred.');
    }
  }
}
```

## Development vs Production

### Production

- Error stack traces NOT included in responses
- Database error details NOT exposed
- Generic error messages for security
- Minimal error logging

### Development

- Error stack traces included in 500 errors
- Database error details included for debugging
- Detailed console logging for all errors

```javascript
const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  // Include details for debugging
  return res.status(500).json({
    error: {
      ...(err.stack && { stack: err.stack }),
      ...(isDev && { sqlMessage: err.sqlMessage })
    }
  });
}
```

## Updated Routes

All routes have been updated to use standardized error handling:

| Route File | Status |
|------------|--------|
| `routes/auth.js` | Implemented |
| `routes/invitations.js` | Implemented |
| `routes/family-members.js` | Implemented |
| `routes/postings.js` | Implemented |
| `server/routes/moderation-new.js` | Implemented |
| `routes/users.js` | Implemented |
| `routes/alumni-members.js` | Implemented |

## Testing

### Manual Testing

```bash
# Test invalid credentials
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"wrong"}'
# Expected: 401 with AUTH_INVALID_CREDENTIALS

# Test missing field
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
# Expected: 400 with VALIDATION_MISSING_FIELD
```

### Automated Testing

```typescript
test('returns standardized error on invalid credentials', async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'user@example.com', password: 'wrong' })
  });

  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  expect(response.status).toBe(401);
});
```

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Error not caught | Route not wrapped with asyncHandler | Wrap with `asyncHandler((req, res) => {...})` |
| Handler not registered | Error handlers before routes | Move `app.use(errorHandler)` to end |
| Frontend not showing message | Error not caught in try-catch | Ensure APIService methods use try-catch |
| Different formats | Some routes not updated | Check route uses standardized errors |

## Implementation Files

- Backend Error Class: `/server/errors/ApiError.js`
- Error Middleware: `/server/middleware/errorHandler.js`
- Frontend Error Utilities: `/src/utils/errorHandling.ts`
- Frontend API Client: `/src/lib/api.ts`
- Frontend Secure API Client: `/src/lib/security/SecureAPIClient.ts`
- Frontend API Service: `/src/services/APIService.ts`

## Related Specifications

- [API Design](./api-design.md) - API standards
- [Logging](./logging.md) - Error logging patterns
- [Data Flow](./data-flow.md) - Error flow in data pipeline

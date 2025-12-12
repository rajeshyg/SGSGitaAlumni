---
version: "1.1"
status: implemented
last_updated: 2025-12-12
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

### Error Flow (Unified)

1. **Detection**:
    *   **SecureAPIClient**: Detects 4xx/5xx API responses.
    *   **Global Handlers**: `window.onerror` and `onunhandledrejection` catch crashes.
    *   **Logger**: `logger.error()` calls catch explicit errors.

2. **Reporting (Development)**:
    *   Errors detected by `src/lib/monitoring.ts` are forwarded to the backend via `POST /api/dev/client-log`.
    *   These errors appear in the server terminal and `logs/errors.log`.

3. **Handling**:
    *   **UI Components**: Catch errors using try-catch and display user messages.
    *   **SecureAPIClient**: Converts responses to `APIError` objects.

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
    // This now automatically syncs to backend logs via logger
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

## Development vs Production

### Production

- Error stack traces NOT included in responses.
- Database error details NOT exposed.
- Generic error messages for security.
- Errors logged to monitoring service (Sentry/CloudWatch).
- **Client logs** stay in browser/Sentry (no bridge).

### Development

- Error stack traces included in 500 errors.
- Database error details included for debugging.
- **Unified Logging**:
    - Client errors forwarded to Backend.
    - All errors (Client + Server) saved to `logs/errors.log`.
    - Console shows unified stream.

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

## Implementation Files

- Backend Error Class: `/server/errors/ApiError.js`
- Error Middleware: `/server/middleware/errorHandler.js`
- Frontend Error Utilities: `/src/utils/errorHandling.ts`
- Frontend API Client: `/src/lib/api.ts`
- Frontend Secure API Client: `/src/lib/security/SecureAPIClient.ts`
- Frontend Monitor: `/src/lib/monitoring.ts` (Handles reporting)

## Related Specifications

- [API Design](./api-design.md) - API standards
- [Logging](./logging.md) - Error logging patterns
- [Data Flow](./data-flow.md) - Error flow in data pipeline
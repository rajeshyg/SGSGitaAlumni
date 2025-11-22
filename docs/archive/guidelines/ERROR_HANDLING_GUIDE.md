# Error Handling Guide - Standardized API Error Responses

## Overview

This guide documents the standardized error handling system implemented across the SGS Gita Alumni portal. All API endpoints now return consistent, structured error responses that provide clear error codes, messages, and details for easier debugging and user-facing error handling.

## Error Response Format

### Success Response (HTTP 200-299)
Successful requests return the data directly without a wrapper:

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    ...
  },
  "expiresIn": 3600
}
```

### Error Response (HTTP 400-599)
All error responses follow this standardized format:

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
| `error.code` | string | Machine-readable error code (e.g., `AUTH_INVALID_CREDENTIALS`) |
| `error.message` | string | User-friendly error message |
| `error.details` | object | Optional additional error context |
| `error.timestamp` | string | ISO-8601 timestamp of error |
| `error.path` | string | API endpoint path where error occurred |
| `error.requestId` | string | (Optional) Unique request identifier for debugging |

## Error Codes

### Authentication Errors (401)
Used for authentication-related failures.

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password | - |
| `AUTH_SESSION_EXPIRED` | 401 | Your session has expired. Please log in again. | - |
| `AUTH_TOKEN_INVALID` | 401 | Invalid authentication token | - |
| `AUTH_TOKEN_EXPIRED` | 401 | Authentication token has expired | - |
| `AUTH_UNAUTHORIZED` | 401 | You do not have permission to access this resource | - |

### Validation Errors (400)
Used for invalid request data.

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `VALIDATION_ERROR` | 400 | Invalid request data | `{ field, message }[]` |
| `VALIDATION_MISSING_FIELD` | 400 | Required field '...' is missing | `{ fieldName }` |
| `VALIDATION_DUPLICATE` | 409 | A record with this value already exists | `{ field, value }` |

### Resource Errors (404)
Used when resources cannot be found.

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `RESOURCE_NOT_FOUND` | 404 | ... not found | `{ resourceType, resourceId }` |
| `RESOURCE_DELETED` | 410 | The requested resource has been deleted | `{ resourceId }` |

### Permission Errors (403)
Used for authorization failures.

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `PERMISSION_DENIED` | 403 | You do not have permission to perform this action | `{ requiredRole }` |
| `RESOURCE_LOCKED` | 423 | Resource is locked and cannot be modified | - |

### Rate Limiting (429)
Used when rate limits are exceeded.

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests. Please try again later. | `{ retryAfter }` |

### Server Errors (500-599)
Used for server-side failures.

| Code | Status | Message | Details |
|------|--------|---------|---------|
| `SERVER_ERROR` | 500 | An unexpected error occurred | - |
| `SERVER_DATABASE_ERROR` | 500 | Database operation failed | (dev only) |
| `SERVER_UNAVAILABLE` | 503 | Service temporarily unavailable | `{ retryAfter }` |
| `SERVER_TIMEOUT` | 504 | Request timed out | - |

## Backend Implementation

### Error Class and Factories

**File**: `server/errors/ApiError.js`

All backend errors use a unified `ApiError` class that automatically maps error codes to HTTP status codes:

```javascript
// Example: Create an authentication error
throw AuthError.invalidCredentials();
// Returns: 401 with error code AUTH_INVALID_CREDENTIALS

// Example: Create a validation error
throw ValidationError.missingField('email');
// Returns: 400 with error code VALIDATION_MISSING_FIELD

// Example: Create a resource not found error
throw ResourceError.notFound('Posting');
// Returns: 404 with error code RESOURCE_NOT_FOUND
```

### Global Error Handler Middleware

**File**: `server/middleware/errorHandler.js`

The error handler middleware:
1. Catches all thrown errors (ApiError instances and others)
2. Converts them to standardized response format
3. Handles special cases (JWT errors, MySQL errors, Zod validation errors)
4. Returns appropriate HTTP status codes
5. Includes request path and timestamp for debugging

**Important**: The error handler must be registered **AFTER** all routes in `server.js`:

```javascript
// All routes come first
app.use('/api/auth', authRoutes);
app.use('/api/invitations', invitationRoutes);
// ... more routes ...

// Error handlers come last
app.use(notFoundHandler);  // 404 handler
app.use(errorHandler);     // Global error handler
```

### Async Route Handler Wrapper

The `asyncHandler` utility automatically catches errors from async route handlers:

```javascript
import { asyncHandler } from '../middleware/errorHandler.js';

// Usage: wrap async route handlers
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const user = await authenticateUser(req.body);
  res.json({ success: true, data: user });
  // Any thrown errors automatically caught and formatted
}));
```

## Frontend Implementation

### Error Flow

1. **SecureAPIClient** (`src/lib/security/SecureAPIClient.ts`)
   - Detects new error format in response
   - Extracts code, message, details
   - Creates Error with properties: `code`, `status`, `details`, `isStandardError`

2. **apiClient** (`src/lib/api.ts`)
   - Receives error from SecureAPIClient
   - Converts to appropriate error class:
     - `AuthenticationError` for AUTH_* codes and 401/403 status
     - `APIError` for other errors
   - Preserves code, status, and details

3. **APIService** (`src/services/APIService.ts`)
   - Catches errors from apiClient
   - Re-throws with user-friendly message
   - UI components catch and display errors

4. **UI Components**
   - Catch errors using try-catch
   - Check error type: `instanceof AuthenticationError`, `instanceof APIError`
   - Display appropriate user message or details

### Error Handling Utilities

**File**: `src/utils/errorHandling.ts`

Provides helper functions for error handling:

```typescript
// Convert any error to standardized ApiError interface
const apiError = handleApiError(error);

// Get user-friendly error message
const message = getErrorMessage(error);
const displayMessage = getErrorDisplayMessage(error);

// Check error type
isAuthError(error)         // Check if authentication error
isNetworkError(error)      // Check if network error
isValidationError(error)   // Check if validation error

// Retry with exponential backoff
await withRetry(async () => {
  return await apiClient.post('/api/endpoint', data);
}, { maxAttempts: 3, backoff: true });
```

### Frontend Error Handling Example

```typescript
import { APIService } from '@/services/APIService';
import { AuthenticationError, APIError } from '@/utils/errorHandling';

async function handleLogin(email: string, password: string) {
  try {
    const response = await APIService.login({ email, password });
    // Handle success
    localStorage.setItem('authToken', response.token);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      // Handle authentication error
      showErrorAlert('Invalid credentials. Please try again.');
    } else if (error instanceof APIError) {
      // Handle other API errors
      if (error.code === 'VALIDATION_ERROR') {
        showErrorAlert(`Validation error: ${error.message}`);
      } else {
        showErrorAlert(error.message);
      }
    } else {
      // Handle unknown errors
      showErrorAlert('An unexpected error occurred.');
    }
  }
}
```

## Route Updates

All routes have been updated to use the standardized error handling:

### Authentication Routes (`routes/auth.js`)
- Endpoints: login, logout, refresh, registerFromInvitation, registerFromFamilyInvitation
- Updated to throw ApiError instances instead of sending manual responses
- All wrapped with asyncHandler

### Invitation Routes (`routes/invitations.js`)
- 11 endpoints updated with standardized error handling
- Uses ValidationError, ResourceError, ServerError factories

### Family Member Routes (`routes/family-members.js`)
- 11 endpoints updated for consistency

### Posting Routes (`routes/postings.js`)
- Verified: already using asyncHandler and standardized errors

### Moderation Routes (`server/routes/moderation-new.js`)
- Verified: already using asyncHandler and standardized errors

## Testing Error Handling

### Manual Testing

1. **Test invalid credentials**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com","password":"wrong"}'
   ```
   Expected: 401 with AUTH_INVALID_CREDENTIALS

2. **Test missing required field**:
   ```bash
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"user@example.com"}'
   ```
   Expected: 400 with VALIDATION_MISSING_FIELD

3. **Test not found**:
   ```bash
   curl http://localhost:3001/api/postings/nonexistent \
     -H "Authorization: Bearer <token>"
   ```
   Expected: 404 with RESOURCE_NOT_FOUND

### Automated Testing

E2E tests verify error handling:

```typescript
// Test error response format
test('returns standardized error on invalid credentials', async () => {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'user@example.com', password: 'wrong' })
  });

  const data = await response.json();
  expect(data.success).toBe(false);
  expect(data.error.code).toBe('AUTH_INVALID_CREDENTIALS');
  expect(data.error.message).toBeTruthy();
  expect(response.status).toBe(401);
});
```

## Development Environment Differences

### Production
- Error stack traces NOT included in responses
- Database error details NOT exposed (generic "Database operation failed")
- Minimal error logging

### Development
- Error stack traces included in 500 errors
- Database error details included for debugging
- Detailed console logging for all errors

```javascript
// Controlled by NODE_ENV environment variable
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

## Migration Guide

If you need to handle errors from the new system in existing code:

### Old Pattern (before standardization)
```javascript
app.post('/api/endpoint', (req, res) => {
  if (!req.body.email) {
    return res.status(400).json({ error: 'Email is required' });
  }
});
```

### New Pattern (after standardization)
```javascript
app.post('/api/endpoint', asyncHandler(async (req, res) => {
  if (!req.body.email) {
    throw ValidationError.missingField('email');
  }
  res.json(result);
}));
```

## Troubleshooting

### Error not caught by error handler
- **Cause**: Route not wrapped with asyncHandler
- **Fix**: Wrap route with `asyncHandler((req, res) => { ... })`

### Error handler not registered
- **Cause**: Error handlers registered before routes
- **Fix**: Move `app.use(errorHandler)` to end of server.js

### Frontend not showing error message
- **Cause**: Error not being caught in try-catch
- **Fix**: Ensure APIService methods are called with try-catch

### Different error format in different routes
- **Cause**: Some routes not updated yet
- **Status**: All main routes updated; legacy endpoints may vary

## Related Files

- Backend Error Class: `server/errors/ApiError.js`
- Error Middleware: `server/middleware/errorHandler.js`
- Frontend Error Utilities: `src/utils/errorHandling.ts`
- Frontend API Client: `src/lib/api.ts`
- Frontend Secure API Client: `src/lib/security/SecureAPIClient.ts`
- Frontend API Service: `src/services/APIService.ts`

## Contact & Support

For questions about error handling:
1. Review this guide for standard error codes and responses
2. Check the error code reference table above
3. Review the relevant route implementation
4. Check browser console for detailed error information (dev mode)

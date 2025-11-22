# API Standards - Technical Specification

## Goal
Establish consistent, secure API patterns for all backend endpoints with proper error handling and rate limiting.

## Features

### 1. Rate Limiting
**Status**: Complete

- Server-side rate limiting for API security
- Per-endpoint limits
- IP-based and user-based limiting
- Graceful degradation with retry headers

**Implementation**:
- express-rate-limit middleware
- 100 requests/minute for general endpoints
- 5 requests/minute for auth endpoints
- Custom limits for resource-intensive operations

### 2. Standardized Error Responses
**Status**: Pending (High Priority)

**Requirements**:
- Consistent error format across all endpoints
- Error codes for client handling
- Helpful messages for debugging

**Standard Error Format**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": {
      "field": "email",
      "reason": "Invalid format"
    }
  },
  "timestamp": "2025-11-22T10:00:00Z",
  "requestId": "uuid"
}
```

**Error Codes**:
- `VALIDATION_ERROR` - Invalid input
- `AUTH_ERROR` - Authentication failed
- `FORBIDDEN` - Not authorized
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Duplicate/conflict
- `INTERNAL_ERROR` - Server error

**Acceptance Criteria**:
- [ ] Error middleware created
- [ ] All routes use standard error format
- [ ] Error codes documented
- [ ] Client SDK updated

### 3. Request Validation
**Status**: Complete

- Joi/express-validator for input validation
- Schema-based validation
- Sanitization of inputs

### 4. Response Standards

**Success Response**:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

**Pagination**:
- Use `page` and `limit` query params
- Return `meta` with total count
- Default limit: 20, max: 100

## Implementation Checklist
- [ ] Create error middleware in `middleware/errorHandler.js`
- [ ] Define error codes in `config/errorCodes.js`
- [ ] Update all routes to use standardized errors
- [ ] Add request ID tracking
- [ ] Document all error codes in API docs

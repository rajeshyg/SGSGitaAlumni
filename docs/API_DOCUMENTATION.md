# API Documentation: SGSGitaAlumni Platform

**Status:** ✅ ALIGNED WITH CURRENT IMPLEMENTATION
**Date:** September 30, 2025
**Version:** 1.0.0

## Overview

This document provides comprehensive API documentation for the SGSGitaAlumni platform, reflecting the current implementation with clear separation between alumni members (source data), app users (authenticated users), and user profiles (extended information).

## Base URL
```
http://localhost:3001/api
```

## Authentication

All API endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00Z"
  },
  "expiresIn": 3600
}
```

#### Logout
```http
POST /api/auth/logout
```

#### Refresh Token
```http
POST /api/auth/refresh
```

#### Register (Invitation-Based)
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "graduationYear": 2020,
  "major": "Computer Science"
}
```

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED`: Valid authentication token required
- `AUTHORIZATION_FAILED`: User doesn't have permission for this action
- `VALIDATION_ERROR`: Request data validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests, try again later
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints:** 5 requests per minute per IP
- **Search endpoints:** 30 requests per minute per user
- **General endpoints:** 60 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1634567890
```

## Pagination

List endpoints support pagination with the following parameters:

- `page`: Page number (starting from 1)
- `pageSize`: Number of items per page (default: 20, max: 100)

Response includes pagination metadata:
```json
{
  "data": [...],
  "total": 150,
  "page": 1,
  "pageSize": 20,
  "totalPages": 8
}
```

## Filtering and Sorting

### Common Filter Parameters

- `search`: General search term
- `createdAfter`: ISO date string
- `createdBefore`: ISO date string
- `updatedAfter`: ISO date string
- `updatedBefore`: ISO date string

### Sorting

Most list endpoints support sorting:

- `sortBy`: Field to sort by
- `sortOrder`: `asc` or `desc` (default: `asc`)

## Related Documentation

- **[API Endpoints](API_ENDPOINTS.md)**: Detailed endpoint specifications and request/response examples
- **[API Examples](API_EXAMPLES.md)**: SDK usage examples, cURL commands, and best practices

## Support

For API support and questions:
- Check this documentation first
- Review existing API service implementation in `src/services/APIService.ts`
- Contact the development team for clarification on specific endpoints

---

*This API documentation reflects the current implementation of the SGSGitaAlumni platform with clear separation between alumni members, app users, and user profiles.*
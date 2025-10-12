# API Documentation: SGSGitaAlumni Platform

**Status:** ✅ ALIGNED WITH CURRENT IMPLEMENTATION
**Date:** October 12, 2025
**Version:** 1.1.0 - Added OTP Authentication Documentation

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

### OTP Authentication

The platform supports passwordless authentication using One-Time Passwords (OTP) sent via email.

#### OTP Login Flow

1. **Request OTP**: User enters email and requests OTP code
2. **Receive OTP**: System sends 6-digit code via email (expires in 5 minutes)
3. **Validate OTP**: User enters code for validation
4. **Authenticate**: System validates OTP and issues JWT token

**Key Features:**
- **Rate Limiting**: 3 OTPs per hour, 10 per day per email
- **Security**: Maximum 3 validation attempts per OTP
- **Expiry**: Default 5 minutes (configurable)
- **Single Use**: OTP cannot be reused after successful validation

**Endpoints:**
- `POST /api/otp/generate` - Generate and send OTP
- `POST /api/otp/validate` - Validate OTP code
- `GET /api/otp/active/:email` - Get active OTP (admin only)
- `GET /api/otp/rate-limit/:email` - Check rate limit status
- `GET /api/otp/remaining-attempts/:email` - Get remaining validation attempts
- `GET /api/otp/daily-count/:email` - Get daily OTP count
- `DELETE /api/otp/cleanup-expired` - Cleanup expired OTPs (admin only)

For detailed OTP endpoint documentation, see [API Endpoints - OTP Authentication](API_ENDPOINTS.md#otp-authentication-endpoints).

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
- `OTP_EXPIRED`: OTP has expired, request a new one
- `OTP_INVALID`: Invalid OTP code provided
- `OTP_ALREADY_USED`: OTP has already been used
- `MAX_ATTEMPTS_EXCEEDED`: Maximum OTP validation attempts exceeded
- `INTERNAL_SERVER_ERROR`: Unexpected server error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Authentication endpoints:** 5 requests per minute per IP
- **OTP endpoints:** 3 requests per hour, 10 per day per email
- **Search endpoints:** 30 requests per minute per user
- **General endpoints:** 60 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1634567890
```

**OTP-Specific Rate Limits:**
- Hourly limit: 3 OTP generation requests per email
- Daily limit: 10 OTP generation requests per email
- Validation attempts: 3 attempts per OTP code
- Response: HTTP 429 (Too Many Requests) when exceeded

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
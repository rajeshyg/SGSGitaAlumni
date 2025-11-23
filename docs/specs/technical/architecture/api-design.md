---
version: "1.0"
status: implemented
last_updated: 2025-11-23
applies_to: all-routes
enforcement: required
---

# API Design Architecture

## Overview

This document establishes the API architecture patterns for the SGS Gita Alumni platform, including RESTful design principles, request/response standards, rate limiting, and validation.

## RESTful API Design

### URL Structure

```
/api/{resource}                 # Collection
/api/{resource}/{id}            # Single resource
/api/{resource}/{id}/{relation} # Related resources
```

### HTTP Methods

| Method | Purpose | Example |
|--------|---------|---------|
| GET | Retrieve resources | `GET /api/alumni-members` |
| POST | Create resource | `POST /api/postings` |
| PUT | Update resource | `PUT /api/users/123` |
| DELETE | Remove resource | `DELETE /api/invitations/456` |

### Implementation Files

- `/routes/auth.js` - Authentication endpoints
- `/routes/users.js` - User management
- `/routes/alumni-members.js` - Alumni member data
- `/routes/postings.js` - Community postings
- `/routes/invitations.js` - Invitation system
- `/routes/family-members.js` - Family member management

## Response Standards

### Success Response

**Status**: Implemented

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Response

**Status**: Implemented

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": {
      "field": "email",
      "reason": "Invalid format"
    },
    "timestamp": "2025-11-22T10:00:00Z",
    "path": "/api/auth/login"
  }
}
```

See [Error Handling](./error-handling.md) for complete error code reference.

## Pagination

**Status**: Implemented

### Request Parameters

| Parameter | Type | Default | Max |
|-----------|------|---------|-----|
| `page` | number | 1 | - |
| `limit` | number | 20 | 100 |
| `sort` | string | varies | - |
| `order` | string | 'asc' | - |

### Response Format

```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Rate Limiting

**Status**: Implemented

**Implementation**: `/middleware/rateLimit.js`

### Limits by Endpoint

| Endpoint Type | Requests | Window |
|--------------|----------|--------|
| General API | 100 | 1 minute |
| Authentication | 5 | 1 minute |
| Resource-intensive | Custom | Custom |

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1635724800
Retry-After: 60
```

### Implementation

```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
      details: { retryAfter: 60 }
    }
  }
})

app.use('/api', limiter)
```

## Request Validation

**Status**: Implemented

### Validation Middleware

```javascript
// Using Zod for validation
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50)
})

const validateRequest = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body)
    next()
  } catch (error) {
    throw ValidationError.fromZod(error)
  }
}

app.post('/api/users', validateRequest(createUserSchema), createUser)
```

### Input Sanitization

- HTML encoding for user input
- SQL parameterization (prepared statements)
- Path traversal prevention
- File type validation

## Authentication

**Status**: Implemented

**Implementation**: `/middleware/auth.js`

### JWT Authentication

```javascript
// Authorization header format
Authorization: Bearer <jwt-token>

// Token payload
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user",
  "iat": 1635724800,
  "exp": 1635728400
}
```

### Protected Routes

```javascript
import { authenticateToken } from '../middleware/auth.js'

// Apply to routes requiring authentication
app.get('/api/profile', authenticateToken, getProfile)
app.put('/api/users/:id', authenticateToken, updateUser)
```

## API Versioning

**Current Version**: v1 (implicit)

For future API versioning:
```
/api/v1/users
/api/v2/users
```

## CORS Configuration

**Status**: Implemented

```javascript
const cors = require('cors')

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

## Compression

**Status**: Implemented

```javascript
const compression = require('compression')

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))
```

## Request Logging

See [Logging](./logging.md) for detailed logging patterns.

```javascript
// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  })
  next()
})
```

## API Endpoints Reference

### Authentication (`/api/auth`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/login` | POST | User login |
| `/logout` | POST | User logout |
| `/refresh` | POST | Refresh token |
| `/register-from-invitation` | POST | Register with invitation |

### Users (`/api/users`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List users |
| `/:id` | GET | Get user |
| `/:id` | PUT | Update user |
| `/profile` | GET | Get current user profile |

### Alumni Members (`/api/alumni-members`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Search alumni |
| `/:id` | GET | Get alumni member |
| `/:id` | PUT | Update alumni |
| `/upload` | POST | Bulk upload |

### Postings (`/api/postings`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | List postings |
| `/` | POST | Create posting |
| `/:id` | GET | Get posting |
| `/:id` | PUT | Update posting |
| `/:id` | DELETE | Delete posting |

## Security Considerations

### Request Security

- **Input Validation**: All inputs validated before processing
- **Rate Limiting**: Prevent abuse and DDoS
- **Authentication**: JWT with secure storage
- **Authorization**: Role-based access control

### Response Security

- **No Sensitive Data**: Never expose passwords, tokens in responses
- **Error Masking**: Generic errors in production
- **Headers**: Security headers (HSTS, X-Frame-Options, etc.)

## Implementation Checklist

- [x] Rate limiting middleware
- [x] Request validation (Zod)
- [x] Standardized error responses
- [x] JWT authentication
- [x] CORS configuration
- [x] Response compression
- [ ] Request ID tracking
- [ ] API documentation (OpenAPI/Swagger)

## Related Specifications

- [Error Handling](./error-handling.md) - Error codes and handling
- [Data Flow](./data-flow.md) - Data flow patterns
- [Logging](./logging.md) - Request/response logging

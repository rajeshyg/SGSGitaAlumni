---
title: API Contracts
version: 1.0
status: active
last_updated: 2025-11-23
category: integration
---

# API Contracts

## Request/Response Formats

### Standard Response Format

**Success Response**
```json
{
  "success": true,
  "data": { ... }
}
```

**Paginated Response**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**Error Response**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ]
  }
}
```

### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error |
| 401 | Authentication required |
| 403 | Permission denied |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |

## Request Validation

All requests are validated using Zod schemas defined in `/src/schemas/validation/`.

### Example Schema

```typescript
// LoginSchema
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

// RegisterFromInvitationSchema
const RegisterFromInvitationSchema = z.object({
  token: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
  first_name: z.string().min(1),
  last_name: z.string().min(1)
});
```

### Validation Middleware

```javascript
import { validateRequest } from './server/middleware/validation.js';

app.post('/api/auth/login',
  validateRequest({ body: LoginSchema }),
  login
);
```

## API Versioning

Currently using implicit versioning with `/api/` prefix. Future consideration for explicit versioning:

```
/api/v1/users
/api/v2/users
```

## Authentication

### JWT Token
- Passed in `Authorization` header: `Bearer <token>`
- Contains: `userId`, `email`, `role`, `exp`, `iat`

### Rate Limiting Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000000
```

## API Documentation Standards

### Endpoint Documentation Format

```markdown
## POST /api/auth/login

Authenticate user and return JWT token.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email |
| password | string | Yes | User password |

### Response
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "role": "member"
    }
  }
}
```
```

## Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh token
- `POST /api/auth/register-from-invitation` - Register via invitation

### Users
- `GET /api/users/profile` - Current user profile
- `PUT /api/users/:id` - Update user
- `GET /api/users/search` - Search users

### Invitations
- `POST /api/invitations` - Create invitation
- `GET /api/invitations/validate/:token` - Validate token
- `PUT /api/invitations/:id/revoke` - Revoke invitation

### Chat
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/conversations/:id/messages` - Get messages
- `POST /api/conversations/:id/messages` - Send message

## OpenAPI Specification

Consider generating OpenAPI/Swagger documentation from route definitions:

```yaml
openapi: 3.0.0
info:
  title: SGS Gita Alumni API
  version: 1.0.0
paths:
  /api/auth/login:
    post:
      summary: User login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
```

## Related Files

- Validation schemas: `/src/schemas/validation/index.js`
- Error handler: `/server/middleware/errorHandler.js`
- Server routes: `/server.js`

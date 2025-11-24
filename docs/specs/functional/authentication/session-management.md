---
version: "1.0"
status: implemented
last_updated: 2025-11-23
---

# Session Management

## Purpose
Maintain secure user sessions with automatic token refresh and logout functionality.

## User Flow
1. User logs in successfully
2. System issues JWT access token (15 min) and refresh token (7 days)
3. Frontend stores tokens securely
4. On API requests, access token included in Authorization header
5. If access token expires, refresh token used to obtain new access token
6. User can explicitly logout to invalidate tokens

## Acceptance Criteria
- ✅ JWT-based authentication
- ✅ Short-lived access tokens (15 minutes)
- ✅ Long-lived refresh tokens (7 days)
- ✅ Automatic token refresh before expiration
- ✅ Logout endpoint to invalidate refresh tokens
- ✅ Secure token storage in httpOnly cookies or localStorage

## Implementation
- **Route**: `POST /api/auth/refresh`, `POST /api/auth/logout`
- **Middleware**: `middleware/auth.js`
- **File**: `routes/auth.js`
- **Frontend**: `src/contexts/AuthContext.tsx`
- **Test**: `tests/e2e/auth.spec.ts`

## Related
- [Login](./login.md)
- [Technical Spec: Authentication](../../technical/security/authentication.md)

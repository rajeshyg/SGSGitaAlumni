---
title: Authentication Specification
version: 1.0
status: implemented
last_updated: 2025-11-23
applies_to: all
enforcement: required
---

# Authentication

## Overview

Authentication system implementing JWT tokens with OTP verification for secure user access.

## Implementation Status: Complete

## JWT Implementation

### Token Configuration
- **Access Token**: Short-lived JWT for API authentication
- **Refresh Token**: Long-lived token for session continuity
- **Algorithm**: HS256 (HMAC with SHA-256)
- **Secret Rotation**: Capability implemented

### Token Flow
1. User authenticates with credentials
2. Server validates and issues JWT + refresh token
3. Client includes JWT in Authorization header
4. Server validates JWT on each request
5. Refresh token used to obtain new access token

### Code Reference
```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

## OTP Verification

### Implementation
- **Delivery Method**: Email-based OTP
- **OTP Length**: 6 digits
- **Expiration**: 10 minutes
- **Max Attempts**: 3 before lockout

### Service Reference
- `services/OTPService.js` - OTP generation and verification

## Session Management

### Requirements
- **Session Timeout**: 30 minutes of inactivity
- **Secure Cookies**: HttpOnly, Secure, SameSite attributes
- **Session Rotation**: New session ID after authentication
- **Concurrent Sessions**: Maximum 3 active sessions per user

### Cookie Configuration
```javascript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 60 * 1000 // 30 minutes
}
```

## Password Requirements

- **Minimum Length**: 12 characters
- **Complexity**: Mix of uppercase, lowercase, numbers, symbols
- **Hashing**: bcrypt with salt rounds
- **No Forced Expiration**: Following NIST guidelines

### Password Hashing
```javascript
const bcrypt = require('bcrypt');
const saltRounds = 10;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

## Multi-Factor Authentication

### Available Factors
- **Primary Factor**: Username/password or email
- **Secondary Factor**: Email OTP
- **Future**: TOTP support (Google Authenticator, Authy)

## Code References

| Component | File Path |
|-----------|-----------|
| Auth Middleware | `middleware/auth.js` |
| Auth Routes | `routes/auth.js` |
| OTP Routes | `routes/otp.js` |
| OTP Service | `services/OTPService.js` |

## E2E Tests

- `tests/e2e/auth.spec.ts` - Authentication flow tests

## Security Events

All authentication events are logged:
- Login attempts (success/failure)
- Password changes
- Session creation/termination
- OTP verification attempts

## Related Specifications

- [Authorization](./authorization.md) - Role-based access after authentication
- [Security Overview](./README.md) - Overall security architecture

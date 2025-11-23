---
version: "1.0"
status: implemented
last_updated: 2025-11-23
applies_to: backend
---

# Logging Architecture

## Overview

This document describes the logging implementation for the SGS Gita Alumni platform, including log levels, formats, sensitive data filtering, and usage patterns across the codebase.

## Logger Implementation

**Primary Implementation**: `/utils/logger.js`

The platform uses a custom environment-aware logger with sensitive data sanitization.

```javascript
// utils/logger.js
export const logger = {
  info: (message, ...args) => { /* ... */ },
  debug: (message, ...args) => { /* ... */ },
  warn: (message, ...args) => { /* ... */ },
  error: (message, ...args) => { /* ... */ },
  security: (message, context = {}) => { /* ... */ },
  audit: (action, userId, details = {}) => { /* ... */ }
}
```

## Log Levels

### Level Hierarchy

| Level | Description | Environment | Use Case |
|-------|-------------|-------------|----------|
| `debug` | Detailed debugging info | Development only | Variable values, flow tracing |
| `info` | General information | Development only | Startup, request info |
| `warn` | Warning conditions | All environments | Degraded service, deprecations |
| `error` | Error conditions | All environments | Failures, exceptions |
| `security` | Security events | All environments | Auth failures, access denials |
| `audit` | Audit trail | All environments | User actions, data changes |

### Environment Behavior

**Development** (`NODE_ENV=development`):
- All log levels enabled
- Full details included with sanitization
- Pretty printed output

**Production** (`NODE_ENV=production`):
- Only `warn`, `error`, `security`, `audit` logged
- Minimal details for security
- Arguments stripped from error logs

## Log Format

### Standard Format

```
[LEVEL] message { sanitized_data }
```

### Security Format

```
[SECURITY] 2025-11-23T10:30:00.000Z - message { context }
```

### Audit Format

```
[AUDIT] 2025-11-23T10:30:00.000Z - User user-123 - action { details }
```

## Sensitive Data Filtering

### Sanitization Function

```javascript
function sanitize(data) {
  if (!data) return data;

  if (typeof data === 'string') {
    // Truncate long strings (likely tokens)
    if (data.length > 50) {
      return `${data.substring(0, 8)}...[REDACTED]`;
    }
    return data;
  }

  if (typeof data === 'object') {
    const sanitized = { ...data };

    // Redact sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'authorization',
      'password_hash'
    ];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  return data;
}
```

### Redacted Fields

- `password`
- `token`
- `secret`
- `authorization`
- `password_hash`

## Usage Patterns

### Authentication Middleware

**File**: `/middleware/auth.js`

```javascript
import { logger } from '../utils/logger.js';

// Token verification
logger.debug('Auth middleware request', { path: req.path, hasToken: !!token });

// Auth failure
logger.debug('Auth failed: no token provided');
logger.debug('JWT verification failed', { error: err.message });

// Auth success
logger.debug('Authentication successful');
```

### Age Access Control

**File**: `/middleware/ageAccessControl.js`

```javascript
// Platform access denied
logger.security('Platform access denied - no access permission', {
  userId: req.user.id,
  reason: 'no_platform_access'
});

// Parental consent required
logger.security('Parent consent required but not given', {
  userId,
  memberAge
});
```

### Monitoring Middleware

**File**: `/middleware/monitoring.js`

```javascript
// Request logging
logger.debug(`Request: ${req.method} ${req.path}`, {
  ip: clientIP,
  userAgent
});

// Slow request warning
logger.warn(`Slow request: ${req.method} ${req.path}`, {
  duration,
  threshold
});

// Response logging
logger.debug(`Response: ${statusCode} (${duration}ms)`, {
  method: req.method,
  path: req.path
});
```

### Rate Limiting

**File**: `/middleware/rateLimit.js`

```javascript
// Rate limit checks
console.log(`[RATE_LIMIT] ${policyName}: Starting rate limit check for ${req.path}`);
console.log(`[RATE_LIMIT] ${policyName}: Redis check completed, result: ${result.allowed}`);
```

### Server Startup

**File**: `/server.js`

```javascript
// Startup messages
console.log(`Server running on http://0.0.0.0:${PORT}`);
console.log(`MySQL Database: ${process.env.DB_NAME}`);
console.log('Database connection test passed');

// Error handling
console.error('Database connection test failed:', dbError.message);
console.error('Uncaught Exception:', error);
```

### Services

**File**: `/services/FamilyMemberService.js`

```javascript
// Operation logging
console.log('[FamilyMemberService] switchProfile called:', { userId, memberId });
console.log('[FamilyMemberService] Profile switch complete!');

// Error logging
console.error('[FamilyMemberService] switchProfile ERROR:', error);
console.error('[FamilyMemberService] Error stack:', error.stack);
```

## Logging Best Practices

### Do

- Use structured logging with context objects
- Include request identifiers for tracing
- Log at appropriate levels
- Sanitize all user input before logging
- Include timestamps for audit events
- Use prefixes for service identification

### Don't

- Log passwords, tokens, or secrets
- Log full request bodies without sanitization
- Use `console.log` in production code paths
- Log sensitive user data (SSN, credit cards, etc.)
- Log stack traces in production

## Migration from console.log

### Current State

The codebase uses a mix of:
- Custom `logger` utility (preferred)
- Direct `console.log/warn/error` calls (legacy)

### Migration Pattern

**Before** (Legacy):
```javascript
console.log('User logged in', user);
console.error('Database error:', error);
```

**After** (Preferred):
```javascript
logger.info('User logged in', { userId: user.id });
logger.error('Database error', { message: error.message });
```

## Future Improvements

### Pending Enhancements

- [ ] Replace all console.* with structured logger
- [ ] Add request ID tracking
- [ ] Implement log rotation
- [ ] Add CloudWatch integration
- [ ] JSON format for production logs
- [ ] Log aggregation setup

### Planned Logger Features

```javascript
// Proposed enhancements
logger.withContext({ requestId, userId }).info('Operation complete');
logger.child({ service: 'auth' }).debug('Token validated');
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Minimum log level | Based on NODE_ENV |

### Recommended Settings

**Development**:
```bash
NODE_ENV=development
# All logs enabled, full details
```

**Production**:
```bash
NODE_ENV=production
# warn/error/security/audit only
```

## Monitoring Integration

### Current

- Console output to stdout/stderr
- Manual log review

### Planned

- CloudWatch Logs integration
- Sentry for error tracking
- Log-based alerting
- Performance metrics from logs

## Related Specifications

- [Error Handling](./error-handling.md) - Error logging patterns
- [API Design](./api-design.md) - Request/response logging
- [Performance](./performance.md) - Performance monitoring

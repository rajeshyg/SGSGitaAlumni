---
version: "1.1"
status: implemented
last_updated: 2025-12-12
applies_to: backend, frontend
---

# Logging Architecture

## Overview

This document describes the logging implementation for the SGS Gita Alumni platform, focusing on the "Unified Stream" architecture that centralizes both backend and frontend errors into a single, persistent log file for efficient debugging and AI analysis.

## Core Architecture: Unified Stream

The platform implements a **Unified Logging Stream** that routes all significant errors (Server and Client) to a centralized file on the backend.

### Components

1.  **File Logger (`utils/file-logger.js`)**:
    *   Core utility that appends logs to `logs/errors.log`.
    *   Handles session separation (markers on server start).
    *   Thread-safe append operations.

2.  **Server Logger (`utils/logger.js`)**:
    *   Wraps the File Logger.
    *   Automatically persists `error` and `warn` level logs to disk.

3.  **Client Bridge (`routes/dev.js`)**:
    *   Development-only endpoint (`POST /api/dev/client-log`).
    *   Receives errors from the frontend.
    *   Tags them with `[CLIENT]` and writes them to the unified log file.
    *   Also echoes them to the Server Console for immediate visual feedback.

4.  **Frontend Monitor (`src/lib/monitoring.ts`)**:
    *   Intercepts `logger.error`, `logger.warn`, `window.onerror`, and `unhandledrejection`.
    *   Forwards these events to the Client Bridge in development mode.

## Logger Implementation

**Primary Implementation**: `/utils/logger.js`

The platform uses a custom environment-aware logger that integrates with the file system.

```javascript
// utils/logger.js
import { logToFile } from './file-logger.js';

export const logger = {
  // ... info/debug (console only) ...

  warn: (message, ...args) => {
    logToFile('WARN', 'SERVER', message); // Persist
    // ... console output ...
  },

  error: (message, ...args) => {
    const stack = args.find(a => a instanceof Error)?.stack;
    logToFile('ERROR', 'SERVER', message, stack); // Persist
    // ... console output ...
  }
}
```

## Log File: `logs/errors.log`

This file serves as the "Source of Truth" for debugging sessions.

*   **Location**: `logs/errors.log` (gitignored)
*   **Format**:
    ```text
    [2025-12-12T10:00:00.000Z] [ERROR] [SERVER] Database connection failed
    Stack: Error: Connection refused...
    --------------------------------------------------------------------------------
    [2025-12-12T10:00:05.000Z] [ERROR] [CLIENT] Failed to load user profile
    Stack: Error: Network Error...
    --------------------------------------------------------------------------------
    ```
*   **Session Markers**: A distinct separator is written on every server start to identify new debugging sessions.

### Management Commands

*   `npm run clear-logs`: Deletes `logs/errors.log` to start a fresh debugging session.

## Log Levels

### Level Hierarchy

| Level | Description | Environment | Persistence | Use Case |
|-------|-------------|-------------|-------------|----------|
| `debug` | Detailed debugging info | Development | Console | Variable values, flow tracing |
| `info` | General information | Development | Console | Startup, request info |
| `warn` | Warning conditions | All | **File + Console** | Degraded service, deprecations |
| `error` | Error conditions | All | **File + Console** | Failures, exceptions |
| `security`| Security events | All | Console | Auth failures, access denials |
| `audit` | Audit trail | All | Console | User actions, data changes |

*(Note: Security and Audit logs are currently console-only but slated for database/file persistence)*

## Log Format

### Standard Format

```
[LEVEL] message { sanitized_data }
```

### Unified File Format

```
[TIMESTAMP] [LEVEL] [SOURCE] MESSAGE
Stack: (if available)
-----------------------
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

## Usage Patterns

### Standard Logging (Preferred)

```javascript
import { logger } from '../utils/logger.js'; // Backend
// OR
import { logger } from '@/lib/monitoring'; // Frontend

// These will automatically be captured to logs/errors.log
logger.error('Failed to process payment', error);
logger.warn('Rate limit approaching', { count: 50 });
```

### Legacy Logging (To Be Deprecated)

Direct calls to `console` bypass the file logger and are strictly for temporary local debugging.

```javascript
// AVOID IN PRODUCTION CODE
console.log('User logged in', user);
console.error('Database error:', error);
```

## Migration Strategy

The goal is to move all critical application logging from `console.*` to `logger.*`.

1.  **Backend Routes**: Replace `console.error` with `logger.error`.
2.  **Frontend Services**: Replace `console.error` with `logger.error` (from monitoring).
3.  **Startup Scripts**: Ensure startup errors use `logger`.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Minimum log level | Based on NODE_ENV |

## Monitoring Integration

### Current

*   **Unified File**: `logs/errors.log` (Primary for AI/Dev debugging)
*   **Console**: Combined output of Server + Client (via bridge)
*   **Manual**: `npm run clear-logs` to reset.

### Planned

*   CloudWatch Logs integration (Production)
*   Sentry for error tracking (Production)
*   Log rotation for `logs/errors.log`

## Related Specifications

- [Error Handling](./error-handling.md) - Error logging patterns
- [API Design](./api-design.md) - Request/response logging
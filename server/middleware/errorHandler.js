// ============================================================================
// GLOBAL ERROR HANDLER MIDDLEWARE
// ============================================================================
// This middleware catches all errors thrown in the application and converts
// them to standardized error responses in the format:
// { success: false, error: { code, message, details, timestamp, path } }
// ============================================================================

import { ApiError, ServerError } from '../errors/ApiError.js';

/**
 * Global error handler middleware
 * Must be registered AFTER all routes in server.js
 *
 * @param {Error} err - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging (always log in development)
  if (process.env.NODE_ENV !== 'production') {
    console.error('='.repeat(80));
    console.error('API Error Details:');
    console.error('Path:', req.method, req.path);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('='.repeat(80));
  } else {
    // In production, log concisely
    console.error('API Error:', {
      path: req.path,
      method: req.method,
      error: err.message,
      code: err.code || 'UNKNOWN'
    });
  }

  // Handle ApiError instances (our custom errors)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && { details: err.details }),
        timestamp: new Date().toISOString(),
        path: req.path,
        ...(req.headers['x-request-id'] && { requestId: req.headers['x-request-id'] })
      }
    });
  }

  // Handle Zod validation errors (from validation middleware)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code
        })),
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle MySQL/Database errors
  if (err.code && (err.code.startsWith('ER_') || err.code === 'ECONNREFUSED')) {
    // Don't expose internal database details in production
    const isDev = process.env.NODE_ENV !== 'production';
    return res.status(500).json({
      success: false,
      error: {
        code: 'SERVER_DATABASE_ERROR',
        message: 'Database operation failed',
        ...(isDev && { details: { sqlMessage: err.sqlMessage, sqlCode: err.code } }),
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle MySQL duplicate entry errors (unique constraint violations)
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'VALIDATION_DUPLICATE',
        message: 'A record with this value already exists',
        details: process.env.NODE_ENV !== 'production' ? { sqlMessage: err.sqlMessage } : undefined,
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle JWT errors (from jsonwebtoken library)
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_INVALID',
        message: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Authentication token has expired',
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle Multer errors (file upload errors)
  if (err.name === 'MulterError') {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'File size exceeds maximum allowed size'
      : 'File upload failed';

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: { multerCode: err.code },
        timestamp: new Date().toISOString(),
        path: req.path
      }
    });
  }

  // Handle all other unhandled errors
  // In production, don't expose internal error details
  const isDev = process.env.NODE_ENV !== 'production';
  return res.status(500).json({
    success: false,
    error: {
      code: 'SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      ...(isDev && err.stack && { stack: err.stack }),
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
}

/**
 * 404 Not Found handler
 * Use this for routes that don't exist
 */
export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: {
      code: 'RESOURCE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
}

/**
 * Async route wrapper to automatically catch errors
 * Use this to wrap async route handlers:
 *
 * app.get('/api/users', asyncHandler(async (req, res) => {
 *   const users = await getUsers();
 *   res.json({ success: true, data: users });
 * }));
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler
};

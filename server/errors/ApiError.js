// ============================================================================
// API ERROR CLASS & FACTORY FUNCTIONS
// ============================================================================
// This module provides standardized error handling for all API endpoints.
// All errors follow the format: { success: false, error: { code, message, details } }
// ============================================================================

/**
 * HTTP status code mapping for error codes
 */
const ERROR_CODE_TO_HTTP_STATUS = {
  // Authentication - 401
  AUTH_INVALID_CREDENTIALS: 401,
  AUTH_TOKEN_INVALID: 401,
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_SESSION_EXPIRED: 401,

  // Authorization - 403
  AUTH_UNAUTHORIZED: 403,
  PERMISSION_DENIED: 403,
  PERMISSION_ROLE_REQUIRED: 403,
  PERMISSION_OWNER_ONLY: 403,

  // Not Found - 404
  RESOURCE_NOT_FOUND: 404,

  // Conflict - 409
  RESOURCE_CONFLICT: 409,
  VALIDATION_DUPLICATE: 409,

  // Gone - 410
  RESOURCE_GONE: 410,

  // Locked - 423
  RESOURCE_LOCKED: 423,
  AUTH_ACCOUNT_LOCKED: 423,

  // Too Many Requests - 429
  RATE_LIMIT_EXCEEDED: 429,
  RATE_LIMIT_BLOCKED: 429,

  // Validation - 400
  VALIDATION_ERROR: 400,
  VALIDATION_MISSING_FIELD: 400,
  VALIDATION_INVALID_FORMAT: 400,
  VALIDATION_OUT_OF_RANGE: 400,

  // Server Errors - 500+
  SERVER_ERROR: 500,
  SERVER_DATABASE_ERROR: 500,
  SERVER_SERVICE_UNAVAILABLE: 503,
  SERVER_TIMEOUT: 504
};

/**
 * Custom API Error class
 * Extends Error with structured error response format
 */
export class ApiError extends Error {
  constructor(code, message, statusCode = null, details = null) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode || ERROR_CODE_TO_HTTP_STATUS[code] || 500;
    this.details = details;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Convert error to standardized JSON response format
   * @returns {Object} Standardized error response
   */
  toJSON() {
    const response = {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        timestamp: new Date().toISOString()
      }
    };

    // Only include details if present
    if (this.details) {
      response.error.details = this.details;
    }

    return response;
  }
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Authentication error factories
 */
export const AuthError = {
  invalidCredentials: () =>
    new ApiError('AUTH_INVALID_CREDENTIALS', 'Invalid email or password', 401),

  sessionExpired: () =>
    new ApiError('AUTH_SESSION_EXPIRED', 'Your session has expired. Please log in again.', 401),

  unauthorized: (resource = 'this resource') =>
    new ApiError('AUTH_UNAUTHORIZED', `You are not authorized to access ${resource}`, 403),

  tokenInvalid: () =>
    new ApiError('AUTH_TOKEN_INVALID', 'Invalid authentication token', 401),

  tokenExpired: () =>
    new ApiError('AUTH_TOKEN_EXPIRED', 'Authentication token has expired', 401),

  accountLocked: () =>
    new ApiError('AUTH_ACCOUNT_LOCKED', 'Account has been locked due to too many failed attempts', 423)
};

/**
 * Validation error factories
 */
export const ValidationError = {
  invalidData: (details = null) =>
    new ApiError('VALIDATION_ERROR', 'Invalid request data', 400, details),

  missingField: (field) =>
    new ApiError('VALIDATION_MISSING_FIELD', `Required field '${field}' is missing`, 400, { field }),

  invalidFormat: (field, expectedFormat = null) => {
    const message = expectedFormat
      ? `Field '${field}' has invalid format. Expected: ${expectedFormat}`
      : `Field '${field}' has invalid format`;
    return new ApiError('VALIDATION_INVALID_FORMAT', message, 400, { field, expectedFormat });
  },

  outOfRange: (field, min = null, max = null) => {
    let message = `Value for '${field}' is out of acceptable range`;
    if (min !== null && max !== null) {
      message = `Value for '${field}' must be between ${min} and ${max}`;
    } else if (min !== null) {
      message = `Value for '${field}' must be at least ${min}`;
    } else if (max !== null) {
      message = `Value for '${field}' must be at most ${max}`;
    }
    return new ApiError('VALIDATION_OUT_OF_RANGE', message, 400, { field, min, max });
  },

  duplicate: (field, value = null) => {
    const message = value
      ? `${field} '${value}' already exists`
      : `${field} already exists`;
    return new ApiError('VALIDATION_DUPLICATE', message, 409, { field, value });
  }
};

/**
 * Resource error factories
 */
export const ResourceError = {
  notFound: (resource = 'Resource') =>
    new ApiError('RESOURCE_NOT_FOUND', `${resource} not found`, 404, { resource }),

  conflict: (resource, reason = null) => {
    const message = reason
      ? `${resource} already exists: ${reason}`
      : `${resource} already exists`;
    return new ApiError('RESOURCE_CONFLICT', message, 409, { resource, reason });
  },

  gone: (resource) =>
    new ApiError('RESOURCE_GONE', `${resource} is no longer available`, 410, { resource }),

  locked: (resource, reason = null) => {
    const message = reason
      ? `${resource} is currently locked: ${reason}`
      : `${resource} is currently locked`;
    return new ApiError('RESOURCE_LOCKED', message, 423, { resource, reason });
  }
};

/**
 * Permission error factories
 */
export const PermissionError = {
  denied: (action = 'perform this action') =>
    new ApiError('PERMISSION_DENIED', `You do not have permission to ${action}`, 403, { action }),

  roleRequired: (requiredRole) =>
    new ApiError('PERMISSION_ROLE_REQUIRED', `This action requires ${requiredRole} role`, 403, { requiredRole }),

  ownerOnly: (resource = 'this resource') =>
    new ApiError('PERMISSION_OWNER_ONLY', `Only the owner of ${resource} can perform this action`, 403, { resource })
};

/**
 * Rate limiting error factories
 */
export const RateLimitError = {
  exceeded: (retryAfter = null) => {
    const details = retryAfter ? { retryAfter } : null;
    return new ApiError('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429, details);
  },

  blocked: (reason = 'excessive requests') =>
    new ApiError('RATE_LIMIT_BLOCKED', `You have been temporarily blocked due to ${reason}`, 429, { reason })
};

/**
 * Server error factories
 */
export const ServerError = {
  internal: (message = 'An unexpected error occurred') =>
    new ApiError('SERVER_ERROR', message, 500),

  database: (operation = null) => {
    const message = operation
      ? `Database operation failed: ${operation}`
      : 'Database operation failed';
    return new ApiError('SERVER_DATABASE_ERROR', message, 500, { operation });
  },

  unavailable: (service = 'Service') =>
    new ApiError('SERVER_SERVICE_UNAVAILABLE', `${service} is temporarily unavailable`, 503, { service }),

  timeout: (operation = 'Request') =>
    new ApiError('SERVER_TIMEOUT', `${operation} timed out`, 504, { operation })
};

// ============================================================================
// EXPORT ALL ERROR FACTORIES
// ============================================================================

export default {
  ApiError,
  AuthError,
  ValidationError,
  ResourceError,
  PermissionError,
  RateLimitError,
  ServerError
};

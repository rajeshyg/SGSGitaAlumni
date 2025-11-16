// ============================================================================
// SERVER-SIDE LOGGER UTILITY
// ============================================================================
// Environment-aware logging with sensitive data sanitization

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Sanitize sensitive data from logs
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
function sanitize(data) {
  if (!data) return data;

  if (typeof data === 'string') {
    // Don't log full tokens or passwords
    if (data.length > 50) {
      return `${data.substring(0, 8)}...[REDACTED]`;
    }
    return data;
  }

  if (typeof data === 'object') {
    const sanitized = { ...data };

    // Redact sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'password_hash'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Server logger with environment-aware logging
 */
export const logger = {
  /**
   * Log informational messages (only in development)
   */
  info: (message, ...args) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitize);
      console.log(`[INFO] ${message}`, ...sanitizedArgs);
    }
  },

  /**
   * Log debug messages (only in development)
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      const sanitizedArgs = args.map(sanitize);
      console.log(`[DEBUG] ${message}`, ...sanitizedArgs);
    }
  },

  /**
   * Log warnings (always logged, sanitized in production)
   */
  warn: (message, ...args) => {
    if (isProduction) {
      console.warn(`[WARN] ${message}`);
    } else {
      const sanitizedArgs = args.map(sanitize);
      console.warn(`[WARN] ${message}`, ...sanitizedArgs);
    }
  },

  /**
   * Log errors (always logged, sanitized in production)
   */
  error: (message, ...args) => {
    if (isProduction) {
      // In production, only log the message, not the args (may contain sensitive data)
      console.error(`[ERROR] ${message}`);
    } else {
      const sanitizedArgs = args.map(sanitize);
      console.error(`[ERROR] ${message}`, ...sanitizedArgs);
    }
  },

  /**
   * Log security events (always logged with timestamp)
   */
  security: (message, context = {}) => {
    const timestamp = new Date().toISOString();
    const sanitizedContext = sanitize(context);
    console.log(`[SECURITY] ${timestamp} - ${message}`, sanitizedContext);
  },

  /**
   * Log audit events (always logged)
   */
  audit: (action, userId, details = {}) => {
    const timestamp = new Date().toISOString();
    const sanitizedDetails = sanitize(details);
    console.log(`[AUDIT] ${timestamp} - User ${userId} - ${action}`, sanitizedDetails);
  }
};

export default logger;

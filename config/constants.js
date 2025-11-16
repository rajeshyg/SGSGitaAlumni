// ============================================================================
// APPLICATION CONFIGURATION CONSTANTS
// ============================================================================
// Centralized configuration to avoid magic numbers and hard-coded values

// ============================================================================
// AUTHENTICATION CONFIGURATION
// ============================================================================

export const AUTH_CONFIG = {
  // JWT Token Configuration
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

  // Development mode uses longer expiry for convenience
  JWT_EXPIRES_IN_DEV: '24h',
  REFRESH_TOKEN_EXPIRES_IN_DEV: '30d',

  // Timeout Configuration
  LOGIN_TIMEOUT_MS: 30000,        // 30 seconds
  DATABASE_TIMEOUT_MS: 10000,     // 10 seconds
  TOKEN_REFRESH_TIMEOUT_MS: 5000, // 5 seconds

  // Password Requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[a-zA-Z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,128}$/,

  // Session Configuration
  SESSION_COOKIE_MAX_AGE: 24 * 60 * 60 * 1000, // 24 hours
};

// ============================================================================
// OTP CONFIGURATION
// ============================================================================

export const OTP_CONFIG = {
  // OTP Expiry
  OTP_EXPIRY_MS: 300000,          // 5 minutes (300,000 ms)
  OTP_EXPIRY_MINUTES: 5,

  // OTP Rate Limiting
  MAX_OTP_ATTEMPTS_PER_HOUR: 3,
  MAX_OTP_ATTEMPTS_PER_DAY: 10,

  // OTP Code Configuration
  OTP_CODE_LENGTH: 6,
  OTP_CODE_DIGITS_ONLY: true,
};

// ============================================================================
// SERVER CONFIGURATION
// ============================================================================

export const SERVER_CONFIG = {
  // Server Ports
  PORT: parseInt(process.env.PORT) || 3001,

  // API Configuration
  API_TIMEOUT_MS: 30000,          // 30 seconds
  API_REQUEST_SIZE_LIMIT: '10mb',
  API_RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_RATE_LIMIT_MAX_REQUESTS: 100,

  // Database Configuration
  DB_CONNECTION_LIMIT: 10,
  DB_QUEUE_LIMIT: 0,
  DB_WAIT_FOR_CONNECTIONS: true,
  DB_CONNECTION_TIMEOUT_MS: 10000,

  // Redis Configuration
  REDIS_URL: process.env.REDIS_URL,
  REDIS_DEFAULT_PORT: 6379,

  // CORS Configuration
  CORS_ALLOWED_ORIGINS: process.env.CORS_ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
};

// ============================================================================
// FRONTEND CONFIGURATION
// ============================================================================

export const FRONTEND_CONFIG = {
  // Frontend URL (required in production)
  FRONTEND_URL: process.env.FRONTEND_URL,
  FRONTEND_PORT: 5173,

  // API Base URL
  API_BASE_URL: process.env.VITE_API_BASE_URL,
  API_DEFAULT_URL: 'http://localhost:3001',
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate required configuration on application startup
 * @param {boolean} isProduction - Whether running in production mode
 * @throws {Error} - If required configuration is missing
 */
export function validateRequiredConfig(isProduction = false) {
  const errors = [];

  // Production-specific validation
  if (isProduction) {
    if (!process.env.JWT_SECRET) {
      errors.push('JWT_SECRET environment variable is required in production');
    }

    if (!FRONTEND_CONFIG.FRONTEND_URL) {
      errors.push('FRONTEND_URL environment variable is required in production');
    }

    if (!SERVER_CONFIG.REDIS_URL) {
      errors.push('REDIS_URL environment variable is required in production');
    }

    // Check for database configuration (discrete variables)
    if (!process.env.DB_HOST) {
      errors.push('DB_HOST environment variable is required in production');
    }
    if (!process.env.DB_USER) {
      errors.push('DB_USER environment variable is required in production');
    }
    if (!process.env.DB_PASSWORD) {
      errors.push('DB_PASSWORD environment variable is required in production');
    }
    if (!process.env.DB_NAME) {
      errors.push('DB_NAME environment variable is required in production');
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
    );
  }

  return true;
}

/**
 * Get environment-aware configuration
 * @param {string} key - Configuration key
 * @param {any} defaultValue - Default value if not in env
 * @returns {any} - Configuration value
 */
export function getConfig(key, defaultValue = null) {
  return process.env[key] || defaultValue;
}

// ============================================================================
// FEATURE FLAGS
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_OTP_LOGIN: getConfig('ENABLE_OTP_LOGIN', 'true') === 'true',
  ENABLE_EMAIL_NOTIFICATIONS: getConfig('ENABLE_EMAIL_NOTIFICATIONS', 'true') === 'true',
  ENABLE_SMS_NOTIFICATIONS: getConfig('ENABLE_SMS_NOTIFICATIONS', 'false') === 'true',
  ENABLE_RATE_LIMITING: getConfig('ENABLE_RATE_LIMITING', 'true') === 'true',
  ENABLE_SECURITY_HEADERS: getConfig('ENABLE_SECURITY_HEADERS', 'true') === 'true',
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  AUTH_CONFIG,
  OTP_CONFIG,
  SERVER_CONFIG,
  FRONTEND_CONFIG,
  FEATURE_FLAGS,
  validateRequiredConfig,
  getConfig
};

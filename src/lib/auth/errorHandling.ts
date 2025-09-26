// ============================================================================
// AUTHENTICATION ERROR HANDLING
// ============================================================================

export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  USER_SUSPENDED = 'USER_SUSPENDED',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  PASSWORD_EXPIRED = 'PASSWORD_EXPIRED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  REFRESH_TOKEN_EXPIRED = 'REFRESH_TOKEN_EXPIRED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REGISTRATION_FAILED = 'REGISTRATION_FAILED',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AuthError {
  type: AuthErrorType;
  message: string;
  details?: string;
  code?: string;
  retryable?: boolean;
  timestamp: number;
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

export class AuthErrorHandler {
  static classifyError(error: unknown): AuthError {
    const timestamp = Date.now();

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network connection failed. Please check your internet connection.',
        retryable: true,
        timestamp
      };
    }

    // Handle Error objects
    if (error instanceof Error) {
      return this.classifyErrorMessage(error.message, timestamp, error.stack);
    }

    // Handle string errors
    if (typeof error === 'string') {
      return this.classifyErrorMessage(error, timestamp);
    }

    // Handle API response errors
    if (typeof error === 'object' && error !== null) {
      const apiError = error as any;
      
      if (apiError.status) {
        return this.classifyHttpError(apiError.status, apiError.message || 'Unknown error', timestamp);
      }

      if (apiError.code) {
        return this.classifyErrorCode(apiError.code, apiError.message || 'Unknown error', timestamp);
      }
    }

    // Default unknown error
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: 'An unexpected error occurred. Please try again.',
      retryable: true,
      timestamp
    };
  }

  private static classifyErrorMessage(message: string, timestamp: number, stack?: string): AuthError {
    const lowerMessage = message.toLowerCase();

    // Authentication errors
    if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('invalid email or password')) {
      return {
        type: AuthErrorType.INVALID_CREDENTIALS,
        message: 'Invalid email or password. Please check your credentials and try again.',
        retryable: false,
        timestamp
      };
    }

    if (lowerMessage.includes('user not found')) {
      return {
        type: AuthErrorType.USER_NOT_FOUND,
        message: 'No account found with this email address.',
        retryable: false,
        timestamp
      };
    }

    if (lowerMessage.includes('user inactive') || lowerMessage.includes('account inactive')) {
      return {
        type: AuthErrorType.USER_INACTIVE,
        message: 'Your account is inactive. Please contact support.',
        retryable: false,
        timestamp
      };
    }

    if (lowerMessage.includes('user suspended') || lowerMessage.includes('account suspended')) {
      return {
        type: AuthErrorType.USER_SUSPENDED,
        message: 'Your account has been suspended. Please contact support.',
        retryable: false,
        timestamp
      };
    }

    if (lowerMessage.includes('email not verified')) {
      return {
        type: AuthErrorType.EMAIL_NOT_VERIFIED,
        message: 'Please verify your email address before signing in.',
        retryable: false,
        timestamp
      };
    }

    // Token errors
    if (lowerMessage.includes('token expired') || lowerMessage.includes('session expired')) {
      return {
        type: AuthErrorType.TOKEN_EXPIRED,
        message: 'Your session has expired. Please sign in again.',
        retryable: false,
        timestamp
      };
    }

    if (lowerMessage.includes('invalid token')) {
      return {
        type: AuthErrorType.TOKEN_INVALID,
        message: 'Invalid authentication token. Please sign in again.',
        retryable: false,
        timestamp
      };
    }

    // Registration errors
    if (lowerMessage.includes('email already exists') || lowerMessage.includes('user already exists')) {
      return {
        type: AuthErrorType.EMAIL_ALREADY_EXISTS,
        message: 'An account with this email address already exists.',
        retryable: false,
        timestamp
      };
    }

    if (lowerMessage.includes('registration failed')) {
      return {
        type: AuthErrorType.REGISTRATION_FAILED,
        message: 'Registration failed. Please check your information and try again.',
        retryable: true,
        timestamp
      };
    }

    if (lowerMessage.includes('weak password') || lowerMessage.includes('password too weak')) {
      return {
        type: AuthErrorType.WEAK_PASSWORD,
        message: 'Password is too weak. Please choose a stronger password.',
        retryable: false,
        timestamp
      };
    }

    // Rate limiting
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
      return {
        type: AuthErrorType.RATE_LIMITED,
        message: 'Too many attempts. Please wait a moment before trying again.',
        retryable: true,
        timestamp
      };
    }

    // Network errors
    if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
      return {
        type: AuthErrorType.NETWORK_ERROR,
        message: 'Network connection failed. Please check your internet connection.',
        retryable: true,
        timestamp
      };
    }

    // Server errors
    if (lowerMessage.includes('server error') || lowerMessage.includes('internal error')) {
      return {
        type: AuthErrorType.SERVER_ERROR,
        message: 'Server error occurred. Please try again later.',
        retryable: true,
        timestamp
      };
    }

    // Default case
    return {
      type: AuthErrorType.UNKNOWN_ERROR,
      message: message || 'An unexpected error occurred. Please try again.',
      details: stack,
      retryable: true,
      timestamp
    };
  }

  private static classifyHttpError(status: number, message: string, timestamp: number): AuthError {
    switch (status) {
      case 400:
        return {
          type: AuthErrorType.VALIDATION_ERROR,
          message: 'Invalid request. Please check your input and try again.',
          code: status.toString(),
          retryable: false,
          timestamp
        };

      case 401:
        return {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Invalid credentials. Please check your email and password.',
          code: status.toString(),
          retryable: false,
          timestamp
        };

      case 403:
        return {
          type: AuthErrorType.USER_SUSPENDED,
          message: 'Access denied. Your account may be suspended.',
          code: status.toString(),
          retryable: false,
          timestamp
        };

      case 404:
        return {
          type: AuthErrorType.USER_NOT_FOUND,
          message: 'User not found. Please check your email address.',
          code: status.toString(),
          retryable: false,
          timestamp
        };

      case 429:
        return {
          type: AuthErrorType.RATE_LIMITED,
          message: 'Too many requests. Please wait before trying again.',
          code: status.toString(),
          retryable: true,
          timestamp
        };

      case 500:
      case 502:
      case 503:
      case 504:
        return {
          type: AuthErrorType.SERVER_ERROR,
          message: 'Server error. Please try again later.',
          code: status.toString(),
          retryable: true,
          timestamp
        };

      default:
        return {
          type: AuthErrorType.UNKNOWN_ERROR,
          message: message || 'An unexpected error occurred.',
          code: status.toString(),
          retryable: true,
          timestamp
        };
    }
  }

  private static classifyErrorCode(code: string, message: string, timestamp: number): AuthError {
    switch (code) {
      case 'AUTH_INVALID_CREDENTIALS':
        return {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: 'Invalid email or password.',
          code,
          retryable: false,
          timestamp
        };

      case 'AUTH_USER_NOT_FOUND':
        return {
          type: AuthErrorType.USER_NOT_FOUND,
          message: 'No account found with this email.',
          code,
          retryable: false,
          timestamp
        };

      case 'AUTH_TOKEN_EXPIRED':
        return {
          type: AuthErrorType.TOKEN_EXPIRED,
          message: 'Session expired. Please sign in again.',
          code,
          retryable: false,
          timestamp
        };

      default:
        return {
          type: AuthErrorType.UNKNOWN_ERROR,
          message: message || 'An unexpected error occurred.',
          code,
          retryable: true,
          timestamp
        };
    }
  }

  // ============================================================================
  // ERROR RECOVERY SUGGESTIONS
  // ============================================================================

  static getRecoverySuggestion(error: AuthError): string {
    switch (error.type) {
      case AuthErrorType.INVALID_CREDENTIALS:
        return 'Double-check your email and password, or use the "Forgot Password" link.';

      case AuthErrorType.USER_NOT_FOUND:
        return 'Make sure you entered the correct email address, or create a new account.';

      case AuthErrorType.EMAIL_NOT_VERIFIED:
        return 'Check your email for a verification link, or request a new verification email.';

      case AuthErrorType.TOKEN_EXPIRED:
      case AuthErrorType.SESSION_EXPIRED:
        return 'Your session has expired. Please sign in again.';

      case AuthErrorType.NETWORK_ERROR:
        return 'Check your internet connection and try again.';

      case AuthErrorType.RATE_LIMITED:
        return 'Wait a few minutes before trying again.';

      case AuthErrorType.SERVER_ERROR:
        return 'Our servers are experiencing issues. Please try again in a few minutes.';

      case AuthErrorType.EMAIL_ALREADY_EXISTS:
        return 'Try signing in instead, or use the "Forgot Password" link if you forgot your password.';

      case AuthErrorType.WEAK_PASSWORD:
        return 'Use a password with at least 8 characters, including uppercase, lowercase, and numbers.';

      default:
        return 'Please try again. If the problem persists, contact support.';
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AuthErrorHandler;

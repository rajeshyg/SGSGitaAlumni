// ============================================================================
// ERROR HANDLING UTILITIES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export class APIError extends Error {
  public code?: string;
  public status?: number;
  public details?: Record<string, unknown>;

  constructor(message: string, code?: string, status?: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  public field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

// ============================================================================
// ERROR HANDLING FUNCTIONS
// ============================================================================

export function handleApiError(error: unknown): ApiError {
  if (error instanceof APIError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error.details
    };
  }

  if (error instanceof NetworkError) {
    return {
      message: error.message,
      code: 'NETWORK_ERROR'
    };
  }

  if (error instanceof AuthenticationError) {
    return {
      message: error.message,
      code: 'AUTH_ERROR',
      status: 401
    };
  }

  if (error instanceof ValidationError) {
    return {
      message: error.message,
      code: 'VALIDATION_ERROR',
      details: { field: error.field }
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'UNKNOWN_ERROR'
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

export function getErrorMessage(error: unknown): string {
  const apiError = handleApiError(error);
  return apiError.message;
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError || 
         (error instanceof Error && error.message.toLowerCase().includes('network'));
}

export function isAuthError(error: unknown): boolean {
  return error instanceof AuthenticationError ||
         (error instanceof APIError && error.status === 401) ||
         (error instanceof Error && error.message.toLowerCase().includes('unauthorized'));
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ValidationError ||
         (error instanceof APIError && error.status === 400);
}

// ============================================================================
// RETRY MECHANISMS
// ============================================================================

export interface RetryOptions {
  maxAttempts: number;
  delay: number;
  backoff: boolean;
  retryCondition?: (error: unknown) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delay = 1000,
    backoff = true,
    retryCondition = (error) => isNetworkError(error)
  } = options;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLastAttempt = attempt === maxAttempts;
      const shouldRetry = retryCondition(error);

      if (isLastAttempt || !shouldRetry) {
        throw error;
      }

      // Calculate delay with optional backoff
      const currentDelay = backoff ? delay * Math.pow(2, attempt - 1) : delay;
      await new Promise(resolve => setTimeout(resolve, currentDelay));
    }
  }

  throw lastError;
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnlineStatusChange(callback: (isOnline: boolean) => void): () => void {
  const handleOnline = () => callback(true);
  const handleOffline = () => callback(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

// ============================================================================
// ERROR BOUNDARY HELPERS
// ============================================================================

export interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
}

export function logError(error: Error, errorInfo?: ErrorInfo): void {
  // In production, send to error monitoring service (e.g., Sentry)
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('Error caught by error boundary:', error);
    if (errorInfo) {
      // eslint-disable-next-line no-console
      console.error('Component stack:', errorInfo.componentStack);
    }
  }

  // Example: Send to monitoring service
  // Sentry.captureException(error, { extra: errorInfo });
}

export function getErrorDisplayMessage(error: unknown): string {
  if (isNetworkError(error)) {
    return 'Network connection failed. Please check your internet connection and try again.';
  }

  if (isAuthError(error)) {
    return 'Your session has expired. Please log in again.';
  }

  if (isValidationError(error)) {
    return getErrorMessage(error);
  }

  return 'Something went wrong. Please try again later.';
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: unknown, fieldName: string): string | null {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
}

export function validateMinLength(value: string, minLength: number, fieldName: string): string | null {
  if (value.length < minLength) {
    return `${fieldName} must be at least ${minLength} characters long`;
  }
  return null;
}

export function validateMaxLength(value: string, maxLength: number, fieldName: string): string | null {
  if (value.length > maxLength) {
    return `${fieldName} must be no more than ${maxLength} characters long`;
  }
  return null;
}

export function createValidator(
  validations: Array<(value: unknown) => string | null>
) {
  return (value: unknown): string | null => {
    for (const validation of validations) {
      const error = validation(value);
      if (error) return error;
    }
    return null;
  };
}

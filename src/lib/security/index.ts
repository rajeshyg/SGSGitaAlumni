// ============================================================================
// SECURITY MODULE EXPORTS
// ============================================================================
// Simplified exports for client-side use (ES module compatible)

interface SecurityEventDetails {
  [key: string]: unknown;
}

interface SecurityLogEntry {
  timestamp: string;
  event: string;
  details: SecurityEventDetails;
  userAgent: string;
  url: string;
}

interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: unknown | FormData;
}

interface APIResponse<T = unknown> {
  data: T;
  status: number;
  headers: Record<string, string>;
  requestId: string;
}

interface APIError extends Error {
  status?: number;
  code?: string | null;
  details?: unknown;
  response?: unknown;
  originalError?: unknown;
}

/**
 * Initialize security services for the application
 */
export function initializeSecurity(): void {
  console.log('[Security] Initializing security services...');
  console.log('[Security] Security services initialized');
}

/**
 * Security audit logging
 */
export function logSecurityEvent(event: string, details: SecurityEventDetails): void {
  const logEntry: SecurityLogEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  };

  console.log('[Security Audit]', logEntry);
}

/**
 * Simplified Secure API Client for client-side use
 */
class SimpleSecureAPIClient {
  private baseURL: string;
  private authToken: string | null;
  private refreshToken: string | null;
  private requestId: number;

  constructor(baseURL = '') {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.authToken = null;
    this.refreshToken = null;
    this.requestId = 0;
  }

  setAuthTokens(token: string, refresh: string): void {
    this.authToken = token;
    this.refreshToken = refresh;
  }

  clearAuthTokens(): void {
    this.authToken = null;
    this.refreshToken = null;
  }

  getAuthHeaders(): Record<string, string> {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${cleanEndpoint}`;
  }

  async get<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T = unknown>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  async put<T = unknown>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  async delete<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T = unknown>(endpoint: string, data: unknown, options: RequestOptions = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }

  async request<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const url = this.buildURL(endpoint);
    
    const headers = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Requested-With': 'XMLHttpRequest',
      ...this.getAuthHeaders(),
      ...options.headers
    };

    let body;
    if (options.body) {
      if (options.body instanceof FormData) {
        body = options.body;
        delete headers['Content-Type']; // Let browser set it with boundary
      } else {
        body = JSON.stringify(options.body);
      }
    }

    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        body,
        credentials: 'include'
      });

      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.error('[SecureAPIClient] Failed to parse JSON response:', parseError);
          data = {};
        }
      } else {
        // Non-JSON response (e.g., plain text error)
        const text = await response.text();
        data = { error: text };
      }

      if (!response.ok) {
        // Extract error information from standardized error format
        // Backend format: { success: false, error: { code, message, details } }
        let errorMessage = `HTTP ${response.status}`;
        let errorCode = null;
        let errorDetails = null;

        if (data && typeof data === 'object') {
          if (data.error) {
            // Standardized format from errorHandler middleware
            errorMessage = data.error.message || errorMessage;
            errorCode = data.error.code;
            errorDetails = data.error.details;
          } else if (data.message) {
            // Legacy format or direct message
            errorMessage = data.message;
          } else if (typeof data.error === 'string') {
            // String error
            errorMessage = data.error;
          }
        }

        console.error('[SecureAPIClient] Request failed:', {
          url,
          status: response.status,
          message: errorMessage,
          code: errorCode,
          details: errorDetails,
          fullResponse: data
        });

        // Create comprehensive error object
        const error = new Error(errorMessage);
        error.status = response.status;
        error.code = errorCode;
        error.details = errorDetails;
        error.response = data;

        throw error;
      }

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        requestId
      };
    } catch (error) {
      // If it's already an Error with our properties, rethrow it
      if (error.status || error.code) {
        throw error;
      }

      // Network error or other non-HTTP error
      console.error('[SecureAPIClient] Network or unexpected error:', error);
      const networkError = new Error(error.message || 'Network request failed');
      networkError.originalError = error;
      throw networkError;
    }
  }
}

// Create and export client instance for browser only
export const secureAPIClient = typeof window !== 'undefined' 
  ? new SimpleSecureAPIClient(
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || ''
    )
  : null;

// ============================================================================
// SECURITY MODULE EXPORTS
// ============================================================================
// Simplified exports for client-side use (ES module compatible)

/**
 * Initialize security services for the application
 */
export function initializeSecurity() {
  console.log('[Security] Initializing security services...');
  console.log('[Security] Security services initialized');
}

/**
 * Security audit logging
 */
export function logSecurityEvent(event, details) {
  const logEntry = {
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
  constructor(baseURL = '') {
    this.baseURL = baseURL.replace(/\/$/, '');
    this.authToken = null;
    this.refreshToken = null;
    this.requestId = 0;
  }

  setAuthTokens(token, refresh) {
    this.authToken = token;
    this.refreshToken = refresh;
  }

  clearAuthTokens() {
    this.authToken = null;
    this.refreshToken = null;
  }

  getAuthHeaders() {
    return this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {};
  }

  generateRequestId() {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  buildURL(endpoint) {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${cleanEndpoint}`;
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body: data });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body: data });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body: data });
  }

  async request(endpoint, options = {}) {
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return {
        data,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        requestId
      };
    } catch (error) {
      console.error('[SecureAPIClient] Request failed:', error);
      throw error;
    }
  }
}

// Create and export client instance for browser only
export const secureAPIClient = typeof window !== 'undefined' 
  ? new SimpleSecureAPIClient(
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || ''
    )
  : null;

// ============================================================================
// SECURITY MODULE EXPORTS (JavaScript stub)
// ============================================================================
// Basic security exports for server-side compatibility

export class EncryptionService {
  encrypt(data) { return data; }
  decrypt(data) { return data; }
}

export class SecureAPIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
    this.authToken = null;
    this.refreshToken = null;
  }

  setAuthTokens(token, refreshToken) {
    this.authToken = token;
    this.refreshToken = refreshToken;
  }

  clearAuthTokens() {
    this.authToken = null;
    this.refreshToken = null;
  }

  async setEncryptionKey(key) {
    // Stub implementation
  }

  async get(endpoint) {
    return this.request(endpoint, 'GET');
  }

  async post(endpoint, data) {
    return this.request(endpoint, 'POST', data);
  }

  async put(endpoint, data) {
    return this.request(endpoint, 'PUT', data);
  }

  async delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }

  async patch(endpoint, data) {
    return this.request(endpoint, 'PATCH', data);
  }

  async request(endpoint, method, data = null) {
    console.log('[SecureAPIClient] Starting request:', { endpoint, method, url: `${this.baseURL}${endpoint}` });
    
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    console.log('[SecureAPIClient] Request config:', config);

    // Add timeout to prevent infinite hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.error('[SecureAPIClient] Request timeout after 30 seconds');
      controller.abort();
    }, 30000); // 30 second timeout

    config.signal = controller.signal;

    try {
      console.log('[SecureAPIClient] Making fetch request...');
      const response = await fetch(url, config);
      
      clearTimeout(timeoutId); // Clear timeout on successful response
      
      console.log('[SecureAPIClient] Received response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        ok: response.ok
      });

      if (!response.ok) {
        console.error('[SecureAPIClient] Response not ok:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type');
      console.log('[SecureAPIClient] Content-Type:', contentType);
      
      let responseData = null;
      
      if (contentType && contentType.includes('application/json')) {
        console.log('[SecureAPIClient] Parsing JSON response...');
        try {
          const text = await response.text();
          console.log('[SecureAPIClient] Response text:', text);
          
          if (text.trim()) {
            responseData = JSON.parse(text);
            console.log('[SecureAPIClient] Parsed JSON:', responseData);
          } else {
            console.log('[SecureAPIClient] Empty response body');
            responseData = {};
          }
        } catch (jsonError) {
          console.error('[SecureAPIClient] JSON parse error:', jsonError);
          throw new Error(`Invalid JSON response: ${jsonError.message}`);
        }
      } else {
        console.log('[SecureAPIClient] Non-JSON response, getting text...');
        responseData = await response.text();
        console.log('[SecureAPIClient] Text response:', responseData);
      }

      console.log('[SecureAPIClient] Request completed successfully');
      return { data: responseData };
    } catch (error) {
      clearTimeout(timeoutId); // Clear timeout on error
      console.error('[SecureAPIClient] Request failed:', error);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond');
      }
      
      throw error;
    }
  }
}

export class InputValidator {
  validate() { return { isValid: true }; }
}

export class AccessControlService {
  initializeDefaultRoles() {}
  checkPermission() { return true; }
}

// Global instances
export const encryptionService = new EncryptionService();

// Global secure API client instance - only create on client side
let secureAPIClient = null;
try {
  if (typeof window !== 'undefined') {
    // We're in the browser
    const baseURL = import.meta.env?.VITE_API_BASE_URL || 'http://localhost:3001';
    secureAPIClient = new SecureAPIClient(baseURL);
  }
} catch (e) {
  // Fallback for environments where import.meta is not available
  secureAPIClient = null;
}

export { secureAPIClient };

export const inputValidator = new InputValidator();
export const accessControlService = new AccessControlService();

export function initializeSecurity() {
  console.log('[Security] Initializing security services...');
  console.log('[Security] Security services initialized');
}

export function logSecurityEvent(event, details) {
  console.log('[Security Audit]', { timestamp: new Date().toISOString(), event, details });
}
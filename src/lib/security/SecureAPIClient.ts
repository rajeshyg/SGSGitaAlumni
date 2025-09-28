// ============================================================================
// SECURE API CLIENT
// ============================================================================
// Enhanced API client with security features and compliance

import { EncryptionService } from './EncryptionService';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface APIResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  requestId: string;
}

export interface SecurityHeaders {
  'X-Content-Type-Options': string;
  'X-Frame-Options': string;
  'X-XSS-Protection': string;
  'Strict-Transport-Security': string;
  'Content-Security-Policy': string;
  'X-Requested-With': string;
}

export class SecureAPIClient {
  private baseURL: string;
  private authToken: string | null = null;
  private refreshToken: string | null = null;
  private requestId: number = 0;
  private encryptionKey: CryptoKey | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.setupSecurityHeaders();
  }

  /**
   * Set authentication tokens
   */
  setAuthTokens(accessToken: string, refreshToken?: string): void {
    this.authToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  /**
   * Clear authentication tokens
   */
  clearAuthTokens(): void {
    this.authToken = null;
    this.refreshToken = null;
  }

  /**
   * Set encryption key for sensitive data
   */
  async setEncryptionKey(key: CryptoKey): Promise<void> {
    this.encryptionKey = key;
  }

  /**
   * Make a secure GET request
   */
  async get<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * Make a secure POST request
   */
  async post<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  /**
   * Make a secure PUT request
   */
  async put<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  /**
   * Make a secure DELETE request
   */
  async delete<T = any>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * Make a secure PATCH request
   */
  async patch<T = any>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }

  /**
   * Core request method with security features
   */
  private async request<T>(endpoint: string, options: RequestOptions): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const url = this.buildURL(endpoint);

    try {
      const config = await this.buildRequestConfig(options, requestId);

      this.logSecurityEvent('API_REQUEST_START', {
        requestId,
        method: config.method,
        url: url.replace(this.baseURL, '[BASE_URL]'),
        hasAuth: !!this.authToken
      });

      const response = await this.executeRequest(url, config, options.retries || 3);

      const result = await this.handleResponse<T>(response, requestId);

      this.logSecurityEvent('API_REQUEST_SUCCESS', {
        requestId,
        status: response.status,
        contentLength: response.headers.get('content-length')
      });

      return result;

    } catch (error) {
      this.logSecurityEvent('API_REQUEST_FAILED', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint
      });
      throw error;
    }
  }

  /**
   * Build the complete URL
   */
  private buildURL(endpoint: string): string {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${this.baseURL}${cleanEndpoint}`;
  }

  /**
   * Build request configuration with security headers
   */
  private async buildRequestConfig(options: RequestOptions, requestId: string): Promise<RequestInit> {
    const headers = new Headers({
      ...this.getSecurityHeaders(),
      'X-Request-ID': requestId,
      'X-Requested-With': 'XMLHttpRequest',
      ...options.headers
    });

    // Add authentication header if token exists
    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    // Prepare body
    let body: string | FormData | undefined;
    if (options.body) {
      if (options.body instanceof FormData) {
        body = options.body;
        // Don't set Content-Type for FormData, let browser set it with boundary
        headers.delete('Content-Type');
      } else {
        // Encrypt sensitive data if encryption key is available
        const dataToSend = this.encryptionKey && this.isSensitiveData(options.body)
          ? await this.encryptSensitiveData(options.body)
          : options.body;

        body = JSON.stringify(dataToSend);
        headers.set('Content-Type', 'application/json');
      }
    }

    return {
      method: options.method || 'GET',
      headers,
      body,
      signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined
    };
  }

  /**
   * Execute the HTTP request with retry logic
   */
  private async executeRequest(url: string, config: RequestInit, retries: number): Promise<Response> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);

        // Handle authentication errors
        if (response.status === 401 && this.refreshToken) {
          await this.refreshAuthToken();
          // Retry with new token
          config.headers = new Headers(config.headers);
          (config.headers as Headers).set('Authorization', `Bearer ${this.authToken}`);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < retries && this.isRetryableError(error)) {
          await this.delay(Math.pow(2, attempt) * 1000); // Exponential backoff
          continue;
        }

        break;
      }
    }

    throw lastError!;
  }

  /**
   * Handle API response
   */
  private async handleResponse<T>(response: Response, requestId: string): Promise<APIResponse<T>> {
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    let data: T;
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      data = await response.json();
      // Decrypt if data was encrypted
      if (this.encryptionKey && this.isEncryptedResponse(data)) {
        data = await this.decryptResponseData(data) as T;
      }
    } else {
      data = (await response.text()) as unknown as T;
    }

    return {
      data,
      status: response.status,
      headers,
      requestId
    };
  }

  /**
   * Get security headers for all requests
   */
  private getSecurityHeaders(): SecurityHeaders {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'X-Requested-With': 'XMLHttpRequest'
    };
  }

  /**
   * Setup additional security measures
   */
  private setupSecurityHeaders(): void {
    // Add CSP meta tag to document if not present
    if (typeof document !== 'undefined' && !document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const meta = document.createElement('meta');
      meta.httpEquiv = 'Content-Security-Policy';
      meta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";
      document.head.appendChild(meta);
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestId}`;
  }

  /**
   * Check if data contains sensitive information that should be encrypted
   */
  private isSensitiveData(data: any): boolean {
    if (typeof data !== 'object' || !data) return false;

    const sensitiveFields = ['password', 'ssn', 'creditCard', 'token', 'secret', 'key'];
    return Object.keys(data).some(key =>
      sensitiveFields.some(field => key.toLowerCase().includes(field))
    );
  }

  /**
   * Encrypt sensitive data before sending
   */
  private async encryptSensitiveData(data: any): Promise<any> {
    if (!this.encryptionKey) return data;

    const sensitiveFields = ['password', 'ssn', 'creditCard', 'token', 'secret', 'key'];
    const encryptedData = { ...data };

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field)) && typeof value === 'string') {
        encryptedData[key] = await EncryptionService.encrypt(value, this.encryptionKey);
      }
    }

    return encryptedData;
  }

  /**
   * Check if response data is encrypted
   */
  private isEncryptedResponse(data: any): boolean {
    return typeof data === 'object' && data !== null &&
           typeof data.encrypted === 'boolean' && data.encrypted === true;
  }

  /**
   * Decrypt response data
   */
  private async decryptResponseData(data: any): Promise<any> {
    if (!this.encryptionKey || !data.data) return data;

    const decrypted = { ...data };
    delete decrypted.encrypted;

    if (typeof data.data === 'string') {
      decrypted.data = await EncryptionService.decrypt(data.data, this.encryptionKey);
    }

    return decrypted;
  }

  /**
   * Refresh authentication token
   */
  private async refreshAuthToken(): Promise<void> {
    if (!this.refreshToken) throw new Error('No refresh token available');

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getSecurityHeaders()
        },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const { accessToken, refreshToken: newRefreshToken } = await response.json();
      this.authToken = accessToken;
      this.refreshToken = newRefreshToken || this.refreshToken;

    } catch (error) {
      this.clearAuthTokens();
      throw new Error('Authentication refresh failed');
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    return error.name === 'TypeError' || // Network errors
           error.message.includes('fetch'); // Fetch API errors
  }

  /**
   * Delay helper for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log security events
   */
  private logSecurityEvent(event: string, details: any): void {
    console.log(`[Security:${event}]`, {
      timestamp: new Date().toISOString(),
      ...details
    });
  }
}
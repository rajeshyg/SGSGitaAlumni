import { APIError, NetworkError, AuthenticationError } from '../utils/errorHandling';
import { secureAPIClient } from './security';
import axios from 'axios'

// Enhanced API client with security features
export const apiClient = {
  baseURL: (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_BASE_URL : '') || '',

  // Legacy compatibility methods
  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  },

  // Initialize secure API client with auth tokens
  initializeAuth(token: string, refreshToken?: string): void {
    if (secureAPIClient) {
      secureAPIClient.setAuthTokens(token, refreshToken);
    }
  },

  // Clear auth tokens
  clearAuth(): void {
    if (secureAPIClient) {
      secureAPIClient.clearAuthTokens();
    }
  },

  // Set encryption key for sensitive data
  async setEncryptionKey(key: CryptoKey): Promise<void> {
    if (secureAPIClient) {
      await secureAPIClient.setEncryptionKey(key);
    }
  },

  async request(endpoint: string, options: RequestInit = {}) {
    if (!secureAPIClient) {
      throw new Error('Secure API client not available on server-side');
    }

    try {
      const method = (options.method as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH') || 'GET';
      const data = options.body ? JSON.parse(options.body as string) : undefined;

      console.log(`[apiClient] 📡 ${method} ${endpoint}`);
      console.log(`[apiClient] Raw body:`, options.body);
      console.log(`[apiClient] Parsed data:`, data);

      let response;
      switch (method) {
        case 'GET':
          response = await secureAPIClient.get(endpoint);
          break;
        case 'POST':
          console.log(`[apiClient] Calling secureAPIClient.post with data:`, data);
          response = await secureAPIClient.post(endpoint, data);
          break;
        case 'PUT':
          response = await secureAPIClient.put(endpoint, data);
          break;
        case 'DELETE':
          response = await secureAPIClient.delete(endpoint);
          break;
        case 'PATCH':
          response = await secureAPIClient.patch(endpoint, data);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }

      console.log(`[apiClient] ✅ ${method} ${endpoint} succeeded`, response.data);

      // Convert secure API response to legacy format for compatibility
      return response.data;
    } catch (error: any) {
      console.error(`[apiClient] ❌ ${options.method || 'GET'} ${endpoint} failed:`, error);
      
      // Convert secure API errors to legacy error format
      if (error.message?.includes('HTTP')) {
        const statusMatch = error.message.match(/HTTP (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 500;

        if (status === 401) {
          throw new AuthenticationError('Authentication failed');
        }

        if (status >= 500) {
          throw new APIError('Server error', 'SERVER_ERROR', status);
        }

        if (status >= 400) {
          throw new APIError(
            error.message || `Request failed`,
            'CLIENT_ERROR',
            status
          );
        }
      }

      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        throw new NetworkError('Network connection failed');
      }

      throw error;
    }
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  put(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE'
    });
  },

  patch(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
}

export const getData = async (skipOrEndpoint?: number | string, limit?: number, search?: string) => {
  // Backwards compatible: support getData(), or getData(skip, limit, search)
  if (typeof skipOrEndpoint === 'string') {
    const url = skipOrEndpoint || '/data'
    const response = await axios.get(url, { params: { skip: 0, limit: 100, search: undefined } })
    return response.data
  }

  const skip = typeof skipOrEndpoint === 'number' ? skipOrEndpoint : 0
  const lim = typeof limit === 'number' ? limit : 100

  const response = await axios.get('/data', { params: { skip, limit: lim, search } })
  return response.data
}

export class RawCsvUpload {
  static async upload(file: File): Promise<Record<string, unknown>> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${apiClient.baseURL}/upload`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    return response.json()
  }
}

export const handleApiError = (error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('API Error:', error)
  // Handle error logging/monitoring here
  return {
    success: false,
    error: (error as Error)?.message || 'An error occurred'
  }
}
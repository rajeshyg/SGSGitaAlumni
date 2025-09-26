import { APIError, NetworkError, AuthenticationError } from '../utils/errorHandling';

// API utilities
export const apiClient = {
  baseURL: import.meta.env.VITE_API_BASE_URL || '',

  getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {};

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  },

  async refreshTokenIfNeeded(): Promise<void> {
    const token = localStorage.getItem('authToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!token || !refreshToken) {
      return;
    }

    // Check if token is close to expiry (implement based on your token structure)
    // For now, we'll implement a simple refresh mechanism
    try {
      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
      }
    } catch {
      // If refresh fails, clear tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      throw new AuthenticationError('Session expired. Please log in again.');
    }
  },

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;

    try {
      // Attempt to refresh token if needed (for authenticated requests)
      if (localStorage.getItem('authToken')) {
        await this.refreshTokenIfNeeded();
      }

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        // If we get a 401, try refreshing token once more
        if (response.status === 401 && localStorage.getItem('refreshToken')) {
          await this.refreshTokenIfNeeded();

          // Retry the request with new token
          const retryResponse = await fetch(url, {
            headers: {
              'Content-Type': 'application/json',
              ...this.getAuthHeaders(),
              ...options.headers
            },
            ...options
          });

          if (!retryResponse.ok) {
            await this.handleResponseError(retryResponse);
          }

          return retryResponse.json();
        }

        await this.handleResponseError(response);
      }

      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new NetworkError('Network connection failed');
      }
      throw error;
    }
  },

  async handleResponseError(response: Response): Promise<never> {
    if (response.status === 401) {
      throw new AuthenticationError('Authentication failed');
    }

    if (response.status >= 500) {
      throw new APIError('Server error', 'SERVER_ERROR', response.status);
    }

    if (response.status >= 400) {
      const errorData = await response.json().catch(() => ({}));
      throw new APIError(
        errorData.message || `Request failed: ${response.statusText}`,
        errorData.code || 'CLIENT_ERROR',
        response.status,
        errorData
      );
    }

    throw new APIError(`Unexpected response status: ${response.status}`, 'UNKNOWN_ERROR', response.status);
  },

  get(endpoint: string) {
    return this.request(endpoint)
  },

  post(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  put(endpoint: string, data: Record<string, unknown>) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  },

  delete(endpoint: string) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }
}

export const getData = async (endpoint: string) => {
  return apiClient.get(endpoint)
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
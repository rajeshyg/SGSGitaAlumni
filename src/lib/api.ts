// API utilities
export const apiClient = {
  baseURL: import.meta.env.VITE_API_URL || '',

  async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    return response.json()
  },

  get(endpoint: string) {
    return this.request(endpoint)
  },

  post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  },

  put(endpoint: string, data: any) {
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
  static async upload(file: File): Promise<any> {
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
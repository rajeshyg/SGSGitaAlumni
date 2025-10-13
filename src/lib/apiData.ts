// API data service
export interface FileImport {
  id: string;
  filename: string;
  file_type: string;
  upload_date: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  records_count: number;
  processed_records: number;
  errors_count: number;
  uploaded_by: string;
  file_size: number;
  processedAt?: Date;
  error?: string;
}

export const APIDataService = {
  getData: async () => {
    // Production implementation - call real API
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/data`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.statusText}`);
    }
    return response.json();
  },

  getFileImports: async (): Promise<FileImport[]> => {
    // Production implementation - call real API
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/file-imports`);
    
    // Handle deprecated endpoint (410 Gone) - return empty array
    if (response.status === 410) {
      console.warn('[apiData] File imports endpoint is deprecated, returning empty array');
      return [];
    }
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file imports: ${response.statusText}`);
    }
    return response.json();
  },

  updateFileImport: async (id: string, updates: Partial<FileImport>): Promise<void> => {
    // Production implementation - call real API
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/file-imports/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`Failed to update file import: ${response.statusText}`);
    }
  },

  exportData: async (format: string): Promise<Blob> => {
    // Production implementation - call real API
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/export?format=${format}`);
    if (!response.ok) {
      throw new Error(`Failed to export data: ${response.statusText}`);
    }
    return response.blob();
  },

  getStatistics: async () => {
    // Production implementation - call real API
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/statistics`);
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }
    return response.json();
  }
}

export const checkAPIConfiguration = () => {
  return !!import.meta.env.VITE_API_BASE_URL
}

const API_CONFIG_STATUS = {
  isConfigured: !!import.meta.env.VITE_API_BASE_URL,
  hasBaseUrl: !!import.meta.env.VITE_API_BASE_URL,
  hasUrl: !!import.meta.env.VITE_API_BASE_URL,
  configured: !!import.meta.env.VITE_API_BASE_URL
}

export const getAPIConfigStatus = () => API_CONFIG_STATUS
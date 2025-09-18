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
    // Mock implementation
    return { data: [] }
  },
  getFileImports: async (): Promise<FileImport[]> => {
    // Mock implementation
    return []
  },
  updateFileImport: async (id: string, updates: Partial<FileImport>): Promise<void> => {
    // Mock implementation
    // eslint-disable-next-line no-console
    console.log('Updating file import', id, updates)
  },
  exportData: async (_format: string): Promise<Blob> => {
    // Mock implementation
    return new Blob(['mock data'], { type: 'text/plain' })
  },
  getStatistics: async () => {
    // Mock implementation
    return {
      totalUsers: 0,
      totalPosts: 0,
      totalImports: 0
    }
  }
}

export const checkAPIConfiguration = () => {
  return !!import.meta.env.VITE_API_BASE_URL
}

export const getAPIConfigStatus = () => ({
  isConfigured: !!import.meta.env.VITE_API_BASE_URL,
  hasBaseUrl: !!import.meta.env.VITE_API_BASE_URL,
  hasUrl: !!import.meta.env.VITE_API_BASE_URL,
  configured: !!import.meta.env.VITE_API_BASE_URL
})
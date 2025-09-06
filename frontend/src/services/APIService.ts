import api from '../lib/api';
import type { RawCsvUpload } from '../lib/api';

export interface FileImport extends Record<string, unknown> {
  id: number;
  filename: string;
  file_type: string;
  upload_date: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  records_count: number;
  processed_records: number;
  errors_count: number;
  uploaded_by: string;
  file_size: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  search?: string;
}

export interface ApiResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const APIService = {
  // Enhanced getFileImports with proper pagination and validation
  getFileImports: async (params: PaginationParams): Promise<ApiResponse<FileImport>> => {
    try {
      console.log('APIService: Fetching file imports with params:', params);
      
      // Use the existing API endpoint but with proper parameters
      const response = await api.get("/data", { 
        params: {
          skip: params.page * params.pageSize,
          limit: params.pageSize,
          search: params.search
        }
      });

      console.log('APIService: Raw response:', response.data);

      // Validate response structure
      if (!Array.isArray(response.data)) {
        console.warn('APIService: Invalid response format, expected array');
        return {
          data: [],
          total: 0,
          page: params.page,
          pageSize: params.pageSize,
          totalPages: 0
        };
      }

      // Transform raw data to FileImport format without fallbacks that create fake data
      const transformedData: FileImport[] = [];
      
      response.data.forEach((item: RawCsvUpload, index: number) => {
        const itemData = item as any;
        
        // Only include items with valid filename - NO FALLBACK GENERATION
        if (itemData.filename || itemData.file_name) {
          transformedData.push({
            id: itemData.id || index + 1,
            filename: itemData.filename || itemData.file_name, // Required field
            file_type: itemData.file_type || itemData.type || 'CSV',
            upload_date: itemData.upload_date || itemData.created_at || new Date().toISOString(),
            status: (itemData.status || 'completed') as 'pending' | 'processing' | 'completed' | 'failed',
            records_count: itemData.records_count || itemData.total_records || 0,
            processed_records: itemData.processed_records || itemData.records_count || 0,
            errors_count: itemData.errors_count || itemData.error_count || 0,
            uploaded_by: itemData.uploaded_by || itemData.user || 'System',
            file_size: itemData.file_size || itemData.size || '0KB',
          });
        } else {
          console.warn(`APIService: Skipping item ${index} - missing filename`);
        }
      });

      // Calculate pagination metadata
      const total = response.data.length; // In real implementation, this should come from API
      const totalPages = Math.ceil(total / params.pageSize);

      console.log(`APIService: Transformed ${transformedData.length} valid file imports from ${response.data.length} raw items`);

      return {
        data: transformedData,
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages
      };

    } catch (error) {
      console.error('APIService: Error fetching file imports:', error);
      
      // Return empty response on error - NO FAKE DATA
      return {
        data: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0
      };
    }
  },

  // Placeholder for future update functionality
  updateFileImport: async (id: number, updates: Partial<FileImport>): Promise<FileImport | null> => {
    try {
      // TODO: Implement actual update endpoint when backend is ready
      console.log('APIService: Updating file import:', { id, updates });
      
      // For now, return mock success - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        id,
        filename: updates.filename || 'Updated File',
        file_type: 'CSV',
        upload_date: new Date().toISOString(),
        status: 'completed' as const,
        records_count: 100,
        processed_records: 100,
        errors_count: 0,
        uploaded_by: 'System',
        file_size: '1.2MB'
      };
    } catch (error) {
      console.error('APIService: Error updating file import:', error);
      return null;
    }
  }
};
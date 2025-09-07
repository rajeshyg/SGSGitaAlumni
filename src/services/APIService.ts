import { AWSDataService, type FileImport as AWSFileImport, checkAWSConfiguration, getAWSConfigStatus } from '../lib/awsData';

export interface FileImport extends Record<string, unknown> {
  id: string; // Changed from number to string to match AWS DynamoDB
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
  // Check AWS configuration status
  getAWSConfigStatus: () => {
    return getAWSConfigStatus();
  },

  // Enhanced getFileImports using AWS DynamoDB
  getFileImports: async (params: PaginationParams): Promise<ApiResponse<FileImport>> => {
    try {
      console.log('APIService: Fetching file imports with params:', params);

      // Check if AWS is configured
      if (!checkAWSConfiguration()) {
        console.warn('APIService: AWS not configured, returning empty response');
        return {
          data: [],
          total: 0,
          page: params.page,
          pageSize: params.pageSize,
          totalPages: 0
        };
      }

      // Use AWS service instead of mock data
      const response = await AWSDataService.getFileImports(params);

      console.log('APIService: AWS response:', response);

      // Transform AWS data to FileImport format (already compatible)
      const transformedData: FileImport[] = response.data.map((item: AWSFileImport) => ({
        id: item.id,
        filename: item.filename,
        file_type: item.file_type,
        upload_date: item.upload_date,
        status: item.status,
        records_count: item.records_count,
        processed_records: item.processed_records,
        errors_count: item.errors_count,
        uploaded_by: item.uploaded_by,
        file_size: item.file_size,
      }));

      console.log(`APIService: Transformed ${transformedData.length} file imports, total: ${response.total}`);

      return {
        data: transformedData,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      };

    } catch (error) {
      console.error('APIService: Error fetching file imports:', error);

      // Return empty response on error
      return {
        data: [],
        total: 0,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: 0
      };
    }
  },

  // Update functionality using AWS DynamoDB
  updateFileImport: async (id: string, updates: Partial<FileImport>): Promise<FileImport | null> => {
    try {
      console.log('APIService: Updating file import:', { id, updates });

      // Check if AWS is configured
      if (!checkAWSConfiguration()) {
        console.warn('APIService: AWS not configured, cannot update');
        return null;
      }

      // Use AWS service for updates
      const updatedItem = await AWSDataService.updateFileImport(id, updates as Partial<AWSFileImport>);

      if (!updatedItem) {
        return null;
      }

      // Transform back to FileImport format
      return {
        id: updatedItem.id,
        filename: updatedItem.filename,
        file_type: updatedItem.file_type,
        upload_date: updatedItem.upload_date,
        status: updatedItem.status,
        records_count: updatedItem.records_count,
        processed_records: updatedItem.processed_records,
        errors_count: updatedItem.errors_count,
        uploaded_by: updatedItem.uploaded_by,
        file_size: updatedItem.file_size,
      };
    } catch (error) {
      console.error('APIService: Error updating file import:', error);
      return null;
    }
  },

  // Export functionality using AWS DynamoDB
  exportData: async (format: 'csv' | 'json', search?: string) => {
    try {
      console.log('APIService: Exporting data:', { format, search });

      // Check if AWS is configured
      if (!checkAWSConfiguration()) {
        console.warn('APIService: AWS not configured, cannot export');
        throw new Error('AWS not configured');
      }

      const data = await AWSDataService.exportData(format, search);

      if (format === 'csv') {
        // data is already an array of arrays from AWSDataService
        const csvData = data as (string | number)[][];
        const csvContent = csvData.map((row: (string | number)[]) => row.join(',')).join('\n');
        return csvContent;
      } else {
        // data is already AWSFileImport[] from AWSDataService
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      console.error('APIService: Error exporting data:', error);
      throw error;
    }
  },

  // Get statistics using AWS DynamoDB
  getStatistics: async () => {
    try {
      console.log('APIService: Fetching statistics');

      // Check if AWS is configured
      if (!checkAWSConfiguration()) {
        console.warn('APIService: AWS not configured, returning empty statistics');
        return {
          totalImports: 0,
          completedImports: 0,
          failedImports: 0,
          totalRecords: 0
        };
      }

      return await AWSDataService.getStatistics();
    } catch (error) {
      console.error('APIService: Error fetching statistics:', error);
      return {
        totalImports: 0,
        completedImports: 0,
        failedImports: 0,
        totalRecords: 0
      };
    }
  }
};
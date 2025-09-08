import { APIDataService, type FileImport as APIFileImport, checkAPIConfiguration, getAPIConfigStatus } from '../lib/apiData';

// Simple logger utility for production-safe logging
const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[APIService] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.warn(`[APIService] ${message}`, ...args);
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[APIService] ${message}`, ...args);
  }
};

export interface FileImport extends Record<string, unknown> {
  id: number; // MySQL auto-increment primary key
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

const createEmptyResponse = (params: PaginationParams): ApiResponse<FileImport> => ({
  data: [],
  total: 0,
  page: params.page,
  pageSize: params.pageSize,
  totalPages: 0
});

const transformAPIFileImport = (item: APIFileImport): FileImport => ({
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
});

export const APIService = {
  // Check API configuration status
  getAPIConfigStatus: () => {
    return getAPIConfigStatus();
  },

  // Enhanced getFileImports using AWS DynamoDB
  getFileImports: async (params: PaginationParams): Promise<ApiResponse<FileImport>> => {
    try {
      logger.info('Fetching file imports with params:', params);

      // Check if API is configured
      if (!checkAPIConfiguration()) {
        logger.warn('API not configured, returning empty response');
        logger.warn('API Config Status:', getAPIConfigStatus());
        return createEmptyResponse(params);
      }

      logger.info('API is configured, attempting to connect to backend...');

      // Use API service instead of mock data
      const response = await APIDataService.getFileImports(params);

      logger.info('API response received', { dataLength: response.data?.length, total: response.total });

      // Transform API data to FileImport format
      const transformedData: FileImport[] = response.data.map(transformAPIFileImport);

      logger.info(`Transformed ${transformedData.length} file imports`, { total: response.total });

      return {
        data: transformedData,
        total: response.total,
        page: response.page,
        pageSize: response.pageSize,
        totalPages: response.totalPages
      };

    } catch (error) {
      logger.error('Error fetching file imports:', error);
      return createEmptyResponse(params);
    }
  },

  // Update functionality using MySQL
  updateFileImport: async (id: number, updates: Partial<FileImport>): Promise<FileImport | null> => {
    try {
      logger.info('Updating file import', { id, updates });

      // Check if API is configured
      if (!checkAPIConfiguration()) {
        logger.warn('API not configured, cannot update');
        return null;
      }

      // Use API service for updates
      const updatedItem = await APIDataService.updateFileImport(id, updates as Partial<APIFileImport>);

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
      logger.error('Error updating file import:', error);
      return null;
    }
  },

  // Export functionality using AWS DynamoDB
  exportData: async (format: 'csv' | 'json', search?: string) => {
    try {
      logger.info('Exporting data', { format, search });

      // Check if API is configured
      if (!checkAPIConfiguration()) {
        logger.warn('API not configured, cannot export');
        throw new Error('API not configured');
      }

      const data = await APIDataService.exportData(format, search);

      if (format === 'csv') {
        // data is already an array of arrays from AWSDataService
        const csvData = data as (string | number)[][];
        return csvData.map((row: (string | number)[]) => row.join(',')).join('\n');
      } else {
        // data is already AWSFileImport[] from AWSDataService
        return JSON.stringify(data, null, 2);
      }
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  },

  // Get statistics using AWS DynamoDB
  getStatistics: async () => {
    try {
      logger.info('Fetching statistics');

      // Check if API is configured
      if (!checkAPIConfiguration()) {
        logger.warn('API not configured, returning empty statistics');
        return {
          totalImports: 0,
          completedImports: 0,
          failedImports: 0,
          totalRecords: 0
        };
      }

      return await APIDataService.getStatistics();
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      return {
        totalImports: 0,
        completedImports: 0,
        failedImports: 0,
        totalRecords: 0
      };
    }
  }
};
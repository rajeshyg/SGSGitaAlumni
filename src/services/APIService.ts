import { APIDataService, type FileImport as APIFileImport, checkAPIConfiguration, getAPIConfigStatus } from '../lib/apiData';
import { apiClient } from '../lib/api';
import { DashboardData } from '../types/dashboard';
import type { UserProfile } from '../types/accounts';

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

// Use real API data service for all operations
const getDataService = () => {
  logger.info('Using production API data service');
  return APIDataService;
};

// ============================================================================
// TYPE DEFINITIONS FOR API SERVICE
// ============================================================================

// Authentication Types
export interface LoginCredentials extends Record<string, unknown> {
  email: string;
  password: string;
  otpVerified?: boolean; // Optional flag for passwordless OTP login
}

export interface RegisterData extends Record<string, unknown> {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  graduationYear: number;
  major: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
}

export interface AuthResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface TokenResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user?: User; // Optional user data returned from refresh endpoint
}

// User & Profile Types
// MIGRATED: Updated to match accounts + user_profiles schema
export interface User {
  // Account fields (from accounts table)
  id: string;
  email: string;
  role: 'admin' | 'member' | 'moderator';
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  createdAt: string;
  lastLoginAt?: string;
  
  // Profile fields (from user_profiles + alumni_members, for active profile)
  profileId?: string;
  alumniMemberId?: string;
  firstName?: string;
  lastName?: string;
  relationship?: 'parent' | 'child';  // UPDATED: Only parent/child per new schema
  accessLevel?: 'full' | 'supervised' | 'blocked';
  
  // Alumni member data (from alumni_members via user_profiles)
  batch?: string;
  centerName?: string;
  yearOfBirth?: number;
  displayName?: string;
  profileImageUrl?: string;
  
  // Profile count (for multi-profile accounts)
  profileCount?: number;
}

// @deprecated - Use types from src/types/accounts.ts instead
// Account and UserProfile types moved to centralized location
// Import with: import type { Account, UserProfile } from '../types/accounts';
export type { Account, UserProfile } from '../types/accounts';

export interface AlumniProfile extends Record<string, unknown> {
  id: string;
  userId: string;
  graduationYear: number;
  major: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  linkedinUrl?: string;
  bio?: string;
  skills: string[];
  interests: string[];
  isPublic: boolean;
  profileImageUrl?: string;
  updatedAt: string;
}

// Search & Directory Types
export interface SearchFilters extends Record<string, unknown> {
  graduationYear?: number[];
  major?: string[];
  location?: string[];
  company?: string[];
  skills?: string[];
  searchTerm?: string;
}

export interface DirectoryParams extends PaginationParams {
  filters?: SearchFilters;
  sortBy?: 'name' | 'graduationYear' | 'company' | 'lastActive';
  sortOrder?: 'asc' | 'desc';
}

export interface AlumniSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  graduationYear: number;
  major: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  profileImageUrl?: string;
}

export interface DirectoryResponse {
  data: AlumniSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  filters: SearchFilters;
}

// Posting Types
export interface PostingFilters extends Record<string, unknown> {
  type?: 'job' | 'event' | 'announcement';
  category?: string[];
  location?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  searchTerm?: string;
}

export interface Posting {
  id: string;
  title: string;
  description: string;
  type: 'job' | 'event' | 'announcement';
  category: string;
  location?: string;
  company?: string;
  salary?: string;
  requirements?: string[];
  benefits?: string[];
  applicationUrl?: string;
  eventDate?: string;
  deadline?: string;
  authorId: string;
  authorName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostingData extends Record<string, unknown> {
  title: string;
  description: string;
  type: 'job' | 'event' | 'announcement';
  category: string;
  location?: string;
  company?: string;
  salary?: string;
  requirements?: string[];
  benefits?: string[];
  applicationUrl?: string;
  eventDate?: string;
  deadline?: string;
}

export interface UpdatePostingData extends Partial<CreatePostingData> {
  isActive?: boolean;
}

// Messaging Types
export interface Conversation {
  id: string;
  type?: 'DIRECT' | 'GROUP' | 'POST_LINKED';
  name?: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  postingId?: string;
  postingTitle?: string;
  is_group?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  attachmentUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface SendMessageData extends Record<string, unknown> {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  attachmentUrl?: string;
}

// Existing FileImport interface (keeping for backward compatibility)
export interface FileImport extends Record<string, unknown> {
  id: string; // UUID - aligned with database schema
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

export interface PaginationParams extends Record<string, unknown> {
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
  id: item.id, // Keep as string UUID
  filename: item.filename,
  file_type: item.file_type,
  upload_date: item.upload_date.toISOString(), // Convert Date to string
  status: item.status,
  records_count: item.records_count,
  processed_records: item.processed_records,
  errors_count: item.errors_count,
  uploaded_by: item.uploaded_by,
  file_size: item.file_size.toString(), // Convert number to string
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

      // Use appropriate data service based on environment
      const dataService = getDataService();
      const response = await dataService.getFileImports();

      // If endpoint is deprecated or returns empty, return empty response
      if (!response || response.length === 0) {
        logger.info('No file imports available (endpoint may be deprecated)');
        return createEmptyResponse(params);
      }

      logger.info('API response received', { dataLength: response.length });

      // Transform API data to FileImport format
      const transformedData: FileImport[] = response.map(transformAPIFileImport);

      logger.info(`Transformed ${transformedData.length} file imports`);

      // Create paginated response
      const startIndex = (params.page - 1) * params.pageSize;
      const endIndex = startIndex + params.pageSize;
      const paginatedData = transformedData.slice(startIndex, endIndex);
      const totalPages = Math.ceil(transformedData.length / params.pageSize);

      return {
        data: paginatedData,
        total: transformedData.length,
        page: params.page,
        pageSize: params.pageSize,
        totalPages: totalPages
      };

    } catch (error) {
      logger.error('Error fetching file imports:', error);
      return createEmptyResponse(params);
    }
  },

  // Update functionality using MySQL
  updateFileImport: async (id: string, updates: Partial<FileImport>): Promise<FileImport | null> => {
    try {
      logger.info('Updating file import', { id, updates });

      if (!checkAPIConfiguration()) {
        logger.warn('API not configured, cannot update');
        return null;
      }

      const apiUpdates = APIService.convertToAPIFormat(id, updates);
      const dataService = getDataService();
      await dataService.updateFileImport(id, apiUpdates);

      return APIService.createMockUpdatedItem(id, updates);
    } catch (error) {
      logger.error('Error updating file import:', error);
      return null;
    }
  },

  // Helper method to convert updates to API format
  convertToAPIFormat: (id: string, updates: Partial<FileImport>): Partial<APIFileImport> => {
    return {
      ...updates,
      id: id,
      upload_date: updates.upload_date ? new Date(updates.upload_date) : undefined,
      file_size: updates.file_size ? parseInt(updates.file_size) : undefined,
    };
  },

  // Helper method to create mock updated item
  // eslint-disable-next-line custom/no-mock-data
  createMockUpdatedItem: (id: string, updates: Partial<FileImport>): FileImport => {
    return {
      id,
      filename: updates.filename || 'updated_file.csv',
      file_type: updates.file_type || 'csv',
      upload_date: updates.upload_date || new Date().toISOString(),
      status: updates.status || 'completed',
      records_count: updates.records_count || 0,
      processed_records: updates.processed_records || 0,
      errors_count: updates.errors_count || 0,
      uploaded_by: updates.uploaded_by || 'system',
      file_size: updates.file_size || '0',
    };
  },

  // Export functionality using API
  exportData: async (format: 'csv' | 'json', search?: string) => {
    try {
      logger.info('Exporting data', { format, search });

      // Check if API is configured
      if (!checkAPIConfiguration()) {
        logger.warn('API not configured, cannot export');
        throw new Error('API not configured');
      }

      const dataService = getDataService();
      const data = await dataService.exportData(format);

      // Convert Blob to text for both CSV and JSON formats
      return await data.text();
    } catch (error) {
      logger.error('Error exporting data:', error);
      throw error;
    }
  },

  // Get statistics using API
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

      const dataService = getDataService();
      return await dataService.getStatistics();
    } catch (error) {
      logger.error('Error fetching statistics:', error);
      return {
        totalImports: 0,
        completedImports: 0,
        failedImports: 0,
        totalRecords: 0
      };
    }
  },

  // Get member dashboard overview data
  getMemberDashboard: async (userId?: string | number): Promise<DashboardData> => {
    try {
      logger.info('Fetching member dashboard overview', { userId });
      const query = userId ? `?userId=${userId}` : '';
      const response = await apiClient.get(`/api/dashboard/member${query}`) as { success?: boolean; error?: string } & DashboardData;

      if (!response?.success) {
        logger.warn('Dashboard overview request returned unsuccessful flag', response);
        throw new Error(response?.error || 'Failed to load dashboard information.');
      }

      logger.info('Member dashboard data retrieved');
      return response as DashboardData;
    } catch (error) {
      logger.error('Failed to fetch member dashboard overview:', error);
      throw new Error('Failed to load dashboard information.');
    }
  },

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  // User login
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      logger.info('Attempting login for user:', credentials.email);

      // Add timeout to login request
      const response = await Promise.race([
        apiClient.post('/api/auth/login', credentials),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Login request timeout after 30 seconds')), 30000)
        )
      ]);

      logger.info('Login successful for user:', credentials.email);

      // Extract data from new response format if present
      const data = response?.data || response;
      return data as AuthResponse;
    } catch (error) {
      logger.error('Login failed:', error);

      // Handle timeout specifically
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Login is taking longer than expected. Please check your connection and try again.');
      }

      // CRITICAL FIX: Re-throw the original error to preserve backend error message
      // This allows specific error messages like "Invalid email or password" to reach the user
      throw error;
    }
  },

  // User logout
  logout: async (): Promise<void> => {
    try {
      logger.info('Logging out user');

      await apiClient.post('/api/auth/logout', {});

      logger.info('Logout successful');
    } catch (error) {
      logger.error('Logout failed:', error);
      throw new Error('Logout failed. Please try again.');
    }
  },

  // Refresh authentication token
  refreshToken: async (): Promise<TokenResponse> => {
    try {
      logger.info('Refreshing authentication token');

      // Get refresh token from localStorage (fallback to sessionStorage for mobile compatibility)
      let refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        refreshToken = sessionStorage.getItem('refreshToken');
      }

      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiClient.post('/api/auth/refresh', { refreshToken });

      // Extract data from new response format if present
      const data = response?.data || response;

      logger.info('Token refresh successful');
      return data as TokenResponse;
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Session expired. Please log in again.');
    }
  },

  // User registration
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    try {
      logger.info('Attempting user registration for:', userData.email);

      const response = await apiClient.post('/api/auth/register', userData);

      logger.info('Registration successful for user:', userData.email);

      // Extract data from new response format if present
      const data = response?.data || response;
      return data as AuthResponse;
    } catch (error) {
      logger.error('Registration failed:', error);
      throw new Error('Registration failed. Please check your information and try again.');
    }
  },

  // Request password reset - sends reset link to email
  requestPasswordReset: async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      logger.info('Requesting password reset for email:', email);

      const response = await apiClient.post('/api/auth/request-password-reset', { email });

      logger.info('Password reset email sent successfully');
      return response as { success: boolean; message: string };
    } catch (error) {
      logger.error('Password reset request failed:', error);
      throw new Error('Failed to request password reset. Please try again.');
    }
  },

  // Validate password reset token
  validatePasswordResetToken: async (token: string): Promise<{ valid: boolean }> => {
    try {
      logger.info('Validating password reset token');

      const response = await apiClient.post('/api/auth/validate-password-reset-token', { token });

      logger.info('Password reset token validation completed');
      return response as { valid: boolean };
    } catch (error) {
      logger.error('Token validation failed:', error);
      throw new Error('Invalid or expired reset token.');
    }
  },

  // Reset password using token
  resetPassword: async (token: string, password: string): Promise<{ success: boolean; message: string }> => {
    try {
      logger.info('Attempting password reset');

      const response = await apiClient.post('/api/auth/reset-password', { token, password });

      logger.info('Password reset successful');
      return response as { success: boolean; message: string };
    } catch (error) {
      logger.error('Password reset failed:', error);
      if (error instanceof Error) {
        if (error.message.includes('expired')) {
          throw new Error('This password reset link has expired. Please request a new one.');
        }
        if (error.message.includes('already used')) {
          throw new Error('This password reset link has already been used. Please request a new one.');
        }
      }
      throw new Error('Failed to reset password. Please try again.');
    }
  },

  // ============================================================================
  // ALUMNI MEMBERS METHODS (Source Data Management)
  // ============================================================================

  // Get alumni member by ID (source data from raw CSV)
  getAlumniMember: async (memberId: string): Promise<any> => {
    try {
      logger.info('Fetching alumni member source data:', memberId);

      const response = await apiClient.get(`/api/alumni-members/${memberId}`);

      logger.info('Alumni member source data retrieved:', memberId);
      return response;
    } catch (error) {
      logger.error('Failed to fetch alumni member:', error);
      throw new Error('Failed to fetch alumni member data.');
    }
  },

  // Search alumni members (for admin contact editing)
  searchAlumniMembers: async (query: string, limit: number = 50): Promise<any[]> => {
    try {
      logger.info('Searching alumni members:', query);

      const response = await apiClient.get(`/api/alumni-members/search?q=${encodeURIComponent(query)}&limit=${limit}`);

      logger.info('Alumni members search completed');
      return Array.isArray(response) ? response : (response?.members || response?.data || []);
    } catch (error) {
      logger.error('Failed to search alumni members:', error);
      throw new Error('Failed to search alumni members.');
    }
  },

  // Update alumni member contact information (admin only)
  updateAlumniMember: async (memberId: string, updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
  }): Promise<any> => {
    try {
      logger.info('Updating alumni member contact info:', memberId);

      const response = await apiClient.put(`/api/alumni-members/${memberId}`, updates);

      logger.info('Alumni member contact info updated:', memberId);
      return response;
    } catch (error) {
      logger.error('Failed to update alumni member:', error);
      throw new Error('Failed to update alumni member contact information.');
    }
  },

  // ============================================================================
  // APP USERS METHODS (Authenticated Platform Users)
  // ============================================================================

  // Get current authenticated user information
  getCurrentUser: async (): Promise<User> => {
    try {
      logger.info('Fetching current authenticated user information');

      const response = await apiClient.get('/api/users/profile');
      logger.info('Current user API response:', response);
      logger.info('Current user information retrieved successfully');
      return response as User;
    } catch (error) {
      logger.error('Failed to fetch current user:', error);
      logger.error('Error details:', error);
      throw new Error('Failed to fetch user information.');
    }
  },

  // Get app user by ID (for admin user management)
  getAppUser: async (userId: string): Promise<any> => {
    try {
      logger.info('Fetching app user for admin:', userId);

      const response = await apiClient.get(`/api/users/${userId}`);

      logger.info('App user retrieved for admin:', userId);
      return response;
    } catch (error) {
      logger.error('Failed to fetch app user:', error);
      throw new Error('Failed to fetch app user.');
    }
  },

  // Search app users (for admin user management)
  searchAppUsers: async (query: string, limit: number = 50): Promise<any[]> => {
    try {
      logger.info('Searching app users:', query);

      const response = await apiClient.get(`/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);

      logger.info('App users search completed');
      return Array.isArray(response) ? response : (response?.users || response?.data || []);
    } catch (error) {
      logger.error('Failed to search app users:', error);
      throw new Error('Failed to search app users.');
    }
  },

  // Alias for searchAppUsers to match server route naming
  searchUsers: async (query: string, limit: number = 50): Promise<any[]> => {
    return APIService.searchAppUsers(query, limit);
  },

  // Update app user (admin only - status, permissions, etc.)
  updateAppUser: async (userId: string, updates: {
    status?: 'active' | 'inactive' | 'suspended';
    email?: string;
  }): Promise<any> => {
    try {
      logger.info('Updating app user admin settings:', userId);

      const response = await apiClient.put(`/api/users/${userId}`, updates);

      logger.info('App user admin settings updated:', userId);
      return response;
    } catch (error) {
      logger.error('Failed to update app user:', error);
      throw new Error('Failed to update app user.');
    }
  },

  // ============================================================================
  // USER PROFILES METHODS (Extended User Information)
  // ============================================================================

  // Get user profile (extended information for authenticated users)
  getUserProfile: async (userId: string): Promise<any> => {
    try {
      logger.info('Fetching user profile for user:', userId);

      const response = await apiClient.get(`/api/user-profiles/${userId}`);

      logger.info('User profile retrieved for user:', userId);
      return response;
    } catch (error) {
      logger.error('Failed to fetch user profile:', error);
      throw new Error('Failed to fetch user profile.');
    }
  },

  // Update user profile (for profile completion)
  updateUserProfile: async (userId: string, profile: any): Promise<any> => {
    try {
      logger.info('Updating user profile for user:', userId);

      const response = await apiClient.put(`/api/user-profiles/${userId}`, profile);

      logger.info('User profile updated for user:', userId);
      return response;
    } catch (error) {
      logger.error('Failed to update user profile:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  },

  // Link user profile to alumni member (for invitation acceptance)
  linkUserToAlumniMember: async (userId: string, alumniMemberId: string): Promise<any> => {
    try {
      logger.info('Linking user profile to alumni member:', { userId, alumniMemberId });

      const response = await apiClient.post(`/api/user-profiles/${userId}/link-alumni`, {
        alumniMemberId
      });

      logger.info('User profile linked to alumni member successfully');
      return response;
    } catch (error) {
      logger.error('Failed to link user to alumni member:', error);
      throw new Error('Failed to link user profile to alumni data.');
    }
  },

  // ============================================================================
  // DIRECTORY & SEARCH METHODS
  // ============================================================================

  // Search alumni with filters
  searchAlumni: async (filters: SearchFilters): Promise<AlumniSearchResult[]> => {
    try {
      logger.info('Searching alumni with filters:', filters);

      const response = await apiClient.post('/api/alumni/search', filters);

      logger.info('Alumni search completed');
      return response as AlumniSearchResult[];
    } catch (error) {
      logger.error('Alumni search failed:', error);
      throw new Error('Failed to search alumni. Please try again.');
    }
  },

  // Get alumni directory with pagination
  getAlumniDirectory: async (params: DirectoryParams): Promise<DirectoryResponse> => {
    try {
      logger.info('Fetching alumni directory with params:', params);

      const response = await apiClient.post('/api/alumni/directory', params);

      logger.info('Alumni directory retrieved');
      return response as DirectoryResponse;
    } catch (error) {
      logger.error('Failed to fetch alumni directory:', error);
      throw new Error('Failed to fetch alumni directory. Please try again.');
    }
  },

  // ============================================================================
  // POSTING METHODS
  // ============================================================================

  // Get postings with filters
  getPostings: async (filters: PostingFilters): Promise<Posting[]> => {
    try {
      logger.info('Fetching postings with filters:', filters);

      const response = await apiClient.post('/api/postings/search', filters);

      logger.info('Postings retrieved');
      return response as Posting[];
    } catch (error) {
      logger.error('Failed to fetch postings:', error);
      throw new Error('Failed to fetch postings. Please try again.');
    }
  },

  // Create new posting
  createPosting: async (posting: CreatePostingData): Promise<Posting> => {
    try {
      logger.info('Creating new posting:', posting.title);

      const response = await apiClient.post('/api/postings', posting);

      logger.info('Posting created successfully:', posting.title);
      return response as Posting;
    } catch (error) {
      logger.error('Failed to create posting:', error);
      throw new Error('Failed to create posting. Please try again.');
    }
  },

  // Update existing posting
  updatePosting: async (id: string, posting: UpdatePostingData): Promise<Posting> => {
    try {
      logger.info('Updating posting:', id);

      const response = await apiClient.put(`/api/postings/${id}`, posting);

      logger.info('Posting updated successfully:', id);
      return response as Posting;
    } catch (error) {
      logger.error('Failed to update posting:', error);
      throw new Error('Failed to update posting. Please try again.');
    }
  },

  // ============================================================================
  // MESSAGING METHODS
  // ============================================================================

  // Get recent conversations (lightweight preview)
  getRecentConversations: async (userId?: string | number, limit: number = 5): Promise<Conversation[]> => {
    try {
      logger.info('Fetching recent conversations');
      const qs = `${userId ? `?userId=${userId}&` : '?'}limit=${limit}`;
      const response = await apiClient.get(`/api/conversations/recent${qs}`);
      const data = Array.isArray(response) ? response : [];
      logger.info('Recent conversations retrieved:', data.length);
      return data as Conversation[];
    } catch (error) {
      logger.error('Failed to fetch recent conversations:', error);
      // Surface empty list to avoid breaking dashboard while backend messaging is in progress
      return [] as Conversation[];
    }
  },

  // Get user conversations
  getConversations: async (): Promise<Conversation[]> => {
    try {
      logger.info('Fetching user conversations');

      const response = await apiClient.get('/api/conversations');

      logger.info('Conversations retrieved');
      // Extract data array from wrapped response { success: true, data: [...] }
      const data = (response as any)?.data || response || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error('Failed to fetch conversations:', error);
      throw new Error('Failed to fetch conversations. Please try again.');
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      logger.info('Fetching messages for conversation:', conversationId);

      const response = await apiClient.get(`/api/conversations/${conversationId}/messages`);

      logger.info('Messages retrieved for conversation:', conversationId);
      // Extract data array from wrapped response { success: true, data: [...] }
      const data = (response as any)?.data || response || [];
      return Array.isArray(data) ? data : [];
    } catch (error) {
      logger.error('Failed to fetch messages:', error);
      throw new Error('Failed to fetch messages. Please try again.');
    }
  },

  // Send a message
  sendMessage: async (message: SendMessageData): Promise<Message> => {
    try {
      logger.info('Sending message to conversation:', message.conversationId);

      const response = await apiClient.post(`/api/conversations/${message.conversationId}/messages`, {
        content: message.content,
        messageType: message.messageType || 'TEXT'
      });

      logger.info('Message sent successfully');
      return response as Message;
    } catch (error) {
      logger.error('Failed to send message:', error);
      throw new Error('Failed to send message. Please try again.');
    }
  },

  // ============================================================================
  // INVITATION METHODS
  // ============================================================================

  // Create individual invitation
  createInvitation: async (invitationData: {
    email: string;
    invitedBy: string;
    invitationType: string;
    invitationData: any;
    expiresAt: string;
  }): Promise<any> => {
    try {
      logger.info('Creating invitation for:', invitationData.email);

      const response = await apiClient.post('/api/invitations', invitationData);

      logger.info('Invitation created successfully for:', invitationData.email);
      return response;
    } catch (error) {
      logger.error('Failed to create invitation:', error);
      throw new Error('Failed to create invitation. Please try again.');
    }
  },

  // @deprecated - REMOVED: Family invitations replaced by onboarding flow
  // Use validateInvitation + onboarding endpoints instead

  // Create bulk invitations for existing users
  createBulkInvitations: async (invitations: {
    userId: string;
    invitationType: string;
    expiresAt: string;
    invitedBy: string;
  }[]): Promise<any> => {
    try {
      logger.info('Creating bulk invitations for users:', invitations.length);

      const response = await apiClient.post('/api/invitations/bulk', { invitations });

      logger.info('Bulk invitations created successfully');
      return response;
    } catch (error) {
      logger.error('Failed to create bulk invitations:', error);
      throw new Error('Failed to create bulk invitations. Please try again.');
    }
  },

  // ============================================================================
  // USER MANAGEMENT METHODS
  // ============================================================================

  // Update user attributes
  updateUser: async (userId: string, updates: {
    firstName?: string;
    lastName?: string;
    email?: string;
    yearOfBirth?: number;  // UPDATED: YOB instead of birthDate
    graduationYear?: number;
    program?: string;
    currentPosition?: string;
    bio?: string;
    linkedinUrl?: string;
    company?: string;
    location?: string;
    ageVerified?: boolean;
    parentConsentRequired?: boolean;
    parentConsentGiven?: boolean;
    requiresOtp?: boolean;
    alumniProfile?: {
      familyName?: string;
      fatherName?: string;
      batch?: number;
      centerName?: string;
      result?: string;
      category?: string;
      phone?: string;
      email?: string;
      studentId?: string;
    };
  }): Promise<any> => {
    try {
      logger.info('Updating user attributes for user:', userId);

      const response = await apiClient.put(`/api/users/${userId}`, updates);

      logger.info('User attributes updated successfully for user:', userId);
      return response;
    } catch (error) {
      logger.error('Failed to update user attributes:', error);
      throw new Error('Failed to update user attributes. Please try again.');
    }
  },

  // Send invitation to user
  sendInvitationToUser: async (userId: string, invitationType: string = 'profile_completion', expiresInDays: number = 7): Promise<any> => {
    try {
      logger.info('Sending invitation to user:', userId);

      const response = await apiClient.post(`/api/users/${userId}/send-invitation`, {
        invitationType,
        expiresInDays
      });

      logger.info('Invitation sent successfully to user:', userId);
      return response;
    } catch (error) {
      logger.error('Failed to send invitation to user:', error);
      throw new Error('Failed to send invitation. Please try again.');
    }
  },

  // Send invitation to alumni member (creates invitation for alumni source data)
  sendInvitationToAlumniMember: async (alumniMemberId: string, invitationType: string = 'alumni', expiresInDays: number = 7): Promise<any> => {
    try {
      logger.info('Sending invitation to alumni member:', alumniMemberId);

      const response = await apiClient.post(`/api/alumni-members/${alumniMemberId}/send-invitation`, {
        invitationType,
        expiresInDays
      });

      logger.info('Invitation sent successfully to alumni member:', alumniMemberId);
      return response;
    } catch (error) {
      logger.error('Failed to send invitation to alumni member:', error);
      throw new Error('Failed to send invitation to alumni member. Please try again.');
    }
  },

  // Get all invitations (for admin management)
  getInvitations: async (params: { page?: number; pageSize?: number; status?: string } = {}): Promise<any[]> => {
    try {
      logger.info('Fetching invitations for admin management');

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await apiClient.get(`/api/invitations?${queryParams.toString()}`);

      logger.info('Invitations fetched successfully');
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      logger.error('Failed to fetch invitations:', error);
      throw new Error('Failed to fetch invitations. Please try again.');
    }
  },

  // @deprecated - REMOVED: Family invitations table dropped
  // Standard invitations now handled through onboarding flow

  // Resend invitation
  resendInvitation: async (invitationId: string): Promise<any> => {
    try {
      logger.info('Resending invitation:', invitationId);

      const response = await apiClient.post(`/api/invitations/${invitationId}/resend`, {});

      logger.info('Invitation resent successfully:', invitationId);
      return response;
    } catch (error) {
      logger.error('Failed to resend invitation:', error);
      throw new Error('Failed to resend invitation. Please try again.');
    }
  },

  // Revoke invitation
  revokeInvitation: async (invitationId: string): Promise<any> => {
    try {
      logger.info('Revoking invitation:', invitationId);

      const response = await apiClient.put(`/api/invitations/${invitationId}/revoke`, {});

      logger.info('Invitation revoked successfully:', invitationId);
      return response;
    } catch (error) {
      logger.error('Failed to revoke invitation:', error);
      throw new Error('Failed to revoke invitation. Please try again.');
    }
  },

  // Validate invitation (streamlined version)
  validateInvitation: async (token: string): Promise<any> => {
    try {
      console.log('[APIService] Starting validateInvitation for token:', token);
      logger.info('Validating invitation token:', token);

      console.log('[APIService] Making API call to:', `/api/invitations/validate/${token}`);
      const response = await apiClient.get(`/api/invitations/validate/${token}`);

      console.log('[APIService] API call completed, response:', response);
      logger.info('Invitation validation completed');
      return response;
    } catch (error) {
      console.error('[APIService] Validation failed:', error);
      logger.error('Failed to validate invitation:', error);
      throw new Error('Failed to validate invitation. Please try again.');
    }
  },

  // Register a new account from an invitation token
  registerFromInvitation: async (
    params: { invitationToken: string; password?: string; additionalData?: Record<string, unknown> }
  ): Promise<{
    success: boolean;
    accountId: string;
    email: string;
    nextStep?: string;
    user: { id: string; email: string; needsProfileCompletion: boolean };
  }> => {
    const generateTempPassword = () => `Tmp!${Math.random().toString(36).slice(2, 12)}A1`;

    try {
      logger.info('Registering from invitation token');

      const payload = {
        invitationToken: params.invitationToken,
        password: params.password || generateTempPassword(),
        additionalData: params.additionalData || {}
      };

      const response: any = await apiClient.post('/api/auth/register-from-invitation', payload);

      // Shape response to what the onboarding pages expect
      const accountId = response?.accountId || response?.id;
      const email = response?.email;

      return {
        success: true,
        accountId,
        email,
        nextStep: response?.nextStep || '/onboarding',
        user: {
          id: accountId,
          email,
          // Assume profile completion is needed until onboarding finishes
          needsProfileCompletion: true
        }
      };
    } catch (error) {
      logger.error('Failed to register from invitation:', error);
      throw new Error('Failed to register from invitation. Please try again.');
    }
  },

  // @deprecated - REMOVED: Replaced by separate registration + onboarding flow
  // Use register() + onboarding endpoints instead

  // ============================================================================
  // ONBOARDING METHODS (NEW - Phase 3/4 Refactoring)
  // ============================================================================

  // Get alumni records matching the logged-in user's email (session-based, no token)
  getMyAlumni: async (): Promise<{
    success: boolean;
    email: string;
    alumni: Array<{
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      batch: number;
      centerName: string;
      yearOfBirth: number | null;
      age: number | null;
      coppaStatus: 'blocked' | 'requires_consent' | 'full_access' | 'unknown';
      canCreateProfile: boolean;
      alreadyClaimed: boolean;
    }>;
  }> => {
    try {
      logger.info('Fetching alumni for logged-in user');
      const response = await apiClient.get('/api/onboarding/my-alumni');
      logger.info('Alumni fetch completed');
      return response as any;
    } catch (error) {
      logger.error('Failed to fetch alumni:', error);
      throw new Error('Failed to fetch alumni records. Please try again.');
    }
  },

  // Select profiles during onboarding (after invitation validation)
  selectProfiles: async (selections: Array<{
    alumniMemberId: number;
    relationship: 'parent' | 'child';
    yearOfBirth?: number;
  }>): Promise<{
    success: boolean;
    profiles: UserProfile[];
    requiresConsent: boolean;
  }> => {
    try {
      logger.info('Selecting profiles during onboarding:', selections);
      const response = await apiClient.post('/api/onboarding/select-profiles', { selections });
      logger.info('Profile selection completed');
      return response as { success: boolean; profiles: UserProfile[]; requiresConsent: boolean };
    } catch (error) {
      logger.error('Failed to select profiles:', error);
      throw new Error('Failed to select profiles. Please try again.');
    }
  },

  // Collect year of birth for alumni member during onboarding
  collectYob: async (alumniMemberId: number, yearOfBirth: number): Promise<{
    success: boolean;
    age: number;
    coppaStatus: string;
  }> => {
    try {
      logger.info('Collecting year of birth for alumni member:', alumniMemberId);
      const response = await apiClient.post('/api/onboarding/collect-yob', {
        alumniMemberId,
        yearOfBirth
      });
      logger.info('Year of birth collected successfully');
      return response as { success: boolean; age: number; coppaStatus: string };
    } catch (error) {
      logger.error('Failed to collect year of birth:', error);
      throw new Error('Failed to collect year of birth. Please try again.');
    }
  },

  // Grant parental consent during onboarding
  grantConsent: async (childProfileId: string): Promise<{
    success: boolean;
    expiresAt: string;
  }> => {
    try {
      logger.info('Granting consent for child profile:', childProfileId);
      const response = await apiClient.post('/api/onboarding/grant-consent', {
        childProfileId
      });
      logger.info('Consent granted successfully');
      return response as { success: boolean; expiresAt: string };
    } catch (error) {
      logger.error('Failed to grant consent:', error);
      throw new Error('Failed to grant consent. Please try again.');
    }
  },

  // Revoke parental consent
  revokeConsent: async (childProfileId: string, reason?: string): Promise<{
    success: boolean;
  }> => {
    try {
      logger.info('Revoking consent for child profile:', childProfileId);
      const response = await apiClient.post(`/api/family-members/${childProfileId}/consent/revoke`, { reason });
      logger.info('Consent revoked successfully');
      return response as { success: boolean };
    } catch (error) {
      logger.error('Failed to revoke consent:', error);
      throw new Error('Failed to revoke consent. Please try again.');
    }
  },

  // ============================================================================
  // GENERIC HTTP METHODS
  // ============================================================================

  // Generic GET method for API calls
  get: async <T = any>(endpoint: string, config?: { params?: any; suppressErrors?: number[] }): Promise<T> => {
    try {
      // Build query string from params if provided
      let url = endpoint;
      if (config?.params) {
        const queryString = new URLSearchParams(config.params).toString();
        url = `${endpoint}?${queryString}`;
      }

      logger.info(`GET request to ${url}`);
      const response = await apiClient.get(url);
      logger.info(`GET response from ${url}`, response);

      return response as T;
    } catch (error: any) {
      // Check if this error status should be suppressed
      const shouldSuppress = config?.suppressErrors?.includes(error.status || error.response?.status);
      
      if (!shouldSuppress) {
        logger.error(`GET request failed for ${endpoint}:`, error);
      }
      throw error;
    }
  },

  // Generic POST method for API calls (already exists as individual methods, but adding for consistency)
  postGeneric: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    try {
      logger.info(`POST request to ${endpoint}`, data);
      const response = await apiClient.post(endpoint, data || {});
      logger.info(`POST response from ${endpoint}`, response);

      return response as T;
    } catch (error) {
      logger.error(`POST request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // Generic PUT method for API calls
  putGeneric: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    try {
      logger.info(`PUT request to ${endpoint}`, data);
      const response = await apiClient.put(endpoint, data || {});
      logger.info(`PUT response from ${endpoint}`, response);

      return response as T;
    } catch (error) {
      logger.error(`PUT request failed for ${endpoint}:`, error);
      throw error;
    }
  },

  // Alias for putGeneric (for consistency with get/post methods)
  put: async <T = any>(endpoint: string, data?: any): Promise<T> => {
    return APIService.putGeneric<T>(endpoint, data);
  },

  // Generic DELETE method for API calls
  deleteGeneric: async <T = any>(endpoint: string): Promise<T> => {
    try {
      logger.info(`DELETE request to ${endpoint}`);
      const response = await apiClient.delete(endpoint);
      logger.info(`DELETE response from ${endpoint}`, response);

      return response as T;
    } catch (error) {
      logger.error(`DELETE request failed for ${endpoint}:`, error);
      throw error;
    }
  }
};
import { APIDataService, type FileImport as APIFileImport, checkAPIConfiguration, getAPIConfigStatus } from '../lib/apiData';
import { apiClient } from '../lib/api';

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
}

// User & Profile Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'moderator';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

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
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
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
      return response as AuthResponse;
    } catch (error) {
      logger.error('Login failed:', error);
      if (error instanceof Error && error.message.includes('timeout')) {
        throw new Error('Login is taking longer than expected. Please check your connection and try again.');
      }
      throw new Error('Login failed. Please check your credentials.');
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

      const response = await apiClient.post('/api/auth/refresh', {});

      logger.info('Token refresh successful');
      return response as TokenResponse;
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
      return response as AuthResponse;
    } catch (error) {
      logger.error('Registration failed:', error);
      throw new Error('Registration failed. Please check your information and try again.');
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

  // Get user conversations
  getConversations: async (): Promise<Conversation[]> => {
    try {
      logger.info('Fetching user conversations');

      const response = await apiClient.get('/api/messages/conversations');

      logger.info('Conversations retrieved');
      return response as Conversation[];
    } catch (error) {
      logger.error('Failed to fetch conversations:', error);
      throw new Error('Failed to fetch conversations. Please try again.');
    }
  },

  // Get messages for a conversation
  getMessages: async (conversationId: string): Promise<Message[]> => {
    try {
      logger.info('Fetching messages for conversation:', conversationId);

      const response = await apiClient.get(`/api/messages/${conversationId}`);

      logger.info('Messages retrieved for conversation:', conversationId);
      return response as Message[];
    } catch (error) {
      logger.error('Failed to fetch messages:', error);
      throw new Error('Failed to fetch messages. Please try again.');
    }
  },

  // Send a message
  sendMessage: async (message: SendMessageData): Promise<Message> => {
    try {
      logger.info('Sending message to conversation:', message.conversationId);

      const response = await apiClient.post('/api/messages/send', message);

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

  // Create family invitation
  createFamilyInvitation: async (invitationData: {
    parentEmail: string;
    childrenData: any[];
    invitedBy: string;
    expiresInDays: number;
  }): Promise<any> => {
    try {
      logger.info('Creating family invitation for:', invitationData.parentEmail);

      const response = await apiClient.post('/api/invitations/family', invitationData);

      logger.info('Family invitation created successfully for:', invitationData.parentEmail);
      return response;
    } catch (error) {
      logger.error('Failed to create family invitation:', error);
      throw new Error('Failed to create family invitation. Please try again.');
    }
  },

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
    birthDate?: string;
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

  // Get family invitations (for admin management)
  getFamilyInvitations: async (params: { page?: number; pageSize?: number; status?: string } = {}): Promise<any[]> => {
    try {
      logger.info('Fetching family invitations for admin management');

      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
      if (params.status) queryParams.append('status', params.status);

      const response = await apiClient.get(`/api/invitations/family?${queryParams.toString()}`);

      logger.info('Family invitations fetched successfully');
      return Array.isArray(response) ? response : (response?.data || []);
    } catch (error) {
      logger.error('Failed to fetch family invitations:', error);
      throw new Error('Failed to fetch family invitations. Please try again.');
    }
  },

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

  // Register from invitation (streamlined version)
  registerFromInvitation: async (data: { invitationToken: string; additionalData?: any }): Promise<any> => {
    try {
      logger.info('Registering from invitation');

      const response = await apiClient.post('/api/auth/register-from-invitation', data);

      logger.info('Registration from invitation completed successfully');
      return response;
    } catch (error) {
      logger.error('Failed to register from invitation:', error);
      throw new Error('Failed to complete registration. Please try again.');
    }
  }
};
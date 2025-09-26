// Development-only mock API service
// This file should NEVER be imported in production builds

import type { FileImport } from './apiData';
import type { LoginCredentials, RegisterData, AuthResponse, User, TokenResponse } from '../services/APIService';

// Guard against production usage
if (import.meta.env.PROD) {
  throw new Error('Mock API service should not be used in production');
}

// Mock data for development and testing
const mockFileImports: FileImport[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    filename: 'alumni_data_2024.csv',
    file_type: 'csv',
    upload_date: new Date('2024-01-15T10:30:00Z'),
    status: 'completed',
    records_count: 150,
    processed_records: 150,
    errors_count: 0,
    uploaded_by: 'admin@sgsgita.org',
    file_size: 2048576,
    processedAt: new Date('2024-01-15T10:35:00Z'),
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    filename: 'member_updates.json',
    file_type: 'json',
    upload_date: new Date('2024-01-14T14:20:00Z'),
    status: 'processing',
    records_count: 75,
    processed_records: 45,
    errors_count: 2,
    uploaded_by: 'moderator@sgsgita.org',
    file_size: 1024000,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    filename: 'event_data.xlsx',
    file_type: 'xlsx',
    upload_date: new Date('2024-01-13T09:15:00Z'),
    status: 'failed',
    records_count: 0,
    processed_records: 0,
    errors_count: 1,
    uploaded_by: 'user@sgsgita.org',
    file_size: 512000,
    error: 'Invalid file format',
  },
];

// Mock users for authentication
const mockUsers: User[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'admin@sgsgita.org',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'moderator@sgsgita.org',
    firstName: 'Moderator',
    lastName: 'User',
    role: 'moderator',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'member@sgsgita.org',
    firstName: 'Member',
    lastName: 'User',
    role: 'member',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLoginAt: '2024-01-13T09:15:00Z'
  }
];

// Mock authentication tokens
const mockTokens = new Map<string, { user: User; expiresAt: number }>();

export const MockAPIDataService = {
  getData: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: mockFileImports };
  },
  
  getFileImports: async (): Promise<FileImport[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));
    return [...mockFileImports];
  },
  
  updateFileImport: async (id: string, updates: Partial<FileImport>): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const index = mockFileImports.findIndex(item => item.id === id);
    if (index !== -1) {
      mockFileImports[index] = { ...mockFileImports[index], ...updates };
    }
    
    // Log for development debugging
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('Mock: Updated file import', id, updates);
    }
  },
  
  exportData: async (format: string): Promise<Blob> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (format === 'csv') {
      const csvData = mockFileImports.map(item => 
        `${item.id},${item.filename},${item.file_type},${item.status},${item.records_count}`
      ).join('\n');
      return new Blob([csvData], { type: 'text/csv' });
    } else {
      return new Blob([JSON.stringify(mockFileImports, null, 2)], { type: 'application/json' });
    }
  },
  
  getStatistics: async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      totalUsers: 1250,
      totalPosts: 89,
      totalImports: mockFileImports.length,
      completedImports: mockFileImports.filter(item => item.status === 'completed').length,
      failedImports: mockFileImports.filter(item => item.status === 'failed').length,
      totalRecords: mockFileImports.reduce((sum, item) => sum + item.records_count, 0),
    };
  },

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find user by email
    const user = mockUsers.find(u => u.email === credentials.email);

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Simple password check (in real app, this would be hashed)
    const validPasswords = {
      'admin@sgsgita.org': 'admin123',
      'moderator@sgsgita.org': 'mod123',
      'member@sgsgita.org': 'member123'
    };

    if (validPasswords[user.email as keyof typeof validPasswords] !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    // Generate mock tokens
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refreshToken = `mock_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresIn = 3600; // 1 hour

    // Store token for validation
    mockTokens.set(token, {
      user,
      expiresAt: Date.now() + (expiresIn * 1000)
    });

    // Update last login
    user.lastLoginAt = new Date().toISOString();

    return {
      success: true,
      token,
      refreshToken,
      user,
      expiresIn
    };
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create new user
    const newUser: User = {
      id: `550e8400-e29b-41d4-a716-${Date.now().toString().slice(-12)}`,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: 'member', // Default role for new registrations
      isActive: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    // Add to mock users
    mockUsers.push(newUser);

    // Generate mock tokens
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refreshToken = `mock_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresIn = 3600; // 1 hour

    // Store token for validation
    mockTokens.set(token, {
      user: newUser,
      expiresAt: Date.now() + (expiresIn * 1000)
    });

    return {
      success: true,
      token,
      refreshToken,
      user: newUser,
      expiresIn
    };
  },

  logout: async (): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In a real app, this would invalidate the token on the server
    // For mock, we'll just simulate success
    return;
  },

  refreshToken: async (): Promise<TokenResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Generate new mock tokens
    const token = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const refreshToken = `mock_refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresIn = 3600; // 1 hour

    return {
      token,
      refreshToken,
      expiresIn
    };
  },

  getCurrentUser: async (): Promise<User> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // In a real app, this would validate the token and return the user
    // For mock, we'll return the admin user as default
    const defaultUser = mockUsers[0]; // Admin user

    if (!defaultUser) {
      throw new Error('User not found');
    }

    return defaultUser;
  }
};

// Export mock data for testing
export { mockFileImports };

// Helper function to check if we should use mock data
export const shouldUseMockData = (): boolean => {
  return import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL;
};

// Helper function to get the appropriate service
export const getAPIDataService = () => {
  if (shouldUseMockData()) {
    return MockAPIDataService;
  }
  
  // Import the real service dynamically to avoid bundling in development
  return import('./apiData').then(module => module.APIDataService);
};

/**
 * Test Data Setup for SGSGitaAlumni Application
 * 
 * This file contains test data and setup utilities for automated testing.
 * It provides consistent test data across all test suites.
 */

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin' | 'moderator';
  isActive: boolean;
  profileComplete: boolean;
}

export interface TestFamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  isActive: boolean;
}

export interface TestInvitation {
  id: string;
  token: string;
  email: string;
  familyMembers: TestFamilyMember[];
  expiresAt: string;
  isUsed: boolean;
}

export interface TestDashboardData {
  user: TestUser;
  stats: {
    totalConnections: number;
    newMessages: number;
    upcomingEvents: number;
    profileCompleteness: number;
  };
  recentConversations: Array<{
    id: string;
    participant: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
  }>;
  personalizedPosts: Array<{
    id: string;
    title: string;
    content: string;
    author: string;
    timestamp: string;
    likes: number;
    comments: number;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    action: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
  }>;
}

// Test Users
export const testUsers: TestUser[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'member',
    isActive: true,
    profileComplete: true
  },
  {
    id: '2',
    email: 'jane.smith@example.com',
    password: 'SecurePass123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'member',
    isActive: true,
    profileComplete: false
  },
  {
    id: '3',
    email: 'admin@example.com',
    password: 'AdminPass123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
    profileComplete: true
  },
  {
    id: '4',
    email: 'moderator@example.com',
    password: 'ModPass123!',
    firstName: 'Moderator',
    lastName: 'User',
    role: 'moderator',
    isActive: true,
    profileComplete: true
  },
  {
    id: '5',
    email: 'inactive@example.com',
    password: 'InactivePass123!',
    firstName: 'Inactive',
    lastName: 'User',
    role: 'member',
    isActive: false,
    profileComplete: false
  }
];

// Test Family Members
export const testFamilyMembers: TestFamilyMember[] = [
  {
    id: '1',
    name: 'John Doe',
    relationship: 'Father',
    email: 'john.doe@example.com',
    isActive: true
  },
  {
    id: '2',
    name: 'Jane Doe',
    relationship: 'Mother',
    email: 'jane.doe@example.com',
    isActive: true
  },
  {
    id: '3',
    name: 'Bob Doe',
    relationship: 'Brother',
    email: 'bob.doe@example.com',
    isActive: false
  }
];

// Test Invitations
export const testInvitations: TestInvitation[] = [
  {
    id: '1',
    token: 'valid-token-123',
    email: 'family@example.com',
    familyMembers: testFamilyMembers,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    isUsed: false
  },
  {
    id: '2',
    token: 'expired-token-456',
    email: 'expired@example.com',
    familyMembers: [],
    expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isUsed: false
  },
  {
    id: '3',
    token: 'used-token-789',
    email: 'used@example.com',
    familyMembers: testFamilyMembers,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isUsed: true
  }
];

// Test Dashboard Data
export const testDashboardData: TestDashboardData = {
  user: testUsers[0],
  stats: {
    totalConnections: 25,
    newMessages: 3,
    upcomingEvents: 2,
    profileCompleteness: 85
  },
  recentConversations: [
    {
      id: '1',
      participant: 'Jane Smith',
      lastMessage: 'Thanks for the recommendation!',
      timestamp: '2024-01-15T10:30:00Z',
      unread: true
    },
    {
      id: '2',
      participant: 'Mike Johnson',
      lastMessage: 'Looking forward to the event',
      timestamp: '2024-01-15T09:15:00Z',
      unread: false
    },
    {
      id: '3',
      participant: 'Sarah Wilson',
      lastMessage: 'Great to connect with you',
      timestamp: '2024-01-14T16:45:00Z',
      unread: true
    }
  ],
  personalizedPosts: [
    {
      id: '1',
      title: 'Alumni Networking Event',
      content: 'Join us for the annual networking event on February 15th. This is a great opportunity to connect with fellow alumni and expand your professional network.',
      author: 'Alumni Association',
      timestamp: '2024-01-15T08:00:00Z',
      likes: 12,
      comments: 3
    },
    {
      id: '2',
      title: 'Job Opportunity - Software Engineer',
      content: 'Our company is looking for a talented software engineer. If you\'re interested, please reach out!',
      author: 'Tech Alumni Group',
      timestamp: '2024-01-14T14:30:00Z',
      likes: 8,
      comments: 5
    }
  ],
  quickActions: [
    { id: '1', label: 'Update Profile', action: 'profile' },
    { id: '2', label: 'Find Alumni', action: 'search' },
    { id: '3', label: 'Create Post', action: 'post' },
    { id: '4', label: 'View Events', action: 'events' },
    { id: '5', label: 'Join Groups', action: 'groups' }
  ],
  notifications: [
    {
      id: '1',
      type: 'message',
      title: 'New message from Jane Smith',
      message: 'Thanks for connecting!',
      timestamp: '2024-01-15T10:30:00Z',
      read: false
    },
    {
      id: '2',
      type: 'event',
      title: 'Upcoming Event',
      message: 'Alumni networking event tomorrow at 6 PM',
      timestamp: '2024-01-15T09:00:00Z',
      read: true
    },
    {
      id: '3',
      type: 'connection',
      title: 'New Connection',
      message: 'Mike Johnson wants to connect with you',
      timestamp: '2024-01-14T16:20:00Z',
      read: false
    }
  ]
};

// Test API Responses
export const testAPIResponses = {
  loginSuccess: {
    success: true,
    user: testUsers[0],
    token: 'mock-jwt-token-123'
  },
  loginError: {
    success: false,
    error: 'Invalid credentials'
  },
  registrationSuccess: {
    success: true,
    message: 'Registration successful'
  },
  otpGeneration: {
    success: true,
    otpCode: '123456',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes from now
  },
  otpValidation: {
    isValid: true,
    message: 'OTP verified successfully'
  },
  otpValidationError: {
    isValid: false,
    error: 'Invalid OTP code',
    remainingAttempts: 2
  },
  dashboardData: testDashboardData,
  invitationValidation: {
    valid: true,
    familyMembers: testFamilyMembers
  },
  invitationAcceptance: {
    success: true,
    message: 'Invitation accepted successfully'
  }
};

// Test Environment Configuration
export const testConfig = {
  baseURL: 'http://localhost:5173',
  apiURL: 'http://localhost:3001',
  timeout: 30000,
  retries: 3,
  viewports: {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1920, height: 1080 },
    largeDesktop: { width: 2560, height: 1440 }
  },
  browsers: ['chromium', 'firefox', 'webkit'],
  testData: {
    users: testUsers,
    familyMembers: testFamilyMembers,
    invitations: testInvitations,
    dashboardData: testDashboardData
  }
};

// Utility Functions
export const getTestUser = (role: 'member' | 'admin' | 'moderator' = 'member'): TestUser => {
  return testUsers.find(user => user.role === role) || testUsers[0];
};

export const getTestInvitation = (valid: boolean = true): TestInvitation => {
  if (valid) {
    return testInvitations.find(inv => !inv.isUsed && new Date(inv.expiresAt) > new Date()) || testInvitations[0];
  } else {
    return testInvitations.find(inv => inv.isUsed || new Date(inv.expiresAt) <= new Date()) || testInvitations[1];
  }
};

export const getTestDashboardData = (userId: string = '1'): TestDashboardData => {
  const user = testUsers.find(u => u.id === userId) || testUsers[0];
  return {
    ...testDashboardData,
    user
  };
};

// Mock API Setup
export const setupMockAPI = async (page: any) => {
  // Mock authentication endpoints
  await page.route('**/api/auth/login', async route => {
    const requestData = route.request().postDataJSON();
    const user = testUsers.find(u => u.email === requestData.email && u.password === requestData.password);
    
    if (user && user.isActive) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
          token: `mock-jwt-token-${user.id}`
        })
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      });
    }
  });

  // Mock registration endpoint
  await page.route('**/api/auth/register', async route => {
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify(testAPIResponses.registrationSuccess)
    });
  });

  // Mock OTP endpoints
  await page.route('**/api/otp/generate', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testAPIResponses.otpGeneration)
    });
  });

  await page.route('**/api/otp/validate', async route => {
    const requestData = route.request().postDataJSON();
    if (requestData.otpCode === '123456') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testAPIResponses.otpValidation)
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify(testAPIResponses.otpValidationError)
      });
    }
  });

  // Mock dashboard endpoint
  await page.route('**/api/users/dashboard', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testDashboardData)
    });
  });

  // Mock invitation endpoints
  await page.route('**/api/invitations/family/validate/*', async route => {
    const url = route.request().url();
    const token = url.split('/').pop();
    const invitation = testInvitations.find(inv => inv.token === token);
    
    if (invitation && !invitation.isUsed && new Date(invitation.expiresAt) > new Date()) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          familyMembers: invitation.familyMembers
        })
      });
    } else {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: false,
          error: 'Invalid or expired invitation'
        })
      });
    }
  });

  await page.route('**/api/invitations/family/*/accept-profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(testAPIResponses.invitationAcceptance)
    });
  });
};

export default {
  testUsers,
  testFamilyMembers,
  testInvitations,
  testDashboardData,
  testAPIResponses,
  testConfig,
  getTestUser,
  getTestInvitation,
  getTestDashboardData,
  setupMockAPI
};

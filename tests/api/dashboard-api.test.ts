/**
 * API Testing Scripts for Dashboard Endpoints
 * 
 * This file contains comprehensive API tests for dashboard-related endpoints
 * including user profile, dashboard data, and analytics.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('Dashboard API Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get authentication token
    const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test.describe('User Profile Endpoint', () => {
    test('should get current user profile', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('firstName');
      expect(data).toHaveProperty('lastName');
      expect(data).toHaveProperty('role');
    });

    test('should update user profile', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          firstName: 'John Updated',
          lastName: 'Doe Updated',
          bio: 'Updated bio information'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
    });

    test('should reject profile update without authentication', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/users/profile`, {
        data: {
          firstName: 'John Updated'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should validate profile update data', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          firstName: '', // Empty first name
          email: 'invalid-email' // Invalid email format
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Dashboard Data Endpoint', () => {
    test('should get dashboard data', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('recentConversations');
      expect(data).toHaveProperty('personalizedPosts');
      expect(data).toHaveProperty('quickActions');
      expect(data).toHaveProperty('notifications');
    });

    test('should get dashboard stats', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data.stats).toHaveProperty('totalConnections');
      expect(data.stats).toHaveProperty('newMessages');
      expect(data.stats).toHaveProperty('upcomingEvents');
      expect(data.stats).toHaveProperty('profileCompleteness');
    });

    test('should get recent conversations', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.recentConversations)).toBe(true);
      
      if (data.recentConversations.length > 0) {
        const conversation = data.recentConversations[0];
        expect(conversation).toHaveProperty('id');
        expect(conversation).toHaveProperty('participant');
        expect(conversation).toHaveProperty('lastMessage');
        expect(conversation).toHaveProperty('timestamp');
        expect(conversation).toHaveProperty('unread');
      }
    });

    test('should get personalized posts', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.personalizedPosts)).toBe(true);
      
      if (data.personalizedPosts.length > 0) {
        const post = data.personalizedPosts[0];
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('content');
        expect(post).toHaveProperty('author');
        expect(post).toHaveProperty('timestamp');
      }
    });

    test('should get quick actions', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.quickActions)).toBe(true);
      
      if (data.quickActions.length > 0) {
        const action = data.quickActions[0];
        expect(action).toHaveProperty('id');
        expect(action).toHaveProperty('label');
        expect(action).toHaveProperty('action');
      }
    });

    test('should get notifications', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.notifications)).toBe(true);
      
      if (data.notifications.length > 0) {
        const notification = data.notifications[0];
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('title');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('timestamp');
        expect(notification).toHaveProperty('read');
      }
    });

    test('should reject dashboard access without authentication', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`);

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Alumni Profile Endpoint', () => {
    test('should get alumni profile', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/profiles/alumni/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('graduationYear');
      expect(data).toHaveProperty('major');
      expect(data).toHaveProperty('educationHistory');
      expect(data).toHaveProperty('careerHistory');
    });

    test('should update alumni profile', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/profiles/alumni/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          graduationYear: 2020,
          major: 'Computer Science',
          bio: 'Software engineer with 5 years experience'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('profile');
    });

    test('should add education history', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/profiles/1/education`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          institution: 'University of Technology',
          degree: 'Bachelor of Science',
          field: 'Computer Science',
          startDate: '2016-09-01',
          endDate: '2020-06-01',
          gpa: 3.8
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('education');
    });

    test('should update education history', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/profiles/1/education/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          institution: 'Updated University',
          degree: 'Master of Science',
          field: 'Software Engineering',
          startDate: '2020-09-01',
          endDate: '2022-06-01',
          gpa: 3.9
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should delete education history', async ({ request }) => {
      const response = await request.delete(`${API_BASE_URL}/api/profiles/1/education/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });
  });

  test.describe('User Preferences Endpoint', () => {
    test('should get user preferences', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/preferences`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('theme');
      expect(data).toHaveProperty('notifications');
      expect(data).toHaveProperty('privacy');
    });

    test('should update user preferences', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/users/preferences`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            sms: false
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showPhone: false
          }
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('preferences');
    });
  });

  test.describe('Analytics Endpoint', () => {
    test('should get user analytics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/analytics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('profileViews');
      expect(data).toHaveProperty('connections');
      expect(data).toHaveProperty('posts');
      expect(data).toHaveProperty('activity');
    });

    test('should get analytics for date range', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/analytics?startDate=2024-01-01&endDate=2024-01-31`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('profileViews');
      expect(data).toHaveProperty('connections');
      expect(data).toHaveProperty('posts');
      expect(data).toHaveProperty('activity');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully', async ({ request }) => {
      // Mock server error by using invalid endpoint
      const response = await request.get(`${API_BASE_URL}/api/users/invalid-endpoint`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(404);
    });

    test('should handle network timeouts', async ({ request }) => {
      // This test would require a timeout configuration
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        timeout: 1000 // 1 second timeout
      });

      // Should either succeed or timeout
      expect([200, 408]).toContain(response.status());
    });

    test('should handle malformed JSON requests', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: 'invalid json'
      });

      expect(response.status()).toBe(400);
    });
  });

  test.describe('Performance Tests', () => {
    test('should respond within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle concurrent requests', async ({ request }) => {
      const promises = Array(10).fill(null).map(() => 
        request.get(`${API_BASE_URL}/api/users/dashboard`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });
});

/**
 * API Testing Scripts for Dashboard Endpoints
 * 
 * This file contains comprehensive API tests for all dashboard-related endpoints
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

    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test.describe('User Dashboard Endpoint', () => {
    test('should get dashboard data for authenticated user', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check response structure
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('stats');
      expect(data).toHaveProperty('recentConversations');
      expect(data).toHaveProperty('personalizedPosts');
      expect(data).toHaveProperty('quickActions');
      expect(data).toHaveProperty('notifications');
      
      // Check user data
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email');
      expect(data.user).toHaveProperty('firstName');
      expect(data.user).toHaveProperty('lastName');
      
      // Check stats
      expect(data.stats).toHaveProperty('totalConnections');
      expect(data.stats).toHaveProperty('newMessages');
      expect(data.stats).toHaveProperty('upcomingEvents');
      expect(data.stats).toHaveProperty('profileCompleteness');
      
      // Check data types
      expect(typeof data.stats.totalConnections).toBe('number');
      expect(typeof data.stats.newMessages).toBe('number');
      expect(typeof data.stats.upcomingEvents).toBe('number');
      expect(typeof data.stats.profileCompleteness).toBe('number');
    });

    test('should reject unauthenticated requests', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`);

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject requests with invalid token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle pagination for large datasets', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard?page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check pagination metadata
      expect(data).toHaveProperty('pagination');
      expect(data.pagination).toHaveProperty('page');
      expect(data.pagination).toHaveProperty('limit');
      expect(data.pagination).toHaveProperty('total');
      expect(data.pagination).toHaveProperty('totalPages');
    });

    test('should filter data based on query parameters', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/dashboard?includeArchived=false`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check that archived items are excluded
      if (data.recentConversations) {
        data.recentConversations.forEach((conversation: any) => {
          expect(conversation.archived).toBeFalsy();
        });
      }
    });
  });

  test.describe('User Profile Endpoint', () => {
    test('should get user profile data', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check profile structure
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('firstName');
      expect(data).toHaveProperty('lastName');
      expect(data).toHaveProperty('role');
      expect(data).toHaveProperty('profileComplete');
      expect(data).toHaveProperty('createdAt');
      expect(data).toHaveProperty('updatedAt');
    });

    test('should update user profile', async ({ request }) => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        bio: 'Updated bio',
        location: 'Updated location'
      };

      const response = await request.put(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: updateData
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    test('should validate profile update data', async ({ request }) => {
      const invalidData = {
        firstName: '', // Empty first name
        lastName: '', // Empty last name
        email: 'invalid-email' // Invalid email format
      };

      const response = await request.put(`${API_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: invalidData
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle profile image upload', async ({ request }) => {
      // Create a test image file
      const imageBuffer = Buffer.from('fake-image-data');
      
      const response = await request.post(`${API_BASE_URL}/api/users/profile/image`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        multipart: {
          image: {
            name: 'profile.jpg',
            mimeType: 'image/jpeg',
            buffer: imageBuffer
          }
        }
      });

      // Should either succeed or return appropriate error
      expect([200, 400, 413]).toContain(response.status());
    });
  });

  test.describe('Analytics Endpoint', () => {
    test('should get user analytics data', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/analytics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check analytics structure
      expect(data).toHaveProperty('userStats');
      expect(data).toHaveProperty('activityData');
      expect(data).toHaveProperty('engagementMetrics');
      
      // Check user stats
      expect(data.userStats).toHaveProperty('totalConnections');
      expect(data.userStats).toHaveProperty('messagesSent');
      expect(data.userStats).toHaveProperty('postsCreated');
      expect(data.userStats).toHaveProperty('eventsAttended');
    });

    test('should get analytics for specific date range', async ({ request }) => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      const response = await request.get(`${API_BASE_URL}/api/users/analytics?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check that data is filtered by date range
      expect(data).toHaveProperty('dateRange');
      expect(data.dateRange).toHaveProperty('startDate', startDate);
      expect(data.dateRange).toHaveProperty('endDate', endDate);
    });

    test('should handle analytics aggregation', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/analytics?aggregate=monthly`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check that data is aggregated monthly
      expect(data).toHaveProperty('aggregation');
      expect(data.aggregation).toHaveProperty('period', 'monthly');
    });
  });

  test.describe('Notifications Endpoint', () => {
    test('should get user notifications', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check notifications structure
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const notification = data[0];
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('title');
        expect(notification).toHaveProperty('message');
        expect(notification).toHaveProperty('timestamp');
        expect(notification).toHaveProperty('read');
      }
    });

    test('should mark notification as read', async ({ request }) => {
      // First get notifications
      const getResponse = await request.get(`${API_BASE_URL}/api/users/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const notifications = await getResponse.json();
      
      if (notifications.length > 0) {
        const notificationId = notifications[0].id;
        
        const response = await request.put(`${API_BASE_URL}/api/users/notifications/${notificationId}/read`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
      }
    });

    test('should mark all notifications as read', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/users/notifications/read-all`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should delete notification', async ({ request }) => {
      // First get notifications
      const getResponse = await request.get(`${API_BASE_URL}/api/users/notifications`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      const notifications = await getResponse.json();
      
      if (notifications.length > 0) {
        const notificationId = notifications[0].id;
        
        const response = await request.delete(`${API_BASE_URL}/api/users/notifications/${notificationId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toHaveProperty('success', true);
      }
    });
  });

  test.describe('Settings Endpoint', () => {
    test('should get user settings', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/users/settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check settings structure
      expect(data).toHaveProperty('notifications');
      expect(data).toHaveProperty('privacy');
      expect(data).toHaveProperty('preferences');
      
      // Check notification settings
      expect(data.notifications).toHaveProperty('email');
      expect(data.notifications).toHaveProperty('push');
      expect(data.notifications).toHaveProperty('sms');
    });

    test('should update user settings', async ({ request }) => {
      const settingsData = {
        notifications: {
          email: true,
          push: false,
          sms: true
        },
        privacy: {
          profileVisibility: 'public',
          showEmail: false
        }
      };

      const response = await request.put(`${API_BASE_URL}/api/users/settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: settingsData
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should validate settings data', async ({ request }) => {
      const invalidSettings = {
        notifications: {
          email: 'invalid-boolean' // Should be boolean
        }
      };

      const response = await request.put(`${API_BASE_URL}/api/users/settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: invalidSettings
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
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

      const responseTime = Date.now() - startTime;
      
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

    test('should handle rate limiting', async ({ request }) => {
      const promises = Array(100).fill(null).map(() => 
        request.get(`${API_BASE_URL}/api/users/dashboard`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(response => response.status() === 429);
      
      // Some requests should be rate limited
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
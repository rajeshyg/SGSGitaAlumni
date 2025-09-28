/**
 * API Testing Scripts for Invitation Endpoints
 * 
 * This file contains comprehensive API tests for invitation-related endpoints
 * including family invitations, validation, and acceptance flows.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('Invitation API Tests', () => {
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

  test.describe('Family Invitation Validation', () => {
    test('should validate valid invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('familyMembers');
      expect(Array.isArray(data.familyMembers)).toBe(true);
      
      if (data.familyMembers.length > 0) {
        const member = data.familyMembers[0];
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('relationship');
      }
    });

    test('should reject invalid invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/invalid-token`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('error');
    });

    test('should reject expired invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/expired-token`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('error');
    });

    test('should reject used invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/used-token`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('error');
    });

    test('should handle malformed invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/malformed-token-!@#$%`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Family Invitation Acceptance', () => {
    test('should accept family invitation with valid data', async ({ request }) => {
      const response = await request.patch(`${API_BASE_URL}/api/invitations/family/1/accept-profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          familyMemberId: '1',
          profileData: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            relationship: 'Father'
          }
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
      expect(data).toHaveProperty('user');
    });

    test('should reject invitation acceptance without authentication', async ({ request }) => {
      const response = await request.patch(`${API_BASE_URL}/api/invitations/family/1/accept-profile`, {
        data: {
          familyMemberId: '1',
          profileData: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should validate profile data for invitation acceptance', async ({ request }) => {
      const response = await request.patch(`${API_BASE_URL}/api/invitations/family/1/accept-profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          familyMemberId: '1',
          profileData: {
            firstName: '', // Empty first name
            lastName: '', // Empty last name
            email: 'invalid-email' // Invalid email format
          }
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject invitation acceptance for invalid family member', async ({ request }) => {
      const response = await request.patch(`${API_BASE_URL}/api/invitations/family/1/accept-profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          familyMemberId: '999', // Non-existent family member
          profileData: {
            firstName: 'John',
            lastName: 'Doe'
          }
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Family Registration from Invitation', () => {
    test('should register user from family invitation', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register-from-family-invitation`, {
        data: {
          invitationToken: 'valid-token-123',
          familyMemberId: '1',
          userData: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          }
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
    });

    test('should reject registration with invalid invitation token', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register-from-family-invitation`, {
        data: {
          invitationToken: 'invalid-token',
          familyMemberId: '1',
          userData: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          }
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject registration with expired invitation', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register-from-family-invitation`, {
        data: {
          invitationToken: 'expired-token',
          familyMemberId: '1',
          userData: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'SecurePass123!',
            confirmPassword: 'SecurePass123!'
          }
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should validate user data for family registration', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register-from-family-invitation`, {
        data: {
          invitationToken: 'valid-token-123',
          familyMemberId: '1',
          userData: {
            firstName: '', // Empty first name
            lastName: '', // Empty last name
            email: 'invalid-email', // Invalid email
            password: '123', // Weak password
            confirmPassword: 'different' // Mismatched password
          }
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Invitation Management', () => {
    test('should create family invitation', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/invitations/family`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          email: 'family@example.com',
          familyMembers: [
            {
              name: 'John Doe',
              relationship: 'Father',
              email: 'john.doe@example.com'
            },
            {
              name: 'Jane Doe',
              relationship: 'Mother',
              email: 'jane.doe@example.com'
            }
          ],
          expiresInDays: 7
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('invitation');
      expect(data).toHaveProperty('token');
    });

    test('should get family invitations', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(Array.isArray(data.invitations)).toBe(true);
    });

    test('should update family invitation', async ({ request }) => {
      const response = await request.put(`${API_BASE_URL}/api/invitations/family/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: {
          email: 'updated@example.com',
          familyMembers: [
            {
              name: 'Updated John Doe',
              relationship: 'Father',
              email: 'updated.john@example.com'
            }
          ]
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('invitation');
    });

    test('should delete family invitation', async ({ request }) => {
      const response = await request.delete(`${API_BASE_URL}/api/invitations/family/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should resend family invitation', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/invitations/family/1/resend`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });
  });

  test.describe('Invitation Analytics', () => {
    test('should get invitation statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/analytics`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('totalInvitations');
      expect(data).toHaveProperty('acceptedInvitations');
      expect(data).toHaveProperty('pendingInvitations');
      expect(data).toHaveProperty('expiredInvitations');
      expect(data).toHaveProperty('acceptanceRate');
    });

    test('should get invitation statistics for date range', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/analytics?startDate=2024-01-01&endDate=2024-01-31`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('totalInvitations');
      expect(data).toHaveProperty('acceptedInvitations');
      expect(data).toHaveProperty('pendingInvitations');
      expect(data).toHaveProperty('expiredInvitations');
    });
  });

  test.describe('Error Handling', () => {
    test('should handle server errors gracefully', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/invalid-endpoint`);

      expect(response.status()).toBe(404);
    });

    test('should handle malformed JSON requests', async ({ request }) => {
      const response = await request.patch(`${API_BASE_URL}/api/invitations/family/1/accept-profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: 'invalid json'
      });

      expect(response.status()).toBe(400);
    });

    test('should handle network timeouts', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`, {
        timeout: 1000 // 1 second timeout
      });

      // Should either succeed or timeout
      expect([200, 408]).toContain(response.status());
    });
  });

  test.describe('Security Tests', () => {
    test('should not expose sensitive information in error messages', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/invalid-token`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).not.toContain('database');
      expect(data.error).not.toContain('password');
      expect(data.error).not.toContain('token');
    });

    test('should validate invitation token format', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/../../etc/passwd`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle SQL injection attempts', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/'; DROP TABLE users; --`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Performance Tests', () => {
    test('should respond within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test('should handle concurrent invitation validations', async ({ request }) => {
      const promises = Array(10).fill(null).map(() => 
        request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`)
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });
  });
});

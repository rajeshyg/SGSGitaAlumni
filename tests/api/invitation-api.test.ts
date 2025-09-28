/**
 * API Testing Scripts for Invitation Endpoints
 * 
 * This file contains comprehensive API tests for all invitation-related endpoints
 * including family invitations, validation, and acceptance flows.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('Invitation API Tests', () => {
  let authToken: string;
  let invitationToken: string;

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

  test.describe('Family Invitation Validation', () => {
    test('should validate valid invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`);

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      // Check response structure
      expect(data).toHaveProperty('valid', true);
      expect(data).toHaveProperty('familyMembers');
      expect(Array.isArray(data.familyMembers)).toBe(true);
      
      if (data.familyMembers.length > 0) {
        const member = data.familyMembers[0];
        expect(member).toHaveProperty('id');
        expect(member).toHaveProperty('name');
        expect(member).toHaveProperty('relationship');
        expect(member).toHaveProperty('isActive');
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
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/expired-token-456`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('error');
    });

    test('should reject used invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/used-token-789`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('valid', false);
      expect(data).toHaveProperty('error');
    });

    test('should handle malformed invitation token', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/malformed-token`);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Family Invitation Acceptance', () => {
    test('should accept valid family invitation', async ({ request }) => {
      const acceptanceData = {
        familyMemberId: '1',
        profileData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1234567890',
          bio: 'Test bio',
          location: 'Test location'
        }
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/valid-token-123/accept-profile`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: acceptanceData
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    test('should validate required profile data', async ({ request }) => {
      const incompleteData = {
        familyMemberId: '1',
        profileData: {
          firstName: '', // Empty first name
          lastName: '', // Empty last name
          email: 'invalid-email' // Invalid email format
        }
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/valid-token-123/accept-profile`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: incompleteData
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject acceptance with invalid family member', async ({ request }) => {
      const acceptanceData = {
        familyMemberId: 'invalid-id',
        profileData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com'
        }
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/valid-token-123/accept-profile`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: acceptanceData
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle duplicate email addresses', async ({ request }) => {
      const acceptanceData = {
        familyMemberId: '1',
        profileData: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'existing@example.com' // Email that already exists
        }
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/valid-token-123/accept-profile`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: acceptanceData
      });

      expect(response.status()).toBe(409);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Invitation Management', () => {
    test('should create new family invitation', async ({ request }) => {
      const invitationData = {
        familyEmail: 'family@example.com',
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
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/create`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: invitationData
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('invitationToken');
      expect(data).toHaveProperty('expiresAt');
      
      invitationToken = data.invitationToken;
    });

    test('should validate invitation creation data', async ({ request }) => {
      const invalidData = {
        familyEmail: 'invalid-email', // Invalid email format
        familyMembers: [], // Empty family members
        expiresInDays: -1 // Invalid expiration
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/create`, {
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

    test('should get user invitations', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(Array.isArray(data)).toBe(true);
      
      if (data.length > 0) {
        const invitation = data[0];
        expect(invitation).toHaveProperty('id');
        expect(invitation).toHaveProperty('token');
        expect(invitation).toHaveProperty('familyEmail');
        expect(invitation).toHaveProperty('familyMembers');
        expect(invitation).toHaveProperty('expiresAt');
        expect(invitation).toHaveProperty('isUsed');
        expect(invitation).toHaveProperty('createdAt');
      }
    });

    test('should resend invitation', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/invitations/family/${invitationToken}/resend`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    test('should cancel invitation', async ({ request }) => {
      const response = await request.delete(`${API_BASE_URL}/api/invitations/family/${invitationToken}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });
  });

  test.describe('Invitation Analytics', () => {
    test('should get invitation statistics', async ({ request }) => {
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/analytics`, {
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
      
      // Check data types
      expect(typeof data.totalInvitations).toBe('number');
      expect(typeof data.acceptedInvitations).toBe('number');
      expect(typeof data.pendingInvitations).toBe('number');
      expect(typeof data.expiredInvitations).toBe('number');
      expect(typeof data.acceptanceRate).toBe('number');
    });

    test('should get invitation analytics for date range', async ({ request }) => {
      const startDate = '2024-01-01';
      const endDate = '2024-01-31';
      
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/analytics?startDate=${startDate}&endDate=${endDate}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('dateRange');
      expect(data.dateRange).toHaveProperty('startDate', startDate);
      expect(data.dateRange).toHaveProperty('endDate', endDate);
    });
  });

  test.describe('Invitation Security', () => {
    test('should handle rate limiting for invitation creation', async ({ request }) => {
      const promises = Array(10).fill(null).map(() => 
        request.post(`${API_BASE_URL}/api/invitations/family/create`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          data: {
            familyEmail: 'test@example.com',
            familyMembers: [{ name: 'Test', relationship: 'Test' }],
            expiresInDays: 7
          }
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(response => response.status() === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    test('should validate invitation token format', async ({ request }) => {
      const malformedTokens = [
        'too-short',
        'token-with-spaces',
        'token@with#special$chars',
        '',
        null,
        undefined
      ];

      for (const token of malformedTokens) {
        const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/${token}`);
        expect(response.status()).toBe(400);
      }
    });

    test('should handle invitation token brute force attempts', async ({ request }) => {
      const promises = Array(100).fill(null).map((_, i) => 
        request.get(`${API_BASE_URL}/api/invitations/family/validate/attempt-${i}`)
      );

      const responses = await Promise.all(promises);
      const blockedResponses = responses.filter(response => response.status() === 429);
      
      expect(blockedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('Invitation Performance', () => {
    test('should respond within acceptable time', async ({ request }) => {
      const startTime = Date.now();
      
      const response = await request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`);
      
      const responseTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test('should handle concurrent invitation validations', async ({ request }) => {
      const promises = Array(20).fill(null).map(() => 
        request.get(`${API_BASE_URL}/api/invitations/family/validate/valid-token-123`)
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });

    test('should handle large family member datasets', async ({ request }) => {
      const largeFamilyMembers = Array(100).fill(null).map((_, i) => ({
        name: `Family Member ${i}`,
        relationship: 'Relative',
        email: `member${i}@example.com`
      }));

      const invitationData = {
        familyEmail: 'large-family@example.com',
        familyMembers: largeFamilyMembers,
        expiresInDays: 7
      };

      const response = await request.post(`${API_BASE_URL}/api/invitations/family/create`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: invitationData
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });
  });
});
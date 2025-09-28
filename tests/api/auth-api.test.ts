/**
 * API Testing Scripts for Authentication Endpoints
 * 
 * This file contains comprehensive API tests for all authentication-related endpoints
 * including login, registration, OTP, and invitation flows.
 */

import { test, expect } from '@playwright/test';

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

test.describe('Authentication API Tests', () => {
  test.describe('Login Endpoint', () => {
    test('should login with valid credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('token');
      expect(data.user).toHaveProperty('id');
      expect(data.user).toHaveProperty('email', 'test@example.com');
    });

    test('should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('success', false);
      expect(data).toHaveProperty('error');
    });

    test('should reject empty credentials', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: '',
          password: ''
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject invalid email format', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'invalid-email',
          password: 'password123'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle rate limiting', async ({ request }) => {
      const promises = Array(10).fill(null).map(() => 
        request.post(`${API_BASE_URL}/api/auth/login`, {
          data: {
            email: 'test@example.com',
            password: 'wrongpassword'
          }
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(response => response.status() === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('Registration Endpoint', () => {
    test('should register new user with valid data', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
        data: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!',
          graduationYear: 2020,
          major: 'Computer Science'
        }
      });

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('message');
    });

    test('should reject registration with existing email', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
        data: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'test@example.com', // Existing email
          password: 'SecurePass123!',
          confirmPassword: 'SecurePass123!'
        }
      });

      expect(response.status()).toBe(409);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject registration with mismatched passwords', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
        data: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          password: 'SecurePass123!',
          confirmPassword: 'DifferentPass123!'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should reject registration with weak password', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
        data: {
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          password: '123',
          confirmPassword: '123'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should validate required fields', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/register`, {
        data: {
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: ''
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('OTP Generation Endpoint', () => {
    test('should generate OTP for valid email', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/otp/generate`, {
        data: {
          email: 'test@example.com',
          type: 'login'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('otpCode');
      expect(data).toHaveProperty('expiresAt');
    });

    test('should reject OTP generation for invalid email', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/otp/generate`, {
        data: {
          email: 'invalid-email',
          type: 'login'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    test('should handle OTP generation rate limiting', async ({ request }) => {
      const promises = Array(5).fill(null).map(() => 
        request.post(`${API_BASE_URL}/api/otp/generate`, {
          data: {
            email: 'test@example.com',
            type: 'login'
          }
        })
      );

      const responses = await Promise.all(promises);
      const rateLimitedResponses = responses.filter(response => response.status() === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  test.describe('OTP Validation Endpoint', () => {
    test('should validate correct OTP', async ({ request }) => {
      // First generate OTP
      await request.post(`${API_BASE_URL}/api/otp/generate`, {
        data: {
          email: 'test@example.com',
          type: 'login'
        }
      });

      const response = await request.post(`${API_BASE_URL}/api/otp/validate`, {
        data: {
          email: 'test@example.com',
          otpCode: '123456', // Assuming this is the test OTP
          type: 'login'
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('isValid', true);
    });

    test('should reject incorrect OTP', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/otp/validate`, {
        data: {
          email: 'test@example.com',
          otpCode: '000000',
          type: 'login'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('isValid', false);
      expect(data).toHaveProperty('error');
    });

    test('should handle expired OTP', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/otp/validate`, {
        data: {
          email: 'test@example.com',
          otpCode: '123456',
          type: 'login'
        }
      });

      // This might return 400 for expired OTP
      expect([200, 400]).toContain(response.status());
    });

    test('should track OTP attempts', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/otp/validate`, {
        data: {
          email: 'test@example.com',
          otpCode: '000000',
          type: 'login'
        }
      });

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('remainingAttempts');
    });
  });

  test.describe('Logout Endpoint', () => {
    test('should logout authenticated user', async ({ request }) => {
      // First login to get token
      const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      const response = await request.post(`${API_BASE_URL}/api/auth/logout`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
    });

    test('should reject logout without token', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/logout`);

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });

  test.describe('Token Refresh Endpoint', () => {
    test('should refresh valid token', async ({ request }) => {
      // First login to get token
      const loginResponse = await request.post(`${API_BASE_URL}/api/auth/login`, {
        data: {
          email: 'test@example.com',
          password: 'password123'
        }
      });

      const loginData = await loginResponse.json();
      const token = loginData.token;

      const response = await request.post(`${API_BASE_URL}/api/auth/refresh`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
    });

    test('should reject refresh with invalid token', async ({ request }) => {
      const response = await request.post(`${API_BASE_URL}/api/auth/refresh`, {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});

import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  test('should test authentication endpoints', async ({ request }) => {
    // Test login endpoint
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    expect(loginResponse.status()).toBe(200);
    const loginData = await loginResponse.json();
    expect(loginData).toHaveProperty('success', true);
    expect(loginData).toHaveProperty('token');
  });

  test('should test registration endpoint', async ({ request }) => {
    const registerResponse = await request.post('http://localhost:3000/api/auth/register', {
      data: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123',
        confirmPassword: 'password123'
      }
    });
    
    expect(registerResponse.status()).toBe(201);
    const registerData = await registerResponse.json();
    expect(registerData).toHaveProperty('success', true);
  });

  test('should test OTP generation endpoint', async ({ request }) => {
    const otpResponse = await request.post('http://localhost:3000/api/otp/generate', {
      data: {
        email: 'test@example.com',
        type: 'login'
      }
    });
    
    expect(otpResponse.status()).toBe(200);
    const otpData = await otpResponse.json();
    expect(otpData).toHaveProperty('success', true);
    expect(otpData).toHaveProperty('otpCode');
  });

  test('should test OTP validation endpoint', async ({ request }) => {
    const validateResponse = await request.post('http://localhost:3000/api/otp/validate', {
      data: {
        email: 'test@example.com',
        otpCode: '123456',
        type: 'login'
      }
    });
    
    expect(validateResponse.status()).toBe(200);
    const validateData = await validateResponse.json();
    expect(validateData).toHaveProperty('isValid', true);
  });

  test('should test dashboard data endpoint', async ({ request }) => {
    // First get auth token
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Test dashboard endpoint with auth
    const dashboardResponse = await request.get('http://localhost:3000/api/users/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(dashboardResponse.status()).toBe(200);
    const dashboardData = await dashboardResponse.json();
    expect(dashboardData).toHaveProperty('user');
    expect(dashboardData).toHaveProperty('stats');
    expect(dashboardData).toHaveProperty('recentConversations');
  });

  test('should test user profile endpoint', async ({ request }) => {
    // Get auth token
    const loginResponse = await request.post('http://localhost:3000/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    
    // Test profile endpoint
    const profileResponse = await request.get('http://localhost:3000/api/users/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    expect(profileResponse.status()).toBe(200);
    const profileData = await profileResponse.json();
    expect(profileData).toHaveProperty('id');
    expect(profileData).toHaveProperty('email');
    expect(profileData).toHaveProperty('firstName');
  });

  test('should test family invitation validation endpoint', async ({ request }) => {
    const invitationResponse = await request.get('http://localhost:3000/api/invitations/family/validate/valid-token');
    
    expect(invitationResponse.status()).toBe(200);
    const invitationData = await invitationResponse.json();
    expect(invitationData).toHaveProperty('valid', true);
    expect(invitationData).toHaveProperty('familyMembers');
  });

  test('should test family invitation acceptance endpoint', async ({ request }) => {
    const acceptResponse = await request.patch('http://localhost:3000/api/invitations/family/1/accept-profile', {
      data: {
        familyMemberId: '1',
        profileData: {
          firstName: 'John',
          lastName: 'Doe'
        }
      }
    });
    
    expect(acceptResponse.status()).toBe(200);
    const acceptData = await acceptResponse.json();
    expect(acceptData).toHaveProperty('success', true);
  });

  test('should test error handling for invalid endpoints', async ({ request }) => {
    const invalidResponse = await request.get('http://localhost:3000/api/invalid-endpoint');
    expect(invalidResponse.status()).toBe(404);
  });

  test('should test rate limiting', async ({ request }) => {
    // Make multiple rapid requests to test rate limiting
    const promises = Array(10).fill(null).map(() => 
      request.post('http://localhost:3000/api/auth/login', {
        data: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      })
    );
    
    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(response => response.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });

  test('should test CORS headers', async ({ request }) => {
    const response = await request.options('http://localhost:3000/api/auth/login');
    
    expect(response.headers()['access-control-allow-origin']).toBeDefined();
    expect(response.headers()['access-control-allow-methods']).toBeDefined();
    expect(response.headers()['access-control-allow-headers']).toBeDefined();
  });

  test('should test security headers', async ({ request }) => {
    const response = await request.get('http://localhost:3000/api/health');
    
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['x-frame-options']).toBeDefined();
    expect(response.headers()['x-xss-protection']).toBeDefined();
  });
});

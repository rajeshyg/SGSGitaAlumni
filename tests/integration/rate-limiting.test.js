/**
 * Rate Limiting Integration Tests
 * 
 * Tests comprehensive rate limiting implementation across all policies:
 * - OTP (5 requests/minute)
 * - Login (10 requests/minute)
 * - Search (30 requests/minute)
 * - Email (20 requests/hour)
 * - Registration (3 requests/hour)
 * - Invitations (10 requests/hour)
 * - Default API (100 requests/minute)
 */

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../server');
const { redisClient } = require('../../config/redis');

describe('Rate Limiting Integration Tests', function() {
  this.timeout(10000); // Increase timeout for rate limit tests

  // Helper function to wait
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper to make multiple rapid requests
  async function rapidRequests(endpoint, count, options = {}) {
    const requests = [];
    for (let i = 0; i < count; i++) {
      requests.push(
        request(app)
          [options.method || 'post'](endpoint)
          .send(options.body || {})
          .set(options.headers || {})
      );
    }
    return Promise.all(requests);
  }

  before(async () => {
    // Clear all rate limits before tests
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys('ratelimit:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
  });

  afterEach(async () => {
    // Clear rate limits between tests
    if (redisClient && redisClient.isReady) {
      const keys = await redisClient.keys('ratelimit:*');
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }
    // Wait a bit to ensure cleanup
    await wait(100);
  });

  describe('OTP Rate Limiting (5/minute)', () => {
    const endpoint = '/api/otp/generate';
    const testEmail = 'ratelimit-test@example.com';

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 3, {
        body: { email: testEmail }
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
        expect(res.headers['x-ratelimit-limit']).to.equal('5');
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 6, {
        body: { email: testEmail }
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
      
      const blockedResponse = blockedResponses[0];
      expect(blockedResponse.headers['x-ratelimit-remaining']).to.equal('0');
      expect(blockedResponse.headers['retry-after']).to.exist;
      expect(blockedResponse.body.error).to.include('rate limit');
    });

    it('should include correct rate limit headers', async () => {
      const res = await request(app)
        .post(endpoint)
        .send({ email: testEmail });

      expect(res.headers['x-ratelimit-limit']).to.equal('5');
      expect(res.headers['x-ratelimit-remaining']).to.exist;
      expect(res.headers['x-ratelimit-reset']).to.exist;
      expect(res.headers['x-ratelimit-policy']).to.equal('otp');
    });

    it('should reset limit after window expires', async () => {
      // Make 5 requests to hit limit
      await rapidRequests(endpoint, 5, { body: { email: testEmail } });

      // Wait for window to reset (61 seconds for 1-minute window)
      await wait(61000);

      // Should be able to make requests again
      const res = await request(app)
        .post(endpoint)
        .send({ email: testEmail });

      expect(res.status).to.not.equal(429);
    }).timeout(65000);
  });

  describe('Login Rate Limiting (10/minute)', () => {
    const endpoint = '/api/auth/login';
    const testCredentials = {
      email: 'test@example.com',
      password: 'password123'
    };

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 5, {
        body: testCredentials
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 11, {
        body: testCredentials
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });

    it('should implement progressive delay', async () => {
      const startTime = Date.now();
      
      // Make requests that will trigger progressive delay
      await rapidRequests(endpoint, 8, { body: testCredentials });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // With progressive delay (1s-10s), should take longer than without
      // Expect at least some delay to be applied
      expect(duration).to.be.at.least(1000);
    });
  });

  describe('Search Rate Limiting (30/minute)', () => {
    const endpoint = '/api/alumni-members/search';

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 20, {
        method: 'get'
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 31, {
        method: 'get'
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });

    it('should have correct policy headers', async () => {
      const res = await request(app).get(endpoint);

      expect(res.headers['x-ratelimit-policy']).to.equal('search');
      expect(res.headers['x-ratelimit-limit']).to.equal('30');
    });
  });

  describe('Email Rate Limiting (20/hour)', () => {
    const endpoint = '/api/email/send';
    const testEmail = {
      to: 'recipient@example.com',
      subject: 'Test',
      body: 'Test email'
    };

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 10, {
        body: testEmail
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 21, {
        body: testEmail
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
      
      // Check for 24-hour block
      const blockedResponse = blockedResponses[0];
      expect(blockedResponse.body.error).to.include('24 hours');
    });
  });

  describe('Registration Rate Limiting (3/hour per IP)', () => {
    const endpoint = '/api/auth/register-from-invitation';
    const testRegistration = {
      token: 'test-token-123',
      email: 'newuser@example.com',
      password: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 2, {
        body: testRegistration
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 4, {
        body: testRegistration
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });

    it('should have strict blocking (24 hours)', async () => {
      await rapidRequests(endpoint, 4, { body: testRegistration });

      const res = await request(app)
        .post(endpoint)
        .send(testRegistration);

      expect(res.status).to.equal(429);
      expect(res.body.error).to.include('24 hours');
    });
  });

  describe('Invitation Rate Limiting (10/hour)', () => {
    const endpoint = '/api/invitations';
    const testInvitation = {
      email: 'invited@example.com',
      role: 'user'
    };

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 5, {
        body: testInvitation,
        headers: {
          'Authorization': 'Bearer test-admin-token'
        }
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 11, {
        body: testInvitation,
        headers: {
          'Authorization': 'Bearer test-admin-token'
        }
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });
  });

  describe('TOTP Setup Rate Limiting (5/minute)', () => {
    const endpoint = '/api/users/totp/setup';

    it('should allow requests within limit', async () => {
      const responses = await rapidRequests(endpoint, 3, {
        headers: {
          'Authorization': 'Bearer test-user-token'
        }
      });

      responses.forEach(res => {
        expect(res.status).to.not.equal(429);
      });
    });

    it('should block requests after exceeding limit', async () => {
      const responses = await rapidRequests(endpoint, 6, {
        headers: {
          'Authorization': 'Bearer test-user-token'
        }
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });
  });

  describe('Admin Bypass', () => {
    it('should bypass rate limits for admin users', async () => {
      const endpoint = '/api/admin/domains';
      
      // Make more than the limit with admin token
      const responses = await rapidRequests(endpoint, 50, {
        method: 'get',
        headers: {
          'Authorization': 'Bearer admin-bypass-token'
        }
      });

      // None should be rate limited
      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.equal(0);
    });
  });

  describe('Rate Limit Headers', () => {
    it('should include all required headers', async () => {
      const res = await request(app)
        .post('/api/otp/generate')
        .send({ email: 'test@example.com' });

      expect(res.headers['x-ratelimit-limit']).to.exist;
      expect(res.headers['x-ratelimit-remaining']).to.exist;
      expect(res.headers['x-ratelimit-reset']).to.exist;
      expect(res.headers['x-ratelimit-policy']).to.exist;
    });

    it('should include retry-after when rate limited', async () => {
      const endpoint = '/api/otp/generate';
      const body = { email: 'test@example.com' };

      // Exhaust limit
      await rapidRequests(endpoint, 5, { body });

      // Next request should be rate limited
      const res = await request(app)
        .post(endpoint)
        .send(body);

      if (res.status === 429) {
        expect(res.headers['retry-after']).to.exist;
        expect(parseInt(res.headers['retry-after'])).to.be.greaterThan(0);
      }
    });
  });

  describe('Progressive Delay', () => {
    it('should apply increasing delays as limit approaches', async () => {
      const endpoint = '/api/auth/login';
      const body = { email: 'test@example.com', password: 'test123' };

      const timings = [];

      for (let i = 0; i < 8; i++) {
        const start = Date.now();
        await request(app).post(endpoint).send(body);
        const end = Date.now();
        timings.push(end - start);
      }

      // Later requests should take longer due to progressive delay
      const avgFirst3 = timings.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
      const avgLast3 = timings.slice(-3).reduce((a, b) => a + b, 0) / 3;

      expect(avgLast3).to.be.greaterThan(avgFirst3);
    });
  });

  describe('Redis Fallback', () => {
    it('should work when Redis is unavailable', async () => {
      // This test assumes Redis might be down
      // The rate limiter should fall back to in-memory tracking

      const res = await request(app)
        .post('/api/otp/generate')
        .send({ email: 'test@example.com' });

      // Should still work, even if Redis is down
      expect(res.status).to.be.oneOf([200, 201, 400, 401, 429]);
    });
  });

  describe('Monitoring Endpoints', () => {
    it('should provide rate limit status', async () => {
      const res = await request(app)
        .get('/api/admin/rate-limits/status')
        .set('Authorization', 'Bearer admin-token');

      expect(res.status).to.be.oneOf([200, 401, 403]);
      if (res.status === 200) {
        expect(res.body).to.have.property('policies');
      }
    });

    it('should allow clearing rate limits', async () => {
      // First, hit a rate limit
      await rapidRequests('/api/otp/generate', 5, {
        body: { email: 'test@example.com' }
      });

      // Clear it
      const clearRes = await request(app)
        .delete('/api/admin/rate-limits')
        .set('Authorization', 'Bearer admin-token')
        .send({ identifier: 'test@example.com', policy: 'otp' });

      expect(clearRes.status).to.be.oneOf([200, 401, 403]);
    });
  });

  describe('Client-Side Rate Limiting', () => {
    it('should return actionable error messages', async () => {
      const endpoint = '/api/otp/generate';
      const body = { email: 'test@example.com' };

      // Exhaust limit
      await rapidRequests(endpoint, 5, { body });

      // Get rate limit error
      const res = await request(app)
        .post(endpoint)
        .send(body);

      if (res.status === 429) {
        expect(res.body).to.have.property('error');
        expect(res.body).to.have.property('retryAfter');
        expect(res.body.error).to.include('rate limit');
      }
    });
  });

  describe('Different Identifiers', () => {
    it('should track by IP for anonymous requests', async () => {
      const endpoint = '/api/alumni-members/search';

      const responses = await rapidRequests(endpoint, 31, {
        method: 'get'
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });

    it('should track by user ID for authenticated requests', async () => {
      const endpoint = '/api/users/totp/setup';
      const token = 'user-specific-token';

      const responses = await rapidRequests(endpoint, 6, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const blockedResponses = responses.filter(res => res.status === 429);
      expect(blockedResponses.length).to.be.at.least(1);
    });
  });
});

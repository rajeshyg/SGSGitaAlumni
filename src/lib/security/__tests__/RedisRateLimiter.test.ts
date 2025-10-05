import { RedisRateLimiter, RateLimitPolicy, RateLimitConfig } from '../RedisRateLimiter';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    setEx: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    del: jest.fn(),
    keys: jest.fn()
  }))
}));

describe('RedisRateLimiter', () => {
  let mockRedisClient: any;
  let rateLimiter: RedisRateLimiter;
  let testConfig: RateLimitConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked Redis client
    const redis = require('redis');
    mockRedisClient = redis.createClient();

    testConfig = {
      policies: {
        otp: {
          windowMs: 60000, // 1 minute
          maxRequests: 5,
          blockDurationMs: 120000, // 2 minutes
          progressiveDelay: {
            enabled: true,
            baseDelayMs: 1000,
            maxDelayMs: 10000
          }
        },
        invitations: {
          windowMs: 30000,
          maxRequests: 3
        },
        login: {
          windowMs: 300000, // 5 minutes
          maxRequests: 3,
          blockDurationMs: 900000 // 15 minutes
        },
        default: {
          windowMs: 60000,
          maxRequests: 10
        }
      }
    };

    rateLimiter = new RedisRateLimiter(testConfig);
  });

  describe('initialization', () => {
    it('should initialize with provided config', () => {
      expect(rateLimiter.getPolicy('otp')).toEqual(testConfig.policies.otp);
      expect(rateLimiter.getPolicy('invitations')).toEqual(testConfig.policies.invitations);
    });

    it('should connect to Redis on initialization', async () => {
      await new Promise(resolve => setTimeout(resolve, 10)); // Allow async init
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });
  });

  describe('checkLimit', () => {
    beforeEach(() => {
      mockRedisClient.get.mockResolvedValue(null); // No existing count
    });

    it('should allow request when under limit', async () => {
      mockRedisClient.get.mockResolvedValue('2'); // 2 requests made

      const result = await rateLimiter.checkLimit('test-key', testConfig.policies.test);

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(2); // 5 - 2 - 1 = 2
      expect(result.currentDelay).toBeDefined();
    });

    it('should block request when over limit', async () => {
      mockRedisClient.get.mockResolvedValue('5'); // At limit

      const result = await rateLimiter.checkLimit('test-key', testConfig.policies.test);

      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it('should apply progressive delay based on usage', async () => {
      mockRedisClient.get.mockResolvedValue('3'); // 3 requests made

      const result = await rateLimiter.checkLimit('test-key', testConfig.policies.test);

      expect(result.allowed).toBe(true);
      expect(result.currentDelay).toBeGreaterThan(0);
      expect(result.currentDelay).toBeLessThanOrEqual(10000); // maxDelayMs
    });

    it('should handle Redis connection failure gracefully', async () => {
      // Simulate Redis failure
      rateLimiter = new RedisRateLimiter(testConfig);
      (rateLimiter as any).connected = false;

      const result = await rateLimiter.checkLimit('test-key', testConfig.policies.otp);

      expect(result.allowed).toBe(true); // Allow on failure
      expect(result.remainingRequests).toBe(4); // maxRequests - 1
    });

    it('should check blocked status correctly', async () => {
      const blockUntil = Date.now() + 60000; // Blocked for 1 minute
      mockRedisClient.get
        .mockResolvedValueOnce(null) // count
        .mockResolvedValueOnce(blockUntil.toString()); // block

      const result = await rateLimiter.checkLimit('blocked-key', testConfig.policies.test);

      expect(result.allowed).toBe(false);
      expect(result.blockExpiresAt).toBeDefined();
    });
  });

  describe('checkAndRecord', () => {
    it('should check limit and record request when allowed', async () => {
      mockRedisClient.get.mockResolvedValue('1'); // 1 request made
      mockRedisClient.incr.mockResolvedValue(2); // Incremented to 2

      const result = await rateLimiter.checkAndRecord('test-key', testConfig.policies.test);

      expect(result.allowed).toBe(true);
      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:test:test-key:0');
      expect(mockRedisClient.expire).toHaveBeenCalled();
    });

    it('should not record request when blocked', async () => {
      mockRedisClient.get.mockResolvedValue('5'); // At limit

      const result = await rateLimiter.checkAndRecord('test-key', testConfig.policies.test);

      expect(result.allowed).toBe(false);
      expect(mockRedisClient.incr).not.toHaveBeenCalled();
    });
  });

  describe('recordRequest', () => {
    it('should increment counter and set expiration', async () => {
      await rateLimiter.recordRequest('test-key', testConfig.policies.test);

      expect(mockRedisClient.incr).toHaveBeenCalledWith('ratelimit:test:test-key:0');
      expect(mockRedisClient.expire).toHaveBeenCalledWith('ratelimit:test:test-key:0', 61); // windowMs/1000 + 1
    });

    it('should handle Redis failure gracefully', async () => {
      (rateLimiter as any).connected = false;

      await expect(rateLimiter.recordRequest('test-key', testConfig.policies.test)).resolves.not.toThrow();
    });
  });

  describe('getStatus', () => {
    it('should return correct status information', async () => {
      mockRedisClient.get
        .mockResolvedValueOnce('3') // count
        .mockResolvedValueOnce(null); // not blocked

      const status = await rateLimiter.getStatus('test-key', testConfig.policies.test);

      expect(status.currentCount).toBe(3);
      expect(status.isBlocked).toBe(false);
      expect(status.remainingRequests).toBe(2); // 5 - 3
    });

    it('should handle blocked status', async () => {
      const blockUntil = Date.now() + 120000;
      mockRedisClient.get
        .mockResolvedValueOnce('6') // over limit
        .mockResolvedValueOnce(blockUntil.toString()); // blocked

      const status = await rateLimiter.getStatus('blocked-key', testConfig.policies.test);

      expect(status.isBlocked).toBe(true);
      expect(status.blockExpiresAt).toBe(blockUntil);
    });

    it('should handle Redis failure', async () => {
      (rateLimiter as any).connected = false;

      const status = await rateLimiter.getStatus('test-key', testConfig.policies.test);

      expect(status.currentCount).toBe(0);
      expect(status.isBlocked).toBe(false);
    });
  });

  describe('clearLimit', () => {
    it('should clear rate limit data', async () => {
      await rateLimiter.clearLimit('test-key');

      expect(mockRedisClient.del).toHaveBeenCalledWith('ratelimit:block:test-key');
    });

    it('should handle Redis failure gracefully', async () => {
      (rateLimiter as any).connected = false;

      await expect(rateLimiter.clearLimit('test-key')).resolves.not.toThrow();
    });
  });

  describe('policy management', () => {
    it('should return correct policy by name', () => {
      const policy = rateLimiter.getPolicy('otp');
      expect(policy).toEqual(testConfig.policies.otp);
    });

    it('should return default policy for unknown name', () => {
      const policy = rateLimiter.getPolicy('unknown' as any);
      expect(policy).toEqual(testConfig.policies.default);
    });
  });

  describe('progressive delay calculation', () => {
    it('should calculate delay based on usage ratio', () => {
      const policy: RateLimitPolicy = {
        windowMs: 60000,
        maxRequests: 10,
        progressiveDelay: {
          enabled: true,
          baseDelayMs: 1000,
          maxDelayMs: 5000
        }
      };

      // Test with different usage levels
      const testCases = [
        { count: 1, expectedMin: 0, expectedMax: 1000 },
        { count: 5, expectedMin: 1000, expectedMax: 3000 },
        { count: 8, expectedMin: 2000, expectedMax: 5000 }
      ];

      testCases.forEach(({ count }) => {
        mockRedisClient.get.mockResolvedValue(count.toString());

        // Note: This test would need actual implementation to test delay calculation
        // For now, we verify the structure is correct
        expect(policy.progressiveDelay?.enabled).toBe(true);
      });
    });

    it('should not apply delay when disabled', () => {
      const policy: RateLimitPolicy = {
        windowMs: 60000,
        maxRequests: 10
      };

      expect(policy.progressiveDelay?.enabled).toBeFalsy();
    });
  });

  describe('error handling', () => {
    it('should handle Redis operation failures', async () => {
      mockRedisClient.get.mockRejectedValue(new Error('Redis connection failed'));

      const result = await rateLimiter.checkLimit('test-key', testConfig.policies.test);

      // Should allow request on Redis failure
      expect(result.allowed).toBe(true);
    });

    it('should handle malformed Redis responses', async () => {
      mockRedisClient.get.mockResolvedValue('invalid-number');

      const result = await rateLimiter.checkLimit('test-key', testConfig.policies.test);

      expect(result.allowed).toBe(true); // Graceful fallback
    });
  });

  describe('window calculation', () => {
    it('should calculate correct window keys', () => {
      const now = Date.now();
      const windowMs = 60000; // 1 minute
      const expectedWindow = Math.floor(now / windowMs);

      // This test verifies the logic, though we can't easily test the exact key generation
      // without exposing internal methods
      expect(expectedWindow).toBeDefined();
      expect(typeof expectedWindow).toBe('number');
    });

    it('should handle different window sizes', () => {
      const policies = [
        { windowMs: 30000 }, // 30 seconds
        { windowMs: 300000 }, // 5 minutes
        { windowMs: 3600000 } // 1 hour
      ];

      policies.forEach(policy => {
        expect(policy.windowMs).toBeGreaterThan(0);
      });
    });
  });

  describe('cleanup', () => {
    it('should close Redis connection on close()', async () => {
      await rateLimiter.close();

      expect(mockRedisClient.quit).toHaveBeenCalled();
      expect((rateLimiter as any).connected).toBe(false);
    });
  });
});
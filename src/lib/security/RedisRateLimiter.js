// ============================================================================
// REDIS RATE LIMITER (JavaScript stub)
// ============================================================================
// Basic rate limiter for server-side compatibility

class RedisRateLimiter {
  constructor() {
    this.policies = {
      otp: { maxRequests: 5, windowMs: 300000 }, // 5 per 5 minutes
      invitations: { maxRequests: 10, windowMs: 3600000 }, // 10 per hour
      login: { maxRequests: 5, windowMs: 900000 }, // 5 per 15 minutes
      default: { maxRequests: 100, windowMs: 900000 } // 100 per 15 minutes
    };
  }

  getPolicy(name) {
    return this.policies[name] || this.policies.default;
  }

  async checkAndRecord(key, policy, userId) {
    // Simple in-memory rate limiting (not suitable for production)
    // In production, this would use Redis
    return {
      allowed: true,
      remainingRequests: policy.maxRequests - 1,
      resetTime: Date.now() + policy.windowMs,
      currentDelay: 0
    };
  }

  async getStatus(key, policy) {
    return {
      currentCount: 0,
      isBlocked: false,
      blockExpiresAt: null,
      windowExpiresAt: Date.now() + policy.windowMs
    };
  }

  async clearLimit(key) {
    // No-op for stub
  }
}

export const redisRateLimiter = new RedisRateLimiter();
// ============================================================================
// REDIS RATE LIMITER SERVICE
// ============================================================================
// Enterprise-grade rate limiting with Redis backend for abuse prevention

import pkg from 'redis';
const { createClient } = pkg;
import { serverMonitoring } from '../monitoring/server.js';

export interface RateLimitPolicy {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs?: number; // Duration to block after exceeding limit
  progressiveDelay?: {
    enabled: boolean;
    baseDelayMs: number; // Base delay for progressive backoff
    maxDelayMs: number; // Maximum delay
  };
}

export interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number; // Unix timestamp when window resets
  retryAfter?: number; // Seconds to wait before retry
  currentDelay?: number; // Current progressive delay in ms
}

export interface RateLimitConfig {
  redisUrl?: string;
  policies: {
    otp: RateLimitPolicy;
    invitations: RateLimitPolicy;
    login: RateLimitPolicy;
    email: RateLimitPolicy;
    search: RateLimitPolicy;
    registration: RateLimitPolicy;
    'chat-create': RateLimitPolicy;
    'chat-read': RateLimitPolicy;
    'chat-write': RateLimitPolicy;
    'chat-message': RateLimitPolicy;
    'chat-reaction': RateLimitPolicy;
    default: RateLimitPolicy;
  };
}

export class RedisRateLimiter {
  private redisClient: any;
  private config: RateLimitConfig;
  private connected: boolean = false;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.redisClient = createClient({
      url: config.redisUrl || 'redis://localhost:6379'
    });

    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      await this.redisClient.connect();
      this.connected = true;
      serverMonitoring.updateRedisStatus(true);
      // Redis rate limiter connected
    } catch (error) {
      // Failed to connect to Redis for rate limiting
      this.connected = false;
      serverMonitoring.updateRedisStatus(false);
    }
  }

  /**
   * Check if request is within rate limit
   */
  async checkLimit(
    key: string,
    policy: RateLimitPolicy,
    _userId?: string
  ): Promise<RateLimitResult> {
    if (!this.connected) {
      // Fallback: allow request if Redis is down
      return {
        allowed: true,
        remainingRequests: policy.maxRequests - 1,
        resetTime: Date.now() + policy.windowMs
      };
    }

    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / policy.windowMs)}`;
    const blockKey = `ratelimit:block:${key}`;

    try {
      // Check if currently blocked
      const blockUntil = await this.redisClient.get(blockKey);
      if (blockUntil && parseInt(blockUntil) > now) {
        const retryAfter = Math.ceil((parseInt(blockUntil) - now) / 1000);
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: parseInt(blockUntil),
          retryAfter
        };
      }

      // Get current request count
      const currentCount = await this.redisClient.get(windowKey);
      const count = currentCount ? parseInt(currentCount) : 0;

      if (count >= policy.maxRequests) {
        // Log rate limit violation
        serverMonitoring.logRateLimitViolation(key, 'rate_limit_check', {
          policy: policy,
          currentCount: count,
          maxRequests: policy.maxRequests
        });

        // Exceeded limit, apply block if configured
        if (policy.blockDurationMs) {
          await this.redisClient.setEx(
            blockKey,
            policy.blockDurationMs / 1000,
            (now + policy.blockDurationMs).toString()
          );
        }

        const resetTime = (Math.floor(now / policy.windowMs) + 1) * policy.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);

        return {
          allowed: false,
          remainingRequests: 0,
          resetTime,
          retryAfter
        };
      }

      // Calculate progressive delay if enabled
      let currentDelay: number | undefined;
      if (policy.progressiveDelay?.enabled) {
        const usageRatio = count / policy.maxRequests;
        currentDelay = Math.min(
          policy.progressiveDelay.baseDelayMs * Math.pow(2, usageRatio * 3),
          policy.progressiveDelay.maxDelayMs
        );
      }

      return {
        allowed: true,
        remainingRequests: policy.maxRequests - count - 1,
        resetTime: (Math.floor(now / policy.windowMs) + 1) * policy.windowMs,
        currentDelay
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow request on error to avoid blocking legitimate traffic
      return {
        allowed: true,
        remainingRequests: policy.maxRequests - 1,
        resetTime: now + policy.windowMs
      };
    }
  }

  /**
   * Record a request (increment counter)
   */
  async recordRequest(key: string, policy: RateLimitPolicy): Promise<void> {
    if (!this.connected) return;

    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / policy.windowMs)}`;

    try {
      await this.redisClient.incr(windowKey);
      // Set expiration on first request in window
      await this.redisClient.expire(windowKey, Math.ceil(policy.windowMs / 1000) + 60); // +60s buffer
    } catch (error) {
      console.error('Failed to record rate limit request:', error);
    }
  }

  /**
   * Check and record request in one operation
   */
  async checkAndRecord(
    key: string,
    policy: RateLimitPolicy,
    userId?: string
  ): Promise<RateLimitResult> {
    const result = await this.checkLimit(key, policy, userId);
    if (result.allowed) {
      await this.recordRequest(key, policy);
    }
    return result;
  }

  /**
   * Get rate limit status for monitoring
   */
  async getStatus(key: string, policy: RateLimitPolicy): Promise<{
    currentCount: number;
    isBlocked: boolean;
    blockExpiresAt?: number;
    windowExpiresAt: number;
  }> {
    if (!this.connected) {
      return {
        currentCount: 0,
        isBlocked: false,
        windowExpiresAt: Date.now() + policy.windowMs
      };
    }

    const now = Date.now();
    const windowKey = `ratelimit:${key}:${Math.floor(now / policy.windowMs)}`;
    const blockKey = `ratelimit:block:${key}`;

    try {
      const [count, blockUntil] = await Promise.all([
        this.redisClient.get(windowKey),
        this.redisClient.get(blockKey)
      ]);

      return {
        currentCount: count ? parseInt(count) : 0,
        isBlocked: blockUntil ? parseInt(blockUntil) > now : false,
        blockExpiresAt: blockUntil ? parseInt(blockUntil) : undefined,
        windowExpiresAt: (Math.floor(now / policy.windowMs) + 1) * policy.windowMs
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {
        currentCount: 0,
        isBlocked: false,
        windowExpiresAt: now + policy.windowMs
      };
    }
  }

  /**
   * Clear rate limit for a key (admin function)
   */
  async clearLimit(key: string): Promise<void> {
    if (!this.connected) return;

    const blockKey = `ratelimit:block:${key}`;

    try {
      // Note: Redis doesn't have direct pattern deletion in node-redis v4
      // This is a simplified version - in production, consider using SCAN
      await this.redisClient.del(blockKey);

      // For window keys, we'd need to scan and delete
      // For now, just let them expire naturally
      // Pattern would be: `ratelimit:${key}:*`
    } catch (error) {
      console.error('Failed to clear rate limit:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    if (this.connected) {
      await this.redisClient.quit();
      this.connected = false;
    }
  }

  /**
   * Get policy by name
   */
  getPolicy(name: keyof RateLimitConfig['policies']): RateLimitPolicy {
    return this.config.policies[name] || this.config.policies.default;
  }
}

// Default configuration
const defaultConfig: RateLimitConfig = {
  policies: {
    otp: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 5,
      blockDurationMs: 15 * 60 * 1000, // 15 minutes block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 1000,
        maxDelayMs: 10000
      }
    },
    invitations: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 2000,
        maxDelayMs: 30000
      }
    },
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      blockDurationMs: 60 * 60 * 1000, // 1 hour block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 2000,
        maxDelayMs: 20000
      }
    },
    email: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20, // 20 emails per hour
      blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 2000,
        maxDelayMs: 15000
      }
    },
    search: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30, // 30 searches per minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 500,
        maxDelayMs: 5000
      }
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3, // 3 registrations per hour per IP
      blockDurationMs: 24 * 60 * 60 * 1000, // 24 hours block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 5000,
        maxDelayMs: 30000
      }
    },
    'chat-create': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 20, // 20 conversation creations per minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 1000,
        maxDelayMs: 5000
      }
    },
    'chat-read': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200, // 200 read operations per minute
      progressiveDelay: {
        enabled: false,
        baseDelayMs: 0,
        maxDelayMs: 0
      }
    },
    'chat-write': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 write operations per minute
      blockDurationMs: 2 * 60 * 1000, // 2 minutes block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 500,
        maxDelayMs: 3000
      }
    },
    'chat-message': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60, // 60 messages per minute
      blockDurationMs: 5 * 60 * 1000, // 5 minutes block
      progressiveDelay: {
        enabled: true,
        baseDelayMs: 1000,
        maxDelayMs: 5000
      }
    },
    'chat-reaction': {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 120, // 120 reactions per minute
      progressiveDelay: {
        enabled: false,
        baseDelayMs: 0,
        maxDelayMs: 0
      }
    },
    default: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 60,
      progressiveDelay: {
        enabled: false,
        baseDelayMs: 0,
        maxDelayMs: 0
      }
    }
  }
};

// Export singleton instance
export const redisRateLimiter = new RedisRateLimiter(defaultConfig);
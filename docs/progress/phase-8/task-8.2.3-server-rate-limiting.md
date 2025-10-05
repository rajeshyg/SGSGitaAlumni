# Task 8.2.3: Server-Side Rate Limiting Implementation

**Status:** 🔄 In Progress (Security Phase)
**Priority:** High
**Duration:** 2 days
**Dependencies:** Task 8.2.1 (HMAC Tokens)

## Overview

Implement Redis-based server-side rate limiting to replace client-side implementations, providing robust protection against abuse. This task establishes progressive delays, lockouts, and comprehensive rate limiting for OTP generation, invitations, and login attempts.

## Objectives

- Implement Redis-based rate limiting infrastructure
- Create progressive delay and lockout mechanisms
- Protect OTP generation, invitation creation, and login endpoints
- Remove all client-side rate limiting implementations
- Provide real-time monitoring and alerting capabilities

## Technical Implementation Details

### Redis Rate Limiting Architecture

```typescript
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  blockDurationMs: number; // Block duration after limit exceeded
  progressiveDelay: boolean; // Enable progressive delays
}

interface RateLimitResult {
  allowed: boolean;
  remainingRequests: number;
  resetTime: number;
  delayMs?: number; // Progressive delay
  blockedUntil?: number; // Lockout time
}

class RedisRateLimiter {
  private redis: Redis;
  private readonly prefix = 'ratelimit:';

  async checkLimit(
    key: string,
    config: RateLimitConfig
  ): Promise<RateLimitResult> {
    const redisKey = this.prefix + key;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Use Redis sorted set to track requests
    const multi = this.redis.multi();

    // Remove old entries outside the window
    multi.zremrangebyscore(redisKey, 0, windowStart);

    // Count remaining requests in window
    multi.zcard(redisKey);

    // Add current request
    multi.zadd(redisKey, now, now.toString());

    // Set expiration on the key
    multi.pexpire(redisKey, config.windowMs * 2);

    const results = await multi.exec();
    const requestCount = results[1][1] as number;

    // Check if limit exceeded
    if (requestCount > config.maxRequests) {
      // Calculate block duration with progressive delays
      const blockUntil = now + this.calculateBlockDuration(requestCount, config);

      // Store block information
      await this.redis.setex(
        `${redisKey}:blocked`,
        Math.ceil(config.blockDurationMs / 1000),
        blockUntil.toString()
      );

      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: windowStart + config.windowMs,
        blockedUntil: blockUntil,
        delayMs: this.calculateProgressiveDelay(requestCount, config)
      };
    }

    return {
      allowed: true,
      remainingRequests: Math.max(0, config.maxRequests - requestCount),
      resetTime: windowStart + config.windowMs
    };
  }

  private calculateBlockDuration(requestCount: number, config: RateLimitConfig): number {
    // Exponential backoff based on violation severity
    const violations = requestCount - config.maxRequests;
    return config.blockDurationMs * Math.pow(2, Math.min(violations, 5));
  }

  private calculateProgressiveDelay(requestCount: number, config: RateLimitConfig): number {
    if (!config.progressiveDelay) return 0;

    // Progressive delay: 1s, 2s, 4s, 8s, etc.
    const violations = Math.max(0, requestCount - config.maxRequests);
    return Math.min(30000, 1000 * Math.pow(2, violations)); // Max 30 seconds
  }

  async isBlocked(key: string): Promise<{ blocked: boolean; blockedUntil?: number }> {
    const blockKey = `${this.prefix}${key}:blocked`;
    const blockedUntil = await this.redis.get(blockKey);

    if (blockedUntil) {
      const until = parseInt(blockedUntil);
      if (Date.now() < until) {
        return { blocked: true, blockedUntil: until };
      } else {
        // Block expired, remove it
        await this.redis.del(blockKey);
      }
    }

    return { blocked: false };
  }

  async resetLimit(key: string): Promise<void> {
    const redisKey = this.prefix + key;
    await this.redis.del(redisKey, `${redisKey}:blocked`);
  }
}
```

### Rate Limiting Policies

```typescript
const RATE_LIMIT_POLICIES = {
  // OTP Generation
  otpGeneration: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 3, // 3 OTP requests per minute
    blockDurationMs: 15 * 60 * 1000, // 15 minute block
    progressiveDelay: true
  },

  // OTP Verification Attempts
  otpVerification: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 5, // 5 attempts per 5 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minute block
    progressiveDelay: true
  },

  // Invitation Creation
  invitationCreation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10, // 10 invitations per hour
    blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
    progressiveDelay: false
  },

  // Login Attempts
  loginAttempts: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
    blockDurationMs: 60 * 60 * 1000, // 1 hour block
    progressiveDelay: true
  },

  // API Requests (general)
  apiRequests: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    blockDurationMs: 5 * 60 * 1000, // 5 minute block
    progressiveDelay: false
  }
} as const;
```

### Rate Limiting Middleware

```typescript
interface RateLimitMiddlewareOptions {
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipErrors?: boolean;
  onLimitExceeded?: (req: Request, res: Response) => void;
}

function createRateLimitMiddleware(
  policy: keyof typeof RATE_LIMIT_POLICIES,
  options: RateLimitMiddlewareOptions = {}
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const config = RATE_LIMIT_POLICIES[policy];

    // Generate rate limit key
    const key = options.keyGenerator
      ? options.keyGenerator(req)
      : `${req.ip}:${req.path}`;

    // Check if already blocked
    const blockStatus = await rateLimiter.isBlocked(key);
    if (blockStatus.blocked) {
      const remainingTime = Math.ceil((blockStatus.blockedUntil! - Date.now()) / 1000);

      res.set({
        'X-RateLimit-Blocked': 'true',
        'X-RateLimit-Block-Remaining': remainingTime.toString(),
        'Retry-After': remainingTime.toString()
      });

      if (options.onLimitExceeded) {
        options.onLimitExceeded(req, res);
      } else {
        res.status(429).json({
          error: 'Too many requests',
          retryAfter: remainingTime
        });
      }
      return;
    }

    // Check rate limit
    const result = await rateLimiter.checkLimit(key, config);

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': config.maxRequests.toString(),
      'X-RateLimit-Remaining': result.remainingRequests.toString(),
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      'X-RateLimit-Window': config.windowMs.toString()
    });

    if (!result.allowed) {
      if (result.delayMs) {
        // Progressive delay
        res.set('X-RateLimit-Delay', result.delayMs.toString());
        await new Promise(resolve => setTimeout(resolve, result.delayMs));
      }

      if (result.blockedUntil) {
        const remainingTime = Math.ceil((result.blockedUntil - Date.now()) / 1000);
        res.set({
          'X-RateLimit-Blocked': 'true',
          'X-RateLimit-Block-Remaining': remainingTime.toString(),
          'Retry-After': remainingTime.toString()
        });
      }

      if (options.onLimitExceeded) {
        options.onLimitExceeded(req, res);
      } else {
        res.status(429).json({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          ...(result.delayMs && { delayApplied: result.delayMs })
        });
      }
      return;
    }

    // Add success handler to potentially skip rate limiting for successful requests
    if (options.skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode < 400) {
          // Successful request, don't count against limit
          rateLimiter.resetLimit(key);
        }
        return originalSend.call(this, data);
      };
    }

    next();
  };
}
```

## Code Changes Required

### 1. New Files to Create

**`src/lib/rate-limiting/RedisRateLimiter.ts`**
- Core Redis rate limiting logic
- Progressive delay and blockout calculations
- Key management and cleanup

**`src/lib/rate-limiting/policies.ts`**
- Rate limiting policy configurations
- Different policies for different endpoints
- Configurable limits and durations

**`src/middleware/rateLimit.ts`**
- Express middleware for rate limiting
- Header injection and error handling
- Custom key generators

**`src/lib/rate-limiting/RateLimitMonitor.ts`**
- Monitoring and metrics collection
- Alert generation for abuse patterns
- Rate limit analytics

### 2. Files to Modify

**`server.js`**
```typescript
// Add Redis connection
const redis = new Redis(process.env.REDIS_URL);

// Initialize rate limiter
const rateLimiter = new RedisRateLimiter(redis);

// Apply rate limiting to routes
app.use('/api/auth/login', createRateLimitMiddleware('loginAttempts'));
app.use('/api/auth/otp/generate', createRateLimitMiddleware('otpGeneration'));
app.use('/api/invitations', createRateLimitMiddleware('invitationCreation'));
app.use('/api/', createRateLimitMiddleware('apiRequests'));
```

**`src/services/OTPService.ts`**
```typescript
// Remove client-side rate limiting
export class ServerSideOTPService extends OTPService {
  async generateOTP(email: string, type: OTPType): Promise<OTPToken> {
    // Rate limiting now handled by middleware
    // Generate and return OTP
    return await super.generateOTP(email, type);
  }
}
```

**`src/services/InvitationService.ts`**
```typescript
// Remove client-side rate limiting
export class ServerSideInvitationService extends InvitationService {
  async createInvitation(data: InvitationRequest): Promise<Invitation> {
    // Rate limiting now handled by middleware
    // Create and return invitation
    return await super.createInvitation(data);
  }
}
```

### 3. Database Schema Updates

```sql
-- Add rate limiting audit table
CREATE TABLE RATE_LIMIT_EVENTS (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    endpoint VARCHAR(255),
    user_id UUID REFERENCES USERS(id),
    action VARCHAR(50), -- 'allowed', 'delayed', 'blocked'
    request_count INTEGER,
    delay_applied INTEGER, -- milliseconds
    blocked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_rate_limit_events_key_time ON RATE_LIMIT_EVENTS(key, created_at);
CREATE INDEX idx_rate_limit_events_ip ON RATE_LIMIT_EVENTS(ip_address);
CREATE INDEX idx_rate_limit_events_user ON RATE_LIMIT_EVENTS(user_id);

-- Partition by month for large volumes
-- (Implementation depends on PostgreSQL version)
```

## Testing Strategy

### Unit Tests

**`src/lib/rate-limiting/__tests__/RedisRateLimiter.test.ts`**
```typescript
describe('RedisRateLimiter', () => {
  let rateLimiter: RedisRateLimiter;
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      multi: jest.fn().mockReturnThis(),
      zremrangebyscore: jest.fn(),
      zcard: jest.fn(),
      zadd: jest.fn(),
      pexpire: jest.fn(),
      exec: jest.fn(),
      setex: jest.fn(),
      get: jest.fn(),
      del: jest.fn()
    };
    rateLimiter = new RedisRateLimiter(mockRedis);
  });

  it('should allow requests within limit', async () => {
    mockRedis.exec.mockResolvedValue([
      [null, 1], // zremrangebyscore
      [null, 2], // zcard (2 requests in window)
      [null, 1], // zadd
      [null, 1]  // pexpire
    ]);

    const result = await rateLimiter.checkLimit('test-key', {
      windowMs: 60000,
      maxRequests: 5,
      blockDurationMs: 300000
    });

    expect(result.allowed).toBe(true);
    expect(result.remainingRequests).toBe(3);
  });

  it('should block requests over limit', async () => {
    mockRedis.exec.mockResolvedValue([
      [null, 1], // zremrangebyscore
      [null, 7], // zcard (7 requests - over limit of 5)
      [null, 1], // zadd
      [null, 1]  // pexpire
    ]);

    const result = await rateLimiter.checkLimit('test-key', {
      windowMs: 60000,
      maxRequests: 5,
      blockDurationMs: 300000
    });

    expect(result.allowed).toBe(false);
    expect(result.blockedUntil).toBeDefined();
  });
});
```

### Integration Tests

**`tests/api/rate-limiting.test.ts`**
```typescript
describe('Rate Limiting Integration', () => {
  it('should allow requests within limit', async () => {
    for (let i = 0; i < 3; i++) {
      const response = await request(app)
        .post('/api/auth/otp/generate')
        .send({ email: 'test@example.com' });

      if (i < 2) {
        expect(response.status).toBe(200);
      } else {
        expect(response.status).toBe(429);
      }
    }
  });

  it('should apply progressive delays', async () => {
    // First exceed limit
    const startTime = Date.now();

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'wrong' });

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should have applied delay
    expect(response.headers['x-ratelimit-delay']).toBeDefined();
    expect(duration).toBeGreaterThan(parseInt(response.headers['x-ratelimit-delay']));
  });

  it('should set proper headers', async () => {
    const response = await request(app)
      .get('/api/some-endpoint')
      .set('X-Forwarded-For', '192.168.1.1');

    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    expect(response.headers['x-ratelimit-reset']).toBeDefined();
  });
});
```

### Load Testing

**`tests/load/rate-limiting.load.test.ts`**
```typescript
describe('Rate Limiting Load Tests', () => {
  it('should handle high concurrent load', async () => {
    const promises = [];
    for (let i = 0; i < 100; i++) {
      promises.push(
        request(app)
          .post('/api/auth/otp/generate')
          .send({ email: `test${i}@example.com` })
      );
    }

    const results = await Promise.all(promises);
    const allowed = results.filter(r => r.status === 200).length;
    const blocked = results.filter(r => r.status === 429).length;

    expect(allowed + blocked).toBe(100);
    expect(allowed).toBeLessThanOrEqual(3); // Only 3 allowed per minute
  });
});
```

## Success Criteria

### Functional Requirements
- [ ] **Redis Integration:** Rate limiter connects to Redis successfully
- [ ] **Policy Application:** Different policies applied to different endpoints
- [ ] **Progressive Delays:** Delays increase with repeated violations
- [ ] **Blockout Enforcement:** Accounts blocked after excessive violations
- [ ] **Header Injection:** Proper rate limit headers in responses
- [ ] **Client-Side Removal:** All client-side rate limiting code removed

### Security Requirements
- [ ] **IP-Based Limiting:** Rate limits applied per IP address
- [ ] **User-Based Limiting:** Additional limits for authenticated users
- [ ] **Brute Force Protection:** Login attempts properly limited
- [ ] **OTP Abuse Prevention:** OTP generation and verification limited
- [ ] **Audit Logging:** All rate limit events logged

### Performance Requirements
- [ ] **Low Latency:** Rate limit checks < 5ms
- [ ] **Memory Efficient:** Redis memory usage within limits
- [ ] **Scalable:** Handles high request volumes
- [ ] **Concurrent Safe:** Thread-safe operations
- [ ] **Cleanup:** Old rate limit data automatically cleaned

### Monitoring Requirements
- [ ] **Metrics Collection:** Rate limit metrics collected
- [ ] **Alert Generation:** Alerts for abuse patterns
- [ ] **Dashboard Integration:** Rate limiting visible in admin dashboard
- [ ] **Log Analysis:** Rate limit logs analyzable
- [ ] **Trend Analysis:** Usage patterns tracked over time

## Dependencies and Blockers

### Dependencies
- Redis server (local or cloud)
- Redis client library (ioredis)
- Task 8.2.1 (HMAC Tokens) - for secure key generation

### Blockers
- Redis infrastructure setup
- Environment configuration for Redis connection
- Migration from client-side to server-side rate limiting

## Risk Mitigation

### Technical Risks
- **Redis Failure:** Fallback to in-memory rate limiting
- **Memory Issues:** Redis memory monitoring and cleanup
- **Key Conflicts:** Proper key namespacing
- **Clock Sync:** NTP synchronization for time-based limits
- **Connection Issues:** Redis connection pooling and retry logic

### Security Risks
- **Key Prediction:** Cryptographically secure key generation
- **IP Spoofing:** Proper IP address extraction
- **Header Injection:** Sanitize custom headers
- **Information Leakage:** Don't expose internal rate limit details
- **Bypass Attempts:** Multiple key strategies to prevent bypass

### Operational Risks
- **Alert Fatigue:** Configurable alert thresholds
- **False Positives:** Adjustable rate limit policies
- **Maintenance:** Automated cleanup of old data
- **Scaling:** Redis cluster support for high load
- **Backup:** Rate limit data backup strategy

---

*This task implements comprehensive server-side rate limiting to protect against abuse and ensure system stability.*
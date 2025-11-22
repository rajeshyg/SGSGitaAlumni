# Rate Limiting Configuration Guide

**Last Updated:** November 3, 2025
**Version:** 1.0
**Status:** Production Ready

---

## Overview

The SGS Gita Alumni application implements comprehensive Redis-backed rate limiting to protect against abuse, brute force attacks, and resource exhaustion. This document explains how to configure, use, and monitor the rate limiting system.

### Key Features

- ✅ **Redis-Backed:** Distributed rate limiting across multiple server instances
- ✅ **Progressive Delays:** Automatic slowdown as limits approach
- ✅ **Graceful Fallback:** In-memory tracking when Redis unavailable
- ✅ **Admin Bypass:** Administrators exempt from rate limits
- ✅ **Comprehensive Headers:** Full rate limit status in HTTP headers
- ✅ **Client-Side Retry:** Automatic retry logic with backoff

### Architecture

```
Client Request
     ↓
Rate Limit Middleware (Express)
     ↓
RedisRateLimiter (Check/Update)
     ↓
Redis (Distributed State)
     ↓
[If Blocked] → 429 Response + Headers
[If Allowed] → Continue to Route Handler
```

---

## Rate Limit Policies

### Policy Overview

The system implements 3 specialized rate limit policies, each designed for specific use cases:

| Policy | Window | Limit | Use Case | Reset Behavior |
|--------|--------|-------|----------|----------------|
| `email` | 1 hour | 5 requests | Email sending (OTP, notifications) | Sliding window |
| `search` | 1 minute | 30 requests | Search operations | Fixed window |
| `registration` | 1 hour | 3 requests | Account creation | Sliding window |

### Email Policy (`email`)
**Purpose:** Prevent email spam and abuse of notification systems

**Configuration:**
```javascript
// src/lib/security/RedisRateLimiter.ts
emailPolicy: {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  message: 'Too many emails sent. Please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}
```

**Use Cases:**
- OTP token generation (`POST /api/auth/otp`)
- Password reset emails
- Account verification emails
- Bulk notifications

### Search Policy (`search`)
**Purpose:** Prevent search abuse and protect database performance

**Configuration:**
```javascript
searchPolicy: {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30,
  message: 'Too many search requests. Please slow down.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}
```

**Use Cases:**
- Alumni directory search
- Posting search and filtering
- Domain/category browsing
- Auto-complete suggestions

### Registration Policy (`registration`)
**Purpose:** Prevent automated account creation and spam registrations

**Configuration:**
```javascript
registrationPolicy: {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 3,
  message: 'Too many registration attempts. Please try again later.',
  skipSuccessfulRequests: false,
  skipFailedRequests: false
}
```

**Use Cases:**
- User account creation
- Family account setup
- Invitation acceptance
- Profile updates (limited)

---

## Redis Configuration

### Redis Setup Requirements

**Minimum Redis Version:** 6.0+
**Recommended:** Redis 7.0+ with persistence enabled

### Connection Configuration

```javascript
// src/lib/security/RedisRateLimiter.ts
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true
};
```

### Environment Variables

```bash
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REDIS_FALLBACK=true
```

### Redis Key Structure

Rate limit data stored with structured keys:

```
rate-limit:{policy}:{identifier}:{window}
```

**Examples:**
- `rate-limit:email:user-123:1703123456789`
- `rate-limit:search:ip-192.168.1.1:1703123400000`
- `rate-limit:registration:session-abc:1703123456789`

### Memory Management

**Key Expiry:** Automatic cleanup after window expires
**Memory Usage:** ~50 bytes per active rate limit window
**Cleanup:** Redis automatically removes expired keys

---

## Client-Side Integration

### Automatic Retry Handler

The client-side handler provides automatic retry with exponential backoff:

```typescript
// src/lib/utils/rateLimitHandler.ts
export const handleRateLimit = async (error: any) => {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    const resetTime = error.response.headers['x-ratelimit-reset'];

    // Exponential backoff with jitter
    const delay = Math.min(
      Math.pow(2, retryCount) * 1000 + Math.random() * 1000,
      30000 // Max 30 seconds
    );

    await new Promise(resolve => setTimeout(resolve, delay));
    return retryRequest();
  }
};
```

### Rate Limit Headers

All responses include comprehensive rate limit information:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703123456789
Retry-After: 3600

{
  "error": "Too many emails sent. Please try again later.",
  "retryAfter": 3600,
  "resetTime": "2025-11-03T15:30:56.789Z"
}
```

### Integration Example

```typescript
// src/hooks/useApi.ts
const apiCall = async (endpoint: string, data?: any) => {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.status === 429) {
      // Handle rate limit with retry
      return await handleRateLimit(response);
    }

    return response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};
```

---

## Monitoring & Management

### Real-Time Monitoring

Monitor rate limiting activity through Redis:

```bash
# Check active rate limits
redis-cli KEYS "rate-limit:*"

# Monitor specific policy
redis-cli KEYS "rate-limit:email:*"

# Get rate limit info for user
redis-cli GET "rate-limit:email:user-123:1703123456789"
```

### Admin Bypass

Administrators are automatically exempt from rate limits:

```javascript
// middleware/rateLimit.js
const isAdmin = req.user?.role === 'admin' || req.user?.role === 'moderator';
if (isAdmin) {
  return next(); // Skip rate limiting
}
```

### Manual Reset

Reset rate limits for specific users (admin only):

```javascript
// Admin endpoint to reset limits
app.post('/api/admin/reset-rate-limit', requireAdmin, async (req, res) => {
  const { userId, policy } = req.body;

  // Delete all rate limit keys for user
  const keys = await redis.keys(`rate-limit:${policy}:${userId}:*`);
  if (keys.length > 0) {
    await redis.del(keys);
  }

  res.json({ message: 'Rate limits reset successfully' });
});
```

---

## Testing Guidelines

### Unit Tests

```javascript
// tests/unit/rate-limiting.test.js
describe('Rate Limiting', () => {
  it('should allow requests under limit', async () => {
    const response = await request(app)
      .post('/api/auth/otp')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.headers['x-ratelimit-remaining']).toBe('4');
  });

  it('should block requests over limit', async () => {
    // Make 5 requests to hit limit
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/otp').send({ email: 'test@example.com' });
    }

    const response = await request(app)
      .post('/api/auth/otp')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(429);
    expect(response.headers['retry-after']).toBeDefined();
  });
});
```

### Integration Tests

```javascript
// tests/integration/rate-limiting.test.js
describe('Rate Limiting Integration', () => {
  beforeEach(async () => {
    // Clear Redis before each test
    await redis.flushdb();
  });

  it('should handle concurrent requests correctly', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        request(app).post('/api/search').send({ query: 'test' })
      );
    }

    const responses = await Promise.all(promises);
    const blockedCount = responses.filter(r => r.status === 429).length;

    expect(blockedCount).toBe(0); // All should pass (under 30/minute limit)
  });
});
```

### Load Testing

```bash
# Load test with artillery
# config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: 'Rate limit test'
    requests:
      - post:
          url: '/api/auth/otp'
          json:
            email: 'test@example.com'
```

---

## Troubleshooting

### Common Issues

#### 1. Redis Connection Failed
**Symptoms:** Rate limiting falls back to in-memory, inconsistent across instances

**Solutions:**
- Check Redis server status: `redis-cli ping`
- Verify connection string in environment variables
- Check Redis logs for connection errors
- Ensure Redis is accessible from application servers

#### 2. Rate Limits Too Restrictive
**Symptoms:** Legitimate users getting blocked

**Solutions:**
- Review policy configurations in `RedisRateLimiter.ts`
- Check if limits are appropriate for use case
- Consider increasing limits for specific endpoints
- Implement user-specific limits for premium users

#### 3. Memory Usage High
**Symptoms:** Redis memory growing rapidly

**Solutions:**
- Check for key expiry: `redis-cli KEYS "rate-limit:*" | wc -l`
- Verify TTL settings on rate limit keys
- Consider shorter windows for high-traffic policies
- Implement key cleanup for inactive users

#### 4. Inconsistent Behavior
**Symptoms:** Same user gets different responses

**Solutions:**
- Check if multiple application instances are using same Redis
- Verify Redis cluster configuration
- Check network connectivity between app and Redis
- Review load balancer sticky sessions

### Debug Commands

```bash
# Check Redis connectivity
redis-cli -h localhost -p 6379 ping

# Monitor rate limit keys
redis-cli MONITOR | grep "rate-limit"

# Check key TTL
redis-cli TTL "rate-limit:email:user-123:1703123456789"

# Get all rate limit keys
redis-cli KEYS "rate-limit:*"

# Clear all rate limits (emergency only)
redis-cli FLUSHDB
```

### Emergency Procedures

#### Complete Rate Limit Reset
```bash
# Stop application
docker-compose down

# Clear Redis
redis-cli FLUSHDB

# Restart application
docker-compose up -d
```

#### Temporary Disable Rate Limiting
```bash
# Set environment variable
export RATE_LIMIT_ENABLED=false

# Restart application
docker-compose restart app
```

---

## Performance Benchmarks

### Expected Performance

- **Redis Operations:** < 5ms per request
- **Memory Usage:** ~50 bytes per active window
- **Throughput:** 10,000+ requests/second
- **Latency Impact:** < 1ms added to response time

### Monitoring Queries

```sql
-- Rate limit hits by policy (if logging to database)
SELECT
  policy,
  COUNT(*) as hits,
  DATE_TRUNC('hour', created_at) as hour
FROM rate_limit_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY policy, DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;
```

---

## Security Considerations

### Data Protection
- Rate limit keys contain user identifiers
- Implement proper key encryption if sensitive data
- Regular key rotation for security

### Abuse Prevention
- Monitor for rate limit bypass attempts
- Implement IP-based blocking for extreme cases
- Log suspicious patterns for analysis

### Compliance
- Rate limiting helps prevent DDoS attacks
- Maintain logs for security investigations
- Implement proper data retention policies

---

*This rate limiting system provides robust protection against abuse while maintaining excellent user experience through intelligent retry logic and comprehensive monitoring.*
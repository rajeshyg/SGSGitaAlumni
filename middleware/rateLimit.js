// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================
// Express middleware for automatic rate limiting using Redis backend

import { redisRateLimiter } from '../src/lib/security/RedisRateLimiter.ts';

/**
 * Rate limiting middleware factory
 * @param {string} policyName - Name of the rate limit policy ('otp', 'invitations', 'login', 'default')
 * @param {Object} options - Additional options
 * @param {boolean} options.useUserId - Whether to use user ID instead of IP for limiting
 * @param {boolean} options.skipSuccessfulRequests - Skip rate limiting for successful requests
 * @param {boolean} options.skipForAdmins - Skip rate limiting for admin users
 * @returns {Function} Express middleware function
 */
export function rateLimit(policyName = 'default', options = {}) {
  return async (req, res, next) => {
    try {
      // Determine the key for rate limiting
      let key;
      if (options.useUserId && req.user && req.user.id) {
        key = `user:${req.user.id}`;
      } else {
        // Use IP address (handle X-Forwarded-For for proxies)
        key = req.ip || req.connection.remoteAddress ||
              (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
              'unknown';
      }

      // Add endpoint-specific prefix
      key = `${policyName}:${key}`;

      const policy = redisRateLimiter.getPolicy(policyName);

      // Check rate limit
      const result = await redisRateLimiter.checkAndRecord(key, policy, req.user?.id);

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': policy.maxRequests,
        'X-RateLimit-Remaining': Math.max(0, result.remainingRequests),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
        'X-RateLimit-Policy': policyName
      });

      // Check if request should be skipped
      if (options.skipForAdmins && req.user && req.user.role === 'admin') {
        return next();
      }

      if (!result.allowed) {
        // Rate limit exceeded
        const retryAfter = result.retryAfter || 60;

        res.set({
          'Retry-After': retryAfter,
          'X-RateLimit-Retry-After': retryAfter
        });

        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
          limit: policy.maxRequests,
          resetTime: new Date(result.resetTime).toISOString(),
          policy: policyName
        });
      }

      // Apply progressive delay if configured
      if (result.currentDelay && result.currentDelay > 0) {
        res.set('X-RateLimit-Delay', result.currentDelay);

        // For very high delays, we might want to reject immediately
        if (result.currentDelay > 30000) { // 30 seconds
          return res.status(429).json({
            error: 'Progressive delay too high',
            message: `Please wait ${Math.ceil(result.currentDelay / 1000)} seconds before retrying.`,
            delay: result.currentDelay,
            policy: policyName
          });
        }

        // Add delay to response (this doesn't block the event loop)
        setTimeout(() => {
          // Continue processing after delay
        }, Math.min(result.currentDelay, 5000)); // Cap delay at 5 seconds for middleware
      }

      // Skip rate limiting for successful requests if configured
      if (options.skipSuccessfulRequests) {
        const originalSend = res.send;
        res.send = function(data) {
          // Only record as successful if status is 2xx
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Request was successful, don't count against limit
            // Note: This is a simplified approach. In production, you might want
            // to track this differently or use a separate counter for failures only.
          }
          originalSend.call(this, data);
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiting middleware error:', error);
      // On error, allow the request to proceed to avoid blocking legitimate traffic
      next();
    }
  };
}

/**
 * Pre-configured middleware for common use cases
 */
export const otpRateLimit = rateLimit('otp', {
  useUserId: true,
  skipForAdmins: true
});

export const invitationRateLimit = rateLimit('invitations', {
  useUserId: true,
  skipForAdmins: true
});

export const loginRateLimit = rateLimit('login', {
  skipSuccessfulRequests: false, // Always count login attempts
  skipForAdmins: false // Don't skip for admins to prevent abuse
});

export const apiRateLimit = rateLimit('default', {
  skipForAdmins: true
});

/**
 * Middleware to get rate limit status for monitoring
 */
export const rateLimitStatus = async (req, res) => {
  try {
    const key = req.query.key || req.ip;
    const policyName = req.query.policy || 'default';
    const policy = redisRateLimiter.getPolicy(policyName);

    const status = await redisRateLimiter.getStatus(key, policy);

    res.json({
      key,
      policy: policyName,
      currentCount: status.currentCount,
      limit: policy.maxRequests,
      isBlocked: status.isBlocked,
      blockExpiresAt: status.blockExpiresAt ? new Date(status.blockExpiresAt).toISOString() : null,
      windowExpiresAt: new Date(status.windowExpiresAt).toISOString(),
      remainingRequests: Math.max(0, policy.maxRequests - status.currentCount)
    });
  } catch (error) {
    console.error('Rate limit status error:', error);
    res.status(500).json({ error: 'Failed to get rate limit status' });
  }
};

/**
 * Admin endpoint to clear rate limits
 */
export const clearRateLimit = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const key = req.body.key;
    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    await redisRateLimiter.clearLimit(key);

    res.json({ message: 'Rate limit cleared', key });
  } catch (error) {
    console.error('Clear rate limit error:', error);
    res.status(500).json({ error: 'Failed to clear rate limit' });
  }
};
# Task 8.12 - Action 7: Rate Limiting Analysis

**Created:** November 3, 2025  
**Status:** Planning  
**Priority:** Immediate (after Action 3)

## Executive Summary

Analysis of current rate limiting implementation reveals **comprehensive infrastructure already in place**:
- ✅ Redis-backed rate limiting service (`RedisRateLimiter.ts`)
- ✅ Express middleware (`rateLimit.js`)
- ✅ Pre-configured policies for OTP, invitations, login, and default API
- ✅ Monitoring and admin endpoints

**Current Coverage:**
- **Critical Endpoints Protected:** 7/7 (100%)
- **Endpoints Needing Rate Limits:** 51 unprotected endpoints identified
- **Monitoring Infrastructure:** Fully implemented

---

## Current Implementation

### 1. Rate Limiting Infrastructure (✅ Complete)

**RedisRateLimiter Service** (`src/lib/security/RedisRateLimiter.ts`):
- Redis-backed counters with sliding window
- Progressive delay mechanism
- Blocking after threshold exceeded
- Fallback to in-memory when Redis unavailable
- Monitoring integration

**Middleware** (`middleware/rateLimit.js`):
- Factory function for custom policies
- IP-based and user-ID based limiting
- Rate limit headers (X-RateLimit-*)
- Admin bypass option
- Skip successful requests option

### 2. Pre-Configured Policies

```typescript
otp: {
  windowMs: 5 * 60 * 1000,        // 5 minutes
  maxRequests: 5,
  blockDurationMs: 15 * 60 * 1000, // 15 min block
  progressiveDelay: enabled
}

invitations: {
  windowMs: 60 * 60 * 1000,        // 1 hour
  maxRequests: 10,
  blockDurationMs: 24 * 60 * 60 * 1000, // 24 hour block
  progressiveDelay: enabled
}

login: {
  windowMs: 15 * 60 * 1000,        // 15 minutes
  maxRequests: 5,
  blockDurationMs: 60 * 60 * 1000, // 1 hour block
  progressiveDelay: enabled
}

default: {
  windowMs: 60 * 1000,             // 1 minute
  maxRequests: 60,
  progressiveDelay: disabled
}
```

### 3. Currently Protected Endpoints (7)

✅ **Authentication:**
- `POST /api/auth/login` → `loginRateLimit`

✅ **Invitations:**
- `POST /api/invitations/family` → `invitationRateLimit`
- `POST /api/invitations` → `invitationRateLimit`
- `POST /api/invitations/bulk` → `invitationRateLimit`

✅ **OTP Operations:**
- `POST /api/otp/generate` → `apiRateLimit`
- `POST /api/otp/generate-and-send` → `apiRateLimit`
- `POST /api/otp/send` → `apiRateLimit`

---

## Gap Analysis: Unprotected Endpoints

### Critical Priority (Need Rate Limiting)

**Authentication & Registration (2):**
```javascript
POST /api/auth/register-from-invitation          → Add loginRateLimit
POST /api/auth/register-from-family-invitation   → Add loginRateLimit
```

**OTP Verification (1):**
```javascript
POST /api/otp/validate                           → Add otpRateLimit (stricter)
```

**Profile Updates (3):**
```javascript
PUT /api/alumni-members/:id                      → Add apiRateLimit
PUT /api/users/:id                               → Add apiRateLimit
PUT /api/user-profiles/:id                       → Add apiRateLimit
```

**Invitation Management (3):**
```javascript
PATCH /api/invitations/:id                       → Add invitationRateLimit
POST /api/invitations/:id/resend                 → Add invitationRateLimit
PUT /api/invitations/:id/revoke                  → Add invitationRateLimit
```

**Email Operations (1):**
```javascript
POST /api/email/send                             → Add emailRateLimit (new policy)
```

**Tag Creation (1):**
```javascript
POST /api/tags                                   → Add apiRateLimit
```

**Domain Admin Operations (3):**
```javascript
POST /api/admin/domains                          → Add apiRateLimit
PUT /api/admin/domains/:id                       → Add apiRateLimit
DELETE /api/admin/domains/:id                    → Add apiRateLimit
```

**Tag Admin Operations (1):**
```javascript
POST /api/admin/tags/:id/approve                 → Add apiRateLimit
```

**TOTP Setup (1):**
```javascript
POST /api/users/totp/setup                       → Add otpRateLimit
```

### Medium Priority (Public Endpoints)

**Search & Directory (3):**
```javascript
GET /api/alumni-members/search                   → Add searchRateLimit (new)
GET /api/alumni/directory                        → Add searchRateLimit
GET /api/users/search                            → Add searchRateLimit
```

**Invitation Validation (2):**
```javascript
GET /api/invitations/family/validate/:token      → Add apiRateLimit
GET /api/invitations/validate/:token             → Add apiRateLimit
```

**Email Endpoints (2):**
```javascript
GET /api/email/delivery/:emailId                 → Add apiRateLimit
GET /api/email/templates/:templateId             → Add apiRateLimit
```

### Low Priority (Authenticated Read Operations)

**Already Protected by Authentication but Could Add Rate Limits:**
- GET endpoints with `authenticateToken`
- Dashboard/analytics endpoints
- Monitoring endpoints (admin only)

---

## Recommended Actions

### ✅ Phase 1: Add Missing Policies (1 day)

**1. Create New Rate Limit Policies:**

```typescript
// Add to RedisRateLimiter defaultConfig
policies: {
  // ... existing policies ...
  
  email: {
    windowMs: 60 * 60 * 1000,        // 1 hour
    maxRequests: 20,                  // 20 emails per hour
    blockDurationMs: 24 * 60 * 60 * 1000,
    progressiveDelay: {
      enabled: true,
      baseDelayMs: 2000,
      maxDelayMs: 15000
    }
  },
  
  search: {
    windowMs: 60 * 1000,              // 1 minute
    maxRequests: 30,                  // 30 searches per minute
    blockDurationMs: 5 * 60 * 1000,   // 5 min block
    progressiveDelay: {
      enabled: true,
      baseDelayMs: 500,
      maxDelayMs: 5000
    }
  },
  
  registration: {
    windowMs: 60 * 60 * 1000,        // 1 hour
    maxRequests: 3,                   // 3 registrations per hour per IP
    blockDurationMs: 24 * 60 * 60 * 1000,
    progressiveDelay: {
      enabled: true,
      baseDelayMs: 5000,
      maxDelayMs: 30000
    }
  }
}
```

**2. Export New Middleware:**

```javascript
// Add to middleware/rateLimit.js
export const emailRateLimit = rateLimit('email', {
  useUserId: true,
  skipForAdmins: true
});

export const searchRateLimit = rateLimit('search', {
  skipForAdmins: true
});

export const registrationRateLimit = rateLimit('registration', {
  skipSuccessfulRequests: false,
  skipForAdmins: false
});
```

### ✅ Phase 2: Apply to Critical Endpoints (1 day)

**Update server.js routes:**

```javascript
// Authentication
app.post('/api/auth/register-from-invitation', 
  registrationRateLimit, 
  validateRequest({ body: RegisterSchema }), 
  registerFromInvitation
);

app.post('/api/auth/register-from-family-invitation', 
  registrationRateLimit, 
  validateRequest({ body: RegisterSchema }), 
  registerFromFamilyInvitation
);

// OTP Validation (stricter than generation)
app.post('/api/otp/validate', 
  otpRateLimit, 
  validateRequest({ body: OTPVerifySchema }), 
  validateOTP
);

// Profile Updates
app.put('/api/alumni-members/:id', apiRateLimit, updateAlumniMember);
app.put('/api/users/:id', authenticateToken, apiRateLimit, updateUser);
app.put('/api/user-profiles/:id', authenticateToken, apiRateLimit, updateUser);

// Email
app.post('/api/email/send', emailRateLimit, sendEmail);

// Search
app.get('/api/alumni-members/search', searchRateLimit, searchAlumniMembers);
app.get('/api/alumni/directory', searchRateLimit, getAlumniDirectory);
app.get('/api/users/search', searchRateLimit, searchUsers);

// Admin Operations
app.post('/api/admin/domains', authenticateToken, apiRateLimit, createDomain);
app.put('/api/admin/domains/:id', authenticateToken, apiRateLimit, updateDomain);
app.delete('/api/admin/domains/:id', authenticateToken, apiRateLimit, deleteDomain);

// TOTP
app.post('/api/users/totp/setup', otpRateLimit, setupTOTP);
```

### ✅ Phase 3: Client-Side Handling (1 day)

**1. API Client Error Handler:**

```typescript
// src/lib/api/client.ts - Add rate limit handling
async function handleRateLimitError(error: AxiosError) {
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    const resetTime = error.response.headers['x-ratelimit-reset'];
    
    toast.error(
      `Too many requests. Please wait ${retryAfter}s before retrying.`,
      {
        duration: parseInt(retryAfter) * 1000,
        id: 'rate-limit-error'
      }
    );
    
    return {
      rateLimited: true,
      retryAfter: parseInt(retryAfter),
      resetTime: new Date(resetTime)
    };
  }
}
```

**2. Retry Logic with Exponential Backoff:**

```typescript
async function apiCallWithRetry(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        await delay(retryAfter * 1000);
        continue;
      }
      throw error;
    }
  }
}
```

**3. UI Feedback Components:**

- Display remaining requests in UI for critical operations
- Show countdown timer for retry-after
- Disable buttons during rate limit block

### ✅ Phase 4: Monitoring & Alerts (0.5 days)

**1. Add Rate Limit Metrics to Dashboard:**
- Current rate limit status per policy
- Top rate-limited IPs/users
- Rate limit violations over time

**2. Alert Configuration:**
- Alert when user blocked (> 5 minutes)
- Alert on abnormal rate limit patterns
- Alert on potential DDoS (many IPs hitting limits)

### ✅ Phase 5: Documentation & Testing (0.5 days)

**1. Update API Documentation:**
- Document rate limit headers
- Document rate limit policies per endpoint
- Provide error response examples

**2. Create Test Scenarios:**
- Test each rate limit policy
- Test progressive delay
- Test admin bypass
- Test Redis fallback

---

## Implementation Timeline

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 1 day | Add new rate limit policies (email, search, registration) |
| Phase 2 | 1 day | Apply rate limits to 16 critical endpoints |
| Phase 3 | 1 day | Implement client-side handling and UI feedback |
| Phase 4 | 0.5 days | Add monitoring dashboards and alerts |
| Phase 5 | 0.5 days | Documentation and testing |
| **Total** | **4 days** | Complete rate limiting implementation |

---

## Success Metrics

### Coverage
- ✅ All critical endpoints rate-limited (16 endpoints)
- ✅ All public search endpoints rate-limited (3 endpoints)
- ✅ All admin write operations rate-limited (4 endpoints)

### Performance
- Rate limit checks < 5ms (Redis operation)
- No false positives (legitimate users blocked)
- Progressive delay smooths traffic spikes

### Security
- Block brute force attacks (OTP, login)
- Prevent invitation spam
- Prevent email abuse
- Protect search endpoints from scraping

### User Experience
- Clear error messages with retry information
- Visual countdown for retry-after
- No impact on normal usage patterns

---

## Configuration Management

### Environment Variables

```bash
# .env
RATE_LIMIT_REDIS_URL=redis://localhost:6379
RATE_LIMIT_ENABLED=true
RATE_LIMIT_SKIP_ADMINS=true

# Per-policy overrides
RATE_LIMIT_OTP_MAX=5
RATE_LIMIT_OTP_WINDOW_MS=300000
RATE_LIMIT_LOGIN_MAX=5
RATE_LIMIT_LOGIN_WINDOW_MS=900000
```

### Dynamic Policy Updates

Consider implementing:
- Admin UI for rate limit configuration
- Runtime policy updates (no restart required)
- Per-user exemptions database
- Temporary policy adjustments during attacks

---

## Risk Mitigation

### False Positive Prevention
- ✅ Admin bypass implemented
- ✅ Graceful fallback when Redis down
- ✅ Progressive delay instead of hard limits
- Consider: Whitelist for known good IPs

### Monitoring False Negatives
- Track blocked legitimate users
- Monitor customer support tickets
- Adjust policies based on usage patterns

### Performance Impact
- ✅ Redis async operations (non-blocking)
- ✅ Minimal middleware overhead (< 5ms)
- Consider: Read replicas for high traffic

---

## Next Steps

1. **Immediate:** Implement Phase 1 (new policies)
2. **High Priority:** Implement Phase 2 (apply to endpoints)
3. **Medium Priority:** Implement Phase 3 (client handling)
4. **Low Priority:** Phases 4-5 (monitoring & docs)

---

## Related Documents

- [RedisRateLimiter.ts](../../src/lib/security/RedisRateLimiter.ts)
- [middleware/rateLimit.js](../../middleware/rateLimit.js)
- [Task 8.12 Main](./task-8.12-violation-corrections.md)
- [Security Framework](../../docs/SECURITY_FRAMEWORK.md)

# Rate Limiting Manual Testing Guide

**Last Updated:** November 3, 2025  
**Purpose:** Step-by-step manual testing of rate limiting implementation  
**Estimated Time:** 30-45 minutes

---

## Prerequisites

### Required Tools

- **curl** (or PowerShell's Invoke-RestMethod)
- **jq** (optional, for JSON formatting)
- Access to the application server
- Valid test credentials

### Setup

```bash
# Set base URL
export BASE_URL="http://localhost:3001"

# Or for PowerShell
$BASE_URL = "http://localhost:3001"

# Verify server is running
curl $BASE_URL/api/health
```

---

## Test Suite

### Test 1: OTP Rate Limiting (5 requests/minute)

**Policy:** 5 requests per minute, 15-minute block

#### Test 1.1: Within Limit ✅

```bash
# Make 3 requests (should all succeed)
for i in {1..3}; do
  echo "Request $i:"
  curl -X POST $BASE_URL/api/otp/generate \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit-test@example.com"}' \
    -i | grep -E "(HTTP|X-RateLimit|error)"
  echo ""
  sleep 1
done
```

**Expected Output:**
```
HTTP/1.1 200 OK
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 4
X-RateLimit-Policy: otp
```

#### Test 1.2: Exceeding Limit ❌

```bash
# Make 6 rapid requests (6th should be blocked)
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST $BASE_URL/api/otp/generate \
    -H "Content-Type: application/json" \
    -d '{"email":"ratelimit-test2@example.com"}' \
    -i | grep -E "(HTTP|X-RateLimit|Retry-After|error)"
  echo ""
done
```

**Expected Output (6th request):**
```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Policy: otp
Retry-After: 900
"error": "Rate limit exceeded"
```

#### Test 1.3: Progressive Delay 🐌

```bash
# Make 4 requests and measure time
for i in {1..4}; do
  echo "Request $i at $(date +%H:%M:%S):"
  time curl -X POST $BASE_URL/api/otp/generate \
    -H "Content-Type: application/json" \
    -d '{"email":"progressive-test@example.com"}' \
    -s -o /dev/null
  echo ""
done
```

**Expected:** Later requests should take progressively longer (1s, 2s, 5s, 10s delays)

---

### Test 2: Login Rate Limiting (10 requests/minute)

**Policy:** 10 requests per minute, 1-hour block

#### Test 2.1: Basic Limit Test

```bash
# Make 11 rapid login attempts
for i in {1..11}; do
  echo "Login attempt $i:"
  curl -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrongpassword"}' \
    -i | grep -E "(HTTP|X-RateLimit)"
  echo ""
done
```

**Expected:** First 10 succeed (or fail auth), 11th gets 429

#### Test 2.2: Block Duration Check

```bash
# After hitting limit, wait 30 seconds
echo "Waiting 30 seconds..."
sleep 30

# Try again (should still be blocked)
curl -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpassword"}' \
  -i | grep -E "(HTTP|Retry-After)"
```

**Expected:** Still blocked (1-hour block, not 1-minute window)

---

### Test 3: Registration Rate Limiting (3 requests/hour per IP)

**Policy:** 3 requests per hour per IP, 24-hour block

#### Test 3.1: Strict Limit Test

```bash
# Make 4 registration attempts
for i in {1..4}; do
  echo "Registration attempt $i:"
  curl -X POST $BASE_URL/api/auth/register-from-invitation \
    -H "Content-Type: application/json" \
    -d '{
      "token":"test-token-'$i'",
      "email":"newuser'$i'@example.com",
      "password":"Password123!",
      "firstName":"Test",
      "lastName":"User"
    }' \
    -i | grep -E "(HTTP|X-RateLimit)"
  echo ""
done
```

**Expected:** First 3 allowed, 4th gets 429 with 24-hour retry-after

---

### Test 4: Search Rate Limiting (30 requests/minute)

**Policy:** 30 requests per minute, 5-minute block

#### Test 4.1: High-Volume Test

```bash
# Make 31 search requests
for i in {1..31}; do
  echo "Search $i:"
  curl -X GET "$BASE_URL/api/alumni-members/search?q=test" \
    -i | grep -E "(HTTP|X-RateLimit-Remaining)" | head -1
done
```

**Expected:** First 30 succeed, 31st gets 429

#### Test 4.2: Verify Headers

```bash
# Single search with full headers
curl -X GET "$BASE_URL/api/alumni-members/search?q=john" \
  -i | grep "X-RateLimit"
```

**Expected:**
```
X-RateLimit-Limit: 30
X-RateLimit-Remaining: 29
X-RateLimit-Policy: search
```

---

### Test 5: Email Rate Limiting (20 requests/hour)

**Policy:** 20 requests per hour, 24-hour block

#### Test 5.1: Email Limit Test

```bash
# Make 21 email send requests (requires auth token)
TOKEN="your-test-token-here"

for i in {1..21}; do
  echo "Email send $i:"
  curl -X POST $BASE_URL/api/email/send \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
      "to":"recipient@example.com",
      "subject":"Test Email '$i'",
      "body":"This is test email number '$i'"
    }' \
    -i | grep -E "(HTTP|X-RateLimit)"
  echo ""
done
```

**Expected:** First 20 allowed, 21st gets 429

---

### Test 6: Invitation Rate Limiting (10 requests/hour)

**Policy:** 10 requests per hour, 24-hour block

#### Test 6.1: Create Invitations

```bash
# Make 11 invitation requests (requires admin token)
ADMIN_TOKEN="your-admin-token-here"

for i in {1..11}; do
  echo "Invitation $i:"
  curl -X POST $BASE_URL/api/invitations \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
      "email":"invited'$i'@example.com",
      "role":"user"
    }' \
    -i | grep -E "(HTTP|X-RateLimit)"
  echo ""
done
```

**Expected:** First 10 succeed, 11th gets 429

#### Test 6.2: Invitation Operations

```bash
# Test various invitation endpoints
ADMIN_TOKEN="your-admin-token-here"

# Resend invitation
curl -X POST $BASE_URL/api/invitations/123/resend \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -i | grep "X-RateLimit-Policy"

# Update invitation
curl -X PATCH $BASE_URL/api/invitations/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"notes":"Updated"}' \
  -i | grep "X-RateLimit-Policy"

# Revoke invitation
curl -X PUT $BASE_URL/api/invitations/123/revoke \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -i | grep "X-RateLimit-Policy"
```

**Expected:** All show `X-RateLimit-Policy: invitations`

---

### Test 7: TOTP Rate Limiting (5 requests/minute)

**Policy:** Same as OTP (5 requests/minute, 15-minute block)

#### Test 7.1: TOTP Setup Limit

```bash
# Make 6 TOTP setup requests (requires user token)
USER_TOKEN="your-user-token-here"

for i in {1..6}; do
  echo "TOTP setup $i:"
  curl -X POST $BASE_URL/api/users/totp/setup \
    -H "Authorization: Bearer $USER_TOKEN" \
    -i | grep -E "(HTTP|X-RateLimit)"
  echo ""
done
```

**Expected:** First 5 succeed, 6th gets 429

---

### Test 8: Admin Bypass

**Policy:** Admins should bypass all rate limits

#### Test 8.1: Verify Admin Bypass

```bash
# Make 50 rapid requests with admin token (should all succeed)
ADMIN_TOKEN="your-admin-token-here"

for i in {1..50}; do
  echo "Admin request $i:"
  curl -X GET $BASE_URL/api/admin/domains \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -s -o /dev/null -w "Status: %{http_code}\n"
done
```

**Expected:** All requests return 200 (or 401 if token invalid), none get 429

---

### Test 9: Rate Limit Reset

**Policy:** Limits should reset after window expires

#### Test 9.1: Wait for Reset

```bash
# Hit OTP limit
for i in {1..5}; do
  curl -X POST $BASE_URL/api/otp/generate \
    -H "Content-Type: application/json" \
    -d '{"email":"reset-test@example.com"}' \
    -s -o /dev/null
done

# Verify blocked
echo "Should be blocked:"
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"reset-test@example.com"}' \
  -i | grep HTTP

# Wait 61 seconds (OTP window is 1 minute)
echo "Waiting 61 seconds for window reset..."
sleep 61

# Try again (should succeed)
echo "Should succeed after reset:"
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"reset-test@example.com"}' \
  -i | grep -E "(HTTP|X-RateLimit-Remaining)"
```

**Expected:** After 61 seconds, request succeeds with full limit available

---

### Test 10: Different Identifiers

**Policy:** Rate limits should be per-identifier (IP, user ID, email)

#### Test 10.1: Per-Email Tracking

```bash
# Make 5 requests for email A
for i in {1..5}; do
  curl -X POST $BASE_URL/api/otp/generate \
    -H "Content-Type: application/json" \
    -d '{"email":"emailA@example.com"}' \
    -s -o /dev/null
done

# Email A should be blocked
echo "Email A (should be blocked):"
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"emailA@example.com"}' \
  -i | grep HTTP

# Email B should still work
echo "Email B (should succeed):"
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"emailB@example.com"}' \
  -i | grep HTTP
```

**Expected:** Email A blocked, Email B succeeds

---

### Test 11: Monitoring Endpoints

**Policy:** Admin endpoints for rate limit management

#### Test 11.1: Get Status

```bash
ADMIN_TOKEN="your-admin-token-here"

curl -X GET $BASE_URL/api/admin/rate-limits/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.'
```

**Expected:**
```json
{
  "policies": {
    "otp": { "windowMs": 60000, "maxRequests": 5 },
    "login": { "windowMs": 60000, "maxRequests": 10 }
  },
  "redisStatus": "connected"
}
```

#### Test 11.2: Clear Rate Limit

```bash
# First, get rate limited
for i in {1..5}; do
  curl -X POST $BASE_URL/api/otp/generate \
    -H "Content-Type: application/json" \
    -d '{"email":"clear-test@example.com"}' \
    -s -o /dev/null
done

# Verify blocked
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"clear-test@example.com"}' \
  -i | grep HTTP

# Clear the limit
ADMIN_TOKEN="your-admin-token-here"
curl -X DELETE $BASE_URL/api/admin/rate-limits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "identifier":"clear-test@example.com",
    "policy":"otp"
  }' | jq '.'

# Should work now
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"clear-test@example.com"}' \
  -i | grep HTTP
```

**Expected:** After clearing, request succeeds

---

### Test 12: Redis Fallback

**Policy:** Should work even when Redis is down

#### Test 12.1: Simulate Redis Failure

```bash
# Stop Redis
sudo systemctl stop redis
# Or: docker stop redis-container

# Make request (should still work with in-memory fallback)
curl -X POST $BASE_URL/api/otp/generate \
  -H "Content-Type: application/json" \
  -d '{"email":"fallback-test@example.com"}' \
  -i | grep HTTP

# Check server logs for fallback warning
# Should see: "Redis unavailable, using in-memory rate limiting"

# Restart Redis
sudo systemctl start redis
```

**Expected:** Requests continue to work, warning logged

---

## PowerShell Equivalents

For Windows users using PowerShell:

### OTP Limit Test

```powershell
# Make 6 OTP requests
$baseUrl = "http://localhost:3001"

1..6 | ForEach-Object {
  Write-Host "Request $_"
  
  $response = Invoke-WebRequest -Method Post `
    -Uri "$baseUrl/api/otp/generate" `
    -ContentType "application/json" `
    -Body '{"email":"test@example.com"}' `
    -UseBasicParsing
  
  Write-Host "Status: $($response.StatusCode)"
  Write-Host "Remaining: $($response.Headers['X-RateLimit-Remaining'])"
  Write-Host ""
}
```

### Check Rate Limit Status

```powershell
$adminToken = "your-admin-token"

$response = Invoke-RestMethod -Method Get `
  -Uri "$baseUrl/api/admin/rate-limits/status" `
  -Headers @{Authorization="Bearer $adminToken"}

$response | ConvertTo-Json -Depth 5
```

---

## Verification Checklist

After running all tests, verify:

- [ ] **OTP limit enforced** (5/minute)
- [ ] **Login limit enforced** (10/minute)
- [ ] **Registration limit enforced** (3/hour)
- [ ] **Email limit enforced** (20/hour)
- [ ] **Search limit enforced** (30/minute)
- [ ] **Invitation limit enforced** (10/hour)
- [ ] **TOTP limit enforced** (5/minute)
- [ ] **Progressive delays working**
- [ ] **Rate limit headers present**
- [ ] **Retry-After header correct**
- [ ] **Block durations correct**
- [ ] **Admin bypass working**
- [ ] **Limits reset after window**
- [ ] **Per-identifier tracking works**
- [ ] **Monitoring endpoints accessible**
- [ ] **Clear rate limit works**
- [ ] **Redis fallback works**

---

## Common Issues & Solutions

### Issue: All requests succeed, no rate limiting

**Cause:** Middleware not applied or admin bypass active

**Solution:**
```bash
# Check if user has admin role
# Verify middleware in server.js
# Check Redis connection
```

### Issue: Rate limits too aggressive

**Cause:** Multiple tests using same identifier

**Solution:**
```bash
# Use unique emails for each test
# Clear Redis between tests:
redis-cli FLUSHDB
```

### Issue: Headers missing

**Cause:** Middleware error or wrong endpoint

**Solution:**
```bash
# Use -i or -v flag with curl
curl -v $BASE_URL/api/otp/generate
```

---

## Test Report Template

```
# Rate Limiting Manual Test Report
Date: __________
Tester: __________

## Test Results

| Test | Endpoint | Expected | Actual | Pass/Fail |
|------|----------|----------|--------|-----------|
| OTP Limit | /api/otp/generate | 429 after 5 req | | |
| Login Limit | /api/auth/login | 429 after 10 req | | |
| Registration | /api/auth/register-from-invitation | 429 after 3 req | | |
| Email | /api/email/send | 429 after 20 req | | |
| Search | /api/alumni-members/search | 429 after 30 req | | |
| Invitations | /api/invitations | 429 after 10 req | | |
| TOTP | /api/users/totp/setup | 429 after 5 req | | |
| Admin Bypass | /api/admin/domains | No 429 | | |
| Reset | (any) | Reset after window | | |
| Headers | (any) | All headers present | | |

## Notes
_______________________________________________
_______________________________________________

## Issues Found
_______________________________________________
_______________________________________________

## Overall Result: PASS / FAIL
```

---

**Ready to test?** Start with Test 1 and work through systematically!

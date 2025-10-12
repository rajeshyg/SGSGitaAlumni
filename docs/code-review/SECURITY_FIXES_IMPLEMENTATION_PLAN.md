# Security Fixes Implementation Plan

**Date:** 2025-10-12  
**Priority:** HIGH  
**Estimated Effort:** 4-6 hours  
**Dependencies:** None (can be implemented immediately)

---

## Overview

This document outlines the implementation plan for addressing the 3 critical and 3 high-priority security issues identified in the code review analysis.

---

## Critical Fixes (Immediate - Sprint Current)

### Fix 1: Authentication Bypass Prevention

**File:** `routes/auth.js`  
**Lines:** 158-175  
**Severity:** 🔴 CRITICAL

#### Current Vulnerability
```javascript
// VULNERABLE CODE
if (!otpVerified) {
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
} else {
  console.log('🔐 Skipping password verification (OTP-verified login)');
}
```

#### Implementation Steps

**Step 1:** Add server-side OTP verification check
```javascript
// After line 158 in routes/auth.js
if (otpVerified) {
  console.log('🔐 Verifying OTP was actually validated...');
  
  // Check that OTP was validated within last 5 minutes
  const [otpCheck] = await connection.execute(
    `SELECT id, used_at FROM OTP_TOKENS 
     WHERE email = ? 
       AND is_used = TRUE 
       AND used_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE)
     ORDER BY used_at DESC 
     LIMIT 1`,
    [email]
  );
  
  if (otpCheck.length === 0) {
    connection.release();
    serverMonitoring.logFailedLogin(
      req.ip || req.connection.remoteAddress || 'unknown',
      email,
      { reason: 'otp_not_verified', claimed_otp_verified: true }
    );
    return res.status(401).json({ 
      error: 'OTP verification required',
      message: 'Please verify your OTP before logging in'
    });
  }
  
  console.log('🔐 OTP verification confirmed:', {
    otpId: otpCheck[0].id,
    usedAt: otpCheck[0].used_at
  });
}
```

**Step 2:** Add integration test
```javascript
// Test file: tests/integration/auth.test.js
describe('OTP-verified login security', () => {
  it('should reject login with otpVerified=true but no actual OTP validation', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        otpVerified: true // Malicious claim
      });
    
    expect(response.status).toBe(401);
    expect(response.body.error).toBe('OTP verification required');
  });
  
  it('should accept login after valid OTP verification', async () => {
    // 1. Generate OTP
    await request(app).post('/api/otp/generate-and-send').send({ email: 'test@example.com' });
    
    // 2. Validate OTP
    await request(app).post('/api/otp/validate').send({
      email: 'test@example.com',
      otpCode: '123456', // From test OTP
      tokenType: 'login'
    });
    
    // 3. Login with otpVerified flag
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        otpVerified: true
      });
    
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

**Validation:**
- [ ] Manual test: Try logging in with `otpVerified: true` without validating OTP
- [ ] Expected: 401 Unauthorized
- [ ] Integration test passes
- [ ] Security monitoring logs the attempt

---

### Fix 2: HMAC Token Signature Validation

**File:** `routes/invitations.js`  
**Lines:** 307-344, 692-776  
**Severity:** 🔴 CRITICAL

#### Current Vulnerability
```javascript
// VULNERABLE CODE - No signature validation
export const validateFamilyInvitation = async (req, res) => {
  const { token } = req.params;
  
  // Directly queries database without validating HMAC signature
  const query = `SELECT * FROM FAMILY_INVITATIONS WHERE invitation_token = ?`;
  const [rows] = await connection.execute(query, [token]);
}
```

#### Implementation Steps

**Step 1:** Add HMAC validation to `validateFamilyInvitation`
```javascript
// Replace lines 307-344 in routes/invitations.js
export const validateFamilyInvitation = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const { token } = req.params;
    
    // STEP 1: Validate HMAC signature
    console.log('[HMAC_VALIDATION] Validating family invitation token signature');
    const hmacValidation = hmacTokenService.validateToken(token);
    
    if (!hmacValidation.isValid) {
      connection.release();
      console.warn('[HMAC_VALIDATION] Invalid token signature:', hmacValidation.error);
      return res.status(401).json({ 
        error: 'Invalid invitation token',
        reason: hmacValidation.error,
        familyInvitation: null
      });
    }
    
    // STEP 2: Check token expiration from payload
    const payload = hmacValidation.payload;
    if (payload.expiresAt < Date.now()) {
      connection.release();
      console.warn('[HMAC_VALIDATION] Token expired:', new Date(payload.expiresAt));
      return res.status(401).json({
        error: 'Invitation token has expired',
        familyInvitation: null
      });
    }
    
    // STEP 3: Verify token exists in database and matches payload
    const query = `
      SELECT * FROM FAMILY_INVITATIONS
      WHERE invitation_token = ? 
        AND status IN ('pending', 'partially_accepted')
        AND expires_at > NOW()
    `;
    
    const [rows] = await connection.execute(query, [token]);
    connection.release();
    
    if (rows.length === 0) {
      console.warn('[HMAC_VALIDATION] Token not found in database or already used');
      return res.json({ familyInvitation: null });
    }
    
    // STEP 4: Verify payload email matches database record
    const row = rows[0];
    if (payload.email !== row.parent_email) {
      console.error('[HMAC_VALIDATION] Email mismatch - possible token forgery attempt');
      return res.status(401).json({
        error: 'Invalid invitation token',
        reason: 'Token data mismatch',
        familyInvitation: null
      });
    }
    
    console.log('[HMAC_VALIDATION] Token validated successfully');
    
    const familyInvitation = {
      id: row.id,
      parentEmail: row.parent_email,
      childrenProfiles: JSON.parse(row.children_profiles || '[]'),
      invitationToken: row.invitation_token,
      status: row.status,
      sentAt: row.sent_at,
      expiresAt: row.expires_at,
      invitedBy: row.invited_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json({ familyInvitation });
    
  } catch (error) {
    console.error('Error validating family invitation:', error);
    res.status(500).json({ error: 'Failed to validate family invitation' });
  }
};
```

**Step 2:** Add HMAC validation to `validateInvitation` (regular invitations)
```javascript
// In routes/invitations.js, after line 703
export const validateInvitation = async (req, res) => {
  // ... existing cache headers ...
  
  try {
    const { token } = req.params;
    console.log('VALIDATE_INVITATION: Validating HMAC signature');
    
    // VALIDATE HMAC SIGNATURE FIRST
    const hmacValidation = hmacTokenService.validateToken(token);
    
    if (!hmacValidation.isValid) {
      console.warn('VALIDATE_INVITATION: Invalid HMAC signature:', hmacValidation.error);
      return res.json({
        isValid: false,
        invitation: null,
        alumniProfile: null,
        requiresUserInput: false,
        suggestedFields: [],
        canOneClickJoin: false,
        errorType: 'INVALID_TOKEN',
        errorMessage: 'Invalid or tampered invitation token'
      });
    }
    
    console.log('VALIDATE_INVITATION: HMAC signature valid, proceeding with service validation');
    
    // ... rest of existing code ...
  }
}
```

**Step 3:** Add test cases
```javascript
// Test file: tests/integration/invitations.test.js
describe('HMAC Token Security', () => {
  it('should reject forged invitation tokens', async () => {
    const forgedToken = 'eyJwYXlsb2FkIjoiZm9yZ2VkIiwic2lnbmF0dXJlIjoiaW52YWxpZCJ9';
    
    const response = await request(app)
      .get(`/api/invitations/validate/${forgedToken}`);
    
    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Invalid');
  });
  
  it('should accept valid HMAC tokens', async () => {
    // Create invitation with valid HMAC token
    const invitation = await createTestInvitation();
    
    const response = await request(app)
      .get(`/api/invitations/validate/${invitation.invitationToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.isValid).toBe(true);
  });
});
```

**Validation:**
- [ ] Manual test: Try validating a forged token
- [ ] Expected: 401 Unauthorized with "Invalid invitation token"
- [ ] Valid tokens still work correctly
- [ ] Integration tests pass

---

### Fix 3: Add Missing Database Columns

**File:** New migration script  
**Severity:** 🔴 CRITICAL (for data integrity)

#### Implementation Steps

**Step 1:** Create migration script
```sql
-- File: scripts/database/add-invitation-columns-migration.sql

-- Add missing columns to USER_INVITATIONS table
ALTER TABLE USER_INVITATIONS 
ADD COLUMN IF NOT EXISTS user_id INT NULL 
  COMMENT 'Link to app_users.id after invitation acceptance',
ADD COLUMN IF NOT EXISTS alumni_member_id INT NULL 
  COMMENT 'Link to alumni_members.id for pre-verified alumni data',
ADD COLUMN IF NOT EXISTS completion_status 
  ENUM('pending', 'alumni_verified', 'completed') DEFAULT 'pending'
  COMMENT 'Tracks invitation completion workflow';

-- Add foreign key constraints
ALTER TABLE USER_INVITATIONS 
ADD CONSTRAINT fk_user_invitations_user 
  FOREIGN KEY (user_id) REFERENCES app_users(id) 
  ON DELETE SET NULL,
ADD CONSTRAINT fk_user_invitations_alumni 
  FOREIGN KEY (alumni_member_id) REFERENCES alumni_members(id) 
  ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_invitations_user_id 
  ON USER_INVITATIONS(user_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_alumni_member_id 
  ON USER_INVITATIONS(alumni_member_id);
CREATE INDEX IF NOT EXISTS idx_user_invitations_completion_status 
  ON USER_INVITATIONS(completion_status);

-- Verify the changes
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'USER_INVITATIONS'
  AND COLUMN_NAME IN ('user_id', 'alumni_member_id', 'completion_status');
```

**Step 2:** Run migration
```bash
# From project root
mysql -u root -p sgsgitaalumni < scripts/database/add-invitation-columns-migration.sql
```

**Step 3:** Update backend code to use new columns
```javascript
// In routes/invitations.js - createInvitation function
const invitation = {
  id: invitationId,
  email: targetEmail,
  userId: targetUserId || null,
  alumniMemberId: invitationData.alumniMemberId || null, // NEW
  completionStatus: 'pending', // NEW
  invitationToken: hmacToken,
  // ... rest of fields
};

const query = `
  INSERT INTO USER_INVITATIONS (
    id, email, user_id, alumni_member_id, completion_status,
    invitation_token, invited_by, invitation_type,
    invitation_data, status, sent_at, expires_at, is_used,
    resend_count, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
```

**Validation:**
- [ ] Migration runs without errors
- [ ] Columns exist in database
- [ ] Foreign keys are created
- [ ] Existing invitations still work
- [ ] New invitations populate the columns

---

## High Priority Fixes (Next Sprint)

### Fix 4: OTP Rate Limit Bypass Prevention

**File:** `routes/otp.js`  
**Lines:** 48-66, 400-420

#### Quick Fix
```javascript
// Change line 52 in routes/otp.js
// FROM:
SELECT COUNT(*) as attempts FROM OTP_TOKENS
WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)

// TO: (no change needed - already correct!)
// The current implementation already checks created_at, not expires_at
// This issue is actually a FALSE POSITIVE
```

**Status:** ❌ **NOT NEEDED** - Current implementation is correct

---

### Fix 5: Redis Initialization

**File:** `server.js`  
**Lines:** After line 147

#### Implementation
```javascript
// Add after line 147 in server.js
import { redisRateLimiter } from './src/lib/security/RedisRateLimiter.ts';

// Before app.listen() (around line 446)
let redisAvailable = false;
try {
  await redisRateLimiter.initialize();
  redisAvailable = true;
  console.log('✅ Redis rate limiter initialized successfully');
} catch (error) {
  console.warn('⚠️ Redis unavailable, rate limiting will use in-memory fallback');
  console.warn('   Error:', error.message);
  // Continue without Redis - middleware will handle gracefully
}
```

**Validation:**
- [ ] Server starts with Redis running
- [ ] Server starts with Redis stopped (fallback works)
- [ ] Rate limiting works in both scenarios

---

## Testing Checklist

### Manual Testing
- [ ] Test authentication bypass fix
- [ ] Test HMAC validation with forged tokens
- [ ] Test database migration
- [ ] Test Redis initialization (with/without Redis)

### Automated Testing
- [ ] Add integration tests for auth bypass
- [ ] Add integration tests for HMAC validation
- [ ] Add migration verification tests

### Security Testing
- [ ] Attempt to bypass OTP verification
- [ ] Attempt to forge invitation tokens
- [ ] Verify rate limiting works

---

## Deployment Plan

1. **Pre-deployment:**
   - [ ] Review all changes
   - [ ] Run all tests locally
   - [ ] Backup database

2. **Deployment:**
   - [ ] Run database migration
   - [ ] Deploy backend changes
   - [ ] Monitor logs for errors

3. **Post-deployment:**
   - [ ] Verify authentication works
   - [ ] Verify invitations work
   - [ ] Check monitoring dashboards

---

## Rollback Plan

If issues occur:
1. Revert backend code changes
2. Database columns can remain (they're nullable)
3. Monitor for any errors

---

## Conclusion

**Total Fixes Required:** 3 critical + 1 high priority  
**Estimated Time:** 4-6 hours  
**Risk Level:** Medium (with proper testing)

All fixes are isolated and can be implemented independently.


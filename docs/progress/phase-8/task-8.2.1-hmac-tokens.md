# Task 8.2.1: HMAC-SHA256 Token Implementation

**Status:** ✅ Complete
**Priority:** Critical
**Duration:** 2 days (Completed November 2025)
**Dependencies:** None (Foundation task)

## Overview

Implement HMAC-SHA256 signed invitation tokens to replace basic random tokens, providing cryptographic security against forgery and tampering. This task establishes the security foundation for the passwordless authentication system.

## Objectives

- Replace plain random tokens with HMAC-SHA256 signed tokens
- Implement server-side secret key management
- Create token format: `/invitation/[HMAC_TOKEN]`
- Ensure backward compatibility during migration
- Provide enhanced forgery protection

## Technical Implementation Details

### HMAC Token Structure

```typescript
interface HMACInvitationToken {
  payload: {
    invitationId: string;
    email: string;
    type: 'alumni' | 'family_member' | 'admin';
    expiresAt: number; // Unix timestamp
    issuedAt: number;
  };
  signature: string; // HMAC-SHA256 signature
}
```

### Token Generation Process

```typescript
class HMACTokenService {
  private readonly secretKey: string;
  private readonly algorithm = 'sha256';

  generateToken(payload: TokenPayload): string {
    const payloadString = JSON.stringify(payload);
    const signature = crypto.createHmac(this.algorithm, this.secretKey)
      .update(payloadString)
      .digest('hex');

    const tokenData = {
      payload: payloadString,
      signature
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
  }

  validateToken(token: string): TokenValidationResult {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());

      // Verify signature
      const expectedSignature = crypto.createHmac(this.algorithm, this.secretKey)
        .update(tokenData.payload)
        .digest('hex');

      if (expectedSignature !== tokenData.signature) {
        return { isValid: false, error: 'Invalid signature' };
      }

      const payload = JSON.parse(tokenData.payload);

      // Check expiration
      if (payload.expiresAt < Date.now()) {
        return { isValid: false, error: 'Token expired' };
      }

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid token format' };
    }
  }
}
```

### Secret Key Management

```typescript
class TokenSecretManager {
  private static instance: TokenSecretManager;
  private currentSecret: string;
  private previousSecrets: string[] = []; // For rotation support

  static getInstance(): TokenSecretManager {
    if (!TokenSecretManager.instance) {
      TokenSecretManager.instance = new TokenSecretManager();
    }
    return TokenSecretManager.instance;
  }

  private constructor() {
    // Load from environment or AWS Secrets Manager
    this.currentSecret = process.env.INVITATION_TOKEN_SECRET ||
      this.generateNewSecret();
  }

  private generateNewSecret(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  getCurrentSecret(): string {
    return this.currentSecret;
  }

  rotateSecret(): void {
    this.previousSecrets.unshift(this.currentSecret);
    this.currentSecret = this.generateNewSecret();

    // Keep only last 2 secrets for validation during transition
    if (this.previousSecrets.length > 2) {
      this.previousSecrets.pop();
    }
  }
}
```

## Code Changes Required

### 1. New Files to Create

**`src/lib/security/HMACTokenService.ts`**
- HMAC token generation and validation logic
- Secret key management integration
- Token payload interfaces

**`src/lib/security/TokenSecretManager.ts`**
- Singleton pattern for secret key management
- Key rotation support
- Environment variable integration

### 2. Files to Modify

**`src/services/InvitationService.ts`**
```typescript
// Before
generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// After
generateInvitationToken(invitationData: InvitationData): string {
  const payload = {
    invitationId: invitationData.id,
    email: invitationData.email,
    type: invitationData.type,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    issuedAt: Date.now()
  };

  return hmacTokenService.generateToken(payload);
}
```

**`src/pages/InvitationAcceptancePage.tsx`**
```typescript
// Update token validation
const validateInvitation = async (token: string) => {
  const result = await hmacTokenService.validateToken(token);
  if (!result.isValid) {
    throw new Error(result.error);
  }
  return result.payload;
};
```

### 3. Database Schema Updates

```sql
-- Add new columns for HMAC token support
ALTER TABLE USER_INVITATIONS
ADD COLUMN token_payload JSONB,
ADD COLUMN token_signature VARCHAR(64),
ADD COLUMN token_format VARCHAR(20) DEFAULT 'legacy';

-- Index for performance
CREATE INDEX idx_user_invitations_token_signature
ON USER_INVITATIONS(token_signature);
```

## Migration Strategy

### Phase 1: Dual Support
- Support both legacy and HMAC tokens during transition
- New invitations use HMAC tokens
- Legacy tokens remain valid until migration

### Phase 2: Migration Script
```typescript
async function migrateTokens() {
  const legacyInvitations = await db.query(
    "SELECT * FROM USER_INVITATIONS WHERE token_format = 'legacy'"
  );

  for (const invitation of legacyInvitations) {
    const payload = {
      invitationId: invitation.id,
      email: invitation.email,
      type: invitation.invitation_type,
      expiresAt: invitation.expires_at.getTime(),
      issuedAt: invitation.sent_at.getTime()
    };

    const hmacToken = hmacTokenService.generateToken(payload);

    await db.query(
      `UPDATE USER_INVITATIONS
       SET token_payload = $1, token_signature = $2, token_format = 'hmac'
       WHERE id = $3`,
      [JSON.stringify(payload), hmacToken.split('.')[1], invitation.id]
    );
  }
}
```

## Testing Strategy

### Unit Tests

**`src/lib/security/__tests__/HMACTokenService.test.ts`**
```typescript
describe('HMACTokenService', () => {
  it('should generate valid HMAC tokens', () => {
    const payload = { test: 'data' };
    const token = service.generateToken(payload);
    expect(token).toBeDefined();
  });

  it('should validate correct tokens', () => {
    const payload = { test: 'data' };
    const token = service.generateToken(payload);
    const result = service.validateToken(token);
    expect(result.isValid).toBe(true);
    expect(result.payload).toEqual(payload);
  });

  it('should reject tampered tokens', () => {
    const token = service.generateToken({ test: 'data' });
    const tamperedToken = token.replace('a', 'b');
    const result = service.validateToken(tamperedToken);
    expect(result.isValid).toBe(false);
  });

  it('should reject expired tokens', () => {
    const expiredPayload = {
      test: 'data',
      expiresAt: Date.now() - 1000
    };
    const token = service.generateToken(expiredPayload);
    const result = service.validateToken(token);
    expect(result.isValid).toBe(false);
  });
});
```

### Integration Tests

**`tests/api/invitation-hmac.test.ts`**
```typescript
describe('HMAC Token Invitation Flow', () => {
  it('should create invitation with HMAC token', async () => {
    const invitation = await createInvitation(testData);
    expect(invitation.token).toMatch(/^ey/); // base64url format
  });

  it('should accept invitation with valid HMAC token', async () => {
    const token = await generateHMACInvitationToken();
    const response = await acceptInvitation(token);
    expect(response.success).toBe(true);
  });

  it('should reject tampered HMAC tokens', async () => {
    const token = await generateHMACInvitationToken();
    const tampered = token.slice(0, -1) + 'x';
    const response = await acceptInvitation(tampered);
    expect(response.error).toContain('Invalid signature');
  });
});
```

### Local Admin UI Testing

- **Token Display:** Admin UI shows generated HMAC tokens for testing
- **Validation Testing:** Copy-paste tokens into browser for manual validation
- **Expiration Testing:** Test token expiration behavior
- **Tamper Testing:** Manually modify tokens to test signature validation

## Success Criteria

### Functional Requirements
- [ ] **Token Generation:** HMAC-SHA256 tokens generated correctly
- [ ] **Token Validation:** Valid tokens accepted, invalid tokens rejected
- [ ] **Signature Verification:** Tampered tokens detected and rejected
- [ ] **Expiration Handling:** Expired tokens properly rejected
- [ ] **Migration Support:** Legacy tokens supported during transition

### Security Requirements
- [ ] **Cryptographic Security:** HMAC-SHA256 implementation follows best practices
- [ ] **Secret Key Management:** Keys stored securely, not in code
- [ ] **Timing Attack Protection:** Constant-time signature comparison
- [ ] **No Token Reuse:** Single-use token validation
- [ ] **Audit Logging:** Token operations logged for security monitoring

### Performance Requirements
- [ ] **Generation Speed:** Token generation < 10ms
- [ ] **Validation Speed:** Token validation < 5ms
- [ ] **Memory Usage:** No excessive memory consumption
- [ ] **Scalability:** Supports high token generation rates

## Dependencies and Blockers

### Dependencies
- Node.js crypto module (built-in)
- Environment variable configuration
- Database schema updates

### Blockers
- None identified - this is a foundation task

## Risk Mitigation

### Security Risks
- **Key Exposure:** Use environment variables, never commit secrets
- **Weak Secrets:** Generate 256-bit random keys
- **Timing Attacks:** Implement constant-time comparison
- **Token Theft:** Short expiration times, single-use validation

### Implementation Risks
- **Migration Complexity:** Test migration thoroughly in staging
- **Backward Compatibility:** Maintain dual support during transition
- **Performance Impact:** Profile and optimize token operations
- **Error Handling:** Comprehensive error handling for edge cases

### Operational Risks
- **Secret Rotation:** Plan for key rotation procedures
- **Monitoring:** Implement token validation metrics
- **Incident Response:** Prepare for token-related security incidents

---

*This task establishes the cryptographic foundation for secure invitation tokens in the passwordless authentication system.*
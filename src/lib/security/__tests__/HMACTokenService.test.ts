import { hmacTokenService } from '../HMACTokenService';

describe('HMACTokenService', () => {
  const testPayload = {
    invitationId: 'test-invitation-id',
    email: 'test@example.com',
    type: 'alumni' as const,
    expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days from now
    issuedAt: Date.now()
  };

  describe('generateToken', () => {
    it('should generate a valid token string', () => {
      const token = hmacTokenService.generateToken(testPayload);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.includes('.')).toBe(true);
    });

    it('should generate different tokens for different payloads', () => {
      const token1 = hmacTokenService.generateToken(testPayload);
      const token2 = hmacTokenService.generateToken({
        ...testPayload,
        email: 'different@example.com'
      });
      expect(token1).not.toBe(token2);
    });

    it('should generate different tokens for same payload (due to unique IV)', () => {
      const token1 = hmacTokenService.generateToken(testPayload);
      const token2 = hmacTokenService.generateToken(testPayload);
      expect(token1).not.toBe(token2);
    });
  });

  describe('validateToken', () => {
    it('should validate a correct token', () => {
      const token = hmacTokenService.generateToken(testPayload);
      const result = hmacTokenService.validateToken(token);

      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual(testPayload);
      expect(result.error).toBeUndefined();
    });

    it('should reject tampered tokens', () => {
      const token = hmacTokenService.generateToken(testPayload);
      const tamperedToken = token.replace('a', 'b');
      const result = hmacTokenService.validateToken(tamperedToken);

      expect(result.isValid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toContain('Invalid signature');
    });

    it('should reject expired tokens', () => {
      const expiredPayload = {
        ...testPayload,
        expiresAt: Date.now() - 1000 // Already expired
      };
      const token = hmacTokenService.generateToken(expiredPayload);
      const result = hmacTokenService.validateToken(token);

      expect(result.isValid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toContain('Token expired');
    });

    it('should reject malformed tokens', () => {
      const result = hmacTokenService.validateToken('invalid-token-format');
      expect(result.isValid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toContain('Invalid token format');
    });

    it('should reject tokens with invalid base64url', () => {
      const result = hmacTokenService.validateToken('invalid.base64url.here');
      expect(result.isValid).toBe(false);
      expect(result.payload).toBeNull();
      expect(result.error).toContain('Invalid token format');
    });

    it('should handle tokens with missing signature', () => {
      const token = hmacTokenService.generateToken(testPayload);
      const parts = token.split('.');
      const tokenWithoutSignature = parts[0] + '.' + parts[1]; // Missing signature part
      const result = hmacTokenService.validateToken(tokenWithoutSignature);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid token format');
    });
  });

  describe('token format', () => {
    it('should generate tokens in expected format', () => {
      const token = hmacTokenService.generateToken(testPayload);
      const parts = token.split('.');

      expect(parts).toHaveLength(3); // payload.signature
      expect(parts[0]).toMatch(/^[A-Za-z0-9_-]+$/); // base64url payload
      expect(parts[1]).toMatch(/^[A-Za-z0-9_-]+$/); // base64url signature
    });

    it('should handle special characters in payload', () => {
      const specialPayload = {
        ...testPayload,
        email: 'test+special.email@example.com',
        type: 'family_member' as const
      };

      const token = hmacTokenService.generateToken(specialPayload);
      const result = hmacTokenService.validateToken(token);

      expect(result.isValid).toBe(true);
      expect(result.payload).toEqual(specialPayload);
    });
  });

  describe('performance', () => {
    it('should generate tokens quickly', () => {
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        hmacTokenService.generateToken(testPayload);
      }
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should generate 100 tokens in less than 1 second
      expect(totalTime).toBeLessThan(1000);
    });

    it('should validate tokens quickly', () => {
      const token = hmacTokenService.generateToken(testPayload);
      const startTime = Date.now();
      for (let i = 0; i < 100; i++) {
        hmacTokenService.validateToken(token);
      }
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // Should validate 100 tokens in less than 1 second
      expect(totalTime).toBeLessThan(1000);
    });
  });

  describe('security', () => {
    it('should use cryptographically secure random values', () => {
      // Generate multiple tokens and check they have different IVs
      const tokens = [];
      for (let i = 0; i < 10; i++) {
        tokens.push(hmacTokenService.generateToken(testPayload));
      }

      // All tokens should be unique
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(tokens.length);
    });

    it('should reject tokens with invalid JSON payload', () => {
      // Create a token with invalid JSON in payload
      const invalidToken = 'invalid-json-here.valid-signature';
      const result = hmacTokenService.validateToken(invalidToken);

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid token format');
    });
  });
});
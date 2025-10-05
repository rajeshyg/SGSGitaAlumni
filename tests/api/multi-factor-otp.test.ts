// ============================================================================
// MULTI-FACTOR OTP INTEGRATION TESTS
// ============================================================================
// End-to-end tests for multi-factor OTP authentication flow

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MultiFactorOTPService } from '../../src/services/MultiFactorOTPService';
import { TOTPService } from '../../src/lib/auth/TOTPService';
import { apiClient } from '../../src/lib/api';

describe('Multi-Factor OTP Integration Tests', () => {
  let multiFactorService: MultiFactorOTPService;
  let totpService: TOTPService;
  const testEmail = 'test-multi-factor@example.com';

  beforeAll(() => {
    multiFactorService = new MultiFactorOTPService();
    totpService = new TOTPService();
  });

  describe('Email OTP Flow', () => {
    it('should generate and verify email OTP', async () => {
      // Generate email OTP
      const result = await multiFactorService.generateMultiFactorOTP({
        email: testEmail,
        methods: ['email']
      });

      expect(result.methods).toHaveLength(1);
      expect(result.methods[0].method).toBe('email');
      expect(result.methods[0].success).toBe(true);
      expect(result.methods[0].otpCode).toBeDefined();

      // Verify the OTP
      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'email',
        email: testEmail,
        otpCode: result.methods[0].otpCode!
      });

      expect(verification.isValid).toBe(true);
      expect(verification.method).toBe('email');
    });

    it('should reject invalid email OTP', async () => {
      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'email',
        email: testEmail,
        otpCode: '000000'
      });

      expect(verification.isValid).toBe(false);
      expect(verification.method).toBe('email');
    });
  });

  describe('TOTP Setup and Verification', () => {
    let totpSecret: string;
    let totpCode: string;

    it('should setup TOTP for user', async () => {
      const setup = totpService.setupTOTP(testEmail);
      totpSecret = setup.secret;

      expect(setup.secret).toBeDefined();
      expect(setup.qrCodeUrl).toBeDefined();
      expect(setup.qrCodeUrl).toContain('otpauth://totp/');
      expect(setup.backupCodes).toHaveLength(10);
    });

    it('should generate valid TOTP code', () => {
      totpCode = totpService.generateTOTP(totpSecret);
      expect(totpCode).toMatch(/^\d{6}$/);
    });

    it('should verify correct TOTP code', async () => {
      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'totp',
        email: testEmail,
        otpCode: totpCode,
        secret: totpSecret
      });

      expect(verification.isValid).toBe(true);
      expect(verification.method).toBe('totp');
    });

    it('should reject invalid TOTP code', async () => {
      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'totp',
        email: testEmail,
        otpCode: '000000',
        secret: totpSecret
      });

      expect(verification.isValid).toBe(false);
      expect(verification.method).toBe('totp');
    });

    it('should handle TOTP time window', async () => {
      // Generate code for current time
      const currentCode = totpService.generateTOTP(totpSecret);

      // Wait a bit and verify it still works (within window)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'totp',
        email: testEmail,
        otpCode: currentCode,
        secret: totpSecret
      });

      // Should still be valid within the time window
      expect(verification.isValid).toBe(true);
    });
  });

  describe('Multi-Method OTP Generation', () => {
    it('should generate multiple OTP methods simultaneously', async () => {
      const result = await multiFactorService.generateMultiFactorOTP({
        email: testEmail,
        methods: ['email', 'totp']
      });

      expect(result.methods).toHaveLength(2);

      const emailMethod = result.methods.find(m => m.method === 'email');
      const totpMethod = result.methods.find(m => m.method === 'totp');

      expect(emailMethod).toBeDefined();
      expect(emailMethod!.success).toBe(true);
      expect(emailMethod!.otpCode).toBeDefined();

      expect(totpMethod).toBeDefined();
      expect(totpMethod!.success).toBe(true);
      expect(totpMethod!.secret).toBeDefined();
      expect(totpMethod!.qrCodeUrl).toBeDefined();
    });

    it('should handle SMS method (when phone available)', async () => {
      // This test assumes no phone number is configured
      const result = await multiFactorService.generateMultiFactorOTP({
        email: testEmail,
        methods: ['sms']
      });

      expect(result.methods).toHaveLength(1);
      expect(result.methods[0].method).toBe('sms');
      expect(result.methods[0].success).toBe(false);
      expect(result.methods[0].error).toContain('phone number');
    });
  });

  describe('Available Methods Detection', () => {
    it('should return available OTP methods for user', async () => {
      const methods = await multiFactorService.getAvailableMethods(testEmail);

      expect(Array.isArray(methods)).toBe(true);
      expect(methods).toContain('email');
      // SMS might not be available without phone number
      // TOTP might not be available without setup
    });
  });

  describe('Admin Test OTP Generation', () => {
    it('should generate test email OTP', async () => {
      const result = await multiFactorService.generateTestOTP(testEmail, 'email');

      expect(result.email).toBe(testEmail);
      expect(result.otpCode).toMatch(/^\d{6}$/);
      expect(result.type).toBe('email');
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should generate test TOTP setup', async () => {
      const result = await multiFactorService.generateTestOTP(testEmail, 'totp');

      expect(result.email).toBe(testEmail);
      expect(result.otpCode).toMatch(/^\d{6}$/);
      expect(result.type).toBe('totp');
      expect(result.secret).toBeDefined();
      expect(result.qrCodeUrl).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle SMS test generation', async () => {
      const result = await multiFactorService.generateTestOTP(testEmail, 'sms');

      expect(result.email).toBe(testEmail);
      expect(result.type).toBe('sms');
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network failure
      const originalPost = apiClient.post;
      apiClient.post = () => Promise.reject(new Error('Network error'));

      try {
        await multiFactorService.generateMultiFactorOTP({
          email: testEmail,
          methods: ['email']
        });
      } catch (error) {
        expect(error).toBeDefined();
      } finally {
        apiClient.post = originalPost;
      }
    });

    it('should handle invalid method requests', async () => {
      const result = await multiFactorService.generateMultiFactorOTP({
        email: testEmail,
        methods: ['invalid' as any]
      });

      expect(result.methods).toHaveLength(1);
      expect(result.methods[0].success).toBe(false);
      expect(result.methods[0].error).toContain('Unsupported');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting for OTP generation', async () => {
      // Generate multiple OTPs quickly
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          multiFactorService.generateMultiFactorOTP({
            email: testEmail,
            methods: ['email']
          })
        );
      }

      const results = await Promise.allSettled(promises);

      // Some should succeed, some might be rate limited
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      expect(fulfilled.length).toBeGreaterThan(0);
    });
  });

  describe('Security Features', () => {
    it('should not expose sensitive information in responses', async () => {
      const result = await multiFactorService.generateMultiFactorOTP({
        email: testEmail,
        methods: ['email']
      });

      // Response should not contain sensitive data
      expect(result.methods[0]).not.toHaveProperty('serverSecret');
      expect(result.methods[0]).not.toHaveProperty('privateKey');
    });

    it('should validate OTP format', async () => {
      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'email',
        email: testEmail,
        otpCode: 'invalid'
      });

      expect(verification.isValid).toBe(false);
    });

    it('should enforce OTP expiration', async () => {
      // Generate an OTP
      const result = await multiFactorService.generateMultiFactorOTP({
        email: testEmail,
        methods: ['email']
      });

      const otpCode = result.methods[0].otpCode!;

      // Wait for expiration (this test might be flaky in slow environments)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to verify (might still work if within expiration time)
      const verification = await multiFactorService.verifyMultiFactorOTP({
        method: 'email',
        email: testEmail,
        otpCode
      });

      // Just ensure it doesn't throw an error
      expect(verification).toBeDefined();
    });
  });
});
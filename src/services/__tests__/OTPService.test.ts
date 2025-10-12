import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OTPService } from '../OTPService';
import { OTPRequest, OTPVerificationRequest, OTPType, OTPError } from '../../types/invitation';

// Mock the apiClient
vi.mock('../../lib/api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn()
  }
}));

// Mock crypto.getRandomValues
Object.defineProperty(globalThis, 'crypto', {
  value: {
    getRandomValues: vi.fn((array: Uint8Array) => {
      // Fill with predictable values for testing
      array.fill(42);
      return array;
    })
  }
});

// Import after mocking
import { apiClient } from '../../lib/api';

describe('OTPService', () => {
  let otpService: OTPService;
  let mockApiClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiClient = apiClient as any;
    otpService = new OTPService();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('generateOTP', () => {
    const validRequest: OTPRequest = {
      email: 'test@example.com',
      type: 'login' as OTPType,
      userId: 'user123'
    };

    it('should generate OTP successfully', async () => {
      const mockResponse = {
        id: 'otp123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockApiClient.get.mockResolvedValueOnce({ count: 0 }); // Daily limit check
      mockApiClient.get.mockResolvedValueOnce({ attempts: 0 }); // Rate limit check

      const result = await otpService.generateOTP(validRequest);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(validRequest.email);
      expect(result.tokenType).toBe(validRequest.type);
      expect(result.otpCode).toBe('123456');
      expect(result.isUsed).toBe(false);
      expect(result.attemptCount).toBe(0);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/otp/generate', {
        email: validRequest.email,
        otpCode: expect.stringMatching(/^\d{6}$/),
        type: validRequest.type,
        userId: validRequest.userId,
        expiresAt: expect.any(String)
      });
    });

    it('should validate request parameters', async () => {
      await expect(otpService.generateOTP({ ...validRequest, email: '' }))
        .rejects.toThrow(OTPError);

      await expect(otpService.generateOTP({ ...validRequest, email: 'invalid-email' }))
        .rejects.toThrow(OTPError);

      await expect(otpService.generateOTP({ ...validRequest, type: 'invalid' as any }))
        .rejects.toThrow(OTPError);
    });

    it('should enforce daily OTP limits', async () => {
      mockApiClient.get.mockResolvedValueOnce({ count: 10 }); // Exceeds limit

      await expect(otpService.generateOTP(validRequest))
        .rejects.toThrow('Daily OTP limit exceeded');

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should enforce rate limits', async () => {
      mockApiClient.get.mockResolvedValueOnce({ count: 0 }); // Daily limit OK
      mockApiClient.get.mockResolvedValueOnce({ attempts: 3 }); // Exceeds rate limit

      await expect(otpService.generateOTP(validRequest))
        .rejects.toThrow('Too many OTP requests');

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.get.mockResolvedValueOnce({ count: 0 });
      mockApiClient.get.mockResolvedValueOnce({ attempts: 0 });
      mockApiClient.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(otpService.generateOTP(validRequest))
        .rejects.toThrow(OTPError);
    });
  });

  describe('sendOTP', () => {
    it('should send OTP successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({});
      mockApiClient.post.mockResolvedValueOnce({}); // increment daily count

      await expect(otpService.sendOTP('test@example.com', '123456', 'login'))
        .resolves.toBeUndefined();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/otp/send', {
        email: 'test@example.com',
        otpCode: '123456',
        type: 'login'
      });
    });

    it('should validate email format', async () => {
      await expect(otpService.sendOTP('invalid-email', '123456', 'login'))
        .rejects.toThrow('Invalid email address');
    });

    it('should increment daily OTP count', async () => {
      mockApiClient.post.mockResolvedValueOnce({});
      mockApiClient.post.mockResolvedValueOnce({});

      await otpService.sendOTP('test@example.com', '123456', 'login');

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/otp/increment-daily-count', {
        email: 'test@example.com'
      });
    });
  });

  describe('validateOTP', () => {
    const validRequest: OTPVerificationRequest = {
      email: 'test@example.com',
      otpCode: '123456',
      type: 'login'
    };

    it('should validate OTP successfully', async () => {
      const mockValidation = {
        isValid: true,
        token: {
          id: 'otp123',
          email: 'test@example.com',
          otpCode: '123456',
          tokenType: 'login',
          expiresAt: new Date(),
          isUsed: false,
          attemptCount: 0
        },
        remainingAttempts: 3,
        errors: [],
        isExpired: false,
        isRateLimited: false
      };

      mockApiClient.post.mockResolvedValueOnce(mockValidation);

      const result = await otpService.validateOTP(validRequest);

      expect(result.isValid).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.remainingAttempts).toBe(3);
    });

    it('should validate request parameters', async () => {
      await expect(otpService.validateOTP({ ...validRequest, email: '' }))
        .rejects.toThrow(OTPError);

      await expect(otpService.validateOTP({ ...validRequest, otpCode: '12345' }))
        .rejects.toThrow('OTP code must be 6 digits');

      await expect(otpService.validateOTP({ ...validRequest, otpCode: '1234567' }))
        .rejects.toThrow('OTP code must be 6 digits');
    });

    it('should increment attempt count for invalid OTPs', async () => {
      const mockValidation = {
        isValid: false,
        token: {
          id: 'otp123',
          email: 'test@example.com',
          otpCode: '123456',
          tokenType: 'login',
          expiresAt: new Date(),
          isUsed: false,
          attemptCount: 0
        },
        remainingAttempts: 2,
        errors: ['Invalid OTP'],
        isExpired: false,
        isRateLimited: false
      };

      mockApiClient.post.mockResolvedValueOnce(mockValidation);

      const result = await otpService.validateOTP(validRequest);

      expect(result.isValid).toBe(false);
      expect(mockApiClient.patch).toHaveBeenCalledWith('/api/otp/otp123/increment-attempts', {});
    });

    it('should handle API errors gracefully', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('API Error'));

      const result = await otpService.validateOTP(validRequest);

      expect(result.isValid).toBe(false);
      expect(result.remainingAttempts).toBe(3);
      expect(result.errors).toContain('OTP validation failed - please try again');
    });
  });

  describe('isOTPRequired', () => {
    it('should return OTP requirement status', async () => {
      mockApiClient.get.mockResolvedValueOnce({ data: { requiresOtp: true } });

      const result = await otpService.isOTPRequired('user123');

      expect(result).toBe(true);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/users/user123/otp-required');
    });

    it('should default to requiring OTP on error', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await otpService.isOTPRequired('user123');

      expect(result).toBe(true);
    });
  });

  describe('getRemainingOTPAttempts', () => {
    it('should return remaining attempts', async () => {
      mockApiClient.get.mockResolvedValueOnce({ remainingAttempts: 2 });

      const result = await otpService.getRemainingOTPAttempts('test@example.com');

      expect(result).toBe(2);
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/otp/remaining-attempts/test%40example.com');
    });

    it('should default to 3 attempts on error', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await otpService.getRemainingOTPAttempts('test@example.com');

      expect(result).toBe(3);
    });
  });

  describe('resetDailyOTPLimit', () => {
    it('should reset daily limit successfully', async () => {
      mockApiClient.post.mockResolvedValueOnce({});

      await expect(otpService.resetDailyOTPLimit('test@example.com'))
        .resolves.toBeUndefined();

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/otp/reset-daily-limit', {
        email: 'test@example.com'
      });
    });

    it('should handle API errors', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('API Error'));

      await expect(otpService.resetDailyOTPLimit('test@example.com'))
        .rejects.toThrow(OTPError);
    });
  });

  describe('cleanupExpiredOTPs', () => {
    it('should cleanup expired OTPs', async () => {
      mockApiClient.delete.mockResolvedValueOnce({});

      await expect(otpService.cleanupExpiredOTPs())
        .resolves.toBeUndefined();

      expect(mockApiClient.delete).toHaveBeenCalledWith('/api/otp/cleanup-expired');
    });

    it('should not throw on cleanup errors', async () => {
      mockApiClient.delete.mockRejectedValueOnce(new Error('API Error'));

      await expect(otpService.cleanupExpiredOTPs())
        .resolves.toBeUndefined();
    });
  });

  describe('generateTestOTP', () => {
    it('should generate test OTP in development', async () => {
      // Mock development environment
      const originalEnv = (globalThis as any).import?.meta?.env?.PROD;
      (globalThis as any).import = { meta: { env: { PROD: false } } };

      mockApiClient.post.mockResolvedValueOnce({});

      const result = await otpService.generateTestOTP('test@example.com');

      expect(typeof result).toBe('string');
      expect(result).toMatch(/^\d{6}$/);

      // Restore environment
      if (originalEnv !== undefined) {
        (globalThis as any).import.meta.env.PROD = originalEnv;
      } else {
        delete (globalThis as any).import;
      }
    });

    // Note: Testing production environment is difficult due to import.meta.env.PROD mocking limitations
    // In test environment, import.meta.env.PROD is false, so generateTestOTP works
  });

  describe('getOTPStatistics', () => {
    it('should return OTP statistics', async () => {
      const mockStats = {
        totalGenerated: 100,
        totalValidated: 95,
        successRate: 95,
        averageValidationTime: 2.5
      };

      mockApiClient.get.mockResolvedValueOnce({ data: mockStats });

      const result = await otpService.getOTPStatistics();

      expect(result).toEqual(mockStats);
    });

    it('should return default statistics on error', async () => {
      mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

      const result = await otpService.getOTPStatistics();

      expect(result).toEqual({
        totalGenerated: 0,
        totalValidated: 0,
        successRate: 0,
        averageValidationTime: 0
      });
    });
  });

  describe('isValidOTPFormat', () => {
    it('should validate OTP format correctly', () => {
      expect(otpService.isValidOTPFormat('123456')).toBe(true);
      expect(otpService.isValidOTPFormat('12345')).toBe(false);
      expect(otpService.isValidOTPFormat('1234567')).toBe(false);
      expect(otpService.isValidOTPFormat('12345a')).toBe(false);
      expect(otpService.isValidOTPFormat('')).toBe(false);
      expect(otpService.isValidOTPFormat('000000')).toBe(true);
    });
  });

  describe('isOTPExpired', () => {
    it('should check OTP expiration correctly', () => {
      const now = new Date();
      const past = new Date(now.getTime() - 1000);
      const future = new Date(now.getTime() + 1000);
      const verySoon = new Date(now.getTime() + 1); // 1ms in future

      expect(otpService.isOTPExpired(past)).toBe(true);
      expect(otpService.isOTPExpired(future)).toBe(false);
      expect(otpService.isOTPExpired(verySoon)).toBe(false); // Future time, not expired
    });
  });

  describe('generateMultiFactorOTP', () => {
    it('should generate email OTP successfully', async () => {
      const mockResponse = {
        id: 'otp123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockApiClient.get.mockResolvedValueOnce({ count: 0 });
      mockApiClient.get.mockResolvedValueOnce({ attempts: 0 });

      const result = await otpService.generateMultiFactorOTP('test@example.com', ['email']);

      expect(result.methods).toHaveLength(1);
      expect(result.methods[0].method).toBe('email');
      expect(result.methods[0].success).toBe(true);
      expect(result.methods[0].otpCode).toBe('123456');
    });

    it('should handle SMS method (not implemented)', async () => {
      const result = await otpService.generateMultiFactorOTP('test@example.com', ['sms']);

      expect(result.methods[0].method).toBe('sms');
      expect(result.methods[0].success).toBe(false);
      expect(result.methods[0].error).toBe('SMS not implemented in base service');
    });

    it('should handle TOTP method (not implemented)', async () => {
      const result = await otpService.generateMultiFactorOTP('test@example.com', ['totp']);

      expect(result.methods[0].method).toBe('totp');
      expect(result.methods[0].success).toBe(false);
      expect(result.methods[0].error).toBe('TOTP not implemented in base service');
    });

    it('should handle unsupported methods', async () => {
      const result = await otpService.generateMultiFactorOTP('test@example.com', ['unsupported' as any]);

      expect(result.methods[0].success).toBe(false);
      expect(result.methods[0].error).toBe('Unsupported OTP method');
    });

    it('should handle multiple methods', async () => {
      const mockResponse = {
        id: 'otp123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockApiClient.get.mockResolvedValueOnce({ count: 0 });
      mockApiClient.get.mockResolvedValueOnce({ attempts: 0 });

      const result = await otpService.generateMultiFactorOTP('test@example.com', ['email', 'sms']);

      expect(result.methods).toHaveLength(2);
      expect(result.methods[0].method).toBe('email');
      expect(result.methods[0].success).toBe(true);
      expect(result.methods[1].method).toBe('sms');
      expect(result.methods[1].success).toBe(false);
    });
  });

  describe('verifyMultiFactorOTP', () => {
    it('should verify email OTP successfully', async () => {
      const mockValidation = {
        isValid: true,
        token: null,
        remainingAttempts: 3,
        errors: [],
        isExpired: false,
        isRateLimited: false
      };

      mockApiClient.post.mockResolvedValueOnce(mockValidation);

      const result = await otpService.verifyMultiFactorOTP('email', 'test@example.com', '123456');

      expect(result.isValid).toBe(true);
      expect(result.method).toBe('email');
    });

    it('should handle SMS verification (not implemented)', async () => {
      const result = await otpService.verifyMultiFactorOTP('sms', 'test@example.com', '123456');

      expect(result.isValid).toBe(false);
      expect(result.method).toBe('sms');
      expect(result.error).toBe('SMS verification not implemented in base service');
    });

    it('should handle TOTP verification (not implemented)', async () => {
      const result = await otpService.verifyMultiFactorOTP('totp', 'test@example.com', '123456');

      expect(result.isValid).toBe(false);
      expect(result.method).toBe('totp');
      expect(result.error).toBe('TOTP verification not implemented in base service');
    });

    it('should handle unsupported methods', async () => {
      const result = await otpService.verifyMultiFactorOTP('unsupported' as any, 'test@example.com', '123456');

      expect(result.isValid).toBe(false);
      expect(result.method).toBe('unsupported');
      expect(result.error).toBe('Unsupported OTP method');
    });
  });

  describe('getAvailableOTPMethods', () => {
    it('should return email as always available', async () => {
      mockApiClient.get.mockImplementation(() => Promise.reject(new Error('API Error')));

      const result = await otpService.getAvailableOTPMethods('test@example.com');

      expect(result).toEqual(['email']);
    });

    it('should include SMS when user has phone number', async () => {
      mockApiClient.get.mockImplementation((url: string) => {
        if (url.includes('/api/users/profile/')) {
          return Promise.resolve({ phoneNumber: '1234567890' });
        }
        if (url.includes('/api/users/totp/status/')) {
          return Promise.reject(new Error('API Error'));
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await otpService.getAvailableOTPMethods('test@example.com');

      expect(result).toEqual(['email', 'sms']);
    });

    it('should include TOTP when user has TOTP setup', async () => {
      mockApiClient.get.mockImplementation((url: string) => {
        if (url.includes('/api/users/profile/')) {
          return Promise.resolve({ phoneNumber: null }); // No phone number
        }
        if (url.includes('/api/users/totp/status/')) {
          return Promise.resolve({ hasTOTP: true });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await otpService.getAvailableOTPMethods('test@example.com');

      expect(result).toEqual(['email', 'totp']);
    });

    it('should include all methods when available', async () => {
      mockApiClient.get.mockImplementation((url: string) => {
        if (url.includes('/api/users/profile/')) {
          return Promise.resolve({ phoneNumber: '1234567890' });
        }
        if (url.includes('/api/users/totp/status/')) {
          return Promise.resolve({ hasTOTP: true });
        }
        return Promise.reject(new Error('Unexpected URL'));
      });

      const result = await otpService.getAvailableOTPMethods('test@example.com');

      expect(result).toEqual(['email', 'sms', 'totp']);
    });
  });

  describe('private method validation through public interfaces', () => {
    it('should validate email format through sendOTP', async () => {
      await expect(otpService.sendOTP('invalid-email', '123456', 'login'))
        .rejects.toThrow(OTPError);
    });

    it('should generate consistent OTP codes', async () => {
      // Since we mock crypto.getRandomValues to return consistent values,
      // the generated OTP should be predictable
      const mockResponse = {
        id: 'otp123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockApiClient.get.mockResolvedValueOnce({ count: 0 });
      mockApiClient.get.mockResolvedValueOnce({ attempts: 0 });

      const result1 = await otpService.generateOTP({
        email: 'test@example.com',
        type: 'login'
      });

      mockApiClient.post.mockResolvedValueOnce(mockResponse);
      mockApiClient.get.mockResolvedValueOnce({ count: 0 });
      mockApiClient.get.mockResolvedValueOnce({ attempts: 0 });

      const result2 = await otpService.generateOTP({
        email: 'test@example.com',
        type: 'login'
      });

      // With our mocked crypto, codes should be the same
      expect(result1.otpCode).toBe(result2.otpCode);
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle network errors gracefully', async () => {
      mockApiClient.post.mockRejectedValueOnce(new Error('Network Error'));

      await expect(otpService.generateOTP({
        email: 'test@example.com',
        type: 'login'
      })).rejects.toThrow(OTPError);
    });

    it('should handle malformed API responses', async () => {
      mockApiClient.post.mockResolvedValueOnce(null);

      const result = await otpService.validateOTP({
        email: 'test@example.com',
        otpCode: '123456',
        type: 'login'
      });

      expect(result.isValid).toBe(false);
    });

    it('should handle empty or undefined responses', async () => {
      mockApiClient.get.mockResolvedValueOnce(undefined);

      const result = await otpService.getRemainingOTPAttempts('test@example.com');

      expect(result).toBe(3); // Default value
    });

    it('should handle concurrent OTP generations', async () => {
      const mockResponse = {
        id: 'otp123',
        code: '123456',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      };

      mockApiClient.post.mockResolvedValue(mockResponse);
      mockApiClient.get.mockResolvedValue({ count: 0 });
      mockApiClient.get.mockResolvedValue({ attempts: 0 });

      const promises = [
        otpService.generateOTP({ email: 'test1@example.com', type: 'login' }),
        otpService.generateOTP({ email: 'test2@example.com', type: 'login' }),
        otpService.generateOTP({ email: 'test3@example.com', type: 'login' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('otpCode');
      });
    });
  });
});
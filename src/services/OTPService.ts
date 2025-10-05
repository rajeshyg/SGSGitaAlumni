// ============================================================================
// OTP SERVICE IMPLEMENTATION
// ============================================================================
// Service for managing One-Time Password authentication

import {
  OTPToken,
  OTPRequest,
  OTPVerificationRequest,
  OTPValidation,
  OTPServiceInterface,
  OTPError,
  OTPType
} from '../types/invitation';
import { TOTPService } from '../lib/auth/TOTPService';
import { SMSOTPService } from '../lib/auth/SMSOTPService';
import { apiClient } from '../lib/api';

export class OTPService implements OTPServiceInterface {
  private readonly OTP_LENGTH = 6;
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly MAX_ATTEMPTS_PER_HOUR = 3;
  private readonly MAX_DAILY_OTPS = 10;

  // ============================================================================
  // CORE OTP METHODS
  // ============================================================================

  async generateOTP(request: OTPRequest): Promise<OTPToken> {
    try {
      // Validate request
      this.validateOTPRequest(request);

      // Check daily limits
      await this.checkDailyLimits(request.email);

      // Check rate limiting
      await this.checkRateLimits(request.email);

      // Generate OTP code
      const otpCode = this.generateOTPCode();

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

      // Create OTP token in database
      const otpData = {
        email: request.email,
        otpCode,
        tokenType: request.type,
        userId: request.userId || null,
        expiresAt: expiresAt.toISOString()
      };

      const response = await apiClient.post('/api/otp/generate', otpData);
      const otpToken: OTPToken = response.data;

      return otpToken;

    } catch (error) {
      if (error instanceof OTPError) {
        throw error;
      }
      throw new OTPError(
        'Failed to generate OTP',
        'OTP_GENERATION_FAILED',
        500
      );
    }
  }

  async sendOTP(email: string, otpCode: string, type: OTPType): Promise<void> {
    try {
      // Validate email
      if (!this.isValidEmail(email)) {
        throw new OTPError(
          'Invalid email address',
          'INVALID_EMAIL',
          400
        );
      }

      // Send OTP via email service
      await apiClient.post('/api/otp/send', {
        email,
        otpCode,
        type
      });

      // Update user's daily OTP count
      await this.incrementDailyOTPCount(email);

    } catch (error) {
      if (error instanceof OTPError) {
        throw error;
      }
      throw new OTPError(
        'Failed to send OTP',
        'OTP_SEND_FAILED',
        500
      );
    }
  }

  async validateOTP(request: OTPVerificationRequest): Promise<OTPValidation> {
    try {
      // Validate request
      this.validateOTPVerificationRequest(request);

      // Get OTP token from database
      const response = await apiClient.post('/api/otp/validate', {
        email: request.email,
        otpCode: request.otpCode,
        tokenType: request.type
      });

      const validation: OTPValidation = response.data;

      // If validation failed, increment attempt count
      if (!validation.isValid && validation.token) {
        await this.incrementAttemptCount(validation.token.id);
      }

      return validation;

    } catch (error) {
      if (error instanceof OTPError) {
        throw error;
      }
      
      // Return invalid validation for any unexpected errors
      return {
        isValid: false,
        token: null,
        remainingAttempts: 0,
        errors: ['OTP validation failed'],
        isExpired: false,
        isRateLimited: false
      };
    }
  }

  async isOTPRequired(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/otp-required`);
      return response.data.requiresOtp;
    } catch (error) {
      // Default to requiring OTP for security
      return true;
    }
  }

  async getRemainingOTPAttempts(email: string): Promise<number> {
    try {
      const response = await apiClient.get(`/api/otp/remaining-attempts/${encodeURIComponent(email)}`);
      return response.data.remainingAttempts;
    } catch (error) {
      return 0;
    }
  }

  async resetDailyOTPLimit(email: string): Promise<void> {
    try {
      await apiClient.post('/api/otp/reset-daily-limit', { email });
    } catch (error) {
      throw new OTPError(
        'Failed to reset daily OTP limit',
        'OTP_RESET_FAILED',
        500
      );
    }
  }

  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await apiClient.delete('/api/otp/cleanup-expired');
    } catch (error) {
      // Log error but don't throw - cleanup failures shouldn't break main flow
      console.error('Failed to cleanup expired OTPs:', error);
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private validateOTPRequest(request: OTPRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new OTPError(
        'Valid email address is required',
        'INVALID_EMAIL',
        400
      );
    }

    if (!request.type || !['login', 'registration', 'password_reset'].includes(request.type)) {
      throw new OTPError(
        'Valid OTP type is required',
        'INVALID_OTP_TYPE',
        400
      );
    }
  }

  private validateOTPVerificationRequest(request: OTPVerificationRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new OTPError(
        'Valid email address is required',
        'INVALID_EMAIL',
        400
      );
    }

    if (!request.otpCode || request.otpCode.length !== this.OTP_LENGTH) {
      throw new OTPError(
        `OTP code must be ${this.OTP_LENGTH} digits`,
        'INVALID_OTP_CODE',
        400
      );
    }

    if (!request.type || !['login', 'registration', 'password_reset'].includes(request.type)) {
      throw new OTPError(
        'Valid OTP type is required',
        'INVALID_OTP_TYPE',
        400
      );
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private generateOTPCode(): string {
    // Generate cryptographically secure 6-digit OTP
    const array = new Uint8Array(3);
    crypto.getRandomValues(array);
    
    // Convert to 6-digit number
    const number = (array[0] << 16) | (array[1] << 8) | array[2];
    return (number % 1000000).toString().padStart(6, '0');
  }

  private async checkDailyLimits(email: string): Promise<void> {
    try {
      const response = await apiClient.get(`/api/otp/daily-count/${encodeURIComponent(email)}`);
      const dailyCount = response.data.count;

      if (dailyCount >= this.MAX_DAILY_OTPS) {
        throw new OTPError(
          'Daily OTP limit exceeded',
          'DAILY_LIMIT_EXCEEDED',
          429
        );
      }
    } catch (error) {
      if (error instanceof OTPError) {
        throw error;
      }
      // If we can't check limits, allow the request but log the error
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to check daily OTP limits:', error);
      }
    }
  }

  private async checkRateLimits(email: string): Promise<void> {
    try {
      const response = await apiClient.get(`/api/otp/rate-limit/${encodeURIComponent(email)}`);
      const recentAttempts = response.data.attempts;

      if (recentAttempts >= this.MAX_ATTEMPTS_PER_HOUR) {
        throw new OTPError(
          'Too many OTP requests. Please try again later.',
          'RATE_LIMIT_EXCEEDED',
          429
        );
      }
    } catch (error) {
      if (error instanceof OTPError) {
        throw error;
      }
      // If we can't check rate limits, allow the request but log the error
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to check OTP rate limits:', error);
      }
    }
  }

  private async incrementDailyOTPCount(email: string): Promise<void> {
    try {
      await apiClient.post('/api/otp/increment-daily-count', { email });
    } catch (error) {
      // Log error but don't throw - counting failures shouldn't break main flow
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to increment daily OTP count:', error);
      }
    }
  }

  private async incrementAttemptCount(otpTokenId: string): Promise<void> {
    try {
      await apiClient.patch(`/api/otp/${otpTokenId}/increment-attempts`, {});
    } catch (error) {
      // Log error but don't throw - counting failures shouldn't break main flow
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('Failed to increment OTP attempt count:', error);
      }
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate OTP for immediate use (testing/development)
   * WARNING: Only use in development environment
   */
  async generateTestOTP(email: string): Promise<string> {
    if (import.meta.env.PROD) {
      throw new OTPError(
        'Test OTP generation not allowed in production',
        'TEST_OTP_NOT_ALLOWED',
        403
      );
    }

    const otpCode = '123456'; // Fixed OTP for testing
    
    // Store test OTP in database
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

    await apiClient.post('/api/otp/generate', {
      email,
      otpCode,
      tokenType: 'login',
      expiresAt: expiresAt.toISOString()
    });

    return otpCode;
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOTPStatistics(): Promise<{
    totalGenerated: number;
    totalValidated: number;
    successRate: number;
    averageValidationTime: number;
  }> {
    try {
      const response = await apiClient.get('/api/otp/statistics');
      return response.data;
    } catch (error) {
      return {
        totalGenerated: 0,
        totalValidated: 0,
        successRate: 0,
        averageValidationTime: 0
      };
    }
  }

  /**
   * Validate OTP format without checking database
   */
  isValidOTPFormat(otpCode: string): boolean {
    return /^\d{6}$/.test(otpCode);
  }

  /**
   * Check if OTP is expired based on timestamp
   */
  isOTPExpired(expiresAt: Date): boolean {
    return new Date() > new Date(expiresAt);
  }

  // ============================================================================
  // MULTI-FACTOR OTP METHODS (Task 8.2.2)
  // ============================================================================

  /**
   * Generate multi-factor OTP for multiple methods
   * @param email User email
   * @param methods Array of OTP methods to use
   * @param userId User ID
   * @returns Multi-factor OTP results
   */
  async generateMultiFactorOTP(
    email: string,
    methods: ('email' | 'sms' | 'totp')[],
    userId?: string
  ): Promise<{
    methods: Array<{
      method: string;
      success: boolean;
      otpCode?: string;
      secret?: string;
      qrCodeUrl?: string;
      messageId?: string;
      error?: string;
    }>;
  }> {
    const results = [];

    for (const method of methods) {
      try {
        switch (method) {
          case 'email':
            const emailResult = await this.generateOTP({
              email,
              type: 'login',
              userId
            });
            results.push({
              method: 'email',
              success: true,
              otpCode: emailResult.otpCode
            });
            break;

          case 'sms':
            // SMS generation would be handled by SMSOTPService
            results.push({
              method: 'sms',
              success: false,
              error: 'SMS not implemented in base service'
            });
            break;

          case 'totp':
            // TOTP setup would be handled by TOTPService
            results.push({
              method: 'totp',
              success: false,
              error: 'TOTP not implemented in base service'
            });
            break;

          default:
            results.push({
              method,
              success: false,
              error: 'Unsupported OTP method'
            });
        }
      } catch (error) {
        results.push({
          method,
          success: false,
          error: (error as Error).message
        });
      }
    }

    return { methods: results };
  }

  /**
   * Verify multi-factor OTP
   * @param method OTP method
   * @param email User email
   * @param otpCode OTP code
   * @param phoneNumber Phone number (for SMS)
   * @param secret TOTP secret (for TOTP)
   * @returns Verification result
   */
  async verifyMultiFactorOTP(
    method: 'email' | 'sms' | 'totp',
    email: string,
    otpCode: string,
    phoneNumber?: string,
    secret?: string
  ): Promise<{
    isValid: boolean;
    method: string;
    error?: string;
  }> {
    try {
      switch (method) {
        case 'email':
          const emailValidation = await this.validateOTP({
            email,
            otpCode,
            type: 'login'
          });
          return {
            isValid: emailValidation.isValid,
            method: 'email'
          };

        case 'sms':
          // SMS verification would be handled by SMSOTPService
          return {
            isValid: false,
            method: 'sms',
            error: 'SMS verification not implemented in base service'
          };

        case 'totp':
          // TOTP verification would be handled by TOTPService
          return {
            isValid: false,
            method: 'totp',
            error: 'TOTP verification not implemented in base service'
          };

        default:
          return {
            isValid: false,
            method,
            error: 'Unsupported OTP method'
          };
      }
    } catch (error) {
      return {
        isValid: false,
        method,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get available OTP methods for a user
   * @param email User email
   * @returns Available methods
   */
  async getAvailableOTPMethods(email: string): Promise<('email' | 'sms' | 'totp')[]> {
    const methods: ('email' | 'sms' | 'totp')[] = ['email']; // Email always available

    try {
      // Check if user has phone number (for SMS)
      const userResponse = await apiClient.get(`/api/users/profile/${encodeURIComponent(email)}`);
      if (userResponse.phoneNumber) {
        methods.push('sms');
      }

      // Check if user has TOTP setup
      const totpResponse = await apiClient.get(`/api/users/totp/status/${encodeURIComponent(email)}`);
      if (totpResponse.hasTOTP) {
        methods.push('totp');
      }
    } catch (error) {
      // If we can't check, just return email
      console.warn('Failed to check available OTP methods:', error);
    }

    return methods;
  }
}

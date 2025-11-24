// ============================================================================
// OTP SERVICE IMPLEMENTATION
// ============================================================================
// Service for managing One-Time Password authentication

// Type imports and error classes
import type {
  OTPToken,
  OTPRequest,
  OTPVerificationRequest,
  OTPValidation,
  OTPServiceInterface,
  OTPType
} from '../types/invitation';
import { OTPError } from '../types/invitation';

// External services
import { apiClient } from '../lib/api';
import { logger, logError } from '../lib/monitoring';

/**
 * OTP Service for managing One-Time Password authentication
 *
 * Provides secure OTP generation, validation, and management with built-in
 * rate limiting, expiry handling, and security features.
 *
 * @implements {OTPServiceInterface}
 *
 * @example
 * ```typescript
 * const otpService = new OTPService();
 *
 * // Generate OTP
 * const token = await otpService.generateOTP({
 *   email: 'user@example.com',
 *   type: 'login',
 *   userId: 'user123'
 * });
 *
 * // Validate OTP
 * const validation = await otpService.validateOTP({
 *   email: 'user@example.com',
 *   otpCode: '123456',
 *   type: 'login'
 * });
 * ```
 */
export class OTPService implements OTPServiceInterface {
  /**
   * Length of generated OTP codes
   * @constant
   * @private
   */
  private readonly OTP_LENGTH = 6;

  /**
   * OTP expiration time in minutes
   * @constant
   * @private
   */
  private readonly OTP_EXPIRY_MINUTES = 5;

  /**
   * Maximum OTP generation attempts allowed per hour per email
   * @constant
   * @private
   */
  private readonly MAX_ATTEMPTS_PER_HOUR = 3;

  /**
   * Maximum OTPs that can be generated per day per email
   * @constant
   * @private
   */
  private readonly MAX_DAILY_OTPS = 10;

  // ============================================================================
  // CORE OTP METHODS
  // ============================================================================

  /**
   * Generate a new OTP token for user authentication
   *
   * Creates a cryptographically secure 6-digit OTP code with automatic expiry,
   * rate limiting, and daily usage limits. The OTP is stored in the database
   * and can be validated using the validateOTP method.
   *
   * @param {OTPRequest} request - OTP generation request
   * @param {string} request.email - User's email address
   * @param {OTPType} request.type - Type of OTP ('login', 'registration', 'password_reset')
   * @param {string} [request.userId] - Optional user ID for tracking
   *
   * @returns {Promise<OTPToken>} Generated OTP token with metadata
   *
   * @throws {OTPError} INVALID_EMAIL - When email format is invalid
   * @throws {OTPError} INVALID_OTP_TYPE - When OTP type is not supported
   * @throws {OTPError} DAILY_LIMIT_EXCEEDED - When daily OTP limit is reached
   * @throws {OTPError} RATE_LIMIT_EXCEEDED - When hourly rate limit is exceeded
   * @throws {OTPError} OTP_GENERATION_FAILED - When generation fails for other reasons
   *
   * @example
   * ```typescript
   * const token = await otpService.generateOTP({
   *   email: 'user@example.com',
   *   type: 'login',
   *   userId: 'user123'
   * });
   * console.log(`OTP Code: ${token.otpCode}`);
   * console.log(`Expires at: ${token.expiresAt}`);
   * ```
   */
  async generateOTP(request: OTPRequest): Promise<OTPToken> {
    try {
      // Validate request
      this.validateOTPRequest(request);

      // Check daily limits
      await this.checkDailyLimits(request.email);

      // Check rate limiting
      await this.checkRateLimits(request.email);

      // Generate OTP server-side (no longer generate locally)
      const otpData = {
        email: request.email,
        type: request.type,  // Backend expects 'type', not 'tokenType'
        userId: request.userId || null
      };

      const response = await apiClient.post('/api/otp/generate-and-send', otpData);

      // Map the API response to OTPToken format
      const otpToken: OTPToken = {
        id: response.id || '',
        email: request.email,
        otpCode: '', // OTP code is not returned for security - only sent via email
        tokenType: request.type,
        userId: request.userId,
        generatedAt: new Date(),
        expiresAt: new Date(response.expiresAt),
        isUsed: false,
        attemptCount: 0,
        createdAt: new Date()
      };

      logger.info('OTP generated and sent successfully', {
        email: request.email,
        type: request.type,
        expiresAt: otpToken.expiresAt
      });

      return otpToken;

    } catch (error) {
      if (error instanceof OTPError) {
        throw error;
      }

      // Preserve the original error message from the API (e.g., "Email not found")
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate OTP';
      
      logError(error as Error, {
        context: 'OTPService.generateOTP',
        email: request.email,
        type: request.type
      });

      throw new OTPError(
        errorMessage,
        'OTP_GENERATION_FAILED',
        500
      );
    }
  }


  /**
   * Validate an OTP code against stored token
   *
   * Verifies that the provided OTP code matches the stored token, is not expired,
   * and has not exceeded the maximum number of attempts. Updates attempt count
   * on failed validations.
   *
   * @param {OTPVerificationRequest} request - OTP verification request
   * @param {string} request.email - User's email address
   * @param {string} request.otpCode - The OTP code to validate
   * @param {OTPType} request.type - Type of OTP being validated
   *
   * @returns {Promise<OTPValidation>} Validation result with token and status
   *
   * @throws {OTPError} INVALID_EMAIL - When email format is invalid
   * @throws {OTPError} INVALID_OTP_CODE - When OTP code format is invalid
   * @throws {OTPError} INVALID_OTP_TYPE - When OTP type is not supported
   *
   * @example
   * ```typescript
   * const validation = await otpService.validateOTP({
   *   email: 'user@example.com',
   *   otpCode: '123456',
   *   type: 'login'
   * });
   *
   * if (validation.isValid) {
   *   console.log('OTP is valid!');
   * } else {
   *   console.log(`Invalid OTP. ${validation.remainingAttempts} attempts remaining`);
   * }
   * ```
   */
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

      // response is already the data (not nested in response.data)
      const validation: OTPValidation = response;

      // If validation failed, increment attempt count
      if (!validation.isValid && validation.token) {
        await this.incrementAttemptCount(validation.token.id);
        logger.warn('OTP validation failed', {
          email: request.email,
          remainingAttempts: validation.remainingAttempts
        });
      } else if (validation.isValid) {
        logger.info('OTP validated successfully', { email: request.email });
      }

      return validation;

    } catch (error) {
      logError(error as Error, {
        context: 'OTPService.validateOTP',
        email: request.email,
        type: request.type
      });

      if (error instanceof OTPError) {
        throw error;
      }

      // Return invalid validation for any unexpected errors
      // NOTE: Set remaining attempts to 3 instead of 0 to avoid blocking the user
      return {
        isValid: false,
        token: null,
        remainingAttempts: 3,  // Changed from 0 to 3
        errors: ['OTP validation failed - please try again'],
        isExpired: false,
        isRateLimited: false
      };
    }
  }

  /**
   * Check if OTP is required for a specific user
   *
   * @param {string} userId - User ID to check
   * @returns {Promise<boolean>} True if OTP is required, false otherwise
   *
   * @example
   * ```typescript
   * const requiresOTP = await otpService.isOTPRequired('user123');
   * if (requiresOTP) {
   *   // Prompt for OTP
   * }
   * ```
   */
  async isOTPRequired(userId: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/users/${userId}/otp-required`);
      return response.data.requiresOtp;
    } catch (error) {
      // Default to requiring OTP for security
      logger.warn('Failed to check OTP requirement, defaulting to required', { userId });
      return true;
    }
  }

  /**
   * Get remaining OTP validation attempts for an email
   *
   * @param {string} email - User's email address
   * @returns {Promise<number>} Number of remaining attempts (defaults to 3 on error)
   *
   * @example
   * ```typescript
   * const remaining = await otpService.getRemainingOTPAttempts('user@example.com');
   * console.log(`You have ${remaining} attempts remaining`);
   * ```
   */
  async getRemainingOTPAttempts(email: string): Promise<number> {
    try {
      const response = await apiClient.get(`/api/otp/remaining-attempts/${encodeURIComponent(email)}`);

      // response is already the data (not nested in response.data)
      return response.remainingAttempts || 3;
    } catch (error) {
      logError(error as Error, {
        context: 'OTPService.getRemainingOTPAttempts',
        email
      });
      return 3; // Default to 3 attempts on error
    }
  }

  /**
   * Reset daily OTP generation limit for an email
   *
   * @param {string} email - User's email address
   * @returns {Promise<void>}
   *
   * @throws {OTPError} OTP_RESET_FAILED - When reset operation fails
   *
   * @example
   * ```typescript
   * await otpService.resetDailyOTPLimit('user@example.com');
   * ```
   */
  async resetDailyOTPLimit(email: string): Promise<void> {
    try {
      await apiClient.post('/api/otp/reset-daily-limit', { email });
      logger.info('Daily OTP limit reset', { email });
    } catch (error) {
      logError(error as Error, {
        context: 'OTPService.resetDailyOTPLimit',
        email
      });
      throw new OTPError(
        'Failed to reset daily OTP limit',
        'OTP_RESET_FAILED',
        500
      );
    }
  }

  /**
   * Clean up expired OTP tokens from the database
   *
   * This method removes all expired OTP tokens to maintain database hygiene.
   * Failures are logged but do not throw errors to avoid breaking main flows.
   *
   * @returns {Promise<void>}
   *
   * @example
   * ```typescript
   * await otpService.cleanupExpiredOTPs();
   * ```
   */
  async cleanupExpiredOTPs(): Promise<void> {
    try {
      await apiClient.delete('/api/otp/cleanup-expired');
      logger.info('Expired OTPs cleaned up successfully');
    } catch (error) {
      // Log error but don't throw - cleanup failures shouldn't break main flow
      logError(error as Error, {
        context: 'OTPService.cleanupExpiredOTPs'
      });
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


  /**
   * Check if user has exceeded daily OTP generation limit
   * @private
   */
  private async checkDailyLimits(email: string): Promise<void> {
    try {
      const response = await apiClient.get(`/api/otp/daily-count/${encodeURIComponent(email)}`);
      const dailyCount = response.count || 0;

      if (dailyCount >= this.MAX_DAILY_OTPS) {
        logger.warn('Daily OTP limit exceeded', { email, dailyCount });
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
      logger.warn('Failed to check daily OTP limits, allowing request', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if user has exceeded hourly rate limit
   * @private
   */
  private async checkRateLimits(email: string): Promise<void> {
    try {
      const response = await apiClient.get(`/api/otp/rate-limit/${encodeURIComponent(email)}`);
      const recentAttempts = response.attempts || 0;

      if (recentAttempts >= this.MAX_ATTEMPTS_PER_HOUR) {
        logger.warn('OTP rate limit exceeded', { email, recentAttempts });
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
      logger.warn('Failed to check OTP rate limits, allowing request', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Increment daily OTP count for rate limiting
   * @private
   */
  private async incrementDailyOTPCount(email: string): Promise<void> {
    try {
      await apiClient.post('/api/otp/increment-daily-count', { email });
    } catch (error) {
      // Log error but don't throw - counting failures shouldn't break main flow
      logger.warn('Failed to increment daily OTP count', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Increment failed attempt count for an OTP token
   * @private
   */
  private async incrementAttemptCount(otpTokenId: string): Promise<void> {
    try {
      await apiClient.patch(`/api/otp/${otpTokenId}/increment-attempts`, {});
    } catch (error) {
      // Log error but don't throw - counting failures shouldn't break main flow
      logger.warn('Failed to increment OTP attempt count', {
        otpTokenId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Generate OTP for immediate use (testing/development)
   *
   * **WARNING**: Only use in development environment. This method is disabled
   * in production for security reasons.
   *
   * @param {string} email - Email address for test OTP
   * @returns {Promise<string>} Generated OTP code
   *
   * @throws {OTPError} TEST_OTP_NOT_ALLOWED - When called in production environment
   *
   * @example
   * ```typescript
   * // Development only
   * const testOTP = await otpService.generateTestOTP('test@example.com');
   * console.log(`Test OTP: ${testOTP}`);
   * ```
   */
  async generateTestOTP(email: string): Promise<string> {
    if (import.meta.env.PROD) {
      throw new OTPError(
        'Test OTP generation not allowed in production',
        'TEST_OTP_NOT_ALLOWED',
        403
      );
    }

    // Generate test OTP server-side
    const response = await apiClient.post('/api/otp/generate-test', {
      email,
      tokenType: 'login'
    });

    logger.info('Test OTP generated', { email });
    return response.otpCode; // Server returns the OTP code for testing
  }

  /**
   * Get OTP statistics for monitoring and analytics
   *
   * @returns {Promise<Object>} OTP usage statistics
   * @returns {number} return.totalGenerated - Total OTPs generated
   * @returns {number} return.totalValidated - Total OTPs validated
   * @returns {number} return.successRate - Validation success rate (0-1)
   * @returns {number} return.averageValidationTime - Average validation time in ms
   *
   * @example
   * ```typescript
   * const stats = await otpService.getOTPStatistics();
   * console.log(`Success rate: ${stats.successRate * 100}%`);
   * ```
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
      logger.warn('Failed to fetch OTP statistics', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return {
        totalGenerated: 0,
        totalValidated: 0,
        successRate: 0,
        averageValidationTime: 0
      };
    }
  }

  /**
   * Validate OTP code format without checking database
   *
   * Performs client-side validation to check if the OTP code matches
   * the expected format (6 digits).
   *
   * @param {string} otpCode - OTP code to validate
   * @returns {boolean} True if format is valid, false otherwise
   *
   * @example
   * ```typescript
   * if (otpService.isValidOTPFormat('123456')) {
   *   // Proceed with validation
   * }
   * ```
   */
  isValidOTPFormat(otpCode: string): boolean {
    return /^\d{6}$/.test(otpCode);
  }

  /**
   * Check if OTP is expired based on timestamp
   *
   * @param {Date} expiresAt - Expiration timestamp
   * @returns {boolean} True if expired, false otherwise
   *
   * @example
   * ```typescript
   * if (otpService.isOTPExpired(token.expiresAt)) {
   *   console.log('OTP has expired');
   * }
   * ```
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
   *
   * Validates an OTP code using the specified authentication method.
   * Currently only email method is fully implemented.
   *
   * @param {('email'|'sms'|'totp')} method - OTP verification method
   * @param {string} email - User email
   * @param {string} otpCode - OTP code to verify
   * @param {string} [_phoneNumber] - Phone number (for SMS, not yet implemented)
   * @param {string} [_secret] - TOTP secret (for TOTP, not yet implemented)
   * @returns {Promise<Object>} Verification result
   *
   * @example
   * ```typescript
   * const result = await otpService.verifyMultiFactorOTP(
   *   'email',
   *   'user@example.com',
   *   '123456'
   * );
   * if (result.isValid) {
   *   console.log('OTP verified successfully');
   * }
   * ```
   */
  async verifyMultiFactorOTP(
    method: 'email' | 'sms' | 'totp',
    email: string,
    otpCode: string,
    _phoneNumber?: string,  // Prefixed with _ to indicate intentionally unused
    _secret?: string        // Prefixed with _ to indicate intentionally unused
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
          logger.warn('SMS verification not yet implemented', { email });
          return {
            isValid: false,
            method: 'sms',
            error: 'SMS verification not implemented in base service'
          };

        case 'totp':
          // TOTP verification would be handled by TOTPService
          logger.warn('TOTP verification not yet implemented', { email });
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
      logError(error as Error, {
        context: 'OTPService.verifyMultiFactorOTP',
        method,
        email
      });
      return {
        isValid: false,
        method,
        error: (error as Error).message
      };
    }
  }

  /**
   * Get available OTP methods for a user
   *
   * Checks which OTP authentication methods are available for the user
   * based on their profile settings (phone number, TOTP setup, etc.).
   *
   * @param {string} email - User email
   * @returns {Promise<Array<'email'|'sms'|'totp'>>} Array of available methods
   *
   * @example
   * ```typescript
   * const methods = await otpService.getAvailableOTPMethods('user@example.com');
   * console.log(`Available methods: ${methods.join(', ')}`);
   * ```
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
      logger.warn('Failed to check available OTP methods, returning email only', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    return methods;
  }
}

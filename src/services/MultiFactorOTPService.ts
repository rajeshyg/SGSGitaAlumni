// ============================================================================
// MULTI-FACTOR OTP SERVICE IMPLEMENTATION
// ============================================================================
// Unified service for multi-factor OTP authentication
// Supports email, SMS, and TOTP methods

import { TOTPService, TOTPSetupResult, TOTPVerificationResult } from '../lib/auth/TOTPService';
import { SMSOTPService, SMSResult } from '../lib/auth/SMSOTPService';
import { OTPService } from './OTPService';
import { apiClient } from '../lib/api';
import crypto from 'crypto';

export type OTPMethod = 'email' | 'sms' | 'totp';

export interface MultiFactorOTPRequest {
  email: string;
  methods: OTPMethod[];
  userId?: string;
}

export interface MultiFactorOTPResult {
  methods: Array<{
    method: OTPMethod;
    success: boolean;
    otpCode?: string;
    secret?: string;
    qrCodeUrl?: string;
    messageId?: string;
    error?: string;
  }>;
}

export interface MultiFactorOTPVerification {
  method: OTPMethod;
  email: string;
  otpCode: string;
  phoneNumber?: string;
  secret?: string;
}

export interface MultiFactorOTPVerificationResult {
  isValid: boolean;
  method: OTPMethod;
  token?: any;
  error?: string;
}

export class MultiFactorOTPService {
  private totpService: TOTPService;
  private smsService: SMSOTPService;
  private otpService: OTPService;

  constructor() {
    this.totpService = new TOTPService();
    this.smsService = new SMSOTPService({
      provider: process.env.NODE_ENV === 'production' ? 'aws-sns' : 'local-test',
      region: process.env.AWS_REGION || 'us-east-1',
      senderId: process.env.SMS_SENDER_ID || '+1234567890',
      rateLimit: {
        perMinute: 5,
        perHour: 20,
        perDay: 50
      }
    });
    this.otpService = new OTPService();
  }

  /**
   * Generate multi-factor OTP for multiple methods
   * @param request Multi-factor OTP request
   * @returns Results for each method
   */
  async generateMultiFactorOTP(request: MultiFactorOTPRequest): Promise<MultiFactorOTPResult> {
    const results = [];

    for (const method of request.methods) {
      try {
        switch (method) {
          case 'email':
            const emailResult = await this.generateEmailOTP(request.email, request.userId);
            results.push({
              method: 'email' as OTPMethod,
              success: true,
              otpCode: emailResult.otpCode
            });
            break;

          case 'sms':
            // For SMS, we need phone number - this would come from user profile
            const phoneNumber = await this.getUserPhoneNumber(request.email);
            if (phoneNumber) {
              const smsResult = await this.generateSMSOTP(phoneNumber);
              results.push({
                method: 'sms' as OTPMethod,
                success: smsResult.success,
                otpCode: smsResult.success ? 'SMS_SENT' : undefined,
                messageId: smsResult.messageId,
                error: smsResult.error
              });
            } else {
              results.push({
                method: 'sms' as OTPMethod,
                success: false,
                error: 'No phone number found for user'
              });
            }
            break;

          case 'totp':
            const totpResult = await this.setupTOTP(request.email);
            results.push({
              method: 'totp' as OTPMethod,
              success: true,
              secret: totpResult.secret,
              qrCodeUrl: totpResult.qrCodeUrl
            });
            break;

          default:
            results.push({
              method: method as OTPMethod,
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
   * @param verification OTP verification request
   * @returns Verification result
   */
  async verifyMultiFactorOTP(verification: MultiFactorOTPVerification): Promise<MultiFactorOTPVerificationResult> {
    try {
      switch (verification.method) {
        case 'email':
          const emailValidation = await this.otpService.validateOTP({
            email: verification.email,
            otpCode: verification.otpCode,
            type: 'login'
          });
          return {
            isValid: emailValidation.isValid,
            method: 'email',
            token: emailValidation.token
          };

        case 'sms':
          // SMS verification would check against stored OTP
          const smsValidation = await this.verifySMSOTP(verification.phoneNumber!, verification.otpCode);
          return {
            isValid: smsValidation.isValid,
            method: 'sms'
          };

        case 'totp':
          const totpValidation = this.totpService.verifyTOTP(
            verification.otpCode,
            verification.secret!
          );
          return {
            isValid: totpValidation.isValid,
            method: 'totp'
          };

        default:
          return {
            isValid: false,
            method: verification.method,
            error: 'Unsupported OTP method'
          };
      }
    } catch (error) {
      return {
        isValid: false,
        method: verification.method,
        error: (error as Error).message
      };
    }
  }

  /**
   * Generate email OTP
   * @param email User email
   * @param userId User ID
   * @returns OTP token
   */
  private async generateEmailOTP(email: string, userId?: string) {
    const request = {
      email,
      type: 'login' as const,
      userId
    };

    const otpToken = await this.otpService.generateOTP(request);
    await this.otpService.sendOTP(email, otpToken.otpCode, 'login');

    return otpToken;
  }

  /**
   * Generate SMS OTP
   * @param phoneNumber Phone number
   * @returns SMS result
   */
  private async generateSMSOTP(phoneNumber: string): Promise<SMSResult> {
    // Generate OTP code
    const otpCode = this.generateOTPCode();

    // Store SMS OTP in database (similar to email OTP)
    await this.storeSMSOTP(phoneNumber, otpCode);

    // Send SMS
    return await this.smsService.sendSMSOTP(phoneNumber, otpCode);
  }

  /**
   * Setup TOTP for user
   * @param email User email
   * @returns TOTP setup result
   */
  private async setupTOTP(email: string): Promise<TOTPSetupResult> {
    const setup = this.totpService.setupTOTP(email);

    // Store TOTP secret in database
    await this.storeTOTPSecret(email, setup.secret);

    return setup;
  }

  /**
   * Get user's phone number from profile
   * @param email User email
   * @returns Phone number or null
   */
  private async getUserPhoneNumber(email: string): Promise<string | null> {
    try {
      const response = await apiClient.get(`/api/users/profile/${encodeURIComponent(email)}`);
      return response.data.phoneNumber || null;
    } catch {
      return null;
    }
  }

  /**
   * Store SMS OTP in database
   * @param phoneNumber Phone number
   * @param otpCode OTP code
   */
  private async storeSMSOTP(phoneNumber: string, otpCode: string): Promise<void> {
    // Store as email OTP with phone number for now
    // In production, would have separate SMS OTP table
    await apiClient.post('/api/otp/generate', {
      email: `sms-${phoneNumber}`, // Temporary identifier
      otpCode,
      tokenType: 'login',
      phoneNumber,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });
  }

  /**
   * Verify SMS OTP
   * @param phoneNumber Phone number
   * @param otpCode OTP code
   * @returns Verification result
   */
  private async verifySMSOTP(phoneNumber: string, otpCode: string): Promise<{ isValid: boolean }> {
    try {
      const response = await apiClient.post('/api/otp/validate', {
        email: `sms-${phoneNumber}`,
        otpCode,
        tokenType: 'login'
      });
      return { isValid: response.data.isValid };
    } catch {
      return { isValid: false };
    }
  }

  /**
   * Store TOTP secret for user
   * @param email User email
   * @param secret TOTP secret
   */
  private async storeTOTPSecret(email: string, secret: string): Promise<void> {
    await apiClient.post('/api/users/totp/setup', {
      email,
      secret
    });
  }

  /**
   * Generate secure OTP code using crypto
   * @returns 6-digit OTP code
   */
  private generateOTPCode(): string {
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = randomBytes.readUInt32BE(0);
    return (randomNumber % 900000 + 100000).toString();
  }

  /**
   * Get available OTP methods for user
   * @param email User email
   * @returns Available methods
   */
  async getAvailableMethods(email: string): Promise<OTPMethod[]> {
    const methods: OTPMethod[] = ['email']; // Email always available

    // Check if user has phone number
    const phoneNumber = await this.getUserPhoneNumber(email);
    if (phoneNumber) {
      methods.push('sms');
    }

    // Check if user has TOTP setup
    const hasTOTP = await this.hasTOTPSetup(email);
    if (hasTOTP) {
      methods.push('totp');
    }

    return methods;
  }

  /**
   * Check if user has TOTP setup
   * @param email User email
   * @returns True if TOTP is setup
   */
  private async hasTOTPSetup(email: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/users/totp/status/${encodeURIComponent(email)}`);
      return response.data.hasTOTP;
    } catch {
      return false;
    }
  }

  /**
   * Generate test OTP for Admin UI
   * @param email Email address
   * @param method OTP method
   * @returns Test OTP data
   */
  async generateTestOTP(email: string, method: OTPMethod) {
    switch (method) {
      case 'email':
        const otpCode = '123456';
        await this.otpService.generateTestOTP(email);
        return {
          email,
          otpCode,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
          type: 'email' as const
        };

      case 'sms':
        const phoneNumber = await this.getUserPhoneNumber(email);
        if (phoneNumber) {
          await this.smsService.sendSMSOTP(phoneNumber, '123456');
          return {
            email,
            otpCode: 'SMS_SENT',
            generatedAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            type: 'sms' as const
          };
        }
        break;

      case 'totp':
        const setup = this.totpService.setupTOTP(email);
        return {
          email,
          otpCode: this.totpService.generateTOTP(setup.secret),
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 1000),
          type: 'totp' as const,
          secret: setup.secret,
          qrCodeUrl: setup.qrCodeUrl
        };
    }

    throw new Error(`Cannot generate test OTP for method: ${method}`);
  }
}
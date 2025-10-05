// ============================================================================
// SMS OTP SERVICE IMPLEMENTATION
// ============================================================================
// Service for SMS-based One-Time Password authentication
// Supports AWS SES and local testing modes

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

export interface SMSOTPConfig {
  provider: 'aws-sns' | 'twilio' | 'local-test';
  region?: string;
  senderId: string;
  rateLimit: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

export interface SMSOTPRequest {
  phoneNumber: string;
  otpCode: string;
  message?: string;
}

export class SMSOTPService {
  private config: SMSOTPConfig;
  private snsClient?: SNSClient;

  constructor(config: SMSOTPConfig) {
    this.config = config;

    if (config.provider === 'aws-sns' && config.region) {
      this.snsClient = new SNSClient({ region: config.region });
    }
  }

  /**
   * Send SMS OTP to a phone number
   * @param phoneNumber Recipient phone number (E.164 format)
   * @param otpCode OTP code to send
   * @param customMessage Optional custom message
   * @returns SMS sending result
   */
  async sendSMSOTP(
    phoneNumber: string,
    otpCode: string,
    customMessage?: string
  ): Promise<SMSResult> {
    const message = customMessage || `Your Gita Connect verification code is: ${otpCode}. Valid for 5 minutes.`;

    switch (this.config.provider) {
      case 'aws-sns':
        return await this.sendViaAWSSNS(phoneNumber, message);
      case 'twilio':
        return await this.sendViaTwilio(phoneNumber, message);
      case 'local-test':
        return await this.sendLocalTest(phoneNumber, message);
      default:
        return {
          success: false,
          provider: 'unknown',
          error: 'Unsupported SMS provider'
        };
    }
  }

  /**
   * Send SMS via AWS SNS
   * @param phoneNumber Recipient phone number
   * @param message SMS message
   * @returns SMS result
   */
  private async sendViaAWSSNS(phoneNumber: string, message: string): Promise<SMSResult> {
    if (!this.snsClient) {
      return {
        success: false,
        provider: 'aws-sns',
        error: 'SNS client not initialized'
      };
    }

    try {
      const command = new PublishCommand({
        PhoneNumber: phoneNumber,
        Message: message
      });

      const result = await this.snsClient.send(command);

      return {
        success: true,
        messageId: result.MessageId,
        provider: 'aws-sns'
      };
    } catch (error) {
      return {
        success: false,
        provider: 'aws-sns',
        error: (error as Error).message
      };
    }
  }

  /**
   * Send SMS via Twilio (placeholder for future implementation)
   * @param phoneNumber Recipient phone number
   * @param message SMS message
   * @returns SMS result
   */
  private async sendViaTwilio(phoneNumber: string, message: string): Promise<SMSResult> {
    // TODO: Implement Twilio integration
    return {
      success: false,
      provider: 'twilio',
      error: 'Twilio integration not implemented'
    };
  }

  /**
   * Send SMS in local test mode (logs to console/Admin UI)
   * @param phoneNumber Recipient phone number
   * @param message SMS message
   * @returns SMS result
   */
  private async sendLocalTest(phoneNumber: string, message: string): Promise<SMSResult> {
    try {
      // Log to console for development
      console.log(`[SMS TEST] To: ${phoneNumber} Message: ${message}`);

      // Store in test database for Admin UI display
      await this.storeTestSMS(phoneNumber, message);

      return {
        success: true,
        messageId: `test-${Date.now()}`,
        provider: 'local-test'
      };
    } catch (error) {
      return {
        success: false,
        provider: 'local-test',
        error: (error as Error).message
      };
    }
  }

  /**
   * Store test SMS for Admin UI display
   * @param phoneNumber Recipient phone number
   * @param message SMS message
   */
  private async storeTestSMS(phoneNumber: string, message: string): Promise<void> {
    // In a real implementation, this would store in a database
    // For now, we'll use localStorage or a simple in-memory store
    try {
      const testSMS = {
        id: `sms-${Date.now()}`,
        phoneNumber,
        message,
        timestamp: new Date().toISOString(),
        provider: 'local-test'
      };

      // Store in localStorage for Admin UI access
      const existingSMS = JSON.parse(localStorage.getItem('testSMS') || '[]');
      existingSMS.push(testSMS);

      // Keep only last 50 messages
      if (existingSMS.length > 50) {
        existingSMS.splice(0, existingSMS.length - 50);
      }

      localStorage.setItem('testSMS', JSON.stringify(existingSMS));
    } catch (error) {
      // Ignore localStorage errors in test mode
      console.warn('Failed to store test SMS:', error);
    }
  }

  /**
   * Get stored test SMS messages
   * @returns Array of test SMS messages
   */
  getTestSMS(): Array<{
    id: string;
    phoneNumber: string;
    message: string;
    timestamp: string;
    provider: string;
  }> {
    try {
      return JSON.parse(localStorage.getItem('testSMS') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear test SMS messages
   */
  clearTestSMS(): void {
    try {
      localStorage.removeItem('testSMS');
    } catch {
      // Ignore errors
    }
  }

  /**
   * Validate phone number format (basic E.164 validation)
   * @param phoneNumber Phone number to validate
   * @returns True if valid format
   */
  isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic E.164 format validation: + followed by country code and number
    const e164Regex = /^\+[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Format phone number to E.164 if possible
   * @param phoneNumber Phone number to format
   * @returns Formatted phone number or original if invalid
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    const digitsOnly = phoneNumber.replace(/\D/g, '');

    // If it starts with country code, add +
    if (digitsOnly.length >= 10 && !phoneNumber.startsWith('+')) {
      return `+${digitsOnly}`;
    }

    return phoneNumber;
  }

  /**
   * Check if SMS sending is within rate limits
   * @param phoneNumber Phone number to check
   * @returns True if within limits
   */
  async checkRateLimit(phoneNumber: string): Promise<boolean> {
    // TODO: Implement rate limiting logic
    // This would check against a cache/database for recent SMS sends
    return true; // Allow for now
  }

  /**
   * Get SMS provider status
   * @returns Provider status information
   */
  getProviderStatus(): {
    provider: string;
    configured: boolean;
    region?: string;
  } {
    return {
      provider: this.config.provider,
      configured: this.config.provider !== 'local-test',
      region: this.config.region
    };
  }
}
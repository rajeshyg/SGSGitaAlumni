// ============================================================================
// TOTP SERVICE IMPLEMENTATION
// ============================================================================
// Service for Time-based One-Time Password (TOTP) authentication
// Implements RFC 6238 TOTP standard with SHA1 algorithm

import { encode as base32Encode, decode as base32Decode } from 'hi-base32';
import * as crypto from 'crypto';

export interface TOTPConfig {
  secret: string; // Base32 encoded secret
  algorithm: 'SHA1' | 'SHA256' | 'SHA512';
  digits: 6 | 8;
  period: number; // seconds, typically 30
}

export interface TOTPSetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes?: string[];
}

export interface TOTPVerificationResult {
  isValid: boolean;
  timeStep?: number;
  timeRemaining?: number;
}

export class TOTPService {
  private readonly DEFAULT_PERIOD = 30;
  private readonly DEFAULT_DIGITS = 6;
  private readonly DEFAULT_ALGORITHM = 'SHA1';

  /**
   * Generate a cryptographically secure random secret
   * @returns Base32 encoded secret string
   */
  generateSecret(): string {
    // Generate 20 random bytes (160 bits) for the secret
    const randomBytes = crypto.randomBytes(20);
    // Encode as base32 and remove padding
    return base32Encode(randomBytes).replace(/=/g, '');
  }

  /**
   * Generate TOTP code for a given secret and time step
   * @param secret Base32 encoded secret
   * @param timeStep Time step (default: current time / 30)
   * @param config TOTP configuration
   * @returns 6 or 8 digit TOTP code
   */
  generateTOTP(
    secret: string,
    timeStep?: number,
    config: Partial<TOTPConfig> = {}
  ): string {
    const {
      algorithm = this.DEFAULT_ALGORITHM,
      digits = this.DEFAULT_DIGITS,
      period = this.DEFAULT_PERIOD
    } = config;

    // Calculate time step if not provided
    const currentTimeStep = timeStep ?? Math.floor(Date.now() / 1000 / period);

    try {
      // Decode base32 secret
      const secretBuffer = base32Decode(secret.toUpperCase());

      // Create HMAC
      const timeBuffer = Buffer.alloc(8);
      timeBuffer.writeBigUInt64BE(BigInt(currentTimeStep), 0);

      const hmac = crypto.createHmac(algorithm.toLowerCase(), secretBuffer);
      hmac.update(timeBuffer);
      const hmacResult = hmac.digest();

      // Dynamic truncation (RFC 4226)
      const offset = hmacResult[hmacResult.length - 1] & 0xf;
      const code = (
        ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff)
      );

      // Generate the final code
      const finalCode = code % Math.pow(10, digits);
      return finalCode.toString().padStart(digits, '0');

    } catch (error) {
      throw new Error(`Failed to generate TOTP: ${(error as Error).message}`);
    }
  }

  /**
   * Verify a TOTP code against a secret
   * @param token TOTP code to verify
   * @param secret Base32 encoded secret
   * @param window Time window tolerance (default: 1)
   * @param config TOTP configuration
   * @returns Verification result
   */
  verifyTOTP(
    token: string,
    secret: string,
    window: number = 1,
    config: Partial<TOTPConfig> = {}
  ): TOTPVerificationResult {
    const {
      period = this.DEFAULT_PERIOD,
      digits = this.DEFAULT_DIGITS
    } = config;

    // Validate token format
    if (!/^\d{6,8}$/.test(token)) {
      return { isValid: false };
    }

    const currentTimeStep = Math.floor(Date.now() / 1000 / period);

    // Check current time step and adjacent steps within window
    for (let i = -window; i <= window; i++) {
      const testTimeStep = currentTimeStep + i;
      const expectedToken = this.generateTOTP(secret, testTimeStep, config);

      if (expectedToken === token) {
        const timeRemaining = period - (Math.floor(Date.now() / 1000) % period);
        return {
          isValid: true,
          timeStep: testTimeStep,
          timeRemaining
        };
      }
    }

    return { isValid: false };
  }

  /**
   * Generate QR code URL for TOTP setup (otpauth:// URI)
   * @param secret Base32 encoded secret
   * @param accountName User's account name/email
   * @param issuer Application name
   * @param config TOTP configuration
   * @returns otpauth:// URL
   */
  generateQRCodeURL(
    secret: string,
    accountName: string,
    issuer: string = 'Gita Connect',
    config: Partial<TOTPConfig> = {}
  ): string {
    const {
      algorithm = this.DEFAULT_ALGORITHM,
      digits = this.DEFAULT_DIGITS,
      period = this.DEFAULT_PERIOD
    } = config;

    const params = new URLSearchParams({
      secret: secret.toUpperCase(),
      issuer,
      algorithm,
      digits: digits.toString(),
      period: period.toString()
    });

    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);

    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?${params}`;
  }

  /**
   * Setup TOTP for a user (generate secret and QR code)
   * @param accountName User's account name/email
   * @param issuer Application name
   * @param generateBackupCodes Whether to generate backup codes
   * @param config TOTP configuration
   * @returns Setup result with secret and QR code URL
   */
  setupTOTP(
    accountName: string,
    issuer: string = 'Gita Connect',
    generateBackupCodes: boolean = true,
    config: Partial<TOTPConfig> = {}
  ): TOTPSetupResult {
    const secret = this.generateSecret();
    const qrCodeUrl = this.generateQRCodeURL(secret, accountName, issuer, config);

    let backupCodes: string[] | undefined;
    if (generateBackupCodes) {
      backupCodes = this.generateBackupCodes();
    }

    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  }

  /**
   * Generate backup/recovery codes
   * @param count Number of backup codes to generate
   * @param length Length of each code
   * @returns Array of backup codes
   */
  generateBackupCodes(count: number = 10, length: number = 10): string[] {
    const codes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(length)
        .toString('hex')
        .toUpperCase()
        .match(/.{4}/g)
        ?.join('-') || '';
      codes.push(code);
    }

    return codes;
  }

  /**
   * Validate secret format
   * @param secret Base32 encoded secret
   * @returns True if valid base32 string
   */
  isValidSecret(secret: string): boolean {
    try {
      base32Decode(secret.toUpperCase());
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get remaining time in current TOTP period
   * @param period TOTP period in seconds
   * @returns Seconds remaining
   */
  getTimeRemaining(period: number = this.DEFAULT_PERIOD): number {
    return period - (Math.floor(Date.now() / 1000) % period);
  }

  /**
   * Get current time step
   * @param period TOTP period in seconds
   * @returns Current time step
   */
  getCurrentTimeStep(period: number = this.DEFAULT_PERIOD): number {
    return Math.floor(Date.now() / 1000 / period);
  }
}
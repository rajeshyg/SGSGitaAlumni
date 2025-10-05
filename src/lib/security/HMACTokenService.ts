// ============================================================================
// HMAC TOKEN SERVICE
// ============================================================================
// Server-side HMAC-SHA256 signed token generation and validation for secure invitations

import { TokenSecretManager } from './TokenSecretManager';

export interface HMACInvitationToken {
  payload: {
    invitationId: string;
    email: string;
    type: 'alumni' | 'family_member' | 'admin';
    expiresAt: number; // Unix timestamp
    issuedAt: number;
  };
  signature: string; // HMAC-SHA256 signature
}

export interface TokenPayload {
  invitationId: string;
  email: string;
  type: 'alumni' | 'family_member' | 'admin';
  expiresAt: number;
  issuedAt: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: TokenPayload;
  error?: string;
}

export class HMACTokenService {
  private readonly secretKey: string;
  private readonly algorithm = 'sha256';

  constructor() {
    const secretManager = TokenSecretManager.getInstance();
    this.secretKey = secretManager.getCurrentSecret();
  }

  /**
   * Generate HMAC-SHA256 signed token
   */
  generateToken(payload: TokenPayload): string {
    const payloadString = JSON.stringify(payload);
    const signature = this.createHmacSignature(payloadString);

    const tokenData = {
      payload: payloadString,
      signature
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
  }

  /**
   * Validate HMAC token signature and expiration
   */
  validateToken(token: string): TokenValidationResult {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());

      // Verify signature
      const expectedSignature = this.createHmacSignature(tokenData.payload);
      if (!this.constantTimeEquals(expectedSignature, tokenData.signature)) {
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

  /**
   * Extract payload without validation (for debugging)
   */
  extractPayload(token: string): TokenPayload | null {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
      return JSON.parse(tokenData.payload);
    } catch (error) {
      return null;
    }
  }

  /**
   * Create HMAC signature for payload
   */
  private createHmacSignature(payload: string): string {
    return require('crypto')
      .createHmac(this.algorithm, this.secretKey)
      .update(payload)
      .digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}

// Export singleton instance
export const hmacTokenService = new HMACTokenService();
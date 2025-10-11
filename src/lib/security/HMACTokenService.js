// ============================================================================
// HMAC TOKEN SERVICE (JavaScript stub)
// ============================================================================
// Basic HMAC token service for server-side compatibility

import { createHmac } from 'crypto';

class HMACTokenService {
  constructor() {
    // Use a simple secret for server-side
    this.secretKey = process.env.JWT_SECRET || 'fallback-secret-key';
    this.algorithm = 'sha256';
  }

  generateToken(payload) {
    const payloadString = JSON.stringify(payload);
    const signature = this.createHmacSignature(payloadString);

    const tokenData = {
      payload: payloadString,
      signature
    };

    return Buffer.from(JSON.stringify(tokenData)).toString('base64url');
  }

  validateToken(token) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());

      const expectedSignature = this.createHmacSignature(tokenData.payload);
      if (expectedSignature !== tokenData.signature) {
        return { isValid: false, error: 'Invalid signature' };
      }

      const payload = JSON.parse(tokenData.payload);

      if (payload.expiresAt < Date.now()) {
        return { isValid: false, error: 'Token expired' };
      }

      return { isValid: true, payload };
    } catch (error) {
      return { isValid: false, error: 'Invalid token format' };
    }
  }

  extractPayload(token) {
    try {
      const tokenData = JSON.parse(Buffer.from(token, 'base64url').toString());
      return JSON.parse(tokenData.payload);
    } catch (error) {
      return null;
    }
  }

  createHmacSignature(payload) {
    return createHmac(this.algorithm, this.secretKey)
      .update(payload)
      .digest('hex');
  }
}

// Export singleton instance
export const hmacTokenService = new HMACTokenService();
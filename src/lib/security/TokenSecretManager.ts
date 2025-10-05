// ============================================================================
// TOKEN SECRET MANAGER
// ============================================================================
// Singleton pattern for secure HMAC token secret key management with rotation support

import crypto from 'crypto';

export class TokenSecretManager {
  private static instance: TokenSecretManager;
  private currentSecret: string;
  private previousSecrets: string[] = []; // For rotation support
  private readonly maxPreviousSecrets = 2; // Keep last 2 secrets for validation during transition

  private constructor() {
    // Load from environment or generate new secret
    this.currentSecret = this.loadSecretFromEnvironment() || this.generateNewSecret();
  }

  static getInstance(): TokenSecretManager {
    if (!TokenSecretManager.instance) {
      TokenSecretManager.instance = new TokenSecretManager();
    }
    return TokenSecretManager.instance;
  }

  /**
   * Get the current secret key
   */
  getCurrentSecret(): string {
    return this.currentSecret;
  }

  /**
   * Get all valid secrets (current + previous for transition period)
   */
  getAllValidSecrets(): string[] {
    return [this.currentSecret, ...this.previousSecrets];
  }

  /**
   * Rotate the secret key
   */
  rotateSecret(): void {
    // Move current secret to previous secrets
    this.previousSecrets.unshift(this.currentSecret);

    // Generate new secret
    this.currentSecret = this.generateNewSecret();

    // Keep only the maximum number of previous secrets
    if (this.previousSecrets.length > this.maxPreviousSecrets) {
      this.previousSecrets = this.previousSecrets.slice(0, this.maxPreviousSecrets);
    }

    // Log rotation (in production, this should be logged to security monitoring)
    console.log(`[TokenSecretManager] Secret rotated at ${new Date().toISOString()}`);
  }

  /**
   * Check if a secret is valid (current or previous)
   */
  isValidSecret(secret: string): boolean {
    return this.currentSecret === secret || this.previousSecrets.includes(secret);
  }

  /**
   * Get secret metadata for monitoring
   */
  getSecretMetadata(): {
    currentSecretLength: number;
    previousSecretsCount: number;
    lastRotation?: Date;
  } {
    return {
      currentSecretLength: this.currentSecret.length,
      previousSecretsCount: this.previousSecrets.length,
      // In a real implementation, you'd track rotation timestamps
    };
  }

  /**
   * Load secret from environment variable
   */
  private loadSecretFromEnvironment(): string | null {
    const envSecret = process.env.INVITATION_TOKEN_SECRET;
    if (envSecret && envSecret.length >= 32) { // Minimum 256-bit key
      return envSecret;
    }
    return null;
  }

  /**
   * Generate a cryptographically secure random secret
   */
  private generateNewSecret(): string {
    // Generate 256-bit (32 byte) random secret
    return crypto.randomBytes(32).toString('hex');
  }
}
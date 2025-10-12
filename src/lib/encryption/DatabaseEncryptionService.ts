import * as crypto from 'crypto';
import { KMSClient, GenerateDataKeyCommand, DecryptCommand } from '@aws-sdk/client-kms';

export interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyId: string; // KMS key ID
  region: string;
  keySpec: 'AES_256';
  encryptionContext?: Record<string, string>;
}

export interface EncryptedData {
  encryptedData: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  tag: string; // Base64 encoded authentication tag
  keyId: string; // KMS key ID used for encryption
  encryptedAt: Date;
}

export class DatabaseEncryptionService {
  private kms: KMSClient;
  private readonly config: EncryptionConfig;

  constructor(config: EncryptionConfig) {
    this.config = config;
    this.kms = new KMSClient({
      region: config.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async encryptData(plainText: string, context?: Record<string, string>): Promise<EncryptedData> {
    try {
      // Generate data key from KMS
      const dataKeyResponse = await this.kms.send(new GenerateDataKeyCommand({
        KeyId: this.config.keyId,
        KeySpec: this.config.keySpec,
        EncryptionContext: { ...this.config.encryptionContext, ...context }
      }));

      const dataKey = dataKeyResponse.Plaintext!;
      const encryptedDataKey = dataKeyResponse.CiphertextBlob!;

      // Generate IV
      const iv = crypto.randomBytes(16);

      // Encrypt data with AES-256-GCM
      const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
      let encrypted = cipher.update(plainText, 'utf8', 'base64');
      encrypted += cipher.final('base64');

      const authTag = cipher.getAuthTag();

      return {
        encryptedData: encrypted,
        iv: iv.toString('base64'),
        tag: authTag.toString('base64'),
        keyId: this.config.keyId,
        encryptedAt: new Date()
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  async decryptData(encryptedData: EncryptedData, context?: Record<string, string>): Promise<string> {
    try {
      // Decrypt data key using KMS
      const dataKeyResponse = await this.kms.send(new DecryptCommand({
        CiphertextBlob: Buffer.from(encryptedData.keyId, 'base64'),
        EncryptionContext: { ...this.config.encryptionContext, ...context }
      }));

      const dataKey = dataKeyResponse.Plaintext!;

      // Decrypt data with AES-256-GCM
      const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, Buffer.from(encryptedData.iv, 'base64'));
      decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));

      let decrypted = decipher.update(encryptedData.encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  async rotateKey(): Promise<string> {
    // This would be implemented with KMS key rotation
    // For now, return current key
    return this.config.keyId;
  }

  async reEncryptData(oldKeyId: string, newKeyId: string): Promise<void> {
    // Implementation for re-encrypting data with new key
    // This would be used during key rotation
    // Placeholder for now
  }
}
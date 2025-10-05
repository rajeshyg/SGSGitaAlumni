import { DatabaseEncryptionService, EncryptionConfig } from '../DatabaseEncryptionService';

describe('DatabaseEncryptionService', () => {
  let encryptionService: DatabaseEncryptionService;
  let mockConfig: EncryptionConfig;

  beforeEach(() => {
    mockConfig = {
      algorithm: 'aes-256-gcm',
      keyId: 'test-key-id',
      region: 'us-east-1',
      keySpec: 'AES_256'
    };

    // Mock KMS client
    jest.mock('@aws-sdk/client-kms', () => ({
      KMSClient: jest.fn().mockImplementation(() => ({
        send: jest.fn()
      }))
    }));

    encryptionService = new DatabaseEncryptionService(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encryptData', () => {
    it('should encrypt data correctly', async () => {
      const plainText = 'sensitive data';
      const encrypted = await encryptionService.encryptData(plainText);

      expect(encrypted).toHaveProperty('encryptedData');
      expect(encrypted).toHaveProperty('iv');
      expect(encrypted).toHaveProperty('tag');
      expect(encrypted).toHaveProperty('keyId');
      expect(encrypted).toHaveProperty('encryptedAt');
      expect(encrypted.encryptedData).not.toBe(plainText);
    });

    it('should generate different ciphertexts for same plaintext', async () => {
      const plainText = 'same data';
      const encrypted1 = await encryptionService.encryptData(plainText);
      const encrypted2 = await encryptionService.encryptData(plainText);

      expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
    });

    it('should handle encryption context', async () => {
      const plainText = 'test data';
      const context = { table: 'users', column: 'email' };
      const encrypted = await encryptionService.encryptData(plainText, context);

      expect(encrypted).toBeDefined();
    });
  });

  describe('decryptData', () => {
    it('should decrypt data correctly', async () => {
      const plainText = 'test data';
      const encrypted = await encryptionService.encryptData(plainText);
      const decrypted = await encryptionService.decryptData(encrypted);

      expect(decrypted).toBe(plainText);
    });

    it('should reject tampered data', async () => {
      const plainText = 'test data';
      const encrypted = await encryptionService.encryptData(plainText);

      // Tamper with encrypted data
      encrypted.encryptedData = encrypted.encryptedData.replace('a', 'b');

      await expect(encryptionService.decryptData(encrypted))
        .rejects.toThrow();
    });

    it('should handle decryption context', async () => {
      const plainText = 'test data';
      const context = { table: 'users', column: 'email' };
      const encrypted = await encryptionService.encryptData(plainText, context);
      const decrypted = await encryptionService.decryptData(encrypted, context);

      expect(decrypted).toBe(plainText);
    });
  });

  describe('error handling', () => {
    it('should handle encryption failures gracefully', async () => {
      // Mock KMS failure
      const mockKMS = (encryptionService as any).kms;
      mockKMS.send.mockRejectedValue(new Error('KMS Error'));

      await expect(encryptionService.encryptData('test'))
        .rejects.toThrow('Failed to encrypt data');
    });

    it('should handle decryption failures gracefully', async () => {
      const invalidEncrypted = {
        encryptedData: 'invalid',
        iv: 'invalid',
        tag: 'invalid',
        keyId: 'invalid',
        encryptedAt: new Date()
      };

      await expect(encryptionService.decryptData(invalidEncrypted))
        .rejects.toThrow('Failed to decrypt data');
    });
  });

  describe('key rotation', () => {
    it('should support key rotation placeholder', async () => {
      // Key rotation is a placeholder in current implementation
      const result = await encryptionService.rotateKey();
      expect(typeof result).toBe('string');
    });
  });
});
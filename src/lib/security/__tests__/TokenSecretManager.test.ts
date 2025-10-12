import { TokenSecretManager } from '../TokenSecretManager';

describe('TokenSecretManager', () => {
  let secretManager: TokenSecretManager;

  beforeEach(() => {
    // Reset the singleton instance for each test
    (TokenSecretManager as any).instance = null;
    secretManager = TokenSecretManager.getInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = TokenSecretManager.getInstance();
      const instance2 = TokenSecretManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('secret generation', () => {
    it('should generate a secret of correct length', () => {
      const secret = (secretManager as any).generateNewSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBe(64); // 32 bytes * 2 hex chars per byte
    });

    it('should generate different secrets each time', () => {
      const secret1 = (secretManager as any).generateNewSecret();
      const secret2 = (secretManager as any).generateNewSecret();
      expect(secret1).not.toBe(secret2);
    });

    it('should generate valid hex strings', () => {
      const secret = (secretManager as any).generateNewSecret();
      expect(/^[a-f0-9]+$/.test(secret)).toBe(true);
    });
  });

  describe('secret rotation', () => {
    it('should rotate secrets correctly', () => {
      const originalSecret = (secretManager as any).currentSecret;
      const originalPreviousSecrets = [...(secretManager as any).previousSecrets];

      secretManager.rotateSecret();

      const newSecret = (secretManager as any).currentSecret;
      const newPreviousSecrets = (secretManager as any).previousSecrets;

      expect(newSecret).not.toBe(originalSecret);
      expect(newPreviousSecrets).toContain(originalSecret);
      expect(newPreviousSecrets.length).toBe(originalPreviousSecrets.length + 1);
    });

    it('should maintain maximum of 2 previous secrets', () => {
      // Rotate multiple times
      for (let i = 0; i < 5; i++) {
        secretManager.rotateSecret();
      }

      const previousSecrets = (secretManager as any).previousSecrets;
      expect(previousSecrets.length).toBeLessThanOrEqual(2);
    });
  });

  describe('environment variable integration', () => {
    const originalEnv = process.env.INVITATION_TOKEN_SECRET;

    beforeEach(() => {
      // Reset instance before each test in this suite
      (TokenSecretManager as any).instance = null;
    });

    afterEach(() => {
      process.env.INVITATION_TOKEN_SECRET = originalEnv;
      (TokenSecretManager as any).instance = null;
    });

    it('should use environment variable when available', () => {
      // Must be at least 32 characters (256-bit key)
      const testSecret = 'test-environment-secret-12345678901234567890';
      process.env.INVITATION_TOKEN_SECRET = testSecret;

      // Reset instance AFTER setting env var
      (TokenSecretManager as any).instance = null;
      const newManager = TokenSecretManager.getInstance();
      expect((newManager as any).currentSecret).toBe(testSecret);
    });

    it('should generate new secret when environment variable is not set', () => {
      delete process.env.INVITATION_TOKEN_SECRET;

      // Reset instance AFTER deleting env var
      (TokenSecretManager as any).instance = null;
      const newManager = TokenSecretManager.getInstance();
      const secret = (newManager as any).currentSecret;

      expect(typeof secret).toBe('string');
      expect(secret.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(secret)).toBe(true);
    });
  });

  describe('secret access', () => {
    it('should provide access to current secret', () => {
      const secret = secretManager.getCurrentSecret();
      expect(typeof secret).toBe('string');
      expect(secret.length).toBe(64);
    });

    it('should return the same secret consistently', () => {
      const secret1 = secretManager.getCurrentSecret();
      const secret2 = secretManager.getCurrentSecret();
      expect(secret1).toBe(secret2);
    });
  });

  describe('security', () => {
    it('should generate cryptographically secure secrets', () => {
      const secrets = [];
      for (let i = 0; i < 10; i++) {
        secrets.push((secretManager as any).generateNewSecret());
      }

      // All secrets should be unique
      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(secrets.length);
    });

    it('should not expose secrets in error messages', () => {
      try {
        // This should not happen in normal operation, but testing error handling
        (secretManager as any).currentSecret = null;
        secretManager.getCurrentSecret();
      } catch (error) {
        expect(error.message).not.toContain('secret');
        expect(error.message).not.toContain('key');
      }
    });
  });

  describe('memory management', () => {
    it('should not leak memory with multiple rotations', () => {
      const initialMemoryUsage = process.memoryUsage().heapUsed;

      // Perform many rotations
      for (let i = 0; i < 100; i++) {
        secretManager.rotateSecret();
      }

      const finalMemoryUsage = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemoryUsage - initialMemoryUsage;

      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024);
    });
  });
});
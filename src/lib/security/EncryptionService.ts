// ============================================================================
// ENCRYPTION SERVICE
// ============================================================================
// Client-side encryption for sensitive data protection

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface EncryptedData {
  data: string;
  iv: string;
  salt?: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  /**
   * Generate a new RSA key pair for asymmetric encryption
   */
  static async generateRSAKeyPair(): Promise<KeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  }

  /**
   * Generate a symmetric key for AES encryption
   */
  static async generateSymmetricKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Derive a key from a password using PBKDF2
   */
  static async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as BufferSource,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using AES-GCM
   */
  static async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encodedData = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      encodedData
    );

    return {
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      iv: btoa(String.fromCharCode(...iv))
    };
  }

  /**
   * Decrypt data using AES-GCM
   */
  static async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const iv = Uint8Array.from(atob(encryptedData.iv), c => c.charCodeAt(0));
    const encrypted = Uint8Array.from(atob(encryptedData.data), c => c.charCodeAt(0));

    const decrypted = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Encrypt data with RSA public key
   */
  static async encryptWithPublicKey(data: string, publicKey: CryptoKey): Promise<string> {
    const encodedData = new TextEncoder().encode(data);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encodedData
    );

    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  }

  /**
   * Decrypt data with RSA private key
   */
  static async decryptWithPrivateKey(encryptedData: string, privateKey: CryptoKey): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encrypted
    );

    return new TextDecoder().decode(decrypted);
  }

  /**
   * Generate a random salt for key derivation
   */
  static generateSalt(length: number = 16): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Export a CryptoKey to a portable format
   */
  static async exportKey(key: CryptoKey): Promise<JsonWebKey> {
    return await crypto.subtle.exportKey('jwk', key);
  }

  /**
   * Import a CryptoKey from a portable format
   */
  static async importKey(jwk: JsonWebKey, keyUsages: KeyUsage[]): Promise<CryptoKey> {
    return await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: jwk.kty === 'RSA' ? 'RSA-OAEP' : this.ALGORITHM, hash: 'SHA-256' },
      true,
      keyUsages
    );
  }
}
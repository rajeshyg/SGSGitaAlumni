# Security Implementation Guide

This document provides detailed implementation examples and code patterns for implementing the security requirements defined in the [Security Requirements](../standards/SECURITY_REQUIREMENTS.md) document.

## 🛡️ Authentication Implementation

### Multi-Factor Authentication (MFA)

```typescript
// ✅ Secure MFA implementation
interface MFAService {
  generateSecret(): Promise<string>
  verifyTOTP(token: string, secret: string): boolean
  sendSMSChallenge(phoneNumber: string): Promise<string>
  verifyChallenge(challengeId: string, code: string): Promise<boolean>
}

class SecureAuthenticator {
  async authenticate(credentials: LoginCredentials): Promise<AuthResult> {
    const user = await this.validateCredentials(credentials)
    if (!user) throw new AuthenticationError('Invalid credentials')

    if (user.mfaEnabled) {
      const challengeId = await this.initiateMFAChallenge(user)
      return { success: false, requiresMFA: true, challengeId }
    }

    const session = await this.sessionManager.createSession(user)
    return { success: true, session, user: this.sanitizeUser(user) }
  }

  private async validateCredentials(credentials: LoginCredentials): Promise<User | null> {
    const user = await this.userRepository.findByUsername(credentials.username)
    if (!user) {
      await this.cryptoService.hashPassword('dummy') // Timing attack protection
      return null
    }
    return await this.cryptoService.verifyPassword(credentials.password, user.passwordHash)
      ? user : null
  }
}
```

### Role-Based Access Control (RBAC)

```typescript
// ✅ Comprehensive RBAC system
interface Permission {
  resource: string
  action: 'create' | 'read' | 'update' | 'delete' | 'manage'
  conditions?: Record<string, any>
}

class AccessControlService {
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId)
    return userPermissions.some(permission =>
      permission.resource === resource && permission.action === action
    )
  }

  private async getUserPermissions(userId: string): Promise<Permission[]> {
    const userRoles = await this.getUserRoles(userId)
    return this.collectPermissionsFromRoles(userRoles)
  }
}

// Usage with React components
const SecureComponent: React.FC = () => {
  const { user } = useAuth()
  const accessControl = useAccessControl()

  const canEdit = accessControl.checkPermission(user.id, 'posts', 'update')
  const canDelete = accessControl.checkPermission(user.id, 'posts', 'delete')

  return (
    <div>
      {canEdit && <EditButton />}
      {canDelete && <DeleteButton />}
    </div>
  )
}
```

## 🔒 Data Protection & Encryption

### Client-Side Encryption

```typescript
// ✅ End-to-end encryption for sensitive data
class EncryptionService {
  private keyStore: KeyStore

  async generateKeyPair(): Promise<CryptoKeyPair> {
    return await crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      true,
      ['encrypt', 'decrypt']
    )
  }

  async encryptData(data: string, publicKey: CryptoKey): Promise<string> {
    const encoded = new TextEncoder().encode(data)
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encoded
    )
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)))
  }

  async decryptData(encryptedData: string, privateKey: CryptoKey): Promise<string> {
    const encrypted = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))
    const decrypted = await crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      encrypted
    )
    return new TextDecoder().decode(decrypted)
  }

  async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    )

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  }
}

// Secure data storage with encryption
class SecureStorage {
  private encryptionService: EncryptionService
  private masterKey: CryptoKey

  async storeSecureData(key: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data)
    const encrypted = await this.encryptionService.encryptData(jsonData, this.masterKey)
    localStorage.setItem(`secure_${key}`, encrypted)
  }

  async retrieveSecureData(key: string): Promise<any> {
    const encrypted = localStorage.getItem(`secure_${key}`)
    if (!encrypted) return null

    const decrypted = await this.encryptionService.decryptData(encrypted, this.masterKey)
    return JSON.parse(decrypted)
  }

  async clearSecureData(key: string): Promise<void> {
    localStorage.removeItem(`secure_${key}`)
  }
}
```

## 🌐 API Security Implementation

### Secure API Client

```typescript
// ✅ Secure API communication
class SecureAPIClient {
  private baseURL: string
  private authToken: string | null = null
  private refreshToken: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.addRequestInterceptor((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`
      }
      config.headers['Content-Type'] = 'application/json'
      config.headers['X-Requested-With'] = 'XMLHttpRequest'
      return config
    })

    // Response interceptor for token refresh
    this.addResponseInterceptor(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && this.refreshToken) {
          try {
            await this.refreshAuthToken()
            return this.retryRequest(error.config)
          } catch (refreshError) {
            this.handleAuthenticationFailure()
            throw refreshError
          }
        }
        throw error
      }
    )
  }

  async secureRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const config = {
      ...options,
      headers: {
        ...this.getSecurityHeaders(),
        ...options.headers
      }
    }

    try {
      const response = await fetch(url, config)
      return await this.handleResponse<T>(response)
    } catch (error) {
      this.logSecurityEvent('API_REQUEST_FAILED', { endpoint, error })
      throw error
    }
  }

  private getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'"
    }
  }
}
```

## 🛡️ Input Validation & Sanitization

### Comprehensive Input Validation

```typescript
// ✅ Multi-layer input validation
import { z } from 'zod'
import DOMPurify from 'dompurify'

class InputValidator {
  // Schema-based validation
  static readonly userSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email(),
    password: z.string().min(12).max(128),
    age: z.number().int().min(13).max(120)
  })

  static validateUser(data: unknown): User {
    return this.userSchema.parse(data)
  }

  // HTML sanitization
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    })
  }

  // SQL injection prevention
  static sanitizeSQL(input: string): string {
    return input.replace(/['"\\;]/g, '\\$&')
  }

  // XSS prevention
  static escapeHTML(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }

  // File upload validation
  static validateFileUpload(file: File): ValidationResult {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    const maxSize = 5 * 1024 * 1024 // 5MB

    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError('Invalid file type')
    }

    if (file.size > maxSize) {
      throw new ValidationError('File too large')
    }

    return { valid: true }
  }
}
```

For complete implementation details and additional security patterns, see:
- [Security Requirements](../standards/SECURITY_REQUIREMENTS.md)
- [Compliance Framework](./COMPLIANCE_FRAMEWORK.md)

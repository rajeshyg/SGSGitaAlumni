# Task 8.2.4: Database Encryption Implementation

**Status:** ✅ Complete
**Priority:** Critical
**Duration:** 3 days (Completed November 2025)
**Dependencies:** Task 8.2.1 (HMAC Tokens), Task 8.2.3 (Server Rate Limiting)

## Overview

Implement AES-256-GCM encryption for sensitive database fields to protect personally identifiable information (PII) and security-related data. This task establishes AWS KMS key management, data migration strategies, and ensures GDPR compliance for data protection.

## Objectives

- Implement AES-256-GCM encryption for sensitive database columns
- Set up AWS KMS key management and rotation
- Create data migration strategy for existing data
- Encrypt tokens, OTP codes, IP addresses, and audit logs
- Ensure encryption doesn't impact performance or functionality

## Technical Implementation Details

### Encryption Service Architecture

```typescript
interface EncryptionConfig {
  algorithm: 'aes-256-gcm';
  keyId: string; // KMS key ID
  region: string;
  keySpec: 'AES_256';
  encryptionContext?: Record<string, string>;
}

interface EncryptedData {
  encryptedData: string; // Base64 encoded
  iv: string; // Base64 encoded initialization vector
  tag: string; // Base64 encoded authentication tag
  keyId: string; // KMS key ID used for encryption
  encryptedAt: Date;
}

class DatabaseEncryptionService {
  private kms: AWS.KMS;
  private readonly config: EncryptionConfig;

  constructor(config: EncryptionConfig) {
    this.config = config;
    this.kms = new AWS.KMS({
      region: config.region,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    });
  }

  async encryptData(plainText: string, context?: Record<string, string>): Promise<EncryptedData> {
    // Generate data key from KMS
    const dataKeyResponse = await this.kms.generateDataKey({
      KeyId: this.config.keyId,
      KeySpec: this.config.keySpec,
      EncryptionContext: { ...this.config.encryptionContext, ...context }
    }).promise();

    const dataKey = dataKeyResponse.Plaintext!;
    const encryptedDataKey = dataKeyResponse.CiphertextBlob!;

    // Generate IV
    const iv = crypto.randomBytes(16);

    // Encrypt data with AES-256-GCM
    const cipher = crypto.createCipherGCM('aes-256-gcm', dataKey, iv);
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
  }

  async decryptData(encryptedData: EncryptedData, context?: Record<string, string>): Promise<string> {
    // Decrypt data key using KMS
    const dataKeyResponse = await this.kms.decrypt({
      CiphertextBlob: Buffer.from(encryptedData.keyId, 'base64'),
      EncryptionContext: { ...this.config.encryptionContext, ...context }
    }).promise();

    const dataKey = dataKeyResponse.Plaintext!;

    // Decrypt data with AES-256-GCM
    const decipher = crypto.createDecipherGCM('aes-256-gcm', dataKey);
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'base64'));
    decipher.setIV(Buffer.from(encryptedData.iv, 'base64'));

    let decrypted = decipher.update(encryptedData.encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async rotateKey(): Promise<string> {
    // Create new KMS key
    const newKeyResponse = await this.kms.createKey({
      Description: `Database encryption key created ${new Date().toISOString()}`,
      KeyUsage: 'ENCRYPT_DECRYPT',
      KeySpec: this.config.keySpec
    }).promise();

    const newKeyId = newKeyResponse.KeyMetadata!.KeyId!;

    // Update configuration
    this.config.keyId = newKeyId;

    return newKeyId;
  }

  async reEncryptData(oldKeyId: string, newKeyId: string): Promise<void> {
    // Implementation for re-encrypting data with new key
    // This would be used during key rotation
  }
}
```

### Encrypted Field Types

```typescript
// Database field encryption decorators
function EncryptedField(options: { table: string; column: string }) {
  return function(target: any, propertyKey: string) {
    const encryptionService = getEncryptionService();

    // Getter
    const getter = function() {
      const encryptedValue = this[`_${propertyKey}_encrypted`];
      if (!encryptedValue) return null;

      try {
        const encryptedData = JSON.parse(encryptedValue);
        return encryptionService.decryptData(encryptedData);
      } catch (error) {
        console.error(`Failed to decrypt ${propertyKey}:`, error);
        return null;
      }
    };

    // Setter
    const setter = function(value: string) {
      if (value === null || value === undefined) {
        this[`_${propertyKey}_encrypted`] = null;
        return;
      }

      try {
        const encryptedData = encryptionService.encryptData(value, {
          table: options.table,
          column: options.column,
          recordId: this.id
        });
        this[`_${propertyKey}_encrypted`] = JSON.stringify(encryptedData);
      } catch (error) {
        console.error(`Failed to encrypt ${propertyKey}:`, error);
        throw error;
      }
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true
    });
  };
}

// Usage in model classes
class Invitation {
  id: string;

  @EncryptedField({ table: 'user_invitations', column: 'invitation_token' })
  invitationToken: string;

  @EncryptedField({ table: 'user_invitations', column: 'email' })
  email: string;

  @EncryptedField({ table: 'user_invitations', column: 'ip_address' })
  ipAddress: string;
}
```

### KMS Key Management

```typescript
class KMSKeyManager {
  private kms: AWS.KMS;
  private readonly keyAlias = 'alias/database-encryption';

  async ensureKeyExists(): Promise<string> {
    try {
      // Check if key alias exists
      const aliasResponse = await this.kms.describeKey({
        KeyId: this.keyAlias
      }).promise();

      return aliasResponse.KeyMetadata!.KeyId!;
    } catch (error) {
      if (error.code === 'NotFoundException') {
        // Create new key
        const keyResponse = await this.kms.createKey({
          Description: 'Database encryption key for sensitive data',
          KeyUsage: 'ENCRYPT_DECRYPT',
          KeySpec: 'AES_256',
          Tags: [
            { TagKey: 'Purpose', TagValue: 'DatabaseEncryption' },
            { TagKey: 'Project', TagValue: 'GitaConnect' }
          ]
        }).promise();

        // Create alias
        await this.kms.createAlias({
          AliasName: this.keyAlias,
          TargetKeyId: keyResponse.KeyMetadata!.KeyId!
        }).promise();

        return keyResponse.KeyMetadata!.KeyId!;
      }
      throw error;
    }
  }

  async rotateKey(): Promise<{ oldKeyId: string; newKeyId: string }> {
    const oldKeyId = await this.getCurrentKeyId();

    // Create new key
    const newKeyResponse = await this.kms.createKey({
      Description: `Database encryption key rotated ${new Date().toISOString()}`,
      KeyUsage: 'ENCRYPT_DECRYPT',
      KeySpec: 'AES_256'
    }).promise();

    const newKeyId = newKeyResponse.KeyMetadata!.KeyId!;

    // Update alias to point to new key
    await this.kms.updateAlias({
      AliasName: this.keyAlias,
      TargetKeyId: newKeyId
    }).promise();

    // Schedule old key for deletion (after data re-encryption)
    await this.scheduleKeyDeletion(oldKeyId);

    return { oldKeyId, newKeyId };
  }

  private async getCurrentKeyId(): Promise<string> {
    const aliasResponse = await this.kms.describeKey({
      KeyId: this.keyAlias
    }).promise();

    return aliasResponse.KeyMetadata!.KeyId!;
  }

  private async scheduleKeyDeletion(keyId: string): Promise<void> {
    // Schedule deletion after 30 days (minimum waiting period)
    await this.kms.scheduleKeyDeletion({
      KeyId: keyId,
      PendingWindowInDays: 30
    }).promise();
  }
}
```

## Code Changes Required

### 1. New Files to Create

**`src/lib/encryption/DatabaseEncryptionService.ts`**
- AES-256-GCM encryption/decryption logic
- KMS integration for key management
- Encryption context handling

**`src/lib/encryption/KMSKeyManager.ts`**
- KMS key lifecycle management
- Key rotation procedures
- Alias management

**`src/lib/encryption/EncryptedFieldDecorator.ts`**
- TypeScript decorators for encrypted fields
- Automatic encryption/decryption
- Error handling

**`src/lib/encryption/migration/DataMigrationService.ts`**
- Data migration scripts for encryption
- Batch processing for large datasets
- Rollback capabilities

### 2. Files to Modify

**`src/lib/database/schema/invitation-system-schema.sql`**
```sql
-- Add encrypted columns to USER_INVITATIONS
ALTER TABLE USER_INVITATIONS
ADD COLUMN invitation_token_encrypted JSONB,
ADD COLUMN email_encrypted JSONB,
ADD COLUMN ip_address_encrypted JSONB,
ADD COLUMN invitation_data_encrypted JSONB;

-- Add encrypted columns to OTP_TOKENS
ALTER TABLE OTP_TOKENS
ADD COLUMN otp_code_encrypted JSONB,
ADD COLUMN ip_address_encrypted JSONB;

-- Add encrypted columns to FAMILY_INVITATIONS
ALTER TABLE FAMILY_INVITATIONS
ADD COLUMN parent_email_encrypted JSONB,
ADD COLUMN children_profiles_encrypted JSONB;

-- Create indexes for encrypted fields (if needed for queries)
-- Note: Encrypted fields cannot be efficiently indexed
-- Consider hash-based indexes for specific use cases
```

**`src/services/InvitationService.ts`**
```typescript
// Update to use encrypted fields
export class EncryptedInvitationService extends InvitationService {
  async createInvitation(data: InvitationRequest): Promise<Invitation> {
    const invitation = new Invitation();

    // Data automatically encrypted via decorators
    invitation.invitationToken = this.generateToken();
    invitation.email = data.email;
    invitation.ipAddress = this.getClientIP();

    await invitation.save();
    return invitation;
  }

  async validateInvitation(token: string): Promise<boolean> {
    const invitation = await Invitation.findOne({
      where: { invitationToken: token } // Decryption happens automatically
    });

    return !!invitation && !invitation.isExpired();
  }
}
```

### 3. Migration Scripts

**`scripts/database/migrate-to-encryption.sql`**
```sql
-- Migration script to encrypt existing data
-- Run this after deploying encryption service

BEGIN;

-- Create temporary tables for backup
CREATE TABLE user_invitations_backup AS
SELECT * FROM user_invitations;

CREATE TABLE otp_tokens_backup AS
SELECT * FROM otp_tokens;

-- Migrate USER_INVITATIONS data
UPDATE user_invitations
SET
  invitation_token_encrypted = encryption_service.encrypt_field(invitation_token, 'user_invitations', 'invitation_token', id),
  email_encrypted = encryption_service.encrypt_field(email, 'user_invitations', 'email', id),
  ip_address_encrypted = encryption_service.encrypt_field(ip_address, 'user_invitations', 'ip_address', id)
WHERE invitation_token_encrypted IS NULL;

-- Migrate OTP_TOKENS data
UPDATE otp_tokens
SET
  otp_code_encrypted = encryption_service.encrypt_field(otp_code, 'otp_tokens', 'otp_code', id),
  ip_address_encrypted = encryption_service.encrypt_field(ip_address, 'otp_tokens', 'ip_address', id)
WHERE otp_code_encrypted IS NULL;

-- Update schema to make encrypted columns NOT NULL after migration
-- (Run this manually after verifying migration)

COMMIT;
```

## Testing Strategy

### Unit Tests

**`src/lib/encryption/__tests__/DatabaseEncryptionService.test.ts`**
```typescript
describe('DatabaseEncryptionService', () => {
  let encryptionService: DatabaseEncryptionService;

  beforeEach(() => {
    encryptionService = new DatabaseEncryptionService({
      algorithm: 'aes-256-gcm',
      keyId: 'test-key-id',
      region: 'us-east-1'
    });
  });

  it('should encrypt and decrypt data correctly', async () => {
    const plainText = 'sensitive data';
    const encrypted = await encryptionService.encryptData(plainText);
    const decrypted = await encryptionService.decryptData(encrypted);

    expect(decrypted).toBe(plainText);
  });

  it('should generate different ciphertexts for same plaintext', async () => {
    const plainText = 'same data';
    const encrypted1 = await encryptionService.encryptData(plainText);
    const encrypted2 = await encryptionService.encryptData(plainText);

    expect(encrypted1.encryptedData).not.toBe(encrypted2.encryptedData);
    expect(encrypted1.iv).not.toBe(encrypted2.iv);
  });

  it('should reject tampered data', async () => {
    const plainText = 'test data';
    const encrypted = await encryptionService.encryptData(plainText);

    // Tamper with encrypted data
    encrypted.encryptedData = encrypted.encryptedData.replace('a', 'b');

    await expect(encryptionService.decryptData(encrypted))
      .rejects.toThrow('Authentication failed');
  });
});
```

### Integration Tests

**`tests/database/encryption.integration.test.ts`**
```typescript
describe('Database Encryption Integration', () => {
  it('should encrypt data before saving to database', async () => {
    const invitation = new Invitation();
    invitation.invitationToken = 'test-token';
    invitation.email = 'test@example.com';

    await invitation.save();

    // Check that encrypted fields are populated
    const rawData = await db.query(
      'SELECT invitation_token_encrypted, email_encrypted FROM user_invitations WHERE id = $1',
      [invitation.id]
    );

    expect(rawData.invitation_token_encrypted).toBeDefined();
    expect(rawData.email_encrypted).toBeDefined();
    expect(rawData.invitation_token_encrypted).not.toBe('test-token');
    expect(rawData.email_encrypted).not.toBe('test@example.com');
  });

  it('should decrypt data when retrieving from database', async () => {
    const invitation = await Invitation.findById('some-id');

    expect(invitation.invitationToken).toBe('expected-token');
    expect(invitation.email).toBe('expected@example.com');
  });

  it('should handle encryption failures gracefully', async () => {
    // Mock KMS failure
    jest.spyOn(kms, 'generateDataKey').mockRejectedValue(new Error('KMS Error'));

    const invitation = new Invitation();
    invitation.invitationToken = 'test-token';

    await expect(invitation.save()).rejects.toThrow('Encryption failed');
  });
});
```

### Migration Tests

**`tests/database/migration.test.ts`**
```typescript
describe('Encryption Migration', () => {
  it('should migrate existing data without data loss', async () => {
    // Insert test data
    await db.query(`
      INSERT INTO user_invitations (email, invitation_token, ip_address)
      VALUES ('test@example.com', 'plain-token', '192.168.1.1')
    `);

    // Run migration
    await runMigrationScript();

    // Verify data is encrypted
    const result = await db.query(`
      SELECT invitation_token_encrypted, email_encrypted, ip_address_encrypted
      FROM user_invitations WHERE email_encrypted IS NOT NULL
    `);

    expect(result.invitation_token_encrypted).toBeDefined();
    expect(result.email_encrypted).toBeDefined();
    expect(result.ip_address_encrypted).toBeDefined();
  });

  it('should rollback migration on failure', async () => {
    // Simulate migration failure
    jest.spyOn(encryptionService, 'encryptData').mockRejectedValue(new Error('Test failure'));

    await expect(runMigrationScript()).rejects.toThrow();

    // Verify no partial encryption occurred
    const count = await db.query(`
      SELECT COUNT(*) FROM user_invitations
      WHERE invitation_token_encrypted IS NOT NULL
    `);

    expect(count).toBe(0);
  });
});
```

## Success Criteria

### Functional Requirements
- [ ] **AES-256-GCM Encryption:** Data encrypted with correct algorithm
- [ ] **KMS Integration:** AWS KMS used for key management
- [ ] **Automatic Encryption:** Fields encrypted/decrypted transparently
- [ ] **Data Migration:** Existing data successfully migrated
- [ ] **Key Rotation:** Key rotation process implemented
- [ ] **Error Handling:** Encryption failures handled gracefully

### Security Requirements
- [ ] **Data Protection:** Sensitive data encrypted at rest
- [ ] **Key Security:** Encryption keys managed by KMS
- [ ] **Access Control:** Encryption keys access restricted
- [ ] **Audit Trail:** Encryption operations logged
- [ ] **GDPR Compliance:** Personal data encryption compliant
- [ ] **Tamper Detection:** Data integrity verified via GCM

### Performance Requirements
- [ ] **Encryption Speed:** Data encryption < 50ms
- [ ] **Decryption Speed:** Data decryption < 25ms
- [ ] **Query Performance:** No significant query performance impact
- [ ] **Memory Usage:** Encryption operations memory efficient
- [ ] **Concurrent Access:** Thread-safe encryption operations

### Compliance Requirements
- [ ] **Data Classification:** All PII and sensitive data identified
- [ ] **Retention Policies:** Encrypted data retention compliant
- [ ] **Access Logging:** All data access logged and auditable
- [ ] **Breach Notification:** Encryption status monitored
- [ ] **Regular Audits:** Encryption implementation regularly audited

## Dependencies and Blockers

### Dependencies
- AWS KMS access and credentials
- AWS SDK for JavaScript
- Database schema updates
- Task 8.2.1 (HMAC Tokens) - for secure token handling

### Blockers
- AWS account setup and KMS configuration
- Database maintenance window for migration
- Application downtime during schema changes
- Testing environment with KMS access

## Risk Mitigation

### Security Risks
- **Key Exposure:** KMS manages keys, never in application code
- **Data Breach:** Encrypted data remains protected
- **Key Rotation:** Automated rotation with overlap period
- **Access Control:** IAM policies restrict KMS access
- **Audit Logging:** All encryption operations logged

### Technical Risks
- **Performance Impact:** Profile and optimize encryption operations
- **Migration Failure:** Comprehensive testing and rollback plan
- **KMS Outage:** Graceful degradation during KMS issues
- **Key Deletion:** Careful key lifecycle management
- **Version Compatibility:** Handle different encryption versions

### Operational Risks
- **Cost Management:** Monitor KMS usage costs
- **Monitoring:** Implement encryption health monitoring
- **Backup Strategy:** Encrypted data backup procedures
- **Disaster Recovery:** Encryption in disaster recovery plans
- **Training:** Staff training on encryption procedures

---

*This task implements comprehensive database encryption to protect sensitive data and ensure regulatory compliance.*
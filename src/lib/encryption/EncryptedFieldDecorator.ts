import { DatabaseEncryptionService, EncryptedData } from './DatabaseEncryptionService';

// Global encryption service instance
let encryptionService: DatabaseEncryptionService | null = null;

export function setEncryptionService(service: DatabaseEncryptionService) {
  encryptionService = service;
}

function getEncryptionService(): DatabaseEncryptionService {
  if (!encryptionService) {
    throw new Error('Encryption service not initialized. Call setEncryptionService first.');
  }
  return encryptionService;
}

export function EncryptedField(options: { table: string; column: string }) {
  return function(target: any, propertyKey: string | symbol) {
    const encryptedPropertyKey = `_${propertyKey}_encrypted`;

    // Getter
    const getter = function(this: any) {
      const encryptedValue = this[encryptedPropertyKey];
      if (!encryptedValue) return null;

      try {
        const encryptedData: EncryptedData = JSON.parse(encryptedValue);
        return getEncryptionService().decryptData(encryptedData, {
          table: options.table,
          column: options.column,
          recordId: this.id || this.invitationId || 'unknown'
        });
      } catch (error) {
        console.error(`Failed to decrypt ${propertyKey}:`, error);
        return null;
      }
    };

    // Setter
    const setter = function(this: any, value: string | null | undefined) {
      if (value === null || value === undefined) {
        this[encryptedPropertyKey] = null;
        return;
      }

      try {
        const encryptedData = getEncryptionService().encryptData(value, {
          table: options.table,
          column: options.column,
          recordId: this.id || this.invitationId || 'unknown'
        });
        this[encryptedPropertyKey] = JSON.stringify(encryptedData);
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
import * as mysql from 'mysql2/promise';
import { DatabaseEncryptionService } from '../DatabaseEncryptionService';

export interface MigrationConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  batchSize: number;
}

export class DataMigrationService {
  private connection: mysql.Connection | null = null;
  private encryptionService: DatabaseEncryptionService;

  constructor(encryptionService: DatabaseEncryptionService, private config: MigrationConfig) {
    this.encryptionService = encryptionService;
  }

  async connect(): Promise<void> {
    this.connection = await mysql.createConnection({
      host: this.config.host,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database
    });
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async migrateUserInvitations(): Promise<{ migrated: number; failed: number }> {
    if (!this.connection) throw new Error('Database not connected');

    let migrated = 0;
    let failed = 0;

    try {
      // Get total count
      const [countResult] = await this.connection.execute(
        'SELECT COUNT(*) as total FROM user_invitations WHERE invitation_token_encrypted IS NULL'
      );
      const total = (countResult as any)[0].total;

      console.log(`Migrating ${total} user invitations...`);

      // Process in batches
      for (let offset = 0; offset < total; offset += this.config.batchSize) {
        const [rows] = await this.connection.execute(
          'SELECT id, invitation_token, email, ip_address FROM user_invitations WHERE invitation_token_encrypted IS NULL LIMIT ? OFFSET ?',
          [this.config.batchSize, offset]
        );

        for (const row of rows as any[]) {
          try {
            await this.connection.beginTransaction();

            // Encrypt fields
            const encryptedToken = await this.encryptionService.encryptData(row.invitation_token, {
              table: 'user_invitations',
              column: 'invitation_token',
              recordId: row.id
            });

            const encryptedEmail = await this.encryptionService.encryptData(row.email, {
              table: 'user_invitations',
              column: 'email',
              recordId: row.id
            });

            const encryptedIP = row.ip_address ? await this.encryptionService.encryptData(row.ip_address, {
              table: 'user_invitations',
              column: 'ip_address',
              recordId: row.id
            }) : null;

            // Update record
            await this.connection.execute(
              'UPDATE user_invitations SET invitation_token_encrypted = ?, email_encrypted = ?, ip_address_encrypted = ? WHERE id = ?',
              [
                JSON.stringify(encryptedToken),
                JSON.stringify(encryptedEmail),
                encryptedIP ? JSON.stringify(encryptedIP) : null,
                row.id
              ]
            );

            await this.connection.commit();
            migrated++;
          } catch (error) {
            await this.connection.rollback();
            console.error(`Failed to migrate invitation ${row.id}:`, error);
            failed++;
          }
        }

        console.log(`Processed ${Math.min(offset + this.config.batchSize, total)}/${total} records`);
      }
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }

    return { migrated, failed };
  }

  async migrateOTPTokens(): Promise<{ migrated: number; failed: number }> {
    if (!this.connection) throw new Error('Database not connected');

    let migrated = 0;
    let failed = 0;

    try {
      const [countResult] = await this.connection.execute(
        'SELECT COUNT(*) as total FROM otp_tokens WHERE otp_code_encrypted IS NULL'
      );
      const total = (countResult as any)[0].total;

      console.log(`Migrating ${total} OTP tokens...`);

      for (let offset = 0; offset < total; offset += this.config.batchSize) {
        const [rows] = await this.connection.execute(
          'SELECT id, otp_code, ip_address FROM otp_tokens WHERE otp_code_encrypted IS NULL LIMIT ? OFFSET ?',
          [this.config.batchSize, offset]
        );

        for (const row of rows as any[]) {
          try {
            await this.connection.beginTransaction();

            const encryptedOTP = await this.encryptionService.encryptData(row.otp_code, {
              table: 'otp_tokens',
              column: 'otp_code',
              recordId: row.id
            });

            const encryptedIP = row.ip_address ? await this.encryptionService.encryptData(row.ip_address, {
              table: 'otp_tokens',
              column: 'ip_address',
              recordId: row.id
            }) : null;

            await this.connection.execute(
              'UPDATE otp_tokens SET otp_code_encrypted = ?, ip_address_encrypted = ? WHERE id = ?',
              [
                JSON.stringify(encryptedOTP),
                encryptedIP ? JSON.stringify(encryptedIP) : null,
                row.id
              ]
            );

            await this.connection.commit();
            migrated++;
          } catch (error) {
            await this.connection.rollback();
            console.error(`Failed to migrate OTP token ${row.id}:`, error);
            failed++;
          }
        }
      }
    } catch (error) {
      console.error('OTP migration failed:', error);
      throw error;
    }

    return { migrated, failed };
  }

  async rollbackMigration(table: string): Promise<void> {
    if (!this.connection) throw new Error('Database not connected');

    console.log(`Rolling back migration for ${table}...`);

    const encryptedColumns = this.getEncryptedColumns(table);

    // Clear encrypted columns
    await this.connection.execute(
      `UPDATE ${table} SET ${encryptedColumns.map(col => `${col} = NULL`).join(', ')}`
    );

    console.log(`Rollback completed for ${table}`);
  }

  private getEncryptedColumns(table: string): string[] {
    switch (table) {
      case 'user_invitations':
        return ['invitation_token_encrypted', 'email_encrypted', 'ip_address_encrypted'];
      case 'otp_tokens':
        return ['otp_code_encrypted', 'ip_address_encrypted'];
      case 'family_invitations':
        return ['parent_email_encrypted', 'children_profiles_encrypted'];
      default:
        return [];
    }
  }

  async validateMigration(table: string): Promise<{ valid: number; invalid: number }> {
    if (!this.connection) throw new Error('Database not connected');

    let valid = 0;
    let invalid = 0;

    const encryptedColumns = this.getEncryptedColumns(table);
    const plainColumns = encryptedColumns.map(col => col.replace('_encrypted', ''));

    const [rows] = await this.connection.execute(
      `SELECT ${plainColumns.join(', ')}, ${encryptedColumns.join(', ')} FROM ${table} WHERE ${encryptedColumns[0]} IS NOT NULL`
    );

    for (const row of rows as any[]) {
      try {
        // Try to decrypt and compare
        for (let i = 0; i < plainColumns.length; i++) {
          const plainValue = row[plainColumns[i]];
          const encryptedValue = row[encryptedColumns[i]];

          if (encryptedValue) {
            const decrypted = await this.encryptionService.decryptData(JSON.parse(encryptedValue));
            if (decrypted !== plainValue) {
              invalid++;
              break;
            }
          }
        }
        valid++;
      } catch (error) {
        invalid++;
      }
    }

    return { valid, invalid };
  }
}
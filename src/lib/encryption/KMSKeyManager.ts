import {
  KMSClient,
  DescribeKeyCommand,
  CreateKeyCommand,
  CreateAliasCommand,
  UpdateAliasCommand,
  ScheduleKeyDeletionCommand,
  ListAliasesCommand,
  KeySpec
} from '@aws-sdk/client-kms';

export class KMSKeyManager {
  private kms: KMSClient;
  private readonly keyAlias = 'alias/database-encryption';

  constructor(region: string) {
    this.kms = new KMSClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    });
  }

  async ensureKeyExists(): Promise<string> {
    try {
      // Check if key alias exists
      const aliasResponse = await this.kms.send(new DescribeKeyCommand({
        KeyId: this.keyAlias
      }));

      return aliasResponse.KeyMetadata!.KeyId!;
    } catch (error: any) {
      if (error.name === 'NotFoundException') {
        // Create new key
        const keyResponse = await this.kms.send(new CreateKeyCommand({
          Description: 'Database encryption key for sensitive data',
          KeyUsage: 'ENCRYPT_DECRYPT',
          Tags: [
            { TagKey: 'Purpose', TagValue: 'DatabaseEncryption' },
            { TagKey: 'Project', TagValue: 'GitaConnect' }
          ]
        }));

        // Create alias
        await this.kms.send(new CreateAliasCommand({
          AliasName: this.keyAlias,
          TargetKeyId: keyResponse.KeyMetadata!.KeyId!
        }));

        return keyResponse.KeyMetadata!.KeyId!;
      }
      throw error;
    }
  }

  async rotateKey(): Promise<{ oldKeyId: string; newKeyId: string }> {
    const oldKeyId = await this.getCurrentKeyId();

    // Create new key
    const newKeyResponse = await this.kms.send(new CreateKeyCommand({
      Description: `Database encryption key rotated ${new Date().toISOString()}`,
      KeyUsage: 'ENCRYPT_DECRYPT'
    }));

    const newKeyId = newKeyResponse.KeyMetadata!.KeyId!;

    // Update alias to point to new key
    await this.kms.send(new UpdateAliasCommand({
      AliasName: this.keyAlias,
      TargetKeyId: newKeyId
    }));

    // Schedule old key for deletion (after data re-encryption)
    await this.scheduleKeyDeletion(oldKeyId);

    return { oldKeyId, newKeyId };
  }

  private async getCurrentKeyId(): Promise<string> {
    const aliasResponse = await this.kms.send(new DescribeKeyCommand({
      KeyId: this.keyAlias
    }));

    return aliasResponse.KeyMetadata!.KeyId!;
  }

  private async scheduleKeyDeletion(keyId: string): Promise<void> {
    // Schedule deletion after 30 days (minimum waiting period)
    await this.kms.send(new ScheduleKeyDeletionCommand({
      KeyId: keyId,
      PendingWindowInDays: 30
    }));
  }

  async listKeys(): Promise<any[]> {
    const aliasesResponse = await this.kms.send(new ListAliasesCommand({}));
    return aliasesResponse.Aliases || [];
  }
}
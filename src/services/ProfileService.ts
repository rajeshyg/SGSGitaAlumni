import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

export interface ProfileSelection {
  alumniMemberId: string;
  relationship: 'parent' | 'child';
  parentProfileId?: string | null;
  yearOfBirth?: number | null;
}

export interface UserProfile {
  id: string;
  accountId: string;
  alumniMemberId: string;
  relationship: 'parent' | 'child';
  parentProfileId: string | null;
  accessLevel: 'full' | 'supervised' | 'blocked';
  status: string;
  requiresConsent: boolean;
}

export class ProfileService {
  constructor(private pool: mysql.Pool) {}

  async listProfiles(accountId: string): Promise<UserProfile[]> {
    const [rows] = await this.pool.execute(
            `SELECT id, account_id, alumni_member_id, relationship, parent_profile_id, access_level, status,
              requires_consent
       FROM user_profiles
       WHERE account_id = ?
       ORDER BY relationship DESC, created_at ASC`,
      [accountId]
    );

    return (rows as any[]).map(this.mapProfileRow);
  }

  async createProfiles(accountId: string, selections: ProfileSelection[]): Promise<UserProfile[]> {
    const connection = await this.pool.getConnection();
    try {
      await connection.beginTransaction();

      const created: UserProfile[] = [];
      let parentProfileId: string | null = null;

      const parents = selections.filter(s => s.relationship === 'parent');
      const children = selections.filter(s => s.relationship === 'child');

      for (const selection of parents) {
        const profile = await this.createSingleProfile(connection, accountId, selection, null);
        created.push(profile);
        if (!parentProfileId) parentProfileId = profile.id;
      }

      for (const selection of children) {
        const profile = await this.createSingleProfile(connection, accountId, selection, parentProfileId);
        if (profile) created.push(profile);
      }

      await connection.commit();
      return created;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async switchProfile(accountId: string, profileId: string): Promise<UserProfile> {
    const profile = await this.getProfile(accountId, profileId);
    if (!profile) {
      throw new Error('Profile not found');
    }
    if (profile.accessLevel === 'blocked') {
      throw new Error('Profile access blocked');
    }
    return profile;
  }

  async grantConsent(accountId: string, profileId: string): Promise<UserProfile> {
    const connection = await this.pool.getConnection();
    try {
      const profile = await this.getProfile(accountId, profileId, connection);
      if (!profile) throw new Error('Profile not found');

      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await connection.execute(
        `UPDATE user_profiles SET 
           parent_consent_given = 1,
           consent_expiry_date = ?,
           access_level = 'supervised',
           status = 'active'
         WHERE id = ? AND account_id = ?`,
        [expiresAt, profileId, accountId]
      );

      await connection.execute(
        `INSERT INTO PARENT_CONSENT_RECORDS 
           (id, child_profile_id, parent_account_id, consent_given_date, consent_expiry_date, status, created_at)
         VALUES (?, ?, ?, NOW(), ?, 'active', NOW())`,
        [uuidv4(), profileId, accountId, expiresAt]
      );

      const updated = await this.getProfile(accountId, profileId, connection);
      if (!updated) throw new Error('Profile not found after consent update');
      return updated;
    } finally {
      connection.release();
    }
  }

  private async getProfile(accountId: string, profileId: string, conn?: mysql.PoolConnection): Promise<UserProfile | null> {
    const runner = conn || this.pool;
    const [rows] = await runner.execute(
      `SELECT id, account_id, alumni_member_id, relationship, parent_profile_id, access_level, status, requires_consent
       FROM user_profiles
       WHERE account_id = ? AND id = ?
       LIMIT 1`,
      [accountId, profileId]
    );
    const profileRow = (rows as any[])[0];
    return profileRow ? this.mapProfileRow(profileRow) : null;
  }

  private async createSingleProfile(
    connection: mysql.PoolConnection,
    accountId: string,
    selection: ProfileSelection,
    parentProfileId: string | null
  ): Promise<UserProfile | null> {
    const age = selection.yearOfBirth ? new Date().getFullYear() - Number(selection.yearOfBirth) : null;
    if (selection.relationship === 'child' && age !== null && age < 14) {
      // Do not create under-14 profiles
      return null;
    }

    const requiresConsent = selection.relationship === 'child' && age !== null && age < 18;
    const accessLevel = requiresConsent ? 'supervised' : 'full';
    const status = requiresConsent ? 'pending_consent' : 'active';

    const id = uuidv4();
    await connection.execute(
      `INSERT INTO user_profiles (
         id, account_id, alumni_member_id, relationship, parent_profile_id,
         access_level, status, requires_consent, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        id,
        accountId,
        selection.alumniMemberId,
        selection.relationship,
        selection.relationship === 'child' ? parentProfileId : null,
        accessLevel,
        status,
        requiresConsent ? 1 : 0
      ]
    );

    return this.mapProfileRow({
      id,
      account_id: accountId,
      alumni_member_id: selection.alumniMemberId,
      relationship: selection.relationship,
      parent_profile_id: selection.relationship === 'child' ? parentProfileId : null,
      access_level: accessLevel,
      status,
      requires_consent: requiresConsent
    });
  }

  private mapProfileRow = (row: any): UserProfile => ({
    id: row.id,
    accountId: row.account_id,
    alumniMemberId: row.alumni_member_id,
    relationship: row.relationship,
    parentProfileId: row.parent_profile_id,
    accessLevel: row.access_level,
    status: row.status,
    requiresConsent: !!row.requires_consent
  });
}

export default ProfileService;

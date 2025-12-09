import mysql from 'mysql2/promise';
import ProfileService, { ProfileSelection, UserProfile } from './ProfileService';

export interface InvitationValidationResult {
  valid: boolean;
  invitation?: { id: string; email: string; expiresAt: Date };
  alumni?: Array<{
    id: string;
    firstName: string;
    lastName: string;
    batch: number;
    centerName: string;
    yearOfBirth: number | null;
    age: number | null;
    coppaStatus: 'blocked' | 'requires_consent' | 'full_access' | 'unknown';
    canCreateProfile: boolean;
  }>;
}

export class OnboardingService {
  private profileService: ProfileService;

  constructor(private pool: mysql.Pool) {
    this.profileService = new ProfileService(pool);
  }

  async validateInvitation(token: string): Promise<InvitationValidationResult> {
    const connection = await this.pool.getConnection();
    try {
      const [invitations] = await connection.execute(
        `SELECT id, email, status, expires_at
         FROM USER_INVITATIONS
         WHERE id = ? AND status = 'pending' AND expires_at > NOW()`,
        [token]
      );

      if ((invitations as any[]).length === 0) {
        return { valid: false };
      }

      const invitation = (invitations as any[])[0];

      const [alumni] = await connection.execute(
        `SELECT id, first_name, last_name, batch, center_name, year_of_birth,
                CASE 
                  WHEN year_of_birth IS NOT NULL THEN YEAR(CURDATE()) - year_of_birth
                  ELSE NULL
                END as age
         FROM alumni_members 
         WHERE email = ?`,
        [invitation.email]
      );

      const alumniWithCoppa = (alumni as any[]).map((a) => ({
        id: a.id,
        firstName: a.first_name,
        lastName: a.last_name,
        batch: a.batch,
        centerName: a.center_name,
        yearOfBirth: a.year_of_birth,
        age: a.age,
        coppaStatus: this.getCoppaStatus(a.age),
        canCreateProfile: a.age === null || a.age >= 14
      }));

      return {
        valid: true,
        invitation: {
          id: invitation.id,
          email: invitation.email,
          expiresAt: invitation.expires_at
        },
        alumni: alumniWithCoppa
      };
    } finally {
      connection.release();
    }
  }

  async selectProfiles(accountId: string, selections: ProfileSelection[]): Promise<{ profiles: UserProfile[]; requiresConsent: boolean; }> {
    const profiles = await this.profileService.createProfiles(accountId, selections);

    await this.pool.execute(
      'UPDATE accounts SET status = "active" WHERE id = ?',
      [accountId]
    );

    return {
      profiles,
      requiresConsent: profiles.some(p => p.requiresConsent)
    };
  }

  async collectYearOfBirth(alumniMemberId: string, yearOfBirth: number): Promise<{ age: number; coppaStatus: string; }> {
    const currentYear = new Date().getFullYear();
    if (yearOfBirth < 1900 || yearOfBirth > currentYear) {
      throw new Error('Invalid year of birth');
    }

    await this.pool.execute(
      'UPDATE alumni_members SET year_of_birth = ? WHERE id = ?',
      [yearOfBirth, alumniMemberId]
    );

    const age = currentYear - yearOfBirth;
    return { age, coppaStatus: this.getCoppaStatus(age) };
  }

  async grantConsent(accountId: string, childProfileId: string): Promise<{ profile: UserProfile; expiresAt: Date }> {
    const profile = await this.profileService.grantConsent(accountId, childProfileId);
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    return { profile, expiresAt };
  }

  private getCoppaStatus(age: number | null): 'blocked' | 'requires_consent' | 'full_access' | 'unknown' {
    if (age === null) return 'unknown';
    if (age < 14) return 'blocked';
    if (age < 18) return 'requires_consent';
    return 'full_access';
  }
}

export default OnboardingService;

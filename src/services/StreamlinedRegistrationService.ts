import mysql from 'mysql2/promise';
import { v4 as uuidv4 } from 'uuid';

/**
 * COPPA Compliance - Simplified Registration Service
 *
 * NEW DESIGN (Phase 3):
 * - Creates account in `accounts` table (replaces app_users)
 * - Does NOT create user_profiles (that's done during onboarding via /api/onboarding/select-profiles)
 * - Does NOT import family members (user explicitly selects profiles)
 * - Focuses on account creation only
 *
 * OLD DESIGN (DELETED):
 * - Auto-imported all family members with same email
 * - Created FAMILY_MEMBERS records during registration
 * - Used app_users and FAMILY_MEMBERS tables
 *
 * See docs/specs/refactoring-plans/03-api-refactoring-plan.md Step 5.1
 */

export interface Account {
  id: string;
  email: string;
  status: 'pending' | 'active' | 'inactive';
  role: 'user' | 'admin';
}

export class StreamlinedRegistrationService {
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  /**
   * Create an account in the accounts table
   * SIMPLIFIED: No family member auto-import, no alumni data merging
   *
   * @param email - User email (unique)
   * @param passwordHash - Hashed password
   * @returns Account object with generated ID
   */
  async createAccount(email: string, passwordHash: string): Promise<Account> {
    const connection = await this.pool.getConnection();
    try {
      const accountId = uuidv4();

      await connection.execute(
        `INSERT INTO accounts (id, email, password_hash, status, role, created_at, updated_at)
         VALUES (?, ?, ?, 'pending', 'user', NOW(), NOW())`,
        [accountId, email, passwordHash]
      );

      console.log(`✅ Account created: ${accountId} (${email})`);

      return {
        id: accountId,
        email,
        status: 'pending',
        role: 'user'
      };
    } catch (error) {
      if ((error as any).code === 'ER_DUP_ENTRY') {
        throw new Error(`Account with email ${email} already exists`);
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Check if email already exists in accounts table
   */
  async emailExists(email: string): Promise<boolean> {
    const connection = await this.pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT id FROM accounts WHERE email = ?',
        [email]
      );
      return rows.length > 0;
    } finally {
      connection.release();
    }
  }

  /**
   * Get account by email
   */
  async getAccountByEmail(email: string): Promise<Account | null> {
    const connection = await this.pool.getConnection();
    try {
      const [rows]: any = await connection.execute(
        'SELECT id, email, status, role FROM accounts WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0];
    } finally {
      connection.release();
    }
  }

  /**
   * Activate account (mark as 'active')
   * Called after email verification
   */
  async activateAccount(accountId: string): Promise<void> {
    const connection = await this.pool.getConnection();
    try {
      await connection.execute(
        'UPDATE accounts SET status = ?, updated_at = NOW() WHERE id = ?',
        ['active', accountId]
      );
      console.log(`✅ Account activated: ${accountId}`);
    } finally {
      connection.release();
    }
  }
}

export default StreamlinedRegistrationService;
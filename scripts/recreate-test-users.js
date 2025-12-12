import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../utils/database.js';

dotenv.config();

const USERS = [
  {
    email: 'testuser@example.com',
    password: 'TestUser123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    alumniEmail: 'test.alumni.user@example.com'
  },
  {
    email: 'moderator@test.com',
    password: 'TestMod123!',
    firstName: 'Test',
    lastName: 'Moderator',
    role: 'moderator',
    alumniEmail: 'test.alumni.mod@example.com'
  }
];

async function recreateTestUsers() {
  const pool = getPool();
  
  try {
    console.log('🔄 Starting test user recreation...');

    for (const user of USERS) {
      console.log(`\nProcessing user: ${user.email}`);

      // 1. Ensure Alumni Member Exists
      // We need a unique alumni member for each test user to link the profile
      const [existingAlumni] = await pool.execute(
        'SELECT id FROM alumni_members WHERE email = ?',
        [user.alumniEmail]
      );

      let alumniId;
      if (existingAlumni.length > 0) {
        alumniId = existingAlumni[0].id;
        console.log(`  ✅ Found existing alumni member (ID: ${alumniId})`);
      } else {
        console.log('  ➕ Creating new alumni member...');
        const [result] = await pool.execute(
          `INSERT INTO alumni_members (first_name, last_name, email, batch, center_name)
           VALUES (?, ?, ?, '2020', 'Test Center')`,
          [user.firstName, user.lastName, user.alumniEmail]
        );
        alumniId = result.insertId;
        console.log(`  ✅ Created alumni member (ID: ${alumniId})`);
      }

      // 2. Delete Existing Account (and cascading profiles)
      // First check if account exists to log it
      const [existingAccount] = await pool.execute(
        'SELECT id FROM accounts WHERE email = ?',
        [user.email]
      );
      
      if (existingAccount.length > 0) {
        console.log(`  🗑️ Deleting existing account...`);
        await pool.execute('DELETE FROM accounts WHERE email = ?', [user.email]);
      }

      // 3. Create Account
      const hashedPassword = await bcrypt.hash(user.password, 10);
      const accountId = uuidv4();
      
      console.log(`  👤 Creating account (ID: ${accountId})...`);
      await pool.execute(
        `INSERT INTO accounts (id, email, password_hash, role, status, email_verified, requires_otp)
         VALUES (?, ?, ?, ?, 'active', 1, 0)`,
        [accountId, user.email, hashedPassword, user.role]
      );

      // 4. Create User Profile
      // Check if a profile already exists for this alumni/account combo (shouldn't if we deleted account)
      // But purely for safety:
      const profileId = uuidv4();
      console.log(`  📝 Creating user profile (ID: ${profileId})...`);
      
      await pool.execute(
        `INSERT INTO user_profiles (
           id, account_id, alumni_member_id, relationship, 
           access_level, status, display_name, visibility
         ) VALUES (?, ?, ?, 'parent', 'full', 'active', ?, 'public')`,
        [profileId, accountId, alumniId, `${user.firstName} ${user.lastName}`]
      );

      console.log(`  ✅ Successfully created ${user.role} account for ${user.email}`);
    }

    console.log('\n✅ All test users recreated successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error recreating test users:', error);
    process.exit(1);
  }
}

recreateTestUsers();

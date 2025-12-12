import dotenv from 'dotenv';
import { getPool } from '../../utils/database.js';

dotenv.config();

async function verifyUserData() {
  const pool = getPool();
  const email = 'testuser@example.com';

  console.log(`🔍 Verifying data for ${email}...`);

  try {
    // 1. Check Account
    const [accounts] = await pool.execute(
      'SELECT id, email, role, status FROM accounts WHERE email = ?',
      [email]
    );

    if (accounts.length === 0) {
      console.log('❌ Account not found!');
      return;
    }

    const account = accounts[0];
    console.log('✅ Account found:', account);

    // 2. Check User Profiles
    const [profiles] = await pool.execute(
      'SELECT * FROM user_profiles WHERE account_id = ?',
      [account.id]
    );

    console.log(`Found ${profiles.length} profiles for account.`);

    if (profiles.length === 0) {
      console.log('❌ No profiles linked to this account.');
    } else {
      for (const p of profiles) {
        console.log('  - Profile:', {
          id: p.id,
          alumni_member_id: p.alumni_member_id,
          relationship: p.relationship
        });

        // 3. Check Alumni Member linkage
        const [alumni] = await pool.execute(
          'SELECT * FROM alumni_members WHERE id = ?',
          [p.alumni_member_id]
        );

        if (alumni.length > 0) {
          console.log(`    ✅ Linked Alumni: ${alumni[0].first_name} ${alumni[0].last_name} (ID: ${alumni[0].id})`);
        } else {
          console.log(`    ❌ Linked Alumni ID ${p.alumni_member_id} NOT FOUND in alumni_members table!`);
        }
      }
    }

    // 4. Test the exact query used in auth.js
    console.log('\nTesting auth.js query...');
    const [authProfiles] = await pool.execute(
      `SELECT up.id, up.relationship, up.access_level, up.status, up.parent_profile_id,
              up.requires_consent, up.parent_consent_given,
              am.first_name, am.last_name, am.batch, am.center_name, am.year_of_birth, am.email as alumni_email
       FROM user_profiles up
       JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE up.account_id = ?
       ORDER BY up.relationship DESC, up.created_at ASC`,
      [account.id]
    );
    console.log(`Auth query returned ${authProfiles.length} rows.`);
    if (authProfiles.length === 0) {
      console.log('❌ Auth query failed to return profiles even if they exist individually. Check JOIN conditions.');
    } else {
      console.log('✅ Auth query working.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

verifyUserData();

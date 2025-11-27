// ============================================================================
// CLEANUP SCRIPT: Remove all records for sankarijv@gmail.com
// ============================================================================
// This script removes all test data for the user sankarijv@gmail.com
// so you can retry the invitation and registration flow cleanly.

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from project root
dotenv.config({ path: join(__dirname, '..', '..', '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alumni_network',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const EMAIL = 'sankarijv@gmail.com';

async function cleanupUserData() {
  let connection;

  try {
    console.log('🔍 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    await connection.beginTransaction();
    console.log('\n🧹 Starting cleanup for:', EMAIL);
    console.log('='.repeat(60));

    // 0. Check alumni_members records (these will be preserved)
    const [alumniMembers] = await connection.execute(
      `SELECT id, first_name, last_name, batch, birth_date, estimated_birth_year
       FROM alumni_members WHERE email = ?`,
      [EMAIL]
    );

    if (alumniMembers.length > 0) {
      console.log(`\n📚 Alumni Records (will be preserved):`);
      alumniMembers.forEach((am, index) => {
        console.log(`\n  Alumni ${index + 1}:`);
        console.log(`    ID: ${am.id}`);
        console.log(`    Name: ${am.first_name} ${am.last_name}`);
        console.log(`    Batch: ${am.batch || 'N/A'}`);
        console.log(`    Birth Date: ${am.birth_date || 'N/A'}`);
        console.log(`    Estimated Birth Year: ${am.estimated_birth_year || 'N/A'}`);
      });
      console.log(`\n  Note: Alumni records are preserved, only registration data will be cleared`);
    }

    // 1. Find all user IDs with this email
    const [users] = await connection.execute(
      `SELECT id, email, first_name, last_name, primary_family_member_id, created_at
       FROM app_users WHERE email = ?`,
      [EMAIL]
    );

    if (users.length === 0) {
      console.log('\nℹ️  No app_users found with email:', EMAIL);
    } else {
      console.log(`\n📊 Found ${users.length} app_users record(s) to delete:`);
      users.forEach((user, index) => {
        console.log(`\n  User ${index + 1}:`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Name: ${user.first_name} ${user.last_name}`);
        console.log(`    Family Member ID: ${user.primary_family_member_id}`);
        console.log(`    Created: ${user.created_at}`);
      });
    }

    // 2. Delete from FAMILY_MEMBERS (as parent)
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');

      const [familyResult] = await connection.execute(
        `DELETE FROM FAMILY_MEMBERS WHERE parent_user_id IN (${placeholders})`,
        userIds
      );
      console.log(`\n✅ Deleted ${familyResult.affectedRows} family member record(s) (as parent)`);
    }

    // 2b. Delete from FAMILY_MEMBERS by alumni_member_id (linked to alumni with same email)
    // Note: FAMILY_MEMBERS doesn't have user_id column, it has parent_user_id and alumni_member_id
    const [alumniMemberResult] = await connection.execute(
      `DELETE FROM FAMILY_MEMBERS 
       WHERE alumni_member_id IN (SELECT id FROM alumni_members WHERE email = ?)`,
      [EMAIL]
    );
    console.log(`✅ Deleted ${alumniMemberResult.affectedRows} family member record(s) (by alumni email)`);

    // 3. Delete from USER_PREFERENCES
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      
      const [prefResult] = await connection.execute(
        `DELETE FROM USER_PREFERENCES WHERE user_id IN (${placeholders})`,
        userIds
      );
      console.log(`✅ Deleted ${prefResult.affectedRows} user preference record(s)`);
    }

    // 4. Delete from app_users
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      
      const [userResult] = await connection.execute(
        `DELETE FROM app_users WHERE id IN (${placeholders})`,
        userIds
      );
      console.log(`✅ Deleted ${userResult.affectedRows} app_users record(s)`);
    }

    // 5. Find and clean FAMILY_INVITATIONS
    const [familyInvites] = await connection.execute(
      `SELECT id FROM FAMILY_INVITATIONS
       WHERE parent_email = ?`,
      [EMAIL]
    );

    if (familyInvites.length > 0) {
      const familyInviteIds = familyInvites.map(f => f.id);
      const fPlaceholders = familyInviteIds.map(() => '?').join(',');

      const [fDelResult] = await connection.execute(
        `DELETE FROM FAMILY_INVITATIONS WHERE id IN (${fPlaceholders})`,
        familyInviteIds
      );
      console.log(`✅ Deleted ${fDelResult.affectedRows} FAMILY_INVITATIONS record(s)`);
    }

    // 6. Delete USER_INVITATIONS (fresh invitation needed from admin)
    const [inviteResult] = await connection.execute(
      `DELETE FROM USER_INVITATIONS WHERE email = ?`,
      [EMAIL]
    );
    console.log(`✅ Deleted ${inviteResult.affectedRows} invitation(s)`);

    // 7. Delete OTP tokens
    const [otpResult] = await connection.execute(
      `DELETE FROM OTP_TOKENS WHERE email = ?`,
      [EMAIL]
    );
    console.log(`✅ Deleted ${otpResult.affectedRows} OTP token(s)`);

    // 8. Clear alumni_members.invitation_accepted_at
    const [alumniResult] = await connection.execute(
      `UPDATE alumni_members
       SET invitation_accepted_at = NULL
       WHERE email = ?`,
      [EMAIL]
    );
    console.log(`✅ Reset ${alumniResult.affectedRows} alumni_members invitation timestamp(s)`);

    await connection.commit();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Cleanup completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - User accounts deleted: ${users.length}`);
    console.log(`   - Invitations DELETED: ${inviteResult.affectedRows}`);
    console.log(`   - OTP tokens cleared`);
    console.log(`   - Family members deleted`);
    console.log(`   - Ready for fresh invitation (admin must resend)`);
    console.log('='.repeat(60));

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('\n❌ Error during cleanup:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run cleanup
cleanupUserData().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

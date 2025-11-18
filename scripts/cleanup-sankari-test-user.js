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

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

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

    // 1. Find all user IDs with this email
    const [users] = await connection.execute(
      `SELECT id, email, first_name, last_name, primary_family_member_id, created_at
       FROM app_users WHERE email = ?`,
      [EMAIL]
    );

    if (users.length === 0) {
      console.log('ℹ️  No users found with email:', EMAIL);
    } else {
      console.log(`\n📊 Found ${users.length} user(s):`);
      users.forEach((user, index) => {
        console.log(`\n  User ${index + 1}:`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Name: ${user.first_name} ${user.last_name}`);
        console.log(`    Family Member ID: ${user.primary_family_member_id}`);
        console.log(`    Created: ${user.created_at}`);
      });
    }

    // 2. Delete from FAMILY_MEMBERS
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
      const placeholders = userIds.map(() => '?').join(',');
      
      const [familyResult] = await connection.execute(
        `DELETE FROM FAMILY_MEMBERS WHERE parent_user_id IN (${placeholders})`,
        userIds
      );
      console.log(`\n✅ Deleted ${familyResult.affectedRows} family member record(s)`);
    }

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

    // 5. Reset USER_INVITATIONS status (including revoked ones)
    const [inviteResult] = await connection.execute(
      `UPDATE USER_INVITATIONS
       SET status = 'pending',
           is_used = 0,
           user_id = NULL,
           used_at = NULL,
           completion_status = 'pending',
           updated_at = NOW()
       WHERE email = ?`,
      [EMAIL]
    );
    console.log(`✅ Reset ${inviteResult.affectedRows} invitation(s) to pending status (including revoked)`);

    // 6. Delete OTP tokens
    const [otpResult] = await connection.execute(
      `DELETE FROM OTP_TOKENS WHERE email = ?`,
      [EMAIL]
    );
    console.log(`✅ Deleted ${otpResult.affectedRows} OTP token(s)`);

    // 7. Clear alumni_members.invitation_accepted_at
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
    console.log(`   - Invitations reset to pending`);
    console.log(`   - OTP tokens cleared`);
    console.log(`   - Family members deleted`);
    console.log(`   - Ready for fresh registration test`);
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

/**
 * Fix invitation records after test data cleanup
 * - Create USER_INVITATIONS records for all newly created users
 * - Link them to their alumni_member_id
 * - Set status to 'accepted' since users are already created
 */

import db from './config/database.js';
import crypto from 'crypto';

async function fixInvitationsAfterCleanup() {
  try {
    console.log('\n🔧 FIXING INVITATIONS AFTER CLEANUP\n');
    console.log('=' .repeat(80));

    // Get all users except admin
    const [users] = await db.execute(`
      SELECT id, email, first_name, last_name, alumni_member_id, is_family_account
      FROM app_users
      WHERE email != 'datta.rajesh@gmail.com'
      ORDER BY id
    `);

    console.log(`Found ${users.length} users to create invitation records for\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      // Check if invitation already exists
      const [existing] = await db.execute(
        'SELECT id FROM USER_INVITATIONS WHERE email = ?',
        [user.email]
      );

      if (existing.length > 0) {
        console.log(`⏭️  Skipping ${user.email} - invitation already exists`);
        skippedCount++;
        continue;
      }

      // Create invitation record
      const invitationToken = crypto.randomBytes(32).toString('hex');

      await db.execute(`
        INSERT INTO USER_INVITATIONS (
          invitation_token, email, status, completion_status, is_used,
          used_at, expires_at, alumni_member_id, invited_by, invitation_type,
          invitation_data, sent_at, created_at, updated_at
        ) VALUES (?, ?, 'accepted', 'completed', 1, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY),
                 ?, 'admin', 'alumni', '{}', NOW(), NOW(), NOW())
      `, [invitationToken, user.email, user.alumni_member_id]);

      console.log(`✅ Created invitation record for ${user.email}`);
      createdCount++;
    }

    console.log('\n' + '='.repeat(80));
    console.log(`📊 SUMMARY:`);
    console.log(`   ✅ Created: ${createdCount} invitation records`);
    console.log(`   ⏭️  Skipped: ${skippedCount} existing records`);
    console.log(`   📧 Total processed: ${users.length} users`);

    // Verify the fix
    console.log('\n🔍 VERIFICATION:');
    const [invitations] = await db.execute(`
      SELECT COUNT(*) as total_invitations,
             SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count
      FROM USER_INVITATIONS
    `);

    console.log(`   Total invitations: ${invitations[0].total_invitations}`);
    console.log(`   Accepted invitations: ${invitations[0].accepted_count}`);

    console.log('\n✅ INVITATION FIX COMPLETE!');

  } catch (error) {
    console.error('❌ Error fixing invitations:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

fixInvitationsAfterCleanup();
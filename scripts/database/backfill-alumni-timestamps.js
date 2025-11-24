/**
 * BACKFILL ALUMNI TIMESTAMPS MIGRATION
 *
 * This script backfills missing invitation_sent_at and invitation_accepted_at timestamps
 * for existing users who registered before the registration flow was fixed.
 *
 * Specifically targets the 3 working families:
 * - jayanthi236@gmail.com
 * - saikveni6@gmail.com
 * - srinidhi.anand@yahoo.com
 *
 * Usage:
 *   node scripts/backfill-alumni-timestamps.js
 */

import db from '../config/database.js';

const TARGET_EMAILS = [
  'jayanthi236@gmail.com',
  'saikveni6@gmail.com',
  'srinidhi.anand@yahoo.com'
];

async function backfillTimestamps() {
  console.log('='.repeat(80));
  console.log('BACKFILL ALUMNI TIMESTAMPS MIGRATION');
  console.log('='.repeat(80));
  console.log();

  try {
    console.log('Connecting to database...');
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();
      console.log('Transaction started\n');

      // Process each target email
      for (const email of TARGET_EMAILS) {
        console.log(`Processing: ${email}`);
        console.log('-'.repeat(80));

        // 1. Get user registration date from app_users
        const [userRows] = await connection.execute(
          `SELECT id, email, created_at, alumni_member_id
           FROM app_users
           WHERE email = ?`,
          [email]
        );

        if (userRows.length === 0) {
          console.log(`  ❌ User not found in app_users table`);
          console.log();
          continue;
        }

        const user = userRows[0];
        console.log(`  ✅ User found:`, {
          id: user.id,
          createdAt: user.created_at,
          alumniMemberId: user.alumni_member_id
        });

        // 2. Get invitation data from USER_INVITATIONS
        const [invitationRows] = await connection.execute(
          `SELECT id, email, sent_at, used_at, status
           FROM USER_INVITATIONS
           WHERE email = ?
           ORDER BY created_at DESC
           LIMIT 1`,
          [email]
        );

        if (invitationRows.length === 0) {
          console.log(`  ⚠️  No invitation found in USER_INVITATIONS table`);
          console.log(`  📝 Will use user.created_at as fallback for both timestamps`);
        } else {
          const invitation = invitationRows[0];
          console.log(`  ✅ Invitation found:`, {
            id: invitation.id,
            sentAt: invitation.sent_at,
            usedAt: invitation.used_at,
            status: invitation.status
          });
        }

        // 3. Determine timestamps to use
        let invitationSentAt;
        let invitationAcceptedAt;

        if (invitationRows.length > 0) {
          const invitation = invitationRows[0];
          // Use invitation.sent_at if available, otherwise use user.created_at minus 1 hour
          invitationSentAt = invitation.sent_at || new Date(new Date(user.created_at).getTime() - 60 * 60 * 1000);
          // Use invitation.used_at if available, otherwise use user.created_at
          invitationAcceptedAt = invitation.used_at || user.created_at;
        } else {
          // No invitation record - use user.created_at with some offset
          invitationSentAt = new Date(new Date(user.created_at).getTime() - 60 * 60 * 1000);
          invitationAcceptedAt = user.created_at;
        }

        console.log(`  📅 Timestamps to apply:`);
        console.log(`     invitation_sent_at: ${invitationSentAt}`);
        console.log(`     invitation_accepted_at: ${invitationAcceptedAt}`);

        // 4. Find alumni_member by email (may not be linked in app_users yet)
        let alumniMemberId = user.alumni_member_id;

        if (!alumniMemberId) {
          console.log(`  ⚠️  User has no alumni_member_id - searching by email...`);

          const [alumniSearchRows] = await connection.execute(
            `SELECT id FROM alumni_members WHERE email = ?`,
            [email]
          );

          if (alumniSearchRows.length === 0) {
            console.log(`  ❌ Alumni member not found by email - cannot link`);
            console.log();
            continue;
          }

          alumniMemberId = alumniSearchRows[0].id;
          console.log(`  ✅ Found alumni_member by email (ID: ${alumniMemberId})`);

          // Update app_users to link to alumni_member
          const [linkResult] = await connection.execute(
            `UPDATE app_users
             SET alumni_member_id = ?
             WHERE id = ?`,
            [alumniMemberId, user.id]
          );

          if (linkResult.affectedRows > 0) {
            console.log(`  ✅ Linked app_users.alumni_member_id = ${alumniMemberId}`);
          }
        }

        // 5. Get current alumni_members state
        const [alumniRows] = await connection.execute(
          `SELECT id, email, first_name, last_name, invitation_sent_at, invitation_accepted_at
           FROM alumni_members
           WHERE id = ?`,
          [alumniMemberId]
        );

        if (alumniRows.length === 0) {
          console.log(`  ❌ Alumni member not found (ID: ${alumniMemberId})`);
          console.log();
          continue;
        }

        const alumni = alumniRows[0];
        console.log(`  ✅ Alumni member found:`, {
          id: alumni.id,
          name: `${alumni.first_name} ${alumni.last_name}`,
          currentSentAt: alumni.invitation_sent_at,
          currentAcceptedAt: alumni.invitation_accepted_at
        });

        // 6. Update alumni_members with timestamps
        const [updateResult] = await connection.execute(
          `UPDATE alumni_members
           SET invitation_sent_at = ?,
               invitation_accepted_at = ?
           WHERE id = ?`,
          [invitationSentAt, invitationAcceptedAt, alumniMemberId]
        );

        if (updateResult.affectedRows > 0) {
          console.log(`  ✅ Updated alumni_members.invitation_sent_at = ${invitationSentAt}`);
          console.log(`  ✅ Updated alumni_members.invitation_accepted_at = ${invitationAcceptedAt}`);
        } else {
          console.log(`  ⚠️  No rows updated (this shouldn't happen)`);
        }

        console.log();
      }

      // Commit transaction
      await connection.commit();
      console.log('='.repeat(80));
      console.log('✅ Migration completed successfully!');
      console.log('='.repeat(80));
      console.log();

      // Verify results
      console.log('VERIFICATION - Current state of alumni_members:');
      console.log('-'.repeat(80));

      for (const email of TARGET_EMAILS) {
        const [verifyRows] = await connection.execute(
          `SELECT am.id, am.email, am.first_name, am.last_name,
                  am.invitation_sent_at, am.invitation_accepted_at,
                  u.created_at as user_created_at
           FROM alumni_members am
           LEFT JOIN app_users u ON am.id = u.alumni_member_id
           WHERE am.email = ?`,
          [email]
        );

        if (verifyRows.length > 0) {
          const row = verifyRows[0];
          console.log(`${row.email}:`);
          console.log(`  Name: ${row.first_name} ${row.last_name}`);
          console.log(`  User Created: ${row.user_created_at}`);
          console.log(`  Invitation Sent: ${row.invitation_sent_at}`);
          console.log(`  Invitation Accepted: ${row.invitation_accepted_at}`);
          console.log();
        }
      }

    } catch (error) {
      // Rollback on error
      await connection.rollback();
      console.error('\n❌ Migration failed! Transaction rolled back.');
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('\n❌ MIGRATION ERROR:');
    console.error(error);
    process.exit(1);
  }
}

// Run migration
backfillTimestamps()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

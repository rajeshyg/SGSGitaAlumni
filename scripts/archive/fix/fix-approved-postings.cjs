/**
 * Migration Script: Fix Approved Postings
 *
 * This script fixes postings that were approved before the status field fix.
 * It synchronizes the 'status' field with 'moderation_status' field.
 */

const mysql = require('mysql2/promise');

async function fixApprovedPostings() {
  const pool = mysql.createPool({
    host: 'sgsbg-app-db.cj88ledblqs8.us-east-1.rds.amazonaws.com',
    user: 'sgsgita_alumni_user',
    password: '2FvT6j06sfI',
    database: 'sgsgita_alumni',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    console.log('🔍 Checking for approved postings with incorrect status...\n');

    // Find postings where moderation_status is APPROVED but status is not 'active'
    const [approvedPostings] = await pool.query(`
      SELECT id, title, moderation_status, status
      FROM POSTINGS
      WHERE moderation_status = 'APPROVED' AND status != 'active'
    `);

    console.log(`Found ${approvedPostings.length} approved posting(s) with incorrect status\n`);

    if (approvedPostings.length === 0) {
      console.log('✅ All approved postings already have correct status\n');
      return;
    }

    let fixedCount = 0;

    for (const posting of approvedPostings) {
      console.log(`📝 Fixing: ${posting.title}`);
      console.log(`   Current: moderation_status='${posting.moderation_status}', status='${posting.status}'`);

      // Update status to 'active'
      await pool.query(`
        UPDATE POSTINGS
        SET status = 'active'
        WHERE id = ?
      `, [posting.id]);

      console.log(`   ✅ Updated: status='active'\n`);
      fixedCount++;
    }

    // Also fix rejected postings
    const [rejectedPostings] = await pool.query(`
      SELECT id, title, moderation_status, status
      FROM POSTINGS
      WHERE moderation_status = 'REJECTED' AND status NOT IN ('rejected', 'deleted')
    `);

    if (rejectedPostings.length > 0) {
      console.log(`\nFound ${rejectedPostings.length} rejected posting(s) with incorrect status\n`);

      for (const posting of rejectedPostings) {
        console.log(`📝 Fixing: ${posting.title}`);
        console.log(`   Current: moderation_status='${posting.moderation_status}', status='${posting.status}'`);

        await pool.query(`
          UPDATE POSTINGS
          SET status = 'rejected'
          WHERE id = ?
        `, [posting.id]);

        console.log(`   ✅ Updated: status='rejected'\n`);
        fixedCount++;
      }
    }

    console.log(`\n✅ Migration complete!`);
    console.log(`   Fixed ${fixedCount} posting(s)`);
    console.log(`   All approved postings should now be visible on /postings page\n`);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
fixApprovedPostings();

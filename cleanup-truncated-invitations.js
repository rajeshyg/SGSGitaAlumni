/**
 * Clean up existing invitations with truncated tokens
 * After running the migration, all old invitations have invalid (truncated) tokens
 * This script will delete them so new invitations can be sent
 */

import db from './config/database.js';

async function cleanupTruncatedInvitations() {
  try {
    console.log('\n🧹 CLEANUP: Remove Invitations with Truncated Tokens\n');
    console.log('=' .repeat(80));

    // Step 1: Count existing invitations
    console.log('📊 Step 1: Checking existing invitations...');
    const [count] = await db.execute('SELECT COUNT(*) as total FROM USER_INVITATIONS');
    console.log(`  Found ${count[0].total} invitations`);

    if (count[0].total === 0) {
      console.log('\n✅ No invitations to clean up');
      process.exit(0);
    }

    // Step 2: Show sample of invitations to be deleted
    console.log('\n📋 Step 2: Sample of invitations to be deleted:');
    const [samples] = await db.execute(`
      SELECT id, email, invitation_type, LENGTH(invitation_token) as token_length, created_at
      FROM USER_INVITATIONS
      LIMIT 5
    `);
    
    samples.forEach(inv => {
      console.log(`  - ${inv.email} (${inv.invitation_type}) - Token length: ${inv.token_length} - Created: ${inv.created_at}`);
    });

    // Step 3: Delete all invitations
    console.log('\n🗑️  Step 3: Deleting all invitations...');
    const [result] = await db.execute('DELETE FROM USER_INVITATIONS');
    console.log(`  ✅ Deleted ${result.affectedRows} invitations`);

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Go to the Admin Panel');
    console.log('  2. Navigate to the Members tab');
    console.log('  3. Send new invitations to the members');
    console.log('  4. The new invitations will have proper full-length HMAC tokens');

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

cleanupTruncatedInvitations();

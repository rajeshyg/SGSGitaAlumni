/**
 * Migration: Increase invitation_token column size to accommodate HMAC tokens
 * HMAC tokens are typically 300-400 characters (base64url encoded)
 * Current size: VARCHAR(255) - causing truncation
 * New size: VARCHAR(500) - sufficient for HMAC tokens with room to grow
 */

import db from './config/database.js';

async function migrateInvitationTokenColumn() {
  try {
    console.log('\n🔧 MIGRATION: Increase invitation_token Column Size\n');
    console.log('=' .repeat(80));

    // Step 1: Check current column size
    console.log('📋 Step 1: Checking current column definition...');
    const [columns] = await db.execute(`
      SHOW COLUMNS FROM USER_INVITATIONS WHERE Field = 'invitation_token'
    `);
    
    console.log('  Current type:', columns[0].Type);

    // Step 2: Alter the column
    console.log('\n🔨 Step 2: Altering column to VARCHAR(500)...');
    await db.execute(`
      ALTER TABLE USER_INVITATIONS
      MODIFY COLUMN invitation_token VARCHAR(500) NOT NULL
    `);
    
    console.log('  ✅ Column altered successfully');

    // Step 3: Verify the change
    console.log('\n✅ Step 3: Verifying the change...');
    const [newColumns] = await db.execute(`
      SHOW COLUMNS FROM USER_INVITATIONS WHERE Field = 'invitation_token'
    `);
    
    console.log('  New type:', newColumns[0].Type);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n⚠️  IMPORTANT: You should now:');
    console.log('  1. Delete all existing invitations (they have truncated tokens)');
    console.log('  2. Send new invitations with the correct token format');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migrateInvitationTokenColumn();

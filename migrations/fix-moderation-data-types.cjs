/**
 * CRITICAL MIGRATION: Fix Moderation Schema Data Type Mismatches
 * 
 * ROOT CAUSE: 
 * - POSTINGS.moderated_by is char(36) but should be bigint to match app_users.id
 * - MODERATION_HISTORY.moderator_id is char(36) but should be bigint
 * - Foreign key constraints cannot be created due to type mismatch
 * 
 * FIXES:
 * 1. Convert moderated_by from char(36) to bigint
 * 2. Convert MODERATION_HISTORY.moderator_id from char(36) to bigint
 * 3. Add proper foreign key constraints
 * 4. Clean up duplicate moderation status fields
 * 
 * Date: November 4, 2025
 */

require('dotenv').config();

async function up() {
  const { getPool } = await import('../utils/database.js');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('🔧 Starting CRITICAL moderation schema fix...\n');
    
    // ===== STEP 1: Check for existing data =====
    console.log('STEP 1: Checking for existing moderation data...');
    const [moderatedPostings] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM POSTINGS 
      WHERE moderated_by IS NOT NULL
    `);
    const [historyRecords] = await connection.query(`
      SELECT COUNT(*) as count 
      FROM MODERATION_HISTORY
    `);
    
    console.log(`  - Postings with moderated_by: ${moderatedPostings[0].count}`);
    console.log(`  - Moderation history records: ${historyRecords[0].count}`);
    
    if (moderatedPostings[0].count > 0 || historyRecords[0].count > 0) {
      console.log('  ⚠️  WARNING: Existing moderation data found!');
      console.log('  ⚠️  This data will be CLEARED because it uses incompatible UUID format.');
      console.log('  ⚠️  Press Ctrl+C now to abort, or wait 5 seconds to continue...\n');
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log('  ✓ No existing moderation data, safe to proceed\n');
    }
    
    // ===== STEP 2: Drop existing indexes on columns we're changing =====
    console.log('STEP 2: Dropping indexes on columns to be modified...');
    
    // Drop index on moderated_by
    await connection.query(`DROP INDEX IF EXISTS idx_postings_moderated_by ON POSTINGS`)
      .catch(err => console.log('  - idx_postings_moderated_by already dropped or doesn\'t exist'));
    
    // Drop indexes on MODERATION_HISTORY
    await connection.query(`DROP INDEX IF EXISTS idx_moderation_history_moderator ON MODERATION_HISTORY`)
      .catch(err => console.log('  - idx_moderation_history_moderator already dropped or doesn\'t exist'));
    
    console.log('  ✓ Indexes dropped\n');
    
    // ===== STEP 3: Clear invalid data =====
    console.log('STEP 3: Clearing invalid moderation data...');
    
    await connection.query(`
      UPDATE POSTINGS 
      SET moderated_by = NULL, 
          moderated_at = NULL,
          moderator_notes = NULL,
          moderator_feedback = NULL
      WHERE moderated_by IS NOT NULL
    `);
    console.log('  ✓ Cleared POSTINGS.moderated_by data');
    
    await connection.query(`TRUNCATE TABLE MODERATION_HISTORY`);
    console.log('  ✓ Cleared MODERATION_HISTORY table\n');
    
    // ===== STEP 4: Alter POSTINGS.moderated_by to bigint =====
    console.log('STEP 4: Converting POSTINGS.moderated_by to bigint...');
    
    await connection.query(`
      ALTER TABLE POSTINGS 
      MODIFY COLUMN moderated_by BIGINT DEFAULT NULL
    `);
    console.log('  ✓ POSTINGS.moderated_by → bigint\n');
    
    // ===== STEP 5: Alter MODERATION_HISTORY.moderator_id to bigint =====
    console.log('STEP 5: Converting MODERATION_HISTORY.moderator_id to bigint...');
    
    await connection.query(`
      ALTER TABLE MODERATION_HISTORY 
      MODIFY COLUMN moderator_id BIGINT NOT NULL
    `);
    console.log('  ✓ MODERATION_HISTORY.moderator_id → bigint\n');
    
    // ===== STEP 6: Add foreign key constraints =====
    console.log('STEP 6: Adding foreign key constraints...');
    
    // FK: POSTINGS.moderated_by → app_users.id
    await connection.query(`
      ALTER TABLE POSTINGS
      ADD CONSTRAINT fk_postings_moderated_by 
      FOREIGN KEY (moderated_by) REFERENCES app_users(id) 
      ON DELETE SET NULL
    `).catch(err => {
      if (err.code === 'ER_FK_DUP_NAME') {
        console.log('  - fk_postings_moderated_by already exists, dropping and recreating...');
        return connection.query(`ALTER TABLE POSTINGS DROP FOREIGN KEY fk_postings_moderated_by`)
          .then(() => connection.query(`
            ALTER TABLE POSTINGS
            ADD CONSTRAINT fk_postings_moderated_by 
            FOREIGN KEY (moderated_by) REFERENCES app_users(id) 
            ON DELETE SET NULL
          `));
      }
      throw err;
    });
    console.log('  ✓ FK: POSTINGS.moderated_by → app_users.id');
    
    // FK: MODERATION_HISTORY.posting_id → POSTINGS.id
    await connection.query(`
      ALTER TABLE MODERATION_HISTORY
      ADD CONSTRAINT fk_moderation_history_posting
      FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) 
      ON DELETE CASCADE
    `).catch(err => {
      if (err.code === 'ER_FK_DUP_NAME') {
        console.log('  - fk_moderation_history_posting already exists');
        return;
      }
      throw err;
    });
    console.log('  ✓ FK: MODERATION_HISTORY.posting_id → POSTINGS.id');
    
    // FK: MODERATION_HISTORY.moderator_id → app_users.id
    await connection.query(`
      ALTER TABLE MODERATION_HISTORY
      ADD CONSTRAINT fk_moderation_history_moderator
      FOREIGN KEY (moderator_id) REFERENCES app_users(id) 
      ON DELETE CASCADE
    `).catch(err => {
      if (err.code === 'ER_FK_DUP_NAME') {
        console.log('  - fk_moderation_history_moderator already exists, dropping and recreating...');
        return connection.query(`ALTER TABLE MODERATION_HISTORY DROP FOREIGN KEY fk_moderation_history_moderator`)
          .then(() => connection.query(`
            ALTER TABLE MODERATION_HISTORY
            ADD CONSTRAINT fk_moderation_history_moderator
            FOREIGN KEY (moderator_id) REFERENCES app_users(id) 
            ON DELETE CASCADE
          `));
      }
      throw err;
    });
    console.log('  ✓ FK: MODERATION_HISTORY.moderator_id → app_users.id\n');
    
    // ===== STEP 7: Recreate indexes =====
    console.log('STEP 7: Recreating indexes with correct data types...');
    
    await connection.query(`
      CREATE INDEX idx_postings_moderated_by 
      ON POSTINGS(moderated_by, moderated_at DESC)
    `).catch(err => {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('  - idx_postings_moderated_by already exists');
        return;
      }
      throw err;
    });
    console.log('  ✓ Index: POSTINGS(moderated_by, moderated_at)');
    
    await connection.query(`
      CREATE INDEX idx_moderation_history_moderator 
      ON MODERATION_HISTORY(moderator_id, created_at DESC)
    `).catch(err => {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('  - idx_moderation_history_moderator already exists');
        return;
      }
      throw err;
    });
    console.log('  ✓ Index: MODERATION_HISTORY(moderator_id, created_at)\n');
    
    // ===== STEP 8: Verify the fix =====
    console.log('STEP 8: Verifying schema corrections...');
    
    const postingsSchemaResult = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND TABLE_NAME = 'POSTINGS'
      AND COLUMN_NAME = 'moderated_by'
    `);
    
    const historySchemaResult = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND TABLE_NAME = 'MODERATION_HISTORY'
      AND COLUMN_NAME = 'moderator_id'
    `);
    
    const postingsSchema = postingsSchemaResult[0][0];
    const historySchema = historySchemaResult[0][0];
    
    console.log(`  - POSTINGS.moderated_by: ${postingsSchema.COLUMN_TYPE}`);
    console.log(`  - MODERATION_HISTORY.moderator_id: ${historySchema.COLUMN_TYPE}`);
    
    if (postingsSchema.COLUMN_TYPE === 'bigint' && historySchema.COLUMN_TYPE === 'bigint') {
      console.log('  ✅ Schema verification PASSED\n');
    } else {
      throw new Error('Schema verification FAILED - types are still incorrect!');
    }
    
    // ===== SUMMARY =====
    console.log('═'.repeat(80));
    console.log('✅ MIGRATION COMPLETED SUCCESSFULLY!\n');
    console.log('Changes applied:');
    console.log('  1. ✓ POSTINGS.moderated_by: char(36) → bigint');
    console.log('  2. ✓ MODERATION_HISTORY.moderator_id: char(36) → bigint');
    console.log('  3. ✓ Foreign key: POSTINGS.moderated_by → app_users.id');
    console.log('  4. ✓ Foreign key: MODERATION_HISTORY.posting_id → POSTINGS.id');
    console.log('  5. ✓ Foreign key: MODERATION_HISTORY.moderator_id → app_users.id');
    console.log('  6. ✓ Indexes recreated with correct types');
    console.log('\n🎯 The moderation system now has proper referential integrity!');
    console.log('📝 Next step: Update the API code to use integer user IDs');
    console.log('═'.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    connection.release();
  }
}

async function down() {
  const { getPool } = await import('../utils/database.js');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('Rolling back moderation schema fixes...\n');
    
    // Drop foreign keys
    await connection.query(`ALTER TABLE POSTINGS DROP FOREIGN KEY IF EXISTS fk_postings_moderated_by`);
    await connection.query(`ALTER TABLE MODERATION_HISTORY DROP FOREIGN KEY IF EXISTS fk_moderation_history_posting`);
    await connection.query(`ALTER TABLE MODERATION_HISTORY DROP FOREIGN KEY IF EXISTS fk_moderation_history_moderator`);
    console.log('✓ Foreign keys dropped');
    
    // Drop indexes
    await connection.query(`DROP INDEX IF EXISTS idx_postings_moderated_by ON POSTINGS`);
    await connection.query(`DROP INDEX IF EXISTS idx_moderation_history_moderator ON MODERATION_HISTORY`);
    console.log('✓ Indexes dropped');
    
    // Revert column types (will clear data)
    await connection.query(`
      ALTER TABLE POSTINGS 
      MODIFY COLUMN moderated_by CHAR(36) DEFAULT NULL
    `);
    console.log('✓ POSTINGS.moderated_by → char(36)');
    
    await connection.query(`
      ALTER TABLE MODERATION_HISTORY 
      MODIFY COLUMN moderator_id CHAR(36) NOT NULL
    `);
    console.log('✓ MODERATION_HISTORY.moderator_id → char(36)');
    
    console.log('\n✅ Rollback completed');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// Run migration if executed directly
if (require.main === module) {
  up()
    .then(() => {
      console.log('\nMigration completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\nMigration failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };

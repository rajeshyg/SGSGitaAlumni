/* Copied from add-moderation-schema.js but saved as .cjs so Node treats it as CommonJS under "type": "module" projects */
// Load environment variables so utils/database can initialize
require('dotenv').config();

/**
 * Migration: Add Moderation Schema
 * 
 * This migration adds the moderation system to the database:
 * 1. Adds moderation columns to POSTINGS table
 * 2. Creates MODERATION_HISTORY table for audit trail
 * 3. Creates indexes for performance
 * 
 * Date: November 3, 2025
 * Task: Action 8 - Moderator Review System
 */

async function up() {
  const { getPool } = await import('../utils/database.js');
  const pool = getPool();
  const connection = await pool.getConnection();
  
  try {
    console.log('Starting moderation schema migration...');
    
    // 1. Add moderation columns to POSTINGS table
    console.log('Adding moderation columns to POSTINGS table...');
    // Add columns individually to avoid SQL syntax differences across MySQL versions
    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN moderation_status VARCHAR(20) DEFAULT 'PENDING'`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column moderation_status already exists, skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN moderated_by CHAR(36) DEFAULT NULL`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column moderated_by already exists, skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN moderated_at TIMESTAMP DEFAULT NULL`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column moderated_at already exists, skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN rejection_reason VARCHAR(50) DEFAULT NULL`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column rejection_reason already exists, skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN moderator_feedback TEXT DEFAULT NULL`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column moderator_feedback already exists, skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN moderator_notes TEXT DEFAULT NULL`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column moderator_notes already exists, skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE POSTINGS ADD COLUMN version INT DEFAULT 1`).catch(err => {
      if (err && (err.message.includes('Duplicate') || err.message.includes('exists') || err.code === 'ER_DUP_FIELDNAME')) {
        console.log('Column version already exists, skipping...');
      } else {
        throw err;
      }
    });

    console.log('✓ Moderation columns added to POSTINGS table (or already present)');
    
    // 2. Add foreign key constraint for moderated_by
    console.log('Adding foreign key constraint for moderated_by...');
    await connection.query(`
      ALTER TABLE POSTINGS
      ADD CONSTRAINT fk_postings_moderated_by 
      FOREIGN KEY (moderated_by) REFERENCES app_users(id) 
      ON DELETE SET NULL
    `).catch(err => {
      // Some MySQL setups will error if the column types are not compatible or FK already exists
      if (err && (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_FK_INCOMPATIBLE_COLUMNS')) {
        console.log('Foreign key not added (already exists or incompatible types), skipping...');
      } else {
        throw err;
      }
    });
    console.log('✓ Foreign key constraint added (or skipped)');
    
    // 3. Create MODERATION_HISTORY table (create columns first, add FK constraints separately)
    console.log('Creating MODERATION_HISTORY table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS MODERATION_HISTORY (
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        posting_id CHAR(36) NOT NULL,
        moderator_id CHAR(36) NOT NULL,
        action VARCHAR(20) NOT NULL,
        reason VARCHAR(50) DEFAULT NULL,
        feedback_to_user TEXT DEFAULT NULL,
        moderator_notes TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Try to add foreign key constraints; be tolerant if types are incompatible or constraints already exist
    await connection.query(`ALTER TABLE MODERATION_HISTORY
      ADD CONSTRAINT fk_moderation_history_posting
      FOREIGN KEY (posting_id) REFERENCES POSTINGS(id) ON DELETE CASCADE
    `).catch(err => {
      if (err && (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_FK_INCOMPATIBLE_COLUMNS')) {
        console.log('Foreign key fk_moderation_history_posting not added (exists or incompatible), skipping...');
      } else {
        throw err;
      }
    });

    await connection.query(`ALTER TABLE MODERATION_HISTORY
      ADD CONSTRAINT fk_moderation_history_moderator
      FOREIGN KEY (moderator_id) REFERENCES app_users(id) ON DELETE CASCADE
    `).catch(err => {
      if (err && (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_FK_DUP_NAME' || err.code === 'ER_FK_INCOMPATIBLE_COLUMNS')) {
        console.log('Foreign key fk_moderation_history_moderator not added (exists or incompatible), skipping...');
      } else {
        throw err;
      }
    });

    console.log('✓ MODERATION_HISTORY table created (constraints added or skipped)');
    
    // 4. Create indexes for performance
    console.log('Creating indexes for moderation queries...');
    
    // Index for moderation queue queries (status + created_at)
    await connection.query(`CREATE INDEX idx_postings_moderation_status ON POSTINGS(moderation_status, created_at)`).catch(err => {
      if (err && (err.code === 'ER_DUP_KEYNAME' || (err.message && err.message.includes('exists')))) {
        console.log('Index idx_postings_moderation_status already exists, skipping...');
      } else {
        throw err;
      }
    });

    // Index for moderation history by posting
    await connection.query(`CREATE INDEX idx_moderation_history_posting ON MODERATION_HISTORY(posting_id, created_at DESC)`).catch(err => {
      if (err && (err.code === 'ER_DUP_KEYNAME' || (err.message && err.message.includes('exists')))) {
        console.log('Index idx_moderation_history_posting already exists, skipping...');
      } else {
        throw err;
      }
    });

    // Index for moderation history by moderator
    await connection.query(`CREATE INDEX idx_moderation_history_moderator ON MODERATION_HISTORY(moderator_id, created_at DESC)`).catch(err => {
      if (err && (err.code === 'ER_DUP_KEYNAME' || (err.message && err.message.includes('exists')))) {
        console.log('Index idx_moderation_history_moderator already exists, skipping...');
      } else {
        throw err;
      }
    });

    // Index for finding postings by moderator
    await connection.query(`CREATE INDEX idx_postings_moderated_by ON POSTINGS(moderated_by, moderated_at DESC)`).catch(err => {
      if (err && (err.code === 'ER_DUP_KEYNAME' || (err.message && err.message.includes('exists')))) {
        console.log('Index idx_postings_moderated_by already exists, skipping...');
      } else {
        throw err;
      }
    });
    
    console.log('✓ All indexes created');
    
    // 5. Update existing postings to have default moderation_status
    console.log('Updating existing postings...');
    const [updateResult] = await connection.query(`
      UPDATE POSTINGS 
      SET moderation_status = 'PENDING', 
          version = 1 
      WHERE moderation_status IS NULL
    `);
    console.log(`✓ Updated ${updateResult.affectedRows} existing postings`);
    
    console.log('\n✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log('- POSTINGS table: Added 7 moderation columns');
    console.log('- MODERATION_HISTORY table: Created with audit trail');
    console.log('- Indexes: Created 4 indexes for performance');
    console.log(`- Existing postings: Updated ${updateResult.affectedRows} records`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
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
    console.log('Rolling back moderation schema migration...');
    
    // Drop indexes
    await connection.query('DROP INDEX IF EXISTS idx_postings_moderation_status ON POSTINGS');
    await connection.query('DROP INDEX IF EXISTS idx_postings_moderated_by ON POSTINGS');
    await connection.query('DROP INDEX IF EXISTS idx_moderation_history_posting ON MODERATION_HISTORY');
    await connection.query('DROP INDEX IF EXISTS idx_moderation_history_moderator ON MODERATION_HISTORY');
    
    // Drop MODERATION_HISTORY table
    await connection.query('DROP TABLE IF EXISTS MODERATION_HISTORY');
    
    // Remove foreign key constraint
    await connection.query('ALTER TABLE POSTINGS DROP FOREIGN KEY IF EXISTS fk_postings_moderated_by');
    
    // Remove moderation columns from POSTINGS
    await connection.query(`
      ALTER TABLE POSTINGS 
      DROP COLUMN IF EXISTS moderation_status,
      DROP COLUMN IF EXISTS moderated_by,
      DROP COLUMN IF EXISTS moderated_at,
      DROP COLUMN IF EXISTS rejection_reason,
      DROP COLUMN IF EXISTS moderator_feedback,
      DROP COLUMN IF EXISTS moderator_notes,
      DROP COLUMN IF EXISTS version
    `);
    
    console.log('✓ Rollback completed successfully');
    
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
      console.log('Migration completed, exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { up, down };

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from '../utils/database.js';

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function fixModerationColumns() {
  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    console.log('Starting moderation schema fix (Types + Collation)...');

    // 1. Find and Drop existing Foreign Keys dynamically
    console.log('Finding foreign keys...');
    
    const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('POSTINGS', 'MODERATION_HISTORY') 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    console.log(`Found ${constraints.length} foreign keys.`);

    for (const constraint of constraints) {
      console.log(`Checking constraint: ${constraint.CONSTRAINT_NAME} on ${constraint.TABLE_NAME}.${constraint.COLUMN_NAME}`);
      
      const isRelevant = 
        constraint.COLUMN_NAME === 'moderated_by' || 
        constraint.COLUMN_NAME === 'moderator_id' || 
        constraint.COLUMN_NAME === 'posting_id';

      if (isRelevant) {
        console.log(`Dropping FK ${constraint.CONSTRAINT_NAME} from ${constraint.TABLE_NAME}...`);
        try {
          await connection.query(`ALTER TABLE ${constraint.TABLE_NAME} DROP FOREIGN KEY ${constraint.CONSTRAINT_NAME}`);
          console.log(`✓ Dropped ${constraint.CONSTRAINT_NAME}`);
        } catch (e) {
          console.error(`Failed to drop ${constraint.CONSTRAINT_NAME}:`, e.message);
        }
      }
    }

    // 2. Standardize Collation to utf8mb4_0900_ai_ci
    console.log('Standardizing collation to utf8mb4_0900_ai_ci...');
    await connection.query('ALTER TABLE POSTINGS CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    console.log('Converted POSTINGS to utf8mb4_0900_ai_ci');

    await connection.query('ALTER TABLE MODERATION_HISTORY CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci');
    console.log('Converted MODERATION_HISTORY to utf8mb4_0900_ai_ci');

    // 3. Modify Columns to CHAR(36) (UUID)
    console.log('Modifying columns to CHAR(36)...');
    
    await connection.query('ALTER TABLE POSTINGS MODIFY COLUMN moderated_by CHAR(36) DEFAULT NULL');
    console.log('Modified POSTINGS.moderated_by to CHAR(36)');

    await connection.query('ALTER TABLE MODERATION_HISTORY MODIFY COLUMN moderator_id CHAR(36) NOT NULL');
    console.log('Modified MODERATION_HISTORY.moderator_id to CHAR(36)');

    // 4. Clean up invalid data (orphaned references from type conversion)
    console.log('Cleaning up invalid data...');
    await connection.query('TRUNCATE TABLE MODERATION_HISTORY');
    console.log('Cleared MODERATION_HISTORY');
    
    await connection.query('UPDATE POSTINGS SET moderated_by = NULL');
    console.log('Cleared POSTINGS.moderated_by references');

    // 5. Re-add Foreign Keys
    console.log('Re-adding foreign keys...');
    
    await connection.query(`
      ALTER TABLE POSTINGS
      ADD CONSTRAINT fk_postings_moderated_by
      FOREIGN KEY (moderated_by) REFERENCES accounts(id)
      ON DELETE SET NULL
    `);
    console.log('Added fk_postings_moderated_by -> accounts(id)');

    await connection.query(`
      ALTER TABLE MODERATION_HISTORY
      ADD CONSTRAINT fk_moderation_history_moderator
      FOREIGN KEY (moderator_id) REFERENCES accounts(id)
      ON DELETE CASCADE
    `);
    console.log('Added fk_moderation_history_moderator -> accounts(id)');

    await connection.query(`
      ALTER TABLE MODERATION_HISTORY
      ADD CONSTRAINT fk_moderation_history_posting
      FOREIGN KEY (posting_id) REFERENCES POSTINGS(id)
      ON DELETE CASCADE
    `);
    console.log('Added fk_moderation_history_posting -> POSTINGS(id)');

    console.log('✅ Fix completed successfully!');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    connection.release();
    process.exit();
  }
}

fixModerationColumns();

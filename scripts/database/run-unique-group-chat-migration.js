/**
 * Migration Runner: Add Unique Group Chat Constraint
 * Date: November 10, 2025
 * 
 * This migration prevents duplicate GROUP conversations for the same posting
 */

import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runMigration() {
  console.log('🚀 Starting migration: Add Unique Group Chat Constraint');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('✅ Connected to database');

    // Check for duplicate GROUP conversations before adding constraint
    console.log('\n📊 Checking for duplicate GROUP conversations...');
    const [duplicates] = await connection.execute(`
      SELECT posting_id, type, COUNT(*) as count
      FROM CONVERSATIONS
      WHERE posting_id IS NOT NULL
      GROUP BY posting_id, type
      HAVING count > 1
    `);

    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} posting+type combinations with duplicates:`);
      duplicates.forEach(dup => {
        console.log(`   - Posting ${dup.posting_id}, Type ${dup.type}: ${dup.count} conversations`);
      });

      console.log('\n🔧 Cleaning up duplicates (keeping oldest conversation)...');
      
      for (const dup of duplicates) {
        // Get all conversations for this posting+type combination
        const [conversations] = await connection.execute(`
          SELECT id, created_at, is_archived
          FROM CONVERSATIONS
          WHERE posting_id = ? AND type = ?
          ORDER BY created_at ASC
        `, [dup.posting_id, dup.type]);

        console.log(`\n   Posting ${dup.posting_id}, Type ${dup.type}:`);
        console.log(`   Keeping: ${conversations[0].id} (created: ${conversations[0].created_at})`);
        
        // Archive all except the first (oldest) one
        for (let i = 1; i < conversations.length; i++) {
          const conv = conversations[i];
          console.log(`   Archiving duplicate: ${conv.id} (created: ${conv.created_at})`);
          await connection.execute(`
            UPDATE CONVERSATIONS 
            SET is_archived = TRUE, archived_at = NOW()
            WHERE id = ?
          `, [conv.id]);
        }
      }
      
      console.log('\n✅ Duplicate cleanup completed');
    } else {
      console.log('✅ No duplicate conversations found');
    }

    // Read migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrations', 'add-unique-group-chat-constraint.sql'),
      'utf8'
    );

    // Check if MySQL supports partial indexes
    const [variables] = await connection.execute("SELECT @@version as version");
    const mysqlVersion = variables[0].version;
    console.log(`\n📌 MySQL Version: ${mysqlVersion}`);

    // Drop existing index if it exists (from failed previous attempt)
    console.log('\n🔧 Checking for existing index...');
    try {
      await connection.execute(`DROP INDEX idx_unique_posting_group ON CONVERSATIONS`);
      console.log('✅ Dropped existing index');
    } catch (err) {
      if (err.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('ℹ️  No existing index to drop');
      } else {
        console.log('⚠️  Error dropping index:', err.message);
      }
    }

    // MySQL doesn't support partial indexes (WHERE clause) natively
    // Use the alternative approach without WHERE clause
    console.log('\n🔨 Adding unique constraint on (posting_id, type)...');
    
    // First check if any duplicates still exist
    const [stillDuplicates] = await connection.execute(`
      SELECT posting_id, type, COUNT(*) as count
      FROM CONVERSATIONS
      WHERE posting_id IS NOT NULL AND is_archived = FALSE
      GROUP BY posting_id, type
      HAVING count > 1
    `);

    if (stillDuplicates.length > 0) {
      console.log('⚠️  WARNING: Still found duplicates after cleanup:');
      for (const dup of stillDuplicates) {
        console.log(`   - Posting ${dup.posting_id}, Type ${dup.type}: ${dup.count} active conversations`);
        
        // Show details
        const [details] = await connection.execute(`
          SELECT id, created_at, is_archived
          FROM CONVERSATIONS
          WHERE posting_id = ? AND type = ? AND is_archived = FALSE
          ORDER BY created_at ASC
        `, [dup.posting_id, dup.type]);
        
        details.forEach((d, i) => {
          console.log(`     ${i + 1}. ${d.id} (created: ${d.created_at}, archived: ${d.is_archived})`);
        });
      }
      
      console.log('\n❌ Cannot add constraint with active duplicates. Please investigate.');
      process.exit(1);
    }
    
    try {
      // Strategy: Create a unique index that only applies to non-archived conversations
      // MySQL 8.0+ supports functional indexes
      // For archived conversations, we use NULL which is excluded from unique constraint
      await connection.execute(`
        CREATE UNIQUE INDEX idx_unique_active_posting_type 
        ON CONVERSATIONS ((CASE WHEN is_archived = FALSE THEN CONCAT(posting_id, '-', type) ELSE NULL END))
      `);
      console.log('✅ Unique functional index created successfully');
      console.log('   Enforces uniqueness on (posting_id, type) only for active conversations');
    } catch (err) {
      if (err.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Index already exists - skipping');
      } else {
        throw err;
      }
    }

    // Verify the constraint
    console.log('\n🔍 Verifying constraint...');
    const [indexes] = await connection.execute(`
      SHOW INDEX FROM CONVERSATIONS WHERE Key_name = 'idx_unique_active_posting_type'
    `);
    
    if (indexes.length > 0) {
      console.log('✅ Constraint verification successful');
      console.log('   Index columns:', indexes.map(i => i.Column_name).join(', '));
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('   - Cleaned up duplicate GROUP conversations (if any)');
    console.log('   - Added UNIQUE index on (posting_id, type)');
    console.log('   - System now prevents duplicate group chats per posting');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

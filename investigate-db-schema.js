/**
 * Database Schema Investigation
 * Examines the POSTINGS and MODERATION_HISTORY tables
 */

import dotenv from 'dotenv';
dotenv.config();

import { getPool } from './utils/database.js';

const pool = getPool();

async function investigateSchema() {
  const connection = await pool.getConnection();
  
  try {
    console.log('=== DATABASE SCHEMA INVESTIGATION ===\n');
    
    // 1. POSTINGS table structure
    console.log('1. POSTINGS Table Structure:');
    console.log('─'.repeat(80));
    const postingsColumns = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA,
        COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND TABLE_NAME = 'POSTINGS'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(postingsColumns[0]);
    
    // 2. MODERATION_HISTORY table structure
    console.log('\n2. MODERATION_HISTORY Table Structure:');
    console.log('─'.repeat(80));
    const moderationColumns = await connection.query(`
      SELECT 
        COLUMN_NAME,
        COLUMN_TYPE,
        IS_NULLABLE,
        COLUMN_KEY,
        COLUMN_DEFAULT,
        EXTRA,
        COLLATION_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND TABLE_NAME = 'MODERATION_HISTORY'
      ORDER BY ORDINAL_POSITION
    `);
    console.table(moderationColumns[0]);
    
    // 3. Check foreign keys
    console.log('\n3. Foreign Key Constraints:');
    console.log('─'.repeat(80));
    const fkConstraints = await connection.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND (TABLE_NAME = 'POSTINGS' OR TABLE_NAME = 'MODERATION_HISTORY')
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.table(fkConstraints[0]);
    
    // 4. Check indexes
    console.log('\n4. Indexes:');
    console.log('─'.repeat(80));
    const indexes = await connection.query(`
      SELECT 
        TABLE_NAME,
        INDEX_NAME,
        COLUMN_NAME,
        SEQ_IN_INDEX,
        NON_UNIQUE
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND (TABLE_NAME = 'POSTINGS' OR TABLE_NAME = 'MODERATION_HISTORY')
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);
    console.table(indexes[0]);
    
    // 5. Check related tables
    console.log('\n5. Related Tables (POSTING_DOMAINS, DOMAINS):');
    console.log('─'.repeat(80));
    const relatedTables = await connection.query(`
      SELECT TABLE_NAME, TABLE_COLLATION
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND TABLE_NAME IN ('POSTING_DOMAINS', 'DOMAINS', 'app_users')
    `);
    console.table(relatedTables[0]);
    
    // 6. Sample data check
    console.log('\n6. Sample Posting Data:');
    console.log('─'.repeat(80));
    const [samplePostings] = await connection.query(`
      SELECT 
        id,
        title,
        posting_type,
        moderation_status,
        author_id,
        created_at
      FROM POSTINGS
      LIMIT 5
    `);
    console.table(samplePostings);
    
    // 7. Moderation status distribution
    console.log('\n7. Moderation Status Distribution:');
    console.log('─'.repeat(80));
    const [statusDist] = await connection.query(`
      SELECT 
        moderation_status,
        COUNT(*) as count
      FROM POSTINGS
      GROUP BY moderation_status
    `);
    console.table(statusDist);
    
    // 8. Test the problematic JOIN query
    console.log('\n8. Testing JOIN Query (First 3 results):');
    console.log('─'.repeat(80));
    try {
      const [joinTest] = await connection.query(`
        SELECT 
          p.id,
          p.title,
          p.moderation_status,
          (SELECT COUNT(*) 
           FROM MODERATION_HISTORY mh 
           WHERE mh.posting_id = p.id) as moderation_count
        FROM POSTINGS p
        WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
        LIMIT 3
      `);
      console.table(joinTest);
      console.log('✓ JOIN query executed successfully');
    } catch (error) {
      console.error('✗ JOIN query failed:', error.message);
    }
    
    // 9. Check for collation mismatches
    console.log('\n9. Collation Analysis:');
    console.log('─'.repeat(80));
    const collationCheck = await connection.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        COLLATION_NAME,
        CHARACTER_SET_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = 'sgs_alumni_portal'
      AND TABLE_NAME IN ('POSTINGS', 'MODERATION_HISTORY', 'POSTING_DOMAINS', 'DOMAINS')
      AND COLLATION_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    console.table(collationCheck[0]);
    
  } catch (error) {
    console.error('Investigation failed:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

investigateSchema();

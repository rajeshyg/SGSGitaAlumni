/**
 * Fix collation mismatch for posting-related tables (comprehensive)
 * 
 * This script handles foreign key constraints properly by:
 * 1. Disabling foreign key checks temporarily
 * 2. Altering all related tables to consistent collation
 * 3. Re-enabling foreign key checks
 * 
 * Run: node scripts/debug/fix-posting-collations-v2.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixPostingCollationsV2() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  console.log('Connected to database\n');

  const tablesToFix = [
    'POSTING_DOMAINS',
    'POSTING_TAGS',
    'DOMAINS',
    'TAGS',
    'TAG_DOMAIN_MAPPINGS'  // May also need to be fixed if it exists
  ];

  const targetCollation = 'utf8mb4_0900_ai_ci';

  try {
    // Check which tables exist
    console.log('=== CHECKING TABLES ===');
    const [existingTables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${tablesToFix.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...tablesToFix]);
    
    const existingTableNames = existingTables.map(t => t.TABLE_NAME);
    console.log('Tables to fix:', existingTableNames.join(', '));

    // Check current collations
    console.log('\n=== BEFORE: Table Collations ===');
    const [beforeInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${existingTableNames.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...existingTableNames]);
    
    for (const table of beforeInfo) {
      const status = table.TABLE_COLLATION === targetCollation ? '✅' : '⚠️';
      console.log(`${status} ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    }

    // Disable foreign key checks
    console.log('\n=== DISABLING FOREIGN KEY CHECKS ===');
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('✅ Foreign key checks disabled');

    // Fix collations
    console.log('\n=== FIXING COLLATIONS ===');
    for (const table of existingTableNames) {
      try {
        console.log(`Altering ${table}...`);
        await pool.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE ${targetCollation}`);
        console.log(`✅ ${table} converted to ${targetCollation}`);
      } catch (error) {
        console.error(`❌ Error fixing ${table}: ${error.message}`);
      }
    }

    // Re-enable foreign key checks
    console.log('\n=== RE-ENABLING FOREIGN KEY CHECKS ===');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Foreign key checks re-enabled');

    // Verify changes
    console.log('\n=== AFTER: Table Collations ===');
    const [afterInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${existingTableNames.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...existingTableNames]);
    
    for (const table of afterInfo) {
      const status = table.TABLE_COLLATION === targetCollation ? '✅' : '❌';
      console.log(`${status} ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    }

    // Test the query that was failing
    console.log('\n=== TESTING GET /api/postings QUERY ===');
    const query = `
      SELECT DISTINCT
        p.id,
        p.author_id,
        p.title,
        p.status,
        pc.name as category_name,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', d.id, 'name', d.name, 'icon', d.icon, 'color_code', d.color_code)
          )
          FROM POSTING_DOMAINS pd
          JOIN DOMAINS d ON pd.domain_id = d.id
          WHERE pd.posting_id = p.id
        ) as domains,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', t.id, 'name', t.name, 'tag_type', t.tag_type)
          )
          FROM POSTING_TAGS pt
          JOIN TAGS t ON pt.tag_id = t.id
          WHERE pt.posting_id = p.id
        ) as tags
      FROM POSTINGS p
      LEFT JOIN user_profiles up ON p.author_id = up.id
      LEFT JOIN accounts a ON up.account_id = a.id
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
      LIMIT 5
    `;

    const [testResults] = await pool.query(query);
    console.log(`✅ Query executed successfully! Found ${testResults.length} postings.`);

    if (testResults.length > 0) {
      console.log('Sample posting:', JSON.stringify(testResults[0], null, 2));
    }

    console.log('\n✅ MIGRATION COMPLETE - GET /api/postings should now work!');

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL message:', error.sqlMessage);
    
    // Make sure to re-enable foreign key checks even on error
    try {
      await pool.query('SET FOREIGN_KEY_CHECKS = 1');
      console.log('\n✅ Foreign key checks re-enabled after error');
    } catch (e) {
      console.error('Failed to re-enable foreign key checks');
    }
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

fixPostingCollationsV2();

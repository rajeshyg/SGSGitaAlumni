/**
 * Fix collation mismatch for posting-related tables
 * 
 * Issue: GET /api/postings returns 500 error due to collation mismatch
 * between POSTINGS table (utf8mb4_0900_ai_ci) and POSTING_CATEGORIES,
 * POSTING_DOMAINS, POSTING_TAGS, DOMAINS, TAGS (utf8mb4_unicode_ci)
 * 
 * Run: node scripts/debug/fix-posting-collations.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function fixPostingCollations() {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
  });

  console.log('Connected to database');
  console.log('');

  const tablesToFix = [
    'POSTING_CATEGORIES',
    'POSTING_DOMAINS',
    'POSTING_TAGS',
    'DOMAINS',
    'TAGS'
  ];

  const targetCollation = 'utf8mb4_0900_ai_ci';

  try {
    // Check current collations
    console.log('=== BEFORE: Table Collations ===');
    const [beforeInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${tablesToFix.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...tablesToFix]);
    
    for (const table of beforeInfo) {
      console.log(`${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    }

    // Fix collations
    console.log('\n=== FIXING COLLATIONS ===');
    for (const table of tablesToFix) {
      try {
        console.log(`Altering ${table}...`);
        await pool.query(`ALTER TABLE ${table} CONVERT TO CHARACTER SET utf8mb4 COLLATE ${targetCollation}`);
        console.log(`✅ ${table} converted to ${targetCollation}`);
      } catch (error) {
        console.error(`❌ Error fixing ${table}: ${error.message}`);
      }
    }

    // Verify changes
    console.log('\n=== AFTER: Table Collations ===');
    const [afterInfo] = await pool.query(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN (${tablesToFix.map(() => '?').join(',')})
    `, [process.env.DB_NAME, ...tablesToFix]);
    
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
        pc.name as category_name
      FROM POSTINGS p
      LEFT JOIN user_profiles up ON p.author_id = up.id
      LEFT JOIN accounts a ON up.account_id = a.id
      LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
      LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
      WHERE p.status IN ('active', 'approved')
      LIMIT 5
    `;

    const [testResults] = await pool.query(query);
    console.log(`✅ Query executed successfully! Found ${testResults.length} postings.`);

    // Test full query with domains and tags
    console.log('\n=== TESTING FULL QUERY WITH DOMAINS/TAGS ===');
    const fullQuery = `
      SELECT DISTINCT
        p.id,
        p.title,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', d.id, 'name', d.name)
          )
          FROM POSTING_DOMAINS pd
          JOIN DOMAINS d ON pd.domain_id = d.id
          WHERE pd.posting_id = p.id
        ) as domains,
        (
          SELECT JSON_ARRAYAGG(
            JSON_OBJECT('id', t.id, 'name', t.name)
          )
          FROM POSTING_TAGS pt
          JOIN TAGS t ON pt.tag_id = t.id
          WHERE pt.posting_id = p.id
        ) as tags
      FROM POSTINGS p
      LEFT JOIN POSTING_CATEGORIES pc ON p.category_id = pc.id
      LIMIT 5
    `;

    const [fullResults] = await pool.query(fullQuery);
    console.log(`✅ Full query executed successfully! Found ${fullResults.length} postings.`);

    console.log('\n✅ MIGRATION COMPLETE - GET /api/postings should now work!');

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL state:', error.sqlState);
    console.error('SQL message:', error.sqlMessage);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

fixPostingCollations();

/**
 * Diagnostic script to test GET /api/postings endpoint
 * This runs the actual SQL query directly to see errors
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testPostingsQuery() {
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

  try {
    // First, let's check the POSTINGS table structure
    console.log('\n=== POSTINGS Table Structure ===');
    const [columns] = await pool.query('DESCRIBE POSTINGS');
    console.log(columns.map(c => `${c.Field}: ${c.Type}`).join('\n'));

    // Check if user_profiles table exists and has data
    console.log('\n=== user_profiles Table Check ===');
    const [profileCheck] = await pool.query('SELECT COUNT(*) as count FROM user_profiles');
    console.log('user_profiles count:', profileCheck[0].count);

    // Check accounts table
    console.log('\n=== accounts Table Check ===');
    const [accountCheck] = await pool.query('SELECT COUNT(*) as count FROM accounts');
    console.log('accounts count:', accountCheck[0].count);

    // Check alumni_members table
    console.log('\n=== alumni_members Table Check ===');
    const [alumniCheck] = await pool.query('SELECT COUNT(*) as count FROM alumni_members');
    console.log('alumni_members count:', alumniCheck[0].count);

    // Check postings count and status
    console.log('\n=== POSTINGS Data Check ===');
    const [postingsCheck] = await pool.query('SELECT COUNT(*) as count, status FROM POSTINGS GROUP BY status');
    console.log('Postings by status:', postingsCheck);

    // Now run the actual query from the endpoint
    console.log('\n=== Running Actual GET /api/postings Query ===');
    const query = `
      SELECT DISTINCT
        p.id,
        p.author_id,
        p.title,
        p.content,
        p.posting_type,
        p.category_id,
        pc.name as category_name,
        p.urgency_level,
        p.location,
        p.location_type,
        p.duration,
        p.contact_name,
        p.contact_email,
        p.contact_phone,
        p.status,
        p.expires_at,
        p.view_count,
        p.interest_count,
        p.max_connections,
        p.is_pinned,
        p.published_at,
        p.created_at,
        p.updated_at,
        am.first_name as author_first_name,
        am.last_name as author_last_name,
        a.email as author_email,
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
      WHERE p.status IN ('active', 'approved')
      ORDER BY p.is_pinned DESC, p.published_at DESC, p.created_at DESC
      LIMIT 20 OFFSET 0
    `;

    const [postings] = await pool.query(query);
    console.log(`Found ${postings.length} postings`);
    if (postings.length > 0) {
      console.log('First posting:', JSON.stringify(postings[0], null, 2));
    }

  } catch (error) {
    console.error('\n=== ERROR ===');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('SQL state:', error.sqlState);
    console.error('SQL message:', error.sqlMessage);
    console.error('Stack:', error.stack);
  } finally {
    await pool.end();
    console.log('\nDatabase connection closed');
  }
}

testPostingsQuery();

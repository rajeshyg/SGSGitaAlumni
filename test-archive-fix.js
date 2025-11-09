/**
 * Quick test to verify archive functionality
 * This script checks if the backend properly archives posts
 */

import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Rajesh1!',
  database: process.env.DB_NAME || 'sgs_gita_alumni',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testArchive() {
  try {
    console.log('🧪 Testing Archive Functionality\n');
    
    // 1. Find a test posting
    const [postings] = await pool.query(`
      SELECT id, title, status, author_id 
      FROM POSTINGS 
      WHERE title LIKE '%E2E Test%' 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📋 Found ${postings.length} E2E test postings:`);
    postings.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title.substring(0, 50)} - Status: ${p.status}`);
    });
    
    if (postings.length === 0) {
      console.log('\n⚠️  No test postings found. Run the E2E test first.');
      process.exit(0);
    }
    
    // 2. Check for archived postings
    const [archived] = await pool.query(`
      SELECT id, title, status, updated_at
      FROM POSTINGS 
      WHERE status = 'archived' AND title LIKE '%E2E Test%'
      ORDER BY updated_at DESC
      LIMIT 5
    `);
    
    console.log(`\n🗄️  Found ${archived.length} archived E2E test postings:`);
    archived.forEach((p, i) => {
      console.log(`  ${i+1}. ${p.title.substring(0, 50)} - Updated: ${p.updated_at}`);
    });
    
    // 3. Show status distribution
    const [stats] = await pool.query(`
      SELECT 
        status, 
        COUNT(*) as count,
        GROUP_CONCAT(SUBSTRING(title, 1, 30) SEPARATOR ', ') as titles
      FROM POSTINGS 
      WHERE title LIKE '%E2E Test%'
      GROUP BY status
    `);
    
    console.log(`\n📊 Status Distribution for E2E Test Postings:`);
    stats.forEach(s => {
      console.log(`  ${s.status}: ${s.count}`);
    });
    
    console.log('\n✅ Test complete');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testArchive();

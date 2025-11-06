/**
 * Test the fixed moderation queue SQL query
 * 
 * This verifies that the corrected column names work with the actual database schema
 */

import dotenv from 'dotenv';
dotenv.config();

import { getPool } from './utils/database.js';

const pool = getPool();

async function testQuery() {
  console.log('🧪 Testing Fixed Moderation Queue Query...\n');
  
  try {
    // Test the exact query from the API (corrected version)
    const whereConditions = ['p.moderation_status COLLATE utf8mb4_unicode_ci IN (?, ?)'];
    const queryParams = ['PENDING', 'ESCALATED'];
    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
    const orderByClause = 'ORDER BY p.created_at ASC';
    const limit = 20;
    const offset = 0;
    
    console.log('✓ Testing main queue query with corrected schema...');
    const [postings] = await pool.query(
      `SELECT 
        p.id,
        p.title,
        p.content as description,
        p.posting_type,
        pd.domain_id,
        p.moderation_status,
        p.created_at,
        p.expires_at,
        p.version,
        d.name as domain_name,
        u.first_name,
        u.last_name,
        u.email as submitter_email,
        u.id as submitter_id,
        (SELECT COUNT(*) 
         FROM MODERATION_HISTORY mh 
         WHERE mh.posting_id COLLATE utf8mb4_unicode_ci = p.id COLLATE utf8mb4_unicode_ci) as moderation_count,
        (SELECT COUNT(*) 
         FROM MODERATION_HISTORY mh2 
         WHERE mh2.posting_id COLLATE utf8mb4_unicode_ci IN (SELECT id FROM POSTINGS WHERE author_id = u.id) 
         AND mh2.action = 'REJECTED') as submitter_rejection_count
      FROM POSTINGS p
      INNER JOIN app_users u ON p.author_id = u.id
      LEFT JOIN POSTING_DOMAINS pd ON p.id COLLATE utf8mb4_unicode_ci = pd.posting_id COLLATE utf8mb4_unicode_ci AND pd.is_primary = 1
      LEFT JOIN DOMAINS d ON pd.domain_id COLLATE utf8mb4_unicode_ci = d.id COLLATE utf8mb4_unicode_ci
      ${whereClause}
      ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    console.log(`  ✅ Query SUCCESS - Returned ${postings.length} postings\n`);
    
    if (postings.length > 0) {
      console.log('Sample posting:');
      const sample = postings[0];
      console.log(`  ID: ${sample.id}`);
      console.log(`  Title: ${sample.title}`);
      console.log(`  Description: ${sample.description ? sample.description.substring(0, 50) + '...' : 'N/A'}`);
      console.log(`  Status: ${sample.moderation_status}`);
      console.log(`  Domain: ${sample.domain_name || 'N/A'}`);
      console.log(`  Author: ${sample.first_name} ${sample.last_name}`);
      console.log(`  Created: ${sample.created_at}`);
    } else {
      console.log('ℹ️  No postings found with PENDING or ESCALATED status');
      console.log('   Run: node create-test-postings.js to create test data');
    }
    
    // Test stats query
    console.log('\n✓ Testing stats query...');
    const [stats] = await pool.query(
      `SELECT 
        COUNT(CASE WHEN moderation_status COLLATE utf8mb4_unicode_ci = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN moderation_status COLLATE utf8mb4_unicode_ci = 'ESCALATED' THEN 1 END) as escalated_count,
        COUNT(CASE WHEN moderation_status COLLATE utf8mb4_unicode_ci = 'PENDING' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urgent_count
      FROM POSTINGS
      WHERE moderation_status COLLATE utf8mb4_unicode_ci IN ('PENDING', 'ESCALATED')`
    );
    
    console.log('  ✅ Stats query SUCCESS');
    console.log('  Results:', stats[0]);
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL QUERIES WORKING CORRECTLY');
    console.log('='.repeat(60));
    console.log('\n🎉 The 500 error should now be fixed!');
    console.log('\nNext steps:');
    console.log('1. Restart the development server (the code has changed)');
    console.log('2. Test the moderation queue page in the browser');
    console.log('3. Verify no 500 errors in the Network tab');
    
  } catch (error) {
    console.log('\n❌ QUERY FAILED');
    console.log('Error:', error.message);
    console.log('\nThis means there may be additional schema issues to fix.');
  } finally {
    await pool.end();
  }
}

testQuery();

/**
 * Diagnose Moderation Queue 500 Error
 * 
 * This script checks:
 * 1. Database connection
 * 2. Required tables exist (POSTINGS, MODERATION_HISTORY, DOMAINS, app_users)
 * 3. Table structures and columns
 * 4. Sample data exists
 * 5. SQL query that the API runs
 */

import dotenv from 'dotenv';
dotenv.config();

import { getPool } from './utils/database.js';

const pool = getPool();

async function diagnose() {
  console.log('🔍 Diagnosing Moderation Queue 500 Error...\n');
  
  try {
    // Test 1: Database connection
    console.log('✓ Test 1: Database Connection');
    await pool.query('SELECT 1');
    console.log('  ✅ Database connected successfully\n');
    
    // Test 2: Check if tables exist
    console.log('✓ Test 2: Required Tables');
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME IN ('POSTINGS', 'MODERATION_HISTORY', 'DOMAINS', 'app_users')
    `);
    
    const tableNames = tables.map(t => t.TABLE_NAME);
    console.log('  Found tables:', tableNames.join(', '));
    
    const requiredTables = ['POSTINGS', 'DOMAINS', 'app_users'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));
    
    if (missingTables.length > 0) {
      console.log('  ❌ Missing tables:', missingTables.join(', '));
      return;
    } else {
      console.log('  ✅ All required tables exist\n');
    }
    
    // Test 3: Check POSTINGS table structure
    console.log('✓ Test 3: POSTINGS Table Structure');
    const [postingsColumns] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'POSTINGS'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('  Columns in POSTINGS:');
    postingsColumns.forEach(col => {
      console.log(`    - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });
    
    const requiredColumns = [
      'id', 'title', 'description', 'posting_type', 'domain_id',
      'moderation_status', 'created_at', 'author_id'
    ];
    
    const existingColumns = postingsColumns.map(c => c.COLUMN_NAME);
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c));
    
    if (missingColumns.length > 0) {
      console.log('  ❌ Missing required columns:', missingColumns.join(', '));
      return;
    } else {
      console.log('  ✅ All required columns exist\n');
    }
    
    // Test 4: Check for sample data
    console.log('✓ Test 4: Sample Data');
    const [postingsCount] = await pool.query(`
      SELECT COUNT(*) as total FROM POSTINGS
    `);
    console.log(`  Total postings: ${postingsCount[0].total}`);
    
    const [pendingCount] = await pool.query(`
      SELECT COUNT(*) as total FROM POSTINGS WHERE moderation_status = 'PENDING'
    `);
    console.log(`  Pending postings: ${pendingCount[0].total}`);
    
    const [escalatedCount] = await pool.query(`
      SELECT COUNT(*) as total FROM POSTINGS WHERE moderation_status = 'ESCALATED'
    `);
    console.log(`  Escalated postings: ${escalatedCount[0].total}\n`);
    
    // Test 5: Test the actual API query
    console.log('✓ Test 5: Run Actual API Query');
    console.log('  Query parameters: page=1, limit=20, sortBy=oldest, status=undefined');
    
    try {
      const whereConditions = ['p.moderation_status IN (?, ?)'];
      const queryParams = ['PENDING', 'ESCALATED'];
      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      const orderByClause = 'ORDER BY p.created_at ASC';
      const limit = 20;
      const offset = 0;
      
      const [postings] = await pool.query(
        `SELECT 
          p.id,
          p.title,
          p.description,
          p.posting_type,
          p.domain_id,
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
           WHERE mh.posting_id = p.id) as moderation_count,
          (SELECT COUNT(*) 
           FROM MODERATION_HISTORY mh2 
           WHERE mh2.posting_id IN (SELECT id FROM POSTINGS WHERE author_id = u.id) 
           AND mh2.action = 'REJECTED') as submitter_rejection_count
        FROM POSTINGS p
        INNER JOIN app_users u ON p.author_id = u.id
        INNER JOIN DOMAINS d ON p.domain_id = d.id
        ${whereClause}
        ${orderByClause}
        LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );
      
      console.log(`  ✅ Query executed successfully`);
      console.log(`  Returned ${postings.length} postings\n`);
      
      if (postings.length > 0) {
        console.log('  Sample posting:');
        const sample = postings[0];
        console.log(`    ID: ${sample.id}`);
        console.log(`    Title: ${sample.title}`);
        console.log(`    Status: ${sample.moderation_status}`);
        console.log(`    Domain: ${sample.domain_name}`);
        console.log(`    Author: ${sample.first_name} ${sample.last_name}`);
      }
      
    } catch (queryError) {
      console.log('  ❌ Query failed with error:');
      console.log('  ', queryError.message);
      console.log('\n  Full error details:');
      console.log(queryError);
      return;
    }
    
    // Test 6: Test stats query
    console.log('\n✓ Test 6: Stats Query');
    try {
      const [stats] = await pool.query(
        `SELECT 
          COUNT(CASE WHEN moderation_status = 'PENDING' THEN 1 END) as pending_count,
          COUNT(CASE WHEN moderation_status = 'ESCALATED' THEN 1 END) as escalated_count,
          COUNT(CASE WHEN moderation_status = 'PENDING' AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urgent_count
        FROM POSTINGS
        WHERE moderation_status IN ('PENDING', 'ESCALATED')`
      );
      
      console.log('  ✅ Stats query executed successfully');
      console.log('  Results:', stats[0]);
      
    } catch (statsError) {
      console.log('  ❌ Stats query failed:');
      console.log('  ', statsError.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL DIAGNOSTIC TESTS PASSED');
    console.log('='.repeat(60));
    console.log('\nIf the API is still returning 500 errors, the issue is likely:');
    console.log('1. Authentication/authorization middleware failure');
    console.log('2. Server not restarted after code changes');
    console.log('3. Different database connection in production');
    console.log('\nNext steps:');
    console.log('1. Restart the development server');
    console.log('2. Check server console for error logs');
    console.log('3. Test API with proper authentication token');
    
  } catch (error) {
    console.log('\n❌ DIAGNOSTIC FAILED');
    console.log('Error:', error.message);
    console.log('\nFull error:');
    console.log(error);
  } finally {
    await pool.end();
  }
}

diagnose();

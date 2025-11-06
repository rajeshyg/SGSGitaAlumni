/**
 * Test script for new moderation API
 * Tests database connectivity and basic query structure
 * 
 * Run with: node test-new-moderation-api.cjs
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function testModerationAPI() {
  console.log('🧪 Testing New Moderation API\n');
  
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alumni_network',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // Test 1: Verify schema changes
    console.log('📋 Test 1: Verify Schema Changes');
    console.log('─'.repeat(60));
    
    const [postingsSchema] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'POSTINGS'
      AND COLUMN_NAME IN ('moderated_by', 'moderation_status', 'version')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('POSTINGS columns:');
    postingsSchema.forEach(col => {
      const status = col.COLUMN_NAME === 'moderated_by' && col.DATA_TYPE === 'bigint' ? '✅' : '❌';
      console.log(`  ${status} ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE})`);
    });
    
    const [historySchema] = await pool.query(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'MODERATION_HISTORY'
      AND COLUMN_NAME IN ('moderator_id', 'posting_id', 'action')
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\nMODERATION_HISTORY columns:');
    historySchema.forEach(col => {
      const status = col.COLUMN_NAME === 'moderator_id' && col.DATA_TYPE === 'bigint' ? '✅' : '❌';
      console.log(`  ${status} ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} (${col.IS_NULLABLE})`);
    });
    
    // Test 2: Verify foreign keys
    console.log('\n📋 Test 2: Verify Foreign Keys');
    console.log('─'.repeat(60));
    
    const [fks] = await pool.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND (TABLE_NAME = 'POSTINGS' OR TABLE_NAME = 'MODERATION_HISTORY')
      AND CONSTRAINT_NAME LIKE '%MODERAT%'
    `);
    
    if (fks.length > 0) {
      console.log('✅ Foreign keys found:');
      fks.forEach(fk => {
        console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.TABLE_NAME}.${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('❌ No foreign keys found for moderation tables');
    }
    
    // Test 3: Test queue query (without user context)
    console.log('\n📋 Test 3: Test Queue Query Structure');
    console.log('─'.repeat(60));
    
    try {
      const [queueResults] = await pool.query(`
        SELECT DISTINCT
          p.id,
          p.title,
          p.content,
          p.posting_type,
          p.moderation_status,
          p.created_at,
          p.version,
          u.id as submitter_id,
          u.first_name,
          u.last_name
        FROM POSTINGS p
        INNER JOIN app_users u ON p.author_id = u.id
        WHERE p.moderation_status IN ('PENDING', 'ESCALATED')
        ORDER BY p.created_at ASC
        LIMIT 5
      `);
      
      console.log(`✅ Queue query successful: ${queueResults.length} postings found`);
      if (queueResults.length > 0) {
        console.log(`  Sample: "${queueResults[0].title}" by ${queueResults[0].first_name} ${queueResults[0].last_name}`);
        console.log(`  Status: ${queueResults[0].moderation_status}`);
      }
    } catch (queryError) {
      console.log('❌ Queue query failed:', queryError.message);
    }
    
    // Test 4: Test statistics query
    console.log('\n📋 Test 4: Test Statistics Query');
    console.log('─'.repeat(60));
    
    try {
      const [stats] = await pool.query(`
        SELECT 
          COUNT(CASE WHEN moderation_status = 'PENDING' THEN 1 END) as pending_count,
          COUNT(CASE WHEN moderation_status = 'ESCALATED' THEN 1 END) as escalated_count,
          COUNT(CASE WHEN moderation_status = 'PENDING' 
                AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as urgent_count
        FROM POSTINGS
        WHERE moderation_status IN ('PENDING', 'ESCALATED')
      `);
      
      console.log('✅ Statistics query successful:');
      console.log(`  Pending: ${stats[0].pending_count}`);
      console.log(`  Escalated: ${stats[0].escalated_count}`);
      console.log(`  Urgent (>24h): ${stats[0].urgent_count}`);
    } catch (queryError) {
      console.log('❌ Statistics query failed:', queryError.message);
    }
    
    // Test 5: Test moderation history join
    console.log('\n📋 Test 5: Test Moderation History Join');
    console.log('─'.repeat(60));
    
    try {
      const [history] = await pool.query(`
        SELECT 
          mh.id,
          mh.posting_id,
          mh.moderator_id,
          mh.action,
          mh.created_at,
          u.first_name as moderator_first_name,
          u.last_name as moderator_last_name
        FROM MODERATION_HISTORY mh
        INNER JOIN app_users u ON mh.moderator_id = u.id
        ORDER BY mh.created_at DESC
        LIMIT 5
      `);
      
      console.log(`✅ Moderation history join successful: ${history.length} records found`);
      if (history.length > 0) {
        console.log(`  Sample: ${history[0].action} by ${history[0].moderator_first_name} ${history[0].moderator_last_name}`);
      }
    } catch (queryError) {
      console.log('❌ Moderation history join failed:', queryError.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Summary');
    console.log('='.repeat(60));
    console.log('✅ Schema verification: Check output above');
    console.log('✅ Foreign keys: Check output above');
    console.log('✅ Query tests: Check individual test results');
    console.log('\n💡 If all tests show ✅, the API should work correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

// Run tests
testModerationAPI().catch(console.error);

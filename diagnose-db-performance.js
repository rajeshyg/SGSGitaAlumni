import dotenv from 'dotenv';
dotenv.config();

import mysql from 'mysql2/promise';
import { performance } from 'perf_hooks';

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
};

console.log('===============================================');
console.log('DATABASE PERFORMANCE DIAGNOSTICS');
console.log('===============================================\n');

console.log('Configuration:');
console.log(`  Host: ${DB_CONFIG.host}`);
console.log(`  Port: ${DB_CONFIG.port}`);
console.log(`  Database: ${DB_CONFIG.database}`);
console.log(`  User: ${DB_CONFIG.user}`);
console.log(`  Connect Timeout: ${DB_CONFIG.connectTimeout}ms\n`);

async function runDiagnostics() {
  let pool = null;
  let connection = null;

  try {
    // TEST 1: Connection Pool Creation
    console.log('TEST 1: Creating connection pool...');
    const poolStart = performance.now();
    pool = mysql.createPool({
      ...DB_CONFIG,
      connectionLimit: 10,
      queueLimit: 0
    });
    const poolTime = performance.now() - poolStart;
    console.log(`✅ Pool created in ${poolTime.toFixed(2)}ms\n`);

    // TEST 2: Acquire Single Connection
    console.log('TEST 2: Acquiring connection from pool...');
    const connStart = performance.now();
    connection = await pool.getConnection();
    const connTime = performance.now() - connStart;
    console.log(`✅ Connection acquired in ${connTime.toFixed(2)}ms`);

    if (connTime > 5000) {
      console.warn(`⚠️  WARNING: Connection took >5s! This indicates network/DB issues.\n`);
    } else if (connTime > 1000) {
      console.warn(`⚠️  SLOW: Connection took >1s. Check network latency.\n`);
    } else {
      console.log(`✓ Connection speed is good.\n`);
    }

    // TEST 3: Simple SELECT Query
    console.log('TEST 3: Running simple SELECT query (SELECT 1)...');
    const selectStart = performance.now();
    await connection.execute('SELECT 1 AS test');
    const selectTime = performance.now() - selectStart;
    console.log(`✅ Query executed in ${selectTime.toFixed(2)}ms\n`);

    // TEST 4: Check if USER_INVITATIONS table exists
    console.log('TEST 4: Checking USER_INVITATIONS table...');
    const tableStart = performance.now();
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'USER_INVITATIONS'"
    );
    const tableTime = performance.now() - tableStart;

    if (tables.length === 0) {
      console.error('❌ USER_INVITATIONS table does NOT exist!\n');
    } else {
      console.log(`✅ USER_INVITATIONS table exists (checked in ${tableTime.toFixed(2)}ms)\n`);
    }

    // TEST 5: Count rows in USER_INVITATIONS
    console.log('TEST 5: Counting rows in USER_INVITATIONS...');
    const countStart = performance.now();
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM USER_INVITATIONS'
    );
    const countTime = performance.now() - countStart;
    const rowCount = countResult[0].count;
    console.log(`✅ Found ${rowCount} invitation(s) in ${countTime.toFixed(2)}ms\n`);

    // TEST 6: Check for invitation_token index
    console.log('TEST 6: Checking indexes on USER_INVITATIONS...');
    const indexStart = performance.now();
    const [indexes] = await connection.execute(
      "SHOW INDEX FROM USER_INVITATIONS WHERE Column_name = 'invitation_token'"
    );
    const indexTime = performance.now() - indexStart;

    if (indexes.length === 0) {
      console.error('❌ No index on invitation_token column! This will cause slow queries.\n');
    } else {
      console.log(`✅ Index found on invitation_token: ${indexes[0].Key_name} (checked in ${indexTime.toFixed(2)}ms)\n`);
    }

    // TEST 7: Simulate the actual invitation validation query
    console.log('TEST 7: Simulating actual invitation validation query...');
    console.log('  (Using a non-existent token to test query performance)\n');

    const testToken = 'test-token-performance-check-12345';
    const queryStart = performance.now();

    const [rows] = await connection.execute(`
      SELECT ui.id, ui.invitation_token, ui.email, ui.status, ui.completion_status,
             ui.is_used, ui.used_at, ui.expires_at, ui.alumni_member_id,
             ui.invited_by, ui.invitation_type, ui.invitation_data, ui.sent_at,
             ui.accepted_by, ui.ip_address, ui.resend_count, ui.last_resent_at,
             ui.created_at, ui.updated_at,
             am.id as alumni_id, am.first_name, am.last_name, am.email as alumni_email
      FROM USER_INVITATIONS ui
      LEFT JOIN alumni_members am ON ui.alumni_member_id = am.id
      WHERE ui.invitation_token = ?
      LIMIT 1
    `, [testToken]);

    const queryTime = performance.now() - queryStart;
    console.log(`✅ Validation query executed in ${queryTime.toFixed(2)}ms`);
    console.log(`   Found ${rows.length} row(s)\n`);

    if (queryTime > 5000) {
      console.error(`❌ CRITICAL: Query took >5s! This is why invitations are timing out.\n`);
    } else if (queryTime > 1000) {
      console.warn(`⚠️  WARNING: Query took >1s. This is slower than expected.\n`);
    } else {
      console.log(`✓ Query performance is acceptable.\n`);
    }

    // TEST 8: Check for long-running queries
    console.log('TEST 8: Checking for long-running queries in MySQL...');
    const [processes] = await connection.execute(
      "SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST WHERE COMMAND != 'Sleep' AND TIME > 5"
    );

    if (processes.length > 0) {
      console.warn(`⚠️  Found ${processes.length} long-running query/queries:\n`);
      processes.forEach(proc => {
        console.log(`   - ID: ${proc.ID}, Time: ${proc.TIME}s, State: ${proc.STATE}, Info: ${proc.INFO?.substring(0, 100)}`);
      });
      console.log('');
    } else {
      console.log(`✅ No long-running queries detected.\n`);
    }

    // TEST 9: Check table locks
    console.log('TEST 9: Checking for table locks...');
    const [locks] = await connection.execute(
      "SELECT * FROM INFORMATION_SCHEMA.INNODB_LOCKS"
    );

    if (locks.length > 0) {
      console.warn(`⚠️  Found ${locks.length} table lock(s)!\n`);
      locks.forEach(lock => {
        console.log(`   - Lock ID: ${lock.lock_id}, Mode: ${lock.lock_mode}, Table: ${lock.lock_table}`);
      });
      console.log('');
    } else {
      console.log(`✅ No table locks detected.\n`);
    }

    // TEST 10: Pool Status
    console.log('TEST 10: Current pool status...');
    console.log(`  Connection Limit: ${pool.config.connectionLimit}`);
    console.log(`  Queue Limit: ${pool.config.queueLimit}`);
    console.log(`  Total Connections: ${pool._allConnections?.length || 0}`);
    console.log(`  Available: ${pool._freeConnections?.length || 0}`);
    console.log(`  In Use: ${pool._allConnections?.length - pool._freeConnections?.length || 0}\n`);

    console.log('===============================================');
    console.log('DIAGNOSTICS SUMMARY');
    console.log('===============================================\n');

    const totalTime = connTime + selectTime + countTime + queryTime;

    if (connTime > 5000 || queryTime > 5000) {
      console.error('❌ CRITICAL ISSUES DETECTED:');
      if (connTime > 5000) {
        console.error('   - Database connection is extremely slow (>5s)');
        console.error('   - Check: Network connectivity, MySQL server load, firewall');
      }
      if (queryTime > 5000) {
        console.error('   - Invitation queries are timing out (>5s)');
        console.error('   - Check: Table locks, missing indexes, long-running queries');
      }
    } else if (connTime > 1000 || queryTime > 1000) {
      console.warn('⚠️  PERFORMANCE ISSUES DETECTED:');
      if (connTime > 1000) {
        console.warn('   - Database connections are slow (>1s)');
      }
      if (queryTime > 1000) {
        console.warn('   - Invitation queries are slower than expected (>1s)');
      }
    } else {
      console.log('✅ All tests passed! Database performance looks good.');
      console.log('   The timeout issue may be intermittent or caused by:');
      console.log('   - High concurrent load exhausting the 10-connection pool');
      console.log('   - Periodic network latency spikes');
      console.log('   - MySQL server resource constraints during peak times');
    }

    console.log(`\nTotal database operation time: ${totalTime.toFixed(2)}ms`);
    console.log(`Connection pool has ${pool.config.connectionLimit} connections max.\n`);

  } catch (error) {
    console.error('\n❌ DIAGNOSTIC ERROR:', error.message);
    console.error('Error code:', error.code);
    console.error('Error number:', error.errno);
    console.error('\nFull error:', error);
  } finally {
    if (connection) {
      connection.release();
      console.log('✓ Test connection released');
    }
    if (pool) {
      await pool.end();
      console.log('✓ Pool closed');
    }
    console.log('\nDiagnostics complete.\n');
  }
}

runDiagnostics();

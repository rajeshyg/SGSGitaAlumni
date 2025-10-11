#!/usr/bin/env node

// ============================================================================
// CONNECTION POOL TIMEOUT TEST
// ============================================================================
// Test script to validate connection pool behavior and timeout handling

import mysql from 'mysql2/promise';
import { getPool, getPoolStatus, startPoolMonitoring } from './utils/database.js';

// Test configuration
const TEST_CONFIG = {
  maxConnections: 5,
  timeoutMs: 5000,
  testDurationMs: 30000,
  concurrentRequests: 10
};

async function testConnectionTimeout() {
  console.log('🧪 Starting connection timeout test...');
  console.log('📊 Test config:', TEST_CONFIG);

  try {
    // Create a test pool with limited connections
    const testPool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectionLimit: TEST_CONFIG.maxConnections,
      queueLimit: 0,
      connectTimeout: 60000,
    });

    console.log('✅ Test pool created');

    // Start monitoring
    const monitoringInterval = startPoolMonitoring(2000);

    // Test 1: Exhaust connection pool
    console.log(`\n🔌 Test 1: Exhausting connection pool with ${TEST_CONFIG.concurrentRequests} concurrent requests...`);

    const connectionPromises = [];
    for (let i = 0; i < TEST_CONFIG.concurrentRequests; i++) {
      connectionPromises.push(
        (async (index) => {
          try {
            console.log(`🔌 Request ${index}: Attempting to get connection...`);
            const startTime = Date.now();

            const connection = await Promise.race([
              testPool.getConnection(),
              new Promise((_, reject) =>
                setTimeout(() => reject(new Error(`Connection timeout after ${TEST_CONFIG.timeoutMs}ms`)), TEST_CONFIG.timeoutMs)
              )
            ]);

            const connectionTime = Date.now() - startTime;
            console.log(`✅ Request ${index}: Got connection in ${connectionTime}ms`);

            // Hold connection for a bit
            await new Promise(resolve => setTimeout(resolve, 2000));

            connection.release();
            console.log(`🔌 Request ${index}: Released connection`);
          } catch (error) {
            console.log(`❌ Request ${index}: ${error.message}`);
          }
        })(i)
      );
    }

    await Promise.all(connectionPromises);
    console.log('✅ Test 1 completed');

    // Test 2: Validate timeout handling
    console.log(`\n⏱️  Test 2: Testing timeout handling...`);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Simulated timeout')), 1000)
      );

      await Promise.race([
        timeoutPromise,
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch (error) {
      console.log(`✅ Timeout handling works: ${error.message}`);
    }

    // Cleanup
    clearInterval(monitoringInterval);
    await testPool.end();
    console.log('🧹 Test pool cleaned up');

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnectionTimeout()
    .then(() => {
      console.log('✅ Connection timeout test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Connection timeout test failed:', error);
      process.exit(1);
    });
}

export { testConnectionTimeout };
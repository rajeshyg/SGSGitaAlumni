// Test the exact getPool() pattern used in server.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

console.log('Testing server.js getPool() pattern...');

// This is the EXACT pattern from server.js
let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('MySQL: Connection pool created');
  }
  return pool;
};

async function testGetPoolPattern() {
  try {
    console.log('1. Testing getPool() function...');
    const testPool = getPool();
    console.log('✅ getPool() returned pool successfully');

    console.log('2. Testing pool.getConnection()...');
    const connection = await testPool.getConnection();
    console.log('✅ Connection acquired from pool');

    console.log('3. Testing database query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query executed successfully:', rows);

    console.log('4. Testing connection release...');
    connection.release();
    console.log('✅ Connection released');

    console.log('5. Testing multiple getPool() calls...');
    const pool2 = getPool();
    const pool3 = getPool();
    console.log('✅ Multiple getPool() calls work, same instance:', pool === pool2 && pool2 === pool3);

    console.log('✅ All getPool() pattern tests passed!');

  } catch (error) {
    console.error('❌ Error testing getPool() pattern:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
  }
}

testGetPoolPattern();
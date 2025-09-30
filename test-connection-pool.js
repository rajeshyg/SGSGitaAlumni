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

console.log('Testing connection pool logic (same as server.js)...');

async function testConnectionPool() {
  try {
    console.log('1. Testing pool creation...');
    const pool = mysql.createPool(DB_CONFIG);
    console.log('✅ Pool created successfully');

    console.log('2. Testing connection acquisition...');
    const connection = await pool.getConnection();
    console.log('✅ Connection acquired from pool');

    console.log('3. Testing database query via pool...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query executed successfully:', rows);

    console.log('4. Testing connection release...');
    connection.release();
    console.log('✅ Connection released back to pool');

    console.log('5. Testing pool destruction...');
    await pool.end();
    console.log('✅ Pool destroyed successfully');

  } catch (error) {
    console.error('❌ Error testing connection pool:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    console.error('Stack trace:', error.stack);
  }
}

testConnectionPool();
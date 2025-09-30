// Test to isolate the connection pool issue in server.js
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

console.log('Testing server.js connection pool issue...');

// This is the EXACT pattern from server.js
let pool = null;

const getPool = () => {
  if (!pool) {
    console.log('Creating new pool...');
    pool = mysql.createPool(DB_CONFIG);
    console.log('MySQL: Connection pool created');
  }
  return pool;
};

async function testServerConnectionPoolIssue() {
  try {
    console.log('1. Testing getPool() function multiple times...');
    const pool1 = getPool();
    const pool2 = getPool();
    const pool3 = getPool();
    console.log('✅ getPool() works, same instance:', pool1 === pool2 && pool2 === pool3);

    console.log('2. Testing pool.getConnection()...');
    const connection = await pool1.getConnection();
    console.log('✅ Connection acquired from pool');

    console.log('3. Testing database query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query executed successfully:', rows);

    console.log('4. Testing connection release...');
    connection.release();
    console.log('✅ Connection released');

    console.log('5. Testing multiple connections...');
    const connections = [];
    for (let i = 0; i < 5; i++) {
      const conn = await pool1.getConnection();
      connections.push(conn);
      console.log(`✅ Acquired connection ${i + 1}`);
    }

    console.log('6. Releasing all connections...');
    for (const conn of connections) {
      conn.release();
      console.log('✅ Released connection');
    }

    console.log('✅ All connection pool tests passed!');

  } catch (error) {
    console.error('❌ Error testing connection pool:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
  }
}

testServerConnectionPoolIssue();
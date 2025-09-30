// Test to isolate the HTTP server issue
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
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

console.log('Testing isolated server setup...');

async function testIsolatedServer() {
  try {
    console.log('1. Creating Express app...');
    const app = express();

    console.log('2. Setting up middleware...');
    app.use(cors());
    app.use(express.json());

    console.log('3. Creating connection pool...');
    const pool = mysql.createPool(DB_CONFIG);
    console.log('✅ Pool created');

    console.log('4. Testing pool connection...');
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    console.log('✅ Pool connection test passed');

    console.log('5. Setting up simple test endpoint...');
    app.get('/test', async (req, res) => {
      try {
        console.log('Test endpoint called');
        const testConnection = await pool.getConnection();
        await testConnection.execute('SELECT 1');
        testConnection.release();
        console.log('Test endpoint database operation completed');
        res.json({ success: true, message: 'Test passed' });
      } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: error.message });
      }
    });

    console.log('6. Starting test server...');
    const server = app.listen(3002, () => {
      console.log('Test server running on http://localhost:3002');
    });

    console.log('7. Testing the test endpoint...');
    // Give the server a moment to start
    setTimeout(async () => {
      try {
        const response = await fetch('http://localhost:3002/test');
        const data = await response.json();
        console.log('✅ HTTP request successful:', data);

        server.close();
        await pool.end();
        console.log('✅ All tests passed!');

      } catch (error) {
        console.error('❌ HTTP request failed:', error.message);
        server.close();
        await pool.end();
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error in isolated server test:', error.message);
  }
}

testIsolatedServer();
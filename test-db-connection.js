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
  connectTimeout: 10000, // 10 second timeout
  acquireTimeout: 10000,
  timeout: 10000,
};

console.log('Testing database connection...');
console.log('DB_HOST:', DB_CONFIG.host);
console.log('DB_USER:', DB_CONFIG.user);
console.log('DB_NAME:', DB_CONFIG.database);
console.log('DB_PORT:', DB_CONFIG.port);

async function testConnection() {
  try {
    console.log('Attempting to connect to database...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Database connection successful!');

    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Test query result:', rows);

    await connection.end();
    console.log('✅ Connection closed successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
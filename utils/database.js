import mysql from 'mysql2/promise';

// MySQL Database Configuration
export const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

// MySQL connection pool - Temporarily disabled for testing
let pool = null;

export const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('MySQL: Connection pool created');
  }
  return pool;
};

// Test database connection before starting server
export async function testDatabaseConnection() {
  try {
    const connection = await getPool().getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}
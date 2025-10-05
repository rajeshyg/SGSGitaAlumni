import mysql from 'mysql2/promise';

// MySQL Database Configuration (created dynamically)
function getDBConfig() {
  return {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    connectTimeout: 60000,
  };
}

// MySQL Pool Configuration (created dynamically)
function getPoolConfig() {
  return {
    ...getDBConfig(),
    connectionLimit: 10,
    queueLimit: 0,
  };
}

// MySQL connection pool - Created lazily after environment variables are loaded
let pool = null;

export const getPool = () => {
  if (!pool) {
    // Ensure environment variables are loaded
    if (!process.env.DB_HOST || !process.env.DB_USER) {
      throw new Error('Database environment variables not loaded. Make sure dotenv.config() runs before database initialization.');
    }

    pool = mysql.createPool(getPoolConfig());
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
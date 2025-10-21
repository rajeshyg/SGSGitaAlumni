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
    // Enable JSON parsing for MySQL JSON types
    typeCast: function (field, next) {
      if (field.type === 'JSON') {
        return JSON.parse(field.string());
      }
      return next();
    }
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

// Monitor connection pool status
export function getPoolStatus() {
  const pool = getPool();
  const poolName = 'MainPool';

  return {
    poolName,
    connectionLimit: pool.config.connectionLimit,
    queueLimit: pool.config.queueLimit,
    availableConnections: pool._availableConnections ? pool._availableConnections.length : 'unknown',
    usingConnections: pool._usingConnections ? pool._usingConnections.length : 'unknown',
    waitingClients: pool._waitingClients ? pool._waitingClients.length : 'unknown',
    totalConnections: pool._allConnections ? pool._allConnections.length : 'unknown'
  };
}

// Log pool status periodically
export function startPoolMonitoring(intervalMs = 60000) { // Default: every minute
  console.log('🔍 Starting database connection pool monitoring...');

  const logPoolStatus = () => {
    const status = getPoolStatus();
    console.log('📊 Pool Status:', status);

    // Warn if pool is getting full
    if (status.totalConnections >= status.connectionLimit * 0.8) {
      console.warn('⚠️  Connection pool usage is high:', `${status.totalConnections}/${status.connectionLimit}`);
    }

    // Alert if pool is exhausted
    if (status.totalConnections >= status.connectionLimit) {
      console.error('🚨 Connection pool is exhausted! All connections are in use.');
    }
  };

  // Log immediately
  logPoolStatus();

  // Set up periodic logging
  return setInterval(logPoolStatus, intervalMs);
}
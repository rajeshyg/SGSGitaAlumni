import mysql from 'mysql2/promise';
import { logger } from './logger.js';

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
    connectionLimit: 20, // Increased from 10 to handle concurrent requests better
    queueLimit: 0,
    supportBigNumbers: true, // Handle BIGINT values properly
    bigNumberStrings: true, // Return BIGINT as strings to avoid precision loss
    // Enable JSON parsing for MySQL JSON types
    typeCast: function (field, next) {
      if (field.type === 'JSON') {
        return JSON.parse(field.string('utf8'));
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
  const poolConfig = getPoolConfig();

  return {
    poolName,
    connectionLimit: poolConfig.connectionLimit,
    queueLimit: poolConfig.queueLimit,
    availableConnections: pool._freeConnections ? pool._freeConnections.length : 'unknown',
    usingConnections: pool._allConnections ? pool._allConnections.length - (pool._freeConnections?.length || 0) : 'unknown',
    waitingClients: pool._connectionQueue ? pool._connectionQueue.length : 'unknown',
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

// ============================================================================
// DATABASE UTILITY FUNCTIONS - Added during code quality refactor
// ============================================================================

/**
 * Execute a database operation with automatic connection management and timeout
 * @param {Function} operation - Async function that receives connection and performs DB operations
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<any>} - Result from the operation
 * @throws {Error} - If connection fails or operation times out
 */
export async function withDatabaseConnection(operation, timeoutMs = 10000) {
  let connection = null;
  const dbPool = getPool();

  try {
    // Acquire connection with timeout
    connection = await Promise.race([
      dbPool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
      )
    ]);

    logger.debug('Database connection acquired');

    // Execute the operation
    const result = await operation(connection);

    // Release connection
    connection.release();
    logger.debug('Database connection released');

    return result;

  } catch (error) {
    // Ensure connection is released even on error
    if (connection) {
      connection.release();
      logger.debug('Database connection released (after error)');
    }

    // Re-throw the error for caller to handle
    throw error;
  }
}

/**
 * Execute a transactional database operation with automatic rollback on error
 * @param {Function} operation - Async function that receives connection and performs DB operations
 * @param {number} timeoutMs - Timeout in milliseconds (default: 10000)
 * @returns {Promise<any>} - Result from the operation
 * @throws {Error} - If connection fails, operation times out, or transaction fails
 */
export async function withTransaction(operation, timeoutMs = 10000) {
  let connection = null;
  const dbPool = getPool();

  try {
    // Acquire connection with timeout
    connection = await Promise.race([
      dbPool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database connection timeout')), timeoutMs)
      )
    ]);

    logger.debug('Transaction connection acquired');

    // Start transaction
    await connection.beginTransaction();
    logger.debug('Transaction started');

    // Execute the operation
    const result = await operation(connection);

    // Commit transaction
    await connection.commit();
    logger.debug('Transaction committed');

    // Release connection
    connection.release();
    logger.debug('Transaction connection released');

    return result;

  } catch (error) {
    // Rollback transaction on error
    if (connection) {
      try {
        await connection.rollback();
        logger.warn('Transaction rolled back due to error');
      } catch (rollbackError) {
        logger.error('Failed to rollback transaction', rollbackError);
      }

      connection.release();
      logger.debug('Transaction connection released (after error)');
    }

    // Re-throw the original error
    throw error;
  }
}
import mysql from 'mysql2/promise';

// Get database pool - will be passed from main server
let pool = null;

export function setHealthPool(dbPool) {
  pool = dbPool;
}

// Health check
export const healthCheck = async (req, res) => {
  try {
    const checks = await Promise.allSettled([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkExternalServicesHealth()
    ]);

    const isHealthy = checks.every(check => check.status === 'fulfilled' && check.value === true);

    const healthStatus = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: checks[0].status === 'fulfilled' && checks[0].value === true,
        cache: checks[1].status === 'fulfilled' && checks[1].value === true,
        externalServices: checks[2].status === 'fulfilled' && checks[2].value === true
      },
      details: checks.map((check, index) => ({
        name: ['database', 'cache', 'externalServices'][index],
        status: check.status === 'fulfilled' ? (check.value ? 'healthy' : 'unhealthy') : 'error',
        error: check.status === 'rejected' ? check.reason?.message : null
      }))
    };

    res.status(isHealthy ? 200 : 503).json(healthStatus);
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

// Test database connection
export const testConnection = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    res.json({ success: true, message: 'Database connection successful' });
  } catch (error) {
    console.error('Database connection failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Health check helper functions
async function checkDatabaseHealth() {
  try {
    const connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

async function checkCacheHealth() {
  // For now, assume cache is healthy since we don't have Redis/cache implemented yet
  // In production, this would check Redis or other cache service
  return true;
}

async function checkExternalServicesHealth() {
  // Check external services like email, file storage, etc.
  // For now, assume healthy since external services are not fully implemented
  return true;
}
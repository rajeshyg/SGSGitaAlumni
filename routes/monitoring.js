// ============================================================================
// MONITORING ROUTES
// ============================================================================
// API endpoints for monitoring dashboard and real-time metrics

import { serverMonitoring } from '../src/lib/monitoring/server.js';
import { authenticateToken } from './auth.js';

// Get database pool - will be passed from main server
let pool = null;

export function setMonitoringPool(dbPool) {
  pool = dbPool;
}

// ============================================================================
// MONITORING ENDPOINTS
// ============================================================================

// Get comprehensive monitoring metrics
export const getMonitoringMetrics = async (req, res) => {
  try {
    const metrics = serverMonitoring.getMetrics();
    const systemHealth = serverMonitoring.getSystemHealth();

    res.json({
      success: true,
      data: {
        ...metrics,
        systemHealth
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting monitoring metrics:', error);
    res.status(500).json({ error: 'Failed to get monitoring metrics' });
  }
};

// Get security events
export const getSecurityEvents = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const events = serverMonitoring.getSecurityEvents(hours);

    res.json({
      success: true,
      data: events,
      count: events.length,
      timeRange: `${hours} hours`
    });
  } catch (error) {
    console.error('Error getting security events:', error);
    res.status(500).json({ error: 'Failed to get security events' });
  }
};

// Get system health status
export const getSystemHealth = async (req, res) => {
  try {
    const health = serverMonitoring.getSystemHealth();

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    console.error('Error getting system health:', error);
    res.status(500).json({ error: 'Failed to get system health' });
  }
};

// Get alert status and recent alerts
export const getAlertStatus = async (req, res) => {
  try {
    const alertMetrics = serverMonitoring.alertingService.getAlertMetrics();
    const activeAlerts = serverMonitoring.alertingService.getAlerts(true);

    res.json({
      success: true,
      data: {
        metrics: alertMetrics,
        activeAlerts
      }
    });
  } catch (error) {
    console.error('Error getting alert status:', error);
    res.status(500).json({ error: 'Failed to get alert status' });
  }
};

// Get database connection status
export const getDatabaseStatus = async (req, res) => {
  try {
    let connectionStatus = 'unknown';
    let connectionCount = 0;
    let totalConnections = 10; // Default

    try {
      const connection = await pool.getConnection();
      connectionStatus = 'connected';
      connection.release();

      // Try to get connection pool stats if available
      if (pool && typeof pool.getConnection === 'function') {
        // This is a simplified check - in production you might want more detailed stats
        connectionCount = 1; // We just tested one
      }
    } catch (dbError) {
      connectionStatus = 'disconnected';
      console.error('Database connection test failed:', dbError);
    }

    // Update monitoring service
    serverMonitoring.updateDatabaseConnections(connectionCount, totalConnections);

    res.json({
      success: true,
      data: {
        status: connectionStatus,
        connectionsUsed: connectionCount,
        connectionsTotal: totalConnections,
        lastChecked: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting database status:', error);
    res.status(500).json({ error: 'Failed to get database status' });
  }
};

// Get performance metrics
export const getPerformanceMetrics = async (req, res) => {
  try {
    const metrics = serverMonitoring.getMetrics();

    res.json({
      success: true,
      data: {
        systemMetrics: metrics.systemMetrics,
        requestMetrics: {
          totalRequests: metrics.totalRequests,
          activeRequests: metrics.systemMetrics.activeRequests,
          averageResponseTime: metrics.systemMetrics.responseTimeAvg,
          errorRate: metrics.errorRate
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
};

// Get rate limiting status
export const getRateLimitStatus = async (req, res) => {
  try {
    const metrics = serverMonitoring.getMetrics();

    res.json({
      success: true,
      data: {
        failedLogins: metrics.failedLogins,
        rateLimitViolations: metrics.rateLimitViolations,
        activeUsers: metrics.activeUsers
      }
    });
  } catch (error) {
    console.error('Error getting rate limit status:', error);
    res.status(500).json({ error: 'Failed to get rate limit status' });
  }
};

// Clear old monitoring data (admin only)
export const clearMonitoringData = async (req, res) => {
  try {
    const maxAgeMs = parseInt(req.query.maxAgeMs) || 24 * 60 * 60 * 1000; // 24 hours default
    serverMonitoring.clearOldData(maxAgeMs);

    res.json({
      success: true,
      message: `Cleared monitoring data older than ${maxAgeMs}ms`
    });
  } catch (error) {
    console.error('Error clearing monitoring data:', error);
    res.status(500).json({ error: 'Failed to clear monitoring data' });
  }
};
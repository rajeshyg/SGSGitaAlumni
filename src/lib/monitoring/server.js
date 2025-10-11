// ============================================================================
// SERVER MONITORING SERVICE (JavaScript stub)
// ============================================================================
// Basic monitoring service for server-side use - simplified version for Node.js compatibility

const logger = {
  info: (message, data) => console.log(`[Monitoring] [INFO] ${message}`, data || ''),
  warn: (message, data) => console.warn(`[Monitoring] [WARN] ${message}`, data || ''),
  error: (message, data) => console.error(`[Monitoring] [ERROR] ${message}`, data || ''),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Monitoring] [DEBUG] ${message}`, data || '');
    }
  }
};

class ServerMonitoringService {
  constructor() {
    this.metrics = this.initializeMetrics();
  }

  initializeMetrics() {
    return {
      systemMetrics: {
        activeRequests: 0,
        responseTimeAvg: 0
      },
      totalRequests: 0
    };
  }

  updateRequestMetrics(activeRequests, responseTimeAvg) {
    this.metrics.systemMetrics.activeRequests = activeRequests;
    this.metrics.systemMetrics.responseTimeAvg = responseTimeAvg;
  }

  incrementRequestCount() {
    this.metrics.totalRequests++;
  }

  incrementErrorCount() {
    // Basic error counting
  }

  logSecurityEvent(event) {
    logger.warn(`Security event: ${event.type}`, event);
  }

  logSuspiciousActivity(ip, activity, details) {
    logger.warn(`Suspicious activity: ${activity}`, { ip, details });
  }

  getMetrics() {
    return this.metrics;
  }
}

// Export singleton instance
export const serverMonitoring = new ServerMonitoringService();
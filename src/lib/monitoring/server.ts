// ============================================================================
// SERVER MONITORING SERVICE
// ============================================================================
// Comprehensive server-side monitoring for security events, system health, and performance metrics

import * as os from 'os';
import { AlertingService } from './alerting.js';

const logger = {
  info: (message: string, data?: any) => console.log(`[Monitoring] [INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[Monitoring] [WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[Monitoring] [ERROR] ${message}`, data || ''),
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Monitoring] [DEBUG] ${message}`, data || '');
    }
  }
};

export interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'rate_limit_violation' | 'suspicious_activity' | 'unauthorized_access' | 'brute_force_attempt';
  timestamp: number;
  ip: string;
  userAgent?: string;
  email?: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  memoryFree: number;
  uptime: number;
  loadAverage: number[];
  dbConnectionsUsed: number;
  dbConnectionsTotal: number;
  redisConnected: boolean;
  activeRequests: number;
  responseTimeAvg: number;
}

export interface MonitoringMetrics {
  securityEvents: SecurityEvent[];
  systemMetrics: SystemMetrics;
  failedLogins: number;
  rateLimitViolations: number;
  activeUsers: number;
  totalRequests: number;
  errorRate: number;
}

export class ServerMonitoringService {
  private securityEvents: SecurityEvent[] = [];
  private metrics: MonitoringMetrics;
  private alertingService: AlertingService;
  private metricsInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;
  private maxSecurityEvents: number = 1000;

  constructor(alertingService?: AlertingService) {
    this.alertingService = alertingService || new AlertingService();
    this.metrics = this.initializeMetrics();
    this.startMonitoring();
  }

  private initializeMetrics(): MonitoringMetrics {
    return {
      securityEvents: [],
      systemMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        memoryTotal: os.totalmem(),
        memoryFree: os.freemem(),
        uptime: process.uptime(),
        loadAverage: os.loadavg(),
        dbConnectionsUsed: 0,
        dbConnectionsTotal: 10, // Default pool size
        redisConnected: false,
        activeRequests: 0,
        responseTimeAvg: 0
      },
      failedLogins: 0,
      rateLimitViolations: 0,
      activeUsers: 0,
      totalRequests: 0,
      errorRate: 0
    };
  }

  private startMonitoring(): void {
    // Collect system metrics every 30 seconds
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Check alert rules every minute
    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000);

    logger.info('Server monitoring started');
  }

  private collectSystemMetrics(): void {
    try {
      const totalMemory = os.totalmem();
      const freeMemory = os.freemem();
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = (usedMemory / totalMemory) * 100;

      // Calculate CPU usage (simplified)
      const cpus = os.cpus();
      let totalIdle = 0;
      let totalTick = 0;

      cpus.forEach(cpu => {
        for (const type in cpu.times) {
          totalTick += (cpu.times as any)[type];
        }
        totalIdle += cpu.times.idle;
      });

      const idle = totalIdle / cpus.length;
      const total = totalTick / cpus.length;
      const cpuUsage = 100 - ~~(100 * idle / total);

      this.metrics.systemMetrics = {
        ...this.metrics.systemMetrics,
        cpuUsage,
        memoryUsage,
        memoryTotal: totalMemory,
        memoryFree: freeMemory,
        uptime: process.uptime(),
        loadAverage: os.loadavg()
      };

      logger.debug('System metrics collected', this.metrics.systemMetrics);
    } catch (error) {
      logger.error('Failed to collect system metrics:', error);
    }
  }

  private async checkAlerts(): Promise<void> {
    try {
      await this.alertingService.checkRules(this.metrics);
    } catch (error) {
      logger.error('Failed to check alert rules:', error);
    }
  }

  // Security event logging methods
  logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };

    this.securityEvents.push(securityEvent);

    // Keep only recent events
    if (this.securityEvents.length > this.maxSecurityEvents) {
      this.securityEvents.shift();
    }

    // Update metrics counters
    switch (event.type) {
      case 'failed_login':
        this.metrics.failedLogins++;
        break;
      case 'rate_limit_violation':
        this.metrics.rateLimitViolations++;
        break;
    }

    logger.warn(`Security event logged: ${event.type}`, {
      ip: event.ip,
      email: event.email,
      severity: event.severity
    });
  }

  logFailedLogin(ip: string, email?: string, details?: any): void {
    this.logSecurityEvent({
      type: 'failed_login',
      ip,
      email,
      details,
      severity: 'medium'
    });
  }

  logRateLimitViolation(ip: string, endpoint: string, details?: any): void {
    this.logSecurityEvent({
      type: 'rate_limit_violation',
      ip,
      details: { endpoint, ...details },
      severity: 'low'
    });
  }

  logSuspiciousActivity(ip: string, activity: string, details?: any): void {
    this.logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      details: { activity, ...details },
      severity: 'high'
    });
  }

  // System metrics updates
  updateDatabaseConnections(used: number, total: number): void {
    this.metrics.systemMetrics.dbConnectionsUsed = used;
    this.metrics.systemMetrics.dbConnectionsTotal = total;
  }

  updateRedisStatus(connected: boolean): void {
    this.metrics.systemMetrics.redisConnected = connected;
  }

  updateRequestMetrics(activeRequests: number, responseTimeAvg: number): void {
    this.metrics.systemMetrics.activeRequests = activeRequests;
    this.metrics.systemMetrics.responseTimeAvg = responseTimeAvg;
  }

  incrementRequestCount(): void {
    this.metrics.totalRequests++;
  }

  incrementErrorCount(): void {
    // Simple error rate calculation (could be improved with time windows)
    this.metrics.errorRate = (this.metrics.errorRate + 1) / Math.max(1, this.metrics.totalRequests) * 100;
  }

  // Getters for monitoring data
  getMetrics(): MonitoringMetrics {
    return { ...this.metrics };
  }

  getSecurityEvents(hours: number = 24): SecurityEvent[] {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.securityEvents.filter(event => event.timestamp > cutoff);
  }

  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    uptime: number;
    lastChecked: number;
  } {
    const issues: string[] = [];
    let status: 'healthy' | 'warning' | 'critical' = 'healthy';

    const { systemMetrics } = this.metrics;

    if (systemMetrics.cpuUsage > 90) {
      issues.push('High CPU usage');
      status = 'critical';
    } else if (systemMetrics.cpuUsage > 70) {
      issues.push('Elevated CPU usage');
      status = status === 'healthy' ? 'warning' : status;
    }

    if (systemMetrics.memoryUsage > 85) {
      issues.push('High memory usage');
      status = 'critical';
    } else if (systemMetrics.memoryUsage > 70) {
      issues.push('Elevated memory usage');
      status = status === 'healthy' ? 'warning' : status;
    }

    if (systemMetrics.dbConnectionsUsed >= systemMetrics.dbConnectionsTotal * 0.9) {
      issues.push('Database connection pool nearly exhausted');
      status = 'critical';
    }

    if (!systemMetrics.redisConnected) {
      issues.push('Redis connection failed');
      status = 'critical';
    }

    return {
      status,
      issues,
      uptime: systemMetrics.uptime,
      lastChecked: Date.now()
    };
  }

  // Cleanup and shutdown
  clearOldData(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    this.securityEvents = this.securityEvents.filter(event => event.timestamp > cutoff);
    this.alertingService.clearOldAlerts(maxAgeMs);
  }

  async shutdown(): Promise<void> {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }
    logger.info('Server monitoring stopped');
  }
}

// Export singleton instance
export const serverMonitoring = new ServerMonitoringService();
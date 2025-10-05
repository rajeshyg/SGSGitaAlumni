// ============================================================================
// ALERTING SERVICE
// ============================================================================
// Real-time alerting system for security events, rate limiting violations, and system health issues

const logger = {
  info: (message: string, data?: any) => console.log(`[Alerting] [INFO] ${message}`, data || ''),
  warn: (message: string, data?: any) => console.warn(`[Alerting] [WARN] ${message}`, data || ''),
  error: (message: string, data?: any) => console.error(`[Alerting] [ERROR] ${message}`, data || ''),
  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Alerting] [DEBUG] ${message}`, data || '');
    }
  }
};

export interface AlertRule {
  id: string;
  name: string;
  condition: (metrics: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMs: number; // Minimum time between alerts
  channels: ('email' | 'log' | 'console')[];
  recipients?: string[];
  enabled: boolean;
}

export interface Alert {
  id: string;
  ruleId: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  resolved: boolean;
  resolvedAt?: number;
}

export interface AlertMetrics {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: Record<string, number>;
  recentAlerts: Alert[];
}

export interface NotificationService {
  sendAlert(alert: Alert, recipients: string[]): Promise<void>;
}

export class ConsoleNotificationService implements NotificationService {
  async sendAlert(alert: Alert, recipients: string[]): Promise<void> {
    console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.message}`);
    console.error(`Recipients: ${recipients.join(', ')}`);
    console.error('Details:', alert.details);
  }
}

export class AlertingService {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private lastTriggered: Map<string, number> = new Map();
  private notificationService: NotificationService;
  private maxAlerts: number = 1000;
  private previousStates: Map<string, any> = new Map();

  constructor(notificationService?: NotificationService) {
    this.notificationService = notificationService || new ConsoleNotificationService();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Security event alerts
    this.addRule({
      id: 'failed-login-spike',
      name: 'Failed Login Spike',
      condition: (metrics) => metrics.failedLogins > 10,
      severity: 'high',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      channels: ['email', 'log'],
      recipients: ['admin@sgsitalumni.com'],
      enabled: true
    });

    this.addRule({
      id: 'rate-limit-exceeded',
      name: 'Rate Limit Exceeded',
      condition: (metrics) => metrics.rateLimitViolations > 5,
      severity: 'medium',
      cooldownMs: 10 * 60 * 1000, // 10 minutes
      channels: ['email', 'log'],
      recipients: ['admin@sgsitalumni.com'],
      enabled: true
    });

    // System health alerts
    this.addRule({
      id: 'high-cpu-usage',
      name: 'High CPU Usage',
      condition: (metrics) => metrics.cpuUsage > 90,
      severity: 'high',
      cooldownMs: 2 * 60 * 1000, // 2 minutes
      channels: ['email', 'log'],
      recipients: ['admin@sgsitalumni.com'],
      enabled: true
    });

    this.addRule({
      id: 'high-memory-usage',
      name: 'High Memory Usage',
      condition: (metrics) => metrics.memoryUsage > 85,
      severity: 'high',
      cooldownMs: 2 * 60 * 1000, // 2 minutes
      channels: ['email', 'log'],
      recipients: ['admin@sgsitalumni.com'],
      enabled: true
    });

    this.addRule({
      id: 'db-connection-pool-exhausted',
      name: 'Database Connection Pool Exhausted',
      condition: (metrics) => metrics.dbConnectionsUsed >= metrics.dbConnectionsTotal * 0.9,
      severity: 'critical',
      cooldownMs: 1 * 60 * 1000, // 1 minute
      channels: ['email', 'log'],
      recipients: ['admin@sgsitalumni.com'],
      enabled: true
    });

    this.addRule({
      id: 'redis-connection-failed',
      name: 'Redis Connection Failed',
      condition: (metrics) => !metrics.redisConnected,
      severity: 'high',
      cooldownMs: 5 * 60 * 1000, // 5 minutes
      channels: ['email', 'log'],
      recipients: ['admin@sgsitalumni.com'],
      enabled: true
    });
  }

  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info(`Added alert rule: ${rule.name}`);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
    logger.info(`Removed alert rule: ${ruleId}`);
  }

  async checkRules(metrics: any): Promise<void> {
    const now = Date.now();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        const lastTriggered = this.lastTriggered.get(rule.id) || 0;
        if (now - lastTriggered < rule.cooldownMs) continue;

        // For state-change based rules, check if state has changed
        const previousState = this.previousStates.get(rule.id);
        const currentState = this.getStateForRule(rule.id, metrics);

        // Update previous state
        this.previousStates.set(rule.id, currentState);

        // Check if alert should trigger based on rule type
        let shouldTrigger = false;

        if (rule.id === 'redis-connection-failed') {
          // Only alert if Redis was connected and now disconnected
          shouldTrigger = previousState === true && currentState === false;
        } else {
          // Default behavior for other rules
          shouldTrigger = rule.condition(metrics);
        }

        if (shouldTrigger) {
          await this.triggerAlert(rule, metrics);
          this.lastTriggered.set(rule.id, now);
        }
      } catch (error) {
        logger.error(`Error checking rule ${rule.id}:`, error);
      }
    }
  }

  private getStateForRule(ruleId: string, metrics: any): any {
    switch (ruleId) {
      case 'redis-connection-failed':
        return metrics.redisConnected;
      default:
        return null;
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: any): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      ruleId: rule.id,
      timestamp: Date.now(),
      severity: rule.severity,
      message: `Alert: ${rule.name} - Condition met`,
      details: { rule, metrics },
      resolved: false
    };

    this.alerts.push(alert);

    // Keep only recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts.shift();
    }

    logger.warn(`ALERT TRIGGERED: ${rule.name} (Severity: ${rule.severity})`, metrics);

    // Send notifications
    for (const channel of rule.channels) {
      try {
        switch (channel) {
          case 'email':
            await this.sendEmailAlert(alert, rule);
            break;
          case 'log':
            // Already logged above
            break;
          case 'console':
            console.error(`🚨 ALERT: ${alert.message}`, alert.details);
            break;
        }
      } catch (error) {
        logger.error(`Failed to send alert via ${channel}:`, error);
      }
    }
  }

  private async sendEmailAlert(alert: Alert, rule: AlertRule): Promise<void> {
    if (!rule.recipients || rule.recipients.length === 0) return;

    try {
      await this.notificationService.sendAlert(alert, rule.recipients);
      logger.info(`Alert notification sent to ${rule.recipients.length} recipients`);
    } catch (error) {
      logger.error(`Failed to send alert notification:`, error);
    }
  }

  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      logger.info(`Alert resolved: ${alertId}`);
    }
  }

  getAlerts(activeOnly: boolean = false): Alert[] {
    let alerts = this.alerts;
    if (activeOnly) {
      alerts = alerts.filter(a => !a.resolved);
    }
    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  getAlertMetrics(): AlertMetrics {
    const activeAlerts = this.alerts.filter(a => !a.resolved);
    const alertsBySeverity: Record<string, number> = {};

    for (const alert of this.alerts) {
      alertsBySeverity[alert.severity] = (alertsBySeverity[alert.severity] || 0) + 1;
    }

    return {
      totalAlerts: this.alerts.length,
      activeAlerts: activeAlerts.length,
      alertsBySeverity,
      recentAlerts: this.alerts.slice(-10)
    };
  }

  clearOldAlerts(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
    const cutoff = Date.now() - maxAgeMs;
    this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
  }
}

export const alertingService = new AlertingService();
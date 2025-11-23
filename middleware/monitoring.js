// ============================================================================
// MONITORING MIDDLEWARE
// ============================================================================
// Middleware for tracking requests, responses, and performance metrics

import { serverMonitoring } from '../src/lib/monitoring/server.ts';

const logger = {
  info: (message, data) => console.log(`[Monitoring-Middleware] [INFO] ${message}`, data || ''),
  warn: (message, data) => console.warn(`[Monitoring-Middleware] [WARN] ${message}`, data || ''),
  error: (message, data) => console.error(`[Monitoring-Middleware] [ERROR] ${message}`, data || ''),
  debug: (message, data) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Monitoring-Middleware] [DEBUG] ${message}`, data || '');
    }
  }
};

// Request tracking middleware
export const requestTrackingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';

  // Track active requests
  serverMonitoring.updateRequestMetrics(
    serverMonitoring.getMetrics().systemMetrics.activeRequests + 1,
    serverMonitoring.getMetrics().systemMetrics.responseTimeAvg
  );

  // Log request
  logger.debug(`Request: ${req.method} ${req.path}`, {
    ip: clientIP,
    userAgent: req.get('User-Agent'),
    query: req.query,
    body: req.method !== 'GET' ? '[REDACTED]' : undefined
  });

  // Override res.end to track response
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Update request metrics
    serverMonitoring.incrementRequestCount();

    // Update response time average (simple moving average)
    const currentMetrics = serverMonitoring.getMetrics();
    const currentAvg = currentMetrics.systemMetrics.responseTimeAvg;
    const totalRequests = currentMetrics.totalRequests;
    const newAvg = ((currentAvg * (totalRequests - 1)) + duration) / totalRequests;

    serverMonitoring.updateRequestMetrics(
      Math.max(0, currentMetrics.systemMetrics.activeRequests - 1),
      newAvg
    );

    // Track errors
    if (statusCode >= 400) {
      serverMonitoring.incrementErrorCount();

      // Log security-related errors
      if (statusCode === 401 || statusCode === 403) {
        serverMonitoring.logSecurityEvent({
          type: 'unauthorized_access',
          ip: clientIP,
          userAgent: req.get('User-Agent'),
          details: {
            method: req.method,
            path: req.path,
            statusCode,
            duration
          },
          severity: statusCode === 403 ? 'medium' : 'low'
        });
      }
    }

    // Log slow requests
    if (duration > 5000) { // 5 seconds
      logger.warn(`Slow request: ${req.method} ${req.path}`, {
        duration,
        statusCode,
        ip: clientIP
      });
    }

    // Log response
    logger.debug(`Response: ${statusCode} (${duration}ms)`, {
      method: req.method,
      path: req.path,
      ip: clientIP
    });

    // Call original end
    originalEnd.apply(this, args);
  };

  next();
};

// Security monitoring middleware
export const securityMonitoringMiddleware = (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 'unknown';
  const userAgent = req.get('User-Agent') || 'unknown';
  const path = req.path;

  // Detect suspicious patterns
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /eval\(/i,  // Code injection
    /base64/i  // Potential encoded attacks
  ];

  const requestData = JSON.stringify({
    query: req.query,
    body: req.body,
    headers: req.headers
  });

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(requestData));

  if (isSuspicious) {
    serverMonitoring.logSuspiciousActivity(clientIP, 'suspicious_request_pattern', {
      path,
      userAgent,
      query: req.query,
      method: req.method,
      matchedPatterns: suspiciousPatterns.filter(p => p.test(requestData)).map(p => p.toString())
    });
  }

  // Monitor authentication attempts
  if (path.includes('/auth/login') && req.method === 'POST') {
    // This will be handled by the auth route, but we can add additional monitoring here
    logger.debug('Login attempt detected', { ip: clientIP, userAgent });
  }

  next();
};

// Performance monitoring middleware
export const performanceMonitoringMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  // Override res.end to measure performance
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Track performance metrics
    if (durationMs > 1000) { // Log requests taking more than 1 second
      logger.warn(`Performance: Slow request ${req.method} ${req.path}`, {
        duration: `${durationMs.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }

    originalEnd.apply(this, args);
  };

  next();
};

// Combined monitoring middleware
export const monitoringMiddleware = [
  requestTrackingMiddleware,
  securityMonitoringMiddleware,
  performanceMonitoringMiddleware
];
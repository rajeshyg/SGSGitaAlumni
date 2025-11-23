---
title: Monitoring & Observability
version: 1.0
status: active
last_updated: 2025-11-23
category: deployment
---

# Monitoring & Observability

## Error Tracking with Sentry

### Configuration

Install and configure Sentry:
```bash
npm install @sentry/node @sentry/react
```

Backend setup:
```javascript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});
```

Frontend setup:
```javascript
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE
});
```

### Key Metrics to Track
- Unhandled exceptions
- API error rates
- Response time percentiles (p50, p95, p99)
- User-facing errors

## Logging

For detailed logging architecture, see: `/docs/specs/technical/architecture/logging.md`

### Current Implementation

The server uses console-based logging with structured output:

```javascript
// Process-level error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
});
```

### Log Levels
- **ERROR**: Unhandled exceptions, failed operations
- **WARN**: Rate limits, deprecated features
- **INFO**: Server startup, connections
- **DEBUG**: Request/response details (dev only)

## Alerting

### Recommended Alerting Rules

| Alert | Condition | Severity |
|-------|-----------|----------|
| High Error Rate | >5% errors in 5min | Critical |
| Slow Response | p95 > 2s | Warning |
| Database Down | Connection failures | Critical |
| Memory Usage | >80% utilization | Warning |
| Rate Limiting | >100 blocks/hour | Info |

### Alert Channels
- **Critical**: PagerDuty / SMS
- **Warning**: Slack / Email
- **Info**: Slack only

## Health Checks

### Endpoints

**GET /api/health**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-23T10:00:00Z",
  "version": "1.0.0"
}
```

**GET /api/test-connection**
```json
{
  "database": "connected",
  "latency_ms": 15
}
```

### Monitoring Endpoints (Admin)

Available at `/api/monitoring/*`:
- `/metrics` - Application metrics
- `/security-events` - Security audit log
- `/system-health` - System status
- `/database` - Database status
- `/performance` - Performance metrics
- `/rate-limits` - Rate limiting status

### Health Check Implementation

From `/routes/health.js`:
```javascript
export const healthCheck = async (req, res) => {
  try {
    // Database connectivity
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.json({ status: 'healthy' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy', error: error.message });
  }
};
```

## Performance Monitoring

### Key Metrics

- **Response Time**: p50, p95, p99
- **Throughput**: Requests per second
- **Error Rate**: Percentage of 5xx responses
- **Active Connections**: Concurrent users
- **Database Pool**: Connection utilization

### Database Pool Monitoring

The server monitors connection pool health:
```javascript
startPoolMonitoring(60000); // Log pool status every minute
```

## Tools Stack

| Tool | Purpose | Status |
|------|---------|--------|
| Sentry | Error tracking | Recommended |
| Prometheus | Metrics collection | Planned |
| Grafana | Visualization | Planned |
| UptimeRobot | Uptime monitoring | Recommended |

## Related Files

- Health routes: `/routes/health.js`
- Monitoring routes: `/routes/monitoring.js`
- Monitoring middleware: `/middleware/monitoring.js`
- Logging architecture: `/docs/specs/technical/architecture/logging.md`

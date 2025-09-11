            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {alertData?.active || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Web Vitals Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Web Vitals Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {performanceData?.webVitalsScores?.FCP?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-xs text-muted-foreground">FCP</div>
                  <Progress
                    value={Math.min((performanceData?.webVitalsScores?.FCP || 0) / 18, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {performanceData?.webVitalsScores?.LCP?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-xs text-muted-foreground">LCP</div>
                  <Progress
                    value={Math.min((performanceData?.webVitalsScores?.LCP || 0) / 25, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {(performanceData?.webVitalsScores?.CLS || 0).toFixed(3)}
                  </div>
                  <div className="text-xs text-muted-foreground">CLS</div>
                  <Progress
                    value={Math.min((performanceData?.webVitalsScores?.CLS || 0) * 1000, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {performanceData?.webVitalsScores?.FID?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-xs text-muted-foreground">FID</div>
                  <Progress
                    value={Math.min((performanceData?.webVitalsScores?.FID || 0) / 10, 100)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">
                  {performanceData?.averageResponseTime?.toFixed(0) || 0}ms
                </div>
                <p className="text-sm text-muted-foreground">
                  Average response time (last hour)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Slow Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {performanceData?.topSlowPages?.slice(0, 3).map((page: any, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate">{page.url}</span>
                      <Badge variant="outline">
                        {page.averageTime.toFixed(0)}ms
                      </Badge>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No data available</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {errorData?.errorRate?.toFixed(1) || 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Errors per hour
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Errors by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(errorData?.bySeverity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <Badge variant={
                        severity === 'critical' ? 'destructive' :
                        severity === 'high' ? 'destructive' :
                        severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {severity}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Error Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {errorData?.topErrors?.slice(0, 3).map((error: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="truncate font-medium">{error.message}</div>
                      <div className="text-muted-foreground">{error.count} occurrences</div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No errors</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData?.totalEvents || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Tracked interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Session Duration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData?.averageSessionDuration
                    ? `${Math.round(analyticsData.averageSessionDuration / 1000 / 60)}m`
                    : '0m'
                  }
                </div>
                <p className="text-sm text-muted-foreground">
                  Per user session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bounce Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData?.bounceRate?.toFixed(1) || 0}%
                </div>
                <p className="text-sm text-muted-foreground">
                  Single page sessions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Avg Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {analyticsData?.userEngagement?.averageInteractions?.toFixed(1) || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Per user session
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData?.topPages?.slice(0, 5).map((page: any, index: number) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm truncate">{page.path}</span>
                    <Badge variant="outline">{page.views} views</Badge>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No page data</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {alertData?.active || 0}
                </div>
                <p className="text-sm text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alerts by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(alertData?.bySeverity || {}).map(([severity, count]) => (
                    <div key={severity} className="flex justify-between items-center">
                      <Badge variant={
                        severity === 'critical' ? 'destructive' :
                        severity === 'high' ? 'destructive' :
                        severity === 'medium' ? 'secondary' : 'outline'
                      }>
                        {severity}
                      </Badge>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {alertData?.recentAlerts?.slice(0, 3).map((alert: any, index: number) => (
                    <div key={index} className="text-sm">
                      <div className="truncate font-medium">{alert.message}</div>
                      <div className="text-muted-foreground text-xs">
                        {new Date(alert.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )) || <p className="text-sm text-muted-foreground">No recent alerts</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## Success Criteria

### Functional Requirements
- ✅ Real-time performance monitoring operational
- ✅ Error tracking and reporting configured
- ✅ User analytics and behavior tracking implemented
- ✅ Automated alerting system active
- ✅ Monitoring dashboard displaying key metrics
- ✅ Data export and reporting capabilities

### Performance Requirements
- **Monitoring Overhead:** < 5% performance impact
- **Data Transmission:** < 100KB per hour
- **Dashboard Load Time:** < 2 seconds
- **Alert Response Time:** < 30 seconds
- **Data Retention:** 30 days rolling

### Quality Metrics
- **Uptime Monitoring:** 99.9% availability
- **Alert Accuracy:** > 95% true positives
- **Data Completeness:** > 98% metric coverage
- **User Privacy:** 100% GDPR compliance
- **System Reliability:** < 0.1% monitoring failures

## Testing & Validation

### Monitoring System Testing
1. **Performance Metrics Validation**
   - Verify Web Vitals collection accuracy
   - Test custom metric recording
   - Validate data aggregation

2. **Error Tracking Validation**
   - Simulate various error scenarios
   - Test error reporting pipeline
   - Verify error fingerprinting

3. **Analytics Testing**
   - Test user interaction tracking
   - Validate session management
   - Check data export functionality

4. **Alert System Testing**
   - Test alert rule conditions
   - Verify notification delivery
   - Validate alert resolution workflow

### Integration Testing
```typescript
// src/test/monitoring-integration.test.ts

describe('Monitoring Integration', () => {
  beforeEach(() => {
    // Reset monitoring state
    jest.clearAllMocks()
  })

  it('should track page views automatically', () => {
    // Simulate navigation
    window.history.pushState({}, '', '/test-page')

    // Check if page view was tracked
    const events = userAnalytics.getEvents({ event: 'page_view' })
    expect(events.some(e => e.properties.path === '/test-page')).toBe(true)
  })

  it('should capture JavaScript errors', () => {
    // Simulate error
    const error = new Error('Test error')
    window.dispatchEvent(new ErrorEvent('error', { error }))

    // Check if error was captured
    const errors = errorTracker.getErrors()
    expect(errors.some(e => e.message === 'Test error')).toBe(true)
  })

  it('should trigger alerts based on rules', async () => {
    // Simulate high error rate
    for (let i = 0; i < 10; i++) {
      errorTracker.captureError({
        message: `Error ${i}`,
        severity: 'high'
      })
    }

    // Wait for alert check
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if alert was triggered
    const alerts = alertManager.getAlerts({ resolved: false })
    expect(alerts.some(a => a.ruleId === 'high_error_rate')).toBe(true)
  })

  it('should collect performance metrics', () => {
    // Record a custom metric
    performanceMonitor.recordMetric('test_metric', 123, { source: 'test' })

    // Check if metric was recorded
    const metrics = performanceMonitor.getMetrics('test_metric')
    expect(metrics.length).toBeGreaterThan(0)
    expect(metrics[0].value).toBe(123)
  })
})
```

## Configuration & Setup

### Environment Variables
```bash
# .env.local
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
VITE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
VITE_ALERT_WEBHOOK_URL=https://your-webhook-endpoint
VITE_MONITORING_API_URL=https://api.monitoring.yourdomain.com
```

### API Endpoints Setup
```typescript
// src/lib/monitoring/api.ts

const API_BASE_URL = import.meta.env.VITE_MONITORING_API_URL

export const monitoringApi = {
  async sendMetrics(metrics: any[]) {
    return fetch(`${API_BASE_URL}/metrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics })
    })
  },

  async sendErrors(errors: any[]) {
    return fetch(`${API_BASE_URL}/errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors })
    })
  },

  async sendAnalytics(events: any[]) {
    return fetch(`${API_BASE_URL}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events })
    })
  },

  async getDashboardData() {
    return fetch(`${API_BASE_URL}/dashboard`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    })
  }
}
```

## Privacy & Compliance

### Data Collection Compliance
- **GDPR Compliance:** User consent required for analytics
- **Data Minimization:** Only collect necessary data
- **Retention Limits:** Automatic data cleanup after 30 days
- **Anonymization:** User data hashed and anonymized

### User Consent Management
```typescript
// src/lib/consent/ConsentManager.ts

export class ConsentManager {
  private consent: {
    analytics: boolean
    performance: boolean
    errorTracking: boolean
  } = {
    analytics: false,
    performance: false,
    errorTracking: false
  }

  constructor() {
    this.loadConsent()
  }

  private loadConsent() {
    const stored = localStorage.getItem('user_consent')
    if (stored) {
      this.consent = { ...this.consent, ...JSON.parse(stored) }
    }
  }

  setConsent(type: keyof typeof this.consent, value: boolean) {
    this.consent[type] = value
    localStorage.setItem('user_consent', JSON.stringify(this.consent))

    // Update monitoring based on consent
    this.updateMonitoringConsent()
  }

  getConsent(type: keyof typeof this.consent): boolean {
    return this.consent[type]
  }

  private updateMonitoringConsent() {
    // Enable/disable monitoring based on consent
    if (this.consent.analytics) {
      userAnalytics.enableTracking()
    } else {
      userAnalytics.disableTracking()
    }

    if (this.consent.performance) {
      performanceMonitor.enableTracking()
    } else {
      performanceMonitor.disableTracking()
    }

    if (this.consent.errorTracking) {
      errorTracker.enableTracking()
    } else {
      errorTracker.disableTracking()
    }
  }

  showConsentDialog() {
    // Implementation for consent dialog
    console.log('Showing consent dialog')
  }
}

export const consentManager = new ConsentManager()
```

## Next Steps

1. **Infrastructure Setup** - Configure monitoring backend services
2. **Alert Configuration** - Set up alert rules and notification channels
3. **Dashboard Deployment** - Deploy monitoring dashboard
4. **User Consent** - Implement consent management flow
5. **Performance Baselines** - Establish performance baselines
6. **Documentation** - Create monitoring runbooks and procedures

## Risk Mitigation

### Common Issues
1. **Performance Impact** - Monitor and optimize monitoring overhead
2. **Data Privacy** - Ensure compliance with privacy regulations
3. **Alert Fatigue** - Tune alert thresholds to reduce false positives
4. **Data Loss** - Implement data backup and recovery
5. **System Reliability** - Monitor monitoring system itself

### Monitoring the Monitoring System
- Set up health checks for monitoring services
- Implement monitoring system redundancy
- Create monitoring failure alerts
- Regular monitoring system audits

---

*Task 6.5: Monitoring & Performance Tracking - Last updated: September 11, 2025*
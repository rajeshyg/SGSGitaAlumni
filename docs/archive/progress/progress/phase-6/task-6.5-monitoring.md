# Task 6.5: Monitoring & Analytics Integration

## Status
- **Status:** 🔴 Pending
- **Estimated Effort:** 4-5 days
- **Priority:** High
- **Dependencies:** Task 6.1 (QA Framework)

## Overview

Implement comprehensive monitoring and analytics system for real-time performance tracking, error monitoring, user behavior analytics, and automated alerting. This task establishes the foundation for data-driven optimization and proactive issue resolution.

## Objectives

### **Primary Goals**
- Implement real-time performance monitoring
- Set up error tracking and reporting
- Configure user analytics and behavior tracking
- Establish automated alerting system
- Create monitoring dashboard
- Ensure privacy compliance and data protection

### **Key Components**
1. **Performance Monitoring** - Web Vitals, load times, resource usage
2. **Error Tracking** - JavaScript errors, API failures, user-reported issues
3. **User Analytics** - Page views, user flows, feature usage
4. **Alerting System** - Real-time notifications for critical issues
5. **Dashboard Interface** - Visual monitoring and reporting
6. **Privacy Controls** - GDPR compliance and user consent management

## Implementation Plan

### Phase 1: Core Monitoring Setup (Days 1-2)

#### Performance Monitoring Integration
```typescript
// src/lib/monitoring/performance.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export class PerformanceMonitor {
  private metrics: Map<string, number> = new Map()
  private reportingEndpoint: string

  constructor(endpoint: string) {
    this.reportingEndpoint = endpoint
    this.initializeWebVitals()
  }

  private initializeWebVitals() {
    getCLS(this.handleMetric.bind(this))
    getFID(this.handleMetric.bind(this))
    getFCP(this.handleMetric.bind(this))
    getLCP(this.handleMetric.bind(this))
    getTTFB(this.handleMetric.bind(this))
  }

  private handleMetric(metric: any) {
    this.metrics.set(metric.name, metric.value)

    // Report to analytics service
    this.reportMetric({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    })
  }

  private async reportMetric(data: any) {
    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.warn('Failed to report metric:', error)
    }
  }

  public getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics)
  }
}
```

#### Error Tracking Setup
```typescript
// src/lib/monitoring/errorTracking.ts
export class ErrorTracker {
  private errorEndpoint: string
  private maxErrors: number = 50
  private errorCount: number = 0

  constructor(endpoint: string) {
    this.errorEndpoint = endpoint
    this.setupGlobalErrorHandlers()
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
        timestamp: Date.now(),
        url: window.location.href
      })
    })

    // Promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.message || 'Unhandled promise rejection',
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href
      })
    })

    // React error boundary integration
    this.setupReactErrorBoundary()
  }

  private setupReactErrorBoundary() {
    // Integration with React Error Boundary
    window.__REACT_ERROR_OVERLAY_GLOBAL_HOOK__ = {
      onError: (error: Error, errorInfo: any) => {
        this.captureError({
          type: 'react',
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          timestamp: Date.now(),
          url: window.location.href
        })
      }
    }
  }

  public captureError(errorData: any) {
    if (this.errorCount >= this.maxErrors) {
      return // Prevent spam
    }

    this.errorCount++
    this.reportError(errorData)
  }

  private async reportError(errorData: any) {
    try {
      await fetch(this.errorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...errorData,
          userAgent: navigator.userAgent,
          sessionId: this.getSessionId()
        })
      })
    } catch (error) {
      console.warn('Failed to report error:', error)
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('monitoring-session-id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('monitoring-session-id', sessionId)
    }
    return sessionId
  }
}
```

### Phase 2: Analytics & User Tracking (Day 3)

#### User Analytics Implementation
```typescript
// src/lib/monitoring/analytics.ts
export class UserAnalytics {
  private analyticsEndpoint: string
  private sessionData: any = {}
  private pageViews: any[] = []

  constructor(endpoint: string) {
    this.analyticsEndpoint = endpoint
    this.initializeSession()
    this.trackPageViews()
  }

  private initializeSession() {
    this.sessionData = {
      sessionId: this.getSessionId(),
      userId: this.getUserId(),
      startTime: Date.now(),
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  }

  private trackPageViews() {
    // Initial page view
    this.trackPageView()

    // SPA navigation tracking
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = (...args) => {
      originalPushState.apply(history, args)
      this.trackPageView()
    }

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args)
      this.trackPageView()
    }

    window.addEventListener('popstate', () => {
      this.trackPageView()
    })
  }

  public trackPageView() {
    const pageView = {
      url: window.location.href,
      title: document.title,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId
    }

    this.pageViews.push(pageView)
    this.reportEvent('page_view', pageView)
  }

  public trackEvent(eventName: string, properties: any = {}) {
    const event = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      url: window.location.href
    }

    this.reportEvent(eventName, event)
  }

  private async reportEvent(eventType: string, eventData: any) {
    try {
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: eventType,
          data: eventData,
          session: this.sessionData
        })
      })
    } catch (error) {
      console.warn('Failed to report analytics event:', error)
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics-session-id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('analytics-session-id', sessionId)
    }
    return sessionId
  }

  private getUserId(): string | null {
    return localStorage.getItem('user-id') || null
  }
}
```

### Phase 3: Monitoring Dashboard (Day 4)

#### Dashboard Component
```tsx
// src/components/monitoring/MonitoringDashboard.tsx
import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MonitoringData {
  performance: {
    webVitalsScores: {
      FCP: number
      LCP: number
      CLS: number
      FID: number
      TTFB: number
    }
    pageLoadTime: number
    resourceCount: number
  }
  errors: {
    total: number
    recent: any[]
    byType: Record<string, number>
  }
  analytics: {
    activeUsers: number
    pageViews: number
    sessionDuration: number
    bounceRate: number
  }
  alerts: {
    active: number
    recent: any[]
  }
}

export function MonitoringDashboard() {
  const [data, setData] = useState<MonitoringData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMonitoringData()
    const interval = setInterval(fetchMonitoringData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/monitoring/dashboard')
      if (!response.ok) throw new Error('Failed to fetch monitoring data')
      const monitoringData = await response.json()
      setData(monitoringData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Loading monitoring data...</div>
  if (error) return <Alert><AlertDescription>Error: {error}</AlertDescription></Alert>
  if (!data) return <div>No monitoring data available</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Monitoring Dashboard</h1>
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.analytics?.activeUsers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.performance?.pageLoadTime?.toFixed(0) || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Average load time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.errors?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Errors in last 24h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.alerts?.active || 0}
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
                    {data.performance?.webVitalsScores?.FCP?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-xs text-muted-foreground">FCP</div>
                  <Progress
                    value={Math.min((data.performance?.webVitalsScores?.FCP || 0) / 18, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {data.performance?.webVitalsScores?.LCP?.toFixed(0) || 0}ms
                  </div>
                  <div className="text-xs text-muted-foreground">LCP</div>
                  <Progress
                    value={Math.min((data.performance?.webVitalsScores?.LCP || 0) / 25, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {(data.performance?.webVitalsScores?.CLS || 0).toFixed(3)}
                  </div>
                  <div className="text-xs text-muted-foreground">CLS</div>
                  <Progress
                    value={Math.min((data.performance?.webVitalsScores?.CLS || 0) * 1000, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {(data.performance?.webVitalsScores?.FID || 0).toFixed(0)}ms
                  </div>
                  <div className="text-xs text-muted-foreground">FID</div>
                  <Progress
                    value={Math.min((data.performance?.webVitalsScores?.FID || 0) / 100, 100)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.alerts?.recent?.map((alert, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                    <span className="text-sm">{alert.message}</span>
                    <span className="text-xs text-muted-foreground">{alert.timestamp}</span>
                  </div>
                )) || <p className="text-sm text-muted-foreground">No recent alerts</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

#### Additional Dashboard Components

The monitoring dashboard includes additional components for comprehensive tracking:

- **Performance Metrics**: Web Vitals tracking (FCP, LCP, CLS)
- **Error Tracking**: Real-time error monitoring and reporting
- **User Analytics**: Page views, unique users, session duration
- **Alert Management**: Active and recent alerts display
- **Behavior Flow**: User journey tracking and analysis

The dashboard provides a comprehensive view of application health and user experience metrics.


## Success Criteria
- ✅ Real-time performance monitoring operational
- ✅ Error tracking and reporting configured
- ✅ User analytics and behavior tracking implemented
- ✅ Automated alerting system active
- ✅ Monitoring dashboard displaying key metrics
- ✅ Data export and reporting capabilities
- ✅ Monitoring overhead under 5% performance impact
- ✅ Dashboard load time under 2 seconds
- ✅ Alert accuracy above 95%
- ✅ System reliability above 99.9%

## Quality Requirements
- **Monitoring Overhead:** < 5% performance impact
- **Data Transmission:** < 100KB per hour
- **Dashboard Load Time:** < 2 seconds
- **Alert Response Time:** < 30 seconds
- **Data Retention:** 30 days rolling
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
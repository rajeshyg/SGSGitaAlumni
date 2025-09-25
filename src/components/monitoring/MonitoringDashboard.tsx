import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { performanceMonitor } from '@/lib/monitoring/performance'
import { userAnalytics } from '@/lib/monitoring/analytics'
import { logger } from '@/lib/monitoring'

interface MonitoringData {
  performance: {
    webVitalsScores: {
      FCP?: number
      LCP?: number
      CLS?: number
      FID?: number
    }
    pageLoadTime: number
    resourceCount: number
  }
  errors: {
    total: number
    recent: any[]
  }
  analytics: {
    activeUsers: number
    pageViews: number
    sessionDuration: number
    uniquePages: number
  }
  alerts: any[]
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

  const fetchMonitoringData = () => {
    try {
      // Gather performance metrics
      const performanceMetrics = performanceMonitor.getMetrics()
      const webVitalsScores: any = {}

      performanceMetrics.forEach(metric => {
        if (['FCP', 'LCP', 'CLS', 'FID'].includes(metric.name)) {
          webVitalsScores[metric.name] = metric.value
        }
      })

      // Gather analytics data
      const analyticsEvents = userAnalytics.getEvents()
      const pageViews = analyticsEvents.filter(e => e.name === 'page_view').length
      const uniquePages = userAnalytics.getUniquePages().length
      const sessionDuration = userAnalytics.getSessionDuration()

      // Gather error data (simplified)
      const errorEvents = analyticsEvents.filter(e => e.name === 'error')

      const monitoringData: MonitoringData = {
        performance: {
          webVitalsScores,
          pageLoadTime: webVitalsScores.LCP || 0,
          resourceCount: performanceMetrics.filter(m => m.name === 'resource_count').length || 0
        },
        errors: {
          total: errorEvents.length,
          recent: errorEvents.slice(-5)
        },
        analytics: {
          activeUsers: 1, // Simplified - would need real user tracking
          pageViews,
          sessionDuration,
          uniquePages
        },
        alerts: [] // Would be populated by alert system
      }

      setData(monitoringData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      logger.error('Failed to fetch monitoring data', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-6">Loading monitoring data...</div>
  if (error) return <div className="p-6 bg-red-50 border border-red-200 rounded text-red-800">Error: {error}</div>
  if (!data) return <div className="p-6">No monitoring data available</div>

  return (
    <div className="p-6 space-y-6">
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
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Page Views</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.analytics?.pageViews || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  This session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Load Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.performance?.pageLoadTime?.toFixed(0) || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  Largest Contentful Paint
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {data.errors?.total || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  This session
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Session Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round((data.analytics?.sessionDuration || 0) / 1000 / 60)}m
                </div>
                <p className="text-xs text-muted-foreground">
                  Current session
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
                    {data.performance?.webVitalsScores?.FCP?.toFixed(0) || 'N/A'}ms
                  </div>
                  <div className="text-xs text-muted-foreground">FCP</div>
                  <Progress
                    value={Math.min((data.performance?.webVitalsScores?.FCP || 0) / 18, 100)}
                    className="mt-1"
                  />
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {data.performance?.webVitalsScores?.LCP?.toFixed(0) || 'N/A'}ms
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
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMonitor.getMetrics().map((metric, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium">{metric.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {metric.value.toFixed(2)} ({metric.rating})
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Unique Pages Visited</span>
                  <span className="font-medium">{data.analytics.uniquePages}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Events</span>
                  <span className="font-medium">{userAnalytics.getEvents().length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.errors.recent.map((error, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded text-sm">
                    {error.properties?.message || 'Unknown error'}
                  </div>
                ))}
                {data.errors.recent.length === 0 && (
                  <p className="text-sm text-muted-foreground">No recent errors</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
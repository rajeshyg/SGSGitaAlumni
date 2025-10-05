import { config } from '../../config/environments'

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  url: string
  userAgent: string
}

export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map()
  private reportingEndpoint: string
  private maxMetricsPerType: number = 100

  constructor(endpoint?: string) {
    this.reportingEndpoint = endpoint || '/api/monitoring/metrics'
    this.initializePerformanceMonitoring()
    this.initializeCustomMetrics()
  }

  private initializePerformanceMonitoring() {
    if (typeof window === 'undefined') return

    // Monitor navigation timing
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.recordNavigationTiming()
      }, 0)
    })

    // Monitor resource loading
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.recordResourceTiming()
      }, 100)
    })

    // Monitor paint timing
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.handleMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            rating: this.getRating(lastEntry.startTime, 2500)
          })
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            this.handleMetric({
              name: 'FID',
              value: entry.processingStart - entry.startTime,
              rating: this.getRating(entry.processingStart - entry.startTime, 100)
            })
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })

        // Cumulative Layout Shift
        const clsObserver = new PerformanceObserver((list) => {
          let clsValue = 0
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          })
          this.handleMetric({
            name: 'CLS',
            value: clsValue,
            rating: this.getRating(clsValue, 0.1)
          })
        })
        clsObserver.observe({ entryTypes: ['layout-shift'] })

      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Performance monitoring setup failed:', error)
      }
    }
  }

  private initializeCustomMetrics() {
    if (typeof window === 'undefined') return

    // Monitor First Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.handleMetric({
                name: 'FCP',
                value: entry.startTime,
                rating: this.getRating(entry.startTime, 1800)
              })
            }
          })
        })
        fcpObserver.observe({ entryTypes: ['paint'] })
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('FCP monitoring setup failed:', error)
      }
    }
  }

  private handleMetric(metric: any) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.storeMetric(performanceMetric)
    this.reportMetric(performanceMetric)
  }

  private recordNavigationTiming() {
    if (!performance.timing) return

    const timing = performance.timing
    const navigationStart = timing.navigationStart

    const metrics = [
      {
        name: 'dom_content_loaded',
        value: timing.domContentLoadedEventEnd - navigationStart,
        rating: this.getRating(timing.domContentLoadedEventEnd - navigationStart, 1500)
      },
      {
        name: 'load_complete',
        value: timing.loadEventEnd - navigationStart,
        rating: this.getRating(timing.loadEventEnd - navigationStart, 2500)
      },
      {
        name: 'first_paint',
        value: (performance as any).getEntriesByType('paint').find((p: any) => p.name === 'first-paint')?.startTime || 0,
        rating: this.getRating((performance as any).getEntriesByType('paint').find((p: any) => p.name === 'first-paint')?.startTime || 0, 1000)
      }
    ]

    metrics.forEach(metric => {
      if (metric.value > 0) {
        const perfMetric: PerformanceMetric = {
          ...metric,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent
        }
        this.storeMetric(perfMetric)
        this.reportMetric(perfMetric)
      }
    })
  }

  private recordResourceTiming() {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    const resourceCount = resources.length

    // Record resource count
    const resourceMetric: PerformanceMetric = {
      name: 'resource_count',
      value: resourceCount,
      rating: resourceCount > 50 ? 'poor' : resourceCount > 20 ? 'needs-improvement' : 'good',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.storeMetric(resourceMetric)
    this.reportMetric(resourceMetric)

    // Record largest contentful paint if available
    const lcpEntries = (performance as any).getEntriesByType('largest-contentful-paint')
    if (lcpEntries.length > 0) {
      const lcp = lcpEntries[lcpEntries.length - 1]
      const lcpMetric: PerformanceMetric = {
        name: 'largest_contentful_paint',
        value: lcp.startTime,
        rating: this.getRating(lcp.startTime, 2500),
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent
      }
      this.storeMetric(lcpMetric)
      this.reportMetric(lcpMetric)
    }
  }

  private getRating(value: number, threshold: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= threshold * 0.75) return 'good'
    if (value <= threshold * 1.25) return 'needs-improvement'
    return 'poor'
  }

  public recordCustomMetric(name: string, value: number, properties?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      rating: 'good', // Custom metrics don't have ratings by default
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      ...properties
    }

    this.storeMetric(metric)
    this.reportMetric(metric)
  }

  private storeMetric(metric: PerformanceMetric) {
    const existing = this.metrics.get(metric.name) || []
    existing.push(metric)

    // Keep only the most recent metrics
    if (existing.length > this.maxMetricsPerType) {
      existing.shift()
    }

    this.metrics.set(metric.name, existing)
  }

  private async reportMetric(metric: PerformanceMetric) {
    if (!config.analyticsId && !this.reportingEndpoint.includes('localhost')) return

    try {
      await fetch(this.reportingEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to report performance metric:', error)
    }
  }

  public getMetrics(metricName?: string): PerformanceMetric[] {
    if (metricName) {
      return this.metrics.get(metricName) || []
    }

    const allMetrics: PerformanceMetric[] = []
    this.metrics.forEach(metrics => allMetrics.push(...metrics))
    return allMetrics.sort((a, b) => b.timestamp - a.timestamp)
  }

  public getLatestMetric(metricName: string): PerformanceMetric | null {
    const metrics = this.metrics.get(metricName) || []
    return metrics.length > 0 ? metrics[metrics.length - 1] : null
  }

  public getAverageMetric(metricName: string, timeRange?: number): number {
    const metrics = this.metrics.get(metricName) || []
    let filteredMetrics = metrics

    if (timeRange) {
      const cutoff = Date.now() - timeRange
      filteredMetrics = metrics.filter(m => m.timestamp >= cutoff)
    }

    if (filteredMetrics.length === 0) return 0

    const sum = filteredMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / filteredMetrics.length
  }

  public clearMetrics() {
    this.metrics.clear()
  }
}

export const performanceMonitor = new PerformanceMonitor()
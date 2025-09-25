import { config } from '@/config/environments'

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp: number
  sessionId: string
  url: string
}

export class UserAnalytics {
  private analyticsEndpoint: string
  private sessionData: any = {}
  private events: AnalyticsEvent[] = []
  private maxEvents: number = 1000

  constructor(endpoint?: string) {
    this.analyticsEndpoint = endpoint || '/api/monitoring/analytics'
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
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`
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
    this.trackEvent('page_view', {
      url: window.location.href,
      title: document.title,
      path: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash
    })
  }

  public trackEvent(eventName: string, properties: Record<string, any> = {}) {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      url: window.location.href
    }

    this.events.push(event)

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events.shift()
    }

    this.reportEvent(event)
  }

  public trackUserInteraction(element: string, action: string, properties?: Record<string, any>) {
    this.trackEvent('user_interaction', {
      element,
      action,
      ...properties
    })
  }

  public trackError(error: Error, context?: Record<string, any>) {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      ...context
    })
  }

  private async reportEvent(event: AnalyticsEvent) {
    if (!config.analyticsId && !this.analyticsEndpoint.includes('localhost')) return

    try {
      await fetch(this.analyticsEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          session: this.sessionData
        })
      })
    } catch (error) {
      // eslint-disable-next-line no-console
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

  public getEvents(eventName?: string): AnalyticsEvent[] {
    if (eventName) {
      return this.events.filter(e => e.name === eventName)
    }
    return [...this.events]
  }

  public getSessionDuration(): number {
    return Date.now() - this.sessionData.startTime
  }

  public getPageViews(): number {
    return this.events.filter(e => e.name === 'page_view').length
  }

  public getUniquePages(): string[] {
    const pageViews = this.events.filter(e => e.name === 'page_view')
    return [...new Set(pageViews.map(e => e.properties?.path || e.url))]
  }

  public clearEvents() {
    this.events = []
  }
}

export const userAnalytics = new UserAnalytics()
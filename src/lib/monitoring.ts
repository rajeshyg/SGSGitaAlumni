import * as Sentry from '@sentry/react'
import { config } from '@/config/environments'

export function initializeMonitoring() {
  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.BrowserTracing({
          tracePropagationTargets: ['localhost', /^https:\/\/.*\.sgs-gita-alumni\.com/],
        }),
        new Sentry.Replay(),
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${message}`, ...args)
    if (config.sentryDsn) {
      Sentry.addBreadcrumb({
        message,
        level: 'info',
        data: args.length > 0 ? { args } : undefined,
      })
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${message}`, ...args)
    if (config.sentryDsn) {
      Sentry.addBreadcrumb({
        message,
        level: 'warning',
        data: args.length > 0 ? { args } : undefined,
      })
    }
  },
  error: (message: string, ...args: unknown[]) => {
    console.error(`[ERROR] ${message}`, ...args)
    if (config.sentryDsn) {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: args.length > 0 ? { args } : undefined,
      })
    }
  }
}

export function logError(error: Error, context?: Record<string, any>) {
  console.error('Application Error:', error)
  if (config.sentryDsn) {
    Sentry.captureException(error, { extra: context })
  }
}

export function logEvent(event: string, properties?: Record<string, any>) {
  console.log(`Event: ${event}`, properties)
  if (config.sentryDsn) {
    Sentry.addBreadcrumb({
      message: event,
      level: 'info',
      data: properties,
    })
  }
}

export const performanceMonitor = {
  start: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-start`)
    }
  },
  end: (label: string) => {
    if (typeof performance !== 'undefined') {
      performance.mark(`${label}-end`)
      try {
        performance.measure(label, `${label}-start`, `${label}-end`)
        const measure = performance.getEntriesByName(label)[0]
        if (measure) {
          logger.info(`Performance: ${label} took ${measure.duration.toFixed(2)}ms`)
        }
      } catch (error) {
        logger.warn(`Performance measurement failed for ${label}:`, error)
      }
    }
  }
}
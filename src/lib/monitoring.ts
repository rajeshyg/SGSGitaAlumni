import * as Sentry from '@sentry/react'
import { config } from '@/config/environments'

// Helper to send logs to backend terminal in development
function sendToDevBackend(type: 'ERROR' | 'WARN' | 'UNCAUGHT', message: string, stack?: string) {
  if (import.meta.env.PROD) return;

  // Debounce/Throttle could be added here if needed
  try {
    fetch('/api/dev/client-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type, 
        message: String(message), 
        stack: stack 
      })
    }).catch(() => { /* Ignore network errors to avoid loops */ });
  } catch (e) { /* Ignore */ }
}

export function initializeMonitoring() {
  if (config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      integrations: [
        // BrowserTracing and Replay integrations removed due to version compatibility
        // These can be added back when Sentry packages are updated
      ],
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    })
  }

  // Hook into global errors only in development
  if (import.meta.env.DEV) {
    window.onerror = (message, source, lineno, colno, error) => {
      sendToDevBackend('UNCAUGHT', `In ${source}:${lineno}`, error?.stack || String(message));
      return false; // Let default handler run
    };

    window.onunhandledrejection = (event) => {
      sendToDevBackend('UNCAUGHT', 'Unhandled Promise Rejection', String(event.reason));
    };
    
    console.log('🔌 [Dev] Client logging bridge active');
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
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
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`, ...args)
    // Also send warnings to backend for visibility
    sendToDevBackend('WARN', message);

    if (config.sentryDsn) {
      Sentry.addBreadcrumb({
        message,
        level: 'warning',
        data: args.length > 0 ? { args } : undefined,
      })
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`, ...args)
    
    // Send to backend
    const stack = args.find(a => a instanceof Error) ? (args.find(a => a instanceof Error) as Error).stack : undefined;
    sendToDevBackend('ERROR', message, stack);

    if (config.sentryDsn) {
      Sentry.captureMessage(message, {
        level: 'error',
        extra: args.length > 0 ? { args } : undefined,
      })
    }
  }
}

export function logError(error: Error, context?: Record<string, any>) {
  // eslint-disable-next-line no-console
  console.error('Application Error:', error)
  
  // Send to backend
  sendToDevBackend('ERROR', error.message, error.stack);

  if (config.sentryDsn) {
    Sentry.captureException(error, { extra: context })
  }
}

export function logEvent(event: string, properties?: Record<string, any>) {
  // eslint-disable-next-line no-console
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
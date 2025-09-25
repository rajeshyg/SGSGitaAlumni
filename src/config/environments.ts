interface EnvironmentConfig {
  apiUrl: string
  environment: 'development' | 'staging' | 'production'
  sentryDsn?: string
  analyticsId?: string
  featureFlags: Record<string, boolean>
}

const configs: Record<string, EnvironmentConfig> = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    environment: 'development',
    featureFlags: {
      debugMode: true,
      analytics: false,
      errorReporting: false
    }
  },
  staging: {
    apiUrl: 'https://api-staging.sgs-gita-alumni.com',
    environment: 'staging',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN_STAGING,
    analyticsId: import.meta.env.VITE_ANALYTICS_ID_STAGING,
    featureFlags: {
      debugMode: false,
      analytics: true,
      errorReporting: true
    }
  },
  production: {
    apiUrl: 'https://api.sgs-gita-alumni.com',
    environment: 'production',
    sentryDsn: import.meta.env.VITE_SENTRY_DSN_PRODUCTION,
    analyticsId: import.meta.env.VITE_ANALYTICS_ID_PRODUCTION,
    featureFlags: {
      debugMode: false,
      analytics: true,
      errorReporting: true
    }
  }
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const env = import.meta.env.VITE_ENVIRONMENT || 'development'
  return configs[env] || configs.development
}

export const config = getEnvironmentConfig()
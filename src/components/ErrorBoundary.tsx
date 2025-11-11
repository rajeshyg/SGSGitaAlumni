import React, { Component, type ReactNode, type ErrorInfo } from 'react'
import * as Sentry from '@sentry/react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: ReactNode
  level?: 'app' | 'page' | 'feature'
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Send error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
      tags: {
        component: 'ErrorBoundary',
        boundary_type: 'react_error_boundary',
        boundary_level: this.props.level || 'default'
      }
    })

    // Also log to console in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[ErrorBoundary] Caught an error:', {
        level: this.props.level || 'default',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      })
    }

    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    window.history.back()
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Level-specific fallbacks
      const level = this.props.level || 'default'

      // App-level fallback (catastrophic errors)
      if (level === 'app') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md p-8 text-center border border-border rounded-lg bg-card">
              <div className="w-16 h-16 text-destructive mx-auto mb-4 flex items-center justify-center">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-2 text-foreground">
                Something went wrong
              </h1>
              <p className="text-muted-foreground mb-6">
                We encountered an unexpected error. Please try reloading the page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-4 p-3 bg-destructive/10 rounded text-left text-sm">
                  <p className="font-semibold text-destructive">Error:</p>
                  <p className="text-muted-foreground break-all">{this.state.error.message}</p>
                </div>
              )}
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={this.handleRetry}>
                  Try Again
                </Button>
                <Button onClick={this.handleReload}>
                  Reload Page
                </Button>
              </div>
            </div>
          </div>
        )
      }

      // Page-level fallback
      if (level === 'page') {
        return (
          <div className="container mx-auto py-12 px-4">
            <div className="max-w-2xl mx-auto p-8 text-center border border-border rounded-lg bg-card">
              <div className="w-12 h-12 text-warning mx-auto mb-4 flex items-center justify-center">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2 text-foreground">
                Page Error
              </h2>
              <p className="text-muted-foreground mb-4">
                This page encountered an error. You can try again or return to a previous page.
              </p>
              {import.meta.env.DEV && this.state.error && (
                <div className="mb-4 p-3 bg-destructive/10 rounded text-left text-sm">
                  <p className="font-semibold text-destructive">Error:</p>
                  <p className="text-muted-foreground break-all">{this.state.error.message}</p>
                </div>
              )}
              <div className="flex gap-4 justify-center flex-wrap">
                <Button variant="outline" onClick={this.handleGoBack}>
                  Go Back
                </Button>
                <Button variant="outline" onClick={this.handleRetry}>
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome}>
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        )
      }

      // Feature-level fallback
      if (level === 'feature') {
        return (
          <div className="p-6 border border-border rounded-lg bg-card">
            <div className="w-10 h-10 text-warning mx-auto mb-3 flex items-center justify-center">
              <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground text-center">
              Feature Error
            </h3>
            <p className="text-muted-foreground mb-4 text-center text-sm">
              This feature encountered an error. Please try again.
            </p>
            {import.meta.env.DEV && this.state.error && (
              <div className="mb-4 p-3 bg-destructive/10 rounded text-left text-xs">
                <p className="font-semibold text-destructive">Error:</p>
                <p className="text-muted-foreground break-all">{this.state.error.message}</p>
              </div>
            )}
            <div className="flex justify-center">
              <Button variant="outline" onClick={this.handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        )
      }

      // Default fallback
      return (
        <div className="min-h-[200px] flex items-center justify-center border rounded-lg bg-destructive/5 p-6">
          <div className="text-center space-y-4">
            <div className="text-destructive">
              <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
            <Button onClick={this.handleRetry} variant="outline">
              Try Again
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: { componentStack?: string }) => {
    // Send error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo?.componentStack,
        },
      },
      tags: {
        component: 'useErrorHandler',
        boundary_type: 'functional_error_handler'
      }
    })

    // Also log to console in development
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[useErrorHandler] Caught an error:', {
        error: error?.message || 'Unknown error',
        stack: error?.stack,
        componentStack: errorInfo?.componentStack
      })
    }
  }
}
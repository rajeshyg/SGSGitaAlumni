// ============================================================================
// MONITORING MODULE
// ============================================================================
// Centralized monitoring and error tracking utilities

export * from './analytics';
export * from './performance';

/**
 * Initialize monitoring services
 */
export function initializeMonitoring(): void {
  console.log('[Monitoring] Initializing monitoring services...');

  // Setup global error handlers
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      console.error('[Monitoring] Global error:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
      console.error('[Monitoring] Unhandled promise rejection:', event.reason);
    });
  }

  console.log('[Monitoring] Monitoring services initialized');
}
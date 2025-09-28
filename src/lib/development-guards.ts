/**
 * Development-time Mock Data Detection Guards
 * Runtime detection to identify mock data usage during development
 * Part of Zero Tolerance Mock Data Policy
 */

export class MockDataGuard {
  private static violations: Array<{
    type: string;
    message: string;
    stackTrace: string;
    timestamp: Date;
  }> = [];

  private static isEnabled: boolean = import.meta.env.DEV;

  /**
   * Enable or disable mock data detection
   */
  static setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Report a mock data violation
   */
  static reportViolation(type: string, message: string) {
    if (!this.isEnabled) return;

    const violation = {
      type,
      message,
      stackTrace: new Error().stack || 'Stack trace unavailable',
      timestamp: new Date()
    };

    this.violations.push(violation);

    // Log to console with clear warning
    console.error('🚫 MOCK DATA VIOLATION DETECTED:');
    console.error(`Type: ${type}`);
    console.error(`Message: ${message}`);
    console.error(`Time: ${violation.timestamp.toISOString()}`);
    console.error('Stack Trace:', violation.stackTrace);
    console.error('='.repeat(50));

    // Show user-friendly message
    this.showUserNotification(type, message);
  }

  /**
   * Show user-friendly notification about mock data usage
   */
  private static showUserNotification(type: string, message: string) {
    // Only show in browser environment
    if (typeof window === 'undefined') return;

    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff4444;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 400px;
      border-left: 5px solid #cc0000;
    `;

    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 8px;">🚫 Mock Data Violation</div>
      <div style="margin-bottom: 8px;">${message}</div>
      <div style="font-size: 12px; opacity: 0.9;">
        Please use real API endpoints instead of mock data.
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: rgba(255,255,255,0.2);
        border: none;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
        float: right;
        margin-top: 8px;
        font-size: 12px;
      ">Dismiss</button>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }

  /**
   * Get all violations detected
   */
  static getViolations() {
    return [...this.violations];
  }

  /**
   * Clear violation history
   */
  static clearViolations() {
    this.violations = [];
  }

  /**
   * Get violation summary
   */
  static getSummary() {
    const summary = {
      total: this.violations.length,
      byType: {} as Record<string, number>,
      recent: this.violations.slice(-5) // Last 5 violations
    };

    this.violations.forEach(v => {
      summary.byType[v.type] = (summary.byType[v.type] || 0) + 1;
    });

    return summary;
  }
}

/**
 * Hook to detect mock data usage in React components
 */
export function useMockDataDetection() {
  const violations = MockDataGuard.getViolations();
  const summary = MockDataGuard.getSummary();

  return {
    violations,
    summary,
    hasViolations: violations.length > 0,
    clearViolations: MockDataGuard.clearViolations
  };
}

/**
 * Development-time wrapper for API calls to detect mock usage
 */
export function createAPIGuard<T extends (...args: any[]) => any>(
  fn: T,
  operationName: string
): T {
  return ((...args: any[]) => {
    // Check if this looks like a mock data call
    const stackTrace = new Error().stack || '';

    if (stackTrace.includes('mockData') ||
        stackTrace.includes('MockAPI') ||
        stackTrace.includes('mockApiData')) {
      MockDataGuard.reportViolation(
        'MOCK_API_CALL',
        `Mock API call detected in ${operationName}. Use real API endpoints instead.`
      );
    }

    return fn(...args);
  }) as T;
}

// Export convenience functions for common checks
export const checkForMockImports = () => {
  const stackTrace = new Error().stack || '';

  // Skip mock data detection in test files
  if (stackTrace.includes('.test.') ||
      stackTrace.includes('.spec.') ||
      stackTrace.includes('__tests__') ||
      stackTrace.includes('/test/') ||
      stackTrace.includes('testing') ||
      stackTrace.includes('mocks')) {
    return;
  }

  if (stackTrace.includes('mockData') || stackTrace.includes('MockAPI')) {
    MockDataGuard.reportViolation(
      'MOCK_IMPORT_USAGE',
      'Mock data import detected in call stack'
    );
  }
};

export const checkForHardcodedData = (data: any) => {
  const stackTrace = new Error().stack || '';

  // Skip mock data detection in test files
  if (stackTrace.includes('.test.') ||
      stackTrace.includes('.spec.') ||
      stackTrace.includes('__tests__') ||
      stackTrace.includes('/test/') ||
      stackTrace.includes('testing') ||
      stackTrace.includes('mocks')) {
    return;
  }

  if (typeof data === 'object' && data !== null) {
    const dataString = JSON.stringify(data);
    // Check for patterns that look like hardcoded user data
    if (dataString.includes('name') && dataString.includes('email') && dataString.length < 500) {
      MockDataGuard.reportViolation(
        'HARDCODED_DATA',
        'Potential hardcoded mock data detected'
      );
    }
  }
};
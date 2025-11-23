// Stub for monitoring server - minimal implementation
export const serverMonitoring = {
  getMetrics: () => ({
    systemMetrics: {
      activeRequests: 0,
      responseTimeAvg: 0
    }
  }),
  updateRequestMetrics: () => {},
  trackError: () => {},
  recordResponse: () => {}
};

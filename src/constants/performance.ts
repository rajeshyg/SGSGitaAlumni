// Performance Standards Constants
// Unified performance targets across all documentation and implementation

export const PERFORMANCE_STANDARDS = {
  // Core Web Vitals (Native-First Realistic Targets)
  FIRST_CONTENTFUL_PAINT: 1200, // 1.2s (realistic for native-first)
  LARGEST_CONTENTFUL_PAINT: 2500, // 2.5s
  FIRST_INPUT_DELAY: 100, // 100ms
  CUMULATIVE_LAYOUT_SHIFT: 0.1, // 0.1

  // Bundle Size Limits
  MAX_BUNDLE_SIZE: 500 * 1024, // 500KB (gzipped)
  MAX_COMPONENT_BUNDLE_IMPACT: 10 * 1024, // 10KB per enhancement

  // Animation Performance
  MAX_FRAME_TIME: 16, // 60fps (16.67ms per frame, rounded down)
  TOUCH_RESPONSE_TIME: 100, // 100ms

  // Memory Usage
  MAX_MEMORY_USAGE: 50 * 1024 * 1024, // 50MB heap size

  // Caching Performance
  CACHE_HIT_RATE_TARGET: 0.8, // 80% cache hit rate
  SERVICE_WORKER_CACHE_SIZE: 50 * 1024 * 1024, // 50MB

  // Network Performance
  API_RESPONSE_TIME: 500, // 500ms max API response time
  IMAGE_LOAD_TIME: 2000, // 2s max image load time

  // Theme Switching
  THEME_SWITCH_TIME: 200, // 200ms max theme switch time

  // Lazy Loading
  LAZY_LOAD_DELAY: 100, // 100ms lazy loading response time
} as const

// Performance thresholds for monitoring and alerts
export const PERFORMANCE_THRESHOLDS = {
  WARNING: {
    FIRST_CONTENTFUL_PAINT: 1500, // 1.5s
    LARGEST_CONTENTFUL_PAINT: 3000, // 3s
    FIRST_INPUT_DELAY: 150, // 150ms
    BUNDLE_SIZE: 600 * 1024, // 600KB
  },
  CRITICAL: {
    FIRST_CONTENTFUL_PAINT: 2000, // 2s
    LARGEST_CONTENTFUL_PAINT: 4000, // 4s
    FIRST_INPUT_DELAY: 300, // 300ms
    BUNDLE_SIZE: 750 * 1024, // 750KB
  }
} as const

// Platform-specific performance adjustments
export const PLATFORM_PERFORMANCE = {
  MOBILE: {
    IMAGE_QUALITY: 0.8,
    ANIMATION_DURATION: 200,
    BUNDLE_CHUNK_SIZE: '100kb',
    CACHE_STRATEGY: 'network-first'
  },
  TABLET: {
    IMAGE_QUALITY: 0.9,
    ANIMATION_DURATION: 300,
    BUNDLE_CHUNK_SIZE: '200kb',
    CACHE_STRATEGY: 'cache-first'
  },
  DESKTOP: {
    IMAGE_QUALITY: 1.0,
    ANIMATION_DURATION: 400,
    BUNDLE_CHUNK_SIZE: '500kb',
    CACHE_STRATEGY: 'stale-while-revalidate'
  }
} as const

// Helper functions for performance validation
export const PerformanceUtils = {
  formatTime: (ms: number): string => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  },

  formatSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)}${units[unitIndex]}`
  },

  isWithinBudget: (metric: keyof typeof PERFORMANCE_STANDARDS, value: number): boolean => {
    const target = PERFORMANCE_STANDARDS[metric] as number
    return value <= target
  },

  getPerformanceGrade: (metric: keyof typeof PERFORMANCE_STANDARDS, value: number): 'good' | 'warning' | 'critical' => {
    const target = PERFORMANCE_STANDARDS[metric] as number
    const warningThreshold = PERFORMANCE_THRESHOLDS.WARNING[metric as keyof typeof PERFORMANCE_THRESHOLDS.WARNING] as number
    const criticalThreshold = PERFORMANCE_THRESHOLDS.CRITICAL[metric as keyof typeof PERFORMANCE_THRESHOLDS.CRITICAL] as number

    if (value <= target) return 'good'
    if (value <= warningThreshold) return 'warning'
    return 'critical'
  }
} as const
---
title: Performance Testing
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
---

# Performance Testing

Performance benchmarks, load time targets, and bundle size limits.

## Core Web Vitals

### Loading Performance

| Metric | Target | Description |
|--------|--------|-------------|
| **First Contentful Paint (FCP)** | < 1.2s | First content visible |
| **Largest Contentful Paint (LCP)** | < 2.5s | Largest content loaded |
| **Time to Interactive (TTI)** | < 3.5s | Page fully interactive |
| **First Input Delay (FID)** | < 100ms | Response to first interaction |
| **Cumulative Layout Shift (CLS)** | < 0.1 | Visual stability |

## Bundle Size Targets

### Size Limits (Gzipped)

| Bundle Type | Target | Alert | Block |
|-------------|--------|-------|-------|
| **Total Bundle** | < 500KB | 450KB | 500KB |
| **Initial Bundle** | < 200KB | - | - |
| **Route Chunks** | < 100KB each | - | - |
| **Component Chunks** | < 50KB each | - | - |

## Interaction Performance

### Response Times

| Interaction | Target |
|-------------|--------|
| **Touch Response** | < 100ms |
| **Animation Frame Rate** | 60fps (< 16ms/frame) |
| **Theme Switch** | < 200ms |
| **Keyboard Response** | < 50ms |

### Memory Constraints

| Metric | Limit |
|--------|-------|
| **Heap Size** | < 50MB |
| **Memory Leaks** | 0 (must be fixed) |

## API Performance

### Response Time Targets

| Operation | Target |
|-----------|--------|
| **API Response** | < 500ms |
| **Database Query** | < 200ms |
| **Error Rate** | < 1% |

## Development Performance

### Build Times

| Operation | Target |
|-----------|--------|
| **Development Build** | < 5 seconds |
| **Production Build** | < 30 seconds |
| **Hot Reload** | < 1 second |
| **Unit Test Suite** | < 10 seconds |
| **ESLint Execution** | < 5 seconds |
| **Type Checking** | < 10 seconds |

## Performance Budgets

### Critical Thresholds

```typescript
// Performance budget configuration
const performanceBudgets = {
  bundleSize: {
    alert: '450KB',
    block: '500KB'
  },
  fcp: {
    alert: '1.0s',
    block: '1.2s'
  },
  lcp: {
    alert: '2.0s',
    block: '2.5s'
  },
  memory: {
    alert: '40MB',
    block: '50MB'
  }
};
```

## Performance Testing Patterns

### Lighthouse Testing

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:5173 --output json --output-path ./lighthouse-report.json

# Automated CI check
npm run test:lighthouse
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build -- --analyze

# Check for regressions
npm run bundle:check
```

### Load Testing

```typescript
// Example performance test in Playwright
import { test, expect } from '@playwright/test';

test('page load performance', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/dashboard');
  await page.waitForLoadState('networkidle');

  const loadTime = Date.now() - startTime;

  expect(loadTime).toBeLessThan(3500); // TTI target
});
```

## Monitoring

### Real User Monitoring (RUM)

- Core Web Vitals tracking
- Error tracking via Sentry
- Performance budget alerts
- User experience metrics

### Synthetic Monitoring

| Tool | Targets |
|------|---------|
| **Lighthouse** | > 90 for Performance, Accessibility, Best Practices |
| **WebPageTest** | Regular audits |
| **Bundle Analyzer** | Size regression detection |

## Optimization Strategies

### Code Optimization

- **Tree Shaking**: Remove unused code
- **Code Splitting**: Lazy load routes and heavy components
- **Image Optimization**: WebP format, responsive images
- **Font Loading**: Efficient web font strategies

### Caching Strategy

- **Static Assets**: Long-term caching with versioning
- **API Responses**: Intelligent caching based on freshness
- **Service Worker**: Aggressive caching for offline support

### Example: Lazy Loading

```typescript
// Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={chartData} />
    </Suspense>
  );
}
```

## Reference Files

- E2E Performance Tests: `/tests/e2e/performance.spec.ts`
- Performance Utilities: `/src/test/performance-engines.test.ts`
- Performance Targets: `/docs/archive/standards/PERFORMANCE_TARGETS.md`

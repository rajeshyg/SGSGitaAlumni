---
title: Testing Strategy Overview
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
---

# Testing Strategy Overview

Comprehensive testing documentation for the SGSGita Alumni project.

## Testing Philosophy

Our testing strategy follows these core principles:

1. **Test Behavior, Not Implementation** - Focus on what the code does, not how it does it
2. **Shift Left** - Catch issues early with comprehensive unit tests
3. **Confidence Through Coverage** - Maintain high coverage for critical paths
4. **Fast Feedback Loops** - Unit tests should run in seconds, not minutes

## Tool Stack

| Tool | Purpose | Documentation |
|------|---------|---------------|
| **Vitest** | Unit testing framework | [Unit Testing](./unit-testing.md) |
| **React Testing Library** | Component testing | [Unit Testing](./unit-testing.md) |
| **Playwright** | End-to-end testing | [E2E Testing](./e2e-testing.md) |
| **MSW** | API mocking | [Unit Testing](./unit-testing.md) |

## Testing Layers

```
+------------------+
|   E2E Tests      |  <- Critical user journeys
+------------------+
| Integration Tests |  <- API & DB operations
+------------------+
|   Unit Tests     |  <- Components & services
+------------------+
```

## Test Commands

```bash
# Run all unit tests
npm test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Documentation Index

- [Unit Testing](./unit-testing.md) - Vitest configuration, component testing, mocking patterns
- [E2E Testing](./e2e-testing.md) - Playwright patterns and page objects
- [Coverage Targets](./coverage-targets.md) - Quality metrics and minimum thresholds
- [Performance Testing](./performance-testing.md) - Benchmarks and load time targets

## Key References

- Configuration: `/vitest.config.ts`
- Test setup: `/src/test/setup.ts`
- E2E tests: `/tests/e2e/*.spec.ts`
- API tests: `/tests/api/`

## Related Documentation

- [Coverage Targets](./coverage-targets.md)
- [Quality Metrics](../../../archive/standards/QUALITY_METRICS.md)

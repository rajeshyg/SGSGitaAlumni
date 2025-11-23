---
title: Coverage Targets
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
---

# Coverage Targets

Quality metrics and minimum coverage thresholds for the SGSGita Alumni project.

## Coverage Requirements

### Unit Test Coverage

| Metric | Minimum Target | Critical Paths |
|--------|----------------|----------------|
| **Lines** | 90% | 100% |
| **Functions** | 90% | 100% |
| **Branches** | 85% | 100% |
| **Statements** | 90% | 100% |

### Vitest Configuration

Coverage thresholds are enforced in `/vitest.config.ts`:

```typescript
coverage: {
  reporter: ['text', 'json', 'html', 'lcov'],
  thresholds: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
}
```

### Integration Test Coverage

- **API Endpoints**: 100% of all endpoints tested
- **Database Operations**: All CRUD operations covered
- **External Services**: All integrations tested with mocks

### E2E Test Coverage

- **Critical User Journeys**: 100% coverage
- **Happy Path Flows**: All primary use cases
- **Error Scenarios**: Key error conditions

## Test Quality Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| **Execution Time** | < 10 seconds | Unit test suite duration |
| **Reliability** | > 99% pass rate | Flaky tests not tolerated |
| **Maintainability** | High | Easy to understand and update |

## Coverage Reporting

### Report Types

- **Text**: Console output for CI/CD
- **JSON**: Machine-readable format
- **HTML**: Interactive browser report
- **LCOV**: Integration with coverage services

### Generate Coverage Report

```bash
# Run tests with coverage
npm run test:coverage

# View HTML report
open coverage/index.html
```

## Priority Services

These services require 100% coverage for critical paths:

1. **AuthService** - Token generation/validation
2. **FamilyMemberService** - Family operations
3. **PostingService** - CRUD and validation
4. **ChatService** - Message operations

## Quality Gates

### Pre-Commit Checks

- [ ] ESLint validation passes
- [ ] All tests pass
- [ ] Coverage thresholds met
- [ ] TypeScript compilation succeeds

### CI/CD Quality Gates

- [ ] Build verification successful
- [ ] Full test suite passes
- [ ] Coverage report generated
- [ ] No security vulnerabilities

## Anti-Patterns to Avoid

### Coverage Anti-Patterns

```typescript
// Bad: Testing trivial getters/setters just for coverage
it('should get name', () => {
  expect(user.getName()).toBe('John');
});

// Bad: Testing the framework, not your code
it('should render div', () => {
  expect(screen.getByRole('generic')).toBeInTheDocument();
});

// Bad: No meaningful assertions
it('should not throw', () => {
  expect(() => service.process()).not.toThrow();
  // No validation of result
});
```

### Good Coverage Practices

```typescript
// Good: Test behavior and outcomes
it('should calculate total with tax', () => {
  const cart = new Cart([{ price: 100, quantity: 2 }]);
  expect(cart.getTotalWithTax(0.1)).toBe(220);
});

// Good: Test error conditions
it('should throw when cart is empty', () => {
  const cart = new Cart([]);
  expect(() => cart.checkout()).toThrow('Cart cannot be empty');
});

// Good: Test edge cases
it('should handle negative quantity', () => {
  expect(() => new CartItem({ quantity: -1 })).toThrow();
});
```

## Monitoring Coverage Trends

### Continuous Monitoring

- Daily quality reports (automated)
- Trend analysis over time
- Regression detection alerts

### Performance Tracking

| Metric | Threshold |
|--------|-----------|
| Coverage Regression | Alert if drops > 2% |
| New Code Coverage | Must meet 90% minimum |
| Test Flakiness | < 1% allowed |

## Reference

- Configuration: `/vitest.config.ts`
- Quality Metrics: `/docs/archive/standards/QUALITY_METRICS.md`
- CI Pipeline: `/.github/workflows/`

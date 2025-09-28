# Quick Start Testing Guide

## 🚀 Getting Started

This guide will help you quickly set up and run tests for the SGSGitaAlumni application.

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git repository cloned
- DEV database running (for integration tests)

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Run Tests
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:auth
npm run test:dashboard
npm run test:responsive
```

## 🧪 Test Types

### Unit Tests
```bash
# Run unit tests
npm run test

# Run with UI
npm run test:ui

# Run once (CI mode)
npm run test:run
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug
```

### API Tests
```bash
# Run API tests
npm run test:api

# Run specific API tests
npm run test:auth
npm run test:dashboard
```

### Performance Tests
```bash
# Run performance tests
npm run test:performance
```

## 📊 Test Reports

### View Test Results
```bash
# Open test report
npm run test:report
```

### Test Results Location
- **HTML Reports**: `test-results/` directory
- **JSON Reports**: `test-results/results.json`
- **JUnit Reports**: `test-results/results.xml`

## 🔧 Configuration

### Environment Variables
```bash
# Set test environment
export TEST_ENV=development

# Set API URL
export API_URL=http://localhost:3000
```

### Test Configuration
- **Playwright Config**: `playwright.config.ts`
- **Test Data**: `tests/setup/test-data.ts`
- **Environment**: `tests/setup/test-environment.ts`

## 🎯 Common Test Scenarios

### Authentication Flow
```bash
# Test login flow
npm run test:auth

# Test registration flow
npm run test:auth -- --grep "Registration"
```

### Dashboard Testing
```bash
# Test dashboard functionality
npm run test:dashboard

# Test responsive design
npm run test:responsive
```

### Cross-Browser Testing
```bash
# Test all browsers
npm run test:cross-browser

# Test specific browser
npm run test:cross-browser -- --project=chromium
```

### Performance Testing
```bash
# Test performance
npm run test:performance

# Test with specific viewport
npm run test:performance -- --project="Mobile Chrome"
```

## 🐛 Debugging Tests

### Debug Mode
```bash
# Debug E2E tests
npm run test:e2e:debug

# Debug specific test
npm run test:e2e:debug -- tests/e2e/auth.spec.ts
```

### Test Logs
```bash
# Run with verbose output
npm run test:e2e -- --reporter=line

# Run with detailed logs
npm run test:e2e -- --reporter=html
```

### Screenshots and Videos
- **Screenshots**: Automatically captured on failure
- **Videos**: Recorded for failed tests
- **Traces**: Available for debugging

## 📝 Writing Tests

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### API Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should authenticate user', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    data: { email: 'test@example.com', password: 'password123' }
  });
  expect(response.status()).toBe(200);
});
```

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing
```bash
# Check if dev server is running
npm run dev

# Check if database is accessible
curl http://localhost:3000/api/health
```

#### Browser Issues
```bash
# Reinstall browsers
npx playwright install

# Update browsers
npx playwright install --with-deps
```

#### Environment Issues
```bash
# Clear node modules
rm -rf node_modules
npm install

# Clear test results
rm -rf test-results
```

### Getting Help
- **Documentation**: Check `docs/testing/` directory
- **Test Logs**: Review test output for errors
- **Debug Mode**: Use `--debug` flag for step-by-step execution

## 📈 Best Practices

### Test Organization
- **Group Related Tests**: Use `test.describe()` blocks
- **Clear Test Names**: Descriptive test descriptions
- **Setup and Teardown**: Use `beforeEach()` and `afterEach()`

### Test Data
- **Use Test Data**: Import from `tests/setup/test-data.ts`
- **Mock APIs**: Use `setupMockAPI()` for consistent data
- **Clean State**: Reset state between tests

### Performance
- **Parallel Execution**: Run tests in parallel when possible
- **Selective Testing**: Run only relevant tests during development
- **CI Optimization**: Use appropriate test selection for CI

## 🎯 Next Steps

1. **Run Initial Tests**: Execute `npm run test:all`
2. **Review Results**: Check test reports and fix any failures
3. **Write New Tests**: Add tests for new features
4. **Integrate CI**: Set up continuous integration
5. **Monitor Performance**: Track test execution times

## 📚 Additional Resources

- **Manual Testing Guide**: `docs/testing/MANUAL_TESTING_GUIDE.md`
- **Testing Strategy**: `docs/testing/TESTING_STRATEGY.md`
- **Playwright Documentation**: https://playwright.dev/
- **Vitest Documentation**: https://vitest.dev/

---

**Happy Testing!** 🧪✨

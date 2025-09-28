# SGSGitaAlumni Testing Quick Start Guide

## 🚀 Getting Started

This guide will help you quickly set up and run the comprehensive testing suite for the SGSGitaAlumni application.

## 📋 Prerequisites

### Required Software
- **Node.js**: Version 18+ (recommended: 20+)
- **npm**: Version 9+ (comes with Node.js)
- **Git**: For version control
- **Database**: DEV database running and accessible

### Required Browsers
- **Chrome**: Latest version
- **Firefox**: Latest version
- **Safari**: Latest version (macOS)
- **Edge**: Latest version

## ⚡ Quick Setup

### 1. Install Dependencies
```bash
# Install project dependencies
npm install

# Install Playwright browsers
npx playwright install

# Install additional testing dependencies
npm install --save-dev allure-playwright
```

### 2. Environment Setup
```bash
# Set environment variables
export NODE_ENV=development
export BASE_URL=http://localhost:5173
export API_URL=http://localhost:3000
export DATABASE_URL=your-dev-database-url
```

### 3. Database Setup
```bash
# Ensure DEV database is running
# Check database connection
npm run test:db:check

# Seed test data (if needed)
npm run test:db:seed
```

## 🧪 Running Tests

### Quick Test Commands
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:auth          # Authentication tests
npm run test:dashboard     # Dashboard tests
npm run test:responsive    # Responsive design tests
npm run test:cross-browser # Cross-browser tests
npm run test:performance   # Performance tests
npm run test:api          # API tests

# Run with UI
npm run test:e2e:ui
npm run test:report
```

### Test Execution Options
```bash
# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Run tests with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests with specific viewport
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## 📊 Test Reports

### HTML Reports
```bash
# Generate HTML report
npm run test:report

# Open HTML report
npx playwright show-report
```

### Allure Reports
```bash
# Generate Allure report
npm run test:allure

# Serve Allure report
npx allure serve test-results/allure-results
```

### JSON Reports
```bash
# Generate JSON report
npm run test:json

# View JSON results
cat test-results/results.json
```

## 🔧 Test Configuration

### Environment Variables
```bash
# Development environment
NODE_ENV=development
BASE_URL=http://localhost:5173
API_URL=http://localhost:3000

# Staging environment
NODE_ENV=staging
BASE_URL=https://staging.sgsgitaalumni.com
API_URL=https://api-staging.sgsgitaalumni.com

# Production environment
NODE_ENV=production
BASE_URL=https://sgsgitaalumni.com
API_URL=https://api.sgsgitaalumni.com
```

### Test Data Configuration
```typescript
// tests/setup/test-data.ts
export const testConfig = {
  baseURL: process.env.BASE_URL || 'http://localhost:5173',
  apiURL: process.env.API_URL || 'http://localhost:3000',
  timeout: 30000,
  retries: 3
};
```

## 🎯 Manual Testing

### 1. Authentication Testing
```bash
# Start the application
npm run dev

# Open browser and test:
# 1. Navigate to http://localhost:5173
# 2. Test login with valid credentials
# 3. Test registration flow
# 4. Test OTP verification
# 5. Test family invitation acceptance
```

### 2. Dashboard Testing
```bash
# After successful login:
# 1. Verify dashboard loads with real data
# 2. Test all interactive elements
# 3. Test responsive design
# 4. Test cross-browser compatibility
```

### 3. API Testing
```bash
# Test API endpoints manually
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

curl -X GET http://localhost:3000/api/users/dashboard \
  -H "Authorization: Bearer your-token"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Browser Installation Issues
```bash
# Reinstall Playwright browsers
npx playwright install --force

# Install specific browser
npx playwright install chromium
npx playwright install firefox
npx playwright install webkit
```

#### 2. Database Connection Issues
```bash
# Check database connection
npm run test:db:check

# Reset test database
npm run test:db:reset

# Seed test data
npm run test:db:seed
```

#### 3. Test Execution Issues
```bash
# Clear test cache
npm run test:clear

# Run tests with verbose output
npm run test:e2e -- --verbose

# Run tests with debug information
npm run test:e2e:debug
```

#### 4. Environment Issues
```bash
# Check environment variables
echo $NODE_ENV
echo $BASE_URL
echo $API_URL

# Set environment variables
export NODE_ENV=development
export BASE_URL=http://localhost:5173
export API_URL=http://localhost:3000
```

## 📈 Performance Testing

### Load Testing
```bash
# Run performance tests
npm run test:performance

# Run load tests
npm run test:load

# Run stress tests
npm run test:stress
```

### Performance Monitoring
```bash
# Monitor performance metrics
npm run test:metrics

# Generate performance report
npm run test:performance:report
```

## 🔒 Security Testing

### Security Validation
```bash
# Run security tests
npm run test:security

# Run authentication tests
npm run test:auth:security

# Run authorization tests
npm run test:auth:authorization
```

### Security Scanning
```bash
# Run security scan
npm run test:security:scan

# Run vulnerability check
npm run test:security:vulnerabilities
```

## 📱 Cross-Platform Testing

### Mobile Testing
```bash
# Run mobile tests
npm run test:mobile

# Run responsive tests
npm run test:responsive

# Run touch tests
npm run test:touch
```

### Cross-Browser Testing
```bash
# Run all browser tests
npm run test:cross-browser

# Run specific browser tests
npm run test:chrome
npm run test:firefox
npm run test:safari
npm run test:edge
```

## 🎯 Best Practices

### Test Development
1. **Write Clear Test Names**: Descriptive test descriptions
2. **Use Page Object Model**: Organize test code efficiently
3. **Mock External Dependencies**: Use consistent test data
4. **Test Real User Scenarios**: Focus on actual user journeys
5. **Maintain Test Data**: Keep test data realistic and up-to-date

### Test Execution
1. **Run Tests Regularly**: Execute tests on every commit
2. **Monitor Test Results**: Track test performance and coverage
3. **Fix Failing Tests**: Address test failures immediately
4. **Update Test Data**: Keep test data current with application changes
5. **Document Test Cases**: Maintain comprehensive test documentation

### Test Maintenance
1. **Refactor Test Code**: Keep tests clean and maintainable
2. **Update Test Dependencies**: Keep testing tools current
3. **Optimize Test Performance**: Reduce test execution time
4. **Review Test Coverage**: Ensure adequate test coverage
5. **Continuous Improvement**: Regularly enhance testing processes

## 📚 Additional Resources

### Documentation
- [Manual Testing Guide](./MANUAL_TESTING_GUIDE.md)
- [Testing Strategy](./TESTING_STRATEGY.md)
- [API Testing Guide](./API_TESTING_GUIDE.md)
- [Performance Testing Guide](./PERFORMANCE_TESTING_GUIDE.md)

### External Resources
- [Playwright Documentation](https://playwright.dev/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

### Support
- **Issues**: Report test issues in the project repository
- **Questions**: Ask questions in the project discussion forum
- **Contributions**: Contribute to test improvements and enhancements

---

**Note**: This quick start guide provides the essential information to get started with testing. For detailed information, refer to the comprehensive testing documentation.
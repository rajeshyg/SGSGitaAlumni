---
title: End-to-End Testing
version: 1.0
status: active
last_updated: 2025-11-23
applies_to: all
framework: playwright
---

# End-to-End Testing

E2E testing patterns and standards using Playwright.

## Overview

E2E tests verify complete user flows through the application, testing the integration of all layers from UI to API.

## Test File Organization

```
tests/
  e2e/
    auth.spec.ts          # Authentication flows
    dashboard.spec.ts     # Dashboard functionality
    postings.spec.ts      # Posting CRUD operations
    chat.spec.ts          # Chat messaging
    api.spec.ts           # API endpoint tests
    performance.spec.ts   # Performance benchmarks
    responsive.spec.ts    # Responsive design tests
    cross-browser.spec.ts # Cross-browser compatibility
    smoke-test.spec.ts    # Quick validation tests
  setup/
    test-data.ts          # Mock data and helpers
```

## Test Structure Pattern

### Basic Test Structure

```typescript
import { test, expect } from '@playwright/test';
import { setupMockAPI } from '../setup/test-data';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupMockAPI(page);
    await page.goto('/');
  });

  test('should display login page by default', async ({ page }) => {
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.click('button');

    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });
});
```

## API Mocking in E2E Tests

### Route Interception

```typescript
test('should handle login with valid credentials', async ({ page }) => {
  // Mock successful login response
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: { id: '1', email: 'test@example.com', firstName: 'John' },
        token: 'mock-jwt-token'
      })
    });
  });

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button');

  await expect(page).toHaveURL('/dashboard');
});

test('should handle login error', async ({ page }) => {
  await page.route('**/api/auth/login', async route => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        success: false,
        error: 'Invalid credentials'
      })
    });
  });

  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'wrongpassword');
  await page.click('button');

  await expect(page.locator('text=Invalid credentials')).toBeVisible();
});
```

## Page Object Pattern

### Page Object Definition

```typescript
// pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[name="email"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('[data-testid="error-message"]');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return this.errorMessage.textContent();
  }
}
```

### Using Page Objects in Tests

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

test.describe('Login Page', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should login successfully', async ({ page }) => {
    await loginPage.login('test@example.com', 'password123');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should show error for invalid credentials', async () => {
    await loginPage.login('invalid@example.com', 'wrong');
    const error = await loginPage.getErrorMessage();
    expect(error).toContain('Invalid credentials');
  });
});
```

## Critical User Flows

Test these complete user journeys:

1. **Registration Flow**: Registration -> Profile Selection -> Dashboard
2. **Posting Flow**: Create Posting -> Moderation -> Approval -> Feed
3. **Chat Flow**: Start Chat -> Send Message -> Receive Reply
4. **Directory Flow**: Search Directory -> View Profile -> Send Message

## Best Practices

### Selectors

```typescript
// Good: Use test IDs for reliable selection
await page.locator('[data-testid="submit-button"]').click();

// Good: Use role-based selectors
await page.getByRole('button', { name: 'Submit' }).click();

// Avoid: Fragile CSS selectors
await page.locator('.btn-primary.submit-btn').click();
```

### Waiting for Elements

```typescript
// Good: Wait for specific conditions
await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

// Good: Wait for navigation
await Promise.all([
  page.waitForNavigation(),
  page.click('a[href="/dashboard"]')
]);

// Avoid: Hard-coded waits
await page.waitForTimeout(2000);
```

### Test Isolation

```typescript
test.beforeEach(async ({ page }) => {
  // Clear storage between tests
  await page.evaluate(() => localStorage.clear());

  // Setup fresh mock data
  await setupMockAPI(page);
});
```

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Reference Files

- `/tests/e2e/auth.spec.ts` - Authentication flow examples
- `/tests/e2e/dashboard.spec.ts` - Dashboard tests
- `/tests/e2e/postings.spec.ts` - Posting CRUD tests
- `/tests/e2e/chat.spec.ts` - Chat functionality tests
- `/tests/e2e/smoke-test.spec.ts` - Quick validation tests

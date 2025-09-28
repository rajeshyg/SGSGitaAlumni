/**
 * Test Environment Setup for SGSGitaAlumni Application
 * 
 * This file contains environment configuration and setup utilities
 * for automated testing across different environments.
 */

import { test as baseTest, expect } from '@playwright/test';
import { setupMockAPI, testConfig } from './test-data';

// Test Environment Types
export type TestEnvironment = 'development' | 'staging' | 'production';
export type TestMode = 'unit' | 'integration' | 'e2e' | 'performance';

// Environment Configuration
export const environments = {
  development: {
    baseURL: 'http://localhost:5173',
    apiURL: 'http://localhost:3000',
    database: 'mysql://localhost:3306/sgsgita_alumni_dev',
    timeout: 30000,
    retries: 3,
    headless: false,
    slowMo: 100
  },
  staging: {
    baseURL: 'https://staging.sgsgita-alumni.com',
    apiURL: 'https://api-staging.sgsgita-alumni.com',
    database: 'mysql://staging-db:3306/sgsgita_alumni_staging',
    timeout: 60000,
    retries: 2,
    headless: true,
    slowMo: 0
  },
  production: {
    baseURL: 'https://sgsgita-alumni.com',
    apiURL: 'https://api.sgsgita-alumni.com',
    database: 'mysql://prod-db:3306/sgsgita_alumni_prod',
    timeout: 120000,
    retries: 1,
    headless: true,
    slowMo: 0
  }
};

// Test Configuration
export const testConfiguration = {
  // Browser Configuration
  browsers: {
    chromium: {
      name: 'chromium',
      channel: undefined,
      headless: false
    },
    firefox: {
      name: 'firefox',
      headless: false
    },
    webkit: {
      name: 'webkit',
      headless: false
    },
    edge: {
      name: 'chromium',
      channel: 'msedge',
      headless: false
    }
  },
  
  // Viewport Configuration
  viewports: {
    mobile: { width: 375, height: 667 },
    mobileLarge: { width: 414, height: 896 },
    tablet: { width: 768, height: 1024 },
    tabletLarge: { width: 1024, height: 768 },
    desktop: { width: 1920, height: 1080 },
    desktopLarge: { width: 2560, height: 1440 }
  },
  
  // Test Data Configuration
  testData: {
    users: {
      admin: {
        email: 'admin@example.com',
        password: 'AdminPass123!',
        role: 'admin'
      },
      member: {
        email: 'member@example.com',
        password: 'MemberPass123!',
        role: 'member'
      },
      moderator: {
        email: 'moderator@example.com',
        password: 'ModPass123!',
        role: 'moderator'
      }
    },
    apiKeys: {
      test: 'test-api-key-123',
      staging: 'staging-api-key-456',
      production: 'prod-api-key-789'
    }
  }
};

// Environment Detection
export const getCurrentEnvironment = (): TestEnvironment => {
  const env = process.env.TEST_ENV || process.env.NODE_ENV || 'development';
  return env as TestEnvironment;
};

// Test Setup Utilities
export class TestEnvironmentSetup {
  private environment: TestEnvironment;
  private config: any;

  constructor(environment: TestEnvironment = getCurrentEnvironment()) {
    this.environment = environment;
    this.config = environments[environment];
  }

  getBaseURL(): string {
    return this.config.baseURL;
  }

  getAPIURL(): string {
    return this.config.apiURL;
  }

  getTimeout(): number {
    return this.config.timeout;
  }

  getRetries(): number {
    return this.config.retries;
  }

  isHeadless(): boolean {
    return this.config.headless;
  }

  getSlowMo(): number {
    return this.config.slowMo;
  }

  async setupTestData(page: any): Promise<void> {
    // Set up authentication state
    await page.addInitScript(() => {
      localStorage.setItem('test-environment', this.environment);
      localStorage.setItem('test-mode', 'automated');
    });

    // Set up mock API if in development
    if (this.environment === 'development') {
      await setupMockAPI(page);
    }
  }

  async cleanupTestData(page: any): Promise<void> {
    // Clear local storage
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Clear cookies
    await page.context().clearCookies();
  }

  async setupDatabase(): Promise<void> {
    if (this.environment === 'development') {
      // Set up test database
      console.log('Setting up test database...');
      // Add database setup logic here
    }
  }

  async cleanupDatabase(): Promise<void> {
    if (this.environment === 'development') {
      // Clean up test database
      console.log('Cleaning up test database...');
      // Add database cleanup logic here
    }
  }
}

// Test Fixtures
export const test = baseTest.extend<{
  testEnv: TestEnvironmentSetup;
  testUser: any;
}>({
  testEnv: async ({ page }, use) => {
    const testEnv = new TestEnvironmentSetup();
    await testEnv.setupTestData(page);
    await use(testEnv);
    await testEnv.cleanupTestData(page);
  },

  testUser: async ({ testEnv }, use) => {
    const user = testConfiguration.testData.users.member;
    await use(user);
  }
});

// Test Utilities
export const testUtils = {
  // Wait for API response
  async waitForAPIResponse(page: any, url: string, timeout: number = 30000): Promise<any> {
    return await page.waitForResponse(
      response => response.url().includes(url) && response.status() === 200,
      { timeout }
    );
  },

  // Wait for element to be visible
  async waitForElement(page: any, selector: string, timeout: number = 10000): Promise<void> {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
  },

  // Wait for element to be hidden
  async waitForElementHidden(page: any, selector: string, timeout: number = 10000): Promise<void> {
    await page.waitForSelector(selector, { timeout, state: 'hidden' });
  },

  // Take screenshot
  async takeScreenshot(page: any, name: string): Promise<void> {
    await page.screenshot({ path: `test-results/screenshots/${name}.png` });
  },

  // Fill form with data
  async fillForm(page: any, formData: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      await page.fill(`input[name="${field}"], select[name="${field}"], textarea[name="${field}"]`, value);
    }
  },

  // Submit form
  async submitForm(page: any, formSelector: string = 'form'): Promise<void> {
    await page.click(`${formSelector} button[type="submit"]`);
  },

  // Navigate to page
  async navigateToPage(page: any, path: string): Promise<void> {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  },

  // Login user
  async loginUser(page: any, email: string, password: string): Promise<void> {
    await page.goto('/login');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  },

  // Logout user
  async logoutUser(page: any): Promise<void> {
    await page.click('button:has-text("Logout")');
    await page.waitForURL('/login');
  },

  // Check if user is authenticated
  async isAuthenticated(page: any): Promise<boolean> {
    const token = await page.evaluate(() => localStorage.getItem('auth-token'));
    return token !== null;
  },

  // Get user from localStorage
  async getCurrentUser(page: any): Promise<any> {
    return await page.evaluate(() => {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    });
  },

  // Set user in localStorage
  async setCurrentUser(page: any, user: any): Promise<void> {
    await page.evaluate((userData) => {
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('auth-token', 'mock-jwt-token');
    }, user);
  },

  // Clear authentication
  async clearAuthentication(page: any): Promise<void> {
    await page.evaluate(() => {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    });
  },

  // Mock API response
  async mockAPIResponse(page: any, url: string, response: any, status: number = 200): Promise<void> {
    await page.route(url, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  },

  // Mock API error
  async mockAPIError(page: any, url: string, error: string, status: number = 500): Promise<void> {
    await page.route(url, async route => {
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify({ error })
      });
    });
  },

  // Wait for network to be idle
  async waitForNetworkIdle(page: any): Promise<void> {
    await page.waitForLoadState('networkidle');
  },

  // Wait for specific text to appear
  async waitForText(page: any, text: string, timeout: number = 10000): Promise<void> {
    await page.waitForSelector(`text=${text}`, { timeout });
  },

  // Check if element exists
  async elementExists(page: any, selector: string): Promise<boolean> {
    const count = await page.locator(selector).count();
    return count > 0;
  },

  // Get element text
  async getElementText(page: any, selector: string): Promise<string> {
    return await page.locator(selector).textContent();
  },

  // Check if element is visible
  async isElementVisible(page: any, selector: string): Promise<boolean> {
    return await page.locator(selector).isVisible();
  },

  // Check if element is enabled
  async isElementEnabled(page: any, selector: string): Promise<boolean> {
    return await page.locator(selector).isEnabled();
  },

  // Get element attribute
  async getElementAttribute(page: any, selector: string, attribute: string): Promise<string | null> {
    return await page.locator(selector).getAttribute(attribute);
  },

  // Scroll to element
  async scrollToElement(page: any, selector: string): Promise<void> {
    await page.locator(selector).scrollIntoViewIfNeeded();
  },

  // Click element with retry
  async clickWithRetry(page: any, selector: string, maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.click(selector);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await page.waitForTimeout(1000);
      }
    }
  },

  // Fill input with retry
  async fillWithRetry(page: any, selector: string, value: string, maxRetries: number = 3): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        await page.fill(selector, value);
        return;
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await page.waitForTimeout(1000);
      }
    }
  }
};

// Test Assertions
export const testAssertions = {
  // Assert page title
  async assertPageTitle(page: any, expectedTitle: string): Promise<void> {
    await expect(page).toHaveTitle(expectedTitle);
  },

  // Assert URL
  async assertURL(page: any, expectedURL: string): Promise<void> {
    await expect(page).toHaveURL(expectedURL);
  },

  // Assert element is visible
  async assertElementVisible(page: any, selector: string): Promise<void> {
    await expect(page.locator(selector)).toBeVisible();
  },

  // Assert element is hidden
  async assertElementHidden(page: any, selector: string): Promise<void> {
    await expect(page.locator(selector)).toBeHidden();
  },

  // Assert element text
  async assertElementText(page: any, selector: string, expectedText: string): Promise<void> {
    await expect(page.locator(selector)).toHaveText(expectedText);
  },

  // Assert element contains text
  async assertElementContainsText(page: any, selector: string, expectedText: string): Promise<void> {
    await expect(page.locator(selector)).toContainText(expectedText);
  },

  // Assert element is enabled
  async assertElementEnabled(page: any, selector: string): Promise<void> {
    await expect(page.locator(selector)).toBeEnabled();
  },

  // Assert element is disabled
  async assertElementDisabled(page: any, selector: string): Promise<void> {
    await expect(page.locator(selector)).toBeDisabled();
  },

  // Assert form validation
  async assertFormValidation(page: any, field: string, expectedError: string): Promise<void> {
    await expect(page.locator(`text=${expectedError}`)).toBeVisible();
  },

  // Assert API response
  async assertAPIResponse(response: any, expectedStatus: number, expectedData?: any): Promise<void> {
    expect(response.status()).toBe(expectedStatus);
    if (expectedData) {
      const data = await response.json();
      expect(data).toMatchObject(expectedData);
    }
  }
};

export default {
  environments,
  testConfiguration,
  getCurrentEnvironment,
  TestEnvironmentSetup,
  test,
  testUtils,
  testAssertions
};

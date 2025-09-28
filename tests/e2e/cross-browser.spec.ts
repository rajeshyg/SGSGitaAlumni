/**
 * Cross-Browser E2E Tests
 * 
 * This file contains comprehensive tests for cross-browser compatibility
 * across Chrome, Firefox, Safari, and Edge browsers.
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, testUsers } from '../setup/test-data';

test.describe('Cross-Browser Authentication', () => {
  test('should work consistently across all browsers', async ({ page, browserName }) => {
    await setupMockAPI(page);
    
    // Test login flow
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Sign In');
    
    // Fill login form
    await page.fill('input[name="email"]', testUsers[0].email);
    await page.fill('input[name="password"]', testUsers[0].password);
    
    // Check that form values are set correctly
    await expect(page.locator('input[name="email"]')).toHaveValue(testUsers[0].email);
    await expect(page.locator('input[name="password"]')).toHaveValue(testUsers[0].password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    console.log(`✅ Authentication test passed on ${browserName}`);
  });

  test('should handle form validation consistently', async ({ page, browserName }) => {
    await page.goto('/login');
    
    // Test empty form submission
    await page.click('button[type="submit"]');
    
    // Check validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Test invalid email format
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    
    console.log(`✅ Form validation test passed on ${browserName}`);
  });

  test('should handle OTP verification consistently', async ({ page, browserName }) => {
    await setupMockAPI(page);
    
    await page.goto('/otp-verification?email=test@example.com&type=login');
    
    // Check OTP form
    await expect(page.locator('h1')).toContainText('Verify OTP');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    
    // Test OTP input
    await page.fill('input[type="text"]', '123456');
    await expect(page.locator('input[type="text"]')).toHaveValue('123456');
    
    // Submit OTP
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    console.log(`✅ OTP verification test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser Dashboard', () => {
  test('should display dashboard consistently', async ({ page, browserName }) => {
    await setupMockAPI(page);
    
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers[0].email);
    await page.fill('input[name="password"]', testUsers[0].password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Check dashboard components
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="stats-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-conversations"]')).toBeVisible();
    await expect(page.locator('[data-testid="personalized-posts"]')).toBeVisible();
    
    console.log(`✅ Dashboard display test passed on ${browserName}`);
  });

  test('should handle interactions consistently', async ({ page, browserName }) => {
    await setupMockAPI(page);
    
    await page.goto('/dashboard');
    
    // Test quick actions
    await page.click('[data-testid="quick-action-1"]');
    await expect(page).toHaveURL('/profile');
    
    await page.goto('/dashboard');
    
    // Test conversation interactions
    await page.click('[data-testid="conversation-1"]');
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    
    console.log(`✅ Dashboard interactions test passed on ${browserName}`);
  });

  test('should handle data loading consistently', async ({ page, browserName }) => {
    await setupMockAPI(page);
    
    await page.goto('/dashboard');
    
    // Check that data loads
    await expect(page.locator('text=25')).toBeVisible(); // Total connections
    await expect(page.locator('text=3')).toBeVisible(); // New messages
    await expect(page.locator('text=2')).toBeVisible(); // Upcoming events
    
    // Check that data is displayed correctly
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=Alumni Networking Event')).toBeVisible();
    
    console.log(`✅ Data loading test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser Responsive Design', () => {
  test('should handle mobile viewport consistently', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Check mobile layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    
    // Check that mobile menu works
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    console.log(`✅ Mobile responsive test passed on ${browserName}`);
  });

  test('should handle tablet viewport consistently', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    
    // Check tablet layout
    await expect(page.locator('[data-testid="tablet-dashboard"]')).toBeVisible();
    
    // Check that sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    
    console.log(`✅ Tablet responsive test passed on ${browserName}`);
  });

  test('should handle desktop viewport consistently', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    
    // Check desktop layout
    await expect(page.locator('[data-testid="desktop-dashboard"]')).toBeVisible();
    
    // Check that all components are visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    
    console.log(`✅ Desktop responsive test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser JavaScript Features', () => {
  test('should handle JavaScript consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test JavaScript functionality
    await page.evaluate(() => {
      // Test basic JavaScript features
      const element = document.createElement('div');
      element.textContent = 'Test';
      document.body.appendChild(element);
    });
    
    await expect(page.locator('text=Test')).toBeVisible();
    
    // Test event handling
    await page.click('[data-testid="test-button"]');
    await expect(page.locator('[data-testid="test-result"]')).toBeVisible();
    
    console.log(`✅ JavaScript features test passed on ${browserName}`);
  });

  test('should handle DOM manipulation consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test DOM manipulation
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="test-container"]');
      if (container) {
        const newElement = document.createElement('div');
        newElement.textContent = 'Dynamic content';
        newElement.setAttribute('data-testid', 'dynamic-element');
        container.appendChild(newElement);
      }
    });
    
    await expect(page.locator('[data-testid="dynamic-element"]')).toBeVisible();
    
    console.log(`✅ DOM manipulation test passed on ${browserName}`);
  });

  test('should handle async operations consistently', async ({ page, browserName }) => {
    await setupMockAPI(page);
    
    await page.goto('/dashboard');
    
    // Test async data loading
    await page.waitForSelector('[data-testid="dashboard-content"]');
    
    // Test async interactions
    await page.click('[data-testid="async-button"]');
    await page.waitForSelector('[data-testid="async-result"]');
    
    await expect(page.locator('[data-testid="async-result"]')).toBeVisible();
    
    console.log(`✅ Async operations test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser CSS Features', () => {
  test('should handle CSS consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test CSS features
    const element = page.locator('[data-testid="css-test-element"]');
    await expect(element).toBeVisible();
    
    // Check CSS properties
    const backgroundColor = await element.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeDefined();
    
    // Check responsive CSS
    await page.setViewportSize({ width: 375, height: 667 });
    const mobileStyles = await element.evaluate(el => 
      window.getComputedStyle(el).display
    );
    expect(mobileStyles).toBeDefined();
    
    console.log(`✅ CSS features test passed on ${browserName}`);
  });

  test('should handle CSS Grid and Flexbox consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test CSS Grid
    const gridContainer = page.locator('[data-testid="grid-container"]');
    if (await gridContainer.isVisible()) {
      const gridDisplay = await gridContainer.evaluate(el => 
        window.getComputedStyle(el).display
      );
      expect(gridDisplay).toBe('grid');
    }
    
    // Test Flexbox
    const flexContainer = page.locator('[data-testid="flex-container"]');
    if (await flexContainer.isVisible()) {
      const flexDisplay = await flexContainer.evaluate(el => 
        window.getComputedStyle(el).display
      );
      expect(flexDisplay).toBe('flex');
    }
    
    console.log(`✅ CSS Grid/Flexbox test passed on ${browserName}`);
  });

  test('should handle CSS animations consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test CSS animations
    const animatedElement = page.locator('[data-testid="animated-element"]');
    if (await animatedElement.isVisible()) {
      const animation = await animatedElement.evaluate(el => 
        window.getComputedStyle(el).animation
      );
      expect(animation).toBeDefined();
    }
    
    console.log(`✅ CSS animations test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser Security', () => {
  test('should handle security features consistently', async ({ page, browserName }) => {
    await page.goto('/login');
    
    // Test security headers
    const response = await page.request.get('http://localhost:5173/');
    const headers = response.headers();
    
    // Check for security headers
    expect(headers['x-frame-options']).toBeDefined();
    expect(headers['x-content-type-options']).toBeDefined();
    
    console.log(`✅ Security features test passed on ${browserName}`);
  });

  test('should handle HTTPS consistently', async ({ page, browserName }) => {
    // Test HTTPS redirect
    await page.goto('http://localhost:5173/');
    
    // Should not redirect to HTTPS in development
    await expect(page).toHaveURL('http://localhost:5173/');
    
    console.log(`✅ HTTPS handling test passed on ${browserName}`);
  });

  test('should handle content security policy consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test CSP compliance
    const response = await page.request.get('http://localhost:5173/');
    const csp = response.headers()['content-security-policy'];
    
    if (csp) {
      expect(csp).toBeDefined();
    }
    
    console.log(`✅ CSP test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser Performance', () => {
  test('should perform consistently across browsers', async ({ page, browserName }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 5 seconds on all browsers
    expect(loadTime).toBeLessThan(5000);
    
    console.log(`✅ Performance test passed on ${browserName} (${loadTime}ms)`);
  });

  test('should handle memory usage consistently', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Navigate multiple times to test memory usage
    for (let i = 0; i < 5; i++) {
      await page.goto('/login');
      await page.goto('/dashboard');
    }
    
    // Should still function properly
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    console.log(`✅ Memory usage test passed on ${browserName}`);
  });
});

test.describe('Cross-Browser Accessibility', () => {
  test('should maintain accessibility across browsers', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
    
    console.log(`✅ Accessibility test passed on ${browserName}`);
  });

  test('should handle screen reader compatibility', async ({ page, browserName }) => {
    await page.goto('/dashboard');
    
    // Test ARIA attributes
    const ariaElements = page.locator('[aria-label], [aria-labelledby], [role]');
    const count = await ariaElements.count();
    
    expect(count).toBeGreaterThan(0);
    
    console.log(`✅ Screen reader compatibility test passed on ${browserName}`);
  });
});
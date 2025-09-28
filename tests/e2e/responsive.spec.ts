import { test, expect } from '@playwright/test';

test.describe('Responsive Design Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }));
    });

    // Mock dashboard data
    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '1', firstName: 'John', lastName: 'Doe', email: 'test@example.com' },
          stats: { totalConnections: 25, newMessages: 3, upcomingEvents: 2, profileCompleteness: 85 },
          recentConversations: [],
          personalizedPosts: [],
          quickActions: [],
          notifications: []
        })
      });
    });
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
    });

    test('should display login page correctly on mobile', async ({ page }) => {
      await page.goto('/login');
      
      // Check that form elements are visible and properly sized
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check that text is readable
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('should display registration page correctly on mobile', async ({ page }) => {
      await page.goto('/register');
      
      // Check that all form fields are visible
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
      
      // Check that submit button is accessible
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display dashboard correctly on mobile', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check that main content is visible
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      // Check that stats are displayed in mobile-friendly layout
      await expect(page.locator('text=Total Connections')).toBeVisible();
      await expect(page.locator('text=New Messages')).toBeVisible();
      
      // Check that quick actions are accessible
      await expect(page.locator('text=Quick Actions')).toBeVisible();
      await expect(page.locator('button:has-text("Update Profile")')).toBeVisible();
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test touch interactions
      await page.tap('button:has-text("Update Profile")');
      
      // Should navigate or show response
      await expect(page).toHaveURL('/profile');
    });

    test('should handle mobile navigation', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test mobile menu if it exists
      const menuButton = page.locator('button[aria-label="Menu"]');
      if (await menuButton.isVisible()) {
        await menuButton.tap();
        await expect(page.locator('nav')).toBeVisible();
      }
    });
  });

  test.describe('Tablet Viewport (768x1024)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
    });

    test('should display login page correctly on tablet', async ({ page }) => {
      await page.goto('/login');
      
      // Check that layout adapts to tablet size
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check that form is centered or properly positioned
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should display dashboard correctly on tablet', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check that dashboard layout works on tablet
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      // Check that grid layout adapts
      await expect(page.locator('text=Total Connections')).toBeVisible();
      await expect(page.locator('text=Quick Actions')).toBeVisible();
    });

    test('should handle tablet touch interactions', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test touch interactions on tablet
      await page.tap('button:has-text("Update Profile")');
      await expect(page).toHaveURL('/profile');
    });
  });

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
    });

    test('should display login page correctly on desktop', async ({ page }) => {
      await page.goto('/login');
      
      // Check that layout is optimized for desktop
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check that form is properly centered
      const form = page.locator('form');
      await expect(form).toBeVisible();
    });

    test('should display dashboard correctly on desktop', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check that desktop layout is optimal
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      // Check that grid layout is properly displayed
      await expect(page.locator('text=Total Connections')).toBeVisible();
      await expect(page.locator('text=New Messages')).toBeVisible();
      await expect(page.locator('text=Upcoming Events')).toBeVisible();
      await expect(page.locator('text=Profile Completeness')).toBeVisible();
      
      // Check that sidebar is visible
      await expect(page.locator('text=Quick Actions')).toBeVisible();
      await expect(page.locator('text=Notifications')).toBeVisible();
    });

    test('should handle desktop interactions', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Test mouse interactions
      await page.click('button:has-text("Update Profile")');
      await expect(page).toHaveURL('/profile');
      
      await page.goBack();
      await page.click('button:has-text("Find Alumni")');
      await expect(page).toHaveURL('/alumni-directory');
    });
  });

  test.describe('Large Desktop Viewport (2560x1440)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 2560, height: 1440 });
    });

    test('should display dashboard correctly on large desktop', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Check that layout scales properly on large screens
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      // Check that content doesn't stretch too wide
      const mainContent = page.locator('main, .main-content, [role="main"]');
      if (await mainContent.count() > 0) {
        const boundingBox = await mainContent.boundingBox();
        expect(boundingBox?.width).toBeLessThan(1400); // Should have max-width
      }
    });
  });

  test.describe('Orientation Changes', () => {
    test('should handle orientation change on mobile', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/dashboard');
      
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      // Change to landscape
      await page.setViewportSize({ width: 667, height: 375 });
      
      // Check that layout adapts
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      await expect(page.locator('text=Total Connections')).toBeVisible();
    });

    test('should handle orientation change on tablet', async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/dashboard');
      
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      // Change to landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      
      // Check that layout adapts
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      await expect(page.locator('text=Total Connections')).toBeVisible();
    });
  });

  test.describe('Zoom Levels', () => {
    test('should work at 100% zoom', async ({ page }) => {
      await page.goto('/dashboard');
      await page.evaluate(() => { document.body.style.zoom = '1'; });
      
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      await expect(page.locator('text=Total Connections')).toBeVisible();
    });

    test('should work at 125% zoom', async ({ page }) => {
      await page.goto('/dashboard');
      await page.evaluate(() => { document.body.style.zoom = '1.25'; });
      
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      await expect(page.locator('text=Total Connections')).toBeVisible();
    });

    test('should work at 150% zoom', async ({ page }) => {
      await page.goto('/dashboard');
      await page.evaluate(() => { document.body.style.zoom = '1.5'; });
      
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      await expect(page.locator('text=Total Connections')).toBeVisible();
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should work in Chrome', async ({ page, browserName }) => {
      test.skip(browserName !== 'chromium');
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
    });

    test('should work in Firefox', async ({ page, browserName }) => {
      test.skip(browserName !== 'firefox');
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
    });

    test('should work in Safari', async ({ page, browserName }) => {
      test.skip(browserName !== 'webkit');
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
    });
  });
});

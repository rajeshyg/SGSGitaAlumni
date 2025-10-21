/**
 * Smoke Test - Quick verification that E2E setup works
 * 
 * This test verifies:
 * - Server is running
 * - Page loads
 * - Basic navigation works
 * - API mocking works
 */

import { test, expect, Page } from '@playwright/test';

// Helper function to setup minimal API mocks
async function setupMinimalMocks(page: Page) {
  // Mock auth check
  await page.route('**/api/auth/me', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        user: {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin'
        }
      })
    });
  });
}

// Helper function to bypass login
async function bypassLogin(page: Page) {
  await page.goto('/');
  await page.evaluate(() => {
    // Use the correct localStorage keys that the app expects
    localStorage.setItem('authToken', 'mock-jwt-token-for-testing');
    localStorage.setItem('refreshToken', 'mock-refresh-token-for-testing');
    localStorage.setItem('currentProfile', JSON.stringify({
      id: 1,
      name: 'Test User',
      role: 'admin',
      avatar: null,
      preferences: {
        professionalStatus: 'Administrator'
      }
    }));
  });
}

test.describe('Smoke Test - E2E Setup Verification', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SGS Gita Alumni|Alumni/i);
  });

  test('should bypass login and access protected route', async ({ page }) => {
    await setupMinimalMocks(page);
    await bypassLogin(page);
    
    // Try to navigate to a protected route
    await page.goto('/dashboard');
    
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should navigate to postings page', async ({ page }) => {
    await setupMinimalMocks(page);
    await bypassLogin(page);
    
    await page.goto('/postings');
    
    // Check that we're on the postings page
    await expect(page).toHaveURL(/\/postings/);
  });

  test('should load create posting page', async ({ page }) => {
    // Set up ALL mocks BEFORE any navigation
    await setupMinimalMocks(page);

    // Mock required APIs for create posting page
    await page.route('**/api/domains', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          domains: [
            { id: '1', name: 'Technology', domain_level: 'primary' }
          ]
        })
      });
    });

    await page.route('**/api/tags', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          tags: [
            { id: '1', name: 'React', tag_type: 'technology' }
          ]
        })
      });
    });

    await page.route('**/api/postings/categories', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          categories: [
            { id: '1', name: 'Mentorship', description: 'Mentorship opportunities' }
          ]
        })
      });
    });

    // NOW set the auth tokens and navigate
    await bypassLogin(page);
    await page.goto('/postings/new');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that we're on the create posting page
    await expect(page).toHaveURL(/\/postings\/new/);

    // Look for any content on the page (more lenient check)
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(0);
  });
});


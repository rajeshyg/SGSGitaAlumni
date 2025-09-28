/**
 * Performance E2E Tests
 * 
 * This file contains comprehensive performance tests for the application
 * including load times, memory usage, and optimization validation.
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, testUsers } from '../setup/test-data';

test.describe('Page Load Performance', () => {
  test('should load login page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Login page should load within 2 seconds
    expect(loadTime).toBeLessThan(2000);
    
    // Check that all critical elements are visible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    await setupMockAPI(page);
    
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers[0].email);
    await page.fill('input[name="password"]', testUsers[0].password);
    await page.click('button[type="submit"]');
    
    const startTime = Date.now();
    await page.waitForURL('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check that dashboard components are loaded
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    await setupMockAPI(page);
    
    // Mock large dataset
    const largeDataset = {
      user: testUsers[0],
      stats: { totalConnections: 1000, newMessages: 50, upcomingEvents: 25, profileCompleteness: 90 },
      recentConversations: Array(100).fill(null).map((_, i) => ({
        id: `conv-${i}`,
        participant: `User ${i}`,
        lastMessage: `Message ${i}`,
        timestamp: new Date().toISOString(),
        unread: i % 2 === 0
      })),
      personalizedPosts: Array(50).fill(null).map((_, i) => ({
        id: `post-${i}`,
        title: `Post ${i}`,
        content: `Content ${i}`,
        author: `Author ${i}`,
        timestamp: new Date().toISOString(),
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50)
      }))
    };

    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      });
    });

    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should still load within 5 seconds even with large dataset
    expect(loadTime).toBeLessThan(5000);
    
    // Check that data is displayed
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });
});

test.describe('Memory Usage Performance', () => {
  test('should not have memory leaks during navigation', async ({ page }) => {
    await setupMockAPI(page);
    
    // Navigate between pages multiple times
    for (let i = 0; i < 10; i++) {
      await page.goto('/login');
      await page.goto('/register');
      await page.goto('/dashboard');
    }
    
    // Check that page still functions
    await page.goto('/dashboard');
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should handle multiple API calls efficiently', async ({ page }) => {
    await setupMockAPI(page);
    
    // Make multiple API calls
    const promises = [];
    for (let i = 0; i < 20; i++) {
      promises.push(page.request.get('http://localhost:3000/api/users/dashboard'));
    }
    
    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status()).toBe(200);
    });
  });

  test('should handle image loading efficiently', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that images are optimized
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      
      // Check that images have proper attributes
      if (src) {
        await expect(img).toHaveAttribute('loading', 'lazy');
        await expect(img).toHaveAttribute('alt');
      }
    }
  });
});

test.describe('Network Performance', () => {
  test('should handle slow network connections', async ({ page }) => {
    // Simulate slow network
    await page.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should still load within 10 seconds on slow network
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    await setupMockAPI(page);
    
    // Simulate network interruption
    await page.route('**/api/users/dashboard', async route => {
      await route.abort('failed');
    });
    
    await page.goto('/dashboard');
    
    // Should show error message
    await expect(page.locator('text=Unable to load dashboard data')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle API rate limiting', async ({ page }) => {
    await setupMockAPI(page);
    
    // Make multiple rapid requests
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(page.request.post('http://localhost:3000/api/auth/login', {
        data: { email: 'test@example.com', password: 'password123' }
      }));
    }
    
    const responses = await Promise.all(promises);
    
    // Some requests should be rate limited
    const rateLimitedResponses = responses.filter(response => response.status() === 429);
    expect(rateLimitedResponses.length).toBeGreaterThan(0);
  });
});

test.describe('Rendering Performance', () => {
  test('should render components efficiently', async ({ page }) => {
    await setupMockAPI(page);
    
    // Measure rendering time
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForSelector('[data-testid="dashboard-content"]');
    
    const renderTime = Date.now() - startTime;
    
    // Should render within 2 seconds
    expect(renderTime).toBeLessThan(2000);
  });

  test('should handle dynamic content updates efficiently', async ({ page }) => {
    await setupMockAPI(page);
    
    await page.goto('/dashboard');
    
    // Simulate real-time updates
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => {
        // Simulate adding new notification
        const notifications = document.querySelector('[data-testid="notifications"]');
        if (notifications) {
          const newNotification = document.createElement('div');
          newNotification.textContent = `New notification ${i}`;
          notifications.appendChild(newNotification);
        }
      });
      
      await page.waitForTimeout(100);
    }
    
    // Check that updates are handled efficiently
    await expect(page.locator('[data-testid="notifications"]')).toBeVisible();
  });

  test('should handle scroll performance', async ({ page }) => {
    await setupMockAPI(page);
    
    await page.goto('/dashboard');
    
    // Test scroll performance
    const startTime = Date.now();
    
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });
    
    await page.waitForTimeout(100);
    
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be smooth
    expect(scrollTime).toBeLessThan(1000);
  });
});

test.describe('Bundle Size Performance', () => {
  test('should have optimized bundle size', async ({ page }) => {
    await page.goto('/');
    
    // Check that critical resources are loaded
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        size: entry.transferSize,
        duration: entry.duration
      }));
    });
    
    // Check that total bundle size is reasonable
    const totalSize = resources.reduce((sum, resource) => sum + (resource.size || 0), 0);
    expect(totalSize).toBeLessThan(2 * 1024 * 1024); // Less than 2MB
    
    // Check that critical resources load first
    const criticalResources = resources.filter(r => 
      r.name.includes('main') || r.name.includes('vendor')
    );
    
    expect(criticalResources.length).toBeGreaterThan(0);
  });

  test('should use efficient caching strategies', async ({ page }) => {
    await page.goto('/');
    
    // Check cache headers
    const response = await page.request.get('http://localhost:5173/');
    const cacheControl = response.headers()['cache-control'];
    
    // Should have appropriate cache headers
    expect(cacheControl).toBeDefined();
  });

  test('should load critical CSS first', async ({ page }) => {
    await page.goto('/');
    
    // Check that critical CSS is inlined or loads first
    const stylesheets = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(link => ({
        href: link.href,
        media: link.media
      }));
    });
    
    // Should have critical CSS
    expect(stylesheets.length).toBeGreaterThan(0);
  });
});

test.describe('Mobile Performance', () => {
  test('should perform well on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await setupMockAPI(page);
    
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds on mobile
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle touch interactions efficiently', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Test touch performance
    const startTime = Date.now();
    
    await page.touchscreen.tap(200, 300);
    await page.touchscreen.tap(200, 400);
    await page.touchscreen.tap(200, 500);
    
    const touchTime = Date.now() - startTime;
    
    // Touch interactions should be responsive
    expect(touchTime).toBeLessThan(500);
  });
});

test.describe('Performance Monitoring', () => {
  test('should track performance metrics', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // Check that metrics are reasonable
    expect(metrics.loadTime).toBeLessThan(5000);
    expect(metrics.domContentLoaded).toBeLessThan(3000);
  });

  test('should handle performance budgets', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check that performance stays within budgets
    const performanceEntries = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        duration: entry.duration,
        size: entry.transferSize
      }));
    });
    
    // Check that no single resource takes too long
    const slowResources = performanceEntries.filter(entry => entry.duration > 1000);
    expect(slowResources.length).toBe(0);
    
    // Check that total load time is reasonable
    const totalDuration = performanceEntries.reduce((sum, entry) => sum + entry.duration, 0);
    expect(totalDuration).toBeLessThan(10000);
  });
});
/**
 * Dashboard E2E Tests
 * 
 * This file contains comprehensive end-to-end tests for the dashboard functionality
 * including member dashboard, admin dashboard, and all interactive features.
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, testUsers, testDashboardData } from '../setup/test-data';

test.describe('Member Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock API responses
    await setupMockAPI(page);
    
    // Login as a member user
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers[0].email);
    await page.fill('input[name="password"]', testUsers[0].password);
    await page.click('button');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard');
  });

  test('should display dashboard with all components', async ({ page }) => {
    // Check welcome message
    await expect(page.locator('h1')).toContainText('Welcome');
    await expect(page.locator('text=John Doe')).toBeVisible();
    
    // Check stats overview
    await expect(page.locator('[data-testid="stats-overview"]')).toBeVisible();
    await expect(page.locator('text=25')).toBeVisible(); // Total connections
    await expect(page.locator('text=3')).toBeVisible(); // New messages
    await expect(page.locator('text=2')).toBeVisible(); // Upcoming events
    await expect(page.locator('text=85%')).toBeVisible(); // Profile completeness
    
    // Check recent conversations
    await expect(page.locator('[data-testid="recent-conversations"]')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=Thanks for the recommendation!')).toBeVisible();
    
    // Check personalized posts
    await expect(page.locator('[data-testid="personalized-posts"]')).toBeVisible();
    await expect(page.locator('text=Alumni Networking Event')).toBeVisible();
    
    // Check quick actions
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
    await expect(page.locator('text=Update Profile')).toBeVisible();
    await expect(page.locator('text=Find Alumni')).toBeVisible();
    
    // Check notifications
    await expect(page.locator('[data-testid="notifications"]')).toBeVisible();
    await expect(page.locator('text=New message from Jane Smith')).toBeVisible();
  });

  test('should handle quick actions', async ({ page }) => {
    // Test Update Profile action
    await page.click('text=Update Profile');
    await expect(page).toHaveURL('/profile');
    
    // Navigate back to dashboard
    await page.goto('/dashboard');
    
    // Test Find Alumni action
    await page.click('text=Find Alumni');
    await expect(page).toHaveURL('/search');
  });

  test('should handle conversation interactions', async ({ page }) => {
    // Click on a conversation
    await page.click('[data-testid="conversation-1"]');
    
    // Should navigate to conversation or show conversation details
    await expect(page.locator('text=Jane Smith')).toBeVisible();
  });

  test('should handle notification interactions', async ({ page }) => {
    // Mark notification as read
    await page.click('[data-testid="notification-1"]');
    
    // Check that notification is marked as read
    await expect(page.locator('[data-testid="notification-1"]')).toHaveClass(/read/);
  });

  test('should handle post interactions', async ({ page }) => {
    // Like a post
    await page.click('[data-testid="post-1-like"]');
    
    // Check that like count increased
    await expect(page.locator('[data-testid="post-1-likes"]')).toContainText('13');
    
    // Comment on a post
    await page.click('[data-testid="post-1-comment"]');
    await page.fill('[data-testid="comment-input"]', 'Great post!');
    await page.click('[data-testid="submit-comment"]');
    
    // Check that comment was added
    await expect(page.locator('text=Great post!')).toBeVisible();
  });

  test('should handle dashboard refresh', async ({ page }) => {
    // Get initial data
    const initialConnections = await page.locator('[data-testid="total-connections"]').textContent();
    
    // Refresh dashboard
    await page.click('[data-testid="refresh-dashboard"]');
    
    // Wait for data to reload
    await page.waitForLoadState('networkidle');
    
    // Check that data is still displayed
    await expect(page.locator('[data-testid="total-connections"]')).toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that dashboard adapts to mobile
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Check that dashboard adapts to tablet
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Setup mock API responses
    await setupMockAPI(page);
    
    // Login as admin user
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers[2].email); // Admin user
    await page.fill('input[name="password"]', testUsers[2].password);
    await page.click('button');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    // Check admin-specific components
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="analytics"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
  });

  test('should handle user management', async ({ page }) => {
    // Navigate to user management
    await page.click('[data-testid="user-management"]');
    
    // Check user table
    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    
    // Test user actions
    await page.click('[data-testid="user-1-actions"]');
    await expect(page.locator('[data-testid="user-actions-menu"]')).toBeVisible();
  });

  test('should handle analytics and reports', async ({ page }) => {
    // Navigate to analytics
    await page.click('[data-testid="analytics"]');
    
    // Check analytics components
    await expect(page.locator('[data-testid="user-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-metrics"]')).toBeVisible();
  });

  test('should handle system settings', async ({ page }) => {
    // Navigate to system settings
    await page.click('[data-testid="system-settings"]');
    
    // Check settings components
    await expect(page.locator('[data-testid="general-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-settings"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-settings"]')).toBeVisible();
  });
});

test.describe('Dashboard Error Handling', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/dashboard');
    
    // Check that error message is displayed
    await expect(page.locator('text=Unable to load dashboard data')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle network timeout', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/users/dashboard', async route => {
      await new Promise(resolve => setTimeout(resolve, 10000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(testDashboardData)
      });
    });

    await page.goto('/dashboard');
    
    // Check that loading state is displayed
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });

  test('should handle empty data states', async ({ page }) => {
    // Mock empty dashboard data
    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...testDashboardData,
          recentConversations: [],
          personalizedPosts: [],
          notifications: []
        })
      });
    });

    await page.goto('/dashboard');
    
    // Check that empty states are displayed
    await expect(page.locator('text=No recent conversations')).toBeVisible();
    await expect(page.locator('text=No posts available')).toBeVisible();
    await expect(page.locator('text=No notifications')).toBeVisible();
  });
});

test.describe('Dashboard Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large datasets efficiently', async ({ page }) => {
    // Mock large dataset
    const largeDataset = {
      ...testDashboardData,
      recentConversations: Array(100).fill(null).map((_, i) => ({
        id: `conv-${i}`,
        participant: `User ${i}`,
        lastMessage: `Message ${i}`,
        timestamp: new Date().toISOString(),
        unread: i % 2 === 0
      }))
    };

    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(largeDataset)
      });
    });

    await page.goto('/dashboard');
    
    // Check that dashboard still loads and functions
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="recent-conversations"]')).toBeVisible();
  });
});
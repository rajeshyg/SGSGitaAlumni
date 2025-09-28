/**
 * Responsive Design E2E Tests
 * 
 * This file contains comprehensive tests for responsive design across
 * different devices, screen sizes, and orientations.
 */

import { test, expect } from '@playwright/test';
import { setupMockAPI, testUsers } from '../setup/test-data';

test.describe('Mobile Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAPI(page);
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  });

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('/');
    
    // Check mobile menu button
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Check menu items
    await expect(page.locator('text=Home')).toBeVisible();
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Profile')).toBeVisible();
  });

  test('should handle mobile login form', async ({ page }) => {
    await page.goto('/login');
    
    // Check form layout
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Test form interaction
    await page.fill('input[name="email"]', testUsers[0].email);
    await page.fill('input[name="password"]', testUsers[0].password);
    
    // Check that form is properly sized for mobile
    const emailInput = page.locator('input[name="email"]');
    const emailBox = await emailInput.boundingBox();
    expect(emailBox?.width).toBeGreaterThan(300); // Should be wide enough for mobile
  });

  test('should handle mobile dashboard layout', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUsers[0].email);
    await page.fill('input[name="password"]', testUsers[0].password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Check mobile dashboard layout
    await expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
    
    // Check that components are stacked vertically
    const statsSection = page.locator('[data-testid="stats-overview"]');
    const conversationsSection = page.locator('[data-testid="recent-conversations"]');
    
    const statsBox = await statsSection.boundingBox();
    const conversationsBox = await conversationsSection.boundingBox();
    
    // Conversations should be below stats
    expect(conversationsBox?.y).toBeGreaterThan(statsBox?.y || 0);
  });

  test('should handle mobile touch interactions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test swipe gestures
    await page.touchscreen.tap(200, 300);
    await page.touchscreen.tap(200, 200);
    
    // Test touch scrolling
    await page.touchscreen.tap(200, 400);
    await page.mouse.wheel(0, -100);
    
    // Check that touch interactions work
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });

  test('should handle mobile keyboard', async ({ page }) => {
    await page.goto('/login');
    
    // Test mobile keyboard input
    await page.click('input[name="email"]');
    await page.keyboard.type(testUsers[0].email);
    
    await page.click('input[name="password"]');
    await page.keyboard.type(testUsers[0].password);
    
    // Check that inputs have correct values
    await expect(page.locator('input[name="email"]')).toHaveValue(testUsers[0].email);
    await expect(page.locator('input[name="password"]')).toHaveValue(testUsers[0].password);
  });
});

test.describe('Tablet Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAPI(page);
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
  });

  test('should display tablet layout', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check tablet-specific layout
    await expect(page.locator('[data-testid="tablet-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="tablet-content"]')).toBeVisible();
    
    // Check that sidebar is visible
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('should handle tablet orientation changes', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test portrait orientation
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // Test landscape orientation
    await page.setViewportSize({ width: 1024, height: 768 });
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // Check that layout adapts
    const contentBox = await page.locator('[data-testid="dashboard-content"]').boundingBox();
    expect(contentBox?.width).toBeGreaterThan(700);
  });

  test('should handle tablet touch and mouse interactions', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test touch interactions
    await page.touchscreen.tap(400, 300);
    
    // Test mouse interactions
    await page.hover('[data-testid="quick-actions"]');
    await page.click('[data-testid="quick-action-1"]');
    
    // Both should work
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
  });
});

test.describe('Desktop Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockAPI(page);
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
  });

  test('should display desktop layout', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check desktop-specific layout
    await expect(page.locator('[data-testid="desktop-sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-header"]')).toBeVisible();
  });

  test('should handle desktop hover states', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test hover effects
    await page.hover('[data-testid="quick-action-1"]');
    await expect(page.locator('[data-testid="quick-action-1"]')).toHaveClass(/hover/);
    
    await page.hover('[data-testid="notification-1"]');
    await expect(page.locator('[data-testid="notification-1"]')).toHaveClass(/hover/);
  });

  test('should handle desktop keyboard navigation', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Check that focus is visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should handle large desktop screens', async ({ page }) => {
    await page.setViewportSize({ width: 2560, height: 1440 }); // Large desktop
    
    await page.goto('/dashboard');
    
    // Check that layout scales properly
    const contentBox = await page.locator('[data-testid="dashboard-content"]').boundingBox();
    expect(contentBox?.width).toBeLessThan(2000); // Should not be too wide
    
    // Check that sidebar is still functional
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
});

test.describe('Cross-Device Consistency', () => {
  test('should maintain functionality across devices', async ({ page }) => {
    const devices = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    for (const device of devices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/login');
      
      // Check that login form is always functional
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Test form submission
      await page.fill('input[name="email"]', testUsers[0].email);
      await page.fill('input[name="password"]', testUsers[0].password);
      await page.click('button[type="submit"]');
      
      // Should work on all devices
      await expect(page).toHaveURL('/dashboard');
    }
  });

  test('should handle device-specific features', async ({ page }) => {
    // Test mobile-specific features
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    
    // Mobile should have touch-optimized buttons
    const mobileButton = page.locator('[data-testid="mobile-action-button"]');
    if (await mobileButton.isVisible()) {
      const buttonBox = await mobileButton.boundingBox();
      expect(buttonBox?.height).toBeGreaterThan(44); // Minimum touch target size
    }
    
    // Test desktop-specific features
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    
    // Desktop should have hover states
    await page.hover('[data-testid="desktop-hover-element"]');
    // Hover effects should be visible
  });
});

test.describe('Accessibility and Responsive Design', () => {
  test('should maintain accessibility across screen sizes', async ({ page }) => {
    const devices = [
      { width: 375, height: 667 },
      { width: 768, height: 1024 },
      { width: 1920, height: 1080 }
    ];

    for (const device of devices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/dashboard');
      
      // Check that all interactive elements are accessible
      const interactiveElements = page.locator('button, input, select, textarea, [role="button"]');
      const count = await interactiveElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = interactiveElements.nth(i);
        await expect(element).toBeVisible();
        
        // Check that elements are properly sized for touch
        if (device.width <= 768) {
          const box = await element.boundingBox();
          if (box) {
            expect(box.height).toBeGreaterThan(20); // Minimum touch target
          }
        }
      }
    }
  });

  test('should handle high contrast mode', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    // Check that content is still readable
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // Check that contrast is maintained
    const textElement = page.locator('h1');
    const textColor = await textElement.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(textColor).not.toBe('transparent');
  });

  test('should handle reduced motion preferences', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Simulate reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' });
    
    // Check that animations are disabled
    const animatedElement = page.locator('[data-testid="animated-element"]');
    if (await animatedElement.isVisible()) {
      const animation = await animatedElement.evaluate(el => 
        window.getComputedStyle(el).animation
      );
      expect(animation).toBe('none');
    }
  });
});
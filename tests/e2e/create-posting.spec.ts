/**
 * E2E Tests for CreatePostingPage - 4-Step Wizard
 *
 * Tests the complete posting creation flow including:
 * - Step navigation and validation
 * - Form field interactions
 * - Visual card selections
 * - Draft saving
 * - Submission
 * - Mobile/tablet/desktop responsiveness
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const validPostingData = {
  title: 'Software Development Mentorship Opportunity',
  description: 'I am offering mentorship in software development, focusing on React, TypeScript, and modern web development practices. This is a great opportunity for beginners to learn from experienced developers.',
  location: 'Remote - Global',
  duration: '3 months',
  contactName: 'John Doe',
  contactEmail: 'john.doe@example.com',
  contactPhone: '+1-555-123-4567'
};

// Mock API responses
const mockDomains = [
  { id: '1', name: 'Technology', domain_level: 'primary' },
  { id: '2', name: 'Education', domain_level: 'primary' },
  { id: '3', name: 'Healthcare', domain_level: 'secondary' }
];

const mockTags = [
  { id: '1', name: 'React', tag_type: 'technology' },
  { id: '2', name: 'Mentorship', tag_type: 'activity' }
];

const mockCategories = [
  { id: '1', name: 'Job Opening', description: 'Full-time or part-time job opportunities' },
  { id: '2', name: 'Internship', description: 'Internship opportunities' },
  { id: '3', name: 'Mentorship', description: 'Mentorship and guidance' }
];

// Helper function to setup API mocks
async function setupAPIMocks(page: Page) {
  // Mock authentication check
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

  // Mock domains API
  await page.route('**/api/domains', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        domains: mockDomains
      })
    });
  });

  // Mock tags API
  await page.route('**/api/tags', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        tags: mockTags
      })
    });
  });

  // Mock categories API
  await page.route('**/api/postings/categories', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        categories: mockCategories
      })
    });
  });

  // Mock posting creation API
  await page.route('**/api/postings', async route => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          posting: { id: 'new-posting-id' }
        })
      });
    } else if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          postings: []
        })
      });
    }
  });
}

// Helper function to login before tests
async function loginAsTestUser(page: Page) {
  // Bypass login by setting auth token in localStorage
  // This avoids OTP issues and speeds up tests
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

// Helper function to navigate to create posting page
async function navigateToCreatePosting(page: Page) {
  // Navigate through authenticated app flow: PostingsPage -> CreatePostingPage
  await page.goto('/postings');

  // Wait for PostingsPage to load by waiting for the Create Posting button
  await page.waitForSelector('button:has-text("Create Posting")', { timeout: 10000 });

  // Click "Create Posting" button to navigate to create posting page
  await page.click('button:has-text("Create Posting")');

  // Wait for the Create Posting page header to be visible (confirms CreatePostingPage loaded)
  await page.waitForSelector('h1:has-text("Create New Posting")', { timeout: 10000 });
}

test.describe('CreatePostingPage - 4-Step Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
    await navigateToCreatePosting(page);
  });

  test.describe('Step Indicator', () => {
    test('should display step indicator with correct initial state', async ({ page }) => {
      // Check step indicator is visible
      await expect(page.locator('text=Step 1 of 4')).toBeVisible();
      
      // Check progress percentage
      await expect(page.locator('text=25% Complete')).toBeVisible();
      
      // Check step circles
      const stepCircles = page.locator('[role="button"][aria-pressed]');
      await expect(stepCircles).toHaveCount(4);
      
      // First step should be active
      const firstStep = stepCircles.first();
      await expect(firstStep).toHaveAttribute('aria-pressed', 'true');
    });

    test('should update progress as user navigates steps', async ({ page }) => {
      // Fill Step 1 and go to Step 2
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      await page.click('button:has-text("Next")');
      
      // Check Step 2 indicator
      await expect(page.locator('text=Step 2 of 4')).toBeVisible();
      await expect(page.locator('text=50% Complete')).toBeVisible();
    });
  });

  test.describe('Step 1: Basic Information', () => {
    test('should display all Step 1 fields', async ({ page }) => {
      // Check posting type cards
      await expect(page.locator('text=Offering Support')).toBeVisible();
      await expect(page.locator('text=Seeking Support')).toBeVisible();
      
      // Check category dropdown
      await expect(page.locator('select[name="category"]')).toBeVisible();
      
      // Check title input
      await expect(page.locator('input[name="title"]')).toBeVisible();
      
      // Check character counter
      await expect(page.locator('text=0 / 200')).toBeVisible();
    });

    test('should select posting type with visual feedback', async ({ page }) => {
      const offerCard = page.locator('text=Offering Support').locator('..');
      
      // Click offer support card
      await offerCard.click();
      
      // Check card has selected styling (ring border)
      await expect(offerCard).toHaveClass(/ring-2/);
    });

    test('should validate required fields', async ({ page }) => {
      // Try to proceed without filling fields
      await page.click('button:has-text("Next")');
      
      // Check error messages
      await expect(page.locator('text=Please select a category')).toBeVisible();
      await expect(page.locator('text=Title is required')).toBeVisible();
    });

    test('should validate title length', async ({ page }) => {
      // Test minimum length
      await page.fill('input[name="title"]', 'Short');
      await page.click('button:has-text("Next")');
      await expect(page.locator('text=Title must be at least 10 characters')).toBeVisible();
      
      // Test maximum length
      const longTitle = 'A'.repeat(201);
      await page.fill('input[name="title"]', longTitle);
      await page.click('button:has-text("Next")');
      await expect(page.locator('text=Title must be less than 200 characters')).toBeVisible();
    });

    test('should update character counter as user types', async ({ page }) => {
      await page.fill('input[name="title"]', 'Test Title');
      await expect(page.locator('text=10 / 200')).toBeVisible();
    });

    test('should proceed to Step 2 when valid', async ({ page }) => {
      // Fill all required fields
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      
      // Click Next
      await page.click('button:has-text("Next")');
      
      // Should be on Step 2
      await expect(page.locator('text=Step 2 of 4')).toBeVisible();
    });
  });

  test.describe('Step 2: Details & Domain', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Step 1
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      await page.click('button:has-text("Next")');
    });

    test('should display all Step 2 fields', async ({ page }) => {
      // Check domain multi-select
      await expect(page.locator('text=Select Domains')).toBeVisible();
      
      // Check description textarea
      await expect(page.locator('textarea[name="description"]')).toBeVisible();
      
      // Check tags multi-select
      await expect(page.locator('text=Tags (Optional)')).toBeVisible();
      
      // Check character counter
      await expect(page.locator('text=0 / 2000')).toBeVisible();
    });

    test('should add and remove domains', async ({ page }) => {
      // Add domain
      await page.click('select[name="domain"]');
      await page.selectOption('select[name="domain"]', { index: 1 });
      
      // Check domain badge appears
      const domainBadge = page.locator('.badge').first();
      await expect(domainBadge).toBeVisible();
      
      // Remove domain
      await domainBadge.locator('button').click();
      await expect(domainBadge).not.toBeVisible();
    });

    test('should validate description length', async ({ page }) => {
      // Test minimum length
      await page.fill('textarea[name="description"]', 'Too short');
      await page.click('button:has-text("Next")');
      await expect(page.locator('text=Description must be at least 50 characters')).toBeVisible();
      
      // Test maximum length
      const longDesc = 'A'.repeat(2001);
      await page.fill('textarea[name="description"]', longDesc);
      await page.click('button:has-text("Next")');
      await expect(page.locator('text=Description must be less than 2000 characters')).toBeVisible();
    });

    test('should validate at least one domain selected', async ({ page }) => {
      await page.fill('textarea[name="description"]', validPostingData.description);
      await page.click('button:has-text("Next")');
      await expect(page.locator('text=Please select at least one domain')).toBeVisible();
    });

    test('should navigate back to Step 1', async ({ page }) => {
      await page.click('button:has-text("Previous")');
      await expect(page.locator('text=Step 1 of 4')).toBeVisible();
    });
  });

  test.describe('Step 3: Logistics & Timing', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Steps 1 and 2
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      await page.click('button:has-text("Next")');
      
      await page.selectOption('select[name="domain"]', { index: 1 });
      await page.fill('textarea[name="description"]', validPostingData.description);
      await page.click('button:has-text("Next")');
    });

    test('should display all Step 3 fields', async ({ page }) => {
      // Check urgency level cards
      await expect(page.locator('text=Low Priority')).toBeVisible();
      await expect(page.locator('text=Medium Priority')).toBeVisible();
      await expect(page.locator('text=High Priority')).toBeVisible();
      await expect(page.locator('text=Critical')).toBeVisible();
      
      // Check location fields
      await expect(page.locator('input[name="location"]')).toBeVisible();
      await expect(page.locator('select[name="locationType"]')).toBeVisible();
      
      // Check timing fields
      await expect(page.locator('input[name="duration"]')).toBeVisible();
      await expect(page.locator('input[name="expiryDate"]')).toBeVisible();
      await expect(page.locator('select[name="maxConnections"]')).toBeVisible();
    });

    test('should select urgency level with color-coded cards', async ({ page }) => {
      // Click high priority card
      const highCard = page.locator('text=High Priority').locator('..');
      await highCard.click();
      
      // Check card has selected styling with orange color
      await expect(highCard).toHaveClass(/border-orange-500/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('button:has-text("Next")');
      
      await expect(page.locator('text=Location is required')).toBeVisible();
      await expect(page.locator('text=Duration is required')).toBeVisible();
      await expect(page.locator('text=Expiry date is required')).toBeVisible();
    });
  });

  test.describe('Step 4: Contact & Preview', () => {
    test.beforeEach(async ({ page }) => {
      // Complete Steps 1-3
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      await page.click('button:has-text("Next")');
      
      await page.selectOption('select[name="domain"]', { index: 1 });
      await page.fill('textarea[name="description"]', validPostingData.description);
      await page.click('button:has-text("Next")');
      
      await page.click('text=Medium Priority');
      await page.fill('input[name="location"]', validPostingData.location);
      await page.fill('input[name="duration"]', validPostingData.duration);
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await page.fill('input[name="expiryDate"]', futureDate);
      await page.click('button:has-text("Next")');
    });

    test('should display contact form and preview', async ({ page }) => {
      // Check contact fields
      await expect(page.locator('input[name="contactName"]')).toBeVisible();
      await expect(page.locator('input[name="contactEmail"]')).toBeVisible();
      await expect(page.locator('input[name="contactPhone"]')).toBeVisible();
      
      // Check preview section
      await expect(page.locator('text=Posting Preview')).toBeVisible();
    });

    test('should validate email format', async ({ page }) => {
      await page.fill('input[name="contactEmail"]', 'invalid-email');
      await page.click('button:has-text("Submit for Review")');
      await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
    });

    test('should display posting preview with all data', async ({ page }) => {
      // Check title in preview
      await expect(page.locator(`text=${validPostingData.title}`)).toBeVisible();
      
      // Check description in preview
      await expect(page.locator(`text=${validPostingData.description}`)).toBeVisible();
      
      // Check badges
      await expect(page.locator('text=Offering Support')).toBeVisible();
      await expect(page.locator('text=Medium Priority')).toBeVisible();
    });
  });

  test.describe('Save Draft Functionality', () => {
    test('should save draft at any step', async ({ page }) => {
      // Fill Step 1
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      
      // Click Save Draft
      await page.click('button:has-text("Save Draft")');
      
      // Should redirect to postings page
      await page.waitForURL('/postings');
      
      // Check success message
      await expect(page.locator('text=Draft saved successfully')).toBeVisible();
    });
  });

  test.describe('Complete Submission Flow', () => {
    test('should complete full wizard and submit posting', async ({ page }) => {
      // Step 1
      await page.click('text=Offering Support');
      await page.selectOption('select[name="category"]', { index: 1 });
      await page.fill('input[name="title"]', validPostingData.title);
      await page.click('button:has-text("Next")');

      // Step 2
      await page.selectOption('select[name="domain"]', { index: 1 });
      await page.fill('textarea[name="description"]', validPostingData.description);
      await page.click('button:has-text("Next")');

      // Step 3
      await page.click('text=Medium Priority');
      await page.fill('input[name="location"]', validPostingData.location);
      await page.fill('input[name="duration"]', validPostingData.duration);
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      await page.fill('input[name="expiryDate"]', futureDate);
      await page.click('button:has-text("Next")');

      // Step 4
      await page.fill('input[name="contactName"]', validPostingData.contactName);
      await page.fill('input[name="contactEmail"]', validPostingData.contactEmail);
      await page.fill('input[name="contactPhone"]', validPostingData.contactPhone);

      // Submit
      await page.click('button:has-text("Submit for Review")');

      // Should redirect to postings page
      await page.waitForURL('/postings');

      // Check success message
      await expect(page.locator('text=Posting submitted successfully')).toBeVisible();
    });
  });

  test.describe('Cancel Functionality', () => {
    test('should cancel and return to postings page', async ({ page }) => {
      await page.click('button:has-text("Cancel")');
      await page.waitForURL('/postings');
    });
  });
});

// Responsive Design Tests
test.describe('CreatePostingPage - Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
    await navigateToCreatePosting(page);
  });

  test('should display mobile-optimized layout', async ({ page }) => {
    // Check that step titles are hidden on mobile (sm:block class)
    const stepTitles = page.locator('text=Basic Info');
    await expect(stepTitles).toBeHidden();

    // Check buttons have minimum 44px height for touch targets
    const nextButton = page.locator('button:has-text("Next")');
    const buttonHeight = await nextButton.evaluate(el => el.getBoundingClientRect().height);
    expect(buttonHeight).toBeGreaterThanOrEqual(44);
  });

  test('should handle touch interactions on selection cards', async ({ page }) => {
    const offerCard = page.locator('text=Offering Support').locator('..');

    // Tap card
    await offerCard.tap();

    // Check card is selected
    await expect(offerCard).toHaveClass(/ring-2/);
  });

  test('should stack form fields vertically on mobile', async ({ page }) => {
    // Complete Step 1 to get to Step 2
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);
    await page.click('button:has-text("Next")');

    // Check that form uses vertical layout
    const formContainer = page.locator('form').first();
    const containerWidth = await formContainer.evaluate(el => el.getBoundingClientRect().width);
    expect(containerWidth).toBeLessThan(768); // Mobile breakpoint
  });
});

test.describe('CreatePostingPage - Tablet Responsiveness', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
    await navigateToCreatePosting(page);
  });

  test('should display tablet-optimized layout', async ({ page }) => {
    // Check that step titles are visible on tablet
    await expect(page.locator('text=Basic Info')).toBeVisible();

    // Check selection cards are displayed in grid
    const cards = page.locator('[role="button"][aria-pressed]');
    await expect(cards).toHaveCount(2); // Offer/Seek cards
  });

  test('should handle two-column layout for urgency cards', async ({ page }) => {
    // Navigate to Step 3
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);
    await page.click('button:has-text("Next")');

    await page.selectOption('select[name="domain"]', { index: 1 });
    await page.fill('textarea[name="description"]', validPostingData.description);
    await page.click('button:has-text("Next")');

    // Check urgency cards layout
    const urgencyCards = page.locator('text=Low Priority, Medium Priority, High Priority, Critical');
    await expect(urgencyCards.first()).toBeVisible();
  });
});

test.describe('CreatePostingPage - Desktop Responsiveness', () => {
  test.use({ viewport: { width: 1920, height: 1080 } });

  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
    await navigateToCreatePosting(page);
  });

  test('should display desktop-optimized layout', async ({ page }) => {
    // Check max-width container
    const container = page.locator('.max-w-4xl').first();
    await expect(container).toBeVisible();

    // Check all step titles are visible
    await expect(page.locator('text=Basic Info')).toBeVisible();
    await expect(page.locator('text=Details')).toBeVisible();
    await expect(page.locator('text=Logistics')).toBeVisible();
    await expect(page.locator('text=Contact')).toBeVisible();
  });

  test('should display selection cards in horizontal grid', async ({ page }) => {
    // Check posting type cards are side-by-side
    const offerCard = page.locator('text=Offering Support').locator('..');
    const seekCard = page.locator('text=Seeking Support').locator('..');

    const offerBox = await offerCard.boundingBox();
    const seekBox = await seekCard.boundingBox();

    // Cards should be on same horizontal line (similar Y position)
    expect(Math.abs((offerBox?.y || 0) - (seekBox?.y || 0))).toBeLessThan(10);
  });

  test('should display urgency cards in 4-column grid', async ({ page }) => {
    // Navigate to Step 3
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);
    await page.click('button:has-text("Next")');

    await page.selectOption('select[name="domain"]', { index: 1 });
    await page.fill('textarea[name="description"]', validPostingData.description);
    await page.click('button:has-text("Next")');

    // Check all 4 urgency cards are visible
    await expect(page.locator('text=Low Priority')).toBeVisible();
    await expect(page.locator('text=Medium Priority')).toBeVisible();
    await expect(page.locator('text=High Priority')).toBeVisible();
    await expect(page.locator('text=Critical')).toBeVisible();
  });
});

// Accessibility Tests
test.describe('CreatePostingPage - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
    await navigateToCreatePosting(page);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    // Check selection cards have role="button"
    const selectionCards = page.locator('[role="button"][aria-pressed]');
    await expect(selectionCards.first()).toHaveAttribute('role', 'button');

    // Check aria-pressed attribute
    const offerCard = page.locator('text=Offering Support').locator('..');
    await offerCard.click();
    await expect(offerCard).toHaveAttribute('aria-pressed', 'true');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab to first selection card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Enter to select
    await page.keyboard.press('Enter');

    // Check card is selected
    const offerCard = page.locator('text=Offering Support').locator('..');
    await expect(offerCard).toHaveClass(/ring-2/);
  });

  test('should support Space key for selection', async ({ page }) => {
    // Tab to selection card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Press Space to select
    await page.keyboard.press('Space');

    // Check card is selected
    const offerCard = page.locator('text=Offering Support').locator('..');
    await expect(offerCard).toHaveClass(/ring-2/);
  });

  test('should have proper form labels', async ({ page }) => {
    // Check title input has label
    const titleLabel = page.locator('label:has-text("Title")');
    await expect(titleLabel).toBeVisible();

    // Check category select has label
    const categoryLabel = page.locator('label:has-text("Category")');
    await expect(categoryLabel).toBeVisible();
  });

  test('should have visible focus indicators', async ({ page }) => {
    // Tab to title input
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Check focus is visible (browser default or custom)
    const titleInput = page.locator('input[name="title"]');
    await expect(titleInput).toBeFocused();
  });

  test('should announce errors to screen readers', async ({ page }) => {
    // Try to proceed without filling fields
    await page.click('button:has-text("Next")');

    // Check error alert has proper role
    const errorAlert = page.locator('[role="alert"]');
    await expect(errorAlert).toBeVisible();
  });
});

// Performance Tests
test.describe('CreatePostingPage - Performance', () => {
  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
  });

  test('should load page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await navigateToCreatePosting(page);
    const loadTime = Date.now() - startTime;

    // Page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid step navigation without lag', async ({ page }) => {
    await navigateToCreatePosting(page);

    // Fill Step 1
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);

    // Rapidly navigate forward and backward
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(100);
    await page.click('button:has-text("Previous")');
    await page.waitForTimeout(100);
    await page.click('button:has-text("Next")');

    // Should be on Step 2 without errors
    await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  });

  test('should handle large text input without performance degradation', async ({ page }) => {
    await navigateToCreatePosting(page);

    // Fill Step 1 and navigate to Step 2
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);
    await page.click('button:has-text("Next")');

    // Type large description
    const largeText = 'A'.repeat(1500);
    const startTime = Date.now();
    await page.fill('textarea[name="description"]', largeText);
    const fillTime = Date.now() - startTime;

    // Should complete within 1 second
    expect(fillTime).toBeLessThan(1000);

    // Character counter should update
    await expect(page.locator('text=1500 / 2000')).toBeVisible();
  });
});

// Error Handling Tests
test.describe('CreatePostingPage - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await setupAPIMocks(page);
    await loginAsTestUser(page);
    await navigateToCreatePosting(page);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/postings', route => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    // Complete wizard and submit
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);
    await page.click('button:has-text("Next")');

    await page.selectOption('select[name="domain"]', { index: 1 });
    await page.fill('textarea[name="description"]', validPostingData.description);
    await page.click('button:has-text("Next")');

    await page.click('text=Medium Priority');
    await page.fill('input[name="location"]', validPostingData.location);
    await page.fill('input[name="duration"]', validPostingData.duration);
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.fill('input[name="expiryDate"]', futureDate);
    await page.click('button:has-text("Next")');

    await page.fill('input[name="contactName"]', validPostingData.contactName);
    await page.fill('input[name="contactEmail"]', validPostingData.contactEmail);
    await page.click('button:has-text("Submit for Review")');

    // Should display error message
    await expect(page.locator('text=Failed to')).toBeVisible();
  });

  test('should clear errors when user makes corrections', async ({ page }) => {
    // Try to proceed without filling fields
    await page.click('button:has-text("Next")');

    // Error should be visible
    await expect(page.locator('text=Title is required')).toBeVisible();

    // Fill title
    await page.fill('input[name="title"]', validPostingData.title);

    // Error should clear
    await expect(page.locator('text=Title is required')).not.toBeVisible();
  });

  test('should handle network timeout gracefully', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/postings', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true })
        });
      }, 5000);
    });

    // Complete wizard and submit
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', validPostingData.title);
    await page.click('button:has-text("Next")');

    await page.selectOption('select[name="domain"]', { index: 1 });
    await page.fill('textarea[name="description"]', validPostingData.description);
    await page.click('button:has-text("Next")');

    await page.click('text=Medium Priority');
    await page.fill('input[name="location"]', validPostingData.location);
    await page.fill('input[name="duration"]', validPostingData.duration);
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await page.fill('input[name="expiryDate"]', futureDate);
    await page.click('button:has-text("Next")');

    await page.fill('input[name="contactName"]', validPostingData.contactName);
    await page.fill('input[name="contactEmail"]', validPostingData.contactEmail);
    await page.click('button:has-text("Submit for Review")');

    // Should show loading state
    await expect(page.locator('button:has-text("Submitting")')).toBeVisible();
  });
});


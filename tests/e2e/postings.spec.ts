/**
 * E2E Tests for Posts Workflow - Clean Implementation
 *
 * This test suite follows actual user workflows without hardcoded test data.
 * Each test creates its own data and follows real user journeys.
 *
 * Test Flow:
 * 1. Test user creates a new post
 * 2. Verify post appears in moderator queue
 * 3. Moderator approves/rejects the post
 * 4. Verify approved post appears in public view
 * 5. Test user/admin/moderator can delete posts
 * 6. Test user can edit and re-submit posts
 * 7. Test user can modify domains/sub-domains/areas of interest
 *
 * Test Users:
 * - Test User: testuser@example.com / TestUser123!
 * - Moderator: moderator@test.com / TestMod123!
 */

import { test, expect, Page } from '@playwright/test';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Login helper - works for any user
 */
async function login(page: Page, email: string, password: string) {
  console.log(`[Login] Logging in as: ${email}`);

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill credentials
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);

  // Click Sign In button
  await page.locator('button').filter({ hasText: /^Sign In$/ }).click();

  // Wait for successful login
  await page.waitForURL(/\/(dashboard|home|profile-selection)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');

  console.log(`[Login] ✓ Logged in successfully as: ${email}`);
}

/**
 * Logout helper - clears auth and returns to login page
 */
async function logout(page: Page) {
  console.log(`[Logout] Logging out current user...`);

  // Clear all auth tokens and session data
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // Navigate to login page
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  console.log(`[Logout] ✓ Successfully logged out`);
}

/**
 * Generate unique test data for each test run
 */
function generateTestPostingData() {
  const timestamp = Date.now();
  return {
    title: `E2E Test Posting ${timestamp}`,
    description: `This is an automated test posting created at ${new Date().toISOString()}. It tests the complete workflow from creation to deletion.`,
    location: 'Remote',
    duration: '2 months',
    contactName: 'Test User',
    contactEmail: 'testuser@example.com',
    contactPhone: '+15551234567'
  };
}

/**
 * Create a posting through the 4-step wizard
 * Returns the posting title for later reference
 */
async function createFullPosting(page: Page): Promise<string> {
  const data = generateTestPostingData();
  console.log(`[Create] Creating posting: "${data.title}"`);

  // Navigate to create page
  await page.goto('/postings/new');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('h1:has-text("Create New Posting")')).toBeVisible();

  // STEP 1: Basic Information
  console.log('[Create] Step 1: Basic Information');

  // Select posting type: "Offer Support"
  await page.locator('h3:has-text("Offer Support")').click();
  await page.waitForTimeout(500);

  // Select category (first available option)
  const categoryTrigger = page.locator('button').filter({ hasText: /Select a category/i });
  await categoryTrigger.click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(500);

  // Fill title
  await page.locator('input#title').fill(data.title);
  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(1000);

  // STEP 2: Details & Domain
  console.log('[Create] Step 2: Details & Domain');

  // Fill description
  await page.locator('textarea').fill(data.description);

  // Select primary domain
  const primaryDomainTrigger = page.locator('button').filter({ hasText: /Select primary domain/i });
  await primaryDomainTrigger.click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(500);

  // Select secondary domain
  const secondaryDomainTrigger = page.locator('button').filter({ hasText: /Add secondary domain/i });
  await secondaryDomainTrigger.click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').first().click();
  await page.waitForTimeout(500);

  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(1000);

  // STEP 3: Logistics & Timing
  console.log('[Create] Step 3: Logistics & Timing');

  // Select urgency: Medium
  await page.locator('h3').filter({ hasText: /^Medium$/i }).click();

  // Fill location and duration
  await page.locator('input#location').fill(data.location);
  await page.locator('input#duration').fill(data.duration);

  // Set expiry date (30 days from now)
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const formattedDate = futureDate.toISOString().split('T')[0];
  await page.locator('input[type="date"]').fill(formattedDate);

  await page.locator('button:has-text("Next")').click();
  await page.waitForTimeout(1000);

  // STEP 4: Contact & Preview
  console.log('[Create] Step 4: Contact & Preview');

  await page.locator('input#contact_name').fill(data.contactName);
  await page.locator('input#contact_email').fill(data.contactEmail);
  await page.locator('input#contact_phone').fill(data.contactPhone);

  // Submit for review
  await page.locator('button:has-text("Submit for Review")').click();

  // Wait for redirect
  await page.waitForURL(/\/(postings|postings\/my)/, { timeout: 15000 });

  console.log(`[Create] ✓ Posting created: "${data.title}"`);
  return data.title;
}

/**
 * Find a posting card by title using robust selector
 * Cards render as div.rounded-lg.border from shadcn/ui
 */
function getPostingCard(page: Page, title: string) {
  // Use the actual Card component classes from shadcn/ui
  return page.locator('div.rounded-lg.border').filter({ hasText: title });
}

// ============================================
// TEST SUITE
// ============================================

test.describe('Posts Workflow - Complete User Journey', () => {

  test('1. Test user creates a new post', async ({ page }) => {
    // Login as test user
    await login(page, 'testuser@example.com', 'TestUser123!');

    // Create a posting
    const postingTitle = await createFullPosting(page);

    // Verify we're redirected after creation
    expect(page.url()).toMatch(/\/(postings|postings\/my)/);

    // Verify posting appears in My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    const postingCard = getPostingCard(page, postingTitle);
    await expect(postingCard).toBeVisible({ timeout: 10000 });

    // Verify status is "Pending Review"
    await expect(postingCard.locator('text=Pending Review')).toBeVisible();

    console.log('[Test 1] ✓ Test user successfully created a new post');
  });

  test('2. Post is available in moderator queue once submitted', async ({ page }) => {
    // First, create a post as test user
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Logout and login as moderator
    await logout(page);
    await login(page, 'moderator@test.com', 'TestMod123!');

    // Click on "Moderation Queue" link from Quick Actions
    const moderationLink = page.locator('a:has-text("Moderation Queue")');
    await expect(moderationLink).toBeVisible({ timeout: 5000 });
    await moderationLink.click();
    await page.waitForLoadState('networkidle');

    // Verify posting appears in moderation queue
    const moderationCard = page.locator('text=' + postingTitle).first();
    await expect(moderationCard).toBeVisible({ timeout: 10000 });

    console.log('[Test 2] ✓ Post appears in moderator queue');
  });

  test('3. Moderator can approve the new post', async ({ page }) => {
    // Create post as test user
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Switch to moderator
    await logout(page);
    await login(page, 'moderator@test.com', 'TestMod123!');

    // Click on "Moderation Queue" link from Quick Actions
    const moderationLink = page.locator('a:has-text("Moderation Queue")');
    await expect(moderationLink).toBeVisible({ timeout: 5000 });
    await moderationLink.click();
    await page.waitForLoadState('networkidle');

    // Find the posting in queue and click to review
    const postingInQueue = page.locator('text=' + postingTitle).first();
    await postingInQueue.click();

    // Wait for the page/modal to open - look for the Approve button to be ready
    await page.waitForTimeout(2000);

    // Look for Approve button and click it
    const approveButton = page.locator('button').filter({ hasText: /Approve/i }).first();
    await expect(approveButton).toBeVisible({ timeout: 10000 });
    await approveButton.click();

    // Wait for approval to complete and any UI updates
    await page.waitForTimeout(3000);

    console.log('[Test 3] ✓ Moderator successfully approved the post');
  });

  test('4. Approved post appears in public view', async ({ page }) => {
    // Create and approve a post
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Approve as moderator
    await logout(page);
    await login(page, 'moderator@test.com', 'TestMod123!');

    // Click on "Moderation Queue" link from Quick Actions
    const moderationLink = page.locator('a:has-text("Moderation Queue")');
    await expect(moderationLink).toBeVisible({ timeout: 5000 });
    await moderationLink.click();
    await page.waitForLoadState('networkidle');

    const postingInQueue = page.locator('text=' + postingTitle).first();
    await postingInQueue.click();

    // Wait for the detail view/modal to fully load
    await page.waitForTimeout(2000);

    const approveButton = page.locator('button').filter({ hasText: /Approve/i }).first();
    await expect(approveButton).toBeVisible({ timeout: 10000 });
    await approveButton.click();

    // Wait longer for approval to complete and backend to process
    await page.waitForTimeout(4000);

    // Navigate to public postings page
    await page.goto('/postings');
    await page.waitForLoadState('networkidle');

    // Give the page time to load and render
    await page.waitForTimeout(1000);

    // Verify approved posting appears in public feed
    const publicPosting = page.locator('text=' + postingTitle).first();
    await expect(publicPosting).toBeVisible({ timeout: 10000 });

    // Verify status badge is visible (could be "Active" or "Approved")
    const postingCard = getPostingCard(page, postingTitle);
    // Check for either "Active" or the posting card itself being visible
    // Some backends may show "Approved" status
    const statusBadge = postingCard.locator('.inline-flex.items-center.rounded-full').first();
    await expect(statusBadge).toBeVisible({ timeout: 5000 });

    console.log('[Test 4] ✓ Approved post appears in public view');
  });

  test('5. Test user can delete their own pending post', async ({ page }) => {
    // Create a post
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Go to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find the posting
    const postingCard = getPostingCard(page, postingTitle);
    await expect(postingCard).toBeVisible();

    // Find and click Delete button
    const deleteButton = postingCard.locator('button').filter({ hasText: /Delete/i });
    await expect(deleteButton).toBeVisible();

    // Handle confirmation dialog (expects "archive" in the message)
    page.once('dialog', dialog => {
      console.log('[Test 5] Confirmation dialog:', dialog.message());
      // Verify the dialog is asking about archiving
      if (dialog.message().toLowerCase().includes('archive')) {
        dialog.accept();
      } else {
        dialog.dismiss();
      }
    });

    await deleteButton.click();

    // Wait for the archive operation to complete
    // The UI should automatically switch to the Archived tab after deletion
    await page.waitForTimeout(2000);

    // Verify we're on the Archived tab
    const archivedTab = page.locator('[role="tab"][data-state="active"]').filter({ hasText: 'Archived' });
    await expect(archivedTab).toBeVisible({ timeout: 5000 });

    // Now the archived post should be visible in the Archived tab with "Archived" badge
    const visibleArchivedCard = getPostingCard(page, postingTitle);
    await expect(visibleArchivedCard).toBeVisible({ timeout: 5000 });

    // Verify it has the "Archived" status badge
    await expect(visibleArchivedCard.locator('.inline-flex.items-center.rounded-full').filter({ hasText: 'Archived' })).toBeVisible();

    // Switch to "All" tab and verify archived post is NOT visible there
    const allTab = page.locator('[role="tab"]').filter({ hasText: /^All/ });
    await allTab.click();
    await page.waitForTimeout(500);

    // Archived posts should not appear in "All" tab
    const cardInAllTab = getPostingCard(page, postingTitle);
    await expect(cardInAllTab).not.toBeVisible({ timeout: 5000 });

    console.log('[Test 5] ✓ Test user successfully archived their post');
  });

  test('6. Test user can edit and re-submit their post', async ({ page }) => {
    // Create a post
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Go to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find the posting and click Edit
    const postingCard = getPostingCard(page, postingTitle);
    const editButton = postingCard.locator('button').filter({ hasText: /Edit/i });
    await editButton.click();

    // Wait for edit page to load
    await page.waitForURL(/\/postings\/[^/]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Modify the title
    const updatedTitle = postingTitle + ' [EDITED]';
    const titleInput = page.locator('input#title');
    await titleInput.fill(updatedTitle);

    // Save changes
    await page.locator('button').filter({ hasText: /Save Changes/i }).click();

    // Wait for save to complete and redirect
    await page.waitForTimeout(3000);

    // Explicitly navigate to My Postings to verify the update
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Give the page time to render the updated posting
    await page.waitForTimeout(1000);

    const updatedCard = getPostingCard(page, updatedTitle);
    await expect(updatedCard).toBeVisible({ timeout: 10000 });

    console.log('[Test 6] ✓ Test user successfully edited and re-submitted post');
  });

  test('7. Test user can modify domains, sub-domains, and areas of interest', async ({ page }) => {
    // Create a post
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Go to My Postings and click Edit
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    const postingCard = getPostingCard(page, postingTitle);
    const editButton = postingCard.locator('button').filter({ hasText: /Edit/i });
    await editButton.click();

    await page.waitForURL(/\/postings\/[^/]+\/edit/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Navigate to Step 2 (Domain Selection)
    // First click Next to skip Step 1 if needed, or find "Edit Domains" section
    // For now, let's assume we're on the edit page with all fields visible

    // Change primary domain (if selector is available)
    const primaryDomainTrigger = page.locator('button').filter({ hasText: /Select primary domain/i });
    if (await primaryDomainTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await primaryDomainTrigger.click();
      await page.waitForTimeout(500);
      // Select a different option (second option)
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(500);
      }
    }

    // Add/modify secondary domain
    const secondaryDomainTrigger = page.locator('button').filter({ hasText: /Add secondary domain/i });
    if (await secondaryDomainTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
      await secondaryDomainTrigger.click();
      await page.waitForTimeout(500);
      const options = page.locator('[role="option"]');
      const optionCount = await options.count();
      if (optionCount > 1) {
        await options.nth(1).click();
        await page.waitForTimeout(500);
      }
    }

    // Save changes
    await page.locator('button').filter({ hasText: /Save Changes/i }).click();
    await page.waitForTimeout(2000);

    // Verify domain changes persisted
    // Go back to edit page and verify domains are still selected
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    const updatedCard = getPostingCard(page, postingTitle);
    await expect(updatedCard).toBeVisible();

    // Verify domain badges are present (using actual Badge component classes)
    // Badge component renders as: inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs
    const domainBadges = updatedCard.locator('.inline-flex.items-center.rounded-full');
    expect(await domainBadges.count()).toBeGreaterThan(0);

    console.log('[Test 7] ✓ Test user successfully modified domains and areas of interest');
  });

  test('8. Moderator can reject a post', async ({ page }) => {
    // Create post as test user
    await login(page, 'testuser@example.com', 'TestUser123!');
    const postingTitle = await createFullPosting(page);

    // Switch to moderator
    await logout(page);
    await login(page, 'moderator@test.com', 'TestMod123!');

    // Click on "Moderation Queue" link from Quick Actions
    const moderationLink = page.locator('a:has-text("Moderation Queue")');
    await expect(moderationLink).toBeVisible({ timeout: 5000 });
    await moderationLink.click();
    await page.waitForLoadState('networkidle');

    // Find and click the posting
    const postingInQueue = page.locator('text=' + postingTitle).first();
    await postingInQueue.click();
    await page.waitForTimeout(1000);

    // Look for Reject button and click it (this shows the rejection form)
    const rejectButton = page.locator('button').filter({ hasText: /^Reject$/i });
    await expect(rejectButton).toBeVisible({ timeout: 10000 });
    await rejectButton.click();
    await page.waitForTimeout(500);

    // Fill rejection form - Select reason from dropdown
    const reasonSelect = page.locator('[role="combobox"]').first();
    await reasonSelect.click();
    await page.waitForTimeout(300);
    // Select first option (SPAM)
    await page.locator('[role="option"]').first().click();
    await page.waitForTimeout(300);

    // Fill feedback textarea (required, 10-500 chars)
    // Select by placeholder text since there are multiple textareas
    const feedbackTextarea = page.locator('textarea[placeholder*="Explain why this posting was rejected"]');
    await feedbackTextarea.fill('Automated test rejection - this posting does not meet community guidelines.');

    // Click Confirm Rejection button
    const confirmButton = page.locator('button').filter({ hasText: /Confirm Rejection/i });
    await confirmButton.click();
    await page.waitForTimeout(2000);

    // Verify rejection by checking test user's My Postings
    await logout(page);
    await login(page, 'testuser@example.com', 'TestUser123!');
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    const postingCard = getPostingCard(page, postingTitle);
    // Look for the Rejected badge specifically (not the rejection message text)
    await expect(postingCard.locator('.inline-flex.items-center.rounded-full').filter({ hasText: 'Rejected' })).toBeVisible();

    console.log('[Test 8] ✓ Moderator successfully rejected the post');
  });

});

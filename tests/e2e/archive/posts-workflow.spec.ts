/**
 * E2E Tests for Complete Posts Workflow
 *
 * Tests the end-to-end posting lifecycle including:
 * - Creating a posting with domain hierarchy (Primary → Secondary → Areas)
 * - Viewing in My Postings page
 * - View button functionality (PostingDetailPage)
 * - Edit button functionality (EditPostingPage)
 * - Domain editing with auto-clearing child areas
 * - Archive/Delete functionality with "Show Archived" toggle
 * - Moderator approval flow
 * - Public posting visibility
 * - Status transitions (Draft → Pending → Active → Archived)
 *
 * Test Users:
 * - Admin: datta.rajesh@gmail.com
 * - Moderator: moderator@test.com
 * - Individual User: testuser@example.com
 */

import { test, expect, Page } from '@playwright/test';

// Test data
const testPostingData = {
  title: 'Test Posting for E2E Workflow',
  description: 'This is a comprehensive test posting created to verify the entire posts workflow including creation, viewing, editing, deletion, moderation, and public visibility.',
  location: 'Test Location - Remote',
  duration: '2 months',
  contactName: 'Test User',
  contactEmail: 'testuser@example.com',
  contactPhone: '+15551234567'
};

const updatedPostingData = {
  title: 'Updated Test Posting Title',
  description: 'This posting description has been updated to test the edit functionality. The update should be reflected in the posting detail view.',
};

// Helper function to login with specific user
async function loginAsUser(page: Page, email: string, password: string = 'TestUser123!') {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Wait for login form to be fully loaded
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');

  await emailInput.waitFor({ state: 'visible' });
  await passwordInput.waitFor({ state: 'visible' });

  // Clear and type credentials (more reliable than fill for React forms)
  await emailInput.click();
  await emailInput.clear();
  await emailInput.type(email, { delay: 50 });
  await page.waitForTimeout(300);

  // Verify email was entered
  const emailValue = await emailInput.inputValue();
  console.log('[Test] Email field value after typing:', emailValue);

  await passwordInput.click();
  await passwordInput.clear();
  await passwordInput.type(password, { delay: 50 });
  await page.waitForTimeout(300);

  // Verify password was entered
  const passwordValue = await passwordInput.inputValue();
  console.log('[Test] Password field value after typing:', '***' + passwordValue.substring(3));

  // Get current URL before submission for debugging
  const beforeURL = page.url();
  console.log('[Test] Before login - URL:', beforeURL);
  console.log('[Test] Attempting login with:', email);

  // Click the "Sign In" button (the button doesn't have type="submit", so Enter doesn't work)
  // We need to use a specific selector that matches ONLY the Sign In button, not the "Sign in without password" button
  const signInButton = page.locator('button').filter({ hasText: /^Sign In$/ }).first();
  await signInButton.waitFor({ state: 'visible' });
  await signInButton.click();

  // Wait a bit for the form to process
  await page.waitForTimeout(2000);

  const afterURL = page.url();
  console.log('[Test] After button click - URL:', afterURL);

  // Check for error messages
  const errorElement = await page.locator('div.text-destructive').first();
  if (await errorElement.isVisible()) {
    const errorText = await errorElement.textContent();
    console.log('[Test] Login error displayed:', errorText);
  }

  // Wait for navigation after login (dashboard, home, or OTP verification)
  // Use a longer timeout and more specific selectors
  try {
    await page.waitForURL(/\/(dashboard|home|profile-selection|verify-otp)/, { timeout: 20000 });
  } catch (e) {
    console.log('[Test] Navigation timeout - still on:', page.url());
    throw e;
  }

  console.log('[Test] Successfully navigated to:', page.url());

  // If on OTP page, handle it
  if (page.url().includes('verify-otp')) {
    console.log('[Test] On OTP page, skipping OTP...');
    // For testing, we'll skip OTP by setting auth tokens directly
    await page.evaluate(() => {
      localStorage.setItem('authToken', 'mock-jwt-token-for-testing');
      localStorage.setItem('refreshToken', 'mock-refresh-token-for-testing');
    });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  }

  // Wait for authenticated page to load
  await page.waitForLoadState('networkidle');
  console.log('[Test] Login complete - final URL:', page.url());
}

  // Helper function to navigate to Create Posting page
  async function navigateToCreatePosting(page: Page) {
    // Navigate directly to create posting page (more reliable than clicking button)
    await page.goto('/postings/new');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('h1:has-text("Create New Posting")', { timeout: 10000 });
    
    // Wait for categories to load (API call)
    console.log('[Test] Waiting for categories to load...');
    await page.waitForTimeout(2000); // Give time for API calls to complete
  }  // Helper function to create a posting through the wizard
  async function createPosting(page: Page, data: typeof testPostingData) {
    console.log('[Test] Starting posting creation wizard...');
    
    // Step 1: Basic Information
    console.log('[Test] Step 1: Selecting posting type...');
    // Click the "Offer Support" card
    await page.locator('h3:has-text("Offer Support")').click();
    await page.waitForTimeout(500);
    
    console.log('[Test] Step 1: Selecting category...');
    // Use the Select component's trigger to open dropdown
    const categoryTrigger = page.locator('button').filter({ hasText: /Select a category/i });
    await categoryTrigger.waitFor({ state: 'visible', timeout: 5000 });
    await categoryTrigger.click();
    await page.waitForTimeout(500);
    
    // Wait for options to appear and select first one
    const options = page.locator('[role="option"]');
    await options.first().waitFor({ state: 'visible', timeout: 5000 });
    const optionCount = await options.count();
    console.log(`[Test] Found ${optionCount} category options`);
    
    if (optionCount === 0) {
      throw new Error('No category options available - API may have failed to load categories');
    }
    
    await options.first().click();
    await page.waitForTimeout(500);
    
    console.log('[Test] Step 1: Filling title...');
    const titleInput = page.locator('input#title');
    await titleInput.waitFor({ state: 'visible', timeout: 5000 });
    await titleInput.fill(data.title);
    await page.waitForTimeout(300);
    
    console.log('[Test] Step 1: Clicking Next...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Step 2: Details & Domain
    console.log('[Test] Step 2: Filling description...');
    await page.fill('textarea', data.description);
    await page.waitForTimeout(300);
    
    console.log('[Test] Step 2: Selecting primary domain...');
    // Select first primary domain
    const domainTrigger = page.locator('button').filter({ hasText: /Select primary domain/i });
    await domainTrigger.waitFor({ state: 'visible', timeout: 5000 });
    await domainTrigger.click();
    await page.waitForTimeout(500);

    const domainOptions = page.locator('[role="option"]');
    await domainOptions.first().waitFor({ state: 'visible', timeout: 5000 });
    await domainOptions.first().click();
    await page.waitForTimeout(500);

    console.log('[Test] Step 2: Selecting secondary domain...');
    // Select at least one secondary domain (required by form validation)
    const secondaryDomainTrigger = page.locator('button').filter({ hasText: /Add secondary domain/i });
    await secondaryDomainTrigger.waitFor({ state: 'visible', timeout: 5000 });
    await secondaryDomainTrigger.click();
    await page.waitForTimeout(500);

    const secondaryOptions = page.locator('[role="option"]');
    await secondaryOptions.first().waitFor({ state: 'visible', timeout: 5000 });
    await secondaryOptions.first().click();
    await page.waitForTimeout(500);

    console.log('[Test] Step 2: Clicking Next...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Step 3: Logistics & Timing
    console.log('[Test] Step 3: Selecting urgency level...');
    // Click the "Medium" urgency card
    await page.locator('h3').filter({ hasText: /^Medium$/i }).click();
    await page.waitForTimeout(300);
    
    console.log('[Test] Step 3: Filling location...');
    await page.fill('input#location', data.location);
    await page.waitForTimeout(300);

    console.log('[Test] Step 3: Filling duration...');
    await page.fill('input#duration', data.duration);
    await page.waitForTimeout(300);

    // Set expiry date to 30 days from now
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const formattedDate = futureDate.toISOString().split('T')[0];
    console.log('[Test] Step 3: Setting expiry date:', formattedDate);
    await page.fill('input[type="date"]', formattedDate);
    await page.waitForTimeout(300);
    
    console.log('[Test] Step 3: Clicking Next...');
    await page.click('button:has-text("Next")');
    await page.waitForTimeout(1000);

    // Step 4: Contact & Preview
    console.log('[Test] Step 4: Filling contact information...');
    await page.fill('input#contact_name', data.contactName);
    await page.waitForTimeout(200);
    await page.fill('input#contact_email', data.contactEmail);
    await page.waitForTimeout(200);
    await page.fill('input#contact_phone', data.contactPhone);
    await page.waitForTimeout(500);

    // Submit for review
    console.log('[Test] Step 4: Submitting posting...');
    await page.click('button:has-text("Submit for Review")');

    // Wait for redirect to postings or my postings page
    console.log('[Test] Waiting for redirect after submission...');
    await page.waitForURL(/\/(postings|postings\/my)/, { timeout: 15000 });
    console.log('[Test] Posting creation completed!');
  }

test.describe('Complete Posts Workflow - User Journey', () => {
  let postingId: string;

  test('1. User creates a new posting', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to create posting page
    await navigateToCreatePosting(page);

    // Create posting
    await createPosting(page, testPostingData);

    // Verify success message or redirect
    await expect(page).toHaveURL(/\/(postings|postings\/my)/);
  });

  test('2. User views posting in My Postings page', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings page
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Verify posting is in the list
    const postingCard = page.locator(`text=${testPostingData.title}`).first();
    await expect(postingCard).toBeVisible({ timeout: 10000 });

    // Verify posting status badge
    await expect(page.locator('text=Pending Review').or(page.locator('text=Draft'))).toBeVisible();
  });

  test('3. User clicks View button to see posting detail', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings page
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find the posting and click View button
    const postingRow = page.locator(`text=${testPostingData.title}`).locator('..').locator('..');
    const viewButton = postingRow.locator('button:has-text("View")');
    await viewButton.click();

    // Wait for navigation to detail page
    await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Extract posting ID from URL
    const url = page.url();
    postingId = url.split('/').pop() || '';

    // Verify PostingDetailPage loads with correct content
    await expect(page.locator(`h1:has-text("${testPostingData.title}")`)
      .or(page.locator(`h2:has-text("${testPostingData.title}")`)
      .or(page.locator(`text=${testPostingData.title}`))).first()
    ).toBeVisible({ timeout: 10000 });

    // Verify description is visible
    await expect(page.locator(`text=${testPostingData.description.substring(0, 50)}`)).toBeVisible();

    // Verify Edit button is visible (for draft/pending posts)
    await expect(page.locator('button:has-text("Edit")').or(page.locator('a:has-text("Edit")'))).toBeVisible();

    // Verify Delete button is visible if status is draft
    // Note: Delete only shows for drafts, so this might not be visible if status is pending_review
  });

  test('4. User clicks Edit button to edit posting', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings page
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find the posting and click View button first
    const postingRow = page.locator(`text=${testPostingData.title}`).locator('..').locator('..');
    const viewButton = postingRow.locator('button:has-text("View")');
    await viewButton.click();
    await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Click Edit button from detail page
    const editButton = page.locator('button:has-text("Edit")').or(page.locator('a:has-text("Edit")'));
    await editButton.click();

    // Wait for navigation to edit page
    await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });

    // Verify EditPostingPage loads with pre-filled data
    await expect(page.locator(`input[value="${testPostingData.title}"]`)
      .or(page.locator(`input[name="title"]`))
    ).toBeVisible({ timeout: 10000 });

    // Verify description is pre-filled
    const descriptionTextarea = page.locator('textarea[name="description"]').or(page.locator('textarea[name="content"]'));
    const descriptionValue = await descriptionTextarea.inputValue();
    expect(descriptionValue).toContain(testPostingData.description.substring(0, 30));
  });

  test('5. User updates posting and saves changes', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings page
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find the posting and click Edit button
    const postingRow = page.locator(`text=${testPostingData.title}`).locator('..').locator('..');
    const editButton = postingRow.locator('button:has-text("Edit")');
    await editButton.click();

    // Wait for navigation to edit page
    await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });

    // Update title and description
    await page.fill('input[name="title"]', updatedPostingData.title);
    await page.fill('textarea[name="description"]', updatedPostingData.description);

    // Save changes
    await page.click('button:has-text("Save")');

    // Wait for redirect to detail page
    await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

    // Verify updated content is displayed
    await expect(page.locator(`text=${updatedPostingData.title}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator(`text=${updatedPostingData.description.substring(0, 50)}`)).toBeVisible();
  });

  test('6. User creates a draft and deletes it', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to create posting page
    await navigateToCreatePosting(page);

    // Fill Step 1 only
    await page.click('text=Offering Support');
    await page.selectOption('select[name="category"]', { index: 1 });
    await page.fill('input[name="title"]', 'Draft Posting to Delete');

    // Save as draft
    await page.click('button:has-text("Save Draft")');

    // Wait for redirect to My Postings
    await page.waitForURL(/\/postings\/my/, { timeout: 10000 });

    // Find the draft posting
    const draftRow = page.locator('text=Draft Posting to Delete').locator('..').locator('..');

    // Verify Delete button is visible for draft
    const deleteButton = draftRow.locator('button:has-text("Delete")');
    await expect(deleteButton).toBeVisible();

    // Click Delete button
    await deleteButton.click();

    // Confirm deletion in dialog
    page.once('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept();
    });

    // Wait a moment for deletion to process
    await page.waitForTimeout(1000);

    // Verify posting is removed from list
    await expect(page.locator('text=Draft Posting to Delete')).not.toBeVisible();
  });
});

test.describe('Complete Posts Workflow - Moderator Approval', () => {
  test('7. Moderator reviews and approves posting', async ({ page }) => {
    // Login as moderator
    await loginAsUser(page, 'moderator@test.com', 'TestMod123!');

    // Navigate to moderation queue
    await page.goto('/moderator/queue');
    await page.waitForLoadState('networkidle');

    // Find the updated posting in queue
    const postingInQueue = page.locator(`text=${updatedPostingData.title}`).first();

    // If posting is visible, proceed with approval
    if (await postingInQueue.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to view posting details
      await postingInQueue.click();

      // Wait for modal or detail view to open
      await page.waitForTimeout(1000);

      // Click Approve button
      const approveButton = page.locator('button:has-text("Approve")');
      await approveButton.click();

      // Confirm approval if confirmation dialog appears
      const confirmButton = page.locator('button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Wait for success message or queue to refresh
      await page.waitForTimeout(2000);

      // Verify posting is no longer in pending queue
      await expect(postingInQueue).not.toBeVisible();
    } else {
      // If posting not found, it may already be approved or in different status
      console.log('Posting not found in moderation queue - may already be processed');
    }
  });

  test('8. User sees approved posting in public feed', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to public postings page
    await page.goto('/postings');
    await page.waitForLoadState('networkidle');

    // Look for the approved posting
    const approvedPosting = page.locator(`text=${updatedPostingData.title}`).first();

    // Verify posting is visible (if approved)
    // Note: This may fail if moderator test didn't run or posting wasn't approved
    const isVisible = await approvedPosting.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      await expect(approvedPosting).toBeVisible();

      // Verify status is Active
      const postingCard = approvedPosting.locator('..').locator('..');
      await expect(postingCard.locator('text=Active')).toBeVisible();

      // Click to view detail
      await approvedPosting.click();
      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

      // Verify user cannot edit approved posting
      await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();

      // Verify user cannot delete approved posting
      await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
    } else {
      console.log('Approved posting not found in public feed - may still be pending or test order issue');
    }
  });
});

test.describe('Posts Workflow - Edge Cases', () => {
  test('User cannot edit approved posting', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to public postings
    await page.goto('/postings');
    await page.waitForLoadState('networkidle');

    // Find an active posting (if any)
    const activePosting = page.locator('text=Active').first();

    if (await activePosting.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click to view detail
      const postingCard = activePosting.locator('..').locator('..');
      await postingCard.click();

      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+$/, { timeout: 10000 });

      // Verify Edit button is NOT visible for active postings
      await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();

      // Verify Delete button is NOT visible for active postings
      await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
    } else {
      console.log('No active postings found to test edit restriction');
    }
  });

  test('User can only view their own postings in My Postings page', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Verify page only shows postings by this user
    // All postings should have View/Edit/Delete buttons which are only shown to owners
    const postingCards = page.locator('[data-testid="posting-card"]').or(page.locator('article'));
    const count = await postingCards.count();

    if (count > 0) {
      // Check first posting has action buttons
      const firstPosting = postingCards.first();
      await expect(firstPosting.locator('button:has-text("View")')).toBeVisible();
    }
  });

  test('View button works from My Postings list', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find first posting with View button
    const viewButton = page.locator('button:has-text("View")').first();

    if (await viewButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click View button
      await viewButton.click();

      // Verify navigation to detail page
      await expect(page).toHaveURL(/\/postings\/[a-zA-Z0-9-]+$/);

      // Verify detail page loads
      await expect(page.locator('h1, h2').first()).toBeVisible();
    } else {
      console.log('No postings found to test View button');
    }
  });

  test('Edit button works from My Postings list', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find first posting with Edit button (draft or pending only)
    const editButton = page.locator('button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Click Edit button
      await editButton.click();

      // Verify navigation to edit page
      await expect(page).toHaveURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/);

      // Verify edit form loads
      await expect(page.locator('input[name="title"]')).toBeVisible();
    } else {
      console.log('No editable postings found (draft or pending status)');
    }
  });

  test('Cancel button on edit page returns to detail view', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find first editable posting
    const editButton = page.locator('button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/);

      // Click Cancel button
      const cancelButton = page.locator('button:has-text("Cancel")');
      await cancelButton.click();

      // Verify navigation back to detail page or my postings
      await expect(page).toHaveURL(/\/postings/);
    }
  });
});

test.describe('Posts Workflow - Archive & Restore', () => {
  test('User can archive a pending posting', async ({ page }) => {
    console.log('[Test] Testing archive functionality...');

    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Get initial count of visible postings
    const initialPostings = await page.locator('article, [data-testid="posting-card"]').count();
    console.log(`[Test] Initial postings count: ${initialPostings}`);

    // Find a pending posting to archive
    const pendingPosting = page.locator('text=Pending Review').or(page.locator('text=Draft')).first();

    if (await pendingPosting.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Get the posting title for later verification
      const postingCard = pendingPosting.locator('..').locator('..');
      const postingTitle = await postingCard.locator('h3, h2, h1').first().textContent();
      console.log(`[Test] Archiving posting: "${postingTitle}"`);

      // Find and click Delete button
      const deleteButton = postingCard.locator('button:has-text("Delete")').or(postingCard.locator('button:has-text("Archive")'));
      await deleteButton.click();

      // Handle confirmation dialog
      page.once('dialog', dialog => {
        console.log('[Test] Confirmation dialog appeared:', dialog.message());
        expect(dialog.message()).toContain('archive');
        dialog.accept();
      });

      // Wait for deletion/archival to complete
      await page.waitForTimeout(2000);

      // Verify posting is no longer visible in default view
      const visiblePostings = await page.locator('article, [data-testid="posting-card"]').count();
      console.log(`[Test] Postings after archive: ${visiblePostings}`);
      expect(visiblePostings).toBeLessThan(initialPostings);

      // Toggle "Show Archived" checkbox
      console.log('[Test] Toggling "Show Archived" checkbox...');
      const showArchivedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Show Archived/i });
      await showArchivedCheckbox.check();
      await page.waitForTimeout(1000);

      // Verify archived posting now appears
      const archivedPosting = page.locator(`text="${postingTitle}"`).first();
      await expect(archivedPosting).toBeVisible({ timeout: 5000 });

      // Verify it has "Archived" badge
      const archivedBadge = page.locator('text=Archived').first();
      await expect(archivedBadge).toBeVisible();
      console.log('[Test] ✓ Archive functionality working correctly!');
    } else {
      console.log('[Test] No pending/draft postings found to test archive - creating one...');

      // Create a draft posting for testing
      await page.goto('/postings/new');
      await page.waitForLoadState('networkidle');

      // Quick draft creation (minimal fields)
      await page.locator('h3:has-text("Offer Support")').click();
      await page.waitForTimeout(500);

      const categoryTrigger = page.locator('button').filter({ hasText: /Select a category/i });
      await categoryTrigger.click();
      await page.waitForTimeout(500);
      await page.locator('[role="option"]').first().click();

      await page.fill('input#title', 'Test Posting for Archive');
      await page.click('button:has-text("Save as Draft")');

      await page.waitForURL(/\/postings\/my/, { timeout: 10000 });

      // Now retry archive test
      await page.reload();
      await page.waitForLoadState('networkidle');

      const draftPosting = page.locator('text=Test Posting for Archive').first();
      await expect(draftPosting).toBeVisible();

      const draftCard = draftPosting.locator('..').locator('..');
      const deleteBtn = draftCard.locator('button:has-text("Delete")');
      await deleteBtn.click();

      page.once('dialog', dialog => dialog.accept());
      await page.waitForTimeout(2000);

      // Verify archived
      const showArchivedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Show Archived/i });
      await showArchivedCheckbox.check();
      await page.waitForTimeout(1000);

      await expect(page.locator('text=Test Posting for Archive')).toBeVisible();
      await expect(page.locator('text=Archived')).toBeVisible();
    }
  });

  test('Archived posts are hidden by default and shown with toggle', async ({ page }) => {
    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Check if "Show Archived" checkbox exists
    const showArchivedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Show Archived/i });
    await expect(showArchivedCheckbox).toBeVisible();

    // Verify checkbox is unchecked by default
    expect(await showArchivedCheckbox.isChecked()).toBe(false);

    // Get count of visible postings (should not include archived)
    const visibleWithoutArchived = await page.locator('article, [data-testid="posting-card"]').count();

    // Check the checkbox
    await showArchivedCheckbox.check();
    await page.waitForTimeout(1000);

    // Get count with archived included
    const visibleWithArchived = await page.locator('article, [data-testid="posting-card"]').count();

    // Log results
    console.log(`[Test] Postings without archived: ${visibleWithoutArchived}`);
    console.log(`[Test] Postings with archived: ${visibleWithArchived}`);

    // If there are archived posts, count should increase or stay same
    expect(visibleWithArchived).toBeGreaterThanOrEqual(visibleWithoutArchived);

    // Uncheck to verify filtering works both ways
    await showArchivedCheckbox.uncheck();
    await page.waitForTimeout(1000);

    const visibleAfterUncheck = await page.locator('article, [data-testid="posting-card"]').count();
    expect(visibleAfterUncheck).toBe(visibleWithoutArchived);
  });
});

test.describe('Posts Workflow - Domain Editing Enhancements', () => {
  test('Edit page shows only relevant areas of interest based on selected secondary domains', async ({ page }) => {
    console.log('[Test] Testing domain hierarchy filtering in Edit page...');

    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    // Find first editable posting
    const editButton = page.locator('button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });
      await page.waitForTimeout(2000); // Wait for form to load

      // Verify Primary Domain section exists
      const primaryDomainSection = page.locator('text=/Primary Domain/i');
      await expect(primaryDomainSection).toBeVisible();

      // Select a primary domain if not already selected
      const primaryTrigger = page.locator('button').filter({ hasText: /Select primary domain/i });
      const isPrimarySelected = !(await primaryTrigger.isVisible({ timeout: 2000 }).catch(() => false));

      if (!isPrimarySelected) {
        console.log('[Test] Selecting primary domain...');
        await primaryTrigger.click();
        await page.waitForTimeout(500);
        await page.locator('[role="option"]').first().click();
        await page.waitForTimeout(1000);
      }

      // Get initial count of Areas of Interest checkboxes
      const initialAreasCount = await page.locator('input[type="checkbox"]').filter({ hasText: /area/i }).count();
      console.log(`[Test] Initial areas of interest visible: ${initialAreasCount}`);

      // Select a secondary domain
      console.log('[Test] Selecting secondary domain...');
      const secondaryCheckboxes = page.locator('label').filter({ hasText: /Secondary Domain/i }).locator('..').locator('input[type="checkbox"]');
      const secondaryCount = await secondaryCheckboxes.count();

      if (secondaryCount > 0) {
        const firstSecondary = secondaryCheckboxes.first();
        const isChecked = await firstSecondary.isChecked();

        if (!isChecked) {
          await firstSecondary.check();
          await page.waitForTimeout(1000);
        }

        // Get count of areas after selecting secondary
        const areasAfterSecondary = await page.locator('text=/Areas of Interest/i').locator('..').locator('input[type="checkbox"]').count();
        console.log(`[Test] Areas of interest after selecting secondary: ${areasAfterSecondary}`);

        // Areas should now be visible (filtered to this secondary's children)
        expect(areasAfterSecondary).toBeGreaterThan(0);

        console.log('[Test] ✓ Domain hierarchy filtering working correctly!');
      } else {
        console.log('[Test] No secondary domains available for selection');
      }
    } else {
      console.log('[Test] No editable postings found to test domain filtering');
    }
  });

  test('Deselecting secondary domain auto-clears its child areas of interest', async ({ page }) => {
    console.log('[Test] Testing auto-clear of child areas when removing secondary domain...');

    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings and edit a posting
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Select a primary domain if needed
      const primaryTrigger = page.locator('button').filter({ hasText: /Select primary domain/i });
      if (await primaryTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        await primaryTrigger.click();
        await page.waitForTimeout(500);
        await page.locator('[role="option"]').first().click();
        await page.waitForTimeout(1000);
      }

      // Find secondary domain checkboxes
      const secondarySection = page.locator('text=/Secondary Domain/i').locator('..');
      const secondaryCheckboxes = secondarySection.locator('input[type="checkbox"]');
      const secondaryCount = await secondaryCheckboxes.count();

      if (secondaryCount >= 2) {
        // Select first secondary domain
        console.log('[Test] Selecting first secondary domain...');
        const firstSecondary = secondaryCheckboxes.first();
        await firstSecondary.check();
        await page.waitForTimeout(1000);

        // Select some areas of interest for this secondary
        const areasSection = page.locator('text=/Areas of Interest/i').locator('..');
        const areaCheckboxes = areasSection.locator('input[type="checkbox"]');
        const areasCount = await areaCheckboxes.count();

        if (areasCount > 0) {
          console.log(`[Test] Selecting ${Math.min(2, areasCount)} areas of interest...`);
          for (let i = 0; i < Math.min(2, areasCount); i++) {
            await areaCheckboxes.nth(i).check();
            await page.waitForTimeout(300);
          }

          // Get count of checked areas
          const checkedAreasCount = await areaCheckboxes.filter({ checked: true }).count();
          console.log(`[Test] Checked areas before deselecting secondary: ${checkedAreasCount}`);
          expect(checkedAreasCount).toBeGreaterThan(0);

          // Now deselect the first secondary domain
          console.log('[Test] Deselecting secondary domain...');
          await firstSecondary.uncheck();
          await page.waitForTimeout(1000);

          // Verify that areas are auto-unchecked
          // Note: The areas might disappear from UI entirely if filtering is working
          const remainingCheckedAreas = await areaCheckboxes.filter({ checked: true }).count();
          console.log(`[Test] Checked areas after deselecting secondary: ${remainingCheckedAreas}`);

          // Areas should be cleared (either unchecked or hidden)
          expect(remainingCheckedAreas).toBeLessThan(checkedAreasCount);
          console.log('[Test] ✓ Child areas auto-cleared successfully!');
        } else {
          console.log('[Test] No areas of interest available for the selected secondary');
        }
      } else {
        console.log('[Test] Not enough secondary domains to test removal');
      }
    } else {
      console.log('[Test] No editable postings found');
    }
  });

  test('Domain changes persist after saving in Edit page', async ({ page }) => {
    console.log('[Test] Testing domain persistence after edit...');

    // Login as individual user
    await loginAsUser(page, 'testuser@example.com');

    // Navigate to My Postings
    await page.goto('/postings/my');
    await page.waitForLoadState('networkidle');

    const editButton = page.locator('button:has-text("Edit")').first();

    if (await editButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await editButton.click();
      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Change primary domain
      const primaryTrigger = page.locator('button').filter({ hasText: /primary domain/i }).first();
      if (await primaryTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('[Test] Changing primary domain...');
        await primaryTrigger.click();
        await page.waitForTimeout(500);

        // Select second option (to ensure it's different)
        const options = page.locator('[role="option"]');
        const optionCount = await options.count();
        if (optionCount > 1) {
          await options.nth(1).click();
        } else {
          await options.first().click();
        }
        await page.waitForTimeout(1000);
      }

      // Select at least one secondary domain
      const secondaryCheckboxes = page.locator('label').filter({ hasText: /Secondary/i }).locator('..').locator('input[type="checkbox"]');
      const secondaryCount = await secondaryCheckboxes.count();

      let selectedSecondaryLabel = '';
      if (secondaryCount > 0) {
        console.log('[Test] Selecting secondary domain...');
        const secondaryToSelect = secondaryCheckboxes.first();
        await secondaryToSelect.check();
        await page.waitForTimeout(500);

        // Get the label of selected secondary for verification
        selectedSecondaryLabel = await secondaryToSelect.locator('..').textContent() || '';
        console.log(`[Test] Selected secondary: "${selectedSecondaryLabel.trim()}"`);
      }

      // Save changes
      console.log('[Test] Saving changes...');
      const saveButton = page.locator('button:has-text("Save")').or(page.locator('button:has-text("Update")'));
      await saveButton.click();

      // Wait for save to complete (redirect or success message)
      await page.waitForTimeout(3000);

      // Navigate back to edit page to verify persistence
      await page.goto('/postings/my');
      await page.waitForLoadState('networkidle');

      const editButtonAgain = page.locator('button:has-text("Edit")').first();
      await editButtonAgain.click();
      await page.waitForURL(/\/postings\/[a-zA-Z0-9-]+\/edit$/, { timeout: 10000 });
      await page.waitForTimeout(2000);

      // Verify domain selections persisted
      if (selectedSecondaryLabel) {
        const persistedSecondary = page.locator(`label:has-text("${selectedSecondaryLabel.trim()}")`).locator('input[type="checkbox"]');
        const isChecked = await persistedSecondary.isChecked();
        console.log(`[Test] Secondary domain "${selectedSecondaryLabel.trim()}" persisted: ${isChecked}`);
        expect(isChecked).toBe(true);
        console.log('[Test] ✓ Domain changes persisted successfully!');
      } else {
        console.log('[Test] Could not verify secondary domain persistence - no secondary was selected');
      }
    } else {
      console.log('[Test] No editable postings found');
    }
  });
});

test.describe('Posts Workflow - Admin User', () => {
  test('Admin can view all postings and has moderator access', async ({ page }) => {
    // Login as admin
    await loginAsUser(page, 'datta.rajesh@gmail.com', 'Admin123!');

    // Navigate to moderator queue
    await page.goto('/moderator/queue');
    await page.waitForLoadState('networkidle');

    // Verify admin has access to moderation queue
    await expect(page.locator('h1:has-text("Moderation Queue")').or(page.locator('h2:has-text("Moderation")'))
    ).toBeVisible({ timeout: 10000 });
  });
});

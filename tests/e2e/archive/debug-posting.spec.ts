import { test, expect } from '@playwright/test';

test('Debug create posting form', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  const emailInput = page.locator('input[name="email"]');
  const passwordInput = page.locator('input[name="password"]');
  
  await emailInput.fill('testuser@example.com');
  await passwordInput.fill('TestUser123!');
  
  const signInButton = page.locator('button').filter({ hasText: /^Sign In$/ }).first();
  await signInButton.click();
  
  await page.waitForURL(/\/(dashboard|home)/, { timeout: 20000 });
  
  // Navigate to create posting
  await page.goto('/postings/new');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-create-posting-initial.png', fullPage: true });
  
  console.log('Page title:', await page.title());
  console.log('Page URL:', page.url());
  
  // Check for errors in console
  page.on('console', msg => console.log('Browser console:', msg.text()));
  page.on('pageerror', err => console.error('Page error:', err));
  
  // Try to find elements
  const offerSupportCard = page.locator('h3:has-text("Offer Support")');
  console.log('Offer Support card visible:', await offerSupportCard.isVisible());
  
  // Click it
  await offerSupportCard.click();
  await page.waitForTimeout(1000);
  
  await page.screenshot({ path: 'test-results/debug-create-posting-after-type-select.png', fullPage: true });
  
  // Try to find category selector
  const categoryTrigger = page.locator('button').filter({ hasText: /Select a category/i });
  console.log('Category trigger visible:', await categoryTrigger.isVisible());
  
  if (await categoryTrigger.isVisible()) {
    await categoryTrigger.click();
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/debug-create-posting-category-open.png', fullPage: true });
    
    // Try to find options
    const options = page.locator('[role="option"]');
    const count = await options.count();
    console.log('Number of category options:', count);
    
    if (count > 0) {
      await options.first().click();
      await page.waitForTimeout(500);
      
      await page.screenshot({ path: 'test-results/debug-create-posting-category-selected.png', fullPage: true });
    }
  }
  
  // Try to fill title
  const titleInput = page.locator('input[name="title"]');
  console.log('Title input visible:', await titleInput.isVisible());
  
  if (await titleInput.isVisible()) {
    await titleInput.fill('Test Posting Title');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test-results/debug-create-posting-title-filled.png', fullPage: true });
  }
  
  // Keep page open for a bit
  await page.waitForTimeout(2000);
});

import { test, expect } from '@playwright/test';
import { setupMockAPI } from '../setup/test-data';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await setupMockAPI(page);
    await page.goto('/');
  });

  test('should display login page by default', async ({ page }) => {
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1')).toContainText('Sign In');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
  });

  test('should show invitation-only message', async ({ page }) => {
    await expect(page.locator('text=New to SGSGita Alumni? Contact an administrator for an invitation.')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.click('button');
    
    // Check for validation messages
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button');
    
    await expect(page.locator('text=Please enter a valid email address')).toBeVisible();
  });

  test('should show validation error for short password', async ({ page }) => {
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', '123');
    await page.click('button');
    
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible();
  });

  test('should handle login with valid credentials', async ({ page }) => {
    // Mock successful login response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: '1', email: 'test@example.com', firstName: 'John' },
          token: 'mock-jwt-token'
        })
      });
    });

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button');
    
    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle login error', async ({ page }) => {
    // Mock login error response
    await page.route('**/api/auth/login', async route => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Invalid credentials'
        })
      });
    });

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button');
    
    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should show loading state during login', async ({ page }) => {
    // Mock delayed response
    await page.route('**/api/auth/login', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: '1', email: 'test@example.com', firstName: 'John' },
          token: 'mock-jwt-token'
        })
      });
    });

    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button');
    
    // Should show loading state
    await expect(page.locator('button:disabled')).toBeVisible();
  });
});

test.describe('Invitation-Based Onboarding Flow', () => {
  test('should display invitation acceptance page', async ({ page }) => {
    await page.goto('/invitation/valid-token');

    await expect(page.locator('h1')).toContainText('Complete Your Registration');
    await expect(page.locator('input[name="firstName"]')).toBeVisible();
    await expect(page.locator('input[name="lastName"]')).toBeVisible();
    await expect(page.locator('input[name="birthDate"]')).toBeVisible();
    await expect(page.locator('input[name="graduationYear"]')).toBeVisible();
  });

  test('should validate invitation form', async ({ page }) => {
    await page.goto('/invitation/valid-token');
    await page.click('button');

    // Check for validation messages - form should require fields
    await expect(page.locator('input[name="firstName"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="lastName"]:invalid')).toBeVisible();
  });

  test('should handle successful invitation acceptance', async ({ page }) => {
    // Mock successful invitation validation and acceptance
    await page.route('**/api/invitations/validate/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isValid: true,
          invitation: {
            id: '1',
            token: 'valid-token',
            email: 'john.doe@example.com',
            expiresAt: new Date(Date.now() + 86400000).toISOString()
          }
        })
      });
    });

    await page.route('**/api/invitations/*/accept', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: '1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        })
      });
    });

    await page.goto('/invitation/valid-token');

    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="birthDate"]', '2000-01-01');
    await page.fill('input[name="graduationYear"]', '2020');
    await page.fill('input[name="program"]', 'Computer Science');
    await page.click('button');

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });

  test('should handle invalid invitation token', async ({ page }) => {
    // Mock invalid invitation response
    await page.route('**/api/invitations/validate/*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          isValid: false,
          errors: ['Invalid or expired invitation token']
        })
      });
    });

    await page.goto('/invitation/invalid-token');

    // Should show error message
    await expect(page.locator('text=Invalid or expired invitation token')).toBeVisible();
  });
});

test.describe('OTP Verification Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/otp-verification?email=test@example.com&type=login');
  });

  test('should display OTP verification form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Verify OTP');
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('button')).toBeVisible();
  });

  test('should handle OTP input', async ({ page }) => {
    const otpInput = page.locator('input[type="text"]');
    await otpInput.fill('123456');
    await expect(otpInput).toHaveValue('123456');
  });

  test('should handle OTP validation', async ({ page }) => {
    // Mock OTP validation response
    await page.route('**/api/otp/validate', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          isValid: true,
          message: 'OTP verified successfully'
        })
      });
    });

    await page.fill('input[type="text"]', '123456');
    await page.click('button');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle invalid OTP', async ({ page }) => {
    // Mock invalid OTP response
    await page.route('**/api/otp/validate', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          isValid: false,
          error: 'Invalid OTP code'
        })
      });
    });

    await page.fill('input[type="text"]', '000000');
    await page.click('button');
    
    // Should show error message
    await expect(page.locator('text=Invalid OTP code')).toBeVisible();
  });
});

test.describe('Family Invitation Flow', () => {
  test('should display invitation acceptance page', async ({ page }) => {
    await page.goto('/invitation/accept/valid-token');
    
    await expect(page.locator('h1')).toContainText('Accept Invitation');
    await expect(page.locator('text=Family Member Selection')).toBeVisible();
  });

  test('should handle family member selection', async ({ page }) => {
    await page.goto('/invitation/accept/valid-token');
    
    // Mock family members data
    await page.route('**/api/invitations/family/validate/*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          valid: true,
          familyMembers: [
            { id: '1', name: 'John Doe', relationship: 'Father' },
            { id: '2', name: 'Jane Doe', relationship: 'Mother' }
          ]
        })
      });
    });

    await page.reload();
    
    // Should show family members
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=Jane Doe')).toBeVisible();
  });

  test('should handle invitation acceptance', async ({ page }) => {
    await page.goto('/invitation/accept/valid-token');
    
    // Mock successful acceptance
    await page.route('**/api/invitations/family/*/accept-profile', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Invitation accepted successfully'
        })
      });
    });

    await page.click('text=John Doe');
    await page.click('button:has-text("Accept Invitation")');
    
    // Should show success message
    await expect(page.locator('text=Invitation accepted successfully')).toBeVisible();
  });
});

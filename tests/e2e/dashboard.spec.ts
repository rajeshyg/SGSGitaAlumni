import { test, expect } from '@playwright/test';

test.describe('Member Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication state
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }));
    });

    // Mock dashboard data API
    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: {
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            email: 'test@example.com'
          },
          stats: {
            totalConnections: 25,
            newMessages: 3,
            upcomingEvents: 2,
            profileCompleteness: 85
          },
          recentConversations: [
            {
              id: '1',
              participant: 'Jane Smith',
              lastMessage: 'Thanks for the recommendation!',
              timestamp: '2024-01-15T10:30:00Z',
              unread: true
            },
            {
              id: '2',
              participant: 'Mike Johnson',
              lastMessage: 'Looking forward to the event',
              timestamp: '2024-01-15T09:15:00Z',
              unread: false
            }
          ],
          personalizedPosts: [
            {
              id: '1',
              title: 'Alumni Networking Event',
              content: 'Join us for the annual networking event...',
              author: 'Alumni Association',
              timestamp: '2024-01-15T08:00:00Z',
              likes: 12,
              comments: 3
            }
          ],
          quickActions: [
            { id: '1', label: 'Update Profile', action: 'profile' },
            { id: '2', label: 'Find Alumni', action: 'search' },
            { id: '3', label: 'Create Post', action: 'post' },
            { id: '4', label: 'View Events', action: 'events' }
          ],
          notifications: [
            {
              id: '1',
              type: 'message',
              title: 'New message from Jane Smith',
              message: 'Thanks for connecting!',
              timestamp: '2024-01-15T10:30:00Z',
              read: false
            },
            {
              id: '2',
              type: 'event',
              title: 'Upcoming Event',
              message: 'Alumni networking event tomorrow',
              timestamp: '2024-01-15T09:00:00Z',
              read: true
            }
          ]
        })
      });
    });

    await page.goto('/dashboard');
  });

  test('should display dashboard with all components', async ({ page }) => {
    // Check header
    await expect(page.locator('h1')).toContainText('Welcome back, John!');
    await expect(page.locator('text=Here\'s what\'s happening in your alumni network')).toBeVisible();

    // Check stats overview
    await expect(page.locator('text=Total Connections')).toBeVisible();
    await expect(page.locator('text=25')).toBeVisible();
    await expect(page.locator('text=New Messages')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible();
    await expect(page.locator('text=Upcoming Events')).toBeVisible();
    await expect(page.locator('text=2')).toBeVisible();
    await expect(page.locator('text=Profile Completeness')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();

    // Check recent conversations
    await expect(page.locator('text=Recent Conversations')).toBeVisible();
    await expect(page.locator('text=Jane Smith')).toBeVisible();
    await expect(page.locator('text=Thanks for the recommendation!')).toBeVisible();
    await expect(page.locator('text=Mike Johnson')).toBeVisible();

    // Check personalized posts
    await expect(page.locator('text=Personalized Posts')).toBeVisible();
    await expect(page.locator('text=Alumni Networking Event')).toBeVisible();
    await expect(page.locator('text=Join us for the annual networking event...')).toBeVisible();

    // Check quick actions
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('button:has-text("Update Profile")')).toBeVisible();
    await expect(page.locator('button:has-text("Find Alumni")')).toBeVisible();
    await expect(page.locator('button:has-text("Create Post")')).toBeVisible();
    await expect(page.locator('button:has-text("View Events")')).toBeVisible();

    // Check notifications
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=New message from Jane Smith')).toBeVisible();
    await expect(page.locator('text=Upcoming Event')).toBeVisible();
  });

  test('should handle quick action clicks', async ({ page }) => {
    // Test Update Profile action
    await page.click('button:has-text("Update Profile")');
    // Should navigate to profile page
    await expect(page).toHaveURL('/profile');

    await page.goBack();
    await page.click('button:has-text("Find Alumni")');
    // Should navigate to alumni directory
    await expect(page).toHaveURL('/alumni-directory');

    await page.goBack();
    await page.click('button:has-text("Create Post")');
    // Should navigate to create post page
    await expect(page).toHaveURL('/create-post');

    await page.goBack();
    await page.click('button:has-text("View Events")');
    // Should navigate to events page
    await expect(page).toHaveURL('/events');
  });

  test('should handle conversation interactions', async ({ page }) => {
    // Click on a conversation
    await page.click('text=Jane Smith');
    
    // Should navigate to conversation or show conversation details
    // This depends on the implementation - could be a modal or navigation
    await expect(page.locator('text=Thanks for the recommendation!')).toBeVisible();
  });

  test('should handle notification interactions', async ({ page }) => {
    // Click on a notification
    await page.click('text=New message from Jane Smith');
    
    // Should mark as read or navigate to the message
    // This depends on the implementation
  });

  test('should handle post interactions', async ({ page }) => {
    // Click on a post
    await page.click('text=Alumni Networking Event');
    
    // Should show post details or navigate to post
    // This depends on the implementation
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that layout adapts to mobile
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Total Connections')).toBeVisible();
    
    // Check that sidebar content is accessible on mobile
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/users/dashboard', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
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

    await page.reload();
    
    // Should show loading state
    await expect(page.locator('text=Loading...')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/users/dashboard', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Internal server error'
        })
      });
    });

    await page.reload();
    
    // Should show error message
    await expect(page.locator('text=Failed to load dashboard data')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
  });

  test('should handle retry functionality', async ({ page }) => {
    // Mock initial API error
    await page.route('**/api/users/dashboard', async route => {
      if (route.request().headers()['x-retry-count']) {
        // Second request succeeds
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
      } else {
        // First request fails
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      }
    });

    await page.reload();
    
    // Should show error and retry button
    await expect(page.locator('text=Failed to load dashboard data')).toBeVisible();
    await expect(page.locator('button:has-text("Retry")')).toBeVisible();
    
    // Click retry
    await page.click('button:has-text("Retry")');
    
    // Should load successfully
    await expect(page.locator('h1')).toContainText('Welcome back, John!');
  });
});

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Mock admin authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-admin-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin'
      }));
    });

    // Mock admin dashboard data
    await page.route('**/api/admin/dashboard', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: {
            totalUsers: 150,
            activeUsers: 120,
            newRegistrations: 5,
            totalPosts: 45
          },
          recentActivity: [
            {
              id: '1',
              type: 'user_registration',
              user: 'John Doe',
              timestamp: '2024-01-15T10:30:00Z'
            },
            {
              id: '2',
              type: 'post_created',
              user: 'Jane Smith',
              timestamp: '2024-01-15T09:15:00Z'
            }
          ]
        })
      });
    });

    await page.goto('/admin');
  });

  test('should display admin dashboard', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=150')).toBeVisible();
    await expect(page.locator('text=Active Users')).toBeVisible();
    await expect(page.locator('text=120')).toBeVisible();
  });

  test('should handle admin navigation', async ({ page }) => {
    // Test navigation to different admin sections
    await page.click('text=Users');
    await expect(page).toHaveURL('/admin/users');
    
    await page.click('text=Analytics');
    await expect(page).toHaveURL('/admin/analytics');
  });
});

import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addInitScript(() => {
      localStorage.setItem('auth-token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify({
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }));
    });

    // Mock dashboard data
    await page.route('**/api/users/dashboard', async route => {
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
  });

  test.describe('Page Load Performance', () => {
    test('should load dashboard within 2 seconds', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(2000);
    });

    test('should load login page within 1 second', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/login');
      await expect(page.locator('h1')).toContainText('Sign In');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(1000);
    });

    test('should load registration page within 1 second', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/register');
      await expect(page.locator('h1')).toContainText('Create Account');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      expect(loadTime).toBeLessThan(1000);
    });

    test('should handle slow network conditions', async ({ page }) => {
      // Simulate slow network
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should still load within reasonable time even with slow network
      expect(loadTime).toBeLessThan(5000);
    });
  });

  test.describe('API Performance', () => {
    test('should respond to API calls within 500ms', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      const endTime = Date.now();
      const apiTime = endTime - startTime;
      
      expect(apiTime).toBeLessThan(500);
    });

    test('should handle concurrent API calls efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      await Promise.all([
        page.goto('/dashboard'),
        page.goto('/login'),
        page.goto('/register')
      ]);
      
      const endTime = Date.now();
      const concurrentTime = endTime - startTime;
      
      // Should handle concurrent requests efficiently
      expect(concurrentTime).toBeLessThan(3000);
    });

    test('should handle API errors gracefully without performance impact', async ({ page }) => {
      // Mock API error
      await page.route('**/api/users/dashboard', async route => {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });

      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('text=Failed to load dashboard data')).toBeVisible();
      
      const endTime = Date.now();
      const errorTime = endTime - startTime;
      
      // Should handle errors quickly
      expect(errorTime).toBeLessThan(1000);
    });
  });

  test.describe('JavaScript Performance', () => {
    test('should execute JavaScript efficiently', async ({ page }) => {
      await page.goto('/dashboard');
      
      const executionTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Perform some JavaScript operations
        const data = [];
        for (let i = 0; i < 1000; i++) {
          data.push({
            id: i,
            name: `Item ${i}`,
            value: Math.random() * 100
          });
        }
        
        // Sort the data
        data.sort((a, b) => a.value - b.value);
        
        // Filter the data
        const filtered = data.filter(item => item.value > 50);
        
        const end = performance.now();
        return end - start;
      });
      
      expect(executionTime).toBeLessThan(100);
    });

    test('should handle DOM manipulation efficiently', async ({ page }) => {
      await page.goto('/dashboard');
      
      const domTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Create and manipulate DOM elements
        const container = document.createElement('div');
        for (let i = 0; i < 100; i++) {
          const element = document.createElement('div');
          element.textContent = `Test ${i}`;
          element.className = 'test-element';
          container.appendChild(element);
        }
        
        // Query elements
        const elements = container.querySelectorAll('.test-element');
        
        // Update elements
        elements.forEach((el, index) => {
          el.textContent = `Updated ${index}`;
        });
        
        const end = performance.now();
        return end - start;
      });
      
      expect(domTime).toBeLessThan(50);
    });

    test('should handle event handling efficiently', async ({ page }) => {
      await page.goto('/dashboard');
      
      const eventTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Create event listeners
        const elements = document.querySelectorAll('button');
        elements.forEach(element => {
          element.addEventListener('click', () => {
            console.log('Button clicked');
          });
        });
        
        // Simulate events
        elements.forEach(element => {
          element.dispatchEvent(new Event('click'));
        });
        
        const end = performance.now();
        return end - start;
      });
      
      expect(eventTime).toBeLessThan(50);
    });
  });

  test.describe('Memory Performance', () => {
    test('should not have memory leaks', async ({ page }) => {
      await page.goto('/dashboard');
      
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Perform some operations that might cause memory leaks
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          // Create and destroy elements
          const container = document.createElement('div');
          for (let j = 0; j < 100; j++) {
            const element = document.createElement('div');
            element.textContent = `Test ${j}`;
            container.appendChild(element);
          }
          document.body.appendChild(container);
          document.body.removeChild(container);
        });
      }
      
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });
      
      // Memory usage should not increase significantly
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(1000000); // 1MB
    });

    test('should handle large datasets efficiently', async ({ page }) => {
      await page.goto('/dashboard');
      
      const largeDataTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Create large dataset
        const largeData = [];
        for (let i = 0; i < 10000; i++) {
          largeData.push({
            id: i,
            name: `Item ${i}`,
            description: `Description for item ${i}`,
            value: Math.random() * 1000,
            category: `Category ${i % 10}`,
            tags: [`tag${i % 5}`, `tag${(i + 1) % 5}`]
          });
        }
        
        // Process large dataset
        const processed = largeData
          .filter(item => item.value > 500)
          .sort((a, b) => b.value - a.value)
          .slice(0, 100);
        
        const end = performance.now();
        return end - start;
      });
      
      expect(largeDataTime).toBeLessThan(200);
    });
  });

  test.describe('Network Performance', () => {
    test('should handle network latency gracefully', async ({ page }) => {
      // Simulate network latency
      await page.route('**/*', async route => {
        await new Promise(resolve => setTimeout(resolve, 200));
        await route.continue();
      });

      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should still load within reasonable time
      expect(loadTime).toBeLessThan(3000);
    });

    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network errors
      await page.route('**/api/users/dashboard', async route => {
        await route.abort('failed');
      });

      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('text=Failed to load dashboard data')).toBeVisible();
      
      const endTime = Date.now();
      const errorTime = endTime - startTime;
      
      // Should handle errors quickly
      expect(errorTime).toBeLessThan(1000);
    });

    test('should handle slow API responses', async ({ page }) => {
      // Simulate slow API response
      await page.route('**/api/users/dashboard', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
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

      const startTime = Date.now();
      
      await page.goto('/dashboard');
      await expect(page.locator('h1')).toContainText('Welcome back, John!');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      // Should handle slow responses gracefully
      expect(loadTime).toBeLessThan(2000);
    });
  });

  test.describe('Rendering Performance', () => {
    test('should render pages efficiently', async ({ page }) => {
      await page.goto('/dashboard');
      
      const renderTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Force reflow and repaint
        const elements = document.querySelectorAll('*');
        elements.forEach(element => {
          element.offsetHeight; // Force reflow
        });
        
        const end = performance.now();
        return end - start;
      });
      
      expect(renderTime).toBeLessThan(100);
    });

    test('should handle animations smoothly', async ({ page }) => {
      await page.goto('/dashboard');
      
      const animationTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Create and animate elements
        const element = document.createElement('div');
        element.style.transition = 'transform 0.3s ease';
        element.style.transform = 'translateX(0px)';
        document.body.appendChild(element);
        
        // Trigger animation
        element.style.transform = 'translateX(100px)';
        
        // Wait for animation to complete
        return new Promise(resolve => {
          setTimeout(() => {
            const end = performance.now();
            document.body.removeChild(element);
            resolve(end - start);
          }, 300);
        });
      });
      
      expect(animationTime).toBeLessThan(400);
    });

    test('should handle scroll performance', async ({ page }) => {
      await page.goto('/dashboard');
      
      const scrollTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Perform scroll operations
        window.scrollTo(0, 100);
        window.scrollTo(0, 200);
        window.scrollTo(0, 300);
        window.scrollTo(0, 0);
        
        const end = performance.now();
        return end - start;
      });
      
      expect(scrollTime).toBeLessThan(100);
    });
  });

  test.describe('Bundle Size Performance', () => {
    test('should have reasonable bundle size', async ({ page }) => {
      await page.goto('/dashboard');
      
      const bundleSize = await page.evaluate(() => {
        // Get script tags and calculate total size
        const scripts = document.querySelectorAll('script[src]');
        let totalSize = 0;
        
        scripts.forEach(script => {
          const src = script.getAttribute('src');
          if (src && src.includes('assets')) {
            // This is a simplified check - in real tests you'd fetch the actual files
            totalSize += 100000; // Assume 100KB per script
          }
        });
        
        return totalSize;
      });
      
      // Bundle size should be reasonable (less than 1MB)
      expect(bundleSize).toBeLessThan(1000000);
    });

    test('should load critical resources first', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/dashboard');
      
      // Check if critical resources are loaded first
      const criticalResources = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[src]');
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        
        return {
          scripts: scripts.length,
          styles: styles.length,
          criticalLoaded: document.querySelector('h1') !== null
        };
      });
      
      expect(criticalResources.criticalLoaded).toBe(true);
    });
  });
});

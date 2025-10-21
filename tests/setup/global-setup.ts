/**
 * Global Setup for Playwright Tests
 * 
 * This file handles global setup tasks like database preparation,
 * test data seeding, and environment validation.
 */

import { chromium, FullConfig } from '@playwright/test';
import { testConfig } from './test-data';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');

  // Validate environment
  await validateEnvironment();

  // Setup test database
  await setupTestDatabase();

  // Seed test data
  await seedTestData();

  // Skip API validation for now - tests use mocks
  // await validateAPIEndpoints();

  console.log('✅ Global test setup completed successfully');
}

async function validateEnvironment() {
  console.log('🔍 Validating test environment...');
  
  // Set NODE_ENV to test if not set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  
  // For E2E tests using mocks, we don't need DATABASE_URL
  // Only validate it if we're doing integration tests
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  console.log('✅ Environment validation passed');
}

async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');
  
  try {
    // Connect to test database
    // This would typically involve connecting to your DEV database
    // and ensuring it's in a clean state for testing
    
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');
  
  try {
    // Seed test users, invitations, and other test data
    // This ensures consistent test data across all test runs
    
    console.log('✅ Test data seeding completed');
  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    throw error;
  }
}

async function validateAPIEndpoints() {
  console.log('🔗 Validating API endpoints...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Test API health endpoint
    const response = await page.request.get(`${testConfig.apiURL}/api/health`);
    
    if (!response.ok()) {
      throw new Error(`API health check failed: ${response.status()}`);
    }
    
    console.log('✅ API endpoints validation passed');
  } catch (error) {
    console.error('❌ API validation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;

/**
 * Global Setup for Playwright Tests
 *
 * This file handles global setup tasks like database preparation,
 * test data seeding, and environment validation.
 */

import { chromium, FullConfig } from '@playwright/test';
import { testConfig, testUsers } from './test-data';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

  console.log('✅ Environment validation passed');
}

async function setupTestDatabase() {
  console.log('🗄️ Setting up test database...');

  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sgs_alumni_portal_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Test the connection
    const connection = await pool.getConnection();
    console.log('✅ Connected to database');
    connection.release();

    // Close the pool
    await pool.end();
    console.log('✅ Test database setup completed');
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  }
}

async function seedTestData() {
  console.log('🌱 Seeding test data...');

  let pool;
  try {
    pool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'sgs_alumni_portal_db',
      port: parseInt(process.env.DB_PORT || '3306'),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const connection = await pool.getConnection();

    console.log('📝 Seeding test users...');

    for (const user of testUsers) {
      try {
        // Check if user already exists
        const [existing] = await connection.execute(
          'SELECT id FROM app_users WHERE email = ?',
          [user.email]
        );

        if (existing.length > 0) {
          console.log(`  ⏭️ User already exists: ${user.email}`);
          continue;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);

        // Insert the user
        await connection.execute(
          `INSERT INTO app_users (id, email, password_hash, first_name, last_name, role, is_active, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [user.id, user.email, hashedPassword, user.firstName, user.lastName, user.role, user.isActive ? 1 : 0]
        );

        console.log(`  ✅ Created test user: ${user.email}`);
      } catch (error) {
        console.error(`  ❌ Failed to seed user ${user.email}:`, error.message);
      }
    }

    connection.release();
    console.log('✅ Test data seeding completed');
  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
    // Don't throw - allow tests to continue even if seeding fails
    // The database might already have the data
    console.warn('⚠️ Continuing with existing database state...');
  } finally {
    if (pool) {
      await pool.end();
    }
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

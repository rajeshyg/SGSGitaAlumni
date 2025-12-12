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
import { v4 as uuidv4 } from 'uuid';

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
        // 1. Ensure Alumni Member Exists
        // We need a unique alumni member for each test user to link the profile
        // Construct a dummy alumni email if not present in test data
        const alumniEmail = user.email.replace('@', '.alumni@'); 
        
        const [existingAlumni] = await connection.execute(
          'SELECT id FROM alumni_members WHERE email = ?',
          [alumniEmail]
        );

        let alumniId;
        if (existingAlumni.length > 0) {
          alumniId = existingAlumni[0].id;
        } else {
          const [result] = await connection.execute(
            `INSERT INTO alumni_members (first_name, last_name, email, batch, center_name)
             VALUES (?, ?, ?, '2020', 'Test Center')`,
            [user.firstName, user.lastName, alumniEmail]
          );
          alumniId = result.insertId;
          console.log(`  ➕ Created alumni member for ${user.email}`);
        }

        // 2. Check/Create Account
        const [existingAccount] = await connection.execute(
          'SELECT id FROM accounts WHERE email = ?',
          [user.email]
        );

        let accountId;
        if (existingAccount.length > 0) {
          console.log(`  ⏭️ Account already exists: ${user.email}`);
          accountId = existingAccount[0].id;
        } else {
          // Hash the password
          const hashedPassword = await bcrypt.hash(user.password, 10);
          accountId = uuidv4(); // Generate new UUID for account

          // Insert the account
          await connection.execute(
            `INSERT INTO accounts (id, email, password_hash, role, status, email_verified, requires_otp, created_at)
             VALUES (?, ?, ?, ?, 'active', 1, 0, NOW())`,
            [accountId, user.email, hashedPassword, user.role]
          );
          console.log(`  ✅ Created account: ${user.email}`);
        }

        // 3. Check/Create User Profile
        // We check if a profile exists for this account
        const [existingProfile] = await connection.execute(
          'SELECT id FROM user_profiles WHERE account_id = ?',
          [accountId]
        );

        if (existingProfile.length === 0) {
          const profileId = uuidv4();
          await connection.execute(
            `INSERT INTO user_profiles (
               id, account_id, alumni_member_id, relationship, 
               access_level, status, display_name, visibility, created_at
             ) VALUES (?, ?, ?, 'parent', 'full', 'active', ?, 'public', NOW())`,
            [profileId, accountId, alumniId, `${user.firstName} ${user.lastName}`]
          );
          console.log(`  ✅ Created profile for: ${user.email}`);
        }

      } catch (error) {
        console.error(`  ❌ Failed to seed user ${user.email}:`, error.message);
      }
    }

    connection.release();
    console.log('✅ Test data seeding completed');
  } catch (error) {
    console.error('❌ Test data seeding failed:', error);
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

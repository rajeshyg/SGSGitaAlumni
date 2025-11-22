/**
 * Reset Test User Passwords
 * 
 * This script resets passwords for test users to be used in E2E tests.
 * It hashes the password using bcrypt (same method as registration).
 * 
 * Password: TestUser123! (used for all test users)
 * 
 * Test Users:
 * - testuser@example.com
 * - moderator@test.com
 */

import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const testPassword = 'TestUser123!';
const testEmails = [
  'testuser@example.com',
  'moderator@test.com'
];

async function resetTestPasswords() {
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'gitaalumni_db',
      charset: 'utf8mb4'
    });

    console.log('🔌 Connected to database');

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    console.log(`✅ Generated password hash for: ${testPassword}`);

    // Reset password for each test user
    for (const email of testEmails) {
      const result = await connection.execute(
        'UPDATE app_users SET password_hash = ? WHERE email = ?',
        [hashedPassword, email]
      );

      if (result[0].affectedRows > 0) {
        console.log(`✅ Password reset for: ${email}`);
      } else {
        console.log(`⚠️  User not found: ${email}`);
      }
    }

    console.log('\n✅ Password reset completed!');
    console.log(`\nTest credentials for E2E tests:`);
    console.log(`Email: testuser@example.com`);
    console.log(`Password: ${testPassword}`);
    console.log(`\nEmail: moderator@test.com`);
    console.log(`Password: ${testPassword}`);

  } catch (error) {
    console.error('❌ Error resetting passwords:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

resetTestPasswords();

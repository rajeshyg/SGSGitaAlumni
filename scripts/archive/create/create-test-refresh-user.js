import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function createTestUser() {
  const testEmail = 'test.refresh@sgsgitaalumni.org';
  const testPassword = 'TestPassword123!';
  
  try {
    // Check if user exists
    const [existing] = await pool.execute(
      'SELECT id, email FROM app_users WHERE email = ?',
      [testEmail]
    );
    
    if (existing.length > 0) {
      console.log('✅ Test user already exists:', testEmail);
      console.log('Password:', testPassword);
      await pool.end();
      return;
    }
    
    // Create new test user
    const passwordHash = await bcrypt.hash(testPassword, 10);
    
    await pool.execute(
      `INSERT INTO app_users (
        email, password_hash, role, is_active, 
        first_name, last_name, created_at, updated_at
      ) VALUES (?, ?, 'member', TRUE, 'Test', 'Refresh', NOW(), NOW())`,
      [testEmail, passwordHash]
    );
    
    console.log('✅ Test user created successfully!');
    console.log('Email:', testEmail);
    console.log('Password:', testPassword);
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createTestUser();

// Test login with the real user credentials
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
};

console.log('Testing login with real user credentials...');

async function testRealUserLogin() {
  try {
    console.log('1. Creating connection pool...');
    const pool = mysql.createPool(DB_CONFIG);

    console.log('2. Testing with real credentials: datta.rajesh@gmail.com / Admin123!');
    const email = 'datta.rajesh@gmail.com';
    const password = 'Admin123!';

    console.log('3. Getting database connection...');
    const connection = await pool.getConnection();

    console.log('4. Finding user by email...');
    const [rows] = await connection.execute(
      'SELECT id, email, password_hash, role, is_active, created_at FROM app_users WHERE email = ?',
      [email]
    );

    console.log(`Found ${rows.length} users with email: ${email}`);

    if (rows.length === 0) {
      console.log('❌ User not found in database');
      connection.release();
      await pool.end();
      return;
    }

    const user = rows[0];
    console.log('5. User found:', {
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.is_active
    });

    if (!user.is_active) {
      console.log('❌ User account is disabled');
      connection.release();
      await pool.end();
      return;
    }

    console.log('6. Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Password verification result: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('❌ Invalid password');
      connection.release();
      await pool.end();
      return;
    }

    console.log('✅ Login would be successful!');
    console.log('User details:', {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    });

    connection.release();
    await pool.end();

  } catch (error) {
    console.error('❌ Error testing real user login:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
  }
}

testRealUserLogin();
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
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

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

console.log('Testing EXACT login endpoint flow...');

async function testExactLoginFlow() {
  try {
    console.log('Step 1: Creating connection pool...');
    const pool = mysql.createPool(DB_CONFIG);

    console.log('Step 2: Simulating login request with test@example.com / test123...');
    const email = 'test@example.com';
    const password = 'test123';

    if (!email || !password) {
      console.log('❌ Email and password are required');
      await pool.end();
      return;
    }

    console.log('Step 3: Getting database connection from pool...');
    const connection = await pool.getConnection();

    console.log('Step 4: Finding user by email...');
    const [rows] = await connection.execute(
      'SELECT id, email, password_hash, role, is_active, created_at FROM app_users WHERE email = ?',
      [email]
    );

    console.log(`Found ${rows.length} users with email: ${email}`);

    if (rows.length === 0) {
      console.log('Step 5: User not found - should return 401 Invalid credentials');
      connection.release();
      await pool.end();
      console.log('✅ Login flow completed successfully (user not found is expected)');
      return;
    }

    const user = rows[0];
    console.log('Step 5: User found, checking if active...');

    if (!user.is_active) {
      console.log('❌ Account is disabled');
      connection.release();
      await pool.end();
      return;
    }

    console.log('Step 6: Verifying password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log(`Password valid: ${isValidPassword}`);

    if (!isValidPassword) {
      console.log('❌ Invalid credentials');
      connection.release();
      await pool.end();
      return;
    }

    console.log('Step 7: Generating JWT tokens...');
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    console.log('✅ JWT tokens generated successfully');
    console.log('Token length:', token.length);
    console.log('Refresh token length:', refreshToken.length);

    console.log('Step 8: Preparing user response...');
    const userResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.is_active,
      createdAt: user.created_at
    };

    console.log('Step 9: Cleaning up connections...');
    connection.release();
    await pool.end();

    console.log('✅ Complete login flow executed successfully!');
    console.log('Response would be:', {
      success: true,
      token: token.substring(0, 50) + '...',
      refreshToken: refreshToken.substring(0, 50) + '...',
      user: userResponse,
      expiresIn: 3600
    });

  } catch (error) {
    console.error('❌ Error in login flow:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
  }
}

testExactLoginFlow();
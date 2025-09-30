import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || '3306'),
  connectTimeout: 10000,
  acquireTimeout: 10000,
  timeout: 10000,
};

console.log('Testing login endpoint logic...');

async function testLoginLogic() {
  try {
    console.log('1. Testing database connection...');
    const connection = await mysql.createConnection(DB_CONFIG);

    console.log('2. Testing if app_users table exists...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'app_users'
    `, [DB_CONFIG.database]);

    if (tables.length === 0) {
      console.error('❌ app_users table does not exist!');
      await connection.end();
      return;
    }
    console.log('✅ app_users table exists');

    console.log('3. Testing user lookup query...');
    const testEmail = 'test@example.com';
    const [users] = await connection.execute(
      'SELECT id, email, password_hash, role, is_active, created_at FROM app_users WHERE email = ?',
      [testEmail]
    );

    console.log(`✅ User lookup query successful. Found ${users.length} users with email: ${testEmail}`);

    if (users.length > 0) {
      const user = users[0];
      console.log('4. Testing bcrypt password verification...');
      const testPassword = 'test123';
      const isValidPassword = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`✅ Password verification completed. Valid: ${isValidPassword}`);
    } else {
      console.log('ℹ️ No test user found - this is expected if no users exist yet');
    }

    await connection.end();
    console.log('✅ All login logic tests passed!');

  } catch (error) {
    console.error('❌ Error testing login logic:', error.message);
    console.error('Error code:', error.code);
    console.error('Error errno:', error.errno);
  }
}

testLoginLogic();
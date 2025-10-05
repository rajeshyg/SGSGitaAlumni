import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';

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

async function testAdmin() {
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('Connected to database');

    // Check if admin user exists
    const [rows] = await connection.execute(
      'SELECT id, email, role, password_hash, is_active FROM app_users WHERE email = ?',
      ['datta.rajesh@gmail.com']
    );

    if (rows.length > 0) {
      console.log('Admin user exists:', rows[0]);
    } else {
      console.log('Admin user does not exist, creating...');

      const userId = 'admin-' + Date.now();
      const hashedPassword = await bcrypt.hash('Admin123!', 12);

      await connection.execute(`
        INSERT INTO app_users (
          id, email, password_hash, role, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, 'admin', 1, NOW(), NOW())
      `, [
        userId, 'datta.rajesh@gmail.com', hashedPassword
      ]);

      console.log('Admin user created successfully');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testAdmin();
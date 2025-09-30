// Test the exact HTTP login endpoint behavior
import express from 'express';
import cors from 'cors';
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

console.log('Testing exact HTTP login endpoint...');

async function testExactHttpLogin() {
  try {
    console.log('1. Creating Express app...');
    const app = express();

    console.log('2. Setting up middleware...');
    app.use(cors());
    app.use(express.json());

    console.log('3. Creating connection pool...');
    const pool = mysql.createPool(DB_CONFIG);

    console.log('4. Setting up login endpoint...');
    app.post('/api/auth/login', async (req, res) => {
      try {
        console.log('Login endpoint called');
        const { email, password } = req.body;

        console.log('Request body:', { email, password: password ? '[HIDDEN]' : 'undefined' });

        if (!email || !password) {
          console.log('Missing email or password');
          return res.status(400).json({ error: 'Email and password are required' });
        }

        console.log('Getting database connection...');
        const connection = await pool.getConnection();

        console.log('Executing user lookup query...');
        const [rows] = await connection.execute(
          'SELECT id, email, password_hash, role, is_active, created_at FROM app_users WHERE email = ?',
          [email]
        );

        console.log(`Found ${rows.length} users`);

        if (rows.length === 0) {
          console.log('User not found, returning 401');
          connection.release();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];
        console.log('User found, checking if active...');

        if (!user.is_active) {
          console.log('User not active, returning 401');
          connection.release();
          return res.status(401).json({ error: 'Account is disabled' });
        }

        console.log('Verifying password...');
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        console.log(`Password valid: ${isValidPassword}`);

        if (!isValidPassword) {
          console.log('Invalid password, returning 401');
          connection.release();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        console.log('Generating tokens...');
        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        console.log('Cleaning up connection...');
        connection.release();

        console.log('Sending success response...');
        const userResponse = {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.is_active,
          createdAt: user.created_at
        };

        res.json({
          success: true,
          token,
          refreshToken,
          user: userResponse,
          expiresIn: 3600
        });

      } catch (error) {
        console.error('Login endpoint error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    console.log('5. Starting test server...');
    const server = app.listen(3003, () => {
      console.log('Test server running on http://localhost:3003');
    });

    console.log('6. Testing the login endpoint...');
    setTimeout(async () => {
      try {
        console.log('Making HTTP request to login endpoint...');
        const response = await fetch('http://localhost:3003/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'test123'
          })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data:', data);

        server.close();
        await pool.end();
        console.log('✅ HTTP login test completed successfully!');

      } catch (error) {
        console.error('❌ HTTP request failed:', error.message);
        server.close();
        await pool.end();
      }
    }, 1000);

  } catch (error) {
    console.error('❌ Error in HTTP login test:', error.message);
  }
}

testExactHttpLogin();
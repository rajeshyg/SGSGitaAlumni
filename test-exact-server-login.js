// Test the exact server.js login endpoint
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

console.log('Testing exact server.js login endpoint...');

// This is the EXACT pattern from server.js
let pool = null;

const getPool = () => {
  if (!pool) {
    pool = mysql.createPool(DB_CONFIG);
    console.log('MySQL: Connection pool created');
  }
  return pool;
};

async function testExactServerLogin() {
  try {
    console.log('1. Creating Express app...');
    const app = express();

    console.log('2. Setting up middleware...');
    app.use(cors());
    app.use(express.json());

    console.log('3. Setting up login endpoint (exact copy from server.js)...');
    app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        const connection = await getPool().getConnection();

        // Find user by email
        const [rows] = await connection.execute(
          'SELECT id, email, password_hash, role, is_active, created_at FROM app_users WHERE email = ?',
          [email]
        );

        if (rows.length === 0) {
          connection.release();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = rows[0];

        // Check if user is active
        if (!user.is_active) {
          connection.release();
          return res.status(401).json({ error: 'Account is disabled' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
          connection.release();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        connection.release();

        // Generate tokens
        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

        // Return user data (without password hash)
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
          expiresIn: 3600 // 1 hour in seconds
        });

      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
      }
    });

    console.log('4. Starting test server...');
    const server = app.listen(3005, () => {
      console.log('Test server running on http://localhost:3005');
    });

    console.log('5. Testing the login endpoint...');
    setTimeout(async () => {
      try {
        console.log('Making HTTP request to login endpoint...');
        const response = await fetch('http://localhost:3005/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'datta.rajesh@gmail.com',
            password: 'Admin123!'
          })
        });

        console.log('Response status:', response.status);
        const data = await response.json();
        console.log('Response data keys:', Object.keys(data));
        if (data.token) {
          console.log('Token length:', data.token.length);
        }

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
    console.error('❌ Error in server login test:', error.message);
  }
}

testExactServerLogin();
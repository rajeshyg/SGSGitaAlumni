import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Get database pool - will be passed from main server
let pool = null;

export function setAuthMiddlewarePool(dbPool) {
  pool = dbPool;
}

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('[AUTH_MIDDLEWARE] Received request to:', req.path);
    console.log('[AUTH_MIDDLEWARE] Auth header present:', !!authHeader);
    console.log('[AUTH_MIDDLEWARE] Token present:', !!token);

    if (!token) {
      console.log('[AUTH_MIDDLEWARE] No token provided');
      return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) {
        console.log('[AUTH_MIDDLEWARE] JWT verification failed:', err.message);
        return res.status(403).json({ error: 'Invalid or expired token' });
      }

      console.log('[AUTH_MIDDLEWARE] JWT decoded successfully:', { userId: decoded.userId, email: decoded.email, role: decoded.role });

      try {
        // Verify user still exists and is active
        const connection = await pool.getConnection();
        const [rows] = await connection.execute(
          'SELECT id, email, role, is_active FROM app_users WHERE id = ? AND is_active = true',
          [decoded.userId]
        );
        connection.release();

        console.log('[AUTH_MIDDLEWARE] Database query result:', { found: rows.length > 0, user: rows.length > 0 ? { id: rows[0].id, email: rows[0].email, role: rows[0].role, is_active: rows[0].is_active } : null });

        if (rows.length === 0) {
          console.log('[AUTH_MIDDLEWARE] User not found or inactive');
          return res.status(401).json({ error: 'User not found or inactive' });
        }

        req.user = rows[0];
        console.log('[AUTH_MIDDLEWARE] Authentication successful, proceeding to route');
        next();
      } catch (dbError) {
        console.error('[AUTH_MIDDLEWARE] Database error:', dbError);
        return res.status(500).json({ error: 'Authentication database error' });
      }
    });
  } catch (error) {
    console.error('[AUTH_MIDDLEWARE] Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};
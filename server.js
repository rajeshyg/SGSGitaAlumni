import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// ============================================================================
// CRITICAL: Add process-level error handlers to prevent silent crashes
// ============================================================================
process.on('uncaughtException', (error) => {
  console.error('🚨 UNCAUGHT EXCEPTION:', error);
  console.error('Stack:', error.stack);
  // Don't exit - let the error be handled
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 UNHANDLED REJECTION at:', promise);
  console.error('Reason:', reason);
  // Don't exit - log and continue
});

import express from 'express';
import cors from 'cors';

// Import database utilities (AFTER dotenv is loaded)
import { getPool, testDatabaseConnection } from './utils/database.js';

// Import middleware
import { authenticateToken, setAuthMiddlewarePool } from './middleware/auth.js';
import { loginRateLimit, invitationRateLimit, apiRateLimit, rateLimitStatus, clearRateLimit } from './middleware/rateLimit.js';
import { monitoringMiddleware } from './middleware/monitoring.js';

// Import route modules
import {
  login,
  logout,
  refresh,
  registerFromInvitation,
  registerFromFamilyInvitation,
  setAuthPool
} from './routes/auth.js';

import {
  getAllInvitations,
  getFamilyInvitations,
  createFamilyInvitation,
  validateFamilyInvitation,
  acceptFamilyInvitationProfile,
  createInvitation,
  createBulkInvitations,
  validateInvitation,
  updateInvitation,
  setInvitationsPool
} from './routes/invitations.js';

import {
  searchAlumniMembers,
  getAlumniDirectory,
  getAlumniMember,
  updateAlumniMember,
  sendInvitationToAlumni,
  setAlumniPool
} from './routes/alumni.js';

import {
  updateUser,
  sendInvitationToUser,
  searchUsers,
  getUserProfile,
  getCurrentUserProfile,
  setUsersPool
} from './routes/users.js';

import {
  getUserInvitationHistory,
  getInvitationAnalyticsSummary,
  getInvitationConversionTrends,
  setAnalyticsPool
} from './routes/analytics.js';

import {
  getCodeMetrics,
  getTestingMetrics,
  setQualityPool
} from './routes/quality.js';

import {
  healthCheck,
  testConnection,
  setHealthPool
} from './routes/health.js';

import {
  generateOTP,
  generateAndSendOTP,
  validateOTP,
  sendOTP,
  getRemainingAttempts,
  getDailyCount,
  checkRateLimit,
  resetDailyLimit,
  incrementDailyCount,
  cleanupExpired,
  setupTOTP,
  getTOTPStatus,
  getOTPUserProfile,
  getActiveOTP,
  generateTestOTP,
  setOTPPool
} from './routes/otp.js';

import {
  getMonitoringMetrics,
  getSecurityEvents,
  getSystemHealth,
  getAlertStatus,
  getDatabaseStatus,
  getPerformanceMetrics,
  getRateLimitStatus,
  clearMonitoringData,
  setMonitoringPool
} from './routes/monitoring.js';

import {
  sendEmail,
  getEmailDeliveryStatus,
  getEmailTemplate,
  setEmailPool
} from './routes/email.js';

// Environment variables already loaded at top of file
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database pool
const pool = getPool();

// Set up database pools for all modules
setAuthPool(pool);
setAuthMiddlewarePool(pool);
setInvitationsPool(pool);
setAlumniPool(pool);
setUsersPool(pool);
setAnalyticsPool(pool);
setQualityPool(pool);
setHealthPool(pool);
setOTPPool(pool);
setMonitoringPool(pool);
setEmailPool(pool);

// Middleware
app.use(cors());
app.use(express.json());

// Monitoring middleware (must be early in the stack)
app.use(monitoringMiddleware);

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/auth/login', loginRateLimit, login);
app.post('/api/auth/logout', authenticateToken, logout);
app.post('/api/auth/refresh', refresh);
app.post('/api/auth/register-from-invitation', (req, res, next) => {
  console.log('🔵 ROUTE MATCHED: /api/auth/register-from-invitation');
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
}, registerFromInvitation);
app.post('/api/auth/register-from-family-invitation', registerFromFamilyInvitation);

// ============================================================================
// INVITATION SYSTEM ROUTES
// ============================================================================

app.get('/api/invitations', getAllInvitations);
app.get('/api/invitations/family', getFamilyInvitations);
app.post('/api/invitations/family', invitationRateLimit, createFamilyInvitation);
app.get('/api/invitations/family/validate/:token', validateFamilyInvitation);
app.patch('/api/invitations/family/:id/accept-profile', acceptFamilyInvitationProfile);
app.post('/api/invitations', invitationRateLimit, createInvitation);
app.post('/api/invitations/bulk', invitationRateLimit, createBulkInvitations);
app.get('/api/invitations/validate/:token', (req, res, next) => {
  console.log('ROUTE_MATCH: Invitation validation route matched for token:', req.params.token);
  next();
}, validateInvitation);
app.patch('/api/invitations/:id', updateInvitation);

// ============================================================================
// ALUMNI MEMBERS ROUTES
// ============================================================================

app.get('/api/alumni-members/search', searchAlumniMembers);
app.get('/api/alumni/directory', getAlumniDirectory);  // New directory endpoint
app.get('/api/alumni-members/:id', getAlumniMember);
app.put('/api/alumni-members/:id', updateAlumniMember);
app.post('/api/alumni-members/:id/send-invitation', authenticateToken, sendInvitationToAlumni);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

app.put('/api/users/:id', authenticateToken, updateUser);
app.post('/api/users/:id/send-invitation', authenticateToken, sendInvitationToUser);

// ============================================================================
// USER SEARCH & PROFILE ROUTES
// ============================================================================

app.get('/api/users/search', searchUsers);
app.get('/api/users/:id/profile', getUserProfile);
app.get('/api/users/profile', authenticateToken, getCurrentUserProfile);

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

app.get('/api/analytics/user-invitations/:userId', getUserInvitationHistory);
app.get('/api/analytics/invitations/summary', getInvitationAnalyticsSummary);
app.get('/api/analytics/invitations/conversion-trends', getInvitationConversionTrends);

// ============================================================================
// HEALTH & QUALITY ROUTES
// ============================================================================

app.get('/api/health', healthCheck);
app.get('/api/test-connection', testConnection);
app.get('/api/quality/code-metrics', getCodeMetrics);
app.get('/api/quality/testing-metrics', getTestingMetrics);

// ============================================================================
// RATE LIMITING MONITORING ROUTES (ADMIN)
// ============================================================================

app.get('/api/admin/rate-limits/status', authenticateToken, rateLimitStatus);
app.delete('/api/admin/rate-limits', authenticateToken, clearRateLimit);

// ============================================================================
// MONITORING ROUTES (ADMIN)
// ============================================================================

app.get('/api/monitoring/metrics', authenticateToken, getMonitoringMetrics);
app.get('/api/monitoring/security-events', authenticateToken, getSecurityEvents);
app.get('/api/monitoring/system-health', authenticateToken, getSystemHealth);
app.get('/api/monitoring/alerts', authenticateToken, getAlertStatus);
app.get('/api/monitoring/database', authenticateToken, getDatabaseStatus);
app.get('/api/monitoring/performance', authenticateToken, getPerformanceMetrics);
app.get('/api/monitoring/rate-limits', authenticateToken, getRateLimitStatus);
app.delete('/api/monitoring/data', authenticateToken, clearMonitoringData);

// ============================================================================
// DASHBOARD ROUTES (NOT IMPLEMENTED)
// ============================================================================

app.get('/api/users/current', (req, res) => {
  res.status(501).json({
    error: 'Current user endpoint not implemented',
    message: 'This endpoint requires authentication and database implementation'
  });
});

app.get('/api/users/:userId/stats', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = getPool();

    // Verify user has access to this data (users can only see their own stats unless admin)
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    // Return default stats for now
    // TODO: Implement actual queries when database tables are created
    const stats = {
      totalConnections: 0,
      activePostings: 0,
      unreadMessages: 0,
      profileViews: 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch user statistics' 
    });
  }
});

app.get('/api/conversations/recent', authenticateToken, async (req, res) => {
  try {
    const { userId, limit = 5 } = req.query;
    const pool = getPool();

    // Verify user has access to this data
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    // Return empty array for now
    // TODO: Implement actual queries when messaging/conversations tables are created
    const conversations = [];

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching recent conversations:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch recent conversations' 
    });
  }
});

app.get('/api/posts/personalized', authenticateToken, async (req, res) => {
  try {
    const { userId, limit = 10 } = req.query;
    const pool = getPool();

    // Verify user has access to this data
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    // Return empty array for now
    // TODO: Implement actual queries when posts/content tables are created
    const posts = [];

    res.json(posts);
  } catch (error) {
    console.error('Error fetching personalized posts:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch personalized posts' 
    });
  }
});

app.get('/api/notifications', authenticateToken, async (req, res) => {
  try {
    const { userId, limit = 5 } = req.query;
    const pool = getPool();

    // Verify user has access to this data
    if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden', message: 'Access denied' });
    }

    // Return empty array for now
    // TODO: Implement actual queries when notifications table is created
    const notifications = [];

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: 'Failed to fetch notifications' 
    });
  }
});

// ============================================================================
// FILE IMPORT ROUTES (LEGACY - DISABLED)
// ============================================================================

app.get('/api/file-imports', (req, res) => {
  res.status(410).json({
    error: 'File imports endpoint deprecated',
    message: 'This endpoint has been moved to modular structure. Use alumni-members endpoints instead.'
  });
});

app.get('/api/file-imports/:id', (req, res) => {
  res.status(410).json({
    error: 'File imports endpoint deprecated',
    message: 'This endpoint has been moved to modular structure. Use alumni-members endpoints instead.'
  });
});

app.post('/api/file-imports', (req, res) => {
  res.status(403).json({
    error: 'Creating new file imports is disabled. This endpoint works with existing raw_csv_uploads data only.'
  });
});

app.put('/api/file-imports/:id', (req, res) => {
  res.status(403).json({
    error: 'Updating file imports is disabled. This endpoint works with existing raw_csv_uploads data only.'
  });
});

app.delete('/api/file-imports/:id', (req, res) => {
  res.status(403).json({
    error: 'Deleting file imports is disabled. This endpoint works with existing raw_csv_uploads data only.'
  });
});

// ============================================================================
// STATISTICS & EXPORT ROUTES (LEGACY - DISABLED)
// ============================================================================

app.get('/api/statistics', (req, res) => {
  res.status(410).json({
    error: 'Statistics endpoint deprecated',
    message: 'This endpoint has been moved to analytics endpoints.'
  });
});

app.get('/api/export', (req, res) => {
  res.status(410).json({
    error: 'Export endpoint deprecated',
    message: 'This endpoint has been moved to analytics endpoints.'
  });
});

// ============================================================================
// EMAIL ROUTES
// ============================================================================

app.post('/api/email/send', sendEmail);
app.get('/api/email/delivery/:emailId', getEmailDeliveryStatus);
app.get('/api/email/templates/:templateId', getEmailTemplate);

// ============================================================================
// OTP ROUTES
// ============================================================================

app.post('/api/otp/generate', apiRateLimit, generateAndSendOTP); // New auto-generate endpoint
app.post('/api/otp/generate-and-send', apiRateLimit, generateAndSendOTP); // Alias for frontend compatibility
app.post('/api/otp/generate-test', apiRateLimit, generateTestOTP); // Test endpoint
app.post('/api/otp/send', apiRateLimit, sendOTP);
app.post('/api/otp/validate', validateOTP);
app.get('/api/otp/remaining-attempts/:email', getRemainingAttempts);
app.get('/api/otp/daily-count/:email', getDailyCount);
app.get('/api/otp/rate-limit/:email', checkRateLimit);
app.get('/api/otp/active/:email', getActiveOTP);
app.post('/api/otp/reset-daily-limit', resetDailyLimit);
app.post('/api/otp/increment-daily-count', incrementDailyCount);
app.delete('/api/otp/cleanup-expired', cleanupExpired);

// Multi-factor OTP routes
app.post('/api/users/totp/setup', setupTOTP);
app.get('/api/users/totp/status/:email', getTOTPStatus);
app.get('/api/users/profile/:email', getOTPUserProfile);

// Start server
// FIX 5: Add proper Redis initialization or fallback for rate limiting
import { redisRateLimiter } from './src/lib/security/RedisRateLimiter.ts';

let redisAvailable = false;
try {
  await redisRateLimiter.initialize();
  redisAvailable = true;
  console.log('✅ Redis rate limiter initialized successfully');
} catch (error) {
  console.warn('⚠️ Redis unavailable, rate limiting will use in-memory fallback');
  console.warn('   Error:', error.message);
  // Continue without Redis - middleware will handle gracefully
}

const server = app.listen(PORT, async () => {
  try {
    console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
    console.log(`📊 MySQL Database: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}`);

    // TEMPORARILY DISABLE DATABASE TEST DURING STARTUP
    // TODO: Fix database connection hanging issue
    // await testDatabaseConnection();
    console.log('✅ Server startup completed successfully (database test skipped)');
  } catch (error) {
    console.error('❌ Server startup error:', error);
  }
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Reason stack:', reason?.stack);
  // Don't exit - keep server running
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔴 SIGINT RECEIVED - Shutting down gracefully...');
  console.trace('SIGINT stack trace:');
  server.close(() => {
    console.log('Server closed');
  });
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔴 SIGTERM RECEIVED - Shutting down gracefully...');
  console.trace('SIGTERM stack trace:');
  server.close(() => {
    console.log('Server closed');
  });
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});
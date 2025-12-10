import dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

// Import validation schemas
import {
  LoginSchema,
  RegisterSchema,
  RegisterFromInvitationSchema,
  OTPGenerateSchema,
  OTPVerifySchema,
  InvitationCreateSchema,
  InvitationAcceptSchema,
  PreferencesUpdateSchema
} from './src/schemas/validation/index.js';

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
import fs from 'fs';
import path from 'path';

// Import database utilities (AFTER dotenv is loaded)
import { getPool, testDatabaseConnection, startPoolMonitoring } from './utils/database.js';

// Import middleware
import { authenticateToken, setAuthMiddlewarePool } from './middleware/auth.js';
import { loginRateLimit, invitationRateLimit, apiRateLimit, emailRateLimit, searchRateLimit, registrationRateLimit, otpRateLimit, rateLimitStatus, clearRateLimit } from './middleware/rateLimit.js';
import { monitoringMiddleware } from './middleware/monitoring.js';
import { validateRequest } from './server/middleware/validation.js';
import { errorHandler, notFoundHandler } from './server/middleware/errorHandler.js';

// Import route modules
import {
  login,
  logout,
  refresh,
  registerFromInvitation,
  requestPasswordReset,
  validatePasswordResetToken,
  resetPassword,
  setAuthPool,
  verifyAuth
} from './routes/auth.js';

import {
  getAllInvitations,
  createInvitation,
  createBulkInvitations,
  validateInvitation,
  updateInvitation,
  resendInvitation,
  revokeInvitation,
  setInvitationsPool
} from './routes/invitations.js';

import onboardingRouter, { setOnboardingPool } from './routes/onboarding.js';

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
  getAllActiveOTPs,
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

import {
  getAllDomains,
  getDomainById,
  getPrimaryDomains,
  getDomainChildren,
  getDomainHierarchy,
  createDomain,
  updateDomain,
  deleteDomain,
  setDomainsPool
} from './routes/domains.js';

import {
  getUserPreferences,
  updateUserPreferences,
  getAvailableDomains,
  validatePreferencesEndpoint,
  getNotificationPreferences,
  updateNotificationPreferences,
  getPrivacySettings,
  updatePrivacySettings,
  getAccountSettings,
  setPreferencesPool
} from './routes/preferences.js';



import {
  getMemberDashboard,
  setDashboardPool
} from './routes/dashboard.js';

import {
  getTags,
  searchTagsEndpoint,
  getSuggestedTagsEndpoint,
  getPopularTagsEndpoint,
  createTag,
  getPostingTagsEndpoint,
  addPostingTags,
  approveTagEndpoint,
  getPendingTags,
  setTagsPool
} from './routes/tags.js';

import postingsRouter, { setPostingsPool } from './routes/postings.js';

import familyMembersRouter from './routes/family-members.js';

// Moderation router - REWRITTEN Nov 4, 2025
import moderationRouter from './server/routes/moderation-new.js';

// Chat routes and socket server
import registerChatRoutes, { setChatIO } from './routes/chat.js';
import { initializeChatSocket } from './server/socket/chatSocket.js';

// Environment variables already loaded at top of file
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database pool
const pool = getPool();

// Set up database pools for all modules
setAuthPool(pool);
setAuthMiddlewarePool(pool);
setInvitationsPool(pool);
setOnboardingPool(pool);
setAlumniPool(pool);
setUsersPool(pool);
setAnalyticsPool(pool);
setQualityPool(pool);
setHealthPool(pool);
setOTPPool(pool);
setMonitoringPool(pool);
setEmailPool(pool);
setDomainsPool(pool);
setPreferencesPool(pool);
setTagsPool(pool);
setPostingsPool(pool);
setDashboardPool(pool);

// Middleware
app.use(cors());
app.use(express.json());

// Monitoring middleware (must be early in the stack)
app.use(monitoringMiddleware);

// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/auth/login', loginRateLimit, validateRequest({ body: LoginSchema }), login);
app.post('/api/auth/logout', authenticateToken, logout);
app.get('/api/auth/verify', verifyAuth); // Mobile debugging endpoint - no auth required
app.post('/api/auth/refresh', refresh);
app.post('/api/auth/register-from-invitation', registrationRateLimit, validateRequest({ body: RegisterFromInvitationSchema }), (req, res, next) => {
  // Reduce verbose logging in production
  if (process.env.NODE_ENV !== 'production') {
    console.log('🔵 ROUTE MATCHED: /api/auth/register-from-invitation');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
  }
  next();
}, registerFromInvitation);

// Password reset routes
app.post('/api/auth/request-password-reset', apiRateLimit, validateRequest({ body: { email: 'email' } }), requestPasswordReset);
app.post('/api/auth/validate-password-reset-token', validatePasswordResetToken);
app.post('/api/auth/reset-password', apiRateLimit, validateRequest({ body: { token: 'string', password: 'string' } }), resetPassword);

// ============================================================================
// INVITATION SYSTEM ROUTES
// ============================================================================

app.get('/api/invitations', getAllInvitations);
app.post('/api/invitations', invitationRateLimit, validateRequest({ body: InvitationCreateSchema }), createInvitation);
app.post('/api/invitations/bulk', invitationRateLimit, createBulkInvitations);
app.get('/api/invitations/validate/:token', apiRateLimit, (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('ROUTE_MATCH: Invitation validation route matched for token:', req.params.token);
  }
  next();
}, validateInvitation);
app.patch('/api/invitations/:id', invitationRateLimit, updateInvitation);
app.post('/api/invitations/:id/resend', invitationRateLimit, resendInvitation);
app.put('/api/invitations/:id/revoke', invitationRateLimit, revokeInvitation);

// ============================================================================
// ONBOARDING ROUTES (Profile Selection & COPPA Compliance)
// ============================================================================

app.use('/api/onboarding', onboardingRouter);

// ============================================================================
// ALUMNI MEMBERS ROUTES
// ============================================================================

app.get('/api/alumni-members/search', searchRateLimit, searchAlumniMembers);
app.get('/api/alumni/directory', searchRateLimit, getAlumniDirectory);  // New directory endpoint
app.get('/api/alumni-members/:id', getAlumniMember);
app.put('/api/alumni-members/:id', apiRateLimit, updateAlumniMember);
app.post('/api/alumni-members/:id/send-invitation', authenticateToken, sendInvitationToAlumni);

// ============================================================================
// USER MANAGEMENT ROUTES
// ============================================================================

app.put('/api/users/:id', authenticateToken, apiRateLimit, updateUser);
app.post('/api/users/:id/send-invitation', authenticateToken, sendInvitationToUser);

// ============================================================================
// USER SEARCH & PROFILE ROUTES
// ============================================================================

app.get('/api/users/search', searchRateLimit, searchUsers);
app.get('/api/users/:id/profile', getUserProfile);
app.get('/api/users/profile', authenticateToken, getCurrentUserProfile);

// User profiles endpoints (aliases for consistency with frontend API calls)
app.get('/api/user-profiles/:id', getUserProfile);
app.put('/api/user-profiles/:id', authenticateToken, apiRateLimit, updateUser);

// ============================================================================
// MEMBER DASHBOARD ROUTES
// ============================================================================

app.get('/api/dashboard/member', authenticateToken, getMemberDashboard);

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
    // Note: req.user.id is now a UUID string (from accounts table)
    if (req.user.id !== userId && req.user.role !== 'admin') {
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
    // Note: req.user.id is now a UUID string (from accounts table)
    if (req.user.id !== userId && req.user.role !== 'admin') {
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
    // Note: req.user.id is now a UUID string (from accounts table)
    if (req.user.id !== userId && req.user.role !== 'admin') {
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
    // Note: req.user.id is now a UUID string (from accounts table)
    if (req.user.id !== userId && req.user.role !== 'admin') {
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

app.post('/api/email/send', emailRateLimit, sendEmail);
app.get('/api/email/delivery/:emailId', apiRateLimit, getEmailDeliveryStatus);
app.get('/api/email/templates/:templateId', getEmailTemplate);

// ============================================================================
// DOMAIN ROUTES
// ============================================================================

app.get('/api/domains', getAllDomains);
app.get('/api/domains/primary', getPrimaryDomains);
app.get('/api/domains/hierarchy', getDomainHierarchy);
app.get('/api/domains/:id', getDomainById);
app.get('/api/domains/:id/children', getDomainChildren);
app.post('/api/admin/domains', authenticateToken, apiRateLimit, createDomain);
app.put('/api/admin/domains/:id', authenticateToken, apiRateLimit, updateDomain);
app.delete('/api/admin/domains/:id', authenticateToken, apiRateLimit, deleteDomain);

// ============================================================================
// PREFERENCES ROUTES (Task 7.7.2)
// ============================================================================

app.get('/api/preferences/:userId', authenticateToken, getUserPreferences);
app.put('/api/preferences/:userId', authenticateToken, validateRequest({ body: PreferencesUpdateSchema }), updateUserPreferences);
app.get('/api/preferences/domains/available', getAvailableDomains);
app.post('/api/preferences/validate', validatePreferencesEndpoint);

// ============================================================================
// NOTIFICATION & PRIVACY PREFERENCES ROUTES (Task 7.7.4)
// ============================================================================

app.get('/api/users/:userId/notification-preferences', authenticateToken, getNotificationPreferences);
app.put('/api/users/:userId/notification-preferences', authenticateToken, updateNotificationPreferences);
app.get('/api/users/:userId/privacy-settings', authenticateToken, getPrivacySettings);
app.put('/api/users/:userId/privacy-settings', authenticateToken, updatePrivacySettings);
app.get('/api/users/:userId/account-settings', authenticateToken, getAccountSettings);



// ============================================================================
// TAG ROUTES (Task 7.7.3)
// ============================================================================

// Public tag endpoints
app.get('/api/tags', getTags);
app.get('/api/tags/search', searchTagsEndpoint);
app.get('/api/tags/suggested', getSuggestedTagsEndpoint);
app.get('/api/tags/popular', getPopularTagsEndpoint);
app.post('/api/tags', authenticateToken, apiRateLimit, createTag);

// Posting tag endpoints
app.get('/api/postings/:id/tags', getPostingTagsEndpoint);
app.post('/api/postings/:id/tags', authenticateToken, addPostingTags);

// Admin tag endpoints
app.post('/api/admin/tags/:id/approve', authenticateToken, apiRateLimit, approveTagEndpoint);
app.get('/api/admin/tags/pending', authenticateToken, getPendingTags);

// ============================================================================
// POSTINGS ROUTES
// ============================================================================
app.use('/api/postings', postingsRouter);

// ============================================================================
// MODERATION ROUTES
// ============================================================================
// All moderation routes require authentication and moderator/admin role
app.use('/api/moderation', authenticateToken, apiRateLimit, moderationRouter);

// ============================================================================
// FAMILY MEMBERS ROUTES
// ============================================================================
app.use('/api/family-members', familyMembersRouter);

// ============================================================================
// CHAT & MESSAGING ROUTES
// ============================================================================
registerChatRoutes(app);

// ============================================================================
// OTP ROUTES
// ============================================================================

app.post('/api/otp/generate', apiRateLimit, validateRequest({ body: OTPGenerateSchema }), generateAndSendOTP); // New auto-generate endpoint
app.post('/api/otp/generate-and-send', apiRateLimit, validateRequest({ body: OTPGenerateSchema }), generateAndSendOTP); // Alias for frontend compatibility
app.post('/api/otp/generate-test', apiRateLimit, validateRequest({ body: OTPGenerateSchema }), generateTestOTP); // Test endpoint
app.post('/api/otp/send', apiRateLimit, validateRequest({ body: OTPGenerateSchema }), sendOTP);
app.post('/api/otp/validate', otpRateLimit, validateRequest({ body: OTPVerifySchema }), validateOTP);
app.get('/api/otp/remaining-attempts/:email', getRemainingAttempts);
app.get('/api/otp/daily-count/:email', getDailyCount);
app.get('/api/otp/rate-limit/:email', checkRateLimit);
app.get('/api/otp/active/:email', getActiveOTP);
app.get('/api/otp/admin/all-active', getAllActiveOTPs); // Admin endpoint to get all active OTPs
app.post('/api/otp/reset-daily-limit', resetDailyLimit);
app.post('/api/otp/increment-daily-count', incrementDailyCount);
app.delete('/api/otp/cleanup-expired', cleanupExpired);

// Multi-factor OTP routes
app.post('/api/users/totp/setup', otpRateLimit, setupTOTP);
app.get('/api/users/totp/status/:email', getTOTPStatus);
app.get('/api/users/profile/:email', getOTPUserProfile);

// ============================================================================
// FEATURE STATUS DASHBOARD API
// ============================================================================
app.get('/api/feature-status', authenticateToken, (req, res) => {
  try {
    // Try multiple locations
    const locations = [
      path.join(process.cwd(), 'scripts/validation/feature-status.json'),
      path.join(process.cwd(), 'public/api/feature-status.json')
    ];

    let statusPath = null;
    for (const loc of locations) {
      if (fs.existsSync(loc)) {
        statusPath = loc;
        break;
      }
    }
    
    if (!statusPath) {
      console.error('Feature status file not found in locations:', locations);
      return res.status(404).json({ 
        error: 'Status report not found', 
        checkedLocations: locations 
      });
    }
    
    const fileContent = fs.readFileSync(statusPath, 'utf8');
    try {
      const statusData = JSON.parse(fileContent);
      res.json(statusData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return res.status(500).json({ 
        error: 'Invalid JSON in status file', 
        message: parseError.message 
      });
    }
  } catch (err) {
    console.error('Error reading status:', err);
    res.status(500).json({ 
      error: 'Failed to read status', 
      message: err.message
    });
  }
});

// ============================================================================
// ERROR HANDLING MIDDLEWARE
// ============================================================================
// IMPORTANT: Must be registered AFTER all routes
// 404 handler for undefined routes
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
// Note: Redis rate limiter is initialized automatically via constructor
import { redisRateLimiter } from './src/lib/security/RedisRateLimiter.ts';

let redisAvailable = false;
try {
  // Give Redis a moment to initialize (constructor is called automatically)
  await new Promise(resolve => setTimeout(resolve, 1000));
  redisAvailable = true;
  console.log('✅ Redis rate limiter ready');
} catch (error) {
  console.warn('⚠️ Redis unavailable, rate limiting will use in-memory fallback');
  console.warn('   Error:', error.message);
  // Continue without Redis - middleware will handle gracefully
}




const server = app.listen(PORT, '0.0.0.0', async () => {
  try {
    // Get actual network IP
    const os = await import('os');
    const networkInterfaces = os.networkInterfaces();
    let networkIP = 'localhost';
    
    // Find the first non-internal IPv4 address
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const addr of addresses) {
        if (addr.family === 'IPv4' && !addr.internal) {
          networkIP = addr.address;
          break;
        }
      }
      if (networkIP !== 'localhost') break;
    }
    
    console.log(`🚀 Backend API server running on http://0.0.0.0:${PORT}`);
    console.log(`🌐 Network accessible at: http://${networkIP}:${PORT}`);
    console.log(`📱 Mobile access: http://${networkIP}:${PORT}`);
    console.log(`📊 MySQL Database: ${process.env.DB_NAME}`);
    console.log(`🏠 Host: ${process.env.DB_HOST}`);

    // Initialize Socket.IO for chat system
    const chatIO = initializeChatSocket(server);
    setChatIO(chatIO);
    console.log('💬 Chat Socket.IO server initialized');

    // Test database connection with timeout protection
    console.log('🔍 Testing database connection...');
    const dbTestTimeout = setTimeout(() => {
      console.warn('⚠️  Database test is taking longer than expected (>5s)');
    }, 5000);

    try {
      const dbConnected = await Promise.race([
        testDatabaseConnection(),
        new Promise((resolve) => setTimeout(() => resolve(false), 10000))
      ]);

      clearTimeout(dbTestTimeout);

      if (dbConnected) {
        console.log('✅ Database connection test passed');
      } else {
        console.warn('⚠️  Database connection test timed out after 10s');
        console.warn('   Server will continue, but database may be slow or unreachable');
      }
    } catch (dbError) {
      clearTimeout(dbTestTimeout);
      console.error('⚠️  Database connection test failed:', dbError.message);
      console.warn('   Server will continue, but database operations may fail');
    }

    // Start pool monitoring (logs every 60 seconds)
    console.log('🔍 Starting connection pool monitoring...');
    startPoolMonitoring(60000); // Log pool status every minute

    console.log('✅ Server startup completed successfully');
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
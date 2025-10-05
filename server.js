import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import database utilities
import { getPool, testDatabaseConnection } from './utils/database.js';

// Import middleware
import { authenticateToken, setAuthMiddlewarePool } from './middleware/auth.js';
import { loginRateLimit, invitationRateLimit, apiRateLimit, rateLimitStatus, clearRateLimit } from './middleware/rateLimit.js';

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

// Load environment variables
dotenv.config();

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

// Middleware
app.use(cors());
app.use(express.json());

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

app.post('/api/auth/login', loginRateLimit, login);
app.post('/api/auth/logout', authenticateToken, logout);
app.post('/api/auth/refresh', refresh);
app.post('/api/auth/register-from-invitation', registerFromInvitation);
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
app.get('/api/invitations/validate/:token', validateInvitation);
app.patch('/api/invitations/:id', updateInvitation);

// ============================================================================
// ALUMNI MEMBERS ROUTES
// ============================================================================

app.get('/api/alumni-members/search', searchAlumniMembers);
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
// DASHBOARD ROUTES (NOT IMPLEMENTED)
// ============================================================================

app.get('/api/users/current', (req, res) => {
  res.status(501).json({
    error: 'Current user endpoint not implemented',
    message: 'This endpoint requires authentication and database implementation'
  });
});

app.get('/api/users/:userId/stats', (req, res) => {
  res.status(501).json({
    error: 'User stats endpoint not implemented',
    message: 'This endpoint requires database tables for connections, postings, and messages'
  });
});

app.get('/api/conversations/recent', (req, res) => {
  res.status(501).json({
    error: 'Conversations endpoint not implemented',
    message: 'This endpoint requires database tables for messaging and conversations'
  });
});

app.get('/api/posts/personalized', (req, res) => {
  res.status(501).json({
    error: 'Personalized posts endpoint not implemented',
    message: 'This endpoint requires database tables for posts and content management'
  });
});

app.get('/api/notifications', (req, res) => {
  res.status(501).json({
    error: 'Notifications endpoint not implemented',
    message: 'This endpoint requires database table for notifications'
  });
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
// OTP ROUTES (LEGACY - DISABLED)
// ============================================================================

app.post('/api/otp/generate', (req, res) => {
  res.status(410).json({
    error: 'OTP generation endpoint deprecated',
    message: 'OTP functionality has been moved to separate service.'
  });
});

app.post('/api/otp/validate', (req, res) => {
  res.status(410).json({
    error: 'OTP validation endpoint deprecated',
    message: 'OTP functionality has been moved to separate service.'
  });
});

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Backend API server running on http://localhost:${PORT}`);
  console.log(`📊 MySQL Database: ${process.env.DB_NAME}`);
  console.log(`🏠 Host: ${process.env.DB_HOST}`);

  // Test database connection
  await testDatabaseConnection();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - keep server running
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - keep server running
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
  });
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
  });
  if (pool) {
    await pool.end();
  }
  process.exit(0);
});
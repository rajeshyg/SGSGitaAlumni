/**
 * Chat WebSocket Server
 * Task 7.10: Chat & Messaging System
 *
 * Handles real-time messaging using Socket.IO
 * Features:
 * - Real-time message delivery
 * - Typing indicators
 * - Read receipts
 * - Online status
 */

import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// JWT Configuration
// SECURITY FIX: Lazy initialization to ensure dotenv has loaded
// ES modules hoist imports, so top-level code runs BEFORE dotenv.config()
// Using a getter function ensures we read env vars at runtime, not parse time
let _jwtSecret = null;

function getJwtSecret() {
  if (_jwtSecret === null) {
    // Fail fast if JWT_SECRET not set in production
    if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
    }

    _jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development'
      ? 'dev-only-secret-DO-NOT-USE-IN-PRODUCTION'
      : null);

    if (!_jwtSecret) {
      throw new Error('FATAL: JWT_SECRET not configured. Set JWT_SECRET environment variable.');
    }
    
    console.log('[Chat Socket] JWT_SECRET initialized:', {
      source: process.env.JWT_SECRET ? 'environment variable' : 'development fallback',
      preview: _jwtSecret.substring(0, 15) + '...'
    });
  }
  return _jwtSecret;
}

// Store active socket connections
const activeUsers = new Map(); // userId -> Set of socketIds
const userSockets = new Map(); // socketId -> userId

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer - HTTP server instance
 * @returns {Server} Socket.IO server instance
 */
export function initializeChatSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const jwtSecret = getJwtSecret();
      const decoded = jwt.verify(token, jwtSecret);
      // Support both old (userId) and new (accountId) token formats
      socket.userId = decoded.userId || decoded.accountId;
      socket.email = decoded.email;
      console.log('[Chat Socket] ✅ Token verified successfully:', {
        userId: socket.userId,
        email: decoded.email,
        exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'no expiry',
        iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'no issued time'
      });
      next();
    } catch (error) {
      const jwtSecret = getJwtSecret();
      console.error('[Chat Socket] ❌ JWT verification failed:', {
        errorName: error.name,
        errorMessage: error.message,
        tokenPreview: token ? `${token.substring(0, 20)}...${token.substring(token.length - 20)}` : 'no token',
        tokenLength: token?.length,
        JWT_SECRET_source: process.env.JWT_SECRET ? 'process.env.JWT_SECRET' : 'development fallback',
        JWT_SECRET_preview: jwtSecret ? `${jwtSecret.substring(0, 15)}...` : 'undefined',
        timestamp: new Date().toISOString()
      });
      next(new Error(`Authentication error: ${error.name} - ${error.message}`));
    }
  });

  // Connection handling
  io.on('connection', (socket) => {
    const userId = socket.userId;
    console.log(`[Chat Socket] User ${userId} connected (${socket.id})`);

    // Track user's socket connections
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }
    activeUsers.get(userId).add(socket.id);
    userSockets.set(socket.id, userId);

    // Notify user is online
    socket.broadcast.emit('user:online', { userId });

    // Join conversation rooms
    socket.on('conversation:join', (conversationId, callback) => {
      const room = `conversation:${conversationId}`;
      socket.join(room);
      console.log(`[Chat Socket] User ${userId} joined conversation ${conversationId} (room: ${room})`);
      console.log(`[Chat Socket] Socket ${socket.id} is now in rooms:`, Array.from(socket.rooms));
      
      // Send acknowledgment to client
      if (typeof callback === 'function') {
        callback({ success: true, conversationId, room });
      }
    });

    // Leave conversation rooms
    socket.on('conversation:leave', (conversationId, callback) => {
      const room = `conversation:${conversationId}`;
      socket.leave(room);
      console.log(`[Chat Socket] User ${userId} left conversation ${conversationId} (room: ${room})`);
      
      // Send acknowledgment to client
      if (typeof callback === 'function') {
        callback({ success: true, conversationId });
      }
    });

    // Handle new messages
    socket.on('message:send', (data) => {
      const { conversationId, messageId, content, messageType, createdAt } = data;

      // Broadcast to all users in the conversation except sender
      socket.to(`conversation:${conversationId}`).emit('message:new', {
        messageId,
        conversationId,
        senderId: userId,
        content,
        messageType,
        createdAt
      });

      console.log(`[Chat Socket] Message sent in conversation ${conversationId} by user ${userId}`);
    });

    // Handle typing indicators
    socket.on('typing:start', ({ conversationId, userId: typingUserId, userName }) => {
      console.log(`[Chat Socket] User ${userId} (${userName}) started typing in conversation ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        userId: typingUserId || userId,
        userName: userName || socket.email || 'User',
        conversationId
      });
    });

    socket.on('typing:stop', ({ conversationId, userId: typingUserId }) => {
      console.log(`[Chat Socket] User ${userId} stopped typing in conversation ${conversationId}`);
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        userId: typingUserId || userId,
        conversationId
      });
    });

    // Handle read receipts
    socket.on('message:read', ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:read', {
        userId,
        messageId,
        readAt: new Date().toISOString()
      });
    });

    // Handle message reactions
    socket.on('message:react', ({ conversationId, messageId, emoji }) => {
      socket.to(`conversation:${conversationId}`).emit('message:reaction', {
        userId,
        messageId,
        emoji,
        createdAt: new Date().toISOString()
      });
    });

    // Handle message edits
    socket.on('message:edit', ({ conversationId, messageId, content }) => {
      socket.to(`conversation:${conversationId}`).emit('message:edited', {
        messageId,
        content,
        editedAt: new Date().toISOString()
      });
    });

    // Handle message deletes
    socket.on('message:delete', ({ conversationId, messageId }) => {
      socket.to(`conversation:${conversationId}`).emit('message:deleted', {
        messageId,
        deletedAt: new Date().toISOString()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`[Chat Socket] User ${userId} disconnected (${socket.id})`);

      // Remove socket from tracking
      if (activeUsers.has(userId)) {
        activeUsers.get(userId).delete(socket.id);

        // If user has no more active sockets, mark as offline
        if (activeUsers.get(userId).size === 0) {
          activeUsers.delete(userId);
          socket.broadcast.emit('user:offline', { userId });
        }
      }
      userSockets.delete(socket.id);
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`[Chat Socket] Error for user ${userId}:`, error);
    });
  });

  return io;
}

/**
 * Get all active user IDs
 * @returns {number[]} Array of active user IDs
 */
export function getActiveUserIds() {
  return Array.from(activeUsers.keys());
}

/**
 * Check if user is online
 * @param {number} userId - User ID to check
 * @returns {boolean} True if user is online
 */
export function isUserOnline(userId) {
  return activeUsers.has(userId);
}

/**
 * Send direct message to specific user (if online)
 * @param {Server} io - Socket.IO server instance
 * @param {number} userId - Target user ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 */
export function sendToUser(io, userId, event, data) {
  const socketIds = activeUsers.get(userId);
  if (socketIds) {
    socketIds.forEach(socketId => {
      io.to(socketId).emit(event, data);
    });
  }
}

/**
 * Broadcast to all users in a conversation
 * @param {Server} io - Socket.IO server instance
 * @param {string} conversationId - Conversation ID
 * @param {string} event - Event name
 * @param {any} data - Event data
 * @param {number} [excludeUserId] - Optional user ID to exclude from broadcast
 */
export function broadcastToConversation(io, conversationId, event, data, excludeUserId = null) {
  const room = `conversation:${conversationId}`;
  
  // Get all sockets in the room for debugging
  const socketsInRoom = io.sockets.adapter.rooms.get(room);
  console.log(`[Socket Broadcast] Room ${room} has ${socketsInRoom?.size || 0} sockets:`, 
    socketsInRoom ? Array.from(socketsInRoom) : []);
  
  console.log(`[Socket Broadcast] Sending ${event} to room ${room}:`, {
    dataKeys: Object.keys(data),
    excludeUserId,
    activeUsers: Array.from(activeUsers.keys())
  });

  if (excludeUserId) {
    const socketIds = activeUsers.get(excludeUserId);
    console.log(`[Socket Broadcast] Excluding user ${excludeUserId}, socketIds:`, Array.from(socketIds || []));
    if (socketIds && socketIds.size > 0) {
      // Convert Set to Array for except()
      const socketIdsArray = Array.from(socketIds);
      console.log(`[Socket Broadcast] Broadcasting to room ${room}, excluding sockets:`, socketIdsArray);
      io.to(room).except(socketIdsArray).emit(event, data);
    } else {
      console.log(`[Socket Broadcast] No sockets to exclude, broadcasting to entire room`);
      io.to(room).emit(event, data);
    }
  } else {
    console.log(`[Socket Broadcast] No user to exclude, broadcasting to entire room`);
    io.to(room).emit(event, data);
  }
  console.log(`[Socket Broadcast] Broadcast complete for event ${event}`);
}

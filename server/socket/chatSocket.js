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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.email = decoded.email;
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
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
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`[Chat Socket] User ${userId} joined conversation ${conversationId}`);
    });

    // Leave conversation rooms
    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`[Chat Socket] User ${userId} left conversation ${conversationId}`);
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
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        userId,
        conversationId,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:user', {
        userId,
        conversationId,
        isTyping: false
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
  if (excludeUserId) {
    const socketIds = activeUsers.get(excludeUserId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        io.to(room).except(socketId).emit(event, data);
      });
    } else {
      io.to(room).emit(event, data);
    }
  } else {
    io.to(room).emit(event, data);
  }
}

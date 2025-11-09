/**
 * Chat & Messaging API Routes
 * Task 7.10: Chat & Messaging System
 *
 * Provides RESTful endpoints for:
 * - Conversation management
 * - Message operations (send, edit, delete)
 * - Participant management
 * - Reactions and read receipts
 *
 * Created: November 8, 2025
 */

import { z } from 'zod';
import { authenticateToken } from './auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { asyncHandler } from '../server/middleware/errorHandler.js';
import { ValidationError, ResourceError, AuthError, ServerError } from '../server/errors/ApiError.js';
import {
  CreateConversationSchema,
  SendMessageSchema,
  EditMessageSchema,
  AddReactionSchema,
  AddParticipantSchema,
  GetMessagesSchema,
  MarkAsReadSchema
} from '../src/schemas/validation/index.ts';
import { getPool } from '../utils/database.js';
import * as chatService from '../server/services/chatService.js';

// Socket.IO instance (will be injected by server)
let io = null;

export function setChatIO(socketIO) {
  io = socketIO;
}

// ============================================================================
// CONVERSATION ENDPOINTS
// ============================================================================

/**
 * POST /api/conversations
 * Create a new conversation
 */
export const createConversation = asyncHandler(async (req, res) => {
  console.log('[Chat API] Create conversation request:', {
    userId: req.user.id,
    type: req.body.type
  });

  // Validate request body
  const validatedData = CreateConversationSchema.parse(req.body);

  // Create conversation
  const conversation = await chatService.createConversation(req.user.id, validatedData);

  // Notify participants via WebSocket
  if (io) {
    for (const participant of conversation.participants) {
      if (participant.userId !== req.user.id) {
        const socketHelpers = await import('../server/socket/chatSocket.js');
        socketHelpers.sendToUser(io, participant.userId, 'conversation:created', {
          conversation: {
            id: conversation.id,
            type: conversation.type,
            name: conversation.name,
            createdBy: {
              id: req.user.id,
              firstName: req.user.first_name,
              lastName: req.user.last_name
            },
            createdAt: conversation.createdAt
          }
        });
      }
    }
  }

  res.status(201).json({
    success: true,
    data: conversation
  });
});

/**
 * GET /api/conversations
 * Get user's conversations with pagination
 */
export const getConversations = asyncHandler(async (req, res) => {
  const { type, includeArchived, page, limit } = req.query;

  console.log('[Chat API] Get conversations request:', {
    userId: req.user.id,
    type,
    includeArchived,
    page,
    limit
  });

  const filters = {
    type,
    includeArchived: includeArchived === 'true',
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20
  };

  const result = await chatService.getConversations(req.user.id, filters);

  res.json({
    success: true,
    ...result
  });
});

/**
 * GET /api/conversations/:id
 * Get conversation details
 */
export const getConversationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[Chat API] Get conversation by ID:', { conversationId: id, userId: req.user.id });

  const conversation = await chatService.getConversationById(id, req.user.id);

  res.json({
    success: true,
    data: conversation
  });
});

/**
 * POST /api/conversations/:id/archive
 * Archive a conversation
 */
export const archiveConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[Chat API] Archive conversation:', { conversationId: id, userId: req.user.id });

  await chatService.archiveConversation(id, req.user.id);

  // Notify other participants via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, id, 'conversation:archived', {
      conversationId: id,
      archivedBy: req.user.id,
      archivedAt: new Date().toISOString()
    }, req.user.id);
  }

  res.json({
    success: true,
    message: 'Conversation archived successfully'
  });
});

// ============================================================================
// MESSAGE ENDPOINTS
// ============================================================================

/**
 * GET /api/conversations/:id/messages
 * Get messages for a conversation
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page, limit, before, after } = req.query;

  console.log('[Chat API] Get messages:', { conversationId: id, userId: req.user.id });

  // Validate query parameters
  const validatedData = GetMessagesSchema.parse({
    conversationId: id,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
    before,
    after
  });

  const result = await chatService.getMessages(
    validatedData.conversationId,
    req.user.id,
    {
      page: validatedData.page,
      limit: validatedData.limit,
      before: validatedData.before,
      after: validatedData.after
    }
  );

  res.json({
    success: true,
    ...result
  });
});

/**
 * POST /api/conversations/:id/messages
 * Send a message
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[Chat API] Send message:', { conversationId: id, userId: req.user.id });

  // Validate request body
  const validatedData = SendMessageSchema.parse({
    conversationId: id,
    ...req.body
  });

  // Send message
  const message = await chatService.sendMessage(req.user.id, validatedData);

  // Broadcast message via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, id, 'message:new', {
      messageId: message.id,
      conversationId: message.conversationId,
      sender: message.sender,
      content: message.content,
      messageType: message.messageType,
      mediaUrl: message.mediaUrl,
      mediaMetadata: message.mediaMetadata,
      replyToId: message.replyToId,
      createdAt: message.createdAt
    }, req.user.id);
  }

  res.status(201).json({
    success: true,
    data: message
  });
});

/**
 * PUT /api/messages/:id
 * Edit a message
 */
export const editMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  console.log('[Chat API] Edit message:', { messageId: id, userId: req.user.id });

  // Validate request body
  const validatedData = EditMessageSchema.parse({
    messageId: id,
    content
  });

  // Edit message
  const message = await chatService.editMessage(validatedData.messageId, req.user.id, validatedData.content);

  // Broadcast edit via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, message.conversationId, 'message:edited', {
      messageId: message.id,
      content: message.content,
      editedAt: message.editedAt
    }, req.user.id);
  }

  res.json({
    success: true,
    data: message
  });
});

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
export const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[Chat API] Delete message:', { messageId: id, userId: req.user.id });

  // Get message details before deleting (for WebSocket notification)
  // Note: chatService.deleteMessage will validate permissions
  const db = getPool();
  const connection = await db.getConnection();
  const [messages] = await connection.execute(
    'SELECT conversation_id FROM MESSAGES WHERE id = ?',
    [id]
  );
  connection.release();

  if (messages.length === 0) {
    throw new ResourceError('Message not found');
  }

  const conversationId = messages[0].conversation_id;

  // Delete message
  await chatService.deleteMessage(id, req.user.id);

  // Broadcast deletion via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, conversationId, 'message:deleted', {
      messageId: id,
      deletedAt: new Date().toISOString()
    }, req.user.id);
  }

  res.json({
    success: true,
    message: 'Message deleted successfully'
  });
});

// ============================================================================
// REACTION ENDPOINTS
// ============================================================================

/**
 * POST /api/messages/:id/reactions
 * Add a reaction to a message
 */
export const addReaction = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { emoji } = req.body;

  console.log('[Chat API] Add reaction:', { messageId: id, userId: req.user.id, emoji });

  // Validate request body
  const validatedData = AddReactionSchema.parse({
    messageId: id,
    emoji
  });

  // Add reaction
  const reaction = await chatService.addReaction(validatedData.messageId, req.user.id, validatedData.emoji);

  // Get conversation ID for WebSocket broadcast
  const db = getPool();
  const connection = await db.getConnection();
  const [messages] = await connection.execute(
    'SELECT conversation_id FROM MESSAGES WHERE id = ?',
    [id]
  );
  connection.release();

  // Broadcast reaction via WebSocket
  if (io && messages.length > 0) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, messages[0].conversation_id, 'message:reaction', {
      messageId: id,
      reaction: {
        id: reaction.id,
        emoji: reaction.emoji,
        user: reaction.user,
        createdAt: reaction.createdAt
      }
    }, req.user.id);
  }

  res.status(201).json({
    success: true,
    data: reaction
  });
});

/**
 * DELETE /api/reactions/:id
 * Remove a reaction
 */
export const removeReaction = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log('[Chat API] Remove reaction:', { reactionId: id, userId: req.user.id });

  // Get message ID and conversation ID before deleting (for WebSocket notification)
  const db = getPool();
  const connection = await db.getConnection();
  const [reactions] = await connection.execute(
    `SELECT mr.message_id, m.conversation_id
     FROM MESSAGE_REACTIONS mr
     JOIN MESSAGES m ON mr.message_id = m.id
     WHERE mr.id = ?`,
    [id]
  );
  connection.release();

  if (reactions.length === 0) {
    throw new ResourceError('Reaction not found');
  }

  const messageId = reactions[0].message_id;
  const conversationId = reactions[0].conversation_id;

  // Remove reaction
  await chatService.removeReaction(id, req.user.id);

  // Broadcast reaction removal via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, conversationId, 'message:reaction:removed', {
      messageId,
      reactionId: id,
      userId: req.user.id
    }, req.user.id);
  }

  res.json({
    success: true,
    message: 'Reaction removed successfully'
  });
});

// ============================================================================
// PARTICIPANT ENDPOINTS
// ============================================================================

/**
 * POST /api/conversations/:id/participants
 * Add a participant to a conversation
 */
export const addParticipant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId, role } = req.body;

  console.log('[Chat API] Add participant:', { conversationId: id, targetUserId: userId, role });

  // Validate request body
  const validatedData = AddParticipantSchema.parse({
    conversationId: id,
    userId,
    role
  });

  // Add participant
  const participant = await chatService.addParticipant(
    validatedData.conversationId,
    req.user.id,
    validatedData.userId,
    validatedData.role
  );

  // Notify new participant via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.sendToUser(io, validatedData.userId, 'conversation:added', {
      conversationId: id,
      addedBy: {
        id: req.user.id,
        firstName: req.user.first_name,
        lastName: req.user.last_name
      },
      role: validatedData.role
    });

    // Notify existing participants
    socketHelpers.broadcastToConversation(io, id, 'conversation:participant:added', {
      conversationId: id,
      participant
    }, req.user.id);
  }

  res.status(201).json({
    success: true,
    data: participant
  });
});

/**
 * DELETE /api/conversations/:id/participants/:userId
 * Remove a participant from a conversation
 */
export const removeParticipant = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  console.log('[Chat API] Remove participant:', { conversationId: id, targetUserId: userId });

  // Remove participant
  await chatService.removeParticipant(id, req.user.id, parseInt(userId));

  // Notify removed participant via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.sendToUser(io, parseInt(userId), 'conversation:removed', {
      conversationId: id,
      removedBy: {
        id: req.user.id,
        firstName: req.user.first_name,
        lastName: req.user.last_name
      }
    });

    // Notify remaining participants
    socketHelpers.broadcastToConversation(io, id, 'conversation:participant:removed', {
      conversationId: id,
      userId: parseInt(userId),
      removedBy: req.user.id
    }, req.user.id);
  }

  res.json({
    success: true,
    message: 'Participant removed successfully'
  });
});

// ============================================================================
// READ RECEIPT ENDPOINT
// ============================================================================

/**
 * POST /api/conversations/:id/read
 * Mark messages as read
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { messageId } = req.body;

  console.log('[Chat API] Mark as read:', { conversationId: id, messageId, userId: req.user.id });

  // Validate request body
  const validatedData = MarkAsReadSchema.parse({
    conversationId: id,
    messageId
  });

  // Mark as read
  await chatService.markAsRead(validatedData.conversationId, req.user.id, validatedData.messageId);

  // Broadcast read receipt via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, id, 'message:read', {
      conversationId: id,
      userId: req.user.id,
      messageId: validatedData.messageId,
      readAt: new Date().toISOString()
    }, req.user.id);
  }

  res.json({
    success: true,
    message: 'Messages marked as read'
  });
});

// ============================================================================
// ERROR HANDLING FOR ZOD VALIDATION
// ============================================================================

/**
 * Middleware to handle Zod validation errors
 */
export function handleValidationError(err, req, res, next) {
  if (err instanceof z.ZodError) {
    const errors = err.errors.map(e => ({
      field: e.path.join('.'),
      message: e.message
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors
      }
    });
  }

  next(err);
}

// ============================================================================
// ROUTE DEFINITIONS
// ============================================================================

export default function registerChatRoutes(router) {
  // Apply authentication to all chat routes
  router.use('/api/conversations', authenticateToken);
  router.use('/api/messages', authenticateToken);
  router.use('/api/reactions', authenticateToken);

  // Conversation routes
  router.post('/api/conversations',
    rateLimit('chat-create', { useUserId: true }),
    createConversation
  );

  router.get('/api/conversations',
    rateLimit('chat-read', { useUserId: true }),
    getConversations
  );

  router.get('/api/conversations/:id',
    rateLimit('chat-read', { useUserId: true }),
    getConversationById
  );

  router.post('/api/conversations/:id/archive',
    rateLimit('chat-write', { useUserId: true }),
    archiveConversation
  );

  // Message routes
  router.get('/api/conversations/:id/messages',
    rateLimit('chat-read', { useUserId: true }),
    getMessages
  );

  router.post('/api/conversations/:id/messages',
    rateLimit('chat-message', { useUserId: true }),
    sendMessage
  );

  router.put('/api/messages/:id',
    rateLimit('chat-write', { useUserId: true }),
    editMessage
  );

  router.delete('/api/messages/:id',
    rateLimit('chat-write', { useUserId: true }),
    deleteMessage
  );

  // Reaction routes
  router.post('/api/messages/:id/reactions',
    rateLimit('chat-reaction', { useUserId: true }),
    addReaction
  );

  router.delete('/api/reactions/:id',
    rateLimit('chat-reaction', { useUserId: true }),
    removeReaction
  );

  // Participant routes
  router.post('/api/conversations/:id/participants',
    rateLimit('chat-write', { useUserId: true }),
    addParticipant
  );

  router.delete('/api/conversations/:id/participants/:userId',
    rateLimit('chat-write', { useUserId: true }),
    removeParticipant
  );

  // Read receipt route
  router.post('/api/conversations/:id/read',
    rateLimit('chat-read', { useUserId: true }),
    markAsRead
  );

  // Apply validation error handler
  router.use(handleValidationError);
}

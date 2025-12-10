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
// CRITICAL: Use middleware/auth.js authenticateToken, NOT routes/auth.js
// The middleware version populates req.session with profiles and activeProfileId
import { authenticateToken } from '../middleware/auth.js';
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

/**
 * Helper to get active profile ID from session
 * Returns the active profile ID or throws an appropriate error
 */
function getActiveProfileId(req) {
  // First check if session exists
  if (!req.session) {
    console.log('[Chat API] No session object on request');
    return null;
  }
  
  // Check for active profile ID
  const profileId = req.session.activeProfileId;
  
  if (!profileId) {
    console.log('[Chat API] No active profile ID in session:', {
      hasSession: !!req.session,
      profiles: req.session.profiles?.length || 0,
      accountId: req.session.accountId,
      user: req.user ? { id: req.user.id, email: req.user.email } : 'none'
    });
    
    // If there are profiles but no active one selected, use the first one
    if (req.session.profiles && req.session.profiles.length > 0) {
      const firstProfile = req.session.profiles[0];
      console.log('[Chat API] Using first available profile as fallback:', firstProfile.id);
      return firstProfile.id;
    }
    
    // No profiles at all - log warning
    console.warn('[Chat API] Account has no user profiles - user needs to complete onboarding');
  }
  
  return profileId;
}

// Helper to create appropriate error response for missing profile
function createNoProfileError(req) {
  const hasProfiles = req.session?.profiles?.length > 0;
  
  if (!hasProfiles) {
    return {
      success: false,
      error: {
        code: 'NO_USER_PROFILE',
        message: 'Your account has no user profiles. Please complete onboarding first.'
      }
    };
  }
  
  return {
    success: false,
    error: {
      code: 'NO_ACTIVE_PROFILE',
      message: 'Please select a profile'
    }
  };
}

// ============================================================================
// CONVERSATION ENDPOINTS
// ============================================================================

/**
 * POST /api/conversations
 * Create a new conversation
 */
export const createConversation = asyncHandler(async (req, res) => {
  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  // Conversations happen between user profiles, not accounts
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Create conversation request:', {
    profileId,
    accountId: req.user.id,
    type: req.body.type
  });

  // Validate request body
  const validatedData = CreateConversationSchema.parse(req.body);

  // Create conversation using profile ID
  const conversation = await chatService.createConversation(profileId, validatedData);

  // Notify participants via WebSocket (defensive: check participants exists)
  if (io && conversation.participants && Array.isArray(conversation.participants)) {
    for (const participant of conversation.participants) {
      if (participant.profileId !== profileId) {
        const socketHelpers = await import('../server/socket/chatSocket.js');
        socketHelpers.sendToUser(io, participant.profileId, 'conversation:created', {
          conversation: {
            id: conversation.id,
            type: conversation.type,
            name: conversation.name,
            createdBy: {
              profileId: profileId,
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Get conversations request:', {
    profileId,
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

  const result = await chatService.getConversations(profileId, filters);

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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Get conversation by ID:', { conversationId: id, profileId });

  const conversation = await chatService.getConversationById(id, profileId);

  res.json({
    success: true,
    data: conversation
  });
});

/**
 * GET /api/conversations/group/:postingId
 * Get group conversation for a specific posting
 */
export const getGroupConversationByPostingId = asyncHandler(async (req, res) => {
  const { postingId } = req.params;
  const profileId = getActiveProfileId(req);

  console.log('[Chat API] Get group conversation by posting ID:', { postingId, profileId });

  const conversation = await chatService.getGroupConversationByPostingId(postingId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'No group conversation found for this posting'
      }
    });
  }

  res.json({
    success: true,
    data: conversation
  });
});

/**
 * GET /api/conversations/direct/:postingId/:otherUserId
 * Get direct (1-on-1) conversation between current user and another user for a specific posting
 * Used to avoid creating duplicate conversations
 */
export const getDirectConversationByPostingAndUser = asyncHandler(async (req, res) => {
  const { postingId, otherUserId } = req.params;

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Get direct conversation by posting and user:', { postingId, profileId, otherUserId });

  const conversation = await chatService.getDirectConversationByPostingAndUsers(postingId, profileId, otherUserId);

  if (!conversation) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'No direct conversation found for this posting'
      }
    });
  }

  res.json({
    success: true,
    data: conversation
  });
});

/**
 * POST /api/conversations/:id/add-participant
 * Add current user to an existing conversation
 */
export const addCurrentUserToConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Add user to conversation:', { conversationId: id, profileId, targetUserId: userId || profileId });

  // Use provided userId (must be a profile ID) or current profile ID
  const targetUserId = userId || profileId;

  // Add participant (with MEMBER role by default)
  const participant = await chatService.addParticipant(
    id,
    profileId,     // Current profile making the request
    targetUserId,  // Profile to add
    'MEMBER'
  );

  // Notify via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    
    // Notify the added user
    socketHelpers.sendToUser(io, targetUserId, 'conversation:added', {
      conversationId: id,
      addedBy: {
        id: req.user.id,
        firstName: req.user.first_name,
        lastName: req.user.last_name
      }
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
 * POST /api/conversations/:id/archive
 * Archive a conversation
 */
export const archiveConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Archive conversation:', { conversationId: id, profileId });

  await chatService.archiveConversation(id, profileId);

  // Notify other participants via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.broadcastToConversation(io, id, 'conversation:archived', {
      conversationId: id,
      archivedBy: profileId,
      archivedAt: new Date().toISOString()
    }, profileId);
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Get messages:', { conversationId: id, profileId });

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
    profileId,
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Send message:', { conversationId: id, profileId });

  // Validate request body
  const validatedData = SendMessageSchema.parse({
    conversationId: id,
    ...req.body
  });

  // Send message using profile ID
  const message = await chatService.sendMessage(profileId, validatedData);

  // Broadcast message via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    console.log('[Chat API] Broadcasting message via WebSocket:', {
      conversationId: id,
      conversationIdType: typeof id,
      messageId: message.id,
      senderProfileId: profileId,
      io: !!io
    });
    
    // Log the exact room name that will be used
    const roomName = `conversation:${id}`;
    console.log('[Chat API] Broadcasting to room:', roomName);
    
    // CRITICAL: Pass account ID (req.user.id) to exclude sender from broadcast
    // Socket connections are tracked by account ID, not profile ID
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
    console.log('[Chat API] Message broadcast completed');
  } else {
    console.warn('[Chat API] Socket.IO not initialized, message not broadcast');
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Edit message:', { messageId: id, profileId });

  // Validate request body
  const validatedData = EditMessageSchema.parse({
    messageId: id,
    content
  });

  // Edit message using profile ID
  const message = await chatService.editMessage(validatedData.messageId, profileId, validatedData.content);

  // Broadcast edit via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    // CRITICAL: Pass account ID to exclude sender from broadcast
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Delete message:', { messageId: id, profileId });

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

  // Delete message using profile ID
  await chatService.deleteMessage(id, profileId);

  // Broadcast deletion via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    // CRITICAL: Pass account ID to exclude sender from broadcast
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Add reaction:', { messageId: id, profileId, emoji });

  // Validate request body
  const validatedData = AddReactionSchema.parse({
    messageId: id,
    emoji
  });

  // Add reaction using profile ID
  const reaction = await chatService.addReaction(validatedData.messageId, profileId, validatedData.emoji);

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
    // CRITICAL: Pass account ID to exclude sender from broadcast
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Remove reaction:', { reactionId: id, profileId });

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

  // Remove reaction using profile ID
  await chatService.removeReaction(id, profileId);

  // Broadcast reaction removal via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    // CRITICAL: Pass account ID to exclude sender from broadcast
    socketHelpers.broadcastToConversation(io, conversationId, 'message:reaction:removed', {
      messageId,
      reactionId: id,
      profileId
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Add participant:', { conversationId: id, targetProfileId: userId, role, byProfileId: profileId });

  // Validate request body - userId must be a profile ID
  const validatedData = AddParticipantSchema.parse({
    conversationId: id,
    userId,
    role
  });

  // Add participant using profile ID
  const participant = await chatService.addParticipant(
    validatedData.conversationId,
    profileId,           // Current profile making the request
    validatedData.userId, // Target profile ID to add
    validatedData.role
  );

  // Notify new participant via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.sendToUser(io, validatedData.userId, 'conversation:added', {
      conversationId: id,
      addedBy: {
        profileId: profileId,
        firstName: req.user.first_name,
        lastName: req.user.last_name
      },
      role: validatedData.role
    });

    // Notify existing participants
    socketHelpers.broadcastToConversation(io, id, 'conversation:participant:added', {
      conversationId: id,
      participant
    }, profileId);
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Remove participant:', { conversationId: id, targetProfileId: userId, byProfileId: profileId });

  // Remove participant (userId is profile ID)
  await chatService.removeParticipant(id, profileId, userId);

  // Notify removed participant via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    socketHelpers.sendToUser(io, userId, 'conversation:removed', {
      conversationId: id,
      removedBy: {
        profileId: profileId,
        firstName: req.user.first_name,
        lastName: req.user.last_name
      }
    });

    // Notify remaining participants
    socketHelpers.broadcastToConversation(io, id, 'conversation:participant:removed', {
      conversationId: id,
      profileId: userId,
      removedBy: profileId
    }, profileId);
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

  // CRITICAL: Use activeProfileId (user profile) not user.id (account)
  const profileId = getActiveProfileId(req);
  
  if (!profileId) {
    return res.status(403).json(createNoProfileError(req));
  }

  console.log('[Chat API] Mark as read:', { conversationId: id, messageId, profileId });

  // Validate request body
  const validatedData = MarkAsReadSchema.parse({
    conversationId: id,
    messageId
  });

  // Mark as read using profile ID
  await chatService.markAsRead(validatedData.conversationId, profileId, validatedData.messageId);

  // Broadcast read receipt via WebSocket
  if (io) {
    const socketHelpers = await import('../server/socket/chatSocket.js');
    // CRITICAL: Pass account ID to exclude sender from broadcast
    socketHelpers.broadcastToConversation(io, id, 'message:read', {
      conversationId: id,
      profileId: profileId,
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

  router.get('/api/conversations/group/:postingId',
    rateLimit('chat-read', { useUserId: true }),
    getGroupConversationByPostingId
  );

  router.get('/api/conversations/direct/:postingId/:otherUserId',
    rateLimit('chat-read', { useUserId: true }),
    getDirectConversationByPostingAndUser
  );

  router.get('/api/conversations/:id',
    rateLimit('chat-read', { useUserId: true }),
    getConversationById
  );

  router.post('/api/conversations/:id/add-participant',
    rateLimit('chat-write', { useUserId: true }),
    addCurrentUserToConversation
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

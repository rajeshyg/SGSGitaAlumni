/**
 * Chat Service
 * Task 7.10: Chat & Messaging System
 *
 * Handles business logic for chat conversations and messages:
 * - Conversation management (create, list, archive)
 * - Message operations (send, edit, delete)
 * - Participant management (add, remove)
 * - Reactions and read receipts
 *
 * Created: November 8, 2025
 */

import { getPool } from '../../utils/database.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create a new conversation
 *
 * @param {number} userId - User creating the conversation
 * @param {object} data - Conversation data
 * @param {string} data.type - Conversation type (DIRECT, GROUP, POST_LINKED)
 * @param {string} [data.name] - Conversation name (required for GROUP)
 * @param {string} [data.postingId] - Posting ID (required for POST_LINKED)
 * @param {number[]} data.participantIds - Array of user IDs to add as participants
 * @param {string} [data.initialMessage] - Optional initial message to send
 * @returns {Promise<object>} Created conversation
 */
async function createConversation(userId, data) {
  const { type, name, postingId, participantIds, initialMessage } = data;

  // Validate data based on type
  if (type === 'GROUP' && !name) {
    throw new Error('Group conversations must have a name');
  }
  if (type === 'POST_LINKED' && !postingId) {
    throw new Error('Post-linked conversations must have a postingId');
  }

  // Ensure creator is in participants
  const allParticipantIds = [...new Set([userId, ...participantIds])];

  const connection = await getPool().getConnection();

  try {
    // Check if a conversation with the same posting_id and type already exists (and is active)
    if (postingId) {
      const [existing] = await connection.execute(
        `SELECT c.* FROM CONVERSATIONS c
         WHERE c.posting_id = ? AND c.type = ? AND c.is_archived = FALSE`,
        [postingId, type]
      );

      if (existing.length > 0) {
        // For DIRECT conversations, check if the same participants are involved
        if (type === 'DIRECT') {
          const existingConvId = existing[0].id;
          const [participants] = await connection.execute(
            `SELECT user_id FROM CONVERSATION_PARTICIPANTS
             WHERE conversation_id = ? AND left_at IS NULL
             ORDER BY user_id`,
            [existingConvId]
          );

          const existingParticipantIds = participants.map(p => p.user_id).sort();
          const newParticipantIds = [...allParticipantIds].sort();

          // If same participants, return existing conversation
          if (JSON.stringify(existingParticipantIds) === JSON.stringify(newParticipantIds)) {
            // Fetch and return existing conversation
            return await getConversationById(existingConvId, userId);
          }
        } else if (type === 'GROUP') {
          // For GROUP conversations, prevent duplicates - return existing
          return await getConversationById(existing[0].id, userId);
        }
      }
    }

    // Validate all participants exist before starting transaction
    // MIGRATED: app_users → accounts
    if (allParticipantIds.length > 0) {
      const placeholders = allParticipantIds.map(() => '?').join(',');
      const [users] = await connection.execute(
        `SELECT id FROM accounts WHERE id IN (${placeholders}) AND status = 'active'`,
        allParticipantIds
      );

      if (users.length !== allParticipantIds.length) {
        const foundIds = users.map(u => u.id);
        const missingIds = allParticipantIds.filter(id => !foundIds.includes(id));
        throw new Error(`Invalid participant IDs: ${missingIds.join(', ')}. Users must exist and be active.`);
      }
    }

    await connection.beginTransaction();

    const conversationId = uuidv4();

    // Insert conversation
    await connection.execute(
      `INSERT INTO CONVERSATIONS (id, type, name, posting_id, created_by, created_at, last_message_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [conversationId, type, name || null, postingId || null, userId]
    );

    // Add participants
    for (const participantId of allParticipantIds) {
      const participantUuid = uuidv4();
      const role = participantId === userId ? 'ADMIN' : 'MEMBER';

      await connection.execute(
        `INSERT INTO CONVERSATION_PARTICIPANTS (id, conversation_id, user_id, role, joined_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [participantUuid, conversationId, participantId, role]
      );
    }

    await connection.commit();

    // Fetch and return created conversation with participants
    // MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [conversations] = await connection.execute(
      `SELECT
        c.*,
        am.first_name as creator_first_name,
        am.last_name as creator_last_name,
        a.email as creator_email,
        p.title as posting_title
       FROM CONVERSATIONS c
       LEFT JOIN accounts a ON c.created_by = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       LEFT JOIN POSTINGS p ON c.posting_id = p.id
       WHERE c.id = ?`,
      [conversationId]
    );

    const conversation = conversations[0];

    if (!conversation) {
      throw new Error(`Failed to fetch created conversation with ID ${conversationId}`);
    }

    // Get participants - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [participants] = await connection.execute(
      `SELECT
        cp.id as participant_id,
        cp.role,
        cp.joined_at,
        cp.last_read_at,
        cp.is_muted,
        a.id as user_id,
        am.first_name,
        am.last_name,
        a.email
       FROM CONVERSATION_PARTICIPANTS cp
       JOIN accounts a ON cp.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE cp.conversation_id = ? AND cp.left_at IS NULL`,
      [conversationId]
    );

    if (!participants || !Array.isArray(participants)) {
      throw new Error(`Failed to fetch participants for conversation ${conversationId}. Participants: ${JSON.stringify(participants)}`);
    }

    // Send initial message if provided
    if (initialMessage) {
      const messageId = uuidv4();
      await connection.execute(
        `INSERT INTO MESSAGES (id, conversation_id, sender_id, content, message_type, created_at)
         VALUES (?, ?, ?, ?, 'TEXT', NOW())`,
        [messageId, conversationId, userId, initialMessage]
      );

      // Update last_message_at on conversation
      await connection.execute(
        `UPDATE CONVERSATIONS SET last_message_at = NOW() WHERE id = ?`,
        [conversationId]
      );
    }

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      postingId: conversation.posting_id,
      postingTitle: conversation.posting_title,  // Include posting title
      createdBy: {
        id: conversation.created_by,
        firstName: conversation.creator_first_name,
        lastName: conversation.creator_last_name,
        email: conversation.creator_email
      },
      participants: participants.map(p => ({
        participantId: p.participant_id,
        userId: p.user_id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        role: p.role,
        joinedAt: p.joined_at,
        lastReadAt: p.last_read_at,
        isMuted: Boolean(p.is_muted)
      })),
      createdAt: conversation.created_at,
      lastMessageAt: conversation.last_message_at,
      isArchived: Boolean(conversation.is_archived)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get user's conversations with pagination
 *
 * @param {number} userId - User ID
 * @param {object} filters - Filter options
 * @param {string} [filters.type] - Filter by conversation type
 * @param {boolean} [filters.includeArchived] - Include archived conversations
 * @param {number} [filters.page] - Page number
 * @param {number} [filters.limit] - Page size
 * @returns {Promise<object>} Conversations with pagination
 */
async function getConversations(userId, filters = {}) {
  const { type, includeArchived = false, page = 1, limit = 20 } = filters;

  const connection = await getPool().getConnection();

  try {
    // === COUNT QUERY ===
    // Build count query - separate from conversation query to avoid parameter conflicts
    let countSQL = `SELECT COUNT(DISTINCT c.id) as total
       FROM CONVERSATIONS c
       INNER JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id
       WHERE cp.user_id = ? AND cp.left_at IS NULL`;

    const countParams = [userId];

    if (type) {
      countSQL += ' AND c.type = ?';
      countParams.push(type);
    }

    if (!includeArchived) {
      countSQL += ' AND c.is_archived = FALSE';
    }

    const [countResult] = await connection.execute(countSQL, countParams);
    const total = countResult[0]?.total || 0;
    const offset = (page - 1) * limit;

    // === CONVERSATIONS QUERY ===
    // Build separate parameter array for conversations query to avoid confusion
    // MIGRATED: app_users → accounts + user_profiles + alumni_members
    let conversationSQL = `SELECT
        c.*,
        am.first_name as creator_first_name,
        am.last_name as creator_last_name,
        p.title as posting_title,
        0 as unread_count
       FROM CONVERSATIONS c
       INNER JOIN CONVERSATION_PARTICIPANTS cp ON c.id = cp.conversation_id
       LEFT JOIN accounts a ON c.created_by = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       LEFT JOIN POSTINGS p ON c.posting_id = p.id
       WHERE cp.user_id = ? AND cp.left_at IS NULL`;

    const conversationParams = [userId];

    if (type) {
      conversationSQL += ' AND c.type = ?';
      conversationParams.push(type);
    }

    if (!includeArchived) {
      conversationSQL += ' AND c.is_archived = FALSE';
    }

    conversationSQL += ' ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?';
    conversationParams.push(parseInt(limit), parseInt(offset));

    const [conversations] = await connection.execute(conversationSQL, conversationParams);

    // Get last message for each conversation
    const result = [];
    for (const conv of conversations) {
      // MIGRATED: app_users → accounts + user_profiles + alumni_members
      const [lastMessage] = await connection.execute(
        `SELECT
          m.id,
          m.content,
          m.message_type,
          m.created_at,
          m.edited_at,
          am.first_name as sender_first_name,
          am.last_name as sender_last_name
         FROM MESSAGES m
         JOIN accounts a ON m.sender_id = a.id
         LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
         LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
         WHERE m.conversation_id = ? AND m.deleted_at IS NULL
         ORDER BY m.created_at DESC
         LIMIT 1`,
        [conv.id]
      );

      // Get participants with details (excluding current user)
      // For DIRECT chats: Returns the other participant (1 person)
      // For GROUP chats: Returns other participants (for display names)
      // Note: Frontend only displays first 3 names, but we return all for flexibility
      // MIGRATED: app_users → accounts + user_profiles + alumni_members
      const [participants] = await connection.execute(
        `SELECT
          cp.user_id,
          cp.role,
          am.first_name,
          am.last_name,
          am.profile_image_url
         FROM CONVERSATION_PARTICIPANTS cp
         JOIN accounts a ON cp.user_id = a.id
         LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
         LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
         WHERE cp.conversation_id = ? AND cp.left_at IS NULL AND cp.user_id != ?
         ORDER BY cp.joined_at ASC`,
        [conv.id, userId]
      );

      result.push({
        id: conv.id,
        type: conv.type,
        name: conv.name,
        postingId: conv.posting_id,
        postingTitle: conv.posting_title,  // Include posting title for POST_LINKED conversations
        createdBy: {
          id: conv.created_by,
          firstName: conv.creator_first_name,
          lastName: conv.creator_last_name
        },
        participants: participants.map(p => ({
          userId: p.user_id,
          displayName: `${p.first_name} ${p.last_name}`.trim(),
          firstName: p.first_name,
          lastName: p.last_name,
          profileImageUrl: p.profile_image_url,
          role: p.role
        })),
        participantCount: participants.length + 1, // +1 for current user
        lastMessage: lastMessage[0] ? {
          id: lastMessage[0].id,
          content: lastMessage[0].content,
          messageType: lastMessage[0].message_type,
          senderName: `${lastMessage[0].sender_first_name} ${lastMessage[0].sender_last_name}`,
          createdAt: lastMessage[0].created_at,
          editedAt: lastMessage[0].edited_at
        } : null,
        unreadCount: conv.unread_count,
        createdAt: conv.created_at,
        lastMessageAt: conv.last_message_at,
        isArchived: Boolean(conv.is_archived)
      });
    }

    return {
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('[Chat Service] Error in getConversations:', error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get conversation by ID with permission check
 *
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User ID requesting access
 * @returns {Promise<object>} Conversation details
 */
async function getConversationById(conversationId, userId) {
  const connection = await getPool().getConnection();

  try {
    // Check if user is a participant
    const [participation] = await connection.execute(
      `SELECT id FROM CONVERSATION_PARTICIPANTS
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participation.length === 0) {
      throw new Error('You do not have access to this conversation');
    }

    // Get conversation details - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [conversations] = await connection.execute(
      `SELECT
        c.*,
        am.first_name as creator_first_name,
        am.last_name as creator_last_name,
        a.email as creator_email
       FROM CONVERSATIONS c
       LEFT JOIN accounts a ON c.created_by = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE c.id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) {
      throw new Error('Conversation not found');
    }

    const conversation = conversations[0];

    // Get participants - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [participants] = await connection.execute(
      `SELECT
        cp.id as participant_id,
        cp.role,
        cp.joined_at,
        cp.last_read_at,
        cp.is_muted,
        a.id as user_id,
        am.first_name,
        am.last_name,
        a.email
       FROM CONVERSATION_PARTICIPANTS cp
       JOIN accounts a ON cp.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE cp.conversation_id = ? AND cp.left_at IS NULL`,
      [conversationId]
    );

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      postingId: conversation.posting_id,
      createdBy: {
        id: conversation.created_by,
        firstName: conversation.creator_first_name,
        lastName: conversation.creator_last_name,
        email: conversation.creator_email
      },
      participants: participants.map(p => ({
        participantId: p.participant_id,
        userId: p.user_id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        role: p.role,
        joinedAt: p.joined_at,
        lastReadAt: p.last_read_at,
        isMuted: Boolean(p.is_muted)
      })),
      createdAt: conversation.created_at,
      lastMessageAt: conversation.last_message_at,
      isArchived: Boolean(conversation.is_archived),
      archivedAt: conversation.archived_at
    };
  } finally {
    connection.release();
  }
}

/**
 * Send a message in a conversation
 *
 * @param {number} userId - User sending the message
 * @param {object} data - Message data
 * @param {string} data.conversationId - Conversation ID
 * @param {string} data.content - Message content
 * @param {string} [data.messageType] - Message type (TEXT, IMAGE, FILE, LINK, SYSTEM)
 * @param {string} [data.mediaUrl] - Media URL if applicable
 * @param {object} [data.mediaMetadata] - Media metadata
 * @param {string} [data.replyToId] - ID of message being replied to
 * @returns {Promise<object>} Created message
 */
async function sendMessage(userId, data) {
  const { conversationId, content, messageType = 'TEXT', mediaUrl, mediaMetadata, replyToId } = data;

  const connection = await getPool().getConnection();

  try {
    // Check if user is a participant
    const [participation] = await connection.execute(
      `SELECT id FROM CONVERSATION_PARTICIPANTS
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participation.length === 0) {
      throw new Error('You are not a participant in this conversation');
    }

    await connection.beginTransaction();

    const messageId = uuidv4();

    // Insert message
    await connection.execute(
      `INSERT INTO MESSAGES
        (id, conversation_id, sender_id, content, message_type, media_url, media_metadata, reply_to_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        messageId,
        conversationId,
        userId,
        content,
        messageType,
        mediaUrl || null,
        mediaMetadata ? JSON.stringify(mediaMetadata) : null,
        replyToId || null
      ]
    );

    // Update conversation last_message_at
    await connection.execute(
      `UPDATE CONVERSATIONS SET last_message_at = NOW() WHERE id = ?`,
      [conversationId]
    );

    await connection.commit();

    // Fetch created message with sender info - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [messages] = await connection.execute(
      `SELECT
        m.*,
        am.first_name as sender_first_name,
        am.last_name as sender_last_name,
        a.email as sender_email
       FROM MESSAGES m
       JOIN accounts a ON m.sender_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE m.id = ?`,
      [messageId]
    );

    const message = messages[0];

    return {
      id: message.id,
      conversationId: message.conversation_id,
      sender: {
        id: message.sender_id,
        firstName: message.sender_first_name,
        lastName: message.sender_last_name,
        email: message.sender_email
      },
      content: message.content,
      messageType: message.message_type,
      mediaUrl: message.media_url,
      mediaMetadata: message.media_metadata ? JSON.parse(message.media_metadata) : null,
      replyToId: message.reply_to_id,
      createdAt: message.created_at,
      editedAt: message.edited_at,
      deletedAt: message.deleted_at
    };
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Get messages for a conversation with pagination
 *
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User requesting messages
 * @param {object} pagination - Pagination options
 * @param {number} [pagination.page] - Page number
 * @param {number} [pagination.limit] - Page size
 * @param {string} [pagination.before] - Get messages before this timestamp
 * @param {string} [pagination.after] - Get messages after this timestamp
 * @returns {Promise<object>} Messages with pagination
 */
async function getMessages(conversationId, userId, pagination = {}) {
  const { page = 1, limit = 50, before, after } = pagination;

  const connection = await getPool().getConnection();

  try {
    // Check if user is a participant
    const [participation] = await connection.execute(
      `SELECT id FROM CONVERSATION_PARTICIPANTS
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participation.length === 0) {
      throw new Error('You are not a participant in this conversation');
    }

    // Build WHERE clause
    const whereClauses = ['m.conversation_id = ?', 'm.deleted_at IS NULL'];
    const queryParams = [conversationId];

    if (before) {
      whereClauses.push('m.created_at < ?');
      queryParams.push(before);
    }

    if (after) {
      whereClauses.push('m.created_at > ?');
      queryParams.push(after);
    }

    const whereClause = whereClauses.join(' AND ');

    // Get total count
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM MESSAGES m WHERE ${whereClause}`,
      queryParams
    );

    const total = countResult[0].total;
    const offset = (page - 1) * limit;

    // Get messages - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [messages] = await connection.execute(
      `SELECT
        m.*,
        am.first_name as sender_first_name,
        am.last_name as sender_last_name,
        a.email as sender_email
       FROM MESSAGES m
       JOIN accounts a ON m.sender_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE ${whereClause}
       ORDER BY m.created_at DESC
       LIMIT ? OFFSET ?`,
      [...queryParams, parseInt(limit), parseInt(offset)]
    );

    // Get reactions for each message - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const result = [];
    for (const msg of messages) {
      const [reactions] = await connection.execute(
        `SELECT
          mr.id,
          mr.emoji,
          mr.created_at,
          a.id as user_id,
          am.first_name,
          am.last_name
         FROM MESSAGE_REACTIONS mr
         JOIN accounts a ON mr.user_id = a.id
         LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
         LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
         WHERE mr.message_id = ?`,
        [msg.id]
      );

      result.push({
        id: msg.id,
        conversationId: msg.conversation_id,
        sender: {
          id: msg.sender_id,
          firstName: msg.sender_first_name,
          lastName: msg.sender_last_name,
          email: msg.sender_email
        },
        content: msg.content,
        messageType: msg.message_type,
        mediaUrl: msg.media_url,
        mediaMetadata: msg.media_metadata ? JSON.parse(msg.media_metadata) : null,
        replyToId: msg.reply_to_id,
        reactions: reactions.map(r => ({
          id: r.id,
          emoji: r.emoji,
          userId: r.user_id,
          userFirstName: r.first_name,
          userLastName: r.last_name,
          createdAt: r.created_at
        })),
        createdAt: msg.created_at,
        editedAt: msg.edited_at
      });
    }

    return {
      data: result,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  } finally {
    connection.release();
  }
}

/**
 * Edit a message
 *
 * @param {string} messageId - Message ID
 * @param {number} userId - User editing the message
 * @param {string} content - New message content
 * @returns {Promise<object>} Updated message
 */
async function editMessage(messageId, userId, content) {
  const connection = await getPool().getConnection();

  try {
    // Check if user is the sender
    const [messages] = await connection.execute(
      `SELECT conversation_id, sender_id FROM MESSAGES WHERE id = ? AND deleted_at IS NULL`,
      [messageId]
    );

    if (messages.length === 0) {
      throw new Error('Message not found');
    }

    if (messages[0].sender_id !== userId) {
      throw new Error('You can only edit your own messages');
    }

    // Update message
    await connection.execute(
      `UPDATE MESSAGES SET content = ?, edited_at = NOW() WHERE id = ?`,
      [content, messageId]
    );

    // Fetch updated message - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [updatedMessages] = await connection.execute(
      `SELECT
        m.*,
        am.first_name as sender_first_name,
        am.last_name as sender_last_name,
        a.email as sender_email
       FROM MESSAGES m
       JOIN accounts a ON m.sender_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE m.id = ?`,
      [messageId]
    );

    const message = updatedMessages[0];

    return {
      id: message.id,
      conversationId: message.conversation_id,
      sender: {
        id: message.sender_id,
        firstName: message.sender_first_name,
        lastName: message.sender_last_name,
        email: message.sender_email
      },
      content: message.content,
      messageType: message.message_type,
      createdAt: message.created_at,
      editedAt: message.edited_at
    };
  } finally {
    connection.release();
  }
}

/**
 * Delete a message (soft delete)
 *
 * @param {string} messageId - Message ID
 * @param {number} userId - User deleting the message
 * @returns {Promise<void>}
 */
async function deleteMessage(messageId, userId) {
  const connection = await getPool().getConnection();

  try {
    // Check if user is the sender or admin
    const [messages] = await connection.execute(
      `SELECT m.sender_id, cp.role
       FROM MESSAGES m
       JOIN CONVERSATION_PARTICIPANTS cp ON m.conversation_id = cp.conversation_id
       WHERE m.id = ? AND cp.user_id = ? AND m.deleted_at IS NULL`,
      [messageId, userId]
    );

    if (messages.length === 0) {
      throw new Error('Message not found');
    }

    const message = messages[0];

    if (message.sender_id !== userId && message.role !== 'ADMIN') {
      throw new Error('You can only delete your own messages or be an admin');
    }

    // Soft delete message
    await connection.execute(
      `UPDATE MESSAGES SET deleted_at = NOW() WHERE id = ?`,
      [messageId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Add a reaction to a message
 *
 * @param {string} messageId - Message ID
 * @param {number} userId - User adding the reaction
 * @param {string} emoji - Emoji to add
 * @returns {Promise<object>} Created reaction
 */
async function addReaction(messageId, userId, emoji) {
  const connection = await getPool().getConnection();

  try {
    // Check if message exists and user is in conversation
    const [messages] = await connection.execute(
      `SELECT m.conversation_id
       FROM MESSAGES m
       JOIN CONVERSATION_PARTICIPANTS cp ON m.conversation_id = cp.conversation_id
       WHERE m.id = ? AND cp.user_id = ? AND m.deleted_at IS NULL AND cp.left_at IS NULL`,
      [messageId, userId]
    );

    if (messages.length === 0) {
      throw new Error('Message not found or you do not have access');
    }

    const reactionId = uuidv4();

    // Insert reaction (will fail if duplicate due to unique constraint)
    await connection.execute(
      `INSERT INTO MESSAGE_REACTIONS (id, message_id, user_id, emoji, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [reactionId, messageId, userId, emoji]
    );

    // Fetch created reaction - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [reactions] = await connection.execute(
      `SELECT
        mr.id,
        mr.emoji,
        mr.created_at,
        a.id as user_id,
        am.first_name,
        am.last_name
       FROM MESSAGE_REACTIONS mr
       JOIN accounts a ON mr.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE mr.id = ?`,
      [reactionId]
    );

    const reaction = reactions[0];

    return {
      id: reaction.id,
      messageId,
      emoji: reaction.emoji,
      user: {
        id: reaction.user_id,
        firstName: reaction.first_name,
        lastName: reaction.last_name
      },
      createdAt: reaction.created_at
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('You have already reacted with this emoji');
    }
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Remove a reaction from a message
 *
 * @param {string} reactionId - Reaction ID
 * @param {number} userId - User removing the reaction
 * @returns {Promise<void>}
 */
async function removeReaction(reactionId, userId) {
  const connection = await getPool().getConnection();

  try {
    // Check if user owns the reaction
    const [reactions] = await connection.execute(
      `SELECT id FROM MESSAGE_REACTIONS WHERE id = ? AND user_id = ?`,
      [reactionId, userId]
    );

    if (reactions.length === 0) {
      throw new Error('Reaction not found or you do not own this reaction');
    }

    // Delete reaction
    await connection.execute(
      `DELETE FROM MESSAGE_REACTIONS WHERE id = ?`,
      [reactionId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Add a participant to a conversation
 *
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User adding the participant (must be admin)
 * @param {number} targetUserId - User ID to add
 * @param {string} [role] - Role for new participant (ADMIN or MEMBER)
 * @returns {Promise<object>} Created participant
 */
async function addParticipant(conversationId, userId, targetUserId, role = 'MEMBER') {
  const connection = await getPool().getConnection();

  try {
    // Check if target user is already a participant - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [existing] = await connection.execute(
      `SELECT 
        cp.id as participant_id,
        cp.role,
        cp.joined_at,
        a.id as user_id,
        am.first_name,
        am.last_name,
        a.email
       FROM CONVERSATION_PARTICIPANTS cp
       JOIN accounts a ON cp.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE cp.conversation_id = ? AND cp.user_id = ? AND cp.left_at IS NULL`,
      [conversationId, targetUserId]
    );

    if (existing.length > 0) {
      // User is already a participant, return the existing participant
      const participant = existing[0];
      return {
        participantId: participant.participant_id,
        userId: participant.user_id,
        firstName: participant.first_name,
        lastName: participant.last_name,
        email: participant.email,
        role: participant.role,
        joinedAt: participant.joined_at
      };
    }

    // Get conversation details to check type
    const [conversations] = await connection.execute(
      `SELECT type FROM CONVERSATIONS WHERE id = ?`,
      [conversationId]
    );

    if (conversations.length === 0) {
      throw new Error('Conversation not found');
    }

    const conversationType = conversations[0].type;

    // For GROUP conversations, allow self-join (user adding themselves)
    // For other types, check if user is an admin
    if (userId !== targetUserId) {
      // Someone trying to add another user - must be admin
      const [participation] = await connection.execute(
        `SELECT role FROM CONVERSATION_PARTICIPANTS
         WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
        [conversationId, userId]
      );

      if (participation.length === 0 || participation[0].role !== 'ADMIN') {
        throw new Error('Only admins can add other participants');
      }
    } else if (conversationType !== 'GROUP') {
      // Self-join is only allowed for GROUP conversations
      throw new Error('Cannot join this type of conversation');
    }

    const participantId = uuidv4();

    // Add participant
    await connection.execute(
      `INSERT INTO CONVERSATION_PARTICIPANTS (id, conversation_id, user_id, role, joined_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [participantId, conversationId, targetUserId, role]
    );

    // Fetch created participant - MIGRATED: app_users → accounts + user_profiles + alumni_members
    const [participants] = await connection.execute(
      `SELECT
        cp.id as participant_id,
        cp.role,
        cp.joined_at,
        a.id as user_id,
        am.first_name,
        am.last_name,
        a.email
       FROM CONVERSATION_PARTICIPANTS cp
       JOIN accounts a ON cp.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE cp.id = ?`,
      [participantId]
    );

    const participant = participants[0];

    return {
      participantId: participant.participant_id,
      userId: participant.user_id,
      firstName: participant.first_name,
      lastName: participant.last_name,
      email: participant.email,
      role: participant.role,
      joinedAt: participant.joined_at
    };
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Remove a participant from a conversation
 *
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User removing the participant (must be admin)
 * @param {number} targetUserId - User ID to remove
 * @returns {Promise<void>}
 */
async function removeParticipant(conversationId, userId, targetUserId) {
  const connection = await getPool().getConnection();

  try {
    // Check if user is an admin of the conversation
    const [participation] = await connection.execute(
      `SELECT role FROM CONVERSATION_PARTICIPANTS
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participation.length === 0 || participation[0].role !== 'ADMIN') {
      throw new Error('Only admins can remove participants');
    }

    // Mark participant as left (don't delete for history)
    await connection.execute(
      `UPDATE CONVERSATION_PARTICIPANTS SET left_at = NOW()
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, targetUserId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Mark messages as read
 *
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User marking as read
 * @param {string} [messageId] - Specific message ID (if null, marks all as read)
 * @returns {Promise<void>}
 */
async function markAsRead(conversationId, userId, messageId = null) {
  const connection = await getPool().getConnection();

  try {
    // Check if user is a participant
    const [participation] = await connection.execute(
      `SELECT id FROM CONVERSATION_PARTICIPANTS
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participation.length === 0) {
      throw new Error('You are not a participant in this conversation');
    }

    if (messageId) {
      // Mark specific message as read
      const receiptId = uuidv4();

      try {
        await connection.execute(
          `INSERT INTO MESSAGE_READ_RECEIPTS (id, message_id, user_id, read_at)
           VALUES (?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE read_at = NOW()`,
          [receiptId, messageId, userId]
        );
      } catch (error) {
        // Ignore duplicate key errors
        if (error.code !== 'ER_DUP_ENTRY') {
          throw error;
        }
      }
    }

    // Update last_read_at in conversation_participants
    await connection.execute(
      `UPDATE CONVERSATION_PARTICIPANTS SET last_read_at = NOW()
       WHERE conversation_id = ? AND user_id = ?`,
      [conversationId, userId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Archive a conversation
 *
 * @param {string} conversationId - Conversation ID
 * @param {number} userId - User archiving (must be admin)
 * @returns {Promise<void>}
 */
async function archiveConversation(conversationId, userId) {
  const connection = await getPool().getConnection();

  try {
    // Check if user is an admin of the conversation
    const [participation] = await connection.execute(
      `SELECT role FROM CONVERSATION_PARTICIPANTS
       WHERE conversation_id = ? AND user_id = ? AND left_at IS NULL`,
      [conversationId, userId]
    );

    if (participation.length === 0 || participation[0].role !== 'ADMIN') {
      throw new Error('Only admins can archive conversations');
    }

    // Archive conversation
    await connection.execute(
      `UPDATE CONVERSATIONS SET is_archived = TRUE, archived_at = NOW()
       WHERE id = ?`,
      [conversationId]
    );
  } finally {
    connection.release();
  }
}

/**
 * Get group conversation for a specific posting
 *
 * @param {string} postingId - Posting ID
 * @returns {Promise<object|null>} Group conversation or null if not found
 */
async function getGroupConversationByPostingId(postingId) {
  const connection = await getPool().getConnection();

  try {
    // Find existing GROUP conversation for this posting
    const [conversations] = await connection.execute(
      `SELECT
        c.*,
        p.title as posting_title
       FROM CONVERSATIONS c
       LEFT JOIN POSTINGS p ON c.posting_id = p.id
       WHERE c.posting_id = ? AND c.type = 'GROUP' AND c.is_archived = FALSE
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [postingId]
    );

    if (conversations.length === 0) {
      return null;
    }

    const conversation = conversations[0];

    // Get participants - MIGRATED: app_users → accounts + user_profiles + alumni_members (getGroupConversationByPostingId)
    const [participants] = await connection.execute(
      `SELECT
        cp.id as participant_id,
        cp.role,
        cp.joined_at,
        cp.last_read_at,
        cp.is_muted,
        a.id as user_id,
        am.first_name,
        am.last_name,
        a.email
       FROM CONVERSATION_PARTICIPANTS cp
       JOIN accounts a ON cp.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE cp.conversation_id = ? AND cp.left_at IS NULL`,
      [conversation.id]
    );

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      postingId: conversation.posting_id,
      postingTitle: conversation.posting_title,
      participants: participants.map(p => ({
        participantId: p.participant_id,
        userId: p.user_id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        role: p.role,
        joinedAt: p.joined_at,
        lastReadAt: p.last_read_at,
        isMuted: Boolean(p.is_muted)
      })),
      createdAt: conversation.created_at,
      lastMessageAt: conversation.last_message_at,
      isArchived: Boolean(conversation.is_archived)
    };
  } finally {
    connection.release();
  }
}

/**
 * Get direct conversation between two users for a specific posting
 * Used to avoid creating duplicate 1-on-1 conversations
 * 
 * @param {string} postingId - Posting ID
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {Promise<Object|null>} Conversation object or null if not found
 */
async function getDirectConversationByPostingAndUsers(postingId, userId1, userId2) {
  const connection = await getPool().getConnection();

  try {
    // Find existing DIRECT conversation between these two users for this posting
    // Ensure it's a 1-on-1 by checking participant count = 2
    const [conversations] = await connection.execute(
      `SELECT DISTINCT c.*
       FROM CONVERSATIONS c
       WHERE c.posting_id = ? AND c.type = 'DIRECT' AND c.is_archived = FALSE
         AND c.id IN (
           SELECT cp1.conversation_id
           FROM CONVERSATION_PARTICIPANTS cp1
           WHERE cp1.user_id = ? AND cp1.left_at IS NULL
         )
         AND c.id IN (
           SELECT cp2.conversation_id
           FROM CONVERSATION_PARTICIPANTS cp2
           WHERE cp2.user_id = ? AND cp2.left_at IS NULL
         )
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [postingId, userId1, userId2]
    );

    if (conversations.length === 0) {
      return null;
    }

    const conversation = conversations[0];

    // Get participants - MIGRATED: app_users → accounts + user_profiles + alumni_members (getDirectConversationByPostingId)
    const [participants] = await connection.execute(
      `SELECT
        cp.id as participant_id,
        cp.role,
        cp.joined_at,
        cp.last_read_at,
        cp.is_muted,
        a.id as user_id,
        am.first_name,
        am.last_name,
        a.email
       FROM CONVERSATION_PARTICIPANTS cp
       JOIN accounts a ON cp.user_id = a.id
       LEFT JOIN user_profiles up ON up.account_id = a.id AND up.relationship = 'parent'
       LEFT JOIN alumni_members am ON up.alumni_member_id = am.id
       WHERE cp.conversation_id = ? AND cp.left_at IS NULL`,
      [conversation.id]
    );

    return {
      id: conversation.id,
      type: conversation.type,
      name: conversation.name,
      postingId: conversation.posting_id,
      participants: participants.map(p => ({
        participantId: p.participant_id,
        userId: p.user_id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        role: p.role,
        joinedAt: p.joined_at,
        lastReadAt: p.last_read_at,
        isMuted: Boolean(p.is_muted)
      })),
      createdAt: conversation.created_at,
      lastMessageAt: conversation.last_message_at,
      isArchived: Boolean(conversation.is_archived)
    };
  } finally {
    connection.release();
  }
}

export {
  createConversation,
  getConversations,
  getConversationById,
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  addReaction,
  removeReaction,
  addParticipant,
  removeParticipant,
  markAsRead,
  archiveConversation,
  getGroupConversationByPostingId,
  getDirectConversationByPostingAndUsers
};

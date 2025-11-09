// ============================================================================
// CHAT WINDOW COMPONENT
// ============================================================================
// Main chat interface combining conversation list, messages, and input

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { X, ArrowLeft, Users } from 'lucide-react';
import { ConversationList, type Conversation } from './ConversationList';
import { MessageList, type Message } from './MessageList';
import { MessageInput } from './MessageInput';
import { ConversationSelectorDialog } from './ConversationSelectorDialog';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';
import { chatClient } from '../../lib/socket/chatClient';

interface ChatWindowProps {
  onClose?: () => void;
  initialConversationId?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  onClose,
  initialConversationId
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(
    initialConversationId
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<number, string>>(new Map());
  const [replyToMessage, setReplyToMessage] = useState<Message | undefined>(undefined);
  const [forwardDialogOpen, setForwardDialogOpen] = useState(false);
  const [messageToForward, setMessageToForward] = useState<Message | undefined>(undefined);
  const [socketConnected, setSocketConnected] = useState(chatClient.isSocketConnected());

  // Handle new messages from socket
  const handleNewMessage = useCallback((data: any) => {
    console.log('📨 New message received from socket:', data);
    console.log('📨 Current conversation ID:', selectedConversationId);
    console.log('📨 Message conversation ID:', data.conversationId);
    console.log('📨 IDs match?', String(data.conversationId) === String(selectedConversationId));

    // Transform socket message format to component format
    // Backend sends: { messageId, conversationId, sender: {id, firstName, lastName}, content, ... }
    const newMessage: Message = {
      id: data.messageId || data.id,  // Backend sends 'messageId'
      conversationId: data.conversationId,
      senderId: data.sender?.id || data.senderId,  // Backend sends sender object
      senderName: data.sender
        ? `${data.sender.firstName} ${data.sender.lastName}`.trim()
        : data.senderName || 'Unknown',
      senderAvatar: data.sender?.profileImageUrl || data.senderAvatar,
      content: data.content,
      messageType: data.messageType || 'TEXT',
      createdAt: data.createdAt,
      editedAt: data.editedAt,
      deletedAt: data.deletedAt,
      replyToMessageId: data.replyToId,
      reactions: data.reactions
    };

    // Only add if for current conversation
    if (String(data.conversationId) === String(selectedConversationId)) {
      setMessages(prev => {
        // Check if message already exists (avoid duplicates)
        if (prev.some(msg => String(msg.id) === String(newMessage.id))) {
          console.log('⚠️ Message already exists, skipping');
          return prev;
        }
        console.log('✅ Adding new message to list:', newMessage);
        return [...prev, newMessage];
      });
    } else {
      console.log('ℹ️ Message for different conversation, not adding to current view');
    }
  }, [selectedConversationId]);

  // Handle message edits from socket
  const handleMessageEdited = useCallback((data: any) => {
    console.log('✏️ Message edited from socket:', data);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, content: data.content, editedAt: data.editedAt }
          : msg
      )
    );
  }, []);

  // Handle message deletions from socket
  const handleMessageDeleted = useCallback((data: any) => {
    console.log('🗑️ Message deleted from socket:', data);
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, deletedAt: data.deletedAt }
          : msg
      )
    );
  }, []);

  // Handle typing indicators
  const handleTypingStart = useCallback((data: any) => {
    if (data.conversationId === selectedConversationId && data.userId !== user?.id) {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        newMap.set(data.userId, data.userName);
        return newMap;
      });
    }
  }, [selectedConversationId, user?.id]);

  const handleTypingStop = useCallback((data: any) => {
    setTypingUsers(prev => {
      const newMap = new Map(prev);
      newMap.delete(data.userId);
      return newMap;
    });
  }, []);

  // Handle read receipts
  const handleReadReceipt = useCallback((data: any) => {
    console.log('📖 Read receipt received:', data);
    // Update message read status in state
    setMessages(prev =>
      prev.map(msg =>
        msg.id === data.messageId
          ? { ...msg, readBy: [...(msg.readBy || []), { userId: data.userId, readAt: data.readAt }] }
          : msg
      )
    );
  }, []);

  // Monitor socket connection status and setup event listeners
  useEffect(() => {
    // Update socket connected state
    setSocketConnected(chatClient.isSocketConnected());

    // Listen for connection events
    const handleConnectionEstablished = () => {
      console.log('✅ Socket connection established');
      setSocketConnected(true);
    };

    const handleConnectionError = () => {
      console.log('❌ Socket connection lost');
      setSocketConnected(false);
    };

    chatClient.on('connection:established', handleConnectionEstablished);
    chatClient.on('connection:error', handleConnectionError);

    // Setup message event listeners
    chatClient.on('message:new', handleNewMessage);
    chatClient.on('message:edited', handleMessageEdited);
    chatClient.on('message:deleted', handleMessageDeleted);
    chatClient.on('typing:start', handleTypingStart);
    chatClient.on('typing:stop', handleTypingStop);
    chatClient.on('read:receipt', handleReadReceipt);
    console.log('✅ Socket event listeners registered');

    // Cleanup listeners on unmount
    return () => {
      chatClient.off('connection:established', handleConnectionEstablished);
      chatClient.off('connection:error', handleConnectionError);
      chatClient.off('message:new', handleNewMessage);
      chatClient.off('message:edited', handleMessageEdited);
      chatClient.off('message:deleted', handleMessageDeleted);
      chatClient.off('typing:start', handleTypingStart);
      chatClient.off('typing:stop', handleTypingStop);
      chatClient.off('read:receipt', handleReadReceipt);
      console.log('🧹 Socket event listeners cleaned up');
    };
  }, [handleNewMessage, handleMessageEdited, handleMessageDeleted, handleTypingStart, handleTypingStop, handleReadReceipt]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages and join conversation room when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);

      // Join conversation room for real-time updates
      console.log(`🔵 Attempting to join conversation: ${selectedConversationId}`);
      
      // Use the conversation ID as-is (don't parse UUIDs)
      chatClient.joinConversation(selectedConversationId);
      console.log(`✅ Joined conversation ${selectedConversationId}`);

      // Clear typing users when switching conversations
      setTypingUsers(new Map());

      return () => {
        // Leave conversation room when switching away
        chatClient.leaveConversation(selectedConversationId);
        console.log(`👋 Left conversation ${selectedConversationId}`);
      };
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/conversations');
      const rawConversations = response.data || response || [];

      // Transform conversations to ensure all required fields are present
      const transformedConversations = (Array.isArray(rawConversations) ? rawConversations : rawConversations.data || []).map((conv: any) => ({
        id: conv.id,
        type: conv.type || 'DIRECT',
        name: conv.name,
        lastMessage: conv.lastMessage,
        unreadCount: conv.unreadCount || 0,
        participants: Array.isArray(conv.participants) ? conv.participants.map((p: any) => ({
          userId: p.userId || p.id,
          displayName: p.displayName || `${p.firstName} ${p.lastName}`.trim() || 'Unknown',
          avatarUrl: p.avatarUrl || p.profileImageUrl
        })) : [],
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }));

      console.log('Transformed conversations:', transformedConversations);
      setConversations(transformedConversations);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationCreated = (conversationId: string) => {
    // Reload conversations to include the new one
    loadConversations();
    // Select the new conversation
    setSelectedConversationId(conversationId);
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setMessagesLoading(true);
      const response = await apiClient.get(`/api/conversations/${conversationId}/messages`);
      const rawMessages = response.data || response || [];
      
      // Transform API response to match frontend Message interface
      const transformedMessages = rawMessages.map((msg: any) => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.sender?.id || msg.senderId,
        senderName: msg.sender 
          ? `${msg.sender.firstName} ${msg.sender.lastName}` 
          : msg.senderName || 'Unknown',
        senderAvatar: msg.senderAvatar,
        content: msg.content,
        messageType: msg.messageType,
        createdAt: msg.createdAt,
        editedAt: msg.editedAt,
        deletedAt: msg.deletedAt,
        replyToMessageId: msg.replyToId,
        reactions: msg.reactions?.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          userName: `${r.userFirstName} ${r.userLastName}`,
          emoji: r.emoji
        }))
      }));
      
      setMessages(transformedMessages);

      // Mark messages as read after loading
      if (transformedMessages.length > 0) {
        const lastMessage = transformedMessages[transformedMessages.length - 1];
        const conversationIdNum = parseInt(conversationId, 10);
        if (!isNaN(conversationIdNum) && lastMessage.id) {
          chatClient.markAsRead(conversationIdNum, parseInt(lastMessage.id, 10));
        }
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedConversationId || !user) return;

    try {
      // Optimistically add message to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,  // Temporary ID until server responds
        conversationId: selectedConversationId,
        senderId: typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10),
        senderName: `${user.firstName} ${user.lastName}`,
        senderAvatar: undefined,
        content,
        messageType: 'TEXT',
        createdAt: new Date().toISOString(),
        replyToMessageId: replyToMessage?.id,
      };

      setMessages(prev => [...prev, optimisticMessage]);

      const response = await apiClient.post(`/api/conversations/${selectedConversationId}/messages`, {
        content,
        messageType: 'TEXT',
        replyToId: replyToMessage?.id
      });

      // Clear reply context after sending
      setReplyToMessage(undefined);

      const rawMessage = response.data || response;
      // Transform server response to match frontend Message interface
      const transformedMessage: Message = {
        id: rawMessage.id,
        conversationId: rawMessage.conversationId,
        senderId: rawMessage.sender?.id || rawMessage.senderId,
        senderName: rawMessage.sender 
          ? `${rawMessage.sender.firstName} ${rawMessage.sender.lastName}` 
          : rawMessage.senderName || 'Unknown',
        senderAvatar: rawMessage.senderAvatar,
        content: rawMessage.content,
        messageType: rawMessage.messageType,
        createdAt: rawMessage.createdAt,
        editedAt: rawMessage.editedAt,
        deletedAt: rawMessage.deletedAt,
        replyToMessageId: rawMessage.replyToId,
        reactions: rawMessage.reactions?.map((r: any) => ({
          id: r.id,
          userId: r.userId,
          userName: `${r.userFirstName} ${r.userLastName}`,
          emoji: r.emoji
        }))
      };
      
      // Replace optimistic message with server response
      setMessages(prev =>
        prev.map(msg => (msg.id === optimisticMessage.id ? transformedMessage : msg))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
    }
  };

  const handleEditMessage = async (messageId: string, content: string) => {
    try {
      await apiClient.put(`/api/messages/${messageId}`, { content });

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, content, editedAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await apiClient.delete(`/api/messages/${messageId}`);

      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? { ...msg, deletedAt: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  };

  const handleReactToMessage = async (messageId: string, emoji: string) => {
    try {
      const response = await apiClient.post(`/api/messages/${messageId}/reactions`, { emoji });

      // Update message with new reaction
      const reactionData = response.data || response;
      setMessages(prev =>
        prev.map(msg =>
          msg.id === messageId
            ? {
                ...msg,
                reactions: [
                  ...(msg.reactions || []),
                  reactionData
                ]
              }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to react to message:', error);
    }
  };

  const handleReplyMessage = (messageId: string) => {
    const messageToReply = messages.find(msg => msg.id === messageId);
    if (messageToReply) {
      setReplyToMessage(messageToReply);
    }
  };

  const handleCancelReply = () => {
    setReplyToMessage(undefined);
  };

  const handleForwardMessage = (messageId: string) => {
    const messageToForwardData = messages.find(msg => msg.id === messageId);
    if (messageToForwardData) {
      setMessageToForward(messageToForwardData);
      setForwardDialogOpen(true);
    }
  };

  const handleForwardToConversation = async (targetConversationId: string) => {
    if (!messageToForward || !user) return;

    try {
      // Send the forwarded message to the target conversation
      await apiClient.post(`/api/conversations/${targetConversationId}/messages`, {
        content: `📩 Forwarded message:\n\n${messageToForward.content}`,
        messageType: 'TEXT'
      });

      console.log('✅ Message forwarded successfully to conversation:', targetConversationId);
      
      // Clear forward state
      setMessageToForward(undefined);
      setForwardDialogOpen(false);
    } catch (error) {
      console.error('Failed to forward message:', error);
      // Could show error toast here
    }
  };

  // Handle typing indicators
  const handleTyping = useCallback(() => {
    if (selectedConversationId && user) {
      const userId = typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10);
      chatClient.sendTypingIndicator(
        selectedConversationId,
        userId,
        `${user.firstName} ${user.lastName}`.trim()
      );
    }
  }, [selectedConversationId, user]);

  const handleStopTyping = useCallback(() => {
    if (selectedConversationId && user) {
      const userId = typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10);
      chatClient.stopTypingIndicator(selectedConversationId, userId);
    }
  }, [selectedConversationId, user]);

  // Setup event listeners

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  return (
    <Card className="flex flex-col h-[600px] w-full max-w-4xl" data-testid="chat-window">
      {/* Header */}
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-2">
          {selectedConversationId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversationId(undefined)}
              className="lg:hidden"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <CardTitle className="text-xl font-semibold">
            {selectedConversation
              ? selectedConversation.name || 'Chat'
              : 'Messages'}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          {selectedConversation && (
            <Button variant="ghost" size="icon" title="Conversation info">
              <Users className="h-5 w-5" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardHeader>

      <Separator />

      {/* Content */}
      <CardContent className="flex-1 p-0 flex overflow-hidden">
        {/* Conversation list (left sidebar) */}
        <div
          className={`w-80 border-r ${
            selectedConversationId ? 'hidden lg:block' : 'block w-full lg:w-80'
          }`}
          data-testid="conversation-list"
        >
          <ConversationList
            conversations={conversations}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
            onConversationCreated={handleConversationCreated}
            loading={loading}
          />
        </div>

        {/* Messages area (right side) */}
        <div
          className={`flex-1 flex flex-col ${
            !selectedConversationId ? 'hidden lg:flex' : 'flex'
          }`}
          data-testid="message-area"
        >
          {selectedConversationId && user ? (
            <>
              <MessageList
                messages={messages}
                currentUserId={typeof user.id === 'number' ? user.id : parseInt(String(user.id), 10)}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReplyMessage={handleReplyMessage}
                onForwardMessage={handleForwardMessage}
                onReactToMessage={handleReactToMessage}
                loading={messagesLoading}
              />
              {/* Show typing indicators */}
              {typingUsers.size > 0 && (
                <div className="px-4 py-2 text-sm text-muted-foreground italic">
                  {Array.from(typingUsers.values()).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                </div>
              )}
              <MessageInput
                onSendMessage={handleSendMessage}
                onTyping={handleTyping}
                onStopTyping={handleStopTyping}
                replyToMessage={replyToMessage}
                onCancelReply={handleCancelReply}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <p className="text-lg font-medium text-muted-foreground">
                  Select a conversation to start messaging
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Choose from your existing conversations or start a new one
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Forward Message Dialog */}
      <ConversationSelectorDialog
        open={forwardDialogOpen}
        onOpenChange={setForwardDialogOpen}
        conversations={conversations}
        onSelectConversation={handleForwardToConversation}
        currentConversationId={selectedConversationId}
      />
    </Card>
  );
};

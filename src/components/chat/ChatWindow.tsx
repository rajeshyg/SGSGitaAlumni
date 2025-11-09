// ============================================================================
// CHAT WINDOW COMPONENT
// ============================================================================
// Main chat interface combining conversation list, messages, and input

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Separator } from '../ui/separator';
import { X, ArrowLeft, Users } from 'lucide-react';
import { ConversationList, type Conversation } from './ConversationList';
import { MessageList, type Message } from './MessageList';
import { MessageInput } from './MessageInput';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../lib/api';

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

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId);
    }
  }, [selectedConversationId]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/conversations');
      setConversations(response.data || response || []);
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
      setMessages(response.data || response || []);
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
      };

      setMessages(prev => [...prev, optimisticMessage]);

      const response = await apiClient.post(`/api/conversations/${selectedConversationId}/messages`, {
        content,
        messageType: 'TEXT'
      });

      const newMessage = response.data || response;
      // Replace optimistic message with server response
      setMessages(prev =>
        prev.map(msg => (msg.id === optimisticMessage.id ? newMessage : msg))
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
                onReactToMessage={handleReactToMessage}
                loading={messagesLoading}
              />
              <MessageInput onSendMessage={handleSendMessage} />
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
    </Card>
  );
};

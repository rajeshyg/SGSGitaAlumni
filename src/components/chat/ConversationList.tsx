// ============================================================================
// CONVERSATION LIST COMPONENT
// ============================================================================
// Displays a list of conversations with real-time updates

import React, { useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { MessageSquarePlus, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { NewConversationDialog } from './NewConversationDialog';

export interface Conversation {
  id: string;  // UUID
  type: 'DIRECT' | 'GROUP';
  name?: string;
  postingId?: string;  // For conversations linked to posts
  postingTitle?: string;  // For displaying post title (fetched from POSTINGS)
  lastMessage?: {
    content: string;
    createdAt: string;
    senderName: string;
  };
  unreadCount: number;
  participants: Array<{
    userId: number;
    displayName: string;
    avatarUrl?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId?: string;  // UUID
  onSelectConversation: (conversationId: string) => void;
  onConversationCreated?: (conversationId: string) => void;
  loading?: boolean;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onConversationCreated,
  loading = false
}) => {
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleConversationCreated = (conversationId: string) => {
    if (onConversationCreated) {
      onConversationCreated(conversationId);
    }
  };

  const getConversationName = (conversation: Conversation): string => {
    // For DIRECT conversations, show the other participant's name
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      return conversation.participants[0].displayName;
    }

    // For GROUP conversations, show name or post title
    if (conversation.type === 'GROUP') {
      if (conversation.name) {
        return conversation.name;
      }
      if (conversation.postingTitle) {
        return conversation.postingTitle;
      }
      // Fallback: show participant names
      if (conversation.participants?.length > 0) {
        const names = conversation.participants.map(p => p.displayName).slice(0, 3);
        return names.join(', ');
      }
    }

    return 'Conversation';
  };

  const getConversationAvatar = (conversation: Conversation): string | undefined => {
    if (conversation.type === 'DIRECT' && conversation.participants?.length > 0) {
      return conversation.participants[0].avatarUrl;
    }
    return undefined;
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter conversations based on search query
  const filteredConversations = conversations.filter((conversation) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const name = getConversationName(conversation).toLowerCase();
    const lastMessageContent = conversation.lastMessage?.content?.toLowerCase() || '';
    
    return name.includes(query) || lastMessageContent.includes(query);
  });

  return (
    <>
      {/* Header with Search and New Message Button */}
      <div className="p-4 border-b border-border space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        {/* New Message Button */}
        <Button
          onClick={() => setShowNewConversationDialog(true)}
          className="w-full"
          size="sm"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Conversations List */}
      {loading ? (
        <div className="flex flex-col space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted animate-pulse">
              <div className="w-10 h-10 rounded-full bg-muted-foreground/20" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
          {searchQuery ? (
            <>
              <p className="text-lg font-medium">No conversations found</p>
              <p className="text-sm mt-2">Try a different search term</p>
            </>
          ) : (
            <>
              <p className="text-lg font-medium">No conversations yet</p>
              <p className="text-sm mt-2">Click "New Message" to start chatting</p>
            </>
          )}
        </div>
      ) : (
        <ScrollArea className="h-full">
          <div className="flex flex-col space-y-1 p-2">
            {filteredConversations.map((conversation) => {
              const isSelected = conversation.id === selectedConversationId;
              const conversationName = getConversationName(conversation);
              const avatarUrl = getConversationAvatar(conversation);

              return (
                <button
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation.id)}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors w-full text-left ${
                    isSelected
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={avatarUrl} alt={conversationName} />
                    <AvatarFallback>{getInitials(conversationName)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium truncate ${
                        conversation.unreadCount > 0 ? 'font-bold' : ''
                      }`}>
                        {conversationName}
                      </h3>
                      {conversation.lastMessage && (
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                            addSuffix: false
                          })}
                        </span>
                      )}
                    </div>

                    {conversation.lastMessage && (
                      <p className={`text-xs truncate mt-1 ${
                        conversation.unreadCount > 0
                          ? 'text-foreground font-medium'
                          : 'text-muted-foreground'
                      }`}>
                        {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                      </p>
                    )}
                  </div>

                  {conversation.unreadCount > 0 && (
                    <Badge
                      variant="default"
                      className="ml-2 min-w-[20px] h-5 flex items-center justify-center px-1.5"
                    >
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={showNewConversationDialog}
        onOpenChange={setShowNewConversationDialog}
        onConversationCreated={handleConversationCreated}
      />
    </>
  );
};

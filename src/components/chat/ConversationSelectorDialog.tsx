// ============================================================================
// CONVERSATION SELECTOR DIALOG COMPONENT
// ============================================================================
// Dialog for selecting a conversation to forward a message to

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Search } from 'lucide-react';
import { type Conversation } from './ConversationList';

interface ConversationSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations: Conversation[];
  onSelectConversation: (conversationId: string) => void;
  currentConversationId?: string;
}

export const ConversationSelectorDialog: React.FC<ConversationSelectorDialogProps> = ({
  open,
  onOpenChange,
  conversations,
  onSelectConversation,
  currentConversationId
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    if (conv.id === currentConversationId) return false; // Exclude current conversation
    const query = searchQuery.toLowerCase();
    const participantNames = conv.participants.map(p => p.displayName).join(', ');
    return (
      conv.name?.toLowerCase().includes(query) ||
      participantNames.toLowerCase().includes(query)
    );
  });

  const handleSelect = (conversationId: string) => {
    onSelectConversation(conversationId);
    onOpenChange(false);
    setSearchQuery(''); // Reset search
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>
            Select a conversation to forward this message to
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Conversation list */}
        <ScrollArea className="h-[300px] pr-4">
          {filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {searchQuery ? 'No conversations found' : 'No other conversations available'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => {
                const participantNames = conversation.participants.map(p => p.displayName).join(', ');
                const avatarUrl = conversation.participants[0]?.avatarUrl;
                const displayName = conversation.name || participantNames;
                
                return (
                  <button
                    key={conversation.id}
                    onClick={() => handleSelect(conversation.id)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={avatarUrl} alt={displayName} />
                      <AvatarFallback>
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="font-medium text-sm truncate">
                        {displayName}
                      </p>
                      {conversation.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

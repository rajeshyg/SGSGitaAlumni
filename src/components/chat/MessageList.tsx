// ============================================================================
// MESSAGE LIST COMPONENT
// ============================================================================
// Displays messages in a conversation with reactions and read receipts

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { MoreVertical, Trash2, Edit, Reply, Forward, Check, CheckCheck } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Message Interface
 * Represents a single message in a conversation with all metadata
 */
export interface Message {
  id: string;  // UUID - Unique message identifier
  conversationId: string;  // UUID - Parent conversation
  senderId: number;  // User ID of message sender
  senderName: string;  // Display name of sender
  senderAvatar?: string;  // Optional avatar URL
  content: string;  // Message text content
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK' | 'SYSTEM';  // Message category
  createdAt: string;  // ISO timestamp of message creation
  editedAt?: string;  // ISO timestamp if message was edited
  deletedAt?: string;  // ISO timestamp if message was deleted (soft delete)
  replyToMessageId?: string;  // UUID of message being replied to
  reactions?: Array<{  // User reactions to this message
    id: string;  // UUID - Reaction identifier
    userId: number;  // User who reacted
    userName: string;  // Display name of reactor
    emoji: string;  // Emoji character
  }>;
  readBy?: Array<{  // Read receipts tracking
    userId: number;  // User who read the message
    readAt: string;  // ISO timestamp of when message was read
  }>;
}

/**
 * MessageList Component Props
 */
interface MessageListProps {
  messages: Message[];  // Array of messages to display
  currentUserId: number;  // Current logged-in user's ID (for own message detection)
  onEditMessage?: (messageId: string, content: string) => void;  // Callback for editing messages
  onDeleteMessage?: (messageId: string) => void;  // Callback for deleting messages
  onReplyMessage?: (messageId: string) => void;  // Callback for replying to messages
  onForwardMessage?: (messageId: string) => void;  // Callback for forwarding messages
  onReactToMessage?: (messageId: string, emoji: string) => void;  // Callback for adding reactions
  loading?: boolean;  // Loading state indicator
}

/**
 * MessageList Component
 * 
 * Displays a scrollable list of messages in a conversation with:
 * - Date separators (Today, Yesterday, specific dates)
 * - User avatars and names
 * - Reply context showing quoted messages
 * - Read receipts (✓ delivered, ✓✓ read)
 * - Message actions (reply, forward, edit, delete, react)
 * - Reactions display
 * - Auto-scroll to bottom on new messages
 */
export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUserId,
  onEditMessage,
  onDeleteMessage,
  onReplyMessage,
  onForwardMessage,
  onReactToMessage,
  loading = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    // Use scrollIntoView for smoother scrolling
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const getInitials = (name: string | undefined): string => {
    if (!name) return '??';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};

    messages.forEach(message => {
      const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });

    // Sort messages within each date group chronologically (oldest first)
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });

    return groups;
  };

  const formatDateSeparator = (date: string): string => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (format(messageDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')) {
      return 'Today';
    } else if (format(messageDate, 'yyyy-MM-dd') === format(yesterday, 'yyyy-MM-dd')) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMM d, yyyy');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-start space-x-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-1/4" />
              <div className="h-12 bg-muted rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
        <p className="text-lg font-medium">No messages yet</p>
        <p className="text-sm mt-2">Be the first to send a message</p>
      </div>
    );
  }

  const groupedMessages = groupMessagesByDate(messages);

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="flex flex-col space-y-4">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex justify-center my-4">
              <span className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                {formatDateSeparator(date)}
              </span>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message, index) => {
              const isOwnMessage = message.senderId === currentUserId;
              const showAvatar = !isOwnMessage && (
                index === 0 ||
                dateMessages[index - 1].senderId !== message.senderId
              );

              return (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 mb-2 ${
                    isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  {showAvatar && !isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.senderAvatar} alt={message.senderName} />
                      <AvatarFallback className="text-xs">
                        {getInitials(message.senderName)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {!showAvatar && !isOwnMessage && <div className="w-8" />}

                  {/* Message content */}
                  <div className={`flex-1 max-w-[70%] ${isOwnMessage ? 'flex justify-end' : ''}`}>
                    <div className="group relative">
                      {/* Sender name (only for others' messages) */}
                      {!isOwnMessage && showAvatar && (
                        <p className="text-xs font-medium text-muted-foreground mb-1 ml-1">
                          {message.senderName}
                        </p>
                      )}

                      {/* Message bubble */}
                      <div
                        className={`rounded-lg px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        } ${message.deletedAt ? 'opacity-50 italic' : ''}`}
                      >
                        {message.deletedAt ? (
                          <p className="text-sm">This message was deleted</p>
                        ) : (
                          <>
                            {/* Reply context */}
                            {message.replyToMessageId && (() => {
                              const repliedMessage = messages.find(m => m.id === message.replyToMessageId);
                              return repliedMessage ? (
                                <div className={`mb-2 pb-2 border-l-2 pl-2 ${
                                  isOwnMessage ? 'border-primary-foreground/30' : 'border-border'
                                }`}>
                                  <p className={`text-xs font-medium ${
                                    isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                                  }`}>
                                    {repliedMessage.senderName}
                                  </p>
                                  <p className={`text-xs truncate ${
                                    isOwnMessage ? 'text-primary-foreground/60' : 'text-muted-foreground/80'
                                  }`}>
                                    {repliedMessage.content}
                                  </p>
                                </div>
                              ) : null;
                            })()}

                            <p className="text-sm whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                            {message.editedAt && (
                              <p className="text-xs opacity-70 mt-1">
                                (edited)
                              </p>
                            )}
                          </>
                        )}

                        {/* Timestamp with read status */}
                        <p
                          className={`text-xs mt-1 flex items-center gap-1 ${
                            isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}
                        >
                          <span>{format(new Date(message.createdAt), 'HH:mm')}</span>
                          {/* Show read indicators for own messages */}
                          {isOwnMessage && message.readBy && message.readBy.length > 0 && (
                            <span title={`Read by ${message.readBy.length} user(s)`}>
                              <CheckCheck className="h-3 w-3" />
                            </span>
                          )}
                          {isOwnMessage && (!message.readBy || message.readBy.length === 0) && (
                            <span title="Delivered">
                              <Check className="h-3 w-3" />
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Reactions */}
                      {message.reactions && message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-1">
                          {message.reactions.map((reaction) => (
                            <button
                              key={reaction.id}
                              className="bg-muted hover:bg-muted/80 rounded-full px-2 py-0.5 text-xs flex items-center space-x-1"
                              title={reaction.userName}
                            >
                              <span>{reaction.emoji}</span>
                              <span className="text-xs text-muted-foreground">1</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Message actions menu */}
                      {!message.deletedAt && (
                        <div
                          className={`absolute top-0 ${
                            isOwnMessage ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'
                          } opacity-0 group-hover:opacity-100 transition-opacity`}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={isOwnMessage ? 'end' : 'start'}>
                              {onReplyMessage && (
                                <DropdownMenuItem onClick={() => onReplyMessage(message.id)}>
                                  <Reply className="mr-2 h-4 w-4" />
                                  Reply
                                </DropdownMenuItem>
                              )}
                              {onForwardMessage && (
                                <DropdownMenuItem onClick={() => onForwardMessage(message.id)}>
                                  <Forward className="mr-2 h-4 w-4" />
                                  Forward
                                </DropdownMenuItem>
                              )}
                              {onReactToMessage && (
                                <DropdownMenuItem onClick={() => onReactToMessage(message.id, '👍')}>
                                  👍 React
                                </DropdownMenuItem>
                              )}
                              {isOwnMessage && onEditMessage && (
                                <DropdownMenuItem onClick={() => {
                                  const newContent = prompt('Edit message:', message.content);
                                  if (newContent && newContent !== message.content) {
                                    onEditMessage(message.id, newContent);
                                  }
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {isOwnMessage && onDeleteMessage && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    if (confirm('Delete this message?')) {
                                      onDeleteMessage(message.id);
                                    }
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        {/* Invisible element at bottom for auto-scroll target */}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
};

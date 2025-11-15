// ============================================================================
// MESSAGE INPUT COMPONENT
// ============================================================================
// Input field for composing and sending messages

import React, { useState, useRef, KeyboardEvent } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import { type Message } from './MessageList';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onTyping?: () => void;
  onStopTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  replyToMessage?: Message;
  onCancelReply?: () => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  onStopTyping,
  disabled = false,
  placeholder = 'Type a message...',
  replyToMessage,
  onCancelReply
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Handle typing indicators
    if (newMessage && !isTyping && onTyping) {
      setIsTyping(true);
      onTyping();
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    if (newMessage) {
      typingTimeoutRef.current = setTimeout(() => {
        if (onStopTyping) {
          onStopTyping();
        }
        setIsTyping(false);
      }, 2000);
    } else {
      if (onStopTyping) {
        onStopTyping();
      }
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage('');
    setIsTyping(false);

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (onStopTyping) {
      onStopTyping();
    }

    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send message on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="border-t p-4 bg-background">
      {/* Reply preview */}
      {replyToMessage && (
        <div className="mb-2 p-2 bg-muted rounded-lg flex items-start justify-between">
          <div className="flex-1 overflow-hidden">
            <div className="text-xs font-semibold text-primary mb-1">
              Replying to {replyToMessage.senderName}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {replyToMessage.content}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 ml-2"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex items-end space-x-2">
        {/* Attachment button (future feature) */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          disabled={disabled}
          title="Attach file (coming soon)"
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="min-h-[44px] max-h-32 resize-none pr-10"
            rows={1}
            data-testid="message-input"
          />

          {/* Emoji button (future feature) */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 bottom-1 h-8 w-8"
            disabled={disabled}
            title="Add emoji (coming soon)"
          >
            <Smile className="h-4 w-4" />
          </Button>
        </div>

        {/* Send button */}
        <Button
          type="button"
          size="icon"
          onClick={handleSendMessage}
          disabled={disabled || !message.trim()}
          className="shrink-0"
          data-testid="send-message"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Character counter (optional) */}
      {message.length > 0 && (
        <div className="mt-1 text-xs text-muted-foreground text-right">
          {message.length} / 5000
        </div>
      )}
    </div>
  );
};

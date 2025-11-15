import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Menu } from 'lucide-react';
import { useMessages, useConversations } from '../hooks/useMessaging';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import type { Conversation } from '../services/APIService';

export default function ChatPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  // Support both old (?conversationId=) and new (?c=) URL parameter formats
  const conversationId = searchParams.get('c') || searchParams.get('conversationId') || '';

  const { user } = useAuth();
  const { conversations } = useConversations();
  const { messages, isLoading, sendMessage } = useMessages(conversationId);

  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current conversation - ensure conversations is always an array
  const conversationsList = Array.isArray(conversations) ? conversations : [];
  const currentConversation = conversationsList.find((c: Conversation) => c.id === conversationId);

  const conversationName = currentConversation?.participants
    ?.map((p) => `${p.firstName || ''} ${p.lastName || ''}`.trim())
    .filter(Boolean)
    .join(', ') || 'Chat';

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    };

    // Small delay to ensure DOM is updated
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Handle mobile viewport adjustments when keyboard shows
  useEffect(() => {
    let lastHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = window.innerHeight;

      // Only handle significant changes (keyboard showing/hiding)
      if (Math.abs(currentHeight - lastHeight) > 100) {
        // Scroll to bottom when keyboard shows/hides
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 300);

        lastHeight = currentHeight;
      }
    };

    const handleViewportResize = () => {
      // For iOS, use visualViewport API for better keyboard handling
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    // Also handle visual viewport changes (better for iOS)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportResize);
      }
    };
  }, []);

  // Handle input focus to ensure it's visible
  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        if (inputRef.current && containerRef.current) {
          // Ensure input is in view when focused
          inputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 300);
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('focus', handleFocus);
      return () => input.removeEventListener('focus', handleFocus);
    }
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim() || !conversationId || isSending) return;

    const messageContent = inputValue.trim();
    setInputValue('');
    setIsSending(true);

    try {
      await sendMessage({
        conversationId,
        content: messageContent,
        messageType: 'text'
      });

      // Focus back on input after sending
      inputRef.current?.focus();
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore message on error
      setInputValue(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  if (!conversationId) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4">
        <h1 className="mb-4 text-2xl font-bold text-foreground">Select a conversation</h1>
        <Button onClick={() => navigate('/dashboard')}>
          Go to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Fixed Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarImage
              src={currentConversation?.participants?.[0]?.profileImageUrl || ''}
              alt={conversationName}
            />
            <AvatarFallback>{conversationName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground">
              {conversationName}
            </h1>
          </div>
        </div>

        <Button variant="ghost" size="icon" className="shrink-0">
          <Menu className="h-5 w-5" />
        </Button>
      </header>

      {/* Messages Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4 mobile-smooth-scroll"
        style={{
          WebkitOverflowScrolling: 'touch',
          // Ensure proper scroll behavior on mobile
          touchAction: 'pan-y',
          // Add momentum scrolling for iOS
          scrollBehavior: 'smooth'
        }}
      >
        {isLoading && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isCurrentUser = user ? message.senderId === user.id : false;

              return (
                <div
                  key={message.id}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2 sm:max-w-[75%] ${
                      isCurrentUser
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    {!isCurrentUser && (
                      <p className="mb-1 text-xs font-medium opacity-70">
                        {message.senderName}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.content}
                    </p>
                    <p
                      className={`mt-1 text-xs ${
                        isCurrentUser
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Input Area */}
      <div className="sticky bottom-0 border-t border-border bg-background p-3 sm:p-4 shrink-0 mobile-safe-area-bottom">
        <div className="flex items-end gap-2">
          <div className="flex-1 rounded-2xl border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 transition-shadow">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className="w-full resize-none border-0 bg-transparent px-3 py-2.5 sm:px-4 sm:py-3 text-base outline-none placeholder:text-muted-foreground"
              style={{
                maxHeight: '120px',
                // Prevent zoom on iOS by using minimum 16px font size
                fontSize: '16px'
              }}
              disabled={isSending}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="sentences"
            />
          </div>
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            className="h-11 w-11 shrink-0 rounded-full touch-target"
            aria-label="Send message"
          >
            {isSending ? (
              <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-primary-foreground"></div>
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

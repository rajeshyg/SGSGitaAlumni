// ============================================================================
// CHAT WEBSOCKET CLIENT
// ============================================================================
// Real-time chat communication using Socket.IO with auto-reconnection
// and offline message queuing support

import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: number;
  conversationId: number;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'LINK' | 'SYSTEM';
  senderId: number;
  senderName: string;
  createdAt: string;
  editedAt?: string;
  deletedAt?: string;
}

export interface TypingIndicator {
  userId: number;
  userName: string;
  conversationId: number;
}

export interface ReadReceipt {
  userId: number;
  messageId: number;
  conversationId: number;
  readAt: string;
}

export interface OnlineStatus {
  userId: number;
  isOnline: boolean;
}

export type ChatEventListener = (data: any) => void;

// ============================================================================
// CHAT CLIENT CLASS
// ============================================================================

class ChatClient {
  private socket: Socket | null = null;
  private messageQueue: ChatMessage[] = [];
  private listeners: Map<string, ChatEventListener[]> = new Map();
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // ============================================================================
  // CONNECTION MANAGEMENT
  // ============================================================================

  /**
   * Connect to the chat server
   */
  public connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socketUrl = `${window.location.origin}`;
        
        console.log('🔌 Initializing socket connection:', {
          socketUrl,
          hasToken: !!token,
          tokenLength: token?.length || 0,
          origin: window.location.origin
        });

        this.socket = io(socketUrl, {
          auth: {
            token
          },
          reconnection: true,
          reconnectionDelay: this.reconnectDelay,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: this.maxReconnectAttempts,
          transports: ['websocket', 'polling']
        });

        // Connection established
        this.socket.on('connect', () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          console.log('💬 Chat socket connected:', this.socket?.id);
          this.emit('connection:established');

          // Process queued messages
          this.processMessageQueue();
          resolve();
        });

        // Connection failed
        this.socket.on('connect_error', (error: any) => {
          console.error('❌ Chat socket connection error:', error);
          console.error('❌ Error details:', {
            message: error.message,
            description: error.description,
            context: error.context,
            type: error.type
          });
          this.isConnected = false;
          this.emit('connection:error', error);
          reject(error);
        });

        // Disconnected
        this.socket.on('disconnect', (reason: string) => {
          this.isConnected = false;
          console.warn('⚠️ Chat socket disconnected:', reason);
          this.emit('connection:closed', { reason });
        });

        // Setup event listeners
        this.setupEventListeners();
      } catch (error) {
        console.error('Failed to initialize chat socket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the chat server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('💬 Chat socket disconnected');
    }
  }

  /**
   * Check if client is connected
   */
  public isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // ============================================================================
  // EVENT LISTENERS SETUP
  // ============================================================================

  /**
   * Setup Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // New message received
    this.socket.on('message:new', (data: ChatMessage) => {
      console.log('📨 New message received from socket:', {
        messageId: data.id,
        conversationId: data.conversationId,
        senderId: data.senderId,
        contentPreview: data.content?.substring(0, 50)
      });
      this.emit('message:new', data);
    });

    // Message edited
    this.socket.on('message:edited', (data: { messageId: number; content: string; editedAt: string }) => {
      console.log('✏️ Message edited:', data);
      this.emit('message:edited', data);
    });

    // Message deleted
    this.socket.on('message:deleted', (data: { messageId: number; deletedAt: string }) => {
      console.log('🗑️ Message deleted:', data);
      this.emit('message:deleted', data);
    });

    // Typing indicator
    this.socket.on('typing:start', (data: TypingIndicator) => {
      this.emit('typing:start', data);
    });

    this.socket.on('typing:stop', (data: { userId: number; conversationId: number }) => {
      this.emit('typing:stop', data);
    });

    // Read receipts
    this.socket.on('read:receipt', (data: ReadReceipt) => {
      this.emit('read:receipt', data);
    });

    // Reaction added
    this.socket.on('reaction:added', (data: {
      messageId: number;
      userId: number;
      emoji: string;
      userName: string;
    }) => {
      this.emit('reaction:added', data);
    });

    // Reaction removed
    this.socket.on('reaction:removed', (data: {
      messageId: number;
      userId: number;
      emoji: string;
    }) => {
      this.emit('reaction:removed', data);
    });

    // User online/offline status
    this.socket.on('user:online', (data: { userId: number; userName: string }) => {
      this.emit('user:online', data);
    });

    this.socket.on('user:offline', (data: { userId: number }) => {
      this.emit('user:offline', data);
    });

    // Conversation archived
    this.socket.on('conversation:archived', (data: { conversationId: number }) => {
      this.emit('conversation:archived', data);
    });

    // Participant added
    this.socket.on('participant:added', (data: {
      conversationId: number;
      userId: number;
      userName: string;
    }) => {
      this.emit('participant:added', data);
    });

    // Participant removed
    this.socket.on('participant:removed', (data: {
      conversationId: number;
      userId: number;
    }) => {
      this.emit('participant:removed', data);
    });
  }

  // ============================================================================
  // EVENT MANAGEMENT
  // ============================================================================

  /**
   * Subscribe to a chat event
   */
  public on(event: string, listener: ChatEventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);
  }

  /**
   * Unsubscribe from a chat event
   */
  public off(event: string, listener: ChatEventListener): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit a local event
   */
  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event) || [];
    listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }

  // ============================================================================
  // SOCKET EMIT METHODS
  // ============================================================================

  /**
   * Join a conversation room for real-time updates
   */
  public joinConversation(conversationId: number | string): void {
    if (!this.isSocketConnected()) {
      console.warn('🔴 Socket not connected, cannot join conversation:', conversationId);
      return;
    }
    console.log('🔵 Attempting to join conversation:', conversationId);
    
    // Emit with conversationId and callback for acknowledgment
    this.socket?.emit('conversation:join', conversationId, (response: any) => {
      if (response?.success) {
        console.log('✅ Successfully joined conversation:', conversationId, 'Room:', response.room);
      } else {
        console.error('❌ Failed to join conversation:', conversationId);
      }
    });
  }

  /**
   * Leave a conversation room
   */
  public leaveConversation(conversationId: number | string): void {
    if (!this.isSocketConnected()) {
      return;
    }
    
    this.socket?.emit('conversation:leave', conversationId, (response: any) => {
      if (response?.success) {
        console.log('✅ Successfully left conversation:', conversationId);
      }
    });
  }

  /**
   * Send typing indicator
   */
  public sendTypingIndicator(conversationId: number): void {
    if (!this.isSocketConnected()) {
      return;
    }
    this.socket?.emit('typing:start', { conversationId });
  }

  /**
   * Stop typing indicator
   */
  public stopTypingIndicator(conversationId: number): void {
    if (!this.isSocketConnected()) {
      return;
    }
    this.socket?.emit('typing:stop', { conversationId });
  }

  /**
   * Mark message as read
   */
  public markAsRead(conversationId: number, messageId?: number): void {
    if (!this.isSocketConnected()) {
      console.warn('Socket not connected, queuing read receipt');
      return;
    }
    this.socket?.emit('read:mark', { conversationId, messageId });
  }

  /**
   * Add reaction to message
   */
  public addReaction(messageId: number, emoji: string): void {
    if (!this.isSocketConnected()) {
      console.warn('Socket not connected, cannot add reaction');
      return;
    }
    this.socket?.emit('reaction:add', { messageId, emoji });
  }

  /**
   * Remove reaction from message
   */
  public removeReaction(messageId: number, emoji: string): void {
    if (!this.isSocketConnected()) {
      console.warn('Socket not connected, cannot remove reaction');
      return;
    }
    this.socket?.emit('reaction:remove', { messageId, emoji });
  }

  // ============================================================================
  // MESSAGE QUEUE MANAGEMENT
  // ============================================================================

  /**
   * Queue a message for sending when connection is restored
   */
  private queueMessage(message: ChatMessage): void {
    this.messageQueue.push(message);
    console.log('📋 Message queued for offline sending:', message.id);
  }

  /**
   * Process queued messages when connection is restored
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) return;

    console.log(`📤 Processing ${this.messageQueue.length} queued messages`);
    const queuedMessages = [...this.messageQueue];
    this.messageQueue = [];

    queuedMessages.forEach(message => {
      this.emit('message:queued', message);
    });
  }

  /**
   * Get queued messages count
   */
  public getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Clear message queue
   */
  public clearMessageQueue(): void {
    this.messageQueue = [];
  }

  // ============================================================================
  // CONNECTION STATUS
  // ============================================================================

  /**
   * Get connection status
   */
  public getStatus(): {
    connected: boolean;
    queuedMessages: number;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isSocketConnected(),
      queuedMessages: this.messageQueue.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const chatClient = new ChatClient();

// Make chatClient globally accessible for debugging
if (typeof window !== 'undefined') {
  (window as any).chatClient = chatClient;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default chatClient;

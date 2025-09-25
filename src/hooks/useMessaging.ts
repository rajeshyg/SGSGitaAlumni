import { useState, useEffect, useCallback } from 'react';
import { APIService, type Conversation, type Message, type SendMessageData, type CreatePostingData, type UpdatePostingData } from '../services/APIService';

// ============================================================================
// MESSAGING HOOKS
// ============================================================================

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const conversationsData = await APIService.getConversations();
      setConversations(conversationsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  return {
    conversations,
    isLoading,
    error,
    fetchConversations,
    refetch: fetchConversations
  };
}

export function useMessages(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async (id: string) => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const messagesData = await APIService.getMessages(id);
      setMessages(messagesData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch messages';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (messageData: SendMessageData) => {
    try {
      setError(null);
      const newMessage = await APIService.sendMessage(messageData);
      
      // Add the new message to the current messages
      setMessages(prev => [...prev, newMessage]);
      
      return newMessage;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    }
  }, []);

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId, fetchMessages]);

  return {
    messages,
    isLoading,
    error,
    fetchMessages,
    sendMessage,
    refetch: () => fetchMessages(conversationId)
  };
}

// ============================================================================
// POSTING MANAGEMENT HOOKS
// ============================================================================

export function usePostingManagement() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPosting = useCallback(async (postingData: CreatePostingData) => {
    try {
      setIsLoading(true);
      setError(null);
      return await APIService.createPosting(postingData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create posting';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updatePosting = useCallback(async (id: string, postingData: UpdatePostingData) => {
    try {
      setIsLoading(true);
      setError(null);
      return await APIService.updatePosting(id, postingData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update posting';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    createPosting,
    updatePosting
  };
}

// ============================================================================
// ERROR HANDLING HOOK
// ============================================================================

export function useApiError() {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((err: unknown) => {
    const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
    setError(errorMessage);
    
    // Log error for monitoring (in production, send to error tracking service)
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('API Error:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError
  };
}

// ============================================================================
// LOADING STATE HOOK
// ============================================================================

export function useLoadingState() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(loading => loading);
  }, [loadingStates]);

  return {
    setLoading,
    isLoading,
    isAnyLoading,
    loadingStates
  };
}

// ============================================================================
// CACHE MANAGEMENT HOOK
// ============================================================================

export function useApiCache<T>() {
  const [cache, setCache] = useState<Map<string, { data: T; timestamp: number }>>(new Map());

  const getCachedData = useCallback((key: string, maxAge: number = 5 * 60 * 1000) => {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    return null;
  }, [cache]);

  const setCachedData = useCallback((key: string, data: T) => {
    setCache(prev => new Map(prev.set(key, { data, timestamp: Date.now() })));
  }, []);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
    } else {
      setCache(new Map());
    }
  }, []);

  return {
    getCachedData,
    setCachedData,
    clearCache
  };
}

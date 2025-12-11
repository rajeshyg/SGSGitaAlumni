import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock getPool
vi.mock('../../utils/database.js', () => {
  const mockConnection = {
    execute: vi.fn(),
    release: vi.fn(),
    beginTransaction: vi.fn(),
    commit: vi.fn(),
    rollback: vi.fn(),
  };
  const mockPool = {
    getConnection: vi.fn(() => Promise.resolve(mockConnection)),
  };
  return {
    getPool: () => mockPool,
  };
});

import { getPool } from '../../utils/database.js';
import * as chatService from '../../server/services/chatService.js';

describe('Chat Service - getMessages', () => {
  let mockConnection;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConnection = await getPool().getConnection();
  });

  it('should reverse messages returned from database (DESC -> ASC)', async () => {
    const conversationId = 'conv-123';
    const userId = 1;

    // Mock participation check
    mockConnection.execute.mockResolvedValueOnce([[{ id: 'part-1' }]]); // Participant check

    // Mock count query
    mockConnection.execute.mockResolvedValueOnce([[{ total: 3 }]]); // Count query

    // Mock messages query (returned in DESC order: Newest First)
    // The database returns them in DESC order because of "ORDER BY created_at DESC"
    const SENDER_FIRST_NAME = 'Test';
    const SENDER_LAST_NAME = 'User';
    const SENDER_DISPLAY_NAME = 'Test User';
    const SENDER_EMAIL = 'test@example.com';
    
    const dbMessages = [
      { 
        id: 'msg-3', 
        content: 'Newest', 
        created_at: '2023-01-03T10:00:00Z',
        sender_id: 1,
        sender_first_name: SENDER_FIRST_NAME,
        sender_last_name: SENDER_LAST_NAME,
        sender_display_name: SENDER_DISPLAY_NAME,
        sender_email: SENDER_EMAIL
      },
      { 
        id: 'msg-2', 
        content: 'Middle', 
        created_at: '2023-01-02T10:00:00Z',
        sender_id: 1,
        sender_first_name: SENDER_FIRST_NAME,
        sender_last_name: SENDER_LAST_NAME,
        sender_display_name: SENDER_DISPLAY_NAME,
        sender_email: SENDER_EMAIL
      },
      { 
        id: 'msg-1', 
        content: 'Oldest', 
        created_at: '2023-01-01T10:00:00Z',
        sender_id: 1,
        sender_first_name: SENDER_FIRST_NAME,
        sender_last_name: SENDER_LAST_NAME,
        sender_display_name: SENDER_DISPLAY_NAME,
        sender_email: SENDER_EMAIL
      },
    ];
    mockConnection.execute.mockResolvedValueOnce([dbMessages]); // Messages query

    // Mock reactions (called for each message in the loop)
    // Since we have 3 messages, this will be called 3 times
    mockConnection.execute.mockResolvedValue([[]]); // Reactions

    const result = await chatService.getMessages(conversationId, userId);

    expect(result.data).toHaveLength(3);
    // The service should have reversed the array to be chronological (ASC)
    // index 0 should be the oldest message (msg-1)
    expect(result.data[0].id).toBe('msg-1'); 
    expect(result.data[0].content).toBe('Oldest');
    
    // index 2 should be the newest message (msg-3)
    expect(result.data[2].id).toBe('msg-3'); 
    expect(result.data[2].content).toBe('Newest');
  });
});

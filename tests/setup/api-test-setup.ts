/**
 * API Test Setup
 * Minimal setup for API integration tests without DOM dependencies
 */

import { vi } from 'vitest'

// Mock environment variables for tests
process.env.NODE_ENV = 'test'
process.env.DB_HOST = 'localhost'
process.env.DB_USER = 'test_user'
process.env.DB_PASSWORD = 'test_password'
process.env.DB_NAME = 'sgs_gita_alumni_test'
process.env.DB_PORT = '3306'

// Mock mysql2 database connections
vi.mock('mysql2/promise', () => ({
  default: {
    createPool: vi.fn(() => ({
      getConnection: vi.fn(() => ({
        execute: vi.fn().mockResolvedValue([[]]),
        query: vi.fn().mockResolvedValue([[]]),
        release: vi.fn(),
      })),
      execute: vi.fn().mockResolvedValue([[]]),
      query: vi.fn().mockResolvedValue([[]]),
      end: vi.fn().mockResolvedValue(undefined),
      config: {
        connectionLimit: 10,
        queueLimit: 0,
      },
      _availableConnections: [],
      _usingConnections: [],
      _waitingClients: [],
      _allConnections: [],
    })),
  },
}))

// Mock uuid
vi.mock('uuid', () => ({
  v4: vi.fn(() => 'test-uuid-' + Math.random().toString(36).substr(2, 9))
}))
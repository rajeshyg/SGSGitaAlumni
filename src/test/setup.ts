import '@testing-library/jest-dom'
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

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock window.ResizeObserver
;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Provide Touch constructor shim for tests that create Touch objects
class MockTouch {
  identifier: number
  target: EventTarget
  clientX: number
  clientY: number
  constructor(init: { identifier: number; target: EventTarget; clientX: number; clientY: number }) {
    this.identifier = init.identifier
    this.target = init.target
    this.clientX = init.clientX
    this.clientY = init.clientY
  }
}

;(globalThis as any).Touch = MockTouch
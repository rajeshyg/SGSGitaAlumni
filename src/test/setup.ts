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

// Mock lucide-react icons - Create mock component factory
const createMockIcon = (name: string) => {
  const MockIcon = () => null;
  MockIcon.displayName = name;
  return MockIcon;
};

vi.mock('lucide-react', () => ({
  // Provide mock implementations for all icons used in components
  Link: createMockIcon('Link'),
  Mail: createMockIcon('Mail'),
  User: createMockIcon('User'),
  Users: createMockIcon('Users'),
  Search: createMockIcon('Search'),
  Plus: createMockIcon('Plus'),
  Edit: createMockIcon('Edit'),
  Trash: createMockIcon('Trash'),
  Check: createMockIcon('Check'),
  X: createMockIcon('X'),
  AlertCircle: createMockIcon('AlertCircle'),
  Info: createMockIcon('Info'),
  ChevronDown: createMockIcon('ChevronDown'),
  ChevronUp: createMockIcon('ChevronUp'),
  ChevronLeft: createMockIcon('ChevronLeft'),
  ChevronRight: createMockIcon('ChevronRight'),
  MoreVertical: createMockIcon('MoreVertical'),
  Settings: createMockIcon('Settings'),
  LogOut: createMockIcon('LogOut'),
  Home: createMockIcon('Home'),
  Bell: createMockIcon('Bell'),
  MessageSquare: createMockIcon('MessageSquare'),
  Calendar: createMockIcon('Calendar'),
  FileText: createMockIcon('FileText'),
  Download: createMockIcon('Download'),
  Upload: createMockIcon('Upload'),
  RefreshCw: createMockIcon('RefreshCw'),
  Eye: createMockIcon('Eye'),
  EyeOff: createMockIcon('EyeOff'),
  Lock: createMockIcon('Lock'),
  Unlock: createMockIcon('Unlock'),
  Shield: createMockIcon('Shield'),
  Star: createMockIcon('Star'),
  Heart: createMockIcon('Heart'),
  Share: createMockIcon('Share'),
  Copy: createMockIcon('Copy'),
  ExternalLink: createMockIcon('ExternalLink'),
  Filter: createMockIcon('Filter'),
  SortAsc: createMockIcon('SortAsc'),
  SortDesc: createMockIcon('SortDesc'),
  ArrowUp: createMockIcon('ArrowUp'),
  ArrowDown: createMockIcon('ArrowDown'),
  ArrowLeft: createMockIcon('ArrowLeft'),
  ArrowRight: createMockIcon('ArrowRight'),
  Loader: createMockIcon('Loader'),
  Loader2: createMockIcon('Loader2'),
  Spinner: createMockIcon('Spinner'),
  GripVertical: createMockIcon('GripVertical'),
  ChevronsUpDown: createMockIcon('ChevronsUpDown'),
}))
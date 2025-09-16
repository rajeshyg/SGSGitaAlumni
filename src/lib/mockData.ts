// Mock data for development
export const mockUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]

export const mockPosts = [
  { id: 1, title: 'Hello World', content: 'This is a test post' },
  { id: 2, title: 'Another Post', content: 'More content here' }
]

export const getMockData = (type: string) => {
  switch (type) {
    case 'users':
      return mockUsers
    case 'posts':
      return mockPosts
    default:
      return []
  }
}

export const MockAPIService = {
  get: (url: string) => Promise.resolve({ data: [] }),
  post: (url: string, data: any) => Promise.resolve({ data }),
  put: (url: string, data: any) => Promise.resolve({ data }),
  delete: (url: string) => Promise.resolve({ data: null }),
  clearData: () => Promise.resolve(true),
  getFileImports: () => Promise.resolve([]),
  loadData: () => Promise.resolve([]),
  updateFileImport: (id: string, updates: any) => Promise.resolve({}),
  exportData: (format: string) => Promise.resolve(new Blob())
}

export const LocalStorageService = {
  get: (key: string) => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set: (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },
  remove: (key: string) => {
    try {
      localStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  },
  clearData: () => {
    try {
      localStorage.clear()
      return true
    } catch {
      return false
    }
  },
  loadData: () => {
    // Mock implementation
    return []
  }
}
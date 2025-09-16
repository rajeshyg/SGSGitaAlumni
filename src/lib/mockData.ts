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
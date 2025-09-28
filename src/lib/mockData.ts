// Mock data for development
// Simple mock dataset for file imports used in tests
const initialFileImports = [
  {
    id: '1',
    filename: 'alumni_list.csv',
    file_type: 'csv',
    uploaded_by: 'admin',
    status: 'pending',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    filename: 'donations_alumni.json',
    file_type: 'json',
    uploaded_by: 'user1',
    status: 'completed',
    created_at: new Date().toISOString()
  }
]

// In-memory store backed by localStorage for persistence in tests
const STORAGE_KEY = 'mock_file_imports'

function ensureInitialData() {
  const existing = LocalStorageService.get(STORAGE_KEY)
  if (!existing || !Array.isArray(existing) || existing.length === 0) {
    LocalStorageService.set(STORAGE_KEY, initialFileImports.slice())
  }
}

export const MockAPIService = {
  async get(url: string) {
    const data = LocalStorageService.loadData()
    return { data }
  },
  async post(_url: string, _data: unknown) {
    return { data: _data }
  },
  async put(_url: string, _data: unknown) {
    return { data: _data }
  },
  async delete(_url: string) {
    return { data: null }
  },
  async clearData() {
    LocalStorageService.clearData()
    return true
  },
  async getFileImports({ page = 0, pageSize = 10, search }: { page?: number; pageSize?: number; search?: string } = {}) {
    ensureInitialData()
    const all = LocalStorageService.loadData()
    let filtered = all
    if (search) {
      const term = search.toLowerCase()
      filtered = all.filter((item: any) => (
        (item.filename || '').toLowerCase().includes(term) ||
        (item.file_type || '').toLowerCase().includes(term) ||
        (item.uploaded_by || '').toLowerCase().includes(term)
      ))
    }

    const total = filtered.length
    const start = page * pageSize
    const data = filtered.slice(start, start + pageSize)

    return { data, total }
  },
  loadData() {
    ensureInitialData()
    return LocalStorageService.get(STORAGE_KEY) || []
  },
  async updateFileImport(id: string, updates: Partial<any>) {
    ensureInitialData()
    const all = LocalStorageService.get(STORAGE_KEY) || []
    const idx = all.findIndex((i: any) => i.id === id)
    if (idx === -1) throw new Error('Not found')
    const updated = { ...all[idx], ...updates }
    all[idx] = updated
    LocalStorageService.set(STORAGE_KEY, all)
    return updated
  },
  async exportData(format: 'csv' | 'json' = 'csv') {
    ensureInitialData()
    const data = LocalStorageService.get(STORAGE_KEY) || []
    if (format === 'json') return data

    // CSV export
    const headers = ['ID', 'Filename', 'FileType', 'UploadedBy', 'Status']
    const lines = data.map((d: any) => `${d.id},${d.filename},${d.file_type},${d.uploaded_by},${d.status}`)
    return `${headers.join(',')}\n${lines.join('\n')}`
  }
}

export const LocalStorageService = {
  get(key: string) {
    try {
      const item = typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null
      return item ? JSON.parse(item) : null
    } catch {
      return null
    }
  },
  set(key: string, value: unknown) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(value))
      }
      return true
    } catch {
      return false
    }
  },
  remove(key: string) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
      return true
    } catch {
      return false
    }
  },
  clearData() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      return true
    } catch {
      return false
    }
  },
  loadData() {
    ensureInitialData()
    return LocalStorageService.get(STORAGE_KEY) || []
  }
}
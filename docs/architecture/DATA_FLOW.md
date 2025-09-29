# Data Flow Architecture

## Overview

This document outlines the data flow patterns, API integration strategies, and state management architecture for the SGSGita Alumni platform, covering both development (mock data) and production (API) environments.

## Data Flow Patterns

### 1. Development Data Flow (Mock Data)

```
User Interaction → Component → Hook → Mock Service → localStorage
                                ↓
                           Component Update ← Cache Layer ← Data Processing
```

#### Mock Data Implementation
```typescript
// Mock data service with localStorage persistence
class MockDataService {
  private cache = new Map<string, any>()
  private readonly STORAGE_KEY = 'alumni_data'

  async getAlumni(filters?: AlumniFilters): Promise<Alumni[]> {
    // Check cache first
    const cacheKey = this.generateCacheKey('alumni', filters)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    // Load from localStorage or generate mock data
    const data = this.loadFromStorage() || this.generateMockData()
    const filtered = this.applyFilters(data, filters)
    
    // Cache the result
    this.cache.set(cacheKey, filtered)
    return filtered
  }

  async saveAlumni(alumni: Alumni): Promise<Alumni> {
    const data = this.loadFromStorage() || []
    const updated = [...data.filter(a => a.id !== alumni.id), alumni]
    
    this.saveToStorage(updated)
    this.invalidateCache()
    
    return alumni
  }

  private loadFromStorage(): Alumni[] | null {
    const stored = localStorage.getItem(this.STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  }

  private saveToStorage(data: Alumni[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  }
}
```

### 2. Production Data Flow (API)

```
User Interaction → Component → Hook → API Service → Express.js API → MySQL Database
                                ↓
                            Component Update ← Cache Layer ← Response Processing

Data Separation Architecture:
├── Alumni Members (Source Data) → alumni_members table
├── App Users (Authenticated) → users table
├── User Profiles (Extended) → user_profiles table
└── Invitations (Access Control) → user_invitations table
```

#### API Service Implementation
```typescript
class APIService {
  private baseURL = process.env.VITE_API_BASE_URL
  private cache = new Map<string, CacheEntry>()

  // Alumni Members (source data from CSV uploads)
  async searchAlumniMembers(query: string = '', limit: number = 50): Promise<AlumniMember[]> {
    const cacheKey = this.generateCacheKey('alumni-members', { query, limit })

    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const response = await fetch(`${this.baseURL}/api/alumni-members?search=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new APIError(`Failed to fetch alumni members: ${response.statusText}`)
    }

    const data = await response.json()
    this.setCache(cacheKey, data)
    return data
  }

  async updateAlumniMember(id: string, updates: Partial<AlumniMember>): Promise<AlumniMember> {
    const response = await fetch(`${this.baseURL}/api/alumni-members/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new APIError(`Failed to update alumni member: ${response.statusText}`)
    }

    const updated = await response.json()
    this.invalidateCache('alumni-members')
    return updated
  }

  // App Users (authenticated platform users)
  async searchAppUsers(query: string = '', limit: number = 50): Promise<AppUser[]> {
    const cacheKey = this.generateCacheKey('app-users', { query, limit })

    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    const response = await fetch(`${this.baseURL}/api/users?search=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: this.getHeaders()
    })

    if (!response.ok) {
      throw new APIError(`Failed to fetch app users: ${response.statusText}`)
    }

    const data = await response.json()
    this.setCache(cacheKey, data)
    return data
  }

  async updateAppUser(id: string, updates: Partial<AppUser>): Promise<AppUser> {
    const response = await fetch(`${this.baseURL}/api/users/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      throw new APIError(`Failed to update app user: ${response.statusText}`)
    }

    const updated = await response.json()
    this.invalidateCache('app-users')
    return updated
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    }
  }
}
```

## State Management Architecture

### 1. Component State Flow

```typescript
// Custom hook for data management
function useAlumniData() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const dataService = useMemo(() => 
    process.env.NODE_ENV === 'development' 
      ? new MockDataService() 
      : new APIService(), 
    []
  )

  const fetchAlumni = useCallback(async (filters?: AlumniFilters) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await dataService.getAlumni(filters)
      setAlumni(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [dataService])

  const saveAlumni = useCallback(async (alumniData: Alumni) => {
    try {
      const saved = await dataService.saveAlumni(alumniData)
      setAlumni(prev => [...prev.filter(a => a.id !== saved.id), saved])
      return saved
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      throw err
    }
  }, [dataService])

  return {
    alumni,
    loading,
    error,
    fetchAlumni,
    saveAlumni,
    refetch: () => fetchAlumni()
  }
}
```

### 2. Global State Management

```typescript
// Context for global application state
interface AppState {
  user: User | null
  theme: 'light' | 'dark'
  notifications: Notification[]
  settings: UserSettings
}

const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<AppAction>
} | null>(null)

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'SET_THEME':
      return { ...state, theme: action.payload }
    case 'ADD_NOTIFICATION':
      return { 
        ...state, 
        notifications: [...state.notifications, action.payload] 
      }
    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      }
    default:
      return state
  }
}
```

## API Integration Patterns

### 1. RESTful API Design

```typescript
// Express.js API routes
app.get('/api/alumni', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, graduationYear } = req.query
    
    const filters = {
      search: search as string,
      graduationYear: graduationYear ? parseInt(graduationYear as string) : undefined,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      }
    }

    const result = await alumniService.getAlumni(filters)
    
    res.json({
      data: result.alumni,
      pagination: {
        page: filters.pagination.page,
        limit: filters.pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.pagination.limit)
      }
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/alumni', async (req, res) => {
  try {
    const alumniData = req.body
    const validation = validateAlumniData(alumniData)
    
    if (!validation.valid) {
      return res.status(400).json({ error: validation.errors })
    }

    const saved = await alumniService.saveAlumni(alumniData)
    res.status(201).json(saved)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})
```

### 2. Error Handling Flow

```typescript
// Centralized error handling
class ErrorHandler {
  static handle(error: Error, context: string): void {
    // Log error
    console.error(`Error in ${context}:`, error)
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      Sentry.captureException(error, { tags: { context } })
    }
    
    // Notify user if appropriate
    if (error instanceof UserFacingError) {
      NotificationService.showError(error.message)
    }
  }
}

// Error boundary for React components
class DataErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    ErrorHandler.handle(error, 'DataErrorBoundary')
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

## Caching Strategy

### 1. Multi-Level Caching

```typescript
interface CacheConfig {
  memory: {
    ttl: number
    maxSize: number
  }
  localStorage: {
    ttl: number
    prefix: string
  }
  api: {
    headers: Record<string, string>
  }
}

class CacheManager {
  private memoryCache = new LRUCache<string, any>({ max: 100 })
  private config: CacheConfig

  async get<T>(key: string): Promise<T | null> {
    // 1. Memory cache (fastest)
    const memoryResult = this.memoryCache.get(key)
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data
    }

    // 2. localStorage cache
    const localResult = this.getFromLocalStorage(key)
    if (localResult && !this.isExpired(localResult)) {
      this.memoryCache.set(key, localResult)
      return localResult.data
    }

    // 3. API cache headers (handled by browser/CDN)
    return null
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const entry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.memory.ttl
    }

    this.memoryCache.set(key, entry)
    this.setToLocalStorage(key, entry)
  }

  invalidate(pattern: string): void {
    // Invalidate memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key)
      }
    }

    // Invalidate localStorage
    this.clearLocalStoragePattern(pattern)
  }
}
```

### 2. Cache Invalidation Strategies

```typescript
// Event-driven cache invalidation
class CacheInvalidator {
  private eventBus: EventEmitter

  constructor(eventBus: EventEmitter) {
    this.eventBus = eventBus
    this.setupListeners()
  }

  private setupListeners(): void {
    this.eventBus.on('alumni:created', () => {
      CacheManager.invalidate('alumni')
    })

    this.eventBus.on('alumni:updated', (id: string) => {
      CacheManager.invalidate(`alumni:${id}`)
      CacheManager.invalidate('alumni:list')
    })

    this.eventBus.on('user:logout', () => {
      CacheManager.clear()
    })
  }
}
```

## Data Validation & Processing

### 1. Input Validation

```typescript
import { z } from 'zod'

const AlumniSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  graduationYear: z.number().min(1950).max(new Date().getFullYear()),
  major: z.string().min(1).max(100),
  currentPosition: z.string().max(200).optional(),
  company: z.string().max(100).optional(),
  linkedinUrl: z.string().url().optional()
})

function validateAlumniData(data: unknown): ValidationResult {
  try {
    const validated = AlumniSchema.parse(data)
    return { valid: true, data: validated }
  } catch (error) {
    return { 
      valid: false, 
      errors: error instanceof z.ZodError ? error.errors : ['Invalid data'] 
    }
  }
}
```

### 2. Data Transformation

```typescript
// Transform data between different formats
class DataTransformer {
  static toAPI(alumni: Alumni): APIAlumni {
    return {
      id: alumni.id,
      first_name: alumni.firstName,
      last_name: alumni.lastName,
      email: alumni.email,
      graduation_year: alumni.graduationYear,
      major: alumni.major,
      current_position: alumni.currentPosition,
      company: alumni.company,
      linkedin_url: alumni.linkedinUrl
    }
  }

  static fromAPI(apiAlumni: APIAlumni): Alumni {
    return {
      id: apiAlumni.id,
      firstName: apiAlumni.first_name,
      lastName: apiAlumni.last_name,
      email: apiAlumni.email,
      graduationYear: apiAlumni.graduation_year,
      major: apiAlumni.major,
      currentPosition: apiAlumni.current_position,
      company: apiAlumni.company,
      linkedinUrl: apiAlumni.linkedin_url
    }
  }
}
```

This data flow architecture ensures efficient, reliable, and scalable data management throughout the SGSGita Alumni platform, supporting both development and production environments seamlessly.

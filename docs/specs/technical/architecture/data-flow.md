---
version: "1.0"
status: implemented
last_updated: 2025-11-23
applies_to: frontend-backend
---

# Data Flow Architecture

## Overview

This document outlines the data flow patterns, API integration strategies, and state management architecture for the SGS Gita Alumni platform.

## Data Flow Patterns

### Request-Response Flow

```
User Interaction → Component → Hook → API Service → Express.js API → MySQL Database
                                ↓
                            Component Update ← Cache Layer ← Response Processing
```

### Data Entity Flow

```
Data Separation Architecture:
├── Alumni Members (Source Data) → alumni_members table
├── App Users (Authenticated) → users table
├── User Profiles (Extended) → user_profiles table
└── Invitations (Access Control) → user_invitations table
```

## Frontend Data Management

### Component State Flow

**Status**: Implemented

```typescript
// Custom hook pattern for data management
// Implementation: src/hooks/

function useAlumniData() {
  const [alumni, setAlumni] = useState<Alumni[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAlumni = useCallback(async (filters?: AlumniFilters) => {
    setLoading(true)
    setError(null)

    try {
      const data = await apiService.getAlumni(filters)
      setAlumni(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  return { alumni, loading, error, fetchAlumni }
}
```

### Global State Management

**Status**: Implemented

```typescript
// Context-based global state
// Implementation: src/contexts/

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
```

## API Integration

### API Service Layer

**Status**: Implemented

**Implementation Files**:
- `/src/services/APIService.ts` - Main API service
- `/src/lib/api.ts` - API client
- `/src/lib/security/SecureAPIClient.ts` - Secure client wrapper

```typescript
class APIService {
  private baseURL = process.env.VITE_API_BASE_URL
  private cache = new Map<string, CacheEntry>()

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

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.getAuthToken()}`
    }
  }
}
```

### Backend API Routes

**Status**: Implemented

**Implementation**: `/routes/*.js`

```javascript
// RESTful API pattern
// Implementation: routes/alumni-members.js

app.get('/api/alumni-members', async (req, res) => {
  const { page = 1, limit = 20, search } = req.query

  const filters = {
    search: search as string,
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
})
```

## Caching Strategy

### Multi-Level Caching

**Status**: Implemented

```typescript
// Implementation: Various service files

class CacheManager {
  private memoryCache = new Map<string, CacheEntry>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    // 1. Memory cache (fastest)
    const memoryEntry = this.memoryCache.get(key)
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data
    }

    // 2. localStorage cache
    const localEntry = this.getFromLocalStorage(key)
    if (localEntry && !this.isExpired(localEntry)) {
      this.memoryCache.set(key, localEntry)
      return localEntry.data
    }

    return null
  }

  async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: this.TTL
    }

    this.memoryCache.set(key, entry)
    this.setToLocalStorage(key, entry)
  }
}
```

### Cache Invalidation

| Strategy | Description | Use Case |
|----------|-------------|----------|
| Time-Based | 5-minute TTL for dynamic data | Default caching |
| Event-Based | Invalidate on data mutations | After CRUD operations |
| Version-Based | Cache busting for deployments | Asset caching |
| Selective | Granular cache key management | Specific entity updates |

## Data Validation

### Input Validation (Zod)

**Status**: Implemented

**Implementation**: Various route and service files

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
  company: z.string().max(100).optional()
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

### Data Transformation

```typescript
// Transform between frontend and API formats
class DataTransformer {
  static toAPI(alumni: Alumni): APIAlumni {
    return {
      id: alumni.id,
      first_name: alumni.firstName,
      last_name: alumni.lastName,
      email: alumni.email,
      graduation_year: alumni.graduationYear
    }
  }

  static fromAPI(apiAlumni: APIAlumni): Alumni {
    return {
      id: apiAlumni.id,
      firstName: apiAlumni.first_name,
      lastName: apiAlumni.last_name,
      email: apiAlumni.email,
      graduationYear: apiAlumni.graduation_year
    }
  }
}
```

## Database Connection Management

### Connection Pooling

**Status**: Implemented

**Implementation**: `/config/database.js` or `/server.js`

```javascript
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  acquireTimeout: 60000,
  timeout: 60000
})
```

### Transaction Handling

```javascript
// Proper transaction pattern
const connection = await pool.getConnection()
try {
  await connection.beginTransaction()
  // operations
  await connection.commit()
} catch (error) {
  await connection.rollback()
  throw error
} finally {
  connection.release()
}
```

## Real-time Data (Socket.IO)

**Status**: Implemented

**Implementation**: `/server.js`, `/server/services/chatService.js`

```javascript
// Socket.IO for real-time features
// Chat, notifications, live updates

io.on('connection', (socket) => {
  // Handle real-time events
  socket.on('message', handleMessage)
  socket.on('typing', handleTyping)
})
```

## Error Flow

See [Error Handling](./error-handling.md) for detailed error flow patterns.

```
API Error → Service Layer → API Client → Component → User Notification
     ↓
 Logging → Monitoring
```

## Performance Considerations

### Data Fetching Optimization

- **Pagination**: Default 20 items, max 100
- **Selective Fields**: Request only needed fields
- **Batch Requests**: Combine related queries
- **Debouncing**: Debounce search inputs

### Memory Management

- **Cache Limits**: LRU cache with max size
- **Cleanup**: Clear stale cache entries
- **Memoization**: React.memo for expensive components

## Related Specifications

- [API Design](./api-design.md) - API standards and endpoints
- [Error Handling](./error-handling.md) - Error flow patterns
- [Performance](./performance.md) - Performance optimization

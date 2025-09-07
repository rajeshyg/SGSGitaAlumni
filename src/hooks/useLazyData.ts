import { useState, useEffect, useCallback, useRef } from 'react'
import { APIService, type FileImport, type PaginationParams } from '../services/APIService'

// Cache interface
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number // Time to live in milliseconds
}

interface Cache<T> {
  [key: string]: CacheEntry<T>
}

// Simple in-memory cache with TTL
class DataCache {
  private static instance: DataCache
  private cache: Cache<any> = {}
  private readonly DEFAULT_TTL = 5 * 60 * 1000 // 5 minutes

  static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache()
    }
    return DataCache.instance
  }

  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache[key] = {
      data,
      timestamp: Date.now(),
      ttl
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache[key]
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl) {
      delete this.cache[key]
      return null
    }

    return entry.data
  }

  clear(): void {
    this.cache = {}
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    Object.keys(this.cache).forEach(key => {
      if (now - this.cache[key].timestamp > this.cache[key].ttl) {
        delete this.cache[key]
      }
    })
  }
}

export interface LazyDataState<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  total: number
  page: number
  pageSize: number
}

export interface UseLazyDataOptions {
  pageSize?: number
  enableCache?: boolean
  cacheTtl?: number
  autoLoad?: boolean
}

export function useLazyData(options: UseLazyDataOptions = {}) {
  const {
    pageSize = 10,
    enableCache = true,
    cacheTtl = 5 * 60 * 1000, // 5 minutes
    autoLoad = true
  } = options

  const [state, setState] = useState<LazyDataState<FileImport>>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
    total: 0,
    page: 0,
    pageSize
  })

  const [searchTerm, setSearchTerm] = useState('')
  const cache = DataCache.getInstance()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Generate cache key based on current parameters
  const getCacheKey = useCallback((page: number, search: string) => {
    return `fileImports_page${page}_search${search}_size${pageSize}`
  }, [pageSize])

  // Load data with caching and lazy loading
  const loadData = useCallback(async (page: number = 0, search: string = '', append: boolean = false) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const cacheKey = getCacheKey(page, search)

      // Check cache first if enabled
      if (enableCache && !append) {
        const cachedData = cache.get<LazyDataState<FileImport>>(cacheKey)
        if (cachedData) {
          setState(prev => ({
            ...prev,
            ...cachedData,
            loading: false
          }))
          return
        }
      }

      const params: PaginationParams = {
        page,
        pageSize,
        search: search || undefined
      }

      const response = await APIService.getFileImports(params)

      const newState: LazyDataState<FileImport> = {
        data: append ? [...state.data, ...response.data] : response.data,
        loading: false,
        error: null,
        hasMore: (page + 1) * pageSize < response.total,
        total: response.total,
        page,
        pageSize
      }

      setState(newState)

      // Cache the result if enabled
      if (enableCache) {
        cache.set(cacheKey, newState, cacheTtl)
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't update state
        return
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }, [pageSize, enableCache, cacheTtl, getCacheKey, state.data, cache])

  // Load next page (for infinite scroll)
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      loadData(state.page + 1, searchTerm, true)
    }
  }, [state.loading, state.hasMore, state.page, searchTerm, loadData])

  // Refresh current data
  const refresh = useCallback(() => {
    cache.cleanup() // Clean up expired cache entries
    loadData(0, searchTerm, false)
  }, [loadData, searchTerm, cache])

  // Search with debouncing
  const search = useCallback((term: string) => {
    setSearchTerm(term)
    loadData(0, term, false)
  }, [loadData])

  // Clear cache
  const clearCache = useCallback(() => {
    cache.clear()
  }, [cache])

  // Auto load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadData(0, '', false)
    }

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [autoLoad, loadData])

  return {
    ...state,
    loadMore,
    refresh,
    search,
    clearCache,
    // Computed properties
    isEmpty: state.data.length === 0 && !state.loading,
    hasError: state.error !== null
  }
}

// Hook for lazy loading individual items
export function useLazyItem(id: string) {
  const [item, setItem] = useState<FileImport | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadItem = useCallback(async () => {
    if (!id) return

    setLoading(true)
    setError(null)

    try {
      // For now, simulate loading an individual item
      // In a real implementation, this would call a specific API endpoint
      await new Promise(resolve => setTimeout(resolve, 300))

      // Mock item data - in real app, this would come from API
      const mockItem: FileImport = {
        id,
        filename: `file_${id}.csv`,
        file_type: 'CSV',
        upload_date: new Date().toISOString(),
        status: 'completed',
        records_count: Math.floor(Math.random() * 1000) + 100,
        processed_records: Math.floor(Math.random() * 1000) + 100,
        errors_count: Math.floor(Math.random() * 10),
        uploaded_by: 'system',
        file_size: `${Math.floor(Math.random() * 10) + 1}MB`
      }

      setItem(mockItem)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load item')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadItem()
  }, [loadItem])

  return { item, loading, error, refetch: loadItem }
}
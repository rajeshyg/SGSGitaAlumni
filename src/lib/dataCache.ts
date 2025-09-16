// Data cache utilities
export const dataCache = new Map()

export const setCache = (key: string, value: unknown) => {
  dataCache.set(key, value)
}

export const getCache = (key: string) => {
  return dataCache.get(key)
}

export const clearCache = () => {
  dataCache.clear()
}

// DataCache class for the hook
export class DataCache {
  private static instance: DataCache
  private cache = new Map()

  static getInstance(): DataCache {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache()
    }
    return DataCache.instance
  }

  get(key: string) {
    return this.cache.get(key)
  }

  set(key: string, value: unknown) {
    this.cache.set(key, value)
  }

  clear() {
    this.cache.clear()
  }
}

// Types
export interface LazyDataState<T> {
  data: T[]
  loading: boolean
  error: string | null
  hasMore: boolean
  total: number
  page: number
  pageSize: number
}

// Functions
export async function loadDataWithCache<T>(
  page: number,
  search: string,
  pageSize: number,
  append: boolean,
  enableCache: boolean,
  cacheTtl: number,
  currentData: T[],
  cache: DataCache,
  setState: (state: LazyDataState<T>) => void
) {
  // Mock implementation
  setState({
    data: currentData,
    loading: false,
    error: null,
    hasMore: false,
    total: 0,
    page,
    pageSize
  })
}

export function createActionCallbacks<T>(
  state: LazyDataState<T>,
  searchTerm: string,
  loadData: (page: number, search: string, append: boolean) => void,
  cache: DataCache
) {
  return {
    loadMore: () => loadData(state.page + 1, searchTerm, true),
    refresh: () => loadData(0, searchTerm, false),
    search: (term: string) => loadData(0, term, false),
    clearCache: () => cache.clear()
  }
}
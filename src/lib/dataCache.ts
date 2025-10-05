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
  console.log('[loadDataWithCache] Starting load for page:', page, 'search:', search);
  try {
    // Import APIService dynamically to avoid circular dependencies
    const { APIService } = await import('../services/APIService');

    // Call the actual API
    const params = {
      page: page + 1, // API uses 1-based pagination
      pageSize,
      search: search || undefined
    };

    console.log('[loadDataWithCache] Calling APIService.getFileImports with params:', params);
    const response = await APIService.getFileImports(params);
    console.log('[loadDataWithCache] API response received:', { dataLength: response.data?.length, total: response.total });

    const newData = append ? [...currentData, ...(response.data as T[])] : (response.data as T[]);
    const hasMore = response.data.length === pageSize && (page + 1) * pageSize < response.total;

    console.log('[loadDataWithCache] Setting state with loading: false, data length:', newData.length);
    setState({
      data: newData,
      loading: false,
      error: null,
      hasMore,
      total: response.total,
      page,
      pageSize
    });

  } catch (error) {
    console.error('[loadDataWithCache] Error occurred:', error);
    setState({
      data: currentData,
      loading: false,
      error: error instanceof Error ? error.message : 'Failed to load data',
      hasMore: false,
      total: currentData.length,
      page,
      pageSize
    });
  }
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
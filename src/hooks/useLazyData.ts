import { useState, useEffect, useCallback, useRef } from 'react'
import { type FileImport } from '../services/APIService'
import {
  DataCache,
  type LazyDataState,
  loadDataWithCache,
  createActionCallbacks
} from '../lib/dataCache'

export interface UseLazyDataOptions {
  pageSize?: number
  enableCache?: boolean
  cacheTtl?: number
  autoLoad?: boolean
}




export function useLazyData(options: UseLazyDataOptions = {}) {
  const { pageSize = 10, enableCache = true, cacheTtl = 5 * 60 * 1000, autoLoad = true } = options
  const [state, setState] = useState<LazyDataState<FileImport>>({ data: [], loading: false, error: null, hasMore: true, total: 0, page: 0, pageSize })
  const [searchTerm, setSearchTerm] = useState('')
  const cache = DataCache.getInstance()
  const abortControllerRef = useRef<AbortController | null>(null)

  const loadData = useCallback(async (page: number = 0, search: string = '', append: boolean = false) => {
    if (abortControllerRef.current) abortControllerRef.current.abort()
    abortControllerRef.current = new AbortController()
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      await loadDataWithCache(page, search, pageSize, append, enableCache, cacheTtl, state.data, cache, setState)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return
      setState(prev => ({ ...prev, loading: false, error: error instanceof Error ? error.message : 'Failed to load data' }))
    }
  }, [pageSize, enableCache, cacheTtl, cache])

  const { loadMore, refresh, search: searchAction, clearCache } = createActionCallbacks(state, searchTerm, loadData, cache)
  const search = useCallback((term: string) => { setSearchTerm(term); searchAction(term) }, [searchAction])

  useEffect(() => {
    if (autoLoad) loadData(0, '', false)
    return () => { if (abortControllerRef.current) abortControllerRef.current.abort() }
  }, [autoLoad, loadData])

  return { ...state, loadMore, refresh, search, clearCache, isEmpty: !state.data.length && !state.loading, hasError: !!state.error }
}

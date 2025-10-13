/**
 * useAlumniDirectory Hook
 * Custom React hook for managing alumni directory state and operations
 */

import { useState, useEffect, useCallback } from 'react';
import { alumniDirectoryService } from '../services/alumniDirectoryService';
import type {
  AlumniMember,
  DirectoryPagination,
  DirectoryFilters,
  DirectoryParams
} from '../types/directory';

export interface UseAlumniDirectoryResult {
  data: AlumniMember[];
  pagination: DirectoryPagination | null;
  filters: DirectoryFilters | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
  setSearch: (query: string) => void;
  setGraduationYear: (year: number | undefined) => void;
  setDepartment: (dept: string | undefined) => void;
  setSortBy: (sortBy: 'name' | 'graduationYear' | 'recent') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
}

/**
 * Custom hook for alumni directory data fetching and state management
 * @param initialParams Initial query parameters
 * @returns Directory data, state, and control functions
 */
export function useAlumniDirectory(initialParams: DirectoryParams = {}): UseAlumniDirectoryResult {
  const [data, setData] = useState<AlumniMember[]>([]);
  const [pagination, setPagination] = useState<DirectoryPagination | null>(null);
  const [availableFilters, setAvailableFilters] = useState<DirectoryFilters | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const [params, setParams] = useState<DirectoryParams>({
    page: initialParams.page || 1,
    perPage: initialParams.perPage || 20,
    q: initialParams.q || '',
    graduationYear: initialParams.graduationYear,
    department: initialParams.department,
    sortBy: initialParams.sortBy || 'name',
    sortOrder: initialParams.sortOrder || 'asc'
  });

  const fetchDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await alumniDirectoryService.getDirectory(params);

      if (response.success) {
        setData(response.data);
        setPagination(response.pagination);
        setAvailableFilters(response.filters);
      } else {
        throw new Error('Failed to fetch directory data');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      console.error('[useAlumniDirectory] Error fetching directory:', error);
    } finally {
      setLoading(false);
    }
  }, [params]);

  // Fetch data when params change
  useEffect(() => {
    fetchDirectory();
  }, [fetchDirectory]);

  // Control functions
  const setPage = useCallback((page: number) => {
    setParams(prev => ({ ...prev, page }));
  }, []);

  const setPerPage = useCallback((perPage: number) => {
    setParams(prev => ({ ...prev, perPage, page: 1 })); // Reset to page 1 when changing per page
  }, []);

  const setSearch = useCallback((q: string) => {
    setParams(prev => ({ ...prev, q, page: 1 })); // Reset to page 1 when searching
  }, []);

  const setGraduationYear = useCallback((graduationYear: number | undefined) => {
    setParams(prev => ({ ...prev, graduationYear, page: 1 }));
  }, []);

  const setDepartment = useCallback((department: string | undefined) => {
    setParams(prev => ({ ...prev, department, page: 1 }));
  }, []);

  const setSortBy = useCallback((sortBy: 'name' | 'graduationYear' | 'recent') => {
    setParams(prev => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: 'asc' | 'desc') => {
    setParams(prev => ({ ...prev, sortOrder }));
  }, []);

  const refetch = useCallback(async () => {
    await fetchDirectory();
  }, [fetchDirectory]);

  return {
    data,
    pagination,
    filters: availableFilters,
    loading,
    error,
    refetch,
    setPage,
    setPerPage,
    setSearch,
    setGraduationYear,
    setDepartment,
    setSortBy,
    setSortOrder
  };
}

export default useAlumniDirectory;

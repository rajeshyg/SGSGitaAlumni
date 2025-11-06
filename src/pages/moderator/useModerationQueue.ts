/**
 * Custom hook for moderation queue management
 */

import { useState, useCallback } from 'react';
import type { QueuePosting, QueueStats, QueueFiltersType } from '../../types/moderation';

// Utility functions
const buildQueryParams = (filters: QueueFiltersType) => {
  const params = new URLSearchParams();
  params.append('page', filters.page.toString());
  params.append('limit', filters.limit.toString());
  if (filters.domain) params.append('domain', filters.domain);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  params.append('sortBy', filters.sortBy);
  return params;
};

const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}`
});

const getInitialFilters = (): QueueFiltersType => ({
  page: 1,
  limit: 20,
  domain: undefined,
  status: undefined,
  search: '',
  sortBy: 'oldest'
});

const getInitialPagination = () => ({
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  hasNextPage: false,
  hasPreviousPage: false
});

export function useModerationQueue() {
  const [postings, setPostings] = useState<QueuePosting[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<QueueFiltersType>(getInitialFilters());
  const [pagination, setPagination] = useState(getInitialPagination());

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = buildQueryParams(filters);
      const response = await fetch(`/api/moderation/queue?${params}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch moderation queue');
      }

      const data = await response.json();

      if (data.success) {
        setPostings(data.data.postings);
        setStats(data.data.stats);
        setPagination(data.data.pagination);
      } else {
        throw new Error(data.error || 'Failed to fetch queue');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load moderation queue');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return { postings, stats, loading, error, filters, setFilters, pagination, fetchQueue };
}
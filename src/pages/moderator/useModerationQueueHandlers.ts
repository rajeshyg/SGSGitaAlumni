/**
 * Moderation Queue Event Handlers Hook
 *
 * Custom hook for managing event handlers in the moderation queue page
 */

import { useState, useCallback } from 'react';
import { useModerationQueue } from './useModerationQueue';
import type { QueueFiltersType } from '../../types/moderation';

export function useModerationQueueHandlers() {
  const [selectedPosting, setSelectedPosting] = useState<string | null>(null);

  const {
    setFilters,
    fetchQueue
  } = useModerationQueue();

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<QueueFiltersType>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  }, [setFilters]);

  // Handle pagination
  const handlePageChange = useCallback((newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [setFilters]);

  // Handle posting click
  const handlePostingClick = useCallback((postingId: string) => {
    setSelectedPosting(postingId);
  }, []);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setSelectedPosting(null);
  }, []);

  // Handle moderation action completed
  const handleModerationComplete = useCallback(() => {
    setSelectedPosting(null);
    fetchQueue(); // Refresh the queue
  }, [fetchQueue]);

  return {
    selectedPosting,
    handleFilterChange,
    handlePageChange,
    handlePostingClick,
    handleModalClose,
    handleModerationComplete
  };
}
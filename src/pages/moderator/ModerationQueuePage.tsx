/**
 * Moderation Queue Page
 *
 * Main page for moderators to review pending postings
 * Features:
 * - Stats dashboard showing queue metrics
 * - Filters (domain, status, search)
 * - Sort controls (oldest, newest, urgent)
 * - Pagination
 * - Posting review modal
 *
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

import { useEffect } from 'react';
import { ModerationQueueLayout } from './ModerationQueueLayout';
import { useModerationQueue } from './useModerationQueue';
import { useModerationQueueHandlers } from './useModerationQueueHandlers';

export function ModerationQueuePage() {
  const {
    postings,
    stats,
    loading,
    error,
    filters,
    pagination,
    fetchQueue
  } = useModerationQueue();

  const {
    selectedPosting,
    handleFilterChange,
    handlePageChange,
    handlePostingClick,
    handleModalClose,
    handleModerationComplete
  } = useModerationQueueHandlers();

  // Fetch queue when filters change
  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return (
    <ModerationQueueLayout
      postings={postings}
      stats={stats}
      loading={loading}
      error={error}
      filters={filters}
      pagination={pagination}
      selectedPosting={selectedPosting}
      onRefresh={fetchQueue}
      onFilterChange={handleFilterChange}
      onPostingClick={handlePostingClick}
      onPageChange={handlePageChange}
      onModalClose={handleModalClose}
      onModerationComplete={handleModerationComplete}
    />
  );
}
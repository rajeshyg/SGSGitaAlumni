/**
 * Moderation Queue Content Component
 *
 * Main content area for the moderation queue page
 */

import { ModerationStats } from '../../components/moderation/ModerationStats';
import { QueueFilters } from '../../components/moderation/QueueFilters';
import { PostingQueueList } from '../../components/moderation/PostingQueueList';
import { ModerationQueueError } from './ModerationQueueError';
import { ModerationQueuePagination } from './ModerationQueuePagination';
import type { QueuePosting, QueueStats, QueueFiltersType } from '../../types/moderation';

interface ModerationQueueContentProps {
  postings: QueuePosting[];
  stats: QueueStats | null;
  loading: boolean;
  error: string | null;
  filters: QueueFiltersType;
  onFilterChange: (filters: Partial<QueueFiltersType>) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPostingClick: (postingId: string) => void;
  onPageChange: (page: number) => void;
}

export function ModerationQueueContent({
  postings,
  stats,
  loading,
  error,
  filters,
  onFilterChange,
  pagination,
  onPostingClick,
  onPageChange
}: ModerationQueueContentProps) {
  return (
    <div className="space-y-6">
      {/* Stats Dashboard */}
      {stats && <ModerationStats stats={stats} />}

      {/* Filters */}
      <QueueFilters
        filters={filters}
        onFilterChange={onFilterChange}
      />

      {/* Error Message */}
      {error && <ModerationQueueError error={error} />}

      {/* Queue List */}
      <PostingQueueList
        postings={postings}
        loading={loading}
        onPostingClick={onPostingClick}
      />

      {/* Pagination */}
      <ModerationQueuePagination
        loading={loading}
        postingsCount={postings.length}
        filters={filters}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </div>
  );
}
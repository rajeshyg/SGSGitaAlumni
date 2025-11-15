/**
 * Moderation Queue Layout Component
 *
 * Layout wrapper for the moderation queue page
 */

import { ModerationQueueHeader } from './ModerationQueueHeader';
import { ModerationQueueContent } from './ModerationQueueContent';
import { ModerationQueueModal } from './ModerationQueueModal';
import type { QueuePosting, QueueStats, QueueFiltersType } from '../../types/moderation';

interface ModerationQueueLayoutProps {
  postings: QueuePosting[];
  stats: QueueStats | null;
  loading: boolean;
  error: string | null;
  filters: QueueFiltersType;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  selectedPosting: string | null;
  onRefresh: () => void;
  onFilterChange: (filters: Partial<QueueFiltersType>) => void;
  onPostingClick: (postingId: string) => void;
  onPageChange: (page: number) => void;
  onModalClose: () => void;
  onModerationComplete: () => void;
}

export function ModerationQueueLayout({
  postings,
  stats,
  loading,
  error,
  filters,
  pagination,
  selectedPosting,
  onRefresh,
  onFilterChange,
  onPostingClick,
  onPageChange,
  onModalClose,
  onModerationComplete
}: ModerationQueueLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModerationQueueHeader
        loading={loading}
        onRefresh={onRefresh}
        pendingCount={stats?.pending_count}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModerationQueueContent
          postings={postings}
          stats={stats}
          loading={loading}
          error={error}
          filters={filters}
          onFilterChange={onFilterChange}
          pagination={pagination}
          onPostingClick={onPostingClick}
          onPageChange={onPageChange}
        />
      </div>

      <ModerationQueueModal
        selectedPosting={selectedPosting}
        onClose={onModalClose}
        onModerationComplete={onModerationComplete}
      />
    </div>
  );
}
/**
 * Moderation Queue Pagination Component
 *
 * Pagination controls for the moderation queue
 */

import { MobilePagination } from './MobilePagination';
import { DesktopPagination } from './DesktopPagination';
import type { QueueFiltersType } from '../../types/moderation';

interface ModerationQueuePaginationProps {
  loading: boolean;
  postingsCount: number;
  filters: QueueFiltersType;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  onPageChange: (page: number) => void;
}

export function ModerationQueuePagination({
  loading,
  postingsCount,
  filters,
  pagination,
  onPageChange
}: ModerationQueuePaginationProps) {
  if (loading || postingsCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-border bg-card px-4 py-3 sm:px-6 rounded-lg">
      <MobilePagination
        currentPage={pagination.currentPage}
        hasPreviousPage={pagination.hasPreviousPage}
        hasNextPage={pagination.hasNextPage}
        onPageChange={onPageChange}
      />

      <DesktopPagination
        filters={filters}
        pagination={pagination}
        onPageChange={onPageChange}
      />
    </div>
  );
}
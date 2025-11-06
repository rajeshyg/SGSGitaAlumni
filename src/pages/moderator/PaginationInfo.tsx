/**
 * Pagination Info Component
 *
 * Shows current page information and result counts
 */

import type { QueueFiltersType } from '../../types/moderation';

interface PaginationInfoProps {
  filters: QueueFiltersType;
  pagination: {
    currentPage: number;
    totalItems: number;
  };
}

export function PaginationInfo({ filters, pagination }: PaginationInfoProps) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">
        Showing{' '}
        <span className="font-medium">
          {(pagination.currentPage - 1) * filters.limit + 1}
        </span>{' '}
        to{' '}
        <span className="font-medium">
          {Math.min(pagination.currentPage * filters.limit, pagination.totalItems)}
        </span>{' '}
        of{' '}
        <span className="font-medium">{pagination.totalItems}</span>{' '}
        results
      </p>
    </div>
  );
}
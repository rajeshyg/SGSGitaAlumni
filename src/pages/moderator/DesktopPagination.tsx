/**
 * Desktop Pagination Component
 *
 * Desktop-specific pagination controls with page numbers
 */

import { PaginationInfo } from './PaginationInfo';
import { PageNumbers } from './PageNumbers';
import type { QueueFiltersType } from '../../types/moderation';

interface DesktopPaginationProps {
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

export function DesktopPagination({
  filters,
  pagination,
  onPageChange
}: DesktopPaginationProps) {
  return (
    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <PaginationInfo filters={filters} pagination={pagination} />

      <div>
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPreviousPage}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-foreground ring-1 ring-inset ring-border hover:bg-accent focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Previous</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>

          <PageNumbers
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
          />

          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-foreground ring-1 ring-inset ring-border hover:bg-accent focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="sr-only">Next</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}
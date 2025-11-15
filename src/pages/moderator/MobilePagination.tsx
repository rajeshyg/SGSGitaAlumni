/**
 * Mobile Pagination Component
 *
 * Mobile-specific pagination controls
 */

interface MobilePaginationProps {
  currentPage: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export function MobilePagination({
  currentPage,
  hasPreviousPage,
  hasNextPage,
  onPageChange
}: MobilePaginationProps) {
  return (
    <div className="flex flex-1 justify-between sm:hidden">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPreviousPage}
        className="relative inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNextPage}
        className="relative ml-3 inline-flex items-center px-4 py-2 border border-border text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
}
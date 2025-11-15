/**
 * Page Numbers Component
 *
 * Page number buttons for pagination
 */

interface PageNumbersProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNumbers({ currentPage, totalPages, onPageChange }: PageNumbersProps) {
  return (
    <>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        const pageNum = currentPage <= 3
          ? i + 1
          : currentPage + i - 2;

        if (pageNum > totalPages) return null;

        return (
          <button
            key={pageNum}
            onClick={() => onPageChange(pageNum)}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
              pageNum === currentPage
                ? 'z-10 bg-primary text-primary-foreground focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
                : 'text-foreground ring-1 ring-inset ring-border hover:bg-accent focus:z-20 focus:outline-offset-0'
            }`}
          >
            {pageNum}
          </button>
        );
      })}
    </>
  );
}
import * as React from "react"
import { Button } from "./button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"

interface TablePaginationProps {
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  className?: string
}

export function TablePagination({
  pagination,
  onPageChange,
  className
}: TablePaginationProps) {
  const { page, pageSize, total, totalPages } = pagination

  if (totalPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (page > 0) {
      onPageChange(page - 1)
    }
  }

  const handleNext = () => {
    if (page < totalPages - 1) {
      onPageChange(page + 1)
    }
  }

  const startItem = page * pageSize + 1
  const endItem = Math.min((page + 1) * pageSize, total)

  return (
    <div className={cn("flex items-center justify-between space-x-2 py-4", className)}>
      <div className="flex-1 text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {total} results
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={page === 0}
          aria-label={`Go to previous page, page ${page}`}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground min-w-[80px] text-center">
          Page {page + 1} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={page >= totalPages - 1}
          aria-label={`Go to next page, page ${page + 2}`}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
import type { CSSProperties } from "react"
import type { Column } from "@tanstack/react-table"

// Constants for repeated strings
export const HOVER_OPACITY_CLASS = "opacity-0 group-hover:opacity-100 transition-opacity"
export const ICON_SIZE_CLASS = "h-3 w-3"
export const MUTED_BACKGROUND = "hsl(var(--muted))"
export const BACKGROUND_COLOR = "hsl(var(--background))"

// Helper functions to reduce complexity
function getBoxShadow<T>(column: Column<T, unknown>): string | undefined {
  const isPinned = column.getIsPinned()
  const isLastLeft = isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRight = isPinned === 'right' && column.getIsFirstColumn('right')

  if (isLastLeft || isFirstRight) {
    return 'var(--table-frozen-shadow)'
  }
  return undefined
}

function getPositionStyles<T>(column: Column<T, unknown>) {
  const isPinned = column.getIsPinned()

  return {
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: (isPinned ? 'sticky' : 'relative') as CSSProperties['position'],
    zIndex: isPinned ? 20 : 0,
  }
}

function getBackgroundColor<T>(column: Column<T, unknown>): string | undefined {
  const isPinned = column.getIsPinned()
  return isPinned && column.id !== 'select' ? 'hsl(var(--muted))' : undefined
}

// Common pinning styles for frozen columns (based on TanStack implementation)
export function getCommonPinningStyles<T>(column: Column<T, unknown>): CSSProperties {
  return {
    boxShadow: getBoxShadow(column),
    width: column.getSize(),
    backgroundColor: getBackgroundColor(column),
    ...getPositionStyles(column),
  }
}

// Export functionality for table data
export function exportTableToCSV(table: { getAllColumns(): unknown[], getRowModel(): { rows: unknown[] } }, exportFilename: string) {
  const headers = (table.getAllColumns() as { getIsVisible(): boolean, id: string, columnDef: { header: string } }[])
    .filter((col) => col.getIsVisible() && col.id !== 'select')
    .map((col) => col.columnDef.header)
    .join(',')

  const rows = (table.getRowModel().rows as { getVisibleCells(): { column: { id: string }, getValue(): unknown }[] }[])
    .map((row) =>
      row.getVisibleCells()
        .filter((cell) => cell.column.id !== 'select')
        .map((cell) => {
          const value = cell.getValue()
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : String(value)
        })
        .join(',')
    )
    .join('\n')

  const csv = `${headers}\n${rows}`
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = `${exportFilename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
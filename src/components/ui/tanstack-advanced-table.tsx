import * as React from "react"
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type VisibilityState,
  type ColumnFiltersState,
  type SortingState,
  type RowSelectionState,
  type ColumnOrderState,
  type ColumnSizingState,
  type ColumnPinningState,
} from "@tanstack/react-table"
import { cn } from "../../lib"
import { Checkbox } from "./checkbox"
import { TableControls } from "./table-controls"
import { TableHeader } from "./table-header"
import { TableBody } from "./table-body"
import { TablePagination } from "./table-pagination"
import type { AdvancedDataTableProps } from "./table-types"

// Types for table state
interface EditingCell {
  rowIndex: number
  columnId: string
}

interface FrozenColumnsConfig {
  count: number
}

function createEnhancedColumns<T extends Record<string, unknown>>(
  columns: ColumnDef<T>[],
  selection: { enabled: boolean },
  resizing: { enabled: boolean, defaultSize?: number, minSize?: number, maxSize?: number }
): ColumnDef<T>[] {
  const cols: ColumnDef<T>[] = []

  if (selection.enabled) {
    const selectCol = {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="translate-y-[2px]"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      enablePinning: true,
      size: 40,
      enableResizing: false,
    }
    cols.push(selectCol)
  }

  const enhancedCols = columns.map((col) => ({
    ...col,
    enableResizing: resizing.enabled,
    size: resizing.defaultSize || 150,
    minSize: resizing.minSize || 50,
    maxSize: resizing.maxSize || 500,
  } as ColumnDef<T>))

  cols.push(...enhancedCols)

  return cols
}






/* eslint-disable max-lines-per-function, complexity */
export function TanStackAdvancedTable<T extends Record<string, unknown>>({
  data,
  columns,
  selection = { enabled: false },
  groupHeaders = [],
  frozenColumns,
  mobile: _mobile = { enabled: false },
  resizing = { enabled: true },
  reordering = { enabled: true },
  editing = { enabled: false },
  searchable = true,
  filterable: _filterable = false,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = "No data available",
  className,
  maxHeight,
  onRowClick,
  exportable = false,
  exportFilename = "table-data",
  compactMode = true,
  externalRowSelection,
  onRowSelectionChange
}: AdvancedDataTableProps<T> & {
  frozenColumns?: FrozenColumnsConfig
  externalRowSelection?: RowSelectionState
  onRowSelectionChange?: (updaterOrValue: RowSelectionState | ((old: RowSelectionState) => RowSelectionState)) => void
}) {

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [internalRowSelection, setInternalRowSelection] = React.useState<RowSelectionState>({})
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [editingCell, setEditingCell] = React.useState<EditingCell | null>(null)
  const [paginationState, setPaginationState] = React.useState({
    pageIndex: 0,
    pageSize: pageSize,
  })

  // Use external row selection if provided, otherwise use internal
  const rowSelection = externalRowSelection !== undefined ? externalRowSelection : internalRowSelection
  const handleRowSelectionChange = onRowSelectionChange || setInternalRowSelection
  // Initialize column pinning for frozen columns
  React.useEffect(() => {
    const leftPinnedColumns: string[] = []

    // Always pin selection column if enabled (MUST be first)
    if (selection.enabled) {
      leftPinnedColumns.push('select')
    }

    // Add additional frozen columns based on configuration
    if (frozenColumns && frozenColumns.count > 0) {
      const additionalColumns = columns.slice(0, frozenColumns.count).map(col => col.id || '').filter(id => id)
      leftPinnedColumns.push(...additionalColumns)
    }

    setColumnPinning({ left: leftPinnedColumns, right: [] })
  }, [frozenColumns, columns, selection.enabled])

  const enhancedColumns = React.useMemo(() => createEnhancedColumns(columns, selection, resizing), [columns, selection, resizing])

  const table = useReactTable<unknown>({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: handleRowSelectionChange,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPaginationState,
    enableRowSelection: selection.enabled,
    enableColumnResizing: resizing.enabled,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      columnOrder,
      columnSizing,
      columnPinning,
      globalFilter,
      pagination: pagination ? paginationState : undefined,
    },
    initialState: {
      pagination: pagination ? {
        pageSize: pageSize,
      } : undefined,
    },
  })

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="animate-pulse h-10 bg-muted rounded"></div>
        <div className="overflow-x-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-muted rounded mb-2"></div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-8 bg-muted/50 rounded mb-1"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("w-full space-y-4", className)}>
      <TableControls
        searchable={searchable}
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        selection={selection}
        table={table}
        exportable={exportable}
        exportFilename={exportFilename}
      />

      <div className="relative rounded-md border overflow-auto" style={{ maxHeight, boxShadow: 'var(--shadow-sm)' }}>
        <table className="w-full caption-bottom text-sm border-collapse">
          <TableHeader
            groupHeaders={groupHeaders}
            table={table}
            resizing={resizing}
            reordering={reordering}
            compactMode={compactMode}
          />
          <TableBody
            table={table}
            enhancedColumns={enhancedColumns}
            editing={editing}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            emptyMessage={emptyMessage}
            onRowClick={onRowClick}
          />
        </table>
      </div>

      {pagination && <TablePagination table={table} />}
    </div>
  )
}
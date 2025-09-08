import * as React from "react"
import {
  flexRender,
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
  type HeaderContext,
  type CellContext,
} from "@tanstack/react-table"
import { cn } from "../../lib"
import { Checkbox } from "./checkbox"
import { Button } from "./button"
import { Input } from "./input"
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  Download,
  GripVertical,
  Edit2,
  Pin,
  PinOff,
  MoreHorizontal,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { TablePagination } from "./table-pagination"
import { InlineEditor } from "./inline-editor"
import { getCommonPinningStyles, HOVER_OPACITY_CLASS, ICON_SIZE_CLASS, MUTED_BACKGROUND, BACKGROUND_COLOR, exportTableToCSV } from "./table-utils"
import type { AdvancedDataTableProps } from "./table-types"


function renderSortingButton(column: any, sortable: boolean, compactMode: boolean): React.ReactNode {
  const canSort = sortable && column.enableSorting !== false
  if (!canSort) return null

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-6 w-6 p-0",
        compactMode && "opacity-0 group-hover:opacity-100 transition-opacity"
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {column.getIsSorted() === "asc" ? (
        <ChevronUp className={ICON_SIZE_CLASS} />
      ) : column.getIsSorted() === "desc" ? (
        <ChevronDown className={ICON_SIZE_CLASS} />
      ) : (
        <ChevronsUpDown className={ICON_SIZE_CLASS} />
      )}
    </Button>
  )
}

function renderColumnMenu(column: any, compactMode: boolean): React.ReactNode {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={cn(
          "h-6 w-6 p-0",
          compactMode && HOVER_OPACITY_CLASS
        )}>
          <MoreHorizontal className={ICON_SIZE_CLASS} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => column.pin('left')}>
          <Pin className="mr-2 h-4 w-4" />
          Pin Left
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.pin('right')}>
          <Pin className="mr-2 h-4 w-4" />
          Pin Right
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.pin(false)}>
          <PinOff className="mr-2 h-4 w-4" />
          Unpin
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function renderTableHeader<T extends Record<string, unknown>>(
  column: any,
  sortable: boolean,
  reordering: { enabled: boolean },
  resizing: { enabled: boolean },
  editing: { enabled: boolean },
  compactMode: boolean
): React.ReactNode {
  return (
    <div className="group flex items-center justify-between gap-1">
      <div className="flex items-center gap-1">
        <div className={cn("flex items-center gap-1", compactMode && "w-0 overflow-hidden group-hover:w-auto")}>
          {reordering.enabled && (
            <GripVertical className={cn(
              `${ICON_SIZE_CLASS} text-muted-foreground cursor-grab`,
              compactMode && HOVER_OPACITY_CLASS
            )} />
          )}
          {column.getIsPinned() && (
            <Pin className={cn(
              `${ICON_SIZE_CLASS} text-muted-foreground/60`,
              compactMode && HOVER_OPACITY_CLASS
            )} />
          )}
        </div>
        <span className="select-none">
          {column.columnDef.header}
        </span>
      </div>
      <div className={cn("flex items-center gap-1", compactMode && "w-0 overflow-hidden group-hover:w-auto")}>
        {renderSortingButton(column, sortable, compactMode)}
        {renderColumnMenu(column, compactMode)}
      </div>
    </div>
  )
}

function renderEditingCell<T extends Record<string, unknown>>(
  value: unknown,
  row: any,
  column: any,
  editing: { onSave?: any; validation?: any },
  setEditingCell: (cell: { rowIndex: number; columnId: string } | null) => void
): React.ReactNode {
  return (
    <InlineEditor
      value={value as string | number}
      onSave={async (newValue) => {
        if (editing.onSave) {
          await editing.onSave(row.index, column.id, newValue, row.original)
        }
        setEditingCell(null)
      }}
      onCancel={() => setEditingCell(null)}
      validation={editing.validation ? (val: any) => editing.validation!(val, column.id, row.original) : undefined}
    />
  )
}

function renderEditableCell<T extends Record<string, unknown>>(
  cellProps: CellContext<T, unknown>,
  col: any,
  setEditingCell: (cell: { rowIndex: number; columnId: string } | null) => void
): React.ReactNode {
  const { row, column, getValue } = cellProps
  const value = getValue()

  return (
    <div
      className="group flex items-center gap-2 cursor-pointer"
      onClick={() => setEditingCell({ rowIndex: row.index, columnId: column.id })}
    >
      <span>{col.cell ? (typeof col.cell === 'function' ? col.cell(cellProps) : col.cell) : String(value)}</span>
      <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
    </div>
  )
}

function renderTableCell<T extends Record<string, unknown>>(
  cellProps: CellContext<T, unknown>,
  col: any,
  editing: { enabled: boolean; onSave?: any; validation?: any },
  editingCell: { rowIndex: number; columnId: string } | null,
  setEditingCell: (cell: { rowIndex: number; columnId: string } | null) => void
): React.ReactNode {
  const { row, column, getValue } = cellProps
  const value = getValue()
  const isEditing = editingCell?.rowIndex === row.index && editingCell?.columnId === column.id

  if (editing.enabled && isEditing) {
    return renderEditingCell(value, row, column, editing, setEditingCell)
  }

  if (editing.enabled) {
    return renderEditableCell(cellProps, col, setEditingCell)
  }

  return col.cell ? (typeof col.cell === 'function' ? col.cell(cellProps) : col.cell) : String(value)
}

function TableControls<T extends Record<string, unknown>>({
  searchable,
  globalFilter,
  setGlobalFilter,
  selection,
  table,
  exportable,
  handleExport
}: {
  searchable: boolean
  globalFilter: string
  setGlobalFilter: (value: string) => void
  selection: { enabled: boolean }
  table: any
  exportable: boolean
  handleExport: () => void
}): React.ReactNode {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {searchable && (
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="max-w-sm"
            />
          </div>
        )}

        {selection.enabled && table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} row(s) selected
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {exportable && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  )
}

function TableHeader<T extends Record<string, unknown>>({
  groupHeaders,
  table,
  resizing,
  getCommonPinningStyles,
  BACKGROUND_COLOR,
  MUTED_BACKGROUND
}: {
  groupHeaders: any[]
  table: any
  resizing: { enabled: boolean }
  getCommonPinningStyles: any
  BACKGROUND_COLOR: string
  MUTED_BACKGROUND: string
}): React.ReactNode {
  return (
    <thead className="[&_tr]:border-b">
      {/* Dynamic Group Headers Row */}
      {groupHeaders && groupHeaders.length > 0 && (
        <tr className="border-b sticky top-0 z-30" style={{ backgroundColor: 'hsl(var(--background))' }}>
          {/* Map through group headers dynamically */}
          {groupHeaders.map((header, index) => (
            <th
              key={index}
              colSpan={header.columns.length}
              className={cn(
                "h-8 px-2 text-center align-middle font-semibold text-foreground border-r text-xs",
                header.className
              )}
              style={{ backgroundColor: MUTED_BACKGROUND }}
            >
              {header.label}
            </th>
          ))}
        </tr>
      )}

      {/* Column Headers Row */}
      {table.getHeaderGroups().map((headerGroup: any) => (
        <tr key={headerGroup.id} className="sticky z-25" style={{ top: groupHeaders && groupHeaders.length > 0 ? '24px' : '0' }}>
          {headerGroup.headers.map((header: any) => {
            const pinningStyles = getCommonPinningStyles(header.column)
            return (
              <th
                key={header.id}
                className={cn(
                  header.column.id === 'select' ? "h-10 px-2 text-center align-middle font-medium text-muted-foreground text-xs" : "h-10 px-3 text-left align-middle font-medium text-muted-foreground text-xs",
                  "border-r border-border last:border-r-0"
                )}
                style={{
                  ...pinningStyles,
                  width: header.getSize(),
                  backgroundColor: header.column.id === 'select' ? BACKGROUND_COLOR : MUTED_BACKGROUND,
                  boxShadow: pinningStyles.boxShadow
                    ? `${pinningStyles.boxShadow}, var(--shadow-header)`
                    : 'var(--shadow-header)',
                }}
              >
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                {/* Resize handle */}
                {resizing.enabled && header.column.getCanResize() && (
                  <div
                    onMouseDown={header.getResizeHandler()}
                    onTouchStart={header.getResizeHandler()}
                    className={cn(
                      "absolute right-0 top-0 h-full w-1 bg-border cursor-col-resize select-none touch-none opacity-0 hover:opacity-100",
                      header.column.getIsResizing() && "opacity-100 bg-primary"
                    )}
                  />
                )}
              </th>
            )
          })}
        </tr>
      ))}
    </thead>
  )
}

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
  sortable = true,
  pagination = true,
  pageSize = 10,
  loading = false,
  emptyMessage = "No data available",
  className,
  maxHeight,
  onRowClick,
  exportable = false,
  exportFilename = "table-data",
  compactMode = true
}: AdvancedDataTableProps<T>) {
  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>([])
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({})
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [editingCell, setEditingCell] = React.useState<{
    rowIndex: number
    columnId: string
  } | null>(null)

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

  // Enhanced columns with selection column
  const enhancedColumns = React.useMemo<ColumnDef<T>[]>(() => {
    const cols: ColumnDef<T>[] = []

    // Add selection column if enabled
    if (selection.enabled) {
      cols.push({
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
      })
    }

    // Add main columns with enhanced functionality
    cols.push(...columns.map((col) => ({
      ...col,
      header: ({ column }: HeaderContext<T, unknown>) => renderTableHeader(column, sortable, reordering, resizing, editing, compactMode),
      cell: (cellProps: CellContext<T, unknown>) => renderTableCell(cellProps, col, editing, editingCell, setEditingCell),
      enableResizing: resizing.enabled,
      size: resizing.defaultSize || 150,
      minSize: resizing.minSize || 50,
      maxSize: resizing.maxSize || 500,
    } as ColumnDef<T>)))

    return cols
  }, [columns, selection.enabled, sortable, reordering, resizing, editing, editingCell, compactMode])

  const table = useReactTable({
    data,
    columns: enhancedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onColumnSizingChange: setColumnSizing,
    onColumnPinningChange: setColumnPinning,
    onGlobalFilterChange: setGlobalFilter,
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
      pagination: pagination ? {
        pageIndex: 0,
        pageSize: pageSize,
      } : undefined,
    },
    initialState: {
      pagination: pagination ? {
        pageSize: pageSize,
      } : undefined,
    },
  })

  // Export functionality
  const handleExport = () => {
    if (!exportable) return
    exportTableToCSV(table, exportFilename)
  }

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
        handleExport={handleExport}
      />

      {/* Table */}
      <div className="relative rounded-md border overflow-auto" style={{ maxHeight, boxShadow: 'var(--shadow-sm)' }}>
        <table className="w-full caption-bottom text-sm border-collapse">
          <TableHeader
            groupHeaders={groupHeaders}
            table={table}
            resizing={resizing}
            getCommonPinningStyles={getCommonPinningStyles}
            BACKGROUND_COLOR={BACKGROUND_COLOR}
            MUTED_BACKGROUND={MUTED_BACKGROUND}
          />
          <tbody className="[&_tr:last-child]:border-0">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted h-12",
                    onRowClick && "cursor-pointer"
                  )}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const pinningStyles = getCommonPinningStyles(cell.column)
                    return (
                      <td
                        key={cell.id}
                        className={cn(
                          cell.column.id === 'select' ? "px-2 py-1 align-middle" : "px-3 py-1 align-middle",
                          "border-r border-border last:border-r-0",
                          cell.column.getIsPinned() ? "sticky z-10" : "",
                          "overflow-visible"
                        )}
                        style={{
                          ...pinningStyles,
                          width: cell.column.getSize(),
                          backgroundColor: cell.column.id === 'select' ? BACKGROUND_COLOR :
                                          cell.column.getIsPinned() ? MUTED_BACKGROUND : BACKGROUND_COLOR,
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={enhancedColumns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && <TablePagination table={table} />}
    </div>
  )
}
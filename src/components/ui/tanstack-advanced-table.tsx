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
  type Column,
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
  Check,
  X,
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
import type { CSSProperties } from "react"
import { TablePagination } from "./table-pagination"

// Constants for repeated strings
const HOVER_OPACITY_CLASS = "opacity-0 group-hover:opacity-100 transition-opacity"
const ICON_SIZE_CLASS = "h-3 w-3"
const MUTED_BACKGROUND = "hsl(var(--muted))"
const BACKGROUND_COLOR = "hsl(var(--background))"

// Advanced table interfaces based on TanStack Table and proven patterns
export interface GroupHeaderConfig {
  label: string
  columns: string[]
  className?: string
  style?: React.CSSProperties
}

export interface FrozenColumnsConfig {
  count: number
  shadowIntensity?: 'light' | 'medium' | 'heavy'
}

export interface SelectionConfig<T = Record<string, unknown>> {
  enabled: boolean
  mode?: 'single' | 'multiple'
  selectedRows?: T[]
  onSelectionChange?: (_rows: T[]) => void
  getRowId?: (_row: T) => string | number
}

export interface MobileConfig {
  enabled: boolean
  hideColumns?: string[]
  stackColumns?: boolean
  touchOptimized?: boolean
}

export interface ResizingConfig {
  enabled: boolean
  minSize?: number
  maxSize?: number
  defaultSize?: number
}

export interface ReorderingConfig {
  enabled: boolean
  onReorder?: (_fromIndex: number, _toIndex: number) => void
}

export interface EditingConfig<T = Record<string, unknown>> {
  enabled: boolean
  mode?: 'cell' | 'row'
  onSave?: (_rowIndex: number, _columnId: string, _value: unknown, _row: T) => Promise<void>
  onCancel?: () => void
  validation?: (_value: unknown, _columnId: string, _row: T) => boolean | string
}

export interface AdvancedDataTableProps<T = Record<string, unknown>> {
  data: T[]
  columns: ColumnDef<T>[]
  selection?: SelectionConfig<T>
  groupHeaders?: GroupHeaderConfig[]
  frozenColumns?: FrozenColumnsConfig
  mobile?: MobileConfig
  resizing?: ResizingConfig
  reordering?: ReorderingConfig
  editing?: EditingConfig<T>
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  pagination?: boolean
  pageSize?: number
  loading?: boolean
  emptyMessage?: string
  className?: string
  maxHeight?: string
  onRowClick?: (_row: T) => void
  exportable?: boolean
  exportFilename?: string
  compactMode?: boolean
}

// Enhanced inline editor component
interface InlineEditorProps {
  value: string | number
  type?: 'text' | 'number' | 'select'
  options?: { value: string | number; label: string }[]
  onSave: (_value: string | number) => Promise<void>
  onCancel: () => void
  validation?: (_value: string | number) => boolean | string
  className?: string
}

function InlineEditor({
  value,
  type = 'text',
  options,
  onSave,
  onCancel,
  validation,
  className
}: InlineEditorProps) {
  const [editValue, setEditValue] = React.useState(value)
  const [error, setError] = React.useState<string>()
  const [saving, setSaving] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleSave = async () => {
    if (validation) {
      const result = validation(editValue)
      if (typeof result === 'string') {
        setError(result)
        return
      }
      if (!result) {
        setError('Invalid value')
        return
      }
    }

    setSaving(true)
    try {
      await onSave(editValue)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  if (type === 'select' && options) {
    return (
      <div className="flex items-center gap-1">
        <select
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-6 w-full rounded border border-input bg-background px-2 py-1 text-xs",
            "focus:outline-none focus:ring-1 focus:ring-ring",
            className
          )}
          disabled={saving}
          aria-label="Edit select"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={handleSave}
          disabled={saving}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "h-6 text-xs",
          error && "border-destructive focus-visible:ring-destructive",
          className
        )}
        disabled={saving}
      />
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={handleSave}
        disabled={saving}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={onCancel}
        disabled={saving}
      >
        <X className="h-3 w-3" />
      </Button>
      {error && (
        <span className="text-xs text-destructive ml-1">{error}</span>
      )}
    </div>
  )
}

// Common pinning styles for frozen columns (based on TanStack implementation)
function getCommonPinningStyles<T>(column: Column<T, unknown>): CSSProperties {
  const isPinned = column.getIsPinned()
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left')
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right')

  return {
    boxShadow: isLastLeftPinnedColumn
      ? `var(--table-frozen-shadow)`
      : isFirstRightPinnedColumn
        ? `var(--table-frozen-shadow)`
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    width: column.getSize(),
    zIndex: isPinned ? 20 : 0,
    backgroundColor: isPinned && column.id !== 'select' ? 'hsl(var(--muted))' : undefined,
  }
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
    cols.push(...columns.map((col): any => ({
      ...col,
      header: ({ column }: any) => {
        const canSort = sortable && col.enableSorting !== false
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
                {typeof col.header === 'function' ? col.header({ column } as any) : col.header}
              </span>
            </div>
            <div className={cn("flex items-center gap-1", compactMode && "w-0 overflow-hidden group-hover:w-auto")}>
              {canSort && (
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
              )}
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
            </div>
          </div>
        )
      },
      cell: ({ row, column, getValue }: any) => {
        const value = getValue()
        const isEditing = editingCell?.rowIndex === row.index && editingCell?.columnId === column.id

        if (editing.enabled && isEditing) {
          return (
            <InlineEditor
              value={value}
              onSave={async (newValue) => {
                if (editing.onSave) {
                  await editing.onSave(row.index, column.id, newValue, row.original)
                }
                setEditingCell(null)
              }}
              onCancel={() => setEditingCell(null)}
              validation={editing.validation ? (val) => editing.validation!(val, column.id, row.original) : undefined}
            />
          )
        }

        if (editing.enabled) {
          return (
            <div
              className="group flex items-center gap-2 cursor-pointer"
              onClick={() => setEditingCell({ rowIndex: row.index, columnId: column.id })}
            >
              <span>{col.cell ? (typeof col.cell === 'function' ? col.cell({ row, column, getValue } as any) : col.cell) : String(value)}</span>
              <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
            </div>
          )
        }

        return col.cell ? (typeof col.cell === 'function' ? col.cell({ row, column, getValue } as any) : col.cell) : String(value)
      },
      enableResizing: resizing.enabled,
      size: resizing.defaultSize || 150,
      minSize: resizing.minSize || 50,
      maxSize: resizing.maxSize || 500,
    })))

    return cols
  }, [columns, selection.enabled, sortable, reordering.enabled, resizing, editing, editingCell, compactMode])

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

    const headers = table.getAllColumns()
      .filter(col => col.getIsVisible() && col.id !== 'select')
      .map(col => col.columnDef.header)
      .join(',')

    const rows = table.getRowModel().rows
      .map(row =>
        row.getVisibleCells()
          .filter(cell => cell.column.id !== 'select')
          .map(cell => {
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
      {/* Controls */}
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

      {/* Table */}
      <div className="relative rounded-md border overflow-auto" style={{ maxHeight, boxShadow: 'var(--shadow-sm)' }}>
        <table className="w-full caption-bottom text-sm border-collapse">
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
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="sticky z-25" style={{ top: groupHeaders && groupHeaders.length > 0 ? '24px' : '0' }}>
                {headerGroup.headers.map((header) => {
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
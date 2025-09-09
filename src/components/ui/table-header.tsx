import * as React from "react"
import { cn } from "../../lib"
import { flexRender, type Header, type HeaderGroup, type Column } from "@tanstack/react-table"
import { GripVertical, ChevronUp, ChevronDown, ChevronsUpDown, Pin, PinOff, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Button } from "./button"
import { getCommonPinningStyles, HOVER_OPACITY_CLASS, ICON_SIZE_CLASS, MUTED_BACKGROUND, BACKGROUND_COLOR } from "./table-utils"

interface GroupHeader {
  label: string
  columns: number
  className?: string
}

interface ResizingConfig {
  enabled: boolean
}

interface ReorderingConfig {
  enabled: boolean
}

interface TableHeaderProps {
  groupHeaders: GroupHeader[]
  table: HeaderGroup<unknown>[]
  resizing: ResizingConfig
  reordering: ReorderingConfig
  compactMode: boolean
}

function renderSortingButton(column: Column<unknown>, compactMode: boolean): React.ReactNode {
  const canSort = column.columnDef.enableSorting !== false

  // Don't show sorting for select column
  if (column.id === 'select' || !canSort) return null

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

function renderColumnMenu(column: Column<unknown>, compactMode: boolean): React.ReactNode {
  // Don't show menu for select column
  if (column.id === 'select') return null

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

function renderTableHeader(
  header: Header<unknown, unknown>,
  reordering: ReorderingConfig,
  resizing: ResizingConfig,
  compactMode: boolean
): React.ReactNode {
  const column = header.column
  return (
    <div className="group flex items-center justify-between gap-1">
      <div className="flex items-center gap-1">
        <div className={cn("flex items-center gap-1", compactMode && "w-0 overflow-hidden group-hover:w-auto")}>
          {reordering.enabled && column.id !== 'select' && (
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
          {header.isPlaceholder
            ? null
            : flexRender(
                column.columnDef.header,
                header.getContext()
              )}
        </span>
      </div>
      <div className={cn("flex items-center gap-1", compactMode && "w-0 overflow-hidden group-hover:w-auto")}>
        {renderSortingButton(column, compactMode)}
        {renderColumnMenu(column, compactMode)}
      </div>
    </div>
  )
}

/* eslint-disable max-lines-per-function */
export function TableHeader({
  groupHeaders,
  table,
  resizing,
  reordering,
  compactMode
}: TableHeaderProps): React.ReactNode {
  return (
    <thead className="[&_tr]:border-b">
      {groupHeaders && groupHeaders.length > 0 && (
        <tr className="border-b sticky top-0 z-30" style={{ backgroundColor: 'hsl(var(--background))' }}>
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
      {table.getHeaderGroups().map((headerGroup: HeaderGroup<unknown>) => (
        <tr key={headerGroup.id} className="sticky z-25" style={{ top: groupHeaders && groupHeaders.length > 0 ? '24px' : '0' }}>
          {headerGroup.headers.map((header: Header<unknown, unknown>) => {
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
                {renderTableHeader(header, reordering, resizing, compactMode)}
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
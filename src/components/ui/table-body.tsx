import * as React from "react"
import {
  type CellContext,
  type Row,
  type Cell
} from "@tanstack/react-table"
import { cn } from "../../lib"
import { Edit2 } from "lucide-react"
import { InlineEditor } from "./inline-editor"
import { getCommonPinningStyles, BACKGROUND_COLOR, MUTED_BACKGROUND } from "./table-utils"
import type { Table as TanStackTable } from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"

interface EditingConfig {
  enabled: boolean
  onSave?: (rowIndex: number, columnId: string, newValue: string | number, rowData: unknown) => Promise<void>
  validation?: (value: string | number, columnId: string, rowData: unknown) => boolean | string
}

interface EditingCell {
  rowIndex: number
  columnId: string
}

interface TableBodyProps {
  table: TanStackTable<unknown>
  enhancedColumns: ColumnDef<unknown>[]
  editing: EditingConfig
  editingCell: EditingCell | null
  setEditingCell: (cell: EditingCell | null) => void
  emptyMessage: string
  onRowClick?: (row: unknown) => void
}

function renderTableCell(
  cellProps: CellContext<unknown, unknown>,
  editing: EditingConfig,
  editingCell: EditingCell | null,
  setEditingCell: (cell: EditingCell | null) => void
): React.ReactNode {
  const { row, column, getValue } = cellProps
  const value = getValue()
  const isEditing = editingCell?.rowIndex === row.index && editingCell?.columnId === column.id

  if (editing.enabled && isEditing) {
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
        validation={editing.validation ? (val: string | number) => editing.validation!(val, column.id, row.original) : undefined}
      />
    )
  }

  if (editing.enabled) {
    return (
      <div
        className="group flex items-center gap-2 cursor-pointer"
        onClick={() => setEditingCell({ rowIndex: row.index, columnId: column.id })}
      >
        <span>{String(value)}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-50" />
      </div>
    )
  }

  return String(value)
}

export function TableBodyRow({
  row,
  editing,
  editingCell,
  setEditingCell,
  onRowClick
}: {
  row: Row<unknown>
  editing: EditingConfig
  editingCell: EditingCell | null
  setEditingCell: (cell: EditingCell | null) => void
  onRowClick?: (row: unknown) => void
}) {
  return (
    <tr
      key={row.id}
      data-state={row.getIsSelected() && "selected"}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted h-12",
        onRowClick && "cursor-pointer"
      )}
      onClick={() => onRowClick?.(row.original)}
    >
      {row.getVisibleCells().map((cell: Cell<unknown, unknown>) => {
        const pinningStyles = getCommonPinningStyles(cell.column)
        const cellContext = cell.getContext()
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
            {renderTableCell(cellContext, editing, editingCell, setEditingCell)}
          </td>
        )
      })}
    </tr>
  )
}

export function TableBody({
  table,
  enhancedColumns,
  editing,
  editingCell,
  setEditingCell,
  emptyMessage,
  onRowClick
}: TableBodyProps): React.ReactNode {
  return (
    <tbody className="[&_tr:last-child]:border-0">
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map((row: Row<unknown>) => (
          <TableBodyRow
            key={row.id}
            row={row}
            editing={editing}
            editingCell={editingCell}
            setEditingCell={setEditingCell}
            onRowClick={onRowClick}
          />
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
  )
}
import * as React from "react"
import { Button } from "./button"
import { Input } from "./input"
import { Download, Search } from "lucide-react"
import { exportTableToCSV } from "./table-utils"
import type { Table } from "@tanstack/react-table"

interface SelectionConfig {
  enabled: boolean
}

interface TableControlsProps {
  searchable: boolean
  globalFilter: string
  setGlobalFilter: (value: string) => void
  selection: SelectionConfig
  table: Table<unknown>
  exportable: boolean
  exportFilename: string
}

export function TableControls({
  searchable,
  globalFilter,
  setGlobalFilter,
  selection,
  table,
  exportable,
  exportFilename
}: TableControlsProps): React.ReactNode {
  const handleExport = () => {
    if (!exportable) return
    exportTableToCSV(table, exportFilename)
  }

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
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        )}
      </div>
    </div>
  )
}
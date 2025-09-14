// CSSProperties is used in GroupHeaderConfig interface

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
  columns: import("@tanstack/react-table").ColumnDef<T>[]
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
export interface InlineEditorProps {
  value: string | number
  type?: 'text' | 'number' | 'select'
  options?: { value: string | number; label: string }[]
  onSave: (_value: string | number) => Promise<void>
  onCancel: () => void
  validation?: (_value: string | number) => boolean | string
  className?: string
}

// Types for inline editor
export interface EditorValue {
  value: string | number
}

export interface EditorOptions {
  value: string | number
  label: string
}

export interface ValidationResult {
  isValid: boolean
  error?: string
}
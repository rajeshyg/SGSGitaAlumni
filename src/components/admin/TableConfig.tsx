import { type ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, FileText } from 'lucide-react'
import { Badge } from '../ui'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { APIService, type FileImport } from '../../services/APIService'
import { logger, MUTED_BACKGROUND_STYLE, GRADE_A_VARIANT, GRADE_B_VARIANT, GRADE_C_VARIANT, GRADE_F_VARIANT, DESTRUCTIVE_VARIANT, SECONDARY_VARIANT } from './admin-utils'

// Professional column definitions for file imports
// eslint-disable-next-line custom/no-mock-data
export const columns: ColumnDef<FileImport>[] = [
  {
    id: 'filename',
    accessorKey: 'filename',
    header: 'File Name',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="font-medium">{row.getValue('filename')}</div>
      </div>
    ),
    enablePinning: true,
  },
  {
    id: 'file_type',
    accessorKey: 'file_type',
    header: 'Type',
    cell: ({ row }) => {
      const fileType = row.getValue('file_type') as string
      return <Badge variant="secondary">{fileType}</Badge>
    },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      const variant = status === 'completed' ? GRADE_A_VARIANT :
                     status === 'processing' ? GRADE_B_VARIANT :
                     status === 'failed' ? GRADE_F_VARIANT : GRADE_C_VARIANT
      return <Badge variant={variant}>{status.toUpperCase()}</Badge>
    },
  },
  {
    id: 'records_count',
    accessorKey: 'records_count',
    header: 'Total Records',
    cell: ({ row }) => {
      return <div className="text-center font-mono">{row.getValue('records_count')}</div>
    },
  },
  {
    id: 'processed_records',
    accessorKey: 'processed_records',
    header: 'Processed',
    cell: ({ row }) => {
      return <div className="text-center font-mono">{row.getValue('processed_records')}</div>
    },
  },
  {
    id: 'errors_count',
    accessorKey: 'errors_count',
    header: 'Errors',
    cell: ({ row }) => {
      const errors = row.getValue('errors_count') as number
      return (
        <div className="text-center">
          <Badge variant={errors > 0 ? DESTRUCTIVE_VARIANT : SECONDARY_VARIANT} size="sm">
            {errors}
          </Badge>
        </div>
      )
    },
  },
  {
    id: 'file_size',
    accessorKey: 'file_size',
    header: 'File Size',
    cell: ({ row }) => {
      return <div className="text-center font-mono">{row.getValue('file_size')}</div>
    },
  },
  {
    id: 'upload_date',
    accessorKey: 'upload_date',
    header: 'Upload Date',
    cell: ({ row }) => {
      const date = new Date(row.getValue('upload_date') as string)
      return <div className="text-center text-sm">{date.toLocaleDateString()}</div>
    },
  },
  {
    id: 'uploaded_by',
    accessorKey: 'uploaded_by',
    header: 'Uploaded By',
    cell: ({ row }) => {
      return <div className="text-center">{row.getValue('uploaded_by')}</div>
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      const fileImport = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 p-0 hover:bg-muted rounded-md flex items-center justify-center">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(fileImport.filename)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Copy filename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
]

// Helper functions to reduce function length
function getGroupHeaders() {
  return [
    {
      label: 'File Information',
      columns: ['filename', 'file_type', 'status'],
      style: MUTED_BACKGROUND_STYLE
    },
    {
      label: 'Processing Details',
      columns: ['records_count', 'processed_records', 'errors_count', 'file_size'],
      style: MUTED_BACKGROUND_STYLE
    },
    {
      label: 'Metadata',
      columns: ['upload_date', 'uploaded_by', 'actions'],
      style: MUTED_BACKGROUND_STYLE
    }
  ];
}

function getSelectionConfig() {
  return {
    enabled: true,
    mode: 'multiple' as const,
    onSelectionChange: (_rows: unknown[]) => {
      logger.info('Selected files:', _rows);
    }
  };
}

function getEditingConfig(refresh: () => void) {
  return {
    enabled: true,
    mode: 'cell' as const,
    onSave: async (_rowIndex: number, columnId: string, value: unknown, _row: unknown) => {
      const row = _row as FileImport;
      const updated = await APIService.updateFileImport(row.id, { [columnId]: value });
      if (updated) {
        refresh();
      }
    },
    validation: (value: unknown, columnId: string, _row: unknown) => {
      if (columnId === 'records_count' || columnId === 'processed_records') {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < 0) {
          return 'Must be a positive number';
        }
      }
      return true;
    }
  };
}

function getBasicConfig(pageSize: number) {
  return {
    searchable: false,
    filterable: true,
    sortable: true,
    pagination: false,
    pageSize,
    exportable: true,
    exportFilename: "file-imports",
    maxHeight: "600px",
    onRowClick: (_row: unknown) => {
      logger.info('File clicked:', _row);
    },
    className: "border rounded-lg shadow-sm"
  };
}

// Helper function to get table configuration
export function getTableConfig(pageSize: number, refresh: () => void) {
  return {
    groupHeaders: getGroupHeaders(),
    selection: getSelectionConfig(),
    frozenColumns: {
      count: 1,
      shadowIntensity: 'medium' as const
    },
    resizing: {
      enabled: true,
      minSize: 60,
      maxSize: 400,
      defaultSize: 150
    },
    reordering: {
      enabled: true,
      onReorder: (_fromIndex: number, _toIndex: number) => {
        logger.info(`Reordered column from ${_fromIndex} to ${_toIndex}`);
      }
    },
    editing: getEditingConfig(refresh),
    ...getBasicConfig(pageSize)
  };
}
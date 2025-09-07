import React from 'react'
import { useNavigate } from 'react-router-dom'
import { TanStackAdvancedTable, Badge } from '../components/ui'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { type ColumnDef } from "@tanstack/react-table"
import { APIService, type FileImport } from '../services/APIService'
import { useLazyData } from '../hooks/useLazyData'
import { MoreHorizontal, Edit, FileText, Database, Upload } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { WelcomeHeroSection } from '../components/dashboard/WelcomeHeroSection'
import { DashboardSidebar } from '../components/dashboard/DashboardSidebar'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'

// File Import interface for managing data imports

// Transform raw data to file import format

// Professional column definitions for file imports
const columns: ColumnDef<FileImport>[] = [
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
      const variant = status === 'completed' ? 'grade-a' :
                     status === 'processing' ? 'grade-b' :
                     status === 'failed' ? 'grade-f' : 'grade-c'
      return <Badge variant={variant as any}>{status.toUpperCase()}</Badge>
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
          <Badge variant={errors > 0 ? "destructive" : "secondary"} size="sm">
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

export function AdminPage() {
  const navigate = useNavigate()

  // Use lazy loading hook with caching
  const {
    data: fileImportData,
    loading,
    error,
    total,
    page,
    pageSize,
    hasMore,
    loadMore,
    search,
    refresh
  } = useLazyData({
    pageSize: 10,
    enableCache: true,
    cacheTtl: 5 * 60 * 1000, // 5 minutes
    autoLoad: true
  })

  // Get actual user profile from localStorage or use default
  const storedProfile = localStorage.getItem('currentProfile')
  const currentProfile = storedProfile ? JSON.parse(storedProfile) : {
    id: 1,
    name: 'Administrator',
    role: 'admin',
    avatar: null,
    preferences: {
      professionalStatus: 'Administrator'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-2xl mb-4">⚠️</div>
          <p className="text-muted-foreground">{error}</p>
          <Button
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  // Calculate real statistics from actual data
  const totalImports = total
  const completedImports = fileImportData.filter(imp => imp.status === 'completed').length
  const totalRecords = fileImportData.reduce((sum, imp) => sum + imp.records_count, 0)
  const totalErrors = fileImportData.reduce((sum, imp) => sum + imp.errors_count, 0)

  // Real stats based on actual data
  const stats = {
    notifications: { unread: totalErrors > 0 ? 1 : 0 },
    chat: { totalUnread: 0 },
    totalRecords: totalRecords,
    processedFiles: completedImports,
    activeUsers: 1 // Current user
  }

  // Handle page navigation using lazy loading hook
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && hasMore) {
      loadMore()
    }
  }

  const handleSearchChange = (term: string) => {
    search(term) // This will automatically reset to page 0
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader
        currentProfile={currentProfile}
        stats={stats}
        onSwitchProfile={() => {}}
        onLogout={() => {}}
      />

      <WelcomeHeroSection
        profile={currentProfile}
        stats={stats}
        totalEngagement={0}
      />

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          <div className="lg:col-span-4 xl:col-span-3">
            <DashboardSidebar
              currentProfile={currentProfile}
              stats={stats}
            />
          </div>

          <div className="lg:col-span-8 xl:col-span-9">
            {/* Data Table Section */}
            <div className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Alumni Data Management</h2>
                <p className="text-muted-foreground">
                  View and manage alumni records imported from various data sources.
                </p>
              </div>

              {fileImportData.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by importing alumni data files to populate this view.
                      </p>
                      <Button onClick={() => navigate('/upload')}>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Data
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <ErrorBoundary>
                  <TanStackAdvancedTable<FileImport>
                    data={fileImportData}
                    columns={columns}
                    groupHeaders={[
                      {
                        label: 'File Information',
                        columns: ['filename', 'file_type', 'status'],
                        style: { backgroundColor: 'hsl(var(--muted) / 0.5)' }
                      },
                      {
                        label: 'Processing Details',
                        columns: ['records_count', 'processed_records', 'errors_count', 'file_size'],
                        style: { backgroundColor: 'hsl(var(--muted) / 0.5)' }
                      },
                      {
                        label: 'Metadata',
                        columns: ['upload_date', 'uploaded_by', 'actions'],
                        style: { backgroundColor: 'hsl(var(--muted) / 0.5)' }
                      }
                    ]}
                    selection={{
                      enabled: true,
                      mode: 'multiple',
                      onSelectionChange: (_rows) => {
                        console.log('Selected files:', _rows)
                      }
                    }}
                    frozenColumns={{
                      count: 1,
                      shadowIntensity: 'medium'
                    }}
                    resizing={{
                      enabled: true,
                      minSize: 60,
                      maxSize: 400,
                      defaultSize: 150
                    }}
                    reordering={{
                      enabled: true,
                      onReorder: (_fromIndex, _toIndex) => {
                        console.log(`Reordered column from ${_fromIndex} to ${_toIndex}`)
                      }
                    }}
                    editing={{
                      enabled: true,
                      mode: 'cell',
                      onSave: async (_rowIndex, columnId, value, _row) => {
                        const row = _row as FileImport
                        const updated = await APIService.updateFileImport(row.id, { [columnId]: value })
                        if (updated) {
                          // Refresh data after successful update
                          refresh()
                        }
                      },
                      validation: (value, columnId, _row) => {
                        if (columnId === 'records_count' || columnId === 'processed_records') {
                          const numValue = Number(value)
                          if (isNaN(numValue) || numValue < 0) {
                            return 'Must be a positive number'
                          }
                        }
                        return true
                      }
                    }}
                    searchable={false} // Handled by parent component
                    filterable={true}
                    sortable={true}
                    pagination={false} // Using custom pagination controls
                    pageSize={pageSize}
                    exportable={true}
                    exportFilename="file-imports"
                    maxHeight="600px"
                    onRowClick={(_row) => {
                      console.log('File clicked:', _row)
                    }}
                      className="border rounded-lg shadow-sm"
                  />
                  
                  {/* Custom Pagination Controls */}
                  {hasMore && (
                    <div className="flex items-center justify-between space-x-2 py-4">
                      <div className="flex-1 text-sm text-muted-foreground">
                        Showing {(page * pageSize) + 1} to {Math.min((page + 1) * pageSize, total)}
                        of {total} file imports
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page === 0}
                          aria-label="Previous page"
                        >
                          Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Page {page + 1}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(page + 1)}
                          disabled={!hasMore}
                          aria-label="Next page"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </ErrorBoundary>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
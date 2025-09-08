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

// Production-safe logger utility
const logger = {
  info: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(`[AdminPage] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[AdminPage] ${message}`, ...args);
    }
  },
  error: (message: string, ...args: unknown[]) => {
    // eslint-disable-next-line no-console
    console.error(`[AdminPage] ${message}`, ...args);
  }
};

// Constants for duplicate strings
const MUTED_BACKGROUND_STYLE = { backgroundColor: 'hsl(var(--muted) / 0.5)' };
const GRADE_A_VARIANT = 'grade-a';
const GRADE_B_VARIANT = 'grade-b';
const GRADE_C_VARIANT = 'grade-c';
const GRADE_F_VARIANT = 'grade-f';
const DESTRUCTIVE_VARIANT = 'destructive';
const SECONDARY_VARIANT = 'secondary';

// Helper function to render loading state
function LoadingState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading data...</p>
      </div>
    </div>
  );
}

// Helper function to render error state
function ErrorState({ error }: { error: string }) {
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
  );
}

// Helper function to calculate statistics
function calculateStats(fileImportData: FileImport[]) {
  const completedImports = fileImportData.filter(imp => imp.status === 'completed').length;
  const totalRecords = fileImportData.reduce((sum, imp) => sum + imp.records_count, 0);
  const totalErrors = fileImportData.reduce((sum, imp) => sum + imp.errors_count, 0);

  return {
    notifications: { unread: totalErrors > 0 ? 1 : 0 },
    chat: { totalUnread: 0 },
    totalRecords: totalRecords,
    processedFiles: completedImports,
    activeUsers: 1, // Current user
    systemHealth: 'good' as const
  };
}

// Helper function to render empty state
function EmptyState({
  apiConfig,
  navigate
}: {
  apiConfig: { isConfigured: boolean; hasBaseUrl: boolean };
  navigate: (path: string) => void;
}) {
  if (!apiConfig.isConfigured) {
    return (
      <>
        <div className="text-amber-500 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold mb-2 text-amber-700">API Not Configured</h3>
        <p className="text-muted-foreground mb-4">
          Please configure your API base URL to connect to the backend server.
        </p>
        <div className="text-left bg-amber-50 p-4 rounded-lg mb-4 max-w-md mx-auto">
          <p className="text-sm font-medium text-amber-800 mb-2">Missing Configuration:</p>
          <ul className="text-sm text-amber-700 space-y-1">
            {!apiConfig.hasBaseUrl && <li>• API Base URL</li>}
          </ul>
        </div>
        <Button
          variant="outline"
          onClick={() => window.open('/AWS_SETUP.md', '_blank')}
          className="mr-2"
        >
          View API Setup Guide
        </Button>
        <Button onClick={() => window.location.reload()}>
          Check Configuration
        </Button>
      </>
    );
  }

  return (
    <>
      <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
      <p className="text-muted-foreground mb-4">
        Your AWS connection is configured, but no data was found in DynamoDB.
        Start by importing alumni data files to populate this view.
      </p>
      <Button onClick={() => navigate('/upload')}>
        <Upload className="h-4 w-4 mr-2" />
        Upload Data
      </Button>
    </>
  );
}

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

// Helper function to get current user profile
function getCurrentProfile() {
  const storedProfile = localStorage.getItem('currentProfile');
  return storedProfile ? JSON.parse(storedProfile) : {
    id: 1,
    name: 'Administrator',
    role: 'admin',
    avatar: null,
    preferences: {
      professionalStatus: 'Administrator'
    }
  };
}

// Helper function to render main layout
function MainLayout({
  currentProfile,
  stats,
  children
}: {
  currentProfile: {
    id: number;
    name: string;
    role: string;
    avatar: string | undefined;
    preferences: { professionalStatus: string };
  };
  stats: {
    notifications: { unread: number };
    chat: { totalUnread: number };
    totalRecords: number;
    processedFiles: number;
    activeUsers: number;
    systemHealth: string;
  };
  children: React.ReactNode;
}) {
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
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminPage() {
  const navigate = useNavigate();

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
    refresh
  } = useLazyData({
    pageSize: 10,
    enableCache: true,
    cacheTtl: 5 * 60 * 1000, // 5 minutes
    autoLoad: true
  });

  // Get user profile and API config
  const currentProfile = getCurrentProfile();
  const apiConfig = APIService.getAPIConfigStatus();

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  // Calculate statistics and handle navigation
  const stats = calculateStats(fileImportData);
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && hasMore) {
      loadMore();
    }
  };


// Helper function to render page header
function PageHeader() {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-bold tracking-tight">Alumni Data Management</h2>
      <p className="text-muted-foreground">
        View and manage alumni records imported from various data sources.
      </p>
    </div>
  );
}

// Helper function to get table configuration
function getTableConfig(pageSize: number, refresh: () => void) {
  return {
    groupHeaders: [
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
    ],
    selection: {
      enabled: true,
      mode: 'multiple' as const,
      onSelectionChange: (_rows: unknown[]) => {
        logger.info('Selected files:', _rows);
      }
    },
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
    editing: {
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
    },
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

// Helper function to render pagination controls
function PaginationControls({
  page,
  pageSize,
  total,
  hasMore,
  handlePageChange
}: {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  handlePageChange: (newPage: number) => void;
}) {
  if (!hasMore) return null;

  return (
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
  );
}

// Helper function to render data table section
function DataTableSection({
  fileImportData,
  apiConfig,
  navigate,
  total,
  page,
  pageSize,
  hasMore,
  handlePageChange,
  refresh
}: {
  fileImportData: FileImport[];
  apiConfig: { isConfigured: boolean; hasBaseUrl: boolean };
  navigate: (path: string) => void;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  handlePageChange: (newPage: number) => void;
  refresh: () => void;
}) {
  const tableConfig = getTableConfig(pageSize, refresh);

  return (
    <div className="space-y-6">
      <PageHeader />

      {fileImportData.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <EmptyState apiConfig={apiConfig} navigate={navigate} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <ErrorBoundary>
          <TanStackAdvancedTable<FileImport>
            data={fileImportData}
            columns={columns}
            {...tableConfig}
          />
          <PaginationControls
            page={page}
            pageSize={pageSize}
            total={total}
            hasMore={hasMore}
            handlePageChange={handlePageChange}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

  return (
    <MainLayout currentProfile={currentProfile} stats={stats}>
      <DataTableSection
        fileImportData={fileImportData}
        apiConfig={apiConfig}
        navigate={navigate}
        total={total}
        page={page}
        pageSize={pageSize}
        hasMore={hasMore}
        handlePageChange={handlePageChange}
        refresh={refresh}
      />
    </MainLayout>
  );
}
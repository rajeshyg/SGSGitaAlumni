import { TanStackAdvancedTable } from '../ui'
import { ErrorBoundary } from '../ErrorBoundary'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { type FileImport } from '../../services/APIService'
import { EmptyState } from './AdminHelpers'
import { columns, getTableConfig } from './TableConfig'

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

interface DataTableSectionProps {
  fileImportData: FileImport[];
  apiConfig: { isConfigured: boolean; hasBaseUrl: boolean };
  navigate: (path: string) => void;
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  handlePageChange: (newPage: number) => void;
  refresh: () => void;
}

export function DataTableSection({
  fileImportData,
  apiConfig,
  navigate,
  total,
  page,
  pageSize,
  hasMore,
  handlePageChange,
  refresh
}: DataTableSectionProps) {
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
import { Database, Upload } from 'lucide-react'
import { Button } from '../ui/button'

// Helper function to render loading state
export function LoadingState() {
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
export function ErrorState({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-destructive text-2xl mb-4">⚠️</div>
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

// Helper function to render empty state
export function EmptyState({
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

// Helper function to get current user profile
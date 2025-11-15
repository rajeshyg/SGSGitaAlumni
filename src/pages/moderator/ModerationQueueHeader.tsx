/**
 * Moderation Queue Header Component
 *
 * Enhanced header with export and refresh functionality
 * Merged best features from prototype while maintaining theme compliance
 *
 * Task: Action 8 - Moderator Review System Enhancement
 * Date: November 5, 2025
 */

import { RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModerationQueueHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  pendingCount?: number;
}

export function ModerationQueueHeader({ loading, onRefresh, pendingCount }: ModerationQueueHeaderProps) {
  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export moderation queue data');
  };

  return (
    <div className="bg-card border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Moderation Queue
            </h1>
            {pendingCount !== undefined && pendingCount > 0 && (
              <Badge variant="secondary" className="text-sm">
                {pendingCount} pending
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="hidden sm:inline-flex"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="ml-2 hidden md:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
/**
 * Posting Review Content Component
 *
 * Displays the main content of the posting review modal
 */

import type { PostingDetail, SubmitterStats, ModerationHistoryItem } from '../../types/moderation';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { XCircle } from 'lucide-react';
import { PostingDetails } from './PostingDetails';
import { SubmitterInfo } from './SubmitterInfo';
import { ModerationHistory } from './ModerationHistory';

interface PostingReviewContentProps {
  loading: boolean;
  error: string | null;
  posting: PostingDetail | null;
  submitterStats: SubmitterStats | null;
  moderationHistory: ModerationHistoryItem[];
}

export function PostingReviewContent({
  loading,
  error,
  posting,
  submitterStats,
  moderationHistory
}: PostingReviewContentProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner />
        <span className="ml-3 text-muted-foreground">Loading posting details...</span>
      </div>
    );
  }

  if (error || !posting || !submitterStats) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Failed to load posting details.'}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <PostingDetails posting={posting} />
      <SubmitterInfo posting={posting} submitterStats={submitterStats} />
      <ModerationHistory history={moderationHistory} />
    </div>
  );
}
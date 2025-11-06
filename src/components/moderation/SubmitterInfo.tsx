/**
 * Submitter Info Component
 *
 * Displays submitter information and statistics
 */

import type { PostingDetail, SubmitterStats } from '../../types/moderation';

interface SubmitterInfoProps {
  posting: PostingDetail;
  submitterStats: SubmitterStats;
}

export function SubmitterInfo({ posting, submitterStats }: SubmitterInfoProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-3">Submitter Information</h4>
      <div className="bg-accent rounded-lg p-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Name:</span>
          <span className="text-sm text-foreground">{posting.first_name} {posting.last_name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Email:</span>
          <span className="text-sm text-foreground">{posting.submitter_email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Postings:</span>
          <span className="text-sm text-foreground">{submitterStats.total_postings}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Approved:</span>
          <span className="text-sm text-green-500">{submitterStats.approved_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Rejected:</span>
          <span className="text-sm text-red-500">{submitterStats.rejected_count}</span>
        </div>
      </div>
    </div>
  );
}
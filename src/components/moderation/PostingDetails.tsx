/**
 * Posting Details Component
 *
 * Displays posting information in the review modal
 */

import type { PostingDetail } from '../../types/moderation';

interface PostingDetailsProps {
  posting: PostingDetail;
}

export function PostingDetails({ posting }: PostingDetailsProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-3">Posting Details</h4>
      <div className="bg-accent rounded-lg p-4 space-y-3">
        <div>
          <span className="text-sm font-medium text-muted-foreground">Title:</span>
          <p className="mt-1 text-foreground">{posting.title}</p>
        </div>
        <div>
          <span className="text-sm font-medium text-muted-foreground">Description:</span>
          <p className="mt-1 text-foreground whitespace-pre-wrap">{posting.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-muted-foreground">Type:</span>
            <p className="mt-1 text-foreground">{posting.posting_type}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Domain:</span>
            <p className="mt-1 text-foreground">{posting.domain_name}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
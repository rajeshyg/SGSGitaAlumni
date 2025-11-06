/**
 * Posting Details Component
 *
 * Enhanced posting information display with better visual design
 * Merged best features from prototype while maintaining theme compliance
 *
 * Task: Action 8 - Moderator Review System Enhancement
 * Date: November 5, 2025
 */

import { FileText, Tag, Calendar, Clock } from 'lucide-react';
import { Badge } from '../ui/badge';
import type { PostingDetail } from '../../types/moderation';

interface PostingDetailsProps {
  posting: PostingDetail;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export function PostingDetails({ posting }: PostingDetailsProps) {
  return (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-3">Posting Details</h4>
      <div className="bg-muted rounded-lg p-4 space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Title</span>
          </div>
          <p className="text-base font-medium text-foreground">{posting.title}</p>
        </div>

        {/* Description */}
        <div>
          <span className="text-sm font-medium text-muted-foreground block mb-2">Description</span>
          <div className="bg-background rounded border border-border p-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">{posting.description}</p>
          </div>
        </div>

        {/* Type */}
        <div className="bg-background rounded p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Type</span>
          </div>
          <Badge variant="secondary" className="text-sm">
            {posting.posting_type}
          </Badge>
        </div>

        {/* Domains - All hierarchy levels */}
        {posting.domains && posting.domains.length > 0 && (
          <div className="bg-background rounded p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Domain Classification</span>
            </div>
            <div className="space-y-3">
              {/* Primary Domain */}
              {posting.domains.filter(d => d.is_primary === 1).length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Primary Domain:</span>
                  <div className="flex flex-wrap gap-1">
                    {posting.domains
                      .filter(d => d.is_primary === 1)
                      .map(domain => (
                        <Badge key={domain.id} variant="default" className="text-xs">
                          {domain.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              {/* Secondary Domains */}
              {posting.domains.filter(d => d.domain_level === 'secondary').length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Secondary Domains:</span>
                  <div className="flex flex-wrap gap-1">
                    {posting.domains
                      .filter(d => d.domain_level === 'secondary')
                      .map(domain => (
                        <Badge key={domain.id} variant="outline" className="text-xs">
                          {domain.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
              {/* Areas of Interest */}
              {posting.domains.filter(d => d.domain_level === 'area_of_interest').length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-1">Areas of Interest:</span>
                  <div className="flex flex-wrap gap-1">
                    {posting.domains
                      .filter(d => d.domain_level === 'area_of_interest')
                      .map(domain => (
                        <Badge key={domain.id} variant="secondary" className="text-xs">
                          {domain.name}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timestamps */}
        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Calendar className="h-3 w-3" />
            <span>Submitted: {formatDate(posting.created_at)}</span>
          </div>
          {posting.expires_at && (
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3" />
              <span>Expires: {formatDate(posting.expires_at)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
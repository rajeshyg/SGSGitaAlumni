/**
 * Submitter Info Component
 *
 * Enhanced submitter information display with better visual design
 * Merged best features from prototype while maintaining theme compliance
 *
 * Task: Action 8 - Moderator Review System Enhancement
 * Date: November 5, 2025
 */

import { User, Mail, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Badge } from '../ui/badge';
import type { PostingDetail, SubmitterStats } from '../../types/moderation';

interface SubmitterInfoProps {
  posting: PostingDetail;
  submitterStats: SubmitterStats;
}

function formatJoinedDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function SubmitterInfo({ posting, submitterStats }: SubmitterInfoProps) {
  const approvalRate = submitterStats.total_postings > 0
    ? Math.round((submitterStats.approved_count / submitterStats.total_postings) * 100)
    : 0;

  // Safe access to submitter name with fallbacks
  const firstName = posting.first_name || 'Unknown';
  const lastName = posting.last_name || 'User';
  const initials = `${firstName[0]}${lastName[0]}`.toUpperCase();

  return (
    <div>
      <h4 className="text-sm font-medium text-foreground mb-3">Submitter Profile</h4>
      <div className="bg-muted rounded-lg p-4 space-y-4">
        {/* Author Profile */}
        <div className="bg-background rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-foreground">
                {firstName} {lastName}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground truncate">
                  {posting.submitter_email}
                </p>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Member since {formatJoinedDate(posting.submitter_joined_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Submission Stats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">Submission History</span>
            <Badge variant={approvalRate >= 80 ? 'default' : approvalRate >= 50 ? 'secondary' : 'destructive'}>
              {approvalRate}% approval rate
            </Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <CheckCircle className="h-4 w-4 text-green-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">
                {submitterStats.approved_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Approved</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <XCircle className="h-4 w-4 text-red-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">
                {submitterStats.rejected_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Rejected</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <Clock className="h-4 w-4 text-orange-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">
                {submitterStats.pending_count}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Pending</p>
            </div>
            <div className="bg-background rounded-lg p-3 text-center border border-border">
              <User className="h-4 w-4 text-blue-500 mx-auto mb-1" />
              <div className="text-xl font-bold text-foreground">
                {submitterStats.total_postings}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
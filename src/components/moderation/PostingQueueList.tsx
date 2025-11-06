/**
 * Posting Queue List Component
 *
 * Enhanced table-based queue view with bulk actions and priority indicators
 * Merged best features from prototype while maintaining theme compliance
 *
 * Task: Action 8 - Moderator Review System Enhancement
 * Date: November 5, 2025
 */

import { useState } from 'react';
import { Eye, FileText, Zap, CheckCircle, XCircle } from 'lucide-react';
import type { QueuePosting } from '../../types/moderation';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LoadingSpinner } from '../ui/loading-spinner';
import { Checkbox } from '../ui/checkbox';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';

interface PostingQueueListProps {
  postings: QueuePosting[];
  loading: boolean;
  onPostingClick: (postingId: string) => void;
}

const LoadingState = () => (
  <Card>
    <CardContent className="p-12">
      <div className="flex justify-center items-center">
        <LoadingSpinner />
        <span className="ml-3 text-muted-foreground">Loading queue...</span>
      </div>
    </CardContent>
  </Card>
);

const EmptyState = () => (
  <Card>
    <CardContent className="p-12">
      <div className="text-center">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">No postings found</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          The moderation queue is empty or no postings match your filters.
        </p>
      </div>
    </CardContent>
  </Card>
);

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'APPROVED':
      return 'default';
    case 'REJECTED':
      return 'destructive';
    case 'ESCALATED':
      return 'secondary';
    default:
      return 'outline';
  }
}

function isUrgent(createdAt: string): boolean {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PostingQueueList({ postings, loading, onPostingClick }: PostingQueueListProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleSelectAll = () => {
    if (selectedItems.length === postings.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(postings.map(p => p.id));
    }
  };

  const handleSelectItem = (postingId: string) => {
    setSelectedItems(prev =>
      prev.includes(postingId)
        ? prev.filter(id => id !== postingId)
        : [...prev, postingId]
    );
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    console.log(`Bulk ${action} for items:`, selectedItems);
    // TODO: Implement bulk moderation actions
    setSelectedItems([]);
  };

  if (loading) return <LoadingState />;

  if (postings.length === 0) return <EmptyState />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span>Moderation Queue</span>
            {selectedItems.length > 0 && (
              <Badge variant="secondary">{selectedItems.length} selected</Badge>
            )}
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve ({selectedItems.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject ({selectedItems.length})
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedItems.length === postings.length && postings.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Submitter</TableHead>
                <TableHead className="hidden lg:table-cell">Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Submitted</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {postings.map((posting) => (
                <TableRow key={posting.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedItems.includes(posting.id)}
                      onCheckedChange={() => handleSelectItem(posting.id)}
                    />
                  </TableCell>
                  <TableCell onClick={() => onPostingClick(posting.id)}>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-sm truncate max-w-xs lg:max-w-md">
                          {posting.title}
                        </p>
                        {isUrgent(posting.created_at) && (
                          <Badge variant="destructive" className="text-xs">
                            <Zap className="h-3 w-3 mr-1" />
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate max-w-xs lg:max-w-md">
                        {posting.description.substring(0, 100)}
                        {posting.description.length > 100 ? '...' : ''}
                      </p>
                      {posting.submitter_rejection_count > 0 && (
                        <Badge variant="outline" className="text-xs text-orange-600">
                          {posting.submitter_rejection_count} previous rejection{posting.submitter_rejection_count > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell" onClick={() => onPostingClick(posting.id)}>
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {posting.first_name[0]}{posting.last_name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:block">
                        <p className="text-sm font-medium">{posting.first_name} {posting.last_name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                          {posting.submitter_email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell" onClick={() => onPostingClick(posting.id)}>
                    <span className="text-sm">{posting.domain_name}</span>
                  </TableCell>
                  <TableCell onClick={() => onPostingClick(posting.id)}>
                    <Badge variant={getStatusBadgeVariant(posting.moderation_status)}>
                      {posting.moderation_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell" onClick={() => onPostingClick(posting.id)}>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(posting.created_at)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onPostingClick(posting.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

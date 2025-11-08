/**
 * My Postings Page
 *
 * Shows all postings created by the current user, regardless of status.
 * Allows users to view, edit (pending), and delete (draft) their own posts.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import APIService from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface Posting {
  id: string;
  title: string;
  content: string;
  posting_type: string;
  status: string;
  moderation_status: string;
  category_name: string;
  location?: string;
  location_type?: string;
  urgency_level?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  domains?: Array<{id: string; name: string; icon?: string; color_code?: string; domain_level?: string}>;
  tags?: Array<{id: string; name: string}>;
}

const MyPostingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [postings, setPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadMyPostings();
    }
  }, [user?.id]);

  const loadMyPostings = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await APIService.get<{postings: Posting[]; pagination: any}>(`/api/postings/my/${user.id}`);
      console.log('[MyPostingsPage] Loaded postings:', response.postings?.length, 'total');
      console.log('[MyPostingsPage] Status breakdown:', {
        active: response.postings?.filter(p => p.status === 'active').length,
        pending: response.postings?.filter(p => p.status === 'pending_review').length,
        draft: response.postings?.filter(p => p.status === 'draft').length,
        rejected: response.postings?.filter(p => p.status === 'rejected').length,
        archived: response.postings?.filter(p => p.status === 'archived').length
      });
      setPostings(response.postings || []);
    } catch (err: any) {
      console.error('Failed to load postings:', err);
      setError(err.message || 'Failed to load your postings');
      setPostings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postingId: string) => {
    const confirmed = window.confirm('Are you sure you want to archive this posting?\n\nYou can view archived posts by toggling the "Show Archived" option.');
    if (!confirmed) return;

    try {
      await APIService.deleteGeneric(`/api/postings/${postingId}`);
      // Reload data to get updated status from backend
      await loadMyPostings();
    } catch (err: any) {
      alert(err.message || 'Failed to archive posting');
    }
  };

  const getStatusBadge = (posting: Posting) => {
    const statusMap: Record<string, {label: string; className: string}> = {
      'draft': { label: 'Draft', className: 'bg-gray-500' },
      'pending_review': { label: 'Pending Review', className: 'bg-yellow-500' },
      'active': { label: 'Active', className: 'bg-green-500' },
      'rejected': { label: 'Rejected', className: 'bg-red-500' },
      'expired': { label: 'Expired', className: 'bg-gray-400' },
      'archived': { label: 'Archived', className: 'bg-slate-500' }
    };

    const statusInfo = statusMap[posting.status] || { label: posting.status, className: 'bg-gray-500' };

    return (
      <Badge className={statusInfo.className}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    return type === 'offer_support' ? 'Offering Support' : 'Seeking Support';
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Please log in to view your postings</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/postings')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Postings
          </Button>
          <h1 className="text-3xl font-bold">My Postings</h1>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="w-4 h-4"
            />
            Show Archived
          </label>
          <Button
            onClick={() => navigate('/postings/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create New Posting
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Loading your postings...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && postings.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">You haven't created any postings yet</p>
          <Button onClick={() => navigate('/postings/new')}>
            Create Your First Posting
          </Button>
        </Card>
      )}

      {/* Postings List */}
      {!loading && postings.length > 0 && (
        <div className="space-y-4">
          {postings
            .filter(p => showArchived ? true : p.status !== 'archived')
            .map(posting => (
            <Card key={posting.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Title and Status */}
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{posting.title}</h3>
                    {getStatusBadge(posting)}
                    <Badge variant="outline">{getTypeLabel(posting.posting_type)}</Badge>
                  </div>

                  {/* Category */}
                  {posting.category_name && (
                    <p className="text-sm text-gray-600 mb-2">
                      Category: {posting.category_name}
                    </p>
                  )}

                  {/* Content Preview */}
                  <p className="text-gray-700 mb-3 line-clamp-2">
                    {posting.content}
                  </p>

                  {/* Domains - 3-Level Hierarchy */}
                  {posting.domains && posting.domains.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {/* Primary Domain */}
                      {posting.domains.filter(d => d.domain_level === 'primary').length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-semibold text-gray-600">Primary:</span>
                          {posting.domains.filter(d => d.domain_level === 'primary').map(domain => (
                            <Badge
                              key={domain.id}
                              variant="default"
                              style={{ borderColor: domain.color_code || '#3b82f6', backgroundColor: domain.color_code || '#3b82f6' }}
                            >
                              {domain.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Secondary Domains */}
                      {posting.domains.filter(d => d.domain_level === 'secondary').length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-semibold text-gray-600">Secondary:</span>
                          {posting.domains.filter(d => d.domain_level === 'secondary').map(domain => (
                            <Badge
                              key={domain.id}
                              variant="outline"
                              style={{ borderColor: domain.color_code || '#6366f1' }}
                            >
                              {domain.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                      {/* Areas of Interest */}
                      {posting.domains.filter(d => d.domain_level === 'area_of_interest').length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs font-semibold text-gray-600">Areas:</span>
                          {posting.domains.filter(d => d.domain_level === 'area_of_interest').map(domain => (
                            <Badge
                              key={domain.id}
                              variant="secondary"
                            >
                              {domain.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    {posting.location && (
                      <span>📍 {posting.location}</span>
                    )}
                    {posting.urgency_level && (
                      <span>⚡ {posting.urgency_level}</span>
                    )}
                    <span>Created: {new Date(posting.created_at).toLocaleDateString()}</span>
                    {posting.expires_at && (
                      <span>Expires: {new Date(posting.expires_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Moderation Status for Rejected */}
                  {posting.status === 'rejected' && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                      <p className="text-sm text-red-800">
                        This posting was rejected during moderation review.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/postings/${posting.id}`)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="h-4 w-4" />
                    View
                  </Button>

                  {/* Allow edit for draft, pending_review, and active */}
                  {(posting.status === 'draft' || posting.status === 'pending_review' || posting.status === 'active') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/postings/${posting.id}/edit`)}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  )}

                  {/* Allow delete for draft and pending_review */}
                  {(posting.status === 'draft' || posting.status === 'pending_review') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(posting.id)}
                      className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {!loading && postings.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            Showing {postings.length} posting{postings.length !== 1 ? 's' : ''}
            {' • '}
            {postings.filter(p => p.status === 'active').length} active
            {' • '}
            {postings.filter(p => p.status === 'pending_review').length} pending review
            {' • '}
            {postings.filter(p => p.status === 'draft').length} draft
            {' • '}
            {postings.filter(p => p.status === 'rejected').length} rejected
            {' • '}
            {postings.filter(p => p.status === 'archived').length} archived
          </p>
        </div>
      )}
    </div>
  );
};

export default MyPostingsPage;

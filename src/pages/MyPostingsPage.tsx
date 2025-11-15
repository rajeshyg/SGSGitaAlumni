/**
 * My Postings Page - Enhanced with Tabs and Pagination
 *
 * Shows all postings created by the current user with status-based tabs.
 * Features:
 * - Tab-based filtering: All, Active, Pending, Rejected, Expired, Archived
 * - Pagination (10 items per page)
 * - Edit and delete capabilities based on status
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import APIService from '@/services/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Eye, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

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

type StatusTab = 'all' | 'active' | 'pending_review' | 'rejected' | 'expired' | 'archived';

const ITEMS_PER_PAGE = 10;

const MyPostingsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [allPostings, setAllPostings] = useState<Posting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<StatusTab>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user?.id) {
      loadMyPostings();
    }
  }, [user?.id]);

  // Reset to page 1 when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const loadMyPostings = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Load all postings (we'll filter client-side for now)
      // For better performance, backend could be enhanced to filter by status
      const response = await APIService.get<{postings: Posting[]; pagination: any}>(`/api/postings/my/${user.id}?limit=1000`);
      const postingsData = response.postings || [];

      console.log('[MyPostingsPage] Loaded postings:', postingsData.length, 'total');
      console.log('[MyPostingsPage] Full response:', response);
      console.log('[MyPostingsPage] Postings data:', postingsData);
      console.log('[MyPostingsPage] Status breakdown:', {
        active: postingsData.filter(p => p.status === 'active').length,
        pending: postingsData.filter(p => p.status === 'pending_review').length,
        rejected: postingsData.filter(p => p.status === 'rejected').length,
        expired: postingsData.filter(p => p.status === 'expired').length,
        archived: postingsData.filter(p => p.status === 'archived').length
      });
      console.log('[MyPostingsPage] Archived postings:', postingsData.filter(p => p.status === 'archived').map(p => ({ id: p.id, title: p.title, status: p.status })));

      setAllPostings(postingsData);
    } catch (err: any) {
      console.error('[MyPostingsPage] Failed to load postings:', err);
      setError(err.message || 'Failed to load your postings');
      setAllPostings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postingId: string) => {
    const confirmed = window.confirm('Are you sure you want to archive this posting?\n\nIt will be moved to the Archived tab.');
    if (!confirmed) return;

    setArchiving(postingId);

    try {
      console.log('[MyPostingsPage] Archiving posting:', postingId);

      // Call backend to archive
      const deleteResponse = await APIService.deleteGeneric(`/api/postings/${postingId}`);
      console.log('[MyPostingsPage] Archive API response:', deleteResponse);
      console.log('[MyPostingsPage] Archive API call successful');

      // Reload data from backend to get fresh status
      console.log('[MyPostingsPage] Reloading postings after archive...');
      await loadMyPostings();
      console.log('[MyPostingsPage] Reload complete, postings refreshed');

      // Switch to archived tab to show the user where it went
      console.log('[MyPostingsPage] Switching to archived tab...');
      setActiveTab('archived');

      console.log('[MyPostingsPage] Successfully archived and reloaded');
    } catch (err: any) {
      console.error('[MyPostingsPage] Failed to archive posting:', err);
      console.error('[MyPostingsPage] Error details:', {
        message: err.message,
        code: err.code,
        status: err.status,
        error: err
      });
      alert(err.message || 'Failed to archive posting');
      // Reload anyway to ensure UI is in sync
      await loadMyPostings();
    } finally {
      setArchiving(null);
    }
  };

  // Filter postings by active tab
  const getFilteredPostings = (): Posting[] => {
    let filtered: Posting[] = [];

    switch (activeTab) {
      case 'all':
        // Show everything except archived
        filtered = allPostings.filter(p => p.status !== 'archived');
        break;
      case 'active':
        filtered = allPostings.filter(p => p.status === 'active' || p.status === 'approved');
        break;
      case 'pending_review':
        filtered = allPostings.filter(p => p.status === 'pending_review' || p.status === 'draft');
        break;
      case 'rejected':
        filtered = allPostings.filter(p => p.status === 'rejected');
        break;
      case 'expired':
        filtered = allPostings.filter(p => p.status === 'expired');
        break;
      case 'archived':
        filtered = allPostings.filter(p => p.status === 'archived');
        break;
      default:
        filtered = allPostings;
    }

    return filtered;
  };

  // Get paginated postings
  const getPaginatedPostings = (): Posting[] => {
    const filtered = getFilteredPostings();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  // Calculate pagination info
  const getTotalPages = (): number => {
    const filtered = getFilteredPostings();
    return Math.ceil(filtered.length / ITEMS_PER_PAGE);
  };

  const getTabCount = (status: StatusTab): number => {
    switch (status) {
      case 'all':
        return allPostings.filter(p => p.status !== 'archived').length;
      case 'active':
        return allPostings.filter(p => p.status === 'active' || p.status === 'approved').length;
      case 'pending_review':
        return allPostings.filter(p => p.status === 'pending_review' || p.status === 'draft').length;
      case 'rejected':
        return allPostings.filter(p => p.status === 'rejected').length;
      case 'expired':
        return allPostings.filter(p => p.status === 'expired').length;
      case 'archived':
        return allPostings.filter(p => p.status === 'archived').length;
      default:
        return 0;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">;
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
        <Button
          onClick={() => navigate('/postings/new')}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create New Posting
        </Button>
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

      {/* Tabs and Content */}
      {!loading && (
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StatusTab)} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="all" className="text-sm">
              All <Badge variant="secondary" className="ml-2">{getTabCount('all')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="active" className="text-sm">
              Active <Badge variant="secondary" className="ml-2">{getTabCount('active')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending_review" className="text-sm">
              Pending <Badge variant="secondary" className="ml-2">{getTabCount('pending_review')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="text-sm">
              Rejected <Badge variant="secondary" className="ml-2">{getTabCount('rejected')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-sm">
              Expired <Badge variant="secondary" className="ml-2">{getTabCount('expired')}</Badge>
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-sm">
              Archived <Badge variant="secondary" className="ml-2">{getTabCount('archived')}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Tab Content - All statuses use same rendering logic */}
          {(['all', 'active', 'pending_review', 'rejected', 'expired', 'archived'] as StatusTab[]).map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="space-y-4">
              {getPaginatedPostings().length === 0 ? (
                <Card className="p-12 text-center">
                  <p className="text-gray-600 mb-4">
                    {tabValue === 'all' ? "You haven't created any postings yet" :
                     tabValue === 'active' ? "You don't have any active postings" :
                     tabValue === 'pending_review' ? "You don't have any pending postings" :
                     tabValue === 'rejected' ? "You don't have any rejected postings" :
                     tabValue === 'expired' ? "You don't have any expired postings" :
                     "You don't have any archived postings"}
                  </p>
                  {tabValue !== 'archived' && (
                    <Button onClick={() => navigate('/postings/new')}>
                      Create Your First Posting
                    </Button>
                  )}
                </Card>
              ) : (
                <>
                  {/* Postings List */}
                  <div className="space-y-4">
                    {getPaginatedPostings().map(posting => (
                      <PostingCard
                        key={posting.id}
                        posting={posting}
                        onDelete={handleDelete}
                        archiving={archiving}
                        navigate={navigate}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="flex items-center justify-between mt-6 px-4">
                      <div className="text-sm text-gray-600">
                        Page {currentPage} of {getTotalPages()} • {getFilteredPostings().length} total postings
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="flex items-center gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(getTotalPages(), p + 1))}
                          disabled={currentPage === getTotalPages()}
                          className="flex items-center gap-1"
                        >
                          Next
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

// Separate component for posting card to reduce complexity
const PostingCard = ({ 
  posting, 
  onDelete, 
  archiving, 
  navigate 
}: { 
  posting: Posting; 
  onDelete: (id: string) => void; 
  archiving: string | null;
  navigate: any;
}) => {
  const getStatusBadge = (posting: Posting) => {
    const statusMap: Record<string, {label: string; className: string}> = {
      'draft': { label: 'Draft', className: 'bg-gray-500' },
      'pending_review': { label: 'Pending Review', className: 'bg-yellow-500' },
      'active': { label: 'Active', className: 'bg-green-500' },
      'approved': { label: 'Active', className: 'bg-green-500' },
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

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
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
              onClick={() => onDelete(posting.id)}
              disabled={archiving === posting.id}
              className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              {archiving === posting.id ? 'Archiving...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};

export default MyPostingsPage;

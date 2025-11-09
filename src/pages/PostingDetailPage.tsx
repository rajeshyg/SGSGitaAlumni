/**
 * Posting Detail Page
 *
 * Displays full details of a single posting
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import APIService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2, Calendar, MapPin, Zap, Tag, FileText, MessageSquare } from 'lucide-react';

interface Posting {
  id: string;
  title: string;
  content: string;
  posting_type: string;
  status: string;
  moderation_status: string;
  category_name: string;
  category_description?: string;
  location?: string;
  location_type?: string;
  urgency_level?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  author_id: string;
  author_first_name: string;
  author_last_name: string;
  author_email: string;
  domains?: Array<{
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color_code?: string;
    domain_level?: string;
  }>;
  tags?: Array<{id: string; name: string; tag_type?: string}>;
  attachments?: Array<{
    id: string;
    file_name: string;
    file_type: string;
    file_url: string;
    file_size?: number;
    uploaded_at: string;
  }>;
}

const PostingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [posting, setPosting] = useState<Posting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);

  useEffect(() => {
    if (id) {
      loadPosting();
    }
  }, [id]);

  const loadPosting = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await APIService.get<{posting: Posting}>(`/api/postings/${id}`);
      setPosting(response.posting);
    } catch (err: any) {
      console.error('Failed to load posting:', err);
      setError(err.message || 'Failed to load posting');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!posting || !confirm('Are you sure you want to delete this posting?')) return;

    try {
      await APIService.deleteGeneric(`/api/postings/${posting.id}`);
      navigate('/postings/my');
    } catch (err: any) {
      alert(err.message || 'Failed to delete posting');
    }
  };

  const handleMessageAuthor = async () => {
    if (!posting || !user) return;

    setCreatingConversation(true);
    setError(null);

    try {
      // Create a POST_LINKED conversation
      const response = await APIService.postGeneric('/api/conversations', {
        type: 'POST_LINKED',
        postingId: posting.id,
        participantIds: [posting.author_id]
      });

      // Extract conversation ID from response
      const conversationId = response.data?.id || response.id;

      // Navigate to chat with the new conversation selected
      navigate(`/chat?conversationId=${conversationId}`);
    } catch (err: any) {
      console.error('Failed to create conversation:', err);
      setError(err.message || 'Failed to start conversation. Please try again.');
    } finally {
      setCreatingConversation(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, {label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'}> = {
      'draft': { label: 'Draft', variant: 'secondary' },
      'pending_review': { label: 'Pending Review', variant: 'outline' },
      'active': { label: 'Active', variant: 'default' },
      'rejected': { label: 'Rejected', variant: 'destructive' },
      'expired': { label: 'Expired', variant: 'secondary' }
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'outline' };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    return type === 'offer_support' ? 'Offering Support' : 'Seeking Support';
  };

  const isOwner = user?.id === posting?.author_id;
  const canEdit = isOwner && (posting?.status === 'draft' || posting?.status === 'pending_review' || posting?.status === 'active');
  const canDelete = isOwner && (posting?.status === 'draft' || posting?.status === 'pending_review');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading posting...</p>
        </div>
      </div>
    );
  }

  if (error || !posting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{error || 'Posting not found'}</p>
            <Button onClick={() => navigate('/postings')}>
              Back to Postings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <div className="flex gap-2">
          {/* Message Author Button (for non-owners) */}
          {!isOwner && posting.author_id !== user?.id && (
            <Button
              variant="outline"
              onClick={handleMessageAuthor}
              disabled={creatingConversation}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              {creatingConversation ? 'Starting...' : 'Message Author'}
            </Button>
          )}

          {/* Edit/Delete Buttons (for owners) */}
          {isOwner && (
            <>
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/postings/${posting.id}/edit`)}
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-2xl flex-1">{posting.title}</CardTitle>
              {getStatusBadge(posting.status)}
              <Badge variant="outline">{getTypeLabel(posting.posting_type)}</Badge>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                By {posting.author_first_name} {posting.author_last_name}
              </span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(posting.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Category */}
          {posting.category_name && (
            <div className="flex items-start gap-2">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-foreground">Category:</span>{' '}
                <span className="text-muted-foreground">{posting.category_name}</span>
                {posting.category_description && (
                  <p className="text-sm text-muted-foreground mt-1">{posting.category_description}</p>
                )}
              </div>
            </div>
          )}

          {/* Domains - 3-Level Hierarchy */}
          {posting.domains && posting.domains.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1">
                <span className="font-medium text-foreground block mb-3">Domains:</span>
                <div className="space-y-3">
                  {/* Primary Domain */}
                  {posting.domains.filter(d => d.domain_level === 'primary').length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Primary Domain:</span>
                      <div className="flex flex-wrap gap-2">
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
                    </div>
                  )}
                  {/* Secondary Domains */}
                  {posting.domains.filter(d => d.domain_level === 'secondary').length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Secondary Domains:</span>
                      <div className="flex flex-wrap gap-2">
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
                    </div>
                  )}
                  {/* Areas of Interest */}
                  {posting.domains.filter(d => d.domain_level === 'area_of_interest').length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase block mb-2">Areas of Interest:</span>
                      <div className="flex flex-wrap gap-2">
                        {posting.domains.filter(d => d.domain_level === 'area_of_interest').map(domain => (
                          <Badge key={domain.id} variant="secondary">
                            {domain.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {posting.tags && posting.tags.length > 0 && (
            <div className="flex items-start gap-2">
              <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-foreground block mb-2">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {posting.tags.map(tag => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Location */}
          {posting.location && (
            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-foreground">Location:</span>{' '}
                <span className="text-muted-foreground">
                  {posting.location}
                  {posting.location_type && ` (${posting.location_type})`}
                </span>
              </div>
            </div>
          )}

          {/* Urgency */}
          {posting.urgency_level && (
            <div className="flex items-start gap-2">
              <Zap className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-foreground">Urgency:</span>{' '}
                <span className="text-muted-foreground capitalize">{posting.urgency_level}</span>
              </div>
            </div>
          )}

          {/* Expiry */}
          {posting.expires_at && (
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium text-foreground">Expires:</span>{' '}
                <span className="text-muted-foreground">
                  {new Date(posting.expires_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="pt-4 border-t border-border">
            <h3 className="font-medium text-foreground mb-3">Description</h3>
            <div className="prose prose-sm max-w-none text-foreground">
              <p className="whitespace-pre-wrap">{posting.content}</p>
            </div>
          </div>

          {/* Attachments */}
          {posting.attachments && posting.attachments.length > 0 && (
            <div className="pt-4 border-t border-border">
              <h3 className="font-medium text-foreground mb-3">Attachments</h3>
              <div className="space-y-2">
                {posting.attachments.map(attachment => (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{attachment.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.file_type}
                        {attachment.file_size && ` • ${(attachment.file_size / 1024).toFixed(1)} KB`}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rejection Notice */}
          {posting.status === 'rejected' && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-medium">
                This posting was rejected during moderation review.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PostingDetailPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { CommentInput } from '../ui/comment-input';
import APIService from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import {
  MapPin,
  Calendar,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  AlertCircle,
  Users
} from 'lucide-react';

export interface Domain {
  id: string;
  name: string;
  icon?: string;
  color_code?: string;
  domain_level?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface PostingCardData {
  id: string;
  title: string;
  content: string;
  posting_type: 'offer_support' | 'seek_support';
  category_name?: string;
  domains: Domain[];
  tags: Tag[];
  location?: string;
  location_type?: 'remote' | 'in-person' | 'hybrid';
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  author_id: string;
  author_first_name?: string;
  author_last_name?: string;
  contact_name: string;
  contact_email: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'expired' | 'active';
  view_count?: number;
  interest_count?: number;
  published_at?: string;
  created_at: string;
}

interface PostingCardProps {
  posting: PostingCardData;
  onClick?: () => void;
  onLike?: (postingId: string) => void;
  onComment?: (postingId: string, commentText: string) => void;
  onShare?: (postingId: string) => void;
  showActions?: boolean;
  className?: string;
}

export const PostingCard: React.FC<PostingCardProps> = ({
  posting,
  onClick,
  onLike,
  onComment,
  onShare,
  showActions = false,
  className = ''
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExpressedInterest, setHasExpressedInterest] = useState(false);
  const [isExpressingInterest, setIsExpressingInterest] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !onComment) return;

    setIsSubmitting(true);
    try {
      await onComment(posting.id, commentText);
      setCommentText('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (level?: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'offer_support'
      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Handle expressing interest in a post
  const handleExpressInterest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setError('Please log in to express interest');
      return;
    }

    setIsExpressingInterest(true);
    setError(null);

    try {
      // Call the like endpoint to express interest
      if (onLike) {
        await onLike(posting.id);
      }
      setHasExpressedInterest(true);
    } catch (err: any) {
      console.error('Failed to express interest:', err);
      setError(err.message || 'Failed to express interest');
    } finally {
      setIsExpressingInterest(false);
    }
  };

  // Handle joining group discussion about the post
  const handleJoinGroupChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setError('Please log in to join discussion');
      return;
    }

    setIsCreatingChat(true);
    setError(null);

    try {
      // Check if group conversation already exists for this post
      const existingGroup = await APIService.get(`/api/conversations/group/${posting.id}`);

      if (existingGroup && existingGroup.id) {
        // Add current user to existing group
        await APIService.postGeneric(`/api/conversations/${existingGroup.id}/add-participant`, {
          userId: user.id
        });
        navigate(`/chat?conversationId=${existingGroup.id}`);
      } else {
        // Create new group conversation
        const response = await APIService.postGeneric('/api/conversations', {
          type: 'POST_LINKED',
          postingId: posting.id,
          isGroup: true,
          name: posting.title,
          participantIds: [posting.author_id, user.id]
        });
        navigate(`/chat?conversationId=${response.id}`);
      }
    } catch (err: any) {
      console.error('Failed to join group discussion:', err);
      setError(err.message || 'Failed to join group discussion');
    } finally {
      setIsCreatingChat(false);
    }
  };

  // Handle direct chat with post author
  const handleChatWithAuthor = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      setError('Please log in to chat with author');
      return;
    }

    setIsCreatingChat(true);
    setError(null);

    try {
      // Create POST_LINKED conversation with author and pre-filled message
      const response = await APIService.postGeneric('/api/conversations', {
        type: 'POST_LINKED',
        postingId: posting.id,
        participantIds: [posting.author_id],
        initialMessage: `Hi, I'm interested in your post about "${posting.title}"`
      });
      
      const conversationId = response.data?.id || response.id;
      navigate(`/chat?conversationId=${conversationId}`);
    } catch (err: any) {
      console.error('Failed to start conversation with author:', err);
      setError(err.message || 'Failed to start conversation');
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge className={getTypeColor(posting.posting_type)}>
                {posting.posting_type === 'offer_support' ? '🤝 Offer Support' : '🔍 Seek Support'}
              </Badge>
              {posting.urgency_level && (
                <Badge className={getUrgencyColor(posting.urgency_level)}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {posting.urgency_level}
                </Badge>
              )}
              {posting.location_type && (
                <Badge variant="outline">
                  {posting.location_type === 'remote' ? '🌐 Remote' : 
                   posting.location_type === 'in-person' ? '📍 In-Person' : 
                   '🔄 Hybrid'}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold mb-2">{posting.title}</h3>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {posting.content}
        </p>

        {/* Domains - 3-Level Hierarchy */}
        {posting.domains && posting.domains.length > 0 && (
          <div className="space-y-1">
            {/* Primary Domain */}
            {posting.domains.filter(d => d.domain_level === 'primary').length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-xs font-semibold text-muted-foreground">Primary:</span>
                {posting.domains.filter(d => d.domain_level === 'primary').map(domain => (
                  <Badge key={domain.id} variant="default" className="text-xs">
                    {domain.name}
                  </Badge>
                ))}
              </div>
            )}
            {/* Secondary Domains */}
            {posting.domains.filter(d => d.domain_level === 'secondary').length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-xs font-semibold text-muted-foreground">Secondary:</span>
                {posting.domains.filter(d => d.domain_level === 'secondary').map(domain => (
                  <Badge key={domain.id} variant="outline" className="text-xs">
                    {domain.name}
                  </Badge>
                ))}
              </div>
            )}
            {/* Areas of Interest */}
            {posting.domains.filter(d => d.domain_level === 'area_of_interest').length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <span className="text-xs font-semibold text-muted-foreground">Areas:</span>
                {posting.domains.filter(d => d.domain_level === 'area_of_interest').map(domain => (
                  <Badge key={domain.id} variant="secondary" className="text-xs">
                    {domain.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {posting.tags && posting.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {posting.tags.map((tag) => (
              <Badge key={tag.id} variant="outline" className="text-xs">
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Location and Date */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          {posting.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>{posting.location}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(posting.created_at)}</span>
          </div>
          {posting.view_count !== undefined && (
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{posting.view_count}</span>
            </div>
          )}
        </div>

        {/* Author and ID */}
        <div className="text-sm text-muted-foreground border-t pt-3">
          <div className="flex items-center justify-between">
            <span>
              Posted by {
                posting.author_first_name && posting.author_last_name
                  ? `${posting.author_first_name} ${posting.author_last_name}`
                  : posting.contact_name || 'Anonymous'
              }
            </span>
            <span className="text-xs text-muted-foreground/70 font-mono">
              ID: {posting.id}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {showActions && (
          <>
            {/* Error message */}
            {error && (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            {/* Express Interest or Follow-up Actions */}
            {user && user.id !== posting.author_id && posting.status === 'approved' && (
              <div className="border-t pt-3 space-y-2">
                {!hasExpressedInterest ? (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExpressInterest}
                    disabled={isExpressingInterest}
                    className="w-full"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {isExpressingInterest ? 'Expressing Interest...' : 'Express Interest'}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleJoinGroupChat}
                      disabled={isCreatingChat}
                      className="flex-1"
                    >
                      <Users className="mr-1 h-4 w-4" />
                      {isCreatingChat ? 'Joining...' : 'Join Group Discussion'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleChatWithAuthor}
                      disabled={isCreatingChat}
                      className="flex-1"
                    >
                      <MessageCircle className="mr-1 h-4 w-4" />
                      {isCreatingChat ? 'Starting...' : 'Chat with Author'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Standard Action Buttons (Like, Comment, Share) */}
            <div className="flex items-center gap-2 border-t pt-3">
              {onLike && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike(posting.id);
                  }}
                  className="flex-1 min-h-[44px]"
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Like {posting.interest_count ? `(${posting.interest_count})` : ''}
                </Button>
              )}
              {onComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCommentInput(!showCommentInput);
                  }}
                  className="flex-1 min-h-[44px]"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Comment
                </Button>
              )}
              {onShare && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(posting.id);
                  }}
                  className="flex-1 min-h-[44px]"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </>
        )}

        {/* Modern Inline Comment Input */}
        {showActions && showCommentInput && onComment && (
          <CommentInput
            value={commentText}
            onChange={setCommentText}
            onSubmit={handleSubmitComment}
            onCancel={() => {
              setShowCommentInput(false);
              setCommentText('');
            }}
            isSubmitting={isSubmitting}
            placeholder="Write a comment..."
          />
        )}
      </CardContent>
    </Card>
  );
};

export default PostingCard;


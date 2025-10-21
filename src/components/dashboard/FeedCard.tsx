import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Calendar,
  FileText,
  Users,
  Award
} from 'lucide-react';
import { FeedItem } from './DashboardFeed';

interface FeedCardProps {
  item: FeedItem;
  onLike: (itemId: string) => void;
  onComment: (itemId: string, commentText: string) => void;
  onShare: (itemId: string) => void;
}

export const FeedCard: React.FC<FeedCardProps> = ({ item, onLike, onComment, onShare }) => {
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getItemTypeIcon = () => {
    switch (item.item_type) {
      case 'posting':
        return <FileText className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'connection':
        return <Users className="h-4 w-4" />;
      case 'achievement':
        return <Award className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getItemTypeBadge = () => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      posting: 'default',
      event: 'secondary',
      connection: 'outline',
      achievement: 'default'
    };

    return (
      <Badge variant={variants[item.item_type] || 'default'} className="flex items-center gap-1">
        {getItemTypeIcon()}
        <span className="capitalize">{item.item_type}</span>
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await onComment(item.id, commentText);
      setCommentText('');
      setShowCommentInput(false);
    } catch (error) {
      console.error('Failed to submit comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.author_avatar || undefined} alt={item.author_name} />
              <AvatarFallback>{getInitials(item.author_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{item.author_name}</p>
              <p className="text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
            </div>
          </div>
          {getItemTypeBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        <div>
          {item.title && (
            <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
          )}
          <p className="text-sm text-foreground whitespace-pre-wrap">{item.content}</p>
        </div>

        {/* Engagement Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground border-t pt-3">
          <span>{item.like_count} {item.like_count === 1 ? 'like' : 'likes'}</span>
          <span>{item.comment_count} {item.comment_count === 1 ? 'comment' : 'comments'}</span>
          <span>{item.share_count} {item.share_count === 1 ? 'share' : 'shares'}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 border-t pt-3">
          <Button
            variant={item.user_liked ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onLike(item.id)}
            className="flex-1"
          >
            <Heart className={`h-4 w-4 mr-2 ${item.user_liked ? 'fill-current' : ''}`} />
            {item.user_liked ? 'Liked' : 'Like'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Comment
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onShare(item.id)}
            className="flex-1"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Comment Input */}
        {showCommentInput && (
          <div className="border-t pt-3 space-y-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full min-h-[80px] p-3 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isSubmitting}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentInput(false);
                  setCommentText('');
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isSubmitting}
              >
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedCard;


import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import APIService from '../../services/api';
import FeedCard from './FeedCard';

export interface FeedItem {
  id: string;
  item_type: 'posting' | 'event' | 'connection' | 'achievement';
  item_id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  user_liked: boolean;
}

interface DashboardFeedProps {
  userId: string;
}

export const DashboardFeed: React.FC<DashboardFeedProps> = ({ userId }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'postings' | 'events'>('all');
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [activeFilter, userId]);

  const loadFeed = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await APIService.get<{
        success: boolean;
        items: FeedItem[];
        pagination: { page: number; limit: number; total: number; hasMore: boolean };
      }>(`/api/feed?page=${pageNum}&limit=10&type=${activeFilter}`);

      if (response.success) {
        if (pageNum === 1) {
          setFeedItems(response.items);
        } else {
          setFeedItems(prev => [...prev, ...response.items]);
        }
        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      }
    } catch (err: any) {
      console.error('Failed to load feed:', err);
      setError(err.message || 'Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFeed(page + 1);
    }
  };

  const handleLike = async (itemId: string) => {
    try {
      const response = await APIService.post<{
        success: boolean;
        liked: boolean;
        like_count: number;
      }>(`/api/feed/items/${itemId}/like`, {});

      if (response.success) {
        setFeedItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, user_liked: response.liked, like_count: response.like_count }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleComment = async (itemId: string, commentText: string) => {
    try {
      const response = await APIService.post<{
        success: boolean;
        comment: any;
        comment_count: number;
      }>(`/api/feed/items/${itemId}/comment`, { comment_text: commentText });

      if (response.success) {
        setFeedItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, comment_count: response.comment_count }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleShare = async (itemId: string) => {
    try {
      const response = await APIService.post<{
        success: boolean;
        share_count: number;
      }>(`/api/feed/items/${itemId}/share`, {});

      if (response.success) {
        setFeedItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, share_count: response.share_count }
              : item
          )
        );
      }
    } catch (err) {
      console.error('Failed to share:', err);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as typeof activeFilter)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Activity</TabsTrigger>
          <TabsTrigger value="postings">Postings</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
        </TabsList>

        <TabsContent value={activeFilter} className="space-y-4 mt-6">
          {loading && page === 1 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <Card className="p-6">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </Card>
          ) : feedItems.length === 0 ? (
            <Card className="p-12">
              <div className="text-center text-muted-foreground">
                <p className="text-lg font-medium mb-2">No activity yet</p>
                <p className="text-sm">
                  {activeFilter === 'all'
                    ? 'Start connecting with alumni to see activity in your feed'
                    : activeFilter === 'postings'
                    ? 'No postings to display'
                    : 'No events to display'}
                </p>
              </div>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {feedItems.map(item => (
                  <FeedCard
                    key={item.id}
                    item={item}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-4">
                  <button
                    onClick={handleLoadMore}
                    disabled={loading}
                    className="px-6 py-2 text-sm font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardFeed;


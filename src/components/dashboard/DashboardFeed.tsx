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
        items: any[];
        pagination: { page: number; limit: number; total?: number; hasMore: boolean };
      }>(`/api/feed?page=${pageNum}&limit=10&type=${activeFilter}`);

      if (response.success && response.items) {
        // Map API response to FeedItem format
        const mappedItems: FeedItem[] = response.items.map((item: any) => ({
          id: item.id,
          item_type: item.type || item.item_type,
          item_id: item.item_id || item.id,
          title: item.title,
          content: item.content,
          author_id: item.author?.id || item.author_id,
          author_name: item.author?.name || item.author_name,
          author_avatar: item.author?.avatar || item.author_avatar,
          created_at: item.timestamp || item.created_at,
          like_count: item.engagement?.likes || item.like_count || 0,
          comment_count: item.engagement?.comments || item.comment_count || 0,
          share_count: item.engagement?.shares || item.share_count || 0,
          user_liked: item.engagement?.user_liked || item.user_liked || false
        }));

        if (pageNum === 1) {
          setFeedItems(mappedItems);
        } else {
          setFeedItems(prev => [...prev, ...mappedItems]);
        }
        setHasMore(response.pagination.hasMore);
        setPage(pageNum);
      } else {
        // No items returned
        if (pageNum === 1) {
          setFeedItems([]);
        }
        setHasMore(false);
      }
    } catch (err: any) {
      console.error('Failed to load feed:', err);
      setError(err.message || 'Failed to load activity feed');
      if (pageNum === 1) {
        setFeedItems([]);
      }
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
        <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-lg border border-border/40">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all font-medium"
          >
            All Activity
          </TabsTrigger>
          <TabsTrigger
            value="postings"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all font-medium"
          >
            Postings
          </TabsTrigger>
          <TabsTrigger
            value="events"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all font-medium"
          >
            Events
          </TabsTrigger>
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
                    type="button"
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


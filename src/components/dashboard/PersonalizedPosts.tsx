import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import APIService from '../../services/api';

interface FeedPreviewItem {
  id: string;
  title: string;
  item_type: 'posting' | 'event' | 'connection' | 'achievement';
  like_count: number;
  comment_count: number;
  share_count: number;
  created_at: string;
}

interface PersonalizedPostsProps {
  userId: string | number;
  limit?: number;
}

export const PersonalizedPosts: React.FC<PersonalizedPostsProps> = ({ userId, limit = 3 }) => {
  const [items, setItems] = useState<FeedPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await APIService.get(`/api/feed?page=1&limit=${limit}&type=postings&userId=${userId}`) as any;
        if (isMounted && data?.items) {
          setItems(data.items.slice(0, limit));
        } else if (isMounted) {
          setItems([]);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load posts');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, [userId, limit]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4 sm:pb-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">Personalized Posts</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No personalized posts yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map(item => (
              <button type="button"
                key={item.id}
                onClick={() => { window.location.href = `/feed/items/${item.id}`; }}
                className="w-full text-left rounded-lg border border-border/60 bg-card/80 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-foreground truncate">{item.title}</h4>
                      <Badge variant="outline" className="text-xs capitalize">{item.item_type}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="shrink-0 text-xs text-muted-foreground space-x-3">
                    <span>❤ {item.like_count}</span>
                    <span>💬 {item.comment_count}</span>
                    <span>↗ {item.share_count}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PersonalizedPosts;

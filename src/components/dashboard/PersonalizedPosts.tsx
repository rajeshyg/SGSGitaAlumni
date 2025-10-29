import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';
import APIService from '../../services/api';
import { PostingCard, PostingCardData } from '../postings/PostingCard';

interface PersonalizedPostsProps {
  userId: string | number;
  limit?: number;
}

export const PersonalizedPosts: React.FC<PersonalizedPostsProps> = ({ userId, limit = 3 }) => {
  const [postings, setPostings] = useState<PostingCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch postings from the postings API endpoint
        const data = await APIService.get(`/api/postings?status=active&limit=${limit}`) as any;

        if (isMounted && data?.postings) {
          setPostings(data.postings.slice(0, limit));
        } else if (isMounted) {
          setPostings([]);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load posts');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, [userId, limit]);

  const handlePostingClick = (posting: PostingCardData) => {
    window.location.href = `/postings/${posting.id}`;
  };

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4 sm:pb-5 flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
          Recent Postings
        </CardTitle>
        <a
          href="/postings"
          className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
        >
          View All →
        </a>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : postings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No postings available yet.</p>
        ) : (
          <div className="space-y-4">
            {postings.map(posting => (
              <PostingCard
                key={posting.id}
                posting={posting}
                onClick={() => handlePostingClick(posting)}
                showActions={false}
                className="hover:shadow-md transition-shadow"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default PersonalizedPosts;

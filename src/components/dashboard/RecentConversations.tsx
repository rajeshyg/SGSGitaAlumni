import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import APIService from '../../services/api';
import type { Conversation } from '../../services/APIService';

interface RecentConversationsProps {
  userId?: string | number;
  limit?: number;
}

export const RecentConversations: React.FC<RecentConversationsProps> = ({ userId, limit = 5 }) => {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Use dedicated endpoint if available; falls back to empty array server-side
        const qs = userId ? `?userId=${userId}&limit=${limit}` : `?limit=${limit}`;
        const data = await APIService.get(`/api/conversations/recent${qs}`);
        if (isMounted) setItems(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to load conversations');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false };
  }, [userId, limit]);

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4 sm:pb-5">
        <CardTitle className="text-xl font-semibold tracking-tight text-foreground">Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent conversations.</p>
        ) : (
          <div className="space-y-3">
            {items.slice(0, limit).map((conv) => {
              const name = conv.participants?.map(p => `${p.firstName || ''} ${p.lastName || ''}`.trim()).filter(Boolean).join(', ') || 'Conversation';
              const last = conv.lastMessage;
              return (
                <button type="button"
                  key={conv.id}
                  onClick={() => { window.location.href = `/chat?c=${conv.id}`; }}
                  className="w-full text-left rounded-lg border border-border/60 bg-card/80 p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={conv.participants?.[0]?.profileImageUrl || ''} alt={name} />
                      <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{name}</p>
                      {last && (
                        <p className="text-xs text-muted-foreground truncate">{last.senderName}: {last.content}</p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <Button size="sm" variant="secondary" className="shrink-0">{conv.unreadCount} new</Button>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentConversations;

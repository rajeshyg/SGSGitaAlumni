import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { OpportunitiesSpotlightProps } from '../../types/dashboard';

const formatMeta = (item: { location?: string | null }) => {
  return item.location || null;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
};

const renderOpportunityList = (items: OpportunitiesSpotlightProps['matched']) => {
  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-gray-600">No opportunities to show right now.</p>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => { window.location.href = `/postings/${item.id}`; }}
          className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-4 transition-colors hover:border-primary/40 hover:bg-primary/5 dark:hover:bg-primary/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {item.title}
                </h4>
                {item.type && (
                  <Badge variant="outline" className="text-xs">{item.type}</Badge>
                )}
                {item.urgency && (
                  <Badge variant="destructive" className="text-xs">{item.urgency}</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {formatMeta(item) || 'Add more details to your profile to improve matches.'}
              </p>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {formatDate(item.createdAt) || 'New'}
            </p>
          </div>
          <div className="mt-2 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
            {typeof item.viewCount === 'number' && (
              <span>{item.viewCount} views</span>
            )}
            {typeof item.interestCount === 'number' && (
              <span>{item.interestCount} interested</span>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export const OpportunitiesSpotlight: React.FC<OpportunitiesSpotlightProps> = ({ matched, trending }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Opportunities Spotlight</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Matched for you</h3>
          {renderOpportunityList(matched)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Trending in the network</h3>
          {renderOpportunityList(trending)}
        </div>
      </CardContent>
    </Card>
  );
};

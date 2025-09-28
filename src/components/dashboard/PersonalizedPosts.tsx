// ============================================================================
// PERSONALIZED POSTS COMPONENT
// ============================================================================
// Personalized posts and recommendations widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { PersonalizedPostsProps } from '../../types/dashboard';

export const PersonalizedPosts: React.FC<PersonalizedPostsProps> = ({ posts }) => {
  if (posts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recommended for You</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No personalized recommendations available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended for You</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                // Navigate to post
                window.location.href = `/postings/${post.id}`;
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {post.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    by {post.author.firstName} {post.author.lastName}
                  </p>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {post.type}
                    </Badge>
                    {post.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(post.timestamp).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-4 pt-4 border-t">
          <button
            className="w-full text-center text-primary hover:text-primary/80 font-medium"
            onClick={() => {
              window.location.href = '/postings';
            }}
          >
            View All Postings
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
// ============================================================================
// RECENT CONVERSATIONS COMPONENT
// ============================================================================
// Recent conversations preview widget

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Badge from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { RecentConversationsProps } from '../../types/dashboard';

export const RecentConversations: React.FC<RecentConversationsProps> = ({ conversations }) => {
  if (conversations.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">
            No recent conversations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3 sm:pb-6">
        <CardTitle className="text-lg sm:text-xl">Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 sm:space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors active:bg-gray-100 touch-manipulation"
              onClick={() => {
                // Navigate to conversation
                window.location.href = `/messages/${conversation.id}`;
              }}
            >
              {/* Avatar */}
              <Avatar className="h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0">
                <AvatarFallback className="text-xs sm:text-sm">
                  {conversation.participants[0]?.firstName?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">
                    {conversation.participants.map(p => `${p.firstName} ${p.lastName}`).join(', ')}
                  </h4>
                  <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-gray-600 truncate mt-1">
                  {conversation.lastMessage.content}
                </p>

                <p className="text-xs text-gray-500 mt-1">
                  {new Date(conversation.lastMessage.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* View All Link */}
        <div className="mt-4 pt-3 sm:pt-4 border-t">
          <button
            className="w-full text-center text-primary hover:text-primary/80 font-medium text-sm sm:text-base py-2 touch-manipulation"
            onClick={() => {
              window.location.href = '/messages';
            }}
          >
            View All Conversations
          </button>
        </div>
      </CardContent>
    </Card>
  );
};
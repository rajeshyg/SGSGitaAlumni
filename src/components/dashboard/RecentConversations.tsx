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
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            No recent conversations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Conversations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => {
                // Navigate to conversation
                window.location.href = `/messages/${conversation.id}`;
              }}
            >
              {/* Avatar Group for Multiple Participants */}
              <div className="relative">
                {conversation.participants.slice(0, 2).map((participant, index) => (
                  <Avatar
                    key={participant.id}
                    className={`h-10 w-10 border-2 border-white ${
                      index > 0 ? '-ml-2' : ''
                    }`}
                  >
                    <AvatarImage src={`/api/placeholder/avatar/${participant.id}`} />
                    <AvatarFallback>
                      {participant.firstName[0]}{participant.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {conversation.participants.length > 2 && (
                  <div className="h-10 w-10 -ml-2 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium">
                    +{conversation.participants.length - 2}
                  </div>
                )}
              </div>

              {/* Conversation Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900 truncate">
                    {conversation.participants.length === 1
                      ? `${conversation.participants[0].firstName} ${conversation.participants[0].lastName}`
                      : `${conversation.participants.length} participants`
                    }
                  </h4>
                  <div className="flex items-center space-x-2">
                    {conversation.isOnline && (
                      <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    )}
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 truncate mt-1">
                  <span className="font-medium">
                    {conversation.lastMessage.sender.firstName}:
                  </span>
                  {' '}
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
        <div className="mt-4 pt-4 border-t">
          <button
            className="w-full text-center text-primary hover:text-primary/80 font-medium"
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
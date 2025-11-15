/**
 * Posting Queue Item Component
 * 
 * Individual posting card in the moderation queue
 * 
 * Task: Action 8 - Moderator Review System
 * Date: November 3, 2025
 */

import type { QueuePosting } from '../../types/moderation';

interface PostingQueueItemProps {
  posting: QueuePosting;
  onClick: () => void;
}

// Utility functions
const isUrgent = (createdAt: string) => {
  const created = new Date(createdAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'ESCALATED':
      return 'bg-orange-100 text-orange-800';
    case 'APPROVED':
      return 'bg-green-100 text-green-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Sub-components
const UrgentBadge = () => (
  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
    <svg className="mr-1 h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M13 10V3L4 14h7v7l9-11h-7z" clipRule="evenodd" />
    </svg>
    Urgent
  </span>
);

const UserInfo = ({ firstName, lastName }: { firstName: string; lastName: string }) => (
  <div className="flex items-center">
    <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
    <span>{firstName} {lastName}</span>
  </div>
);

const PostingMetadata = ({ posting }: { posting: QueuePosting }) => (
  <div className="mt-2 flex items-center space-x-4 text-sm text-muted-foreground">
    <UserInfo firstName={posting.first_name} lastName={posting.last_name} />
    <div className="flex items-center">
      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
      <span>{formatDate(posting.created_at)}</span>
    </div>
    <div className="flex items-center">
      <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
      <span>{posting.domain_name}</span>
    </div>
    {posting.submitter_rejection_count > 0 && (
      <div className="flex items-center text-red-600">
        <svg className="flex-shrink-0 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span>{posting.submitter_rejection_count} previous rejection{posting.submitter_rejection_count > 1 ? 's' : ''}</span>
      </div>
    )}
  </div>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(status)}`}>
    {status}
  </span>
);

export function PostingQueueItem({ posting, onClick }: PostingQueueItemProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className="w-full text-left block hover:bg-accent focus:outline-none focus:bg-accent transition duration-150 ease-in-out"
      >
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center">
                <p className="text-sm font-medium text-primary truncate">
                  {posting.title}
                </p>
                {isUrgent(posting.created_at) && <UrgentBadge />}
              </div>
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <p className="truncate">{posting.description.substring(0, 150)}{posting.description.length > 150 ? '...' : ''}</p>
              </div>
              <PostingMetadata posting={posting} />
            </div>
            <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
              <StatusBadge status={posting.moderation_status} />
              <svg className="h-5 w-5 text-muted-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </button>
    </li>
  );
}

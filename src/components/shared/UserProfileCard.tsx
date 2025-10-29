/**
 * UserProfileCard - Reusable component for displaying user profile information
 * Used across dashboard, header, and other profile displays
 * Follows theme standards and ensures consistent styling
 */

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import Badge from '../ui/badge';
import { cn } from '../../lib/utils';

export interface UserProfileData {
  id: string | number;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  avatar?: string;
  avatarUrl?: string;
  position?: string;
  company?: string;
  location?: string;
  professionalStatus?: string;
}

export interface UserProfileCardProps {
  user: UserProfileData;
  variant?: 'compact' | 'default' | 'detailed';
  showRole?: boolean;
  showPosition?: boolean;
  showLocation?: boolean;
  className?: string;
  onClick?: () => void;
}

const getInitials = (user: UserProfileData): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  }
  
  const nameParts = user.name.split(' ').filter(Boolean);
  if (nameParts.length >= 2) {
    return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
  }
  
  return user.name.slice(0, 2).toUpperCase();
};

const getDisplayName = (user: UserProfileData): string => {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.name;
};

/**
 * Compact variant - minimal profile display (e.g., in headers)
 */
const CompactProfile: React.FC<UserProfileCardProps> = ({ user, className, onClick }) => {
  const avatarSrc = user.avatar || user.avatarUrl;
  
  return (
    <div 
      className={cn(
        'flex items-center gap-2',
        onClick && 'cursor-pointer hover:opacity-80 transition-opacity',
        className
      )}
      onClick={onClick}
    >
      <Avatar className="h-8 w-8 border-2 border-primary/20">
        <AvatarImage src={avatarSrc} alt={getDisplayName(user)} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
          {getInitials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="hidden lg:block text-right min-w-0">
        <p className="text-sm font-medium truncate">{getDisplayName(user)}</p>
        {user.professionalStatus && user.role && (
          <p className="text-xs text-muted-foreground truncate">
            {user.professionalStatus} • {user.role}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * Default variant - standard profile card
 */
const DefaultProfile: React.FC<UserProfileCardProps> = ({ 
  user, 
  showRole = true, 
  showPosition = true,
  className,
  onClick 
}) => {
  const avatarSrc = user.avatar || user.avatarUrl;
  
  return (
    <div 
      className={cn(
        'flex items-center gap-3',
        onClick && 'cursor-pointer hover:bg-muted/50 transition-colors rounded-lg p-2 -m-2',
        className
      )}
      onClick={onClick}
    >
      <Avatar className="h-12 w-12 shrink-0">
        <AvatarImage src={avatarSrc} alt={getDisplayName(user)} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
          {getInitials(user)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-medium text-foreground truncate">
          {getDisplayName(user)}
        </h4>
        {showPosition && (user.position || user.company) && (
          <p className="text-sm text-muted-foreground truncate">
            {[user.position, user.company].filter(Boolean).join(' at ')}
          </p>
        )}
        {showRole && user.role && (
          <Badge variant="secondary" className="text-xs mt-1">
            {user.role}
          </Badge>
        )}
      </div>
    </div>
  );
};

/**
 * Detailed variant - full profile card with all information
 */
const DetailedProfile: React.FC<UserProfileCardProps> = ({ 
  user, 
  showRole = true,
  showPosition = true,
  showLocation = true,
  className,
  onClick 
}) => {
  const avatarSrc = user.avatar || user.avatarUrl;
  
  return (
    <Card 
      className={cn(
        'overflow-hidden',
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={avatarSrc} alt={getDisplayName(user)} />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
              {getInitials(user)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h3 className="text-lg font-semibold text-foreground truncate">
                {getDisplayName(user)}
              </h3>
              {user.email && (
                <p className="text-sm text-muted-foreground truncate">{user.email}</p>
              )}
            </div>
            
            {showPosition && (user.position || user.company) && (
              <p className="text-sm text-foreground truncate">
                {[user.position, user.company].filter(Boolean).join(' at ')}
              </p>
            )}
            
            {showLocation && user.location && (
              <p className="text-sm text-muted-foreground truncate">{user.location}</p>
            )}
            
            {showRole && user.role && (
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {user.role}
                </Badge>
                {user.professionalStatus && (
                  <Badge variant="outline" className="text-xs">
                    {user.professionalStatus}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main UserProfileCard component with variant support
 */
export const UserProfileCard: React.FC<UserProfileCardProps> = (props) => {
  const { variant = 'default' } = props;
  
  switch (variant) {
    case 'compact':
      return <CompactProfile {...props} />;
    case 'detailed':
      return <DetailedProfile {...props} />;
    case 'default':
    default:
      return <DefaultProfile {...props} />;
  }
};

export default UserProfileCard;


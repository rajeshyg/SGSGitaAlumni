/**
 * AlumniCard Component
 * Responsive card component for displaying individual alumni information
 * Follows iOS-style design patterns and cross-platform compatibility standards
 */

import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/card';
import { Avatar } from '../ui/avatar';
import Badge from '../ui/badge';
import { Mail, Phone, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { AlumniMember } from '../../types/directory';

export interface AlumniCardProps {
  alumni: AlumniMember;
  onClick?: (alumni: AlumniMember) => void;
  className?: string;
}

/**
 * AlumniCard - Display individual alumni member information
 * @param alumni Alumni member data
 * @param onClick Optional click handler
 * @param className Optional additional CSS classes
 */
export const AlumniCard: React.FC<AlumniCardProps> = ({ alumni, onClick, className }) => {
  const handleClick = () => {
    if (onClick) {
      onClick(alumni);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(alumni);
    }
  };

  // Generate initials for avatar
  const getInitials = (firstName: string | null, lastName: string | null): string => {
    const first = firstName?.trim() || '';
    const last = lastName?.trim() || '';
    
    if (first && last) {
      return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    } else if (first) {
      return first.charAt(0).toUpperCase();
    } else if (last) {
      return last.charAt(0).toUpperCase();
    }
    
    // Fallback to '?' if no name available
    return '?';
  };

  // Get display name with fallback
  const getDisplayName = (displayName: string, studentId: string): string => {
    const name = displayName?.trim();
    // Check if name is empty, "null null", or just whitespace
    if (!name || name === 'null null' || name === 'null') {
      return studentId || 'Anonymous';
    }
    return name;
  };

  return (
    <Card
      elevation="sm"
      interactive={!!onClick}
      className={cn(
        'relative overflow-hidden',
        onClick && 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View profile for ${alumni.displayName}` : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12 flex-shrink-0 sm:h-16 sm:w-16">
            <div className="flex h-full w-full items-center justify-center bg-primary text-primary-foreground font-semibold text-sm sm:text-base">
              {getInitials(alumni.firstName, alumni.lastName)}
            </div>
          </Avatar>

          {/* Main Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg leading-tight truncate">
              {getDisplayName(alumni.displayName, alumni.studentId)}
            </h3>
            <p className="text-sm text-muted-foreground truncate mt-1">
              {alumni.studentId}
            </p>

            {/* Graduation Year Badge */}
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Class of {alumni.graduationYear}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-2.5 text-sm">
        {/* Department/Degree */}
        {(alumni.department || alumni.degree) && (
          <div className="flex items-start gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              {alumni.department && (
                <p className="truncate">{alumni.department}</p>
              )}
              {alumni.degree && (
                <p className="text-xs text-muted-foreground truncate">{alumni.degree}</p>
              )}
            </div>
          </div>
        )}

        {/* Email */}
        {alumni.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a
              href={`mailto:${alumni.email}`}
              className="text-primary hover:underline truncate flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              {alumni.email}
            </a>
          </div>
        )}

        {/* Phone */}
        {alumni.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <a
              href={`tel:${alumni.phone}`}
              className="text-primary hover:underline truncate flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              {alumni.phone}
            </a>
          </div>
        )}

        {/* Location */}
        {alumni.location && (
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="truncate flex-1 min-w-0 text-muted-foreground">
              {alumni.location}
            </span>
          </div>
        )}
      </CardContent>

      {/* Interactive indicator */}
      {onClick && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </Card>
  );
};

export default AlumniCard;

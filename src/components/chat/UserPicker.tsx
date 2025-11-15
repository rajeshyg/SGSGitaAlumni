// ============================================================================
// USER PICKER COMPONENT
// ============================================================================
// Search and select alumni users for conversations
// Integrates with existing APIService.searchAppUsers

import React, { useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { Search, X, UserCircle } from 'lucide-react';
import { APIService } from '../../services/APIService';

interface AppUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  status?: string;
  profileImageUrl?: string;
}

interface UserPickerProps {
  /** Allow multiple user selection (for GROUP conversations) */
  multiple?: boolean;
  /** Currently selected user IDs */
  selectedUserIds: string[];
  /** Callback when selection changes */
  onSelectionChange: (userIds: string[]) => void;
  /** Exclude specific user IDs from results (e.g., current user) */
  excludeUserIds?: string[];
  /** Maximum number of users that can be selected */
  maxSelection?: number;
  /** Placeholder text for search input */
  placeholder?: string;
}

export const UserPicker: React.FC<UserPickerProps> = ({
  multiple = false,
  selectedUserIds,
  onSelectionChange,
  excludeUserIds = [],
  maxSelection = 50,
  placeholder = 'Search alumni by name or email...'
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search users function
  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await APIService.searchAppUsers(query, 20);
      // Filter out excluded users (e.g., current user)
      const filteredResults = results.filter(
        (user: AppUser) => !excludeUserIds.includes(user.id)
      );
      setUsers(filteredResults);
    } catch (err: any) {
      console.error('User search failed:', err);
      setError('Failed to search users. Please try again.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, excludeUserIds]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleUserToggle = (userId: string) => {
    if (multiple) {
      // Multi-select logic
      if (selectedUserIds.includes(userId)) {
        // Remove user
        onSelectionChange(selectedUserIds.filter(id => id !== userId));
      } else {
        // Add user (check max limit)
        if (selectedUserIds.length >= maxSelection) {
          setError(`Maximum ${maxSelection} users can be selected`);
          return;
        }
        onSelectionChange([...selectedUserIds, userId]);
      }
    } else {
      // Single-select logic
      if (selectedUserIds.includes(userId)) {
        onSelectionChange([]);
      } else {
        onSelectionChange([userId]);
      }
    }
    setError(null);
  };

  const handleRemoveUser = (userId: string) => {
    onSelectionChange(selectedUserIds.filter(id => id !== userId));
  };

  const clearSearch = () => {
    setSearchQuery('');
    setUsers([]);
  };

  const getUserDisplayName = (user: AppUser): string => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    return fullName || user.email || 'Unknown User';
  };

  const getUserInitials = (user: AppUser): string => {
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleSearchChange}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={clearSearch}
            title="Clear search"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">
          {error}
        </div>
      )}

      {/* Selected Users */}
      {selectedUserIds.length > 0 && (
        <div className="space-y-2">
          <span className="text-sm font-medium text-foreground">
            Selected ({selectedUserIds.length}{multiple && `/${maxSelection}`}):
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedUserIds.map(userId => {
              const user = users.find(u => u.id === userId);
              if (!user) return null;
              return (
                <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                  {getUserDisplayName(user)}
                  <button
                    type="button"
                    onClick={() => handleRemoveUser(userId)}
                    title={`Remove ${getUserDisplayName(user)}`}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Search Results */}
      {searchQuery && (
        <div className="border border-border rounded-md">
          <ScrollArea className="h-64">
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Searching...</p>
              </div>
            )}

            {!loading && users.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">No users found</p>
              </div>
            )}

            {!loading && users.length > 0 && (
              <div className="p-2">
                {users.map(user => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <div
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                      className={`
                        flex items-center gap-3 p-3 rounded-md cursor-pointer
                        transition-colors hover:bg-muted
                        ${isSelected ? 'bg-muted' : ''}
                      `}
                    >
                      {multiple && (
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleUserToggle(user.id)}
                        />
                      )}

                      {/* User Avatar */}
                      <div className="flex-shrink-0">
                        {user.profileImageUrl ? (
                          <img
                            src={user.profileImageUrl}
                            alt={getUserDisplayName(user)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {getUserInitials(user)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* User Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {getUserDisplayName(user)}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>

                      {/* Selected Indicator */}
                      {!multiple && isSelected && (
                        <div className="text-primary">
                          <UserCircle className="h-5 w-5 fill-current" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Help Text */}
      {!searchQuery && selectedUserIds.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Start typing to search for alumni
        </p>
      )}
    </div>
  );
};

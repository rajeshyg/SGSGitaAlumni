import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import Badge from '../ui/badge';
import { Users, X, CheckSquare, Square, Trash2, UserCheck } from 'lucide-react';
import { TanStackAdvancedTable } from '../ui';
import { type ColumnDef } from "@tanstack/react-table";

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  graduationYear: number;
  program: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  profileImageUrl?: string;
  isProfileComplete: boolean;
  ageVerified: boolean;
  parentConsentRequired: boolean;
  createdAt: string;
}

interface UserSelectorProps {
  selectedUsers: UserSearchResult[];
  onUserRemove: (userId: string) => void;
  onClearSelection: () => void;
  onSelectAll?: (users: UserSearchResult[]) => void;
  availableUsers?: UserSearchResult[];
  showAvailableUsers?: boolean;
}


export function UserSelector({
  selectedUsers,
  onUserRemove,
  onClearSelection,
  onSelectAll,
  availableUsers = [],
  showAvailableUsers = false
}: UserSelectorProps) {
  const handleSelectAll = () => {
    if (onSelectAll && availableUsers.length > 0) {
      onSelectAll(availableUsers);
    }
  };

  const handleUserToggle = (user: UserSearchResult) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      onUserRemove(user.id);
    } else if (onSelectAll) {
      onSelectAll([user]);
    }
  };

  const columns: ColumnDef<UserSearchResult>[] = [
    {
      id: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="font-medium">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'program',
      accessorKey: 'program',
      header: 'Program',
    },
    {
      id: 'graduationYear',
      accessorKey: 'graduationYear',
      header: 'Grad Year',
    },
    {
      id: 'profileStatus',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isProfileComplete ? 'secondary' : 'outline'}>
          {row.original.isProfileComplete ? 'Complete' : 'Incomplete'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUserRemove(row.original.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="h-4 w-4" />
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    },
  ];

  const tableConfig = {
    searchable: false,
    filterable: false,
    sortable: true,
    pagination: false,
    maxHeight: "400px",
    className: "border rounded-lg"
  };

  if (selectedUsers.length === 0 && !showAvailableUsers) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No users selected</p>
            <p className="text-sm">Search and select alumni above to send invitations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Selected Users
            </CardTitle>
            <CardDescription>
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected for invitations
            </CardDescription>
          </div>
          {selectedUsers.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearSelection}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        {showAvailableUsers && availableUsers.length > 0 && (
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Select All ({availableUsers.length})
            </Button>
            <span className="text-sm text-muted-foreground">
              {availableUsers.length} users available
            </span>
          </div>
        )}

        {/* Selected Users Table */}
        {selectedUsers.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span>Selected Users</span>
              <Badge variant="secondary">{selectedUsers.length}</Badge>
            </div>

            <TanStackAdvancedTable
              data={selectedUsers as any}
              columns={columns as any}
              {...tableConfig}
            />
          </div>
        )}


        {/* Summary */}
        {selectedUsers.length > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ready to send invitations to:</span>
              <div className="flex gap-2">
                <Badge variant="default">
                  {selectedUsers.filter(u => u.isProfileComplete).length} Complete Profiles
                </Badge>
                <Badge variant="secondary">
                  {selectedUsers.filter(u => !u.isProfileComplete).length} Incomplete Profiles
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
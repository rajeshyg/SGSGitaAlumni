import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Badge from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { UserCheck, Search, Edit, Save, X, Mail, Shield, Ban, CheckCircle, Clock } from 'lucide-react';
import { APIService } from '../../services/APIService';
import { TanStackAdvancedTable } from '../ui/tanstack-advanced-table';
import { ColumnDef } from '@tanstack/react-table';

interface AppUser {
  id: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  firstName?: string;
  lastName?: string;
  createdAt: string;
  lastLoginAt?: string;
  invitationId?: string;
  alumniMemberId?: string;
}

interface AppUserManagementProps {
  onUserUpdated?: (user: AppUser) => void;
}

export function AppUserManagement({ onUserUpdated }: AppUserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AppUser>>({});

  // Load app users on component mount
  useEffect(() => {
    loadAppUsers();
  }, []);

  const loadAppUsers = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await APIService.searchAppUsers(query);
      setUsers(data);
    } catch (err) {
      setError('Failed to load app users');
      console.error('Error loading app users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadAppUsers(query);
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user.id);
    setEditForm({ ...user });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await APIService.updateAppUser(editingUser, editForm);

      // Reload the data to reflect changes
      await loadAppUsers(searchQuery);

      setSuccess('App user updated successfully!');
      setEditingUser(null);
      setEditForm({});

      if (onUserUpdated) {
        const updatedUser = users.find(u => u.id === editingUser);
        if (updatedUser) onUserUpdated({ ...updatedUser, ...editForm });
      }
    } catch (err) {
      setError('Failed to update app user');
      console.error('Error updating app user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      suspended: 'destructive'
    } as const;

    const icons = {
      active: <CheckCircle className="h-3 w-3 mr-1" />,
      inactive: <Clock className="h-3 w-3 mr-1" />,
      suspended: <Ban className="h-3 w-3 mr-1" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className="flex items-center">
        {icons[status as keyof typeof icons]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const columns: ColumnDef<AppUser>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name',
      size: 120,
      cell: ({ row }) => (
        editingUser === row.original.id ? (
          <Input
            value={editForm.firstName || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
            className="h-8"
          />
        ) : (
          <span className="font-medium">{row.original.firstName || 'Not set'}</span>
        )
      ),
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      size: 120,
      cell: ({ row }) => (
        editingUser === row.original.id ? (
          <Input
            value={editForm.lastName || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
            className="h-8"
          />
        ) : (
          <span className="font-medium">{row.original.lastName || 'Not set'}</span>
        )
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
      cell: ({ row }) => (
        editingUser === row.original.id ? (
          <Input
            type="email"
            value={editForm.email || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
            className="h-8"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.email}</span>
          </div>
        )
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      size: 120,
      cell: ({ row }) => (
        editingUser === row.original.id ? (
          <select
            className="w-full px-3 py-2 border border-input bg-background rounded-md h-8"
            value={editForm.status || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as AppUser['status'] }))}
            aria-label="User status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        ) : (
          getStatusBadge(row.original.status)
        )
      ),
    },
    {
      accessorKey: 'alumniMemberId',
      header: 'Linked to Alumni',
      size: 140,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.alumniMemberId ? (
            <>
              <UserCheck className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400">Linked</span>
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-700">Not Linked</span>
            </>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Last Login',
      size: 140,
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.lastLoginAt
            ? new Date(row.original.lastLoginAt).toLocaleDateString()
            : 'Never'
          }
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {editingUser === row.original.id ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveUser}
                disabled={loading}
                className="h-8 px-2"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelEdit}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEditUser(row.original)}
              className="h-8 px-2"
            >
              <Edit className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            App User Management
          </CardTitle>
          <CardDescription>
            Manage authenticated platform users. These are users who have accepted invitations and can log into the app.
            Separate from alumni member source data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
            <Button
              variant="outline"
              onClick={() => loadAppUsers(searchQuery)}
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            <Badge variant="outline" className="mr-2">
              {users.length} Users
            </Badge>
            <Badge variant="outline" className="mr-2">
              {users.filter(u => u.status === 'active').length} Active
            </Badge>
            <Badge variant="outline" className="mr-2">
              {users.filter(u => u.alumniMemberId).length} Linked to Alumni
            </Badge>
            Showing authenticated app users. Status and permissions can be managed by administrators.
          </div>

          <TanStackAdvancedTable
            data={users as unknown as Record<string, unknown>[]}
            columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
            loading={loading}
            emptyMessage="No app users found. Try adjusting your search criteria."
            maxHeight="600px"
          />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
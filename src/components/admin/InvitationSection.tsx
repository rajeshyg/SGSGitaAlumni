import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import Badge from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Calendar, Mail, Users, Plus, Send, X, Eye, RefreshCw, UserCheck, Search, Edit, User } from 'lucide-react';
import { APIService } from '../../services/APIService';
import { TanStackAdvancedTable } from '../ui/tanstack-advanced-table';
import { ColumnDef } from '@tanstack/react-table';
import { UserEditor } from './UserEditor';

interface Invitation {
  id: string;
  email: string;
  invitationToken: string;
  invitedBy: string;
  invitationType: string;
  invitationData: any;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  sentAt: string;
  expiresAt: string;
  isUsed: boolean;
  resendCount: number;
  createdAt: string;
  updatedAt: string;
}

interface FamilyInvitation {
  id: string;
  parentEmail: string;
  childrenProfiles: any[];
  invitationToken: string;
  status: 'pending' | 'partially_accepted' | 'completed';
  sentAt: string;
  expiresAt: string;
  invitedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface UserSearchResult extends Record<string, unknown> {
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

export function InvitationSection() {
  const [activeTab, setActiveTab] = useState('create');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [familyInvitations, setFamilyInvitations] = useState<FamilyInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User-based invitation state
  const [selectedUsers, setSelectedUsers] = useState<UserSearchResult[]>([]);
  const [invitationType, setInvitationType] = useState('profile_completion');
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [rowSelection, setRowSelection] = useState({});

  // User management state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Individual invitation form state
  const [individualForm, setIndividualForm] = useState({
    email: '',
    invitationType: 'alumni',
    graduationYear: '',
    program: '',
    expiresInDays: 7
  });

  // Family invitation form state
  const [familyForm, setFamilyForm] = useState({
    parentEmail: '',
    children: [{ name: '', birthDate: '', graduationYear: '', program: '' }],
    expiresInDays: 7
  });

  // Load invitations on component mount
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      // Note: We'll need to add API endpoints for fetching invitations
      // For now, we'll show empty state
      setInvitations([]);
      setFamilyInvitations([]);
    } catch (err) {
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: UserSearchResult) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleUserRemove = (userId: string) => {
    setSelectedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  const handleCreateBulkInvitations = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const invitations = selectedUsers.map(user => ({
        userId: user.id,
        invitationType,
        expiresAt: new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString(),
        invitedBy: 'admin' // This should come from current user context
      }));

      await APIService.createBulkInvitations(invitations);

      setSuccess(`Successfully created ${selectedUsers.length} invitation${selectedUsers.length > 1 ? 's' : ''}!`);
      setSelectedUsers([]);
      loadInvitations();
    } catch (err) {
      setError('Failed to create invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIndividualInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const invitationData = {
        graduationYear: individualForm.graduationYear,
        program: individualForm.program
      };

      const response = await APIService.createInvitation({
        email: individualForm.email,
        invitedBy: 'admin', // This should come from current user context
        invitationType: individualForm.invitationType,
        invitationData,
        expiresAt: new Date(Date.now() + individualForm.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      });

      setSuccess('Individual invitation created successfully!');
      setIndividualForm({
        email: '',
        invitationType: 'alumni',
        graduationYear: '',
        program: '',
        expiresInDays: 7
      });
      loadInvitations();
    } catch (err) {
      setError('Failed to create invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamilyInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await APIService.createFamilyInvitation({
        parentEmail: familyForm.parentEmail,
        childrenData: familyForm.children,
        invitedBy: 'admin', // This should come from current user context
        expiresInDays: familyForm.expiresInDays
      });

      setSuccess('Family invitation created successfully!');
      setFamilyForm({
        parentEmail: '',
        children: [{ name: '', birthDate: '', graduationYear: '', program: '' }],
        expiresInDays: 7
      });
      loadInvitations();
    } catch (err) {
      setError('Failed to create family invitation');
    } finally {
      setLoading(false);
    }
  };

  const addChild = () => {
    setFamilyForm(prev => ({
      ...prev,
      children: [...prev.children, { name: '', birthDate: '', graduationYear: '', program: '' }]
    }));
  };

  const removeChild = (index: number) => {
    setFamilyForm(prev => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const updateChild = (index: number, field: string, value: string) => {
    setFamilyForm(prev => ({
      ...prev,
      children: prev.children.map((child, i) =>
        i === index ? { ...child, [field]: value } : child
      )
    }));
  };

  // Load initial users
  useEffect(() => {
    loadUsers();
  }, []);

  // Sync selectedUsers with rowSelection
  useEffect(() => {
    const newRowSelection: Record<string, boolean> = {};
    selectedUsers.forEach(user => {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        newRowSelection[index.toString()] = true;
      }
    });
    setRowSelection(newRowSelection);
  }, [selectedUsers, users]);

  // Sync rowSelection back to selectedUsers
  useEffect(() => {
    const selection = rowSelection as Record<string, boolean>;
    const newSelectedUsers: UserSearchResult[] = [];
    Object.keys(selection).forEach(key => {
      if (selection[key]) {
        const index = parseInt(key);
        if (users[index]) {
          newSelectedUsers.push(users[index]);
        }
      }
    });
    // Only update if different to avoid infinite loops
    if (JSON.stringify(newSelectedUsers.map(u => u.id)) !== JSON.stringify(selectedUsers.map(u => u.id))) {
      setSelectedUsers(newSelectedUsers);
    }
  }, [rowSelection, users, selectedUsers]);

  const loadUsers = async (query = '') => {
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}&limit=50`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadUsers(query);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setActiveTab('manage-users');
  };

  const handleUserSave = (user: any) => {
    // Update the user in the local state
    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...user } : u));
    setSuccess('User updated successfully!');
  };

  const handleCloseUserEditor = () => {
    setEditingUserId(null);
  };


  // Table columns definition
  const columns: ColumnDef<UserSearchResult>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name',
      size: 120,
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      size: 120,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
    },
    {
      accessorKey: 'graduationYear',
      header: 'Grad Year',
      size: 100,
    },
    {
      accessorKey: 'program',
      header: 'Program',
      size: 150,
    },
    {
      accessorKey: 'isProfileComplete',
      header: 'Profile Status',
      size: 120,
      cell: ({ row }) => (
        <Badge variant={row.original.isProfileComplete ? 'default' : 'secondary'}>
          {row.original.isProfileComplete ? 'Complete' : 'Incomplete'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 120,
      cell: ({ row }) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleEditUser(row.original.id)}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ),
    },
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      accepted: 'default',
      expired: 'destructive',
      revoked: 'destructive',
      partially_accepted: 'secondary',
      completed: 'default'
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invitation Management
          </CardTitle>
          <CardDescription>
            Create and manage invitations for alumni and families to join the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="create">Send Invitations</TabsTrigger>
              <TabsTrigger value="manage-users">Manage Users</TabsTrigger>
              <TabsTrigger value="manage">Manage Invitations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

           <TabsContent value="create" className="space-y-6">
             <Card>
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Users className="h-5 w-5" />
                   Select Alumni to Invite
                 </CardTitle>
                 <CardDescription>
                   Search and select existing alumni members to send profile completion invitations
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
                     onClick={() => loadUsers(searchQuery)}
                     disabled={searchLoading}
                   >
                     <Search className="h-4 w-4 mr-2" />
                     {searchLoading ? 'Searching...' : 'Search'}
                   </Button>
                 </div>

                 <TanStackAdvancedTable
                   data={users}
                   columns={columns as ColumnDef<Record<string, unknown>>[]}
                   selection={{ enabled: true }}
                   loading={searchLoading}
                   emptyMessage="No alumni found. Try adjusting your search criteria."
                   maxHeight="400px"
                   externalRowSelection={rowSelection}
                   onRowSelectionChange={setRowSelection}
                 />

                 {selectedUsers.length > 0 && (
                   <Card className="border-primary/20">
                     <CardHeader>
                       <CardTitle className="text-lg flex items-center gap-2">
                         <UserCheck className="h-5 w-5" />
                         Send Invitations ({selectedUsers.length} selected)
                       </CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                       <div className="grid grid-cols-2 gap-4">
                         <div>
                           <label htmlFor="bulkInvitationType" className="text-sm font-medium">Invitation Type</label>
                           <select
                             id="bulkInvitationType"
                             className="w-full px-3 py-2 border border-input bg-background rounded-md"
                             value={invitationType}
                             onChange={(e) => setInvitationType(e.target.value)}
                           >
                             <option value="profile_completion">Profile Completion</option>
                             <option value="alumni">Alumni</option>
                             <option value="family_member">Family Member</option>
                             <option value="admin">Admin</option>
                           </select>
                         </div>
                         <div>
                           <label htmlFor="bulkExpiresInDays" className="text-sm font-medium">Expires In (Days)</label>
                           <Input
                             id="bulkExpiresInDays"
                             type="number"
                             value={expiresInDays}
                             onChange={(e) => setExpiresInDays(parseInt(e.target.value))}
                             min="1"
                             max="365"
                           />
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <Button
                           onClick={handleCreateBulkInvitations}
                           disabled={loading || selectedUsers.length === 0}
                           className="flex-1"
                         >
                           <Send className="h-4 w-4 mr-2" />
                           {loading ? 'Sending...' : `Send ${selectedUsers.length} Invitation${selectedUsers.length > 1 ? 's' : ''}`}
                         </Button>
                         <Button
                           variant="outline"
                           onClick={handleClearSelection}
                           disabled={selectedUsers.length === 0}
                         >
                           Clear Selection
                         </Button>
                       </div>
                     </CardContent>
                   </Card>
                 )}
               </CardContent>
             </Card>
           </TabsContent>

           <TabsContent value="manage-users" className="space-y-6">
             {editingUserId ? (
               <UserEditor
                 userId={editingUserId}
                 onClose={handleCloseUserEditor}
                 onSave={handleUserSave}
               />
             ) : (
               <Card>
                 <CardHeader>
                   <CardTitle className="flex items-center gap-2">
                     <User className="h-5 w-5" />
                     User Management
                   </CardTitle>
                   <CardDescription>
                     Search and edit alumni user profiles, update contact information, and send invitations
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
                       onClick={() => loadUsers(searchQuery)}
                       disabled={searchLoading}
                     >
                       <Search className="h-4 w-4 mr-2" />
                       {searchLoading ? 'Searching...' : 'Search'}
                     </Button>
                   </div>

                   <TanStackAdvancedTable
                     data={users}
                     columns={columns as ColumnDef<Record<string, unknown>>[]}
                     loading={searchLoading}
                     emptyMessage="No users found. Try adjusting your search criteria."
                     maxHeight="600px"
                   />
                 </CardContent>
               </Card>
             )}
           </TabsContent>

            <TabsContent value="manage" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">All Invitations</h3>
                <Button variant="outline" onClick={loadInvitations}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {invitations.length === 0 && familyInvitations.length === 0 ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No invitations created yet</p>
                      <p className="text-sm">Create your first invitation to get started</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">{invitation.email}</p>
                              <p className="text-sm text-muted-foreground">
                                Type: {invitation.invitationType} • Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Resend
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {familyInvitations.map((invitation) => (
                    <Card key={invitation.id}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div>
                              <p className="font-medium">{invitation.parentEmail}</p>
                              <p className="text-sm text-muted-foreground">
                                Family • {invitation.childrenProfiles?.length || 0} children • Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                              </p>
                            </div>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Send className="h-4 w-4 mr-2" />
                              Resend
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Mail className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="text-2xl font-bold">{invitations.length + familyInvitations.length}</p>
                        <p className="text-sm text-muted-foreground">Total Invitations</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Send className="h-8 w-8 text-green-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {invitations.filter(i => i.status === 'accepted').length +
                           familyInvitations.filter(i => i.status === 'completed').length}
                        </p>
                        <p className="text-sm text-muted-foreground">Accepted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-8 w-8 text-orange-500" />
                      <div>
                        <p className="text-2xl font-bold">
                          {invitations.filter(i => i.status === 'pending').length +
                           familyInvitations.filter(i => ['pending', 'partially_accepted'].includes(i.status)).length}
                        </p>
                        <p className="text-sm text-muted-foreground">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

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
        </CardContent>
      </Card>
    </div>
  );
}
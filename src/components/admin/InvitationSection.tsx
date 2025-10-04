// Debug: InvitationSection starting
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import Badge from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, Users, RefreshCw, Search, Edit, Save, X, GraduationCap, Phone } from 'lucide-react';
import AdminListItem from './AdminListItem';
import { APIService } from '../../services/APIService';
import { TanStackAdvancedTable } from '../ui/tanstack-advanced-table';
import { ColumnDef } from '@tanstack/react-table';

type Invitation = any;

type AlumniMember = any;

type AppUser = any;

export function InvitationSection() {
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'users'>('members');

  // Data stores
  const [members, setMembers] = useState<AlumniMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [familyInvitations, setFamilyInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Editing state (shared, minimal)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<AlumniMember>>({});

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState<Partial<AppUser>>({});

  // Search
  const [memberSearch, setMemberSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [hasSearchedMembers, setHasSearchedMembers] = useState(false);

  // Define columns for the alumni members table
  const memberColumns: ColumnDef<AlumniMember>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name',
      size: 120,
      cell: ({ row }) => (
        editingMemberId === row.original.id ? (
          <Input
            value={memberForm.firstName || ''}
            onChange={(e) => setMemberForm(prev => ({ ...prev, firstName: e.target.value }))}
            className="h-8"
          />
        ) : (
          <span className="font-medium">{row.original.firstName}</span>
        )
      ),
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      size: 120,
      cell: ({ row }) => (
        editingMemberId === row.original.id ? (
          <Input
            value={memberForm.lastName || ''}
            onChange={(e) => setMemberForm(prev => ({ ...prev, lastName: e.target.value }))}
            className="h-8"
          />
        ) : (
          <span className="font-medium">{row.original.lastName}</span>
        )
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      size: 200,
      cell: ({ row }) => (
        editingMemberId === row.original.id ? (
          <Input
            type="email"
            value={memberForm.email || ''}
            onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
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
      accessorKey: 'phone',
      header: 'Phone',
      size: 140,
      cell: ({ row }) => (
        editingMemberId === row.original.id ? (
          <Input
            value={memberForm.phone || ''}
            onChange={(e) => setMemberForm(prev => ({ ...prev, phone: e.target.value }))}
            className="h-8"
          />
        ) : (
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{row.original.phone || 'Not provided'}</span>
          </div>
        )
      ),
    },
    {
      accessorKey: 'graduationYear',
      header: 'Grad Year',
      size: 100,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
          <span>{row.original.graduationYear || 'N/A'}</span>
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 200,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {editingMemberId === row.original.id ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={saveMember}
                disabled={loading}
                className="h-8 px-2"
              >
                <Save className="h-3 w-3" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditMember}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => startEditMember(row.original)}
                className="h-8 px-2"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => sendInvitationToMember(row.original.id)}
                disabled={loading}
                className="h-8 px-2 bg-blue-600 hover:bg-blue-700"
              >
                Invite
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  useEffect(() => {
    // initial load
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const promises = [
        APIService.getInvitations({ page: 1, pageSize: 200 }),
        APIService.getFamilyInvitations ? APIService.getFamilyInvitations({ page: 1, pageSize: 200 }) : Promise.resolve([]),
        APIService.searchAppUsers('')
      ];

      // Only load members if a search has been performed
      if (hasSearchedMembers) {
        promises.unshift(APIService.searchAlumniMembers(memberSearch));
      }

      const results = await Promise.all(promises);

      if (hasSearchedMembers) {
        const [membersData, invitationsData, familyInvData, usersData] = results as [any[], any[], any[], any[]];
        setMembers(membersData || []);
        setInvitations(invitationsData || []);
        setFamilyInvitations(familyInvData || []);
        setUsers(usersData || []);
      } else {
        const [invitationsData, familyInvData, usersData] = results as [any[], any[], any[]];
        setInvitations(invitationsData || []);
        setFamilyInvitations(familyInvData || []);
        setUsers(usersData || []);
        // Keep members as empty array
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
      setError('Failed to load admin data. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Alumni member actions ----------
  const handleSearchMembers = async (q: string) => {
    setMemberSearch(q);
    setHasSearchedMembers(true);
    setLoading(true);
    setError(null);
    try {
      const data = await APIService.searchAlumniMembers(q);
      setMembers(data || []);
    } catch (err) {
      console.error('search members failed', err);
      setError('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const startEditMember = (m: AlumniMember) => {
    setEditingMemberId(m.id);
    setMemberForm({ ...m });
    setSuccess(null);
    setError(null);
  };

  const cancelEditMember = () => {
    setEditingMemberId(null);
    setMemberForm({});
  };

  const saveMember = async () => {
    if (!editingMemberId) return;
    setLoading(true);
    setError(null);
    try {
      await APIService.updateAlumniMember(editingMemberId, memberForm);
      setSuccess('Member updated');
      // refresh list
      await handleSearchMembers(memberSearch);
      setEditingMemberId(null);
      setMemberForm({});
    } catch (err) {
      console.error('update member failed', err);
      setError('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitationToMember = async (memberId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await APIService.sendInvitationToAlumniMember(memberId, 'alumni', 14);
      setSuccess('Invitation queued');
      await loadAll();
    } catch (err: any) {
      console.error('send invitation failed', err);

      // Handle specific error cases
      if (err.message && err.message.includes('409')) {
        setError('This alumni member already has a pending invitation');
      } else if (err.message && err.message.includes('404')) {
        setError('Alumni member not found');
      } else if (err.message && err.message.includes('400')) {
        setError('Invalid request - please check the member data');
      } else {
        setError('Failed to send invitation - please try again');
      }
    } finally {
      setLoading(false);
    }
  };

  // ---------- Invitations actions ----------
  const reloadInvitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const [invitationsData, familyInvData] = await Promise.all([
        APIService.getInvitations({ page: 1, pageSize: 200 }),
        APIService.getFamilyInvitations ? APIService.getFamilyInvitations({ page: 1, pageSize: 200 }) : Promise.resolve([])
      ]);
      setInvitations(invitationsData || []);
      setFamilyInvitations(familyInvData || []);
    } catch (err) {
      console.error('reload invitations failed', err);
      setError('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const resendInvitation = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await APIService.resendInvitation(id);
      setSuccess('Invitation resent');
      await reloadInvitations();
    } catch (err) {
      console.error('resend failed', err);
      setError('Resend failed');
    } finally {
      setLoading(false);
    }
  };

  const revokeInvitation = async (id: string) => {
    if (!confirm('Revoke invitation? This cannot be undone.')) return;
    setLoading(true);
    setError(null);
    try {
      await APIService.revokeInvitation(id);
      setSuccess('Invitation revoked');
      await reloadInvitations();
    } catch (err) {
      console.error('revoke failed', err);
      setError('Revoke failed');
    } finally {
      setLoading(false);
    }
  };

  // ---------- App user actions ----------
  const handleSearchUsers = async (q: string) => {
    setUserSearch(q);
    setLoading(true);
    setError(null);
    try {
      const data = await APIService.searchAppUsers(q);
      setUsers(data || []);
    } catch (err) {
      console.error('search users failed', err);
      setError('Search users failed');
    } finally {
      setLoading(false);
    }
  };

  const startEditUser = (u: AppUser) => {
    setEditingUserId(u.id);
    setUserForm({ ...u });
    setError(null);
    setSuccess(null);
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setUserForm({});
  };

  const saveUser = async () => {
    if (!editingUserId) return;
    setLoading(true);
    setError(null);
    try {
      await APIService.updateAppUser(editingUserId, userForm);
      setSuccess('User updated');
      await handleSearchUsers(userSearch);
      setEditingUserId(null);
      setUserForm({});
    } catch (err) {
      console.error('save user failed', err);
      setError('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  // status badges handled inline where needed

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Alumni & Invitation Management
          </CardTitle>
          <CardDescription>
            Admin console to manage alumni source data (CSV-imported), send invitations, and manage authenticated app users.
            Alumni members and app users are intentionally separate: members must exist in alumni source before being invited.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="members">Alumni Members</TabsTrigger>
              <TabsTrigger value="invitations">Invitations</TabsTrigger>
              <TabsTrigger value="users">App Users</TabsTrigger>
            </TabsList>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Input
                    placeholder="Search alumni by name, email, student id..."
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearchMembers(memberSearch); }}
                    className="max-w-md"
                  />
                  <Button variant="outline" onClick={() => handleSearchMembers(memberSearch)} disabled={loading}>
                    <Search className="h-4 w-4 mr-2" />
                    Search
                  </Button>
                </div>
                <Button variant="outline" onClick={loadAll} disabled={loading}>
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh All
                </Button>
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                <Badge variant="outline" className="mr-2">{members.length} Members</Badge>
                Showing source alumni records (not app users). Edit contact info or send invitation to existing alumni only.
              </div>

              <TanStackAdvancedTable
                data={members as unknown as Record<string, unknown>[]}
                columns={memberColumns as unknown as ColumnDef<Record<string, unknown>>[]}
                loading={loading}
                emptyMessage={hasSearchedMembers ? 'No alumni members found. Adjust your search or import source CSV.' : 'Use the search above to find alumni members.'}
                maxHeight="600px"
                searchable={false}
              />
            </TabsContent>

            {/* Invitations Tab */}
            <TabsContent value="invitations" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Invitations</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={reloadInvitations} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Individual Invitations</h4>
                  {invitations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No individual invitations</div>
                  ) : (
                    invitations.map((inv: any) => (
                      <AdminListItem
                        key={inv.id}
                        title={inv.email}
                        subtitle={`${inv.status} • Sent: ${inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : 'n/a'}`}
                        actions={(
                          <>
                            <Button size="sm" variant="outline" onClick={() => resendInvitation(inv.id)}>Resend</Button>
                            {inv.status !== 'accepted' && inv.status !== 'revoked' && <Button size="sm" variant="destructive" onClick={() => revokeInvitation(inv.id)}>Revoke</Button>}
                          </>
                        )}
                      />
                    ))
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Family / Bulk Invitations</h4>
                  {familyInvitations.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No family invitations</div>
                  ) : (
                    familyInvitations.map((inv: any) => (
                      <AdminListItem
                        key={inv.id}
                        title={inv.parentEmail}
                        subtitle={`${inv.status} • Children: ${inv.childrenProfiles?.length || 0}`}
                        actions={(
                          <>
                            <Button size="sm" variant="outline" onClick={() => resendInvitation(inv.id)}>Resend</Button>
                            {inv.status !== 'completed' && <Button size="sm" variant="destructive" onClick={() => revokeInvitation(inv.id)}>Revoke</Button>}
                          </>
                        )}
                      />
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            {/* App Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Input placeholder="Search users by email or name" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSearchUsers(userSearch); }} className="max-w-md" />
                  <Button variant="outline" onClick={() => handleSearchUsers(userSearch)} disabled={loading}><Search className="h-4 w-4 mr-2" />Search</Button>
                </div>
                <Button variant="outline" onClick={() => handleSearchUsers('')} disabled={loading}><RefreshCw className="h-4 w-4 mr-2" />Reload</Button>
              </div>

              <div className="text-sm text-muted-foreground mb-2">
                <Badge variant="outline" className="mr-2">{users.length} Users</Badge>
                Authenticated app users (those who accepted invitations).
              </div>

              <div className="space-y-3">
                {users.length === 0 && !loading ? (
                  <div className="text-sm text-muted-foreground">No app users found.</div>
                ) : (
                  users.map((u: any) => (
                    <AdminListItem
                      key={u.id}
                      title={<>{u.firstName || ''} {u.lastName || ''}</>}
                      subtitle={<>{u.email} • {u.status}</>}
                      actions={
                        editingUserId === u.id ? (
                          <>
                            <Button size="sm" variant="outline" onClick={saveUser} disabled={loading}>Save</Button>
                            <Button size="sm" variant="outline" onClick={cancelEditUser}>Cancel</Button>
                          </>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => startEditUser(u)}>Edit</Button>
                        )
                      }
                    >
                      {editingUserId === u.id && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
                          <Input placeholder="First name" value={userForm.firstName || ''} onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))} />
                          <Input placeholder="Last name" value={userForm.lastName || ''} onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))} />
                          <Input placeholder="Email" value={userForm.email || ''} onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))} />
                        </div>
                      )}
                    </AdminListItem>
                  ))
                )}
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
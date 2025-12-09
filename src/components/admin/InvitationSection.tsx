// Debug: InvitationSection starting
import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import Badge from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Mail, Users, RefreshCw, Search, Edit, Save, X, GraduationCap, Phone, Copy, Eye, Key, Link } from 'lucide-react';
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
  // NOTE: Family invitations removed - using new onboarding flow
  const [users, setUsers] = useState<AppUser[]>([]);
  const [allActiveOtps, setAllActiveOtps] = useState<Array<{email: string; code: string; tokenType: string; expiresAt: string}>>([]);

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

  // Testing features for invitation system
  const [showInvitationUrls, setShowInvitationUrls] = useState(false);
  const [generatedOtpCodes, setGeneratedOtpCodes] = useState<Record<string, { code: string; expiresAt: string; isExpired: boolean }>>({});

  // Check if OTP is expired
  const isOtpExpired = useCallback((expiresAt: string): boolean => {
    return new Date(expiresAt) < new Date();
  }, []);

  // Fetch active OTP for an email
  const fetchActiveOtp = useCallback(async (email: string) => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${baseURL}/api/otp/active/${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.code && data.expiresAt) {
          const expired = isOtpExpired(data.expiresAt);
          setGeneratedOtpCodes(prev => ({
            ...prev,
            [email]: {
              code: data.code,
              expiresAt: data.expiresAt,
              isExpired: expired
            }
          }));
        } else {
          // No active OTP found
          setGeneratedOtpCodes(prev => {
            const newCodes = { ...prev };
            delete newCodes[email];
            return newCodes;
          });
        }
      } else if (response.status === 404) {
        // 404 means no active OTP exists - this is expected, not an error
        setGeneratedOtpCodes(prev => {
          const newCodes = { ...prev };
          delete newCodes[email];
          return newCodes;
        });
      } else {
        // Other error statuses (401, 403, 500, etc.)
        console.warn(`[InvitationSection] Failed to fetch active OTP for ${email}: ${response.status}`);
      }
    } catch (err) {
      // Network error or other exception - silently fail
      console.error('[InvitationSection] Error fetching active OTP:', err);
    }
  }, [isOtpExpired]);

  // Fetch all active OTPs for admin testing panel
  const fetchAllActiveOtps = useCallback(async () => {
    try {
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${baseURL}/api/otp/admin/all-active`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAllActiveOtps(data.otps || []);
      } else {
        console.warn('[InvitationSection] Failed to fetch all active OTPs:', response.status);
        setAllActiveOtps([]);
      }
    } catch (err) {
      console.error('[InvitationSection] Error fetching all active OTPs:', err);
      setAllActiveOtps([]);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // NOTE: Family invitations removed - using new onboarding flow
      const promises = [
        APIService.getInvitations({ page: 1, pageSize: 200 }),
        APIService.searchAppUsers(''),
        fetchAllActiveOtps() // Load all active OTPs for testing panel
      ];

      // Only load members if a search has been performed
      if (hasSearchedMembers) {
        promises.unshift(APIService.searchAlumniMembers(memberSearch));
      }

      const results = await Promise.all(promises);

      if (hasSearchedMembers) {
        const [membersData, invitationsData, usersData] = results as [any[], any[], any[]];
        setMembers(membersData || []);
        setInvitations(invitationsData || []);
        setUsers(usersData || []);
      } else {
        const [invitationsData, usersData] = results as [any[], any[]];
        setInvitations(invitationsData || []);
        setUsers(usersData || []);
        // Keep members as empty array
      }
    } catch (err) {
      setError('Failed to load admin data.');
    } finally {
      setLoading(false);
    }
  }, [hasSearchedMembers, memberSearch, fetchAllActiveOtps]);

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
      id: 'invitationStatus',
      header: 'Invitation Status',
      size: 140,
      cell: ({ row }) => {
        const memberEmail = row.original.email;
        const existingInvitation = invitations.find(inv => inv.email === memberEmail);

        if (!existingInvitation) {
          return <Badge variant="outline" className="text-muted-foreground">Not Invited</Badge>;
        }

        const statusColors: Record<string, string> = {
          pending: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
          sent: 'bg-primary/10 text-primary',
          accepted: 'bg-green-500/10 text-green-700 dark:text-green-400',
          expired: 'bg-destructive/10 text-destructive',
          revoked: 'bg-muted text-muted-foreground',
        };

        return (
          <Badge
            variant="outline"
            className={statusColors[existingInvitation.status] || 'bg-muted text-muted-foreground'}
          >
            {existingInvitation.status}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 200,
      cell: ({ row }) => {
        // Check if this member has a pending invitation
        const memberEmail = row.original.email;
        const existingInvitation = invitations.find(inv =>
          inv.email === memberEmail && (inv.status === 'pending' || inv.status === 'sent')
        );

        return (
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
                {existingInvitation ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resendInvitation(existingInvitation.id)}
                    disabled={loading}
                    className="h-8 px-2 bg-orange-600 hover:bg-orange-700 text-white"
                    title={`Resend invitation (status: ${existingInvitation.status})`}
                  >
                    Resend
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => sendInvitationToMember(row.original.id)}
                    disabled={loading}
                    className="h-8 px-2 bg-primary hover:bg-primary/90"
                  >
                    Invite
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];

  useEffect(() => {
    // initial load on mount only
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  // Note: We don't automatically fetch OTPs for all invitations to avoid unnecessary 404 errors
  // OTPs are only displayed from the "All Active OTPs" admin panel which shows genuinely active OTPs
  // Individual OTP checking can be added via a manual button if needed

  // Periodic expiry check - update every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setGeneratedOtpCodes(prevCodes => {
        const updated = { ...prevCodes };
        Object.keys(updated).forEach(email => {
          updated[email] = {
            ...updated[email],
            isExpired: isOtpExpired(updated[email].expiresAt)
          };
        });
        return updated;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [isOtpExpired]);


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
      const invitationsData = await APIService.getInvitations({ page: 1, pageSize: 200 });
      setInvitations(invitationsData || []);
      // NOTE: Family invitations removed - using new onboarding flow
    } catch (err) {
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
      setError('Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Testing features for invitation system ----------

  const generateTestOtp = async (email: string) => {
    try {
      // Use direct API call since APIService doesn't have generateOTP method
      // Note: Using 'login' type so the OTP can be used for passwordless login testing
      const response = await fetch('/api/otp/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email, type: 'login' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.code && data.expiresAt) {
          setGeneratedOtpCodes(prev => ({
            ...prev,
            [email]: {
              code: data.code,
              expiresAt: data.expiresAt,
              isExpired: false
            }
          }));
          setSuccess(`OTP generated for ${email}: ${data.code}`);
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate OTP');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate test OTP');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess(`${label} copied to clipboard`);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const generateInvitationUrl = (invitationToken: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invitation/${invitationToken}`;
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
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium">Invitations</h3>
                  <Badge variant="outline" className="text-xs">
                    {invitations.length} Invitations
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInvitationUrls(!showInvitationUrls)}
                    className={`h-8 ${showInvitationUrls ? 'bg-blue-50 border-blue-200' : ''}`}
                  >
                    <Link className="h-3 w-3 mr-1" />
                    Test Mode
                  </Button>
                  <Button variant="outline" size="sm" onClick={reloadInvitations} disabled={loading}>
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Clean Testing Panel */}
              {showInvitationUrls && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-primary" />
                        <CardTitle className="text-sm text-foreground">Testing Panel</CardTitle>
                      </div>
                      <CardDescription className="text-xs text-muted-foreground">
                        Passwordless authentication testing tools
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Invitation URLs */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Link className="h-3 w-3" />
                          Invitation URLs
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {invitations
                            .filter((inv: any) => inv.status === 'pending' && new Date(inv.expiresAt) > new Date())
                            .slice(0, 10)
                            .map((inv: any) => (
                            <div key={inv.id} className="flex items-center gap-2 p-2 bg-background rounded border text-xs">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-foreground truncate">{inv.email}</div>
                                <code className="text-muted-foreground font-mono text-xs break-all">
                                  {generateInvitationUrl(inv.invitationToken)}
                                </code>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(generateInvitationUrl(inv.invitationToken), 'Invitation URL')}
                                className="h-6 w-6 p-0 shrink-0"
                                title="Copy URL"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          {invitations.filter((inv: any) => inv.status === 'pending' && new Date(inv.expiresAt) > new Date()).length === 0 && (
                            <div className="text-xs text-muted-foreground p-2">No active pending invitations</div>
                          )}
                        </div>
                      </div>

                      {/* OTP Generator */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Key className="h-3 w-3" />
                          Active OTPs ({allActiveOtps.length})
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {allActiveOtps.length === 0 ? (
                            <div className="text-xs text-muted-foreground p-2">No active OTPs</div>
                          ) : (
                            allActiveOtps.map((otp, idx) => {
                              const isExpired = new Date(otp.expiresAt) < new Date();
                              return (
                                <div key={`${otp.email}-${idx}`} className="flex items-center gap-2 p-2 bg-background rounded border text-xs">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-foreground truncate">{otp.email}</div>
                                    <div className="flex items-center gap-2">
                                      <code className={`px-2 py-1 rounded text-xs font-mono ${
                                        isExpired
                                          ? 'bg-destructive/10 text-destructive'
                                          : 'bg-green-500/10 text-green-700 dark:text-green-400'
                                      }`}>
                                        {otp.code}
                                      </code>
                                      <Badge variant="outline" className="text-xs">
                                        {otp.tokenType}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        {isExpired ? (
                                          'Expired'
                                        ) : (
                                          <>
                                            Expires: {new Date(otp.expiresAt).toLocaleTimeString()}
                                          </>
                                        )}
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => copyToClipboard(otp.code, 'OTP')}
                                        className="h-6 px-2 text-xs shrink-0"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => fetchAllActiveOtps()}
                                    className="h-6 px-2 text-xs shrink-0"
                                    title="Refresh OTPs"
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                  </Button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Clean Invitations List */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Individual Invitations
                  </h4>
                  {(() => {
                    // Filter to show only unique emails, prioritize pending over accepted/revoked
                    const uniqueInvitations = invitations.reduce((acc: any[], inv: any) => {
                      const existingIndex = acc.findIndex((i: any) => i.email === inv.email);
                      if (existingIndex === -1) {
                        acc.push(inv);
                      } else {
                        // Replace with pending if current is pending and existing is not
                        if (inv.status === 'pending' && acc[existingIndex].status !== 'pending') {
                          acc[existingIndex] = inv;
                        }
                      }
                      return acc;
                    }, []);
                    
                    return uniqueInvitations.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4 border border-dashed rounded">
                        No individual invitations yet. Send some from the Alumni Members tab.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {uniqueInvitations.map((inv: any) => (
                          <Card key={inv.id} className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm truncate">{inv.email}</span>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      inv.status === 'pending' ? 'border-yellow-300 text-yellow-700' :
                                      inv.status === 'accepted' ? 'border-green-300 text-green-700' :
                                      'border-gray-300 text-gray-600'
                                    }`}
                                  >
                                    {inv.status}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Sent: {inv.sentAt ? new Date(inv.sentAt).toLocaleDateString() : 'Never'}
                                  {inv.lastResentAt && (
                                    <> • Resent: {new Date(inv.lastResentAt).toLocaleDateString()}</>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {inv.status === 'pending' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyToClipboard(generateInvitationUrl(inv.invitationToken), 'Invitation URL')}
                                    className="h-7 px-2 text-xs"
                                    title="Copy Invitation Link"
                                  >
                                    <Link className="h-3 w-3" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => resendInvitation(inv.id)}
                                  disabled={loading || inv.status === 'accepted' || inv.status === 'revoked'}
                                  className="h-7 px-2 text-xs"
                                  title={
                                    inv.status === 'accepted' ? 'Cannot resend accepted invitation' :
                                    inv.status === 'revoked' ? 'Cannot resend revoked invitation' :
                                    'Resend invitation with new token'
                                  }
                                >
                                  Resend
                                </Button>
                                {inv.status !== 'accepted' && inv.status !== 'revoked' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => revokeInvitation(inv.id)}
                                    className="h-7 px-2 text-xs text-destructive hover:text-destructive/80"
                                  >
                                    Revoke
                                  </Button>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    );
                  })()}
                </div>
                {/* NOTE: Family Invitations section removed - using new onboarding flow */}
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
                  users.map((u: any) => {
                    const activeOtp = allActiveOtps.find(otp => otp.email === u.email);
                    const isOtpExpired = activeOtp ? new Date(activeOtp.expiresAt) < new Date() : true;

                    return (
                    <AdminListItem
                      key={u.id}
                      title={
                        <div className="flex items-center gap-2">
                          <span>{u.firstName || ''} {u.lastName || ''}</span>
                          {activeOtp && !isOtpExpired && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] h-5 px-1">
                              OTP Active
                            </Badge>
                          )}
                        </div>
                      }
                      subtitle={
                        <div className="flex flex-col gap-1">
                          <span>{u.email} • {u.status}</span>
                          {activeOtp && !isOtpExpired && (
                            <div className="flex items-center gap-2 text-xs mt-1">
                              <span className="text-muted-foreground">Active OTP:</span>
                              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">{activeOtp.code}</code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(activeOtp.code, 'OTP')}
                                className="h-5 w-5 p-0"
                                title="Copy OTP"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                              <span className="text-[10px] text-muted-foreground">
                                Expires: {new Date(activeOtp.expiresAt).toLocaleTimeString()}
                              </span>
                            </div>
                          )}
                        </div>
                      }
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
                  );
                  })
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
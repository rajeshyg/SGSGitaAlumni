import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Badge from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Users, Search, Edit, Save, X, Phone, Mail, GraduationCap, Send } from 'lucide-react';
import { APIService } from '../../services/APIService';
import { TanStackAdvancedTable } from '../ui/tanstack-advanced-table';
import { ColumnDef } from '@tanstack/react-table';

interface AlumniMember {
  id: string;
  studentId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  graduationYear?: number;
  degree?: string;
  department?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

interface AlumniMemberManagementProps {
  onMemberUpdated?: (member: AlumniMember) => void;
}

export function AlumniMemberManagement({ onMemberUpdated }: AlumniMemberManagementProps) {
  const [members, setMembers] = useState<AlumniMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AlumniMember>>({});

  // Load alumni members on component mount
  useEffect(() => {
    loadAlumniMembers();
  }, []);

  const loadAlumniMembers = async (query = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await APIService.searchAlumniMembers(query);
      setMembers(data);
    } catch (err) {
      setError('Failed to load alumni members');
      console.error('Error loading alumni members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadAlumniMembers(query);
  };

  const handleEditMember = (member: AlumniMember) => {
    setEditingMember(member.id);
    setEditForm({ ...member });
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await APIService.updateAlumniMember(editingMember, editForm);

      // Reload the data to reflect changes
      await loadAlumniMembers(searchQuery);

      setSuccess('Alumni member contact information updated successfully!');
      setEditingMember(null);
      setEditForm({});

      if (onMemberUpdated) {
        const updatedMember = members.find(m => m.id === editingMember);
        if (updatedMember) onMemberUpdated({ ...updatedMember, ...editForm });
      }
    } catch (err) {
      setError('Failed to update alumni member');
      console.error('Error updating alumni member:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditForm({});
  };

  const handleSendInvitation = async (member: AlumniMember) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await APIService.sendInvitationToAlumniMember(member.id, 'alumni', 7);

      setSuccess(`Invitation sent successfully to ${member.firstName} ${member.lastName}!`);
    } catch (err) {
      setError('Failed to send invitation');
      console.error('Error sending invitation:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<AlumniMember>[] = [
    {
      accessorKey: 'firstName',
      header: 'First Name',
      size: 120,
      cell: ({ row }) => (
        editingMember === row.original.id ? (
          <Input
            value={editForm.firstName || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
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
        editingMember === row.original.id ? (
          <Input
            value={editForm.lastName || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
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
        editingMember === row.original.id ? (
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
      accessorKey: 'phone',
      header: 'Phone',
      size: 140,
      cell: ({ row }) => (
        editingMember === row.original.id ? (
          <Input
            value={editForm.phone || ''}
            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
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
      accessorKey: 'department',
      header: 'Department',
      size: 150,
      cell: ({ row }) => (
        <span>{row.original.department || 'N/A'}</span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      size: 200,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {editingMember === row.original.id ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveMember}
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
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditMember(row.original)}
                className="h-8 px-2"
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSendInvitation(row.original)}
                disabled={loading}
                className="h-8 px-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-3 w-3 mr-1" />
                Invite
              </Button>
            </>
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
            <Users className="h-5 w-5" />
            Alumni Member Management
          </CardTitle>
          <CardDescription>
            View and edit contact information for alumni members from the source database.
            Send invitations to join the platform or update their contact details when needed.
            These are the raw alumni records imported from CSV data - separate from app users.
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
              onClick={() => loadAlumniMembers(searchQuery)}
              disabled={loading}
            >
              <Search className="h-4 w-4 mr-2" />
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            <Badge variant="outline" className="mr-2">
              {members.length} Members
            </Badge>
            Showing alumni source data. Contact information can be edited by administrators.
          </div>

          <TanStackAdvancedTable
            data={members as unknown as Record<string, unknown>[]}
            columns={columns as unknown as ColumnDef<Record<string, unknown>>[]}
            loading={loading}
            emptyMessage="No alumni members found. Try adjusting your search criteria."
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
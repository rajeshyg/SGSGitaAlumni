import React, { useState, useEffect } from 'react';
import { Users, Activity, Settings, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { FamilyMemberCard } from './FamilyMemberCard';
import AddFamilyMemberModal from './AddFamilyMemberModal';
import { ConsentDialog } from './ConsentDialog';
import { 
  getFamilyMembers, 
  getAccessLogs, 
  deleteFamilyMember,
  grantConsent,
  revokeConsent,
  type FamilyMember, 
  type AccessLog
} from '../../services/familyMemberService';

type TabType = 'members' | 'activity' | 'settings';

export const ParentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('members');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConsentDialogOpen, setIsConsentDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [consentAction, setConsentAction] = useState<'grant' | 'revoke'>('grant');

  // Load family members
  const loadFamilyMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getFamilyMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load family members');
    } finally {
      setIsLoading(false);
    }
  };

  // Load access logs
  const loadAccessLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAccessLogs();
      setAccessLogs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load access logs');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    if (activeTab === 'members') {
      loadFamilyMembers();
    } else if (activeTab === 'activity') {
      loadAccessLogs();
    }
  }, [activeTab]);

  // Handle edit member
  const handleEditMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setIsAddModalOpen(true);
  };

  // Handle delete member
  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to delete this family member?')) {
      return;
    }

    try {
      await deleteFamilyMember(memberId);
      await loadFamilyMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete family member');
    }
  };

  // Handle grant consent
  const handleGrantConsent = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setConsentAction('grant');
      setIsConsentDialogOpen(true);
    }
  };

  // Handle revoke consent
  const handleRevokeConsent = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      setSelectedMember(member);
      setConsentAction('revoke');
      setIsConsentDialogOpen(true);
    }
  };

  // Handle consent confirmation
  const handleConsentConfirm = async (memberId: string, reason?: string) => {
    if (consentAction === 'grant') {
      await grantConsent(memberId);
    } else {
      await revokeConsent(memberId, reason);
    }
    await loadFamilyMembers();
    setIsConsentDialogOpen(false);
    setSelectedMember(null);
  };

  // Get members requiring attention
  const getMembersNeedingConsent = () => {
    return members.filter(m => 
      m.requires_parent_consent && 
      !m.parent_consent_given && 
      !m.is_primary_contact
    );
  };

  const getMembersNeedingRenewal = () => {
    return members.filter(m => m.consent_renewal_required);
  };

  // Render tabs
  const renderTabs = () => {
    const tabs = [
      { id: 'members' as TabType, label: 'Family Members', icon: Users },
      { id: 'activity' as TabType, label: 'Activity Log', icon: Activity },
      { id: 'settings' as TabType, label: 'Settings', icon: Settings },
    ];

    return (
      <div className="border-b border-border">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  };

  // Render members tab
  const renderMembersTab = () => {
    const needsConsent = getMembersNeedingConsent();
    const needsRenewal = getMembersNeedingRenewal();

    return (
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Family Members</h2>
            <p className="text-muted-foreground mt-1">Manage your family profiles and access</p>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Family Member
          </button>
        </div>

        {/* Alerts */}
        {(needsConsent.length > 0 || needsRenewal.length > 0) && (
          <div className="space-y-3">
            {needsConsent.length > 0 && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-accent-foreground">
                    {needsConsent.length} {needsConsent.length === 1 ? 'member needs' : 'members need'} parent consent
                  </p>
                  <p className="text-sm text-accent-foreground/80 mt-1">
                    Grant consent to allow supervised access for members aged 14-17
                  </p>
                </div>
              </div>
            )}
            {needsRenewal.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-destructive-foreground">
                    {needsRenewal.length} {needsRenewal.length === 1 ? 'member requires' : 'members require'} consent renewal
                  </p>
                  <p className="text-sm text-destructive-foreground/80 mt-1">
                    Annual consent renewal is required for supervised access
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Members List */}
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-3">Loading family members...</p>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
            <Users className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-3 font-medium">No family members yet</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Add your first family member to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {members.map((member) => (
              <FamilyMemberCard
                key={member.id}
                member={member}
                onEdit={handleEditMember}
                onDelete={handleDeleteMember}
                onGrantConsent={handleGrantConsent}
                onRevokeConsent={handleRevokeConsent}
                showActions={true}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render activity tab
  const renderActivityTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Activity Log</h2>
            <p className="text-muted-foreground mt-1">Track profile switches and access patterns</p>
          </div>
          <button
            onClick={loadAccessLogs}
            className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-3">Loading activity logs...</p>
          </div>
        ) : accessLogs.length === 0 ? (
          <div className="text-center py-12 bg-muted rounded-lg border-2 border-dashed border-border">
            <Activity className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-3 font-medium">No activity yet</p>
            <p className="text-muted-foreground/70 text-sm mt-1">Profile switches will appear here</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg divide-y divide-border">
            {accessLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-muted transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <p className="font-medium text-foreground">{log.action}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Member ID: {log.family_member_id}
                    </p>
                    {log.details && (
                      <p className="text-sm text-muted-foreground/70 mt-1">{log.details}</p>
                    )}
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>{new Date(log.accessed_at).toLocaleDateString()}</p>
                    <p className="mt-1">{new Date(log.accessed_at).toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render settings tab
  const renderSettingsTab = () => {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Family Settings</h2>
          <p className="text-muted-foreground mt-1">Configure family account preferences</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <p className="text-muted-foreground">Settings panel coming soon...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="bg-card border-b border-border">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-foreground">Parent Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage your family profiles and permissions</p>
          </div>
          
          {/* Tabs */}
          {renderTabs()}
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-center gap-3 text-destructive">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'activity' && renderActivityTab()}
          {activeTab === 'settings' && renderSettingsTab()}
        </div>
      </div>

      {/* Modals */}
      <AddFamilyMemberModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setSelectedMember(null);
        }}
        onMemberAdded={async () => {
          await loadFamilyMembers();
          setIsAddModalOpen(false);
        }}
      />

      {selectedMember && (
        <ConsentDialog
          isOpen={isConsentDialogOpen}
          onClose={() => {
            setIsConsentDialogOpen(false);
            setSelectedMember(null);
          }}
          member={selectedMember}
          action={consentAction}
          onConfirm={handleConsentConfirm}
        />
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFamilyMembers, grantConsent, revokeConsent, type FamilyMember, type ConsentData } from '../services/familyMemberService';
import { ConsentDialog } from '../components/family/ConsentDialog';
import { ArrowLeft, Shield, AlertCircle, CheckCircle, Clock } from 'lucide-react';

/**
 * Family Settings Page
 * 
 * Allows parents to:
 * - View all family members
 * - Grant/revoke parental consent for minors (14-17)
 * - Manage family member profiles
 */
const FamilySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consentDialog, setConsentDialog] = useState<{
    isOpen: boolean;
    member: FamilyMember | null;
    action: 'grant' | 'revoke';
  }>({ isOpen: false, member: null, action: 'grant' });

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const data = await getFamilyMembers();
      setMembers(data);
      setError(null);
    } catch (err) {
      console.error('Error loading family members:', err);
      setError('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantConsent = (member: FamilyMember) => {
    setConsentDialog({
      isOpen: true,
      member,
      action: 'grant'
    });
  };

  const handleRevokeConsent = (member: FamilyMember) => {
    setConsentDialog({
      isOpen: true,
      member,
      action: 'revoke'
    });
  };

  const handleConfirmConsent = async (
    memberId: string,
    consentData?: ConsentData,
    reason?: string
  ) => {
    try {
      if (consentDialog.action === 'grant') {
        await grantConsent(memberId, consentData);
      } else {
        await revokeConsent(memberId, reason);
      }

      // Reload family members to show updated consent status
      await loadFamilyMembers();
      setConsentDialog({ isOpen: false, member: null, action: 'grant' });
    } catch (err) {
      console.error('Error updating consent:', err);
      throw err;
    }
  };

  const getConsentStatus = (member: FamilyMember) => {
    if (!member.requires_parent_consent) {
      return { icon: CheckCircle, text: 'No consent needed', color: 'text-green-600' };
    }
    
    if (member.parent_consent_given) {
      return { icon: Shield, text: 'Consent given', color: 'text-green-600' };
    }
    
    return { icon: AlertCircle, text: 'Consent required', color: 'text-yellow-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-foreground">Family Settings</h1>
          <p className="text-muted-foreground mt-2">Manage family member profiles and parental consent</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* COPPA Compliance Notice */}
        <div className="bg-[--info-bg] border border-[--info-border] rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[--info] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[--info-foreground] mb-1">COPPA Compliance</p>
              <p className="text-[--info-foreground]/90">
                Family members aged 14-17 require annual parental consent to access the platform. 
                You can grant or revoke consent at any time.
              </p>
            </div>
          </div>
        </div>

        {/* Family Members List */}
        <div className="space-y-4">
          {members.map((member) => {
            const statusInfo = getConsentStatus(member);
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={member.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  {/* Member Info */}
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                      {member.profile_image_url ? (
                        <img
                          src={member.profile_image_url}
                          alt={member.display_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-foreground text-xl font-bold">
                          {member.first_name.charAt(0).toUpperCase()}
                          {member.last_name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Details */}
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {member.display_name}
                        {member.is_primary_contact && (
                          <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Parent
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Age: {member.current_age || 'N/A'} • {member.relationship} • {member.access_level} access
                      </p>
                      
                      {/* Consent Status */}
                      <div className={`flex items-center gap-2 mt-2 ${statusInfo.color}`}>
                        <StatusIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">{statusInfo.text}</span>
                        {member.parent_consent_given && member.parent_consent_date && (
                          <span className="text-xs text-muted-foreground">
                            (Since {new Date(member.parent_consent_date).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {member.requires_parent_consent && (
                    <div>
                      {member.parent_consent_given ? (
                        <button
                          onClick={() => handleRevokeConsent(member)}
                          className="px-4 py-2 text-sm font-medium text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900 transition-colors"
                        >
                          Revoke Consent
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantConsent(member)}
                          className="px-4 py-2 text-sm font-medium text-[--success-foreground] bg-[--success-bg] border border-[--success-border] rounded-lg hover:bg-[--success-bg]/80 transition-colors"
                        >
                          Grant Consent
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Status Message */}
                {member.status === 'pending_consent' && (
                  <div className="mt-4 bg-[--warning-bg] border border-[--warning-border] rounded p-3 text-sm text-[--warning-foreground]">
                    <Clock className="w-4 h-4 inline mr-2" />
                    This member cannot access the platform until parental consent is granted.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Consent Dialog */}
      {consentDialog.member && (
        <ConsentDialog
          isOpen={consentDialog.isOpen}
          onClose={() => setConsentDialog({ isOpen: false, member: null, action: 'grant' })}
          member={consentDialog.member}
          action={consentDialog.action}
          onConfirm={handleConfirmConsent}
        />
      )}
    </div>
  );
};

export default FamilySettingsPage;

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFamilyMembers, switchProfile, type FamilyMember } from '../../services/familyMemberService';
import { useAuth } from '../../contexts/AuthContext';
import { Plus } from 'lucide-react';
import ParentConsentModal from './ParentConsentModal';
import AddFamilyMemberModal from './AddFamilyMemberModal';

interface FamilyProfileSelectorProps {
  onProfileSelected?: (member: FamilyMember) => void;
  showAddButton?: boolean;
}

/**
 * Netflix-style Family Profile Selector
 * 
 * Displays all family member profiles in a grid with:
 * - Profile images or initials
 * - Access level indicators
 * - Consent status for minors
 */
const FamilyProfileSelector: React.FC<FamilyProfileSelectorProps> = ({
  onProfileSelected,
  showAddButton = true
}) => {
  const navigate = useNavigate();
  const { refreshToken, updateTokensAfterProfileSwitch } = useAuth(); // Get refreshToken to update auth context
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  // Age verification modal state
  const [showAgeVerificationModal, setShowAgeVerificationModal] = useState(false);
  const [pendingAgeVerificationMember, setPendingAgeVerificationMember] = useState<FamilyMember | null>(null);

  useEffect(() => {
    console.log('[FamilyProfileSelector] Component mounted, loading family members...');
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      console.log('[FamilyProfileSelector] Fetching family members from API...');
      setLoading(true);
      const data = await getFamilyMembers();
      console.log('[FamilyProfileSelector] ✅ Family members loaded:', data);
      setMembers(data);
      setError(null);
    } catch (err) {
      console.error('[FamilyProfileSelector] ❌ Error loading family members:', err);
      setError('Failed to load family members');
      console.error('Error loading family members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = async (member: FamilyMember) => {
    // Check if birth_date is NULL - needs age verification first
    if (!member.birth_date) {
      console.log('[FamilyProfileSelector] Birth date is NULL, showing age verification modal');
      setPendingAgeVerificationMember(member);
      setShowAgeVerificationModal(true);
      return;
    }

    // Check access restrictions
    if (!member.can_access_platform) {
      if (member.access_level === 'blocked') {
        alert('This profile cannot access the platform (under 14 years old)');
        return;
      }
      if (member.status === 'pending_consent') {
        // Show consent modal instead of alert
        setSelectedMember(member);
        setShowConsentModal(true);
        return;
      }
    }

    // Profile has access - proceed with switch
    try {
      console.log('[FamilyProfileSelector] 🔄 Switching to profile:', member.display_name);

      // Switch profile on backend (session-based, no DB persistence)
      const result = await switchProfile(member.id);
      console.log('[FamilyProfileSelector] ✅ Backend switch successful');

      if (result.token && result.refreshToken) {
        updateTokensAfterProfileSwitch(result.token, result.refreshToken, result.activeProfile);
        console.log('[FamilyProfileSelector] ✅ Auth context updated with new tokens');
      } else {
        // 🆕 CRITICAL: Refresh the auth context to get updated user data with profile info
        console.log('[FamilyProfileSelector] 🔄 Refreshing auth context...');
        await refreshToken();
        console.log('[FamilyProfileSelector] ✅ Auth context refreshed with new profile data');
      }

      if (onProfileSelected) {
        onProfileSelected(member);
      } else {
        // Default behavior: navigate to dashboard
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error switching profile:', err);
      alert('Failed to switch profile');
    }
  };

  const handleConsentGranted = async (updatedMember: FamilyMember) => {
    console.log('[FamilyProfileSelector] ✅ Consent granted for:', updatedMember.display_name);

    // Reload family members to get updated data
    await loadFamilyMembers();

    // Auto-switch to the newly consented profile
    try {
      console.log('[FamilyProfileSelector] 🔄 Auto-switching to consented profile...');
      const result = await switchProfile(updatedMember.id);
      
      if (result.token && result.refreshToken) {
        updateTokensAfterProfileSwitch(result.token, result.refreshToken, result.activeProfile);
      } else {
        await refreshToken();
      }

      if (onProfileSelected) {
        onProfileSelected(updatedMember);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Error auto-switching after consent:', err);
      // Don't show alert - consent was successful, just switch failed
      // User can manually click the profile again
    }
  };

  const handleAgeVerificationCompleted = async (updatedMember: FamilyMember) => {
    console.log('[FamilyProfileSelector] ✅ Age verification completed for:', updatedMember.display_name);
    setShowAgeVerificationModal(false);
    setPendingAgeVerificationMember(null);

    // Reload family members to get updated data
    await loadFamilyMembers();

    // Check the result of age verification
    if (updatedMember.access_level === 'blocked') {
      alert('This profile cannot access the platform (under 14 years old per COPPA requirements)');
      return;
    }

    if (updatedMember.status === 'pending_consent') {
      // Age 14-17: Show parent consent modal
      console.log('[FamilyProfileSelector] Age 14-17 detected, showing consent modal');
      setSelectedMember(updatedMember);
      setShowConsentModal(true);
      return;
    }

    // Age 18+: Proceed directly to profile switch
    if (updatedMember.can_access_platform) {
      try {
        console.log('[FamilyProfileSelector] 🔄 Auto-switching after age verification...');
        const result = await switchProfile(updatedMember.id);
        
        if (result.token && result.refreshToken) {
          updateTokensAfterProfileSwitch(result.token, result.refreshToken, result.activeProfile);
        } else {
          await refreshToken();
        }

        if (onProfileSelected) {
          onProfileSelected(updatedMember);
        } else {
          navigate('/dashboard');
        }
      } catch (err) {
        console.error('Error auto-switching after age verification:', err);
      }
    }
  };

  const handleAddMember = () => {
    navigate('/settings/family/add');
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'full':
        return 'bg-green-500';
      case 'supervised':
        return 'bg-yellow-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getInitials = (member: FamilyMember) => {
    return `${member.first_name.charAt(0)}${member.last_name.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-foreground text-xl">Loading profiles...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-destructive text-xl">{error}</div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-6xl w-full">
        <h1 className="text-4xl font-bold text-foreground text-center mb-12">
          Who's using the Alumni Network?
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex flex-col items-center cursor-pointer group"
              onClick={() => handleProfileClick(member)}
            >
              {/* Profile Image/Avatar */}
              <div className="relative mb-3">
                <div className={`
                  w-32 h-32 rounded-lg overflow-hidden border-4 border-transparent
                  group-hover:border-primary transition-all duration-200
                  ${!member.can_access_platform ? 'opacity-50' : ''}
                `}>
                  {member.profile_image_url ? (
                    <img
                      src={member.profile_image_url}
                      alt={member.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center">
                      <span className="text-primary-foreground text-4xl font-bold">
                        {getInitials(member)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Access Level Indicator */}
                <div className={`
                  absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-background
                  ${getAccessLevelColor(member.access_level)}
                `} title={`Access: ${member.access_level}`} />

                {/* Relationship Badge */}
                {member.relationship === 'parent' && (
                  <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Parent
                  </div>
                )}
                {member.relationship === 'child' && (
                  <div className="absolute bottom-1 left-1 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                    Child
                  </div>
                )}
              </div>

              {/* Member Name */}
              <div className="text-center">
                <div className="text-foreground text-lg font-medium group-hover:text-muted-foreground transition-colors">
                  {member.display_name}
                </div>
                
                {/* Status Indicators */}
                {member.status === 'pending_consent' && (
                  <div className="text-[--warning] text-sm mt-1">
                    Needs Consent
                  </div>
                )}
                {member.access_level === 'blocked' && (
                  <div className="text-destructive text-sm mt-1">
                    Under 14
                  </div>
                )}
                {member.access_level === 'supervised' && member.can_access_platform && (
                  <div className="text-[--warning] text-sm mt-1">
                    Supervised
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Member Card */}
          {showAddButton && (
            <div
              className="flex flex-col items-center cursor-pointer group"
              onClick={handleAddMember}
            >
              <div className="w-32 h-32 rounded-lg border-4 border-dashed border-border group-hover:border-primary transition-all duration-200 flex items-center justify-center mb-3">
                <Plus className="w-16 h-16 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-muted-foreground text-lg font-medium group-hover:text-foreground transition-colors">
                Add Member
              </div>
            </div>
          )}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/settings/family')}
            className="text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Manage Profiles
          </button>
        </div>
      </div>

      {/* Parent Consent Modal */}
      <ParentConsentModal
        isOpen={showConsentModal}
        onClose={() => {
          setShowConsentModal(false);
          setSelectedMember(null);
        }}
        member={selectedMember}
        onConsentGranted={handleConsentGranted}
      />

      {/* Age Verification Modal (reuses AddFamilyMemberModal in edit mode) */}
      <AddFamilyMemberModal
        isOpen={showAgeVerificationModal}
        onClose={() => {
          setShowAgeVerificationModal(false);
          setPendingAgeVerificationMember(null);
        }}
        editMember={pendingAgeVerificationMember}
        onBirthDateUpdated={handleAgeVerificationCompleted}
      />
    </div>
  );
};

export default FamilyProfileSelector;

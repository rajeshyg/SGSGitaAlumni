import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFamilyMembers, switchProfile, type FamilyMember } from '../../services/familyMemberService';
import { Plus } from 'lucide-react';

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
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError('Failed to load family members');
      console.error('Error loading family members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = async (member: FamilyMember) => {
    if (!member.can_access_platform) {
      if (member.access_level === 'blocked') {
        alert('This profile cannot access the platform (under 14 years old)');
        return;
      }
      if (member.status === 'pending_consent') {
        alert('This profile requires parent consent before accessing the platform');
        return;
      }
    }

    try {
      await switchProfile(member.id);
      
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

                {/* Primary Contact Badge */}
                {member.is_primary_contact && (
                  <div className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Parent
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
                  <div className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
                    Needs Consent
                  </div>
                )}
                {member.access_level === 'blocked' && (
                  <div className="text-destructive text-sm mt-1">
                    Under 14
                  </div>
                )}
                {member.access_level === 'supervised' && member.can_access_platform && (
                  <div className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">
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
    </div>
  );
};

export default FamilyProfileSelector;

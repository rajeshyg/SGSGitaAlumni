import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { switchProfile } from '../services/familyMemberService';
import { StorageUtils } from '../utils/storage';

interface Profile {
  id: string;
  relationship: string;
  accessLevel: string;
  status: string;
  firstName: string;
  lastName: string;
  batch?: string;
  centerName?: string;
  yearOfBirth?: number;
  requiresConsent: boolean;
  parentConsentGiven: boolean;
}

export function ProfileSelectionPage() {
  const navigate = useNavigate();
  const { user, updateTokensAfterProfileSwitch } = useAuth();
  const [availableProfiles, setAvailableProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load available profiles from localStorage (stored during login)
    const storedProfiles = StorageUtils.getItem('availableProfiles');
    if (storedProfiles) {
      try {
        const profiles = JSON.parse(storedProfiles);
        setAvailableProfiles(profiles);
      } catch (err) {
        console.error('Failed to parse available profiles:', err);
        setError('Failed to load available profiles');
      }
    } else {
      setError('No profiles available for selection');
    }

    // Check if user already has a profile selected
    if (user?.profileId) {
      console.log('User already has active profile, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleProfileSelect = async (profileId: string) => {
    if (isSwitching) return;

    setSelectedProfileId(profileId);
    setIsSwitching(true);
    setError(null);

    try {
      console.log('Switching to profile:', profileId);
      const result = await switchProfile(profileId);

      if (result.success && result.token && result.activeProfile) {
        // Update auth context with new tokens and profile
        updateTokensAfterProfileSwitch(result.token, result.refreshToken, result.activeProfile);

        // Clear stored profiles since selection is complete
        StorageUtils.removeItem('availableProfiles');

        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        throw new Error('Profile switch failed');
      }
    } catch (err) {
      console.error('Profile selection error:', err);
      setError(err instanceof Error ? err.message : 'Failed to select profile');
      setSelectedProfileId(null);
    } finally {
      setIsSwitching(false);
    }
  };

  const getProfileDisplayName = (profile: Profile) => {
    const name = `${profile.firstName} ${profile.lastName}`.trim();
    if (name) {
      return `${name} (${profile.relationship})`;
    }
    return profile.relationship;
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-foreground mb-4">Profile Selection Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90"
            >
              Return to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card p-8 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Select Your Profile</h1>
          <p className="text-muted-foreground">
            Choose which profile you'd like to use for this session
          </p>
        </div>

        <div className="space-y-3">
          {availableProfiles.map((profile) => (
            <button
              key={profile.id}
              onClick={() => handleProfileSelect(profile.id)}
              disabled={isSwitching}
              className={`w-full p-4 rounded-lg border-2 transition-all ${
                selectedProfileId === profile.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              } ${isSwitching ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50'}`}
            >
              <div className="text-left">
                <div className="font-medium text-foreground">
                  {getProfileDisplayName(profile)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Access Level: {profile.accessLevel}
                  {profile.batch && ` • Batch: ${profile.batch}`}
                </div>
                {profile.requiresConsent && (
                  <div className="text-xs text-orange-600 mt-1">
                    Requires parental consent
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {isSwitching && (
          <div className="mt-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Setting up your profile...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSelectionPage;

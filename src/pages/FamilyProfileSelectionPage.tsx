// ============================================================================
// FAMILY PROFILE SELECTION PAGE IMPLEMENTATION
// ============================================================================
// Multi-child profile selection for family invitations

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import Badge from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { InvitationService } from '../services/InvitationService';
import {
  FamilyInvitation,
  ChildProfile,
  UserRegistrationData
} from '../types/invitation';

// ============================================================================
// CUSTOM HOOK
// ============================================================================

const useFamilyInvitation = (token: string | undefined) => {
  const navigate = useNavigate();
  const invitationService = new InvitationService();

  const [familyInvitation, setFamilyInvitation] = useState<FamilyInvitation | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'registration' | 'complete'>('selection');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);

  useEffect(() => {
    if (token) {
      loadFamilyInvitation();
    } else {
      setError('No family invitation token provided');
      setIsLoading(false);
    }
  }, [token]);

  const loadFamilyInvitation = async () => {
    try {
      setIsLoading(true);
      const invitation = await invitationService.validateFamilyInvitation(token || '');
      if (!invitation) {
        setError('Invalid or expired family invitation token');
        return;
      }
      setFamilyInvitation(invitation);
      setAvailableProfiles(invitation.childrenProfiles);
    } catch (err) {
      setError('Failed to load family invitation. Please check the link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileToggle = (profileId: string) => {
    const newSelected = new Set(selectedProfiles);
    if (newSelected.has(profileId)) {
      newSelected.delete(profileId);
    } else {
      newSelected.add(profileId);
    }
    setSelectedProfiles(newSelected);
  };

  const getSelectedProfilesList = () => {
    return availableProfiles.filter(profile => selectedProfiles.has(profile.id));
  };

  const handleContinueToRegistration = () => {
    if (selectedProfiles.size === 0) {
      setError('Please select at least one profile to continue');
      return;
    }
    setStep('registration');
    setCurrentProfileIndex(0);
    setError(null);
  };

  const getCurrentProfile = () => {
    const selectedList = getSelectedProfilesList();
    return selectedList[currentProfileIndex];
  };

  const handleNextProfile = async () => {
    const selectedList = getSelectedProfilesList();
    if (currentProfileIndex < selectedList.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
      setError(null);
    } else {
      await handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      for (const profile of getSelectedProfilesList()) {
        const userData: UserRegistrationData = {
          firstName: profile.firstName,
          lastName: profile.lastName,
          birthDate: profile.birthDate,
          graduationYear: profile.graduationYear,
          program: profile.program
        };

        await invitationService.acceptFamilyInvitation(token || '', profile.id, userData);
      }

      setStep('complete');

      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Family registration complete! Please log in with your credentials.',
            email: familyInvitation?.parentEmail
          }
        });
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    familyInvitation,
    availableProfiles,
    selectedProfiles,
    isLoading,
    isSubmitting,
    error,
    step,
    currentProfileIndex,
    handleProfileToggle,
    getSelectedProfilesList,
    handleContinueToRegistration,
    getCurrentProfile,
    handleNextProfile,
    handleCompleteRegistration,
    setCurrentProfileIndex
  };
};

interface FamilyProfileSelectionPageProps {
  // No props needed - uses URL params
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const ProfileCard: React.FC<{
  profile: ChildProfile;
  isSelected: boolean;
  onToggle: (profileId: string) => void;
}> = ({ profile, isSelected, onToggle }) => (
  <Card
    className={`cursor-pointer transition-all ${
      isSelected
        ? 'ring-2 ring-primary bg-primary/5'
        : 'hover:shadow-md'
    }`}
    onClick={() => onToggle(profile.id)}
  >
    <CardContent className="p-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          checked={isSelected}
          onChange={() => onToggle(profile.id)}
          className="mt-1"
        />

        <Avatar className="h-12 w-12">
          <AvatarImage src={`/api/placeholder/avatar/${profile.id}`} />
          <AvatarFallback>
            {profile.firstName[0]}{profile.lastName[0]}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h3 className="font-semibold">
            {profile.firstName} {profile.lastName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {profile.program} • Class of {profile.graduationYear}
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant={profile.isEligible ? 'default' : 'secondary'}>
              {profile.isEligible ? 'Eligible' : 'Not Eligible'}
            </Badge>
            {profile.requiresParentConsent && (
              <Badge variant="outline">Parent Consent Required</Badge>
            )}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const SelectionStep: React.FC<{
  availableProfiles: ChildProfile[];
  selectedProfiles: Set<string>;
  onProfileToggle: (profileId: string) => void;
  onContinue: () => void;
}> = ({ availableProfiles, selectedProfiles, onProfileToggle, onContinue }) => {
  const selectedList = availableProfiles.filter(profile => selectedProfiles.has(profile.id));

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Accept Invitation</CardTitle>
        <CardDescription>
          Choose which family members you'd like to create accounts for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {availableProfiles.map(profile => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              isSelected={selectedProfiles.has(profile.id)}
              onToggle={onProfileToggle}
            />
          ))}
        </div>

        {selectedProfiles.size > 0 && (
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Selected Profiles ({selectedProfiles.size}):</h4>
            <div className="flex flex-wrap gap-2">
              {selectedList.map(profile => (
                <Badge key={profile.id} variant="secondary">
                  {profile.firstName} {profile.lastName}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={onContinue}
          className="w-full"
          disabled={selectedProfiles.size === 0}
        >
          Continue with Selected Profiles ({selectedProfiles.size})
        </Button>
      </CardContent>
    </Card>
  );
};

const RegistrationStep: React.FC<{
  currentProfile: ChildProfile;
  currentIndex: number;
  totalProfiles: number;
  onPrevious: () => void;
  onNext: () => void;
  isSubmitting: boolean;
  isLastProfile: boolean;
}> = ({ currentProfile, currentIndex, totalProfiles, onPrevious, onNext, isSubmitting, isLastProfile }) => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>
        Register {currentProfile.firstName} {currentProfile.lastName}
      </CardTitle>
      <CardDescription>
        Profile {currentIndex + 1} of {totalProfiles}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Registration form fields would go here */}
        <p className="text-sm text-muted-foreground">
          Registration form for {currentProfile.firstName} will be implemented here.
        </p>

        <div className="flex space-x-2">
          {currentIndex > 0 && (
            <Button
              variant="outline"
              onClick={onPrevious}
              className="flex-1"
            >
              Previous
            </Button>
          )}

          <Button
            onClick={onNext}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isLastProfile
              ? (isSubmitting ? 'Completing...' : 'Complete Registration')
              : 'Next Profile'
            }
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
);

const CompleteStep: React.FC<{
  selectedCount: number;
}> = ({ selectedCount }) => (
  <Card className="w-full max-w-md mx-auto">
    <CardHeader>
      <CardTitle>Registration Complete!</CardTitle>
      <CardDescription>
        All family members have been successfully registered
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-green-800">
          {selectedCount} family member{selectedCount !== 1 ? 's' : ''}
          {selectedCount !== 1 ? ' have' : ' has'} been registered successfully.
          You will be redirected to the login page shortly.
        </p>
      </div>
    </CardContent>
  </Card>
);


// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const FamilyProfileSelectionPage: React.FC<FamilyProfileSelectionPageProps> = () => {
  const { token } = useParams<{ token: string }>();

  const {
    availableProfiles,
    selectedProfiles,
    isLoading,
    isSubmitting,
    error,
    step,
    currentProfileIndex,
    handleProfileToggle,
    getSelectedProfilesList,
    handleContinueToRegistration,
    getCurrentProfile,
    handleNextProfile,
    handleCompleteRegistration,
    setCurrentProfileIndex
  } = useFamilyInvitation(token);


  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading family invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedList = getSelectedProfilesList();
  const currentProfile = getCurrentProfile();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {error && (
        <div className="mb-4 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {step === 'selection' && (
        <SelectionStep
          availableProfiles={availableProfiles}
          selectedProfiles={selectedProfiles}
          onProfileToggle={handleProfileToggle}
          onContinue={handleContinueToRegistration}
        />
      )}

      {step === 'registration' && currentProfile && (
        <RegistrationStep
          currentProfile={currentProfile}
          currentIndex={currentProfileIndex}
          totalProfiles={selectedList.length}
          onPrevious={() => setCurrentProfileIndex(currentProfileIndex - 1)}
          onNext={handleNextProfile}
          isSubmitting={isSubmitting}
          isLastProfile={currentProfileIndex >= selectedList.length - 1}
        />
      )}

      {step === 'complete' && (
        <CompleteStep selectedCount={selectedProfiles.size} />
      )}
    </div>
  );
};

export default FamilyProfileSelectionPage;

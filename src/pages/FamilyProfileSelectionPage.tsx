// ============================================================================
// FAMILY PROFILE SELECTION PAGE IMPLEMENTATION
// ============================================================================
// Multi-child profile selection for family invitations

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { InvitationService } from '../services/InvitationService';
import { AgeVerificationService } from '../services/AgeVerificationService';
import { 
  FamilyInvitation, 
  ChildProfile,
  UserRegistrationData 
} from '../types/invitation';

interface FamilyProfileSelectionPageProps {
  // No props needed - uses URL params
}

export const FamilyProfileSelectionPage: React.FC<FamilyProfileSelectionPageProps> = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  // Services
  const invitationService = new InvitationService();
  const ageVerificationService = new AgeVerificationService();
  
  // State management
  const [familyInvitation, setFamilyInvitation] = useState<FamilyInvitation | null>(null);
  const [availableProfiles, setAvailableProfiles] = useState<ChildProfile[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'selection' | 'registration' | 'complete'>('selection');
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [registrationData, setRegistrationData] = useState<Record<string, UserRegistrationData>>({});

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (token) {
      loadFamilyInvitation();
    } else {
      setError('No family invitation token provided');
      setIsLoading(false);
    }
  }, [token]);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadFamilyInvitation = async () => {
    try {
      setIsLoading(true);
      
      // TODO: Implement family invitation validation endpoint
      // const response = await invitationService.validateFamilyInvitation(token);
      
      // Mock data for now - replace with real API call
      const mockFamilyInvitation: FamilyInvitation = {
        id: 'family-inv-1',
        parentEmail: 'parent@example.com',
        childrenProfiles: [
          {
            id: 'child-1',
            firstName: 'Arjun',
            lastName: 'Patel',
            graduationYear: 2020,
            program: 'Bhagavad Gita Course',
            relationship: 'son',
            birthDate: new Date('2002-05-15'),
            isEligible: true,
            requiresParentConsent: false
          },
          {
            id: 'child-2',
            firstName: 'Priya',
            lastName: 'Patel',
            graduationYear: 2022,
            program: 'Bhagavad Gita Course',
            relationship: 'daughter',
            birthDate: new Date('2006-08-20'),
            isEligible: true,
            requiresParentConsent: true
          }
        ],
        invitationToken: token || '',
        status: 'pending',
        sentAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedBy: 'admin-user-id',
        createdAt: new Date()
      };

      setFamilyInvitation(mockFamilyInvitation);
      setAvailableProfiles(mockFamilyInvitation.childrenProfiles);
      
    } catch (err) {
      setError('Failed to load family invitation. Please check the link and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // PROFILE SELECTION
  // ============================================================================

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

  // ============================================================================
  // REGISTRATION FLOW
  // ============================================================================

  const getCurrentProfile = () => {
    const selectedList = getSelectedProfilesList();
    return selectedList[currentProfileIndex];
  };

  const handleRegistrationDataChange = (field: string, value: string | number | Date) => {
    const currentProfile = getCurrentProfile();
    if (!currentProfile) return;

    setRegistrationData(prev => ({
      ...prev,
      [currentProfile.id]: {
        ...prev[currentProfile.id],
        [field]: value
      }
    }));
  };

  const handleNextProfile = async () => {
    const currentProfile = getCurrentProfile();
    if (!currentProfile) return;

    // Validate current profile data
    const currentData = registrationData[currentProfile.id];
    if (!currentData?.firstName || !currentData?.lastName) {
      setError('Please fill in all required fields');
      return;
    }

    // Check if this is the last profile
    const selectedList = getSelectedProfilesList();
    if (currentProfileIndex < selectedList.length - 1) {
      setCurrentProfileIndex(currentProfileIndex + 1);
      setError(null);
    } else {
      // Complete registration for all profiles
      await handleCompleteRegistration();
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Register each selected profile
      for (const profile of getSelectedProfilesList()) {
        const userData = registrationData[profile.id];
        
        // Perform age verification
        const ageVerification = await ageVerificationService.verifyAge(profile.birthDate);
        
        if (!ageVerification.isValid) {
          throw new Error(`Age verification failed for ${profile.firstName}: ${ageVerification.errors.join(', ')}`);
        }

        // TODO: Create user account for each profile
        // await invitationService.acceptFamilyInvitation(token, profile.id, userData);
      }

      setStep('complete');
      
      // Redirect after completion
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

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderProfileCard = (profile: ChildProfile) => (
    <Card 
      key={profile.id} 
      className={`cursor-pointer transition-all ${
        selectedProfiles.has(profile.id) 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:shadow-md'
      }`}
      onClick={() => handleProfileToggle(profile.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={selectedProfiles.has(profile.id)}
            onChange={() => handleProfileToggle(profile.id)}
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

  const renderSelectionStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Family Members</CardTitle>
        <CardDescription>
          Choose which family members you'd like to create accounts for
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 mb-6">
          {availableProfiles.map(renderProfileCard)}
        </div>
        
        {selectedProfiles.size > 0 && (
          <div className="bg-muted p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">Selected Profiles ({selectedProfiles.size}):</h4>
            <div className="flex flex-wrap gap-2">
              {getSelectedProfilesList().map(profile => (
                <Badge key={profile.id} variant="secondary">
                  {profile.firstName} {profile.lastName}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <Button
          onClick={handleContinueToRegistration}
          className="w-full"
          disabled={selectedProfiles.size === 0}
        >
          Continue with Selected Profiles ({selectedProfiles.size})
        </Button>
      </CardContent>
    </Card>
  );

  const renderRegistrationStep = () => {
    const currentProfile = getCurrentProfile();
    const selectedList = getSelectedProfilesList();
    
    if (!currentProfile) return null;

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>
            Register {currentProfile.firstName} {currentProfile.lastName}
          </CardTitle>
          <CardDescription>
            Profile {currentProfileIndex + 1} of {selectedList.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Registration form fields would go here */}
            <p className="text-sm text-muted-foreground">
              Registration form for {currentProfile.firstName} will be implemented here.
            </p>
            
            <div className="flex space-x-2">
              {currentProfileIndex > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setCurrentProfileIndex(currentProfileIndex - 1)}
                  className="flex-1"
                >
                  Previous
                </Button>
              )}
              
              <Button
                onClick={handleNextProfile}
                disabled={isSubmitting}
                className="flex-1"
              >
                {currentProfileIndex < selectedList.length - 1 
                  ? 'Next Profile' 
                  : isSubmitting 
                    ? 'Completing...' 
                    : 'Complete Registration'
                }
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCompleteStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registration Complete!</CardTitle>
        <CardDescription>
          All family members have been successfully registered
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            {selectedProfiles.size} family member{selectedProfiles.size !== 1 ? 's' : ''} 
            {selectedProfiles.size !== 1 ? ' have' : ' has'} been registered successfully. 
            You will be redirected to the login page shortly.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );

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

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {error && (
        <Alert className="mb-4 max-w-2xl mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {step === 'selection' && renderSelectionStep()}
      {step === 'registration' && renderRegistrationStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default FamilyProfileSelectionPage;

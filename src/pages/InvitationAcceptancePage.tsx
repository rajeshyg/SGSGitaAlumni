// ============================================================================
// INVITATION ACCEPTANCE PAGE
// ============================================================================
// Page for users to accept invitations and complete registration

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import { InvitationService } from '../services/InvitationService';
import { AgeVerificationService } from '../services/AgeVerificationService';
import { OTPService } from '../services/OTPService';
import {
  Invitation,
  InvitationValidation,
  UserRegistrationData,
  AgeVerificationResult,
  OTPValidation,
  AlumniData
} from '../types/invitation';

interface InvitationAcceptancePageProps {
  // No props needed - uses URL params
}

export const InvitationAcceptancePage: React.FC<InvitationAcceptancePageProps> = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  console.log('InvitationAcceptancePage: Component rendered with token:', token);
  
  // Services
  const invitationService = new InvitationService();
  const ageVerificationService = new AgeVerificationService();
  
  // State management
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [validation, setValidation] = useState<InvitationValidation | null>(null);
  const [alumniData, setAlumniData] = useState<AlumniData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'validation' | 'registration' | 'age-verification' | 'parent-consent' | 'complete'>('validation');

  // Form data
  const [formData, setFormData] = useState<UserRegistrationData>({
    firstName: '',
    lastName: '',
    birthDate: new Date(),
    graduationYear: new Date().getFullYear(),
    program: '',
    currentPosition: '',
    bio: ''
  });
  
  const [ageVerification, setAgeVerification] = useState<AgeVerificationResult | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    console.log('InvitationAcceptancePage: useEffect triggered with token:', token);
    if (token) {
      console.log('InvitationAcceptancePage: Token found, calling validateInvitation');
      validateInvitation();
    } else {
      console.log('InvitationAcceptancePage: No token found, setting error');
      setError('No invitation token provided');
      setIsLoading(false);
    }
  }, [token]);

  // ============================================================================
  // INVITATION VALIDATION
  // ============================================================================

  const validateInvitation = async () => {
    console.log('InvitationAcceptancePage: validateInvitation called');
    try {
      console.log('InvitationAcceptancePage: Setting isLoading to true');
      setIsLoading(true);
      setError(null);

      if (!token) {
        console.log('InvitationAcceptancePage: No token provided, throwing error');
        throw new Error('No invitation token provided');
      }

      console.log('InvitationAcceptancePage: Calling invitationService.validateInvitation with token:', token);
      const validationResult = await invitationService.validateInvitation(token);
      console.log('InvitationAcceptancePage: Validation result received:', validationResult);

      setValidation(validationResult);

      if (validationResult.isValid && validationResult.invitation) {
        console.log('InvitationAcceptancePage: Validation successful, moving to registration step');
        setInvitation(validationResult.invitation);

        // Pre-populate form with alumni data if available
        if (validationResult.alumniData) {
          console.log('InvitationAcceptancePage: Alumni data found, pre-populating form');
          setAlumniData(validationResult.alumniData);
          setFormData({
            firstName: validationResult.alumniData.firstName || '',
            lastName: validationResult.alumniData.lastName || '',
            birthDate: new Date(), // Birth date not in alumni data
            graduationYear: validationResult.alumniData.graduationYear || new Date().getFullYear(),
            program: validationResult.alumniData.program || '',
            currentPosition: '',
            bio: ''
          });
        }

        setStep('registration');
      } else {
        console.log('InvitationAcceptancePage: Validation failed with errors:', validationResult.errors);
        setError(validationResult.errors.join(', '));
      }
    } catch (err) {
      console.log('InvitationAcceptancePage: Validation failed with exception:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate invitation');
    } finally {
      console.log('InvitationAcceptancePage: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  // ============================================================================
  // FORM HANDLING
  // ============================================================================

  const handleInputChange = (field: keyof UserRegistrationData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (field: keyof UserRegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: new Date(value)
    }));
  };

  // ============================================================================
  // AGE VERIFICATION
  // ============================================================================

  const performAgeVerification = async () => {
    try {
      const ageResult = await ageVerificationService.verifyAge(formData.birthDate);
      setAgeVerification(ageResult);

      if (!ageResult.isValid) {
        setError(ageResult.errors.join(', '));
        return false;
      }

      if (ageResult.requiresParentConsent) {
        setStep('parent-consent');
        return false; // Don't proceed to registration yet
      }

      return true; // Can proceed to registration
    } catch (err) {
      setError('Age verification failed');
      return false;
    }
  };

  // ============================================================================
  // REGISTRATION SUBMISSION
  // ============================================================================

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !validation?.isValid) {
      setError('Invalid invitation');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Perform age verification first
      const ageVerificationPassed = await performAgeVerification();
      
      if (!ageVerificationPassed) {
        return; // Age verification failed or requires parent consent
      }

      // Accept invitation and create user account
      const user = await invitationService.acceptInvitation(token, formData);
      
      setStep('complete');
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Registration complete! Please log in with your credentials.',
            email: user.email 
          }
        });
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderValidationStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Validating Invitation</CardTitle>
        <CardDescription>
          Please wait while we validate your invitation...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </CardContent>
    </Card>
  );

  const renderRegistrationStep = () => (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Registration</CardTitle>
        <CardDescription>
          You've been invited to join the SGS Gita Alumni Network. Please complete your profile.
          {alumniData && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Pre-filled from your alumni record:</strong> Your name and graduation information have been automatically filled in.
              </p>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleRegistrationSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium mb-1">
                First Name *
              </label>
              <Input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium mb-1">
                Last Name *
              </label>
              <Input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium mb-1">
              Birth Date *
            </label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate.toISOString().split('T')[0]}
              onChange={(e) => handleDateChange('birthDate', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="graduationYear" className="block text-sm font-medium mb-1">
                Graduation Year *
              </label>
              <Input
                id="graduationYear"
                type="number"
                min="1990"
                max={new Date().getFullYear()}
                value={formData.graduationYear}
                onChange={(e) => handleInputChange('graduationYear', e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="program" className="block text-sm font-medium mb-1">
                Program *
              </label>
              <Input
                id="program"
                type="text"
                value={formData.program}
                onChange={(e) => handleInputChange('program', e.target.value)}
                placeholder="e.g., Gita Course, Advanced Course"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="currentPosition" className="block text-sm font-medium mb-1">
              Current Position
            </label>
            <Input
              id="currentPosition"
              type="text"
              value={formData.currentPosition}
              onChange={(e) => handleInputChange('currentPosition', e.target.value)}
              placeholder="Your current job or role"
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium mb-1">
              Bio
            </label>
            <textarea
              id="bio"
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell us a bit about yourself..."
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderParentConsentStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Parent Consent Required</CardTitle>
        <CardDescription>
          Since you are under 18, we need parent consent before you can join.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            We will send a consent form to your parent's email address. 
            Please ask them to check their email and complete the consent process.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/login')} 
          className="w-full mt-4"
        >
          Return to Login
        </Button>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Registration Complete!</CardTitle>
        <CardDescription>
          Welcome to the SGS Gita Alumni Network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertDescription>
            Your account has been created successfully. You will be redirected to the login page shortly.
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
        {renderValidationStep()}
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
      
      {step === 'registration' && renderRegistrationStep()}
      {step === 'parent-consent' && renderParentConsentStep()}
      {step === 'complete' && renderCompleteStep()}
    </div>
  );
};

export default InvitationAcceptancePage;

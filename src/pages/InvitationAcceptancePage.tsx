// ============================================================================
// INVITATION ACCEPTANCE PAGE
// ============================================================================
// Simple page for certified alumni to accept invitations and join the network

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { APIService } from '../services/APIService';
import { AlumniProfile } from '../services/AlumniDataIntegrationService';
import { OTPService } from '../services/OTPService';

interface InvitationValidationResponse {
  isValid: boolean;
  invitation: {
    id: string;
    email: string;
    invitationToken: string;
    invitedBy: number;
    invitationType: string;
    alumniMemberId?: number;
    completionStatus: string;
    status: string;
    sentAt: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  } | null;
  alumniProfile: AlumniProfile | null;
  requiresUserInput: boolean;
  suggestedFields: string[];
  canOneClickJoin: boolean;
  errorType?: 'expired' | 'used' | 'invalid' | 'not_found';
  errorMessage?: string;
  registrationData?: {
    requiredFields: string[];
    optionalFields: string[];
    estimatedCompletionTime: number;
  };
}

interface InvitationAcceptancePageProps {
  // No props needed - uses URL params
}

export const InvitationAcceptancePage: React.FC<InvitationAcceptancePageProps> = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  // Services
  const apiService = APIService;
  const otpService = new OTPService();

  // State management
  const [validation, setValidation] = useState<InvitationValidationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent duplicate API calls (especially in React StrictMode during development)
  const hasValidated = useRef(false);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Prevent duplicate validation calls (React StrictMode in dev causes double-invocation)
    if (hasValidated.current) {
      console.log('[InvitationAcceptancePage] Skipping duplicate validation (already validated)');
      return;
    }

    if (token) {
      hasValidated.current = true;
      validateInvitation();
    } else {
      setError('No invitation token provided');
      setIsLoading(false);
    }
  }, [token]);

  // ============================================================================
  // INVITATION VALIDATION
  // ============================================================================

  const validateInvitation = async () => {
    try {
      console.log('[InvitationAcceptancePage] Starting validation for token:', token);
      setIsLoading(true);
      setError(null);

      console.log('[InvitationAcceptancePage] Calling APIService.validateInvitation...');
      const response = await apiService.validateInvitation(token!);
      
      console.log('[InvitationAcceptancePage] API response received:', response);
      setValidation(response);

      if (!response.isValid) {
        console.log('[InvitationAcceptancePage] Invitation invalid:', response.errorMessage);
        setError(response.errorMessage || 'Invalid or expired invitation');
      } else {
        console.log('[InvitationAcceptancePage] Invitation valid:', response);
      }
    } catch (err) {
      console.error('[InvitationAcceptancePage] Validation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to validate invitation');
    } finally {
      console.log('[InvitationAcceptancePage] Setting loading to false');
      setIsLoading(false);
    }
  };

  // ============================================================================
  // JOIN ALUMNI NETWORK
  // ============================================================================

  const handleJoinAlumniNetwork = async () => {
    if (!token || !validation?.isValid) {
      setError('Invalid invitation');
      return;
    }

    try {
      setIsJoining(true);
      setError(null);

      console.log('[InvitationAcceptancePage] Starting registration from invitation...');

      // Register from invitation using streamlined service
      const response = await apiService.registerFromInvitation({
        invitationToken: token,
        additionalData: {}
      });

      console.log('[InvitationAcceptancePage] Registration successful:', response);

      // Generate and send OTP for verification
      const email = response.user.email || validation.invitation?.email;
      
      if (!email) {
        setError('User email not found. Please contact support.');
        return;
      }

      console.log('[InvitationAcceptancePage] Generating OTP for email:', email);

      // Generate OTP using OTPService (this also sends the OTP via email)
      await otpService.generateOTP({
        email,
        type: 'registration',
        userId: response.user.id?.toString()
      });

      console.log('[InvitationAcceptancePage] OTP generated and sent successfully');

      // Determine redirect path based on profile completion needs
      let redirectTo = '/dashboard';
      let missingFields: string[] = [];

      if (response.user.needsProfileCompletion) {
        // User needs to complete profile (missing birthdate or other critical data)
        redirectTo = '/profile-completion';
        missingFields = ['birthDate']; // Primary missing field
        console.log('[InvitationAcceptancePage] User needs profile completion, will redirect to:', redirectTo);
      } else {
        // User has complete data, redirect to family setup (hybrid approach)
        redirectTo = '/family-setup';
        console.log('[InvitationAcceptancePage] User profile complete, will redirect to family setup');
      }

      // Redirect to OTP verification page
      navigate(`/verify-otp/${encodeURIComponent(email)}`, {
        state: {
          email,
          otpType: 'registration',
          verificationMethod: 'email',
          redirectTo,
          missingFields,
          message: 'Welcome to SGS Gita Alumni Network! Please verify your email to continue.',
          user: response.user
        }
      });

    } catch (err) {
      console.error('[InvitationAcceptancePage] Join alumni network error:', err);
      console.error('[InvitationAcceptancePage] Error type:', typeof err);
      console.error('[InvitationAcceptancePage] Error keys:', err ? Object.keys(err) : 'null');
      console.error('[InvitationAcceptancePage] Error message:', err instanceof Error ? err.message : String(err));
      
      // Extract meaningful error message
      let errorMessage = 'Failed to join alumni network';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        if ('message' in err) {
          errorMessage = String(err.message);
        } else if ('error' in err) {
          errorMessage = String((err as any).error);
        } else {
          errorMessage = JSON.stringify(err);
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setIsJoining(false);
    }
  };

  // ============================================================================
  // RENDER METHODS
  // ============================================================================

  const renderLoading = () => (
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

  const renderAlumniInfo = () => {
    if (!validation?.alumniProfile) return null;

    const profile = validation.alumniProfile;
    return (
      <div className="bg-[--info-bg] border border-[--info-border] rounded-md p-4 mb-4">
        <h3 className="font-medium text-[--info-foreground] mb-2">Your Alumni Information</h3>
        <div className="space-y-1 text-sm text-[--info-foreground]/90">
          <p><strong>Name:</strong> {profile.firstName} {profile.lastName}</p>
          <p><strong>Graduation:</strong> {profile.graduationYear} - {profile.program}</p>
          <p><strong>Student ID:</strong> {profile.studentId}</p>
          {profile.email && <p><strong>Email:</strong> {profile.email}</p>}
        </div>
      </div>
    );
  };

  const renderInvalidInvitation = () => {
    if (!validation || validation.isValid) return null;

    const getErrorTitle = () => {
      switch (validation.errorType) {
        case 'expired':
          return 'Invitation Expired';
        case 'used':
          return 'Invitation Already Used';
        case 'not_found':
          return 'Invitation Not Found';
        default:
          return 'Invalid Invitation';
      }
    };

    const getErrorActions = () => {
      switch (validation.errorType) {
        case 'expired':
          return (
            <div className="space-y-2">
              <p className="text-sm text-[--muted-foreground]">
                This invitation has expired. Please contact the administrator to request a new invitation.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Return to Home
              </Button>
            </div>
          );
        case 'used':
          return (
            <div className="space-y-2">
              <p className="text-sm text-[--muted-foreground]">
                This invitation has already been used. If you believe this is an error, please contact support.
              </p>
              <Button onClick={() => navigate('/login')} variant="outline">
                Go to Login
              </Button>
            </div>
          );
        default:
          return (
            <div className="space-y-2">
              <p className="text-sm text-[--muted-foreground]">
                The invitation link appears to be invalid. Please check the link or contact the administrator.
              </p>
              <Button onClick={() => navigate('/')} variant="outline">
                Return to Home
              </Button>
            </div>
          );
      }
    };

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-destructive">{getErrorTitle()}</CardTitle>
          <CardDescription>
            {validation.errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {getErrorActions()}
        </CardContent>
      </Card>
    );
  };

  const renderJoinForm = () => {
    if (!validation?.isValid) return null;

    const requiresConsent = validation.alumniProfile?.requiresParentConsent || false;

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Join SGS Gita Alumni Network</CardTitle>
          <CardDescription>
            Welcome! You've been invited to join our alumni community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderAlumniInfo()}

          {requiresConsent ? (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Since you appear to be under 18, we need parent consent before you can join.
                  A consent request will be sent to your parent's email.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => navigate('/')}
                className="w-full"
              >
                Return to Home
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[--muted-foreground]">
                By joining the alumni network, you agree to our Terms of Service and Privacy Policy.
              </p>
              <Button
                onClick={handleJoinAlumniNetwork}
                className="w-full"
                disabled={isJoining}
              >
                {isJoining ? 'Joining...' : 'Join Alumni Network'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
        {renderLoading()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
      {error && !validation?.errorType && (
        <Alert className="mb-4 max-w-2xl mx-auto">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validation?.isValid ? renderJoinForm() : renderInvalidInvitation()}
    </div>
  );
};

export default InvitationAcceptancePage;

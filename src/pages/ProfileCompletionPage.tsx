// ============================================================================
// PROFILE COMPLETION PAGE
// ============================================================================
// Page for completing missing critical user profile data after registration

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Calendar } from 'lucide-react';
import { APIService } from '../services/APIService';

interface ProfileCompletionPageProps {
  // No props needed - uses location state
}

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  alumniMemberId?: number;
  primaryFamilyMemberId?: string;
}

interface LocationState {
  user: UserData;
  missingFields: string[];
  redirectTo?: string;
}

export const ProfileCompletionPage: React.FC<ProfileCompletionPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const apiService = APIService;

  // State management - UPDATED: Using yearOfBirth instead of full birthDate
  const [yearOfBirth, setYearOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const missingFields = state?.missingFields || ['yearOfBirth'];
  const needsYearOfBirth = missingFields.includes('yearOfBirth') || missingFields.includes('birthDate');
  const needsPhone = missingFields.includes('phone');

  useEffect(() => {
    // Redirect to dashboard if no user data provided
    if (!state?.user) {
      console.warn('[ProfileCompletionPage] No user data found, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [state, navigate]);

  // ============================================================================
  // FORM SUBMISSION
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (needsYearOfBirth && !yearOfBirth) {
      setError('Year of birth is required to continue');
      return;
    }

    if (needsPhone && !phone) {
      setError('Phone number is required to continue');
      return;
    }

    // Validate year of birth format and age
    if (needsYearOfBirth) {
      const year = parseInt(yearOfBirth, 10);
      const currentYear = new Date().getFullYear();
      const age = currentYear - year;

      if (isNaN(year) || year < 1900 || year > currentYear) {
        setError('Please enter a valid year of birth');
        return;
      }

      if (age < 0 || age > 120) {
        setError('Please enter a valid year of birth');
        return;
      }
    }

    try {
      setIsSubmitting(true);

      // Update user profile with missing data
      const updateData: {
        yearOfBirth?: number;
        phone?: string;
        profileId?: string;
      } = {};

      if (needsYearOfBirth) {
        updateData.yearOfBirth = parseInt(yearOfBirth, 10);
      }

      if (needsPhone) {
        updateData.phone = phone;
      }

      // Include profile ID to update user_profiles record
      if (state.user.profileId) {
        updateData.profileId = state.user.profileId;
      }

      console.log('[ProfileCompletionPage] Updating profile with data:', updateData);

      await apiService.updateUserProfile(state.user.id, updateData);

      console.log('[ProfileCompletionPage] Profile updated successfully');

      // Redirect to onboarding page or specified redirect
      const redirectPath = state.redirectTo || '/onboarding';
      navigate(redirectPath, {
        state: {
          user: state.user,
          message: 'Profile completed successfully!'
        }
      });

    } catch (err) {
      console.error('[ProfileCompletionPage] Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Allow skip but warn user
    if (window.confirm('Skipping profile completion may limit some features. Are you sure?')) {
      const redirectPath = state?.redirectTo || '/dashboard';
      navigate(redirectPath);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!state?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Complete Your Profile
          </CardTitle>
          <CardDescription>
            We need a bit more information to set up your account properly
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4 bg-destructive/10 border-destructive/20">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-[--info-bg] border border-[--info-border] rounded-md p-4">
              <h3 className="font-medium text-[--info-foreground] mb-2">Welcome, {state.user.firstName}!</h3>
              <p className="text-sm text-[--info-foreground]/90">
                We found your alumni record but need some additional details to personalize your experience.
              </p>
            </div>

            {needsYearOfBirth && (
              <div className="space-y-2">
                <Label htmlFor="yearOfBirth" className="flex items-center gap-1">
                  Year of Birth <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="yearOfBirth"
                  type="number"
                  value={yearOfBirth}
                  onChange={(e) => setYearOfBirth(e.target.value)}
                  min="1900"
                  max={new Date().getFullYear()}
                  placeholder="YYYY"
                  required
                  className="w-full"
                />
                <p className="text-xs text-[--muted-foreground]">
                  Your birth date helps us provide age-appropriate features and comply with privacy regulations
                </p>
              </div>
            )}

            {needsPhone && (
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-1">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  required
                  className="w-full"
                />
                <p className="text-xs text-[--muted-foreground]">
                  We'll only use this for important account notifications
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isSubmitting}
              >
                Skip
              </Button>
            </div>

            <p className="text-xs text-center text-[--muted-foreground]">
              You can always update this information later in your profile settings
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileCompletionPage;

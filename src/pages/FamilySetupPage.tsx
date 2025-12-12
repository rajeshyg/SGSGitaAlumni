// ============================================================================
// FAMILY SETUP PAGE
// ============================================================================
// Initial family setup page after registration (hybrid approach)
// Shows auto-created profiles and allows adding additional members
// UPDATED: Uses user_profiles instead of FAMILY_MEMBERS

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Users, CheckCircle, Plus, ArrowRight } from 'lucide-react';
import { getProfiles } from '../services/familyMemberService';
import type { UserProfile } from '../types/accounts';

// Alias for backward compatibility
type FamilyMember = UserProfile & {
  display_name?: string;
  current_age?: number;
};

interface FamilySetupPageProps {}

interface LocationState {
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profileId?: string;
  };
  message?: string;
}

export const FamilySetupPage: React.FC<FamilySetupPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  // State management
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadFamilyMembers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // getProfiles returns UserProfile[], map to FamilyMember format for backward compat
      const profiles = await getProfiles();
      const members = profiles.map(p => ({
        ...p,
        display_name: p.displayName || `${p.firstName} ${p.lastName}`,
        current_age: p.yearOfBirth ? new Date().getFullYear() - p.yearOfBirth : undefined
      })) as FamilyMember[];
      setFamilyMembers(members);

      console.log('[FamilySetupPage] Loaded profiles:', members);
    } catch (err) {
      console.error('[FamilySetupPage] Error loading profiles:', err);
      setError('Failed to load profiles');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  const handleAddFamilyMember = () => {
    // Navigate to family settings page where they can add more members
    navigate('/family-settings', {
      state: {
        isInitialSetup: true,
        message: 'Add your family members here'
      }
    });
  };

  const handleContinueToDashboard = () => {
    // Check if we have multiple family members and need to select primary profile
    if (familyMembers.length > 1) {
      // Navigate to profile selection page
      navigate('/select-profile', {
        state: {
          familyMembers,
          redirectTo: '/dashboard'
        }
      });
    } else {
      // Just one member (self), go directly to dashboard
      navigate('/dashboard', {
        state: {
          message: 'Welcome to SGS Gita Alumni Network!'
        }
      });
    }
  };

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderInitialMember = () => {
    if (familyMembers.length === 0) return null;

    // Updated: Use 'parent' relationship instead of 'self'
    const primaryMember = familyMembers.find(m => m.relationship === 'parent') || familyMembers[0];

    return (
      <div className="bg-[--success-bg] border border-[--success-border] rounded-lg p-4">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-[--success] flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-[--success-foreground] mb-1">
              Your Profile Created Successfully
            </h3>
            <div className="text-sm text-[--success-foreground]/90 space-y-1">
              <p><strong>Name:</strong> {primaryMember.display_name}</p>
              {primaryMember.current_age && (
                <p><strong>Age:</strong> {primaryMember.current_age} years old</p>
              )}
              <p><strong>Status:</strong> {primaryMember.status}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFamilyMembersList = () => {
    if (familyMembers.length <= 1) return null;

    return (
      <div className="space-y-3">
        <h3 className="font-medium text-foreground">Your Family Members</h3>
        {familyMembers.map((member) => (
          <div
            key={member.id}
            className="border border-border rounded-lg p-4 bg-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">{member.display_name}</p>
                <p className="text-sm text-muted-foreground">
                  {member.relationship}
                  {member.current_age && ` • ${member.current_age} years old`}
                </p>
              </div>
              {member.requires_parent_consent && (
                <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
                  Requires Consent
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[--muted] flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6" />
            Set Up Your Family Account
          </CardTitle>
          <CardDescription>
            Your profile has been created. You can add family members now or skip and do it later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          {state?.message && (
            <Alert className="bg-[--success-bg] border-[--success-border]">
              <AlertDescription className="text-[--success-foreground]">
                {state.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert className="bg-destructive/10 border-destructive/20">
              <AlertDescription className="text-destructive">{error}</AlertDescription>
            </Alert>
          )}

          {/* Initial Member Info */}
          {renderInitialMember()}

          {/* Existing Family Members (if any added) */}
          {renderFamilyMembersList()}

          {/* Info Box */}
          <div className="bg-[--info-bg] border border-[--info-border] rounded-lg p-4">
            <h3 className="font-semibold text-[--info-foreground] mb-2">Why Add Family Members?</h3>
            <ul className="text-sm text-[--info-foreground]/90 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-[--info] mt-0.5">•</span>
                <span>Allow your children to access age-appropriate features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[--info] mt-0.5">•</span>
                <span>Manage profiles for your entire family in one account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[--info] mt-0.5">•</span>
                <span>Control parental consent for minors (ages 14-17)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[--info] mt-0.5">•</span>
                <span>Children under 14 cannot access the platform (COPPA compliance)</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleAddFamilyMember}
              variant="default"
              className="flex-1 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Family Members
            </Button>
            <Button
              onClick={handleContinueToDashboard}
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2"
            >
              Skip for Now
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Footer Note */}
          <p className="text-xs text-center text-[--muted-foreground]">
            You can always add or manage family members later from your account settings
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilySetupPage;

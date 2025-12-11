import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { APIService } from '../../services/APIService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { LoadingSpinner } from '../../components/ui/loading-spinner';
import { useAuth } from '../../contexts/AuthContext';
import { getProfiles, switchProfile, grantConsent, revokeConsent } from '../../services/familyMemberService';
import type { UserProfile } from '../../types/accounts';

interface AlumniRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  batch: number;
  centerName: string;
  yearOfBirth: number | null;
  age: number | null;
  coppaStatus: 'blocked' | 'requires_consent' | 'full_access' | 'unknown';
  canCreateProfile: boolean;
  alreadyClaimed: boolean;
}

interface ProfileSelection {
  alumniMemberId: number;
  relationship: 'parent' | 'child';
  yearOfBirth?: number;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshToken, updateTokensAfterProfileSwitch } = useAuth();
  const goToDashboard = () => navigate('/dashboard', { replace: true });
  
  // Alumni records matching user's email
  const [alumni, setAlumni] = useState<AlumniRecord[]>([]);
  const [alumniLoading, setAlumniLoading] = useState(true);
  const [alumniError, setAlumniError] = useState<string | null>(null);
  
  // Selections for profile creation
  const [selections, setSelections] = useState<Map<number, ProfileSelection>>(new Map());
  
  // YOB input state (inline editing)
  const [yobInputs, setYobInputs] = useState<Map<number, string>>(new Map());
  const [yobErrors, setYobErrors] = useState<Map<number, string>>(new Map());
  
  // Existing profiles
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(user?.profileId || null);
  const consentNeedingProfiles = profiles.filter(p => p.requiresConsent && !p.parentConsentGiven);
  
  // Action state
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load alumni records matching user's email on mount
  useEffect(() => {
    if (!user) return;
    loadAlumni();
    loadProfiles();
  }, [user]);

  const loadAlumni = async () => {
    try {
      setAlumniLoading(true);
      setAlumniError(null);
      const result = await APIService.getMyAlumni();
      setAlumni(result.alumni || []);
    } catch (err: any) {
      setAlumniError(err?.message || 'Failed to load alumni records');
    } finally {
      setAlumniLoading(false);
    }
  };

  const loadProfiles = async () => {
    try {
      setProfilesLoading(true);
      const data = await getProfiles();
      setProfiles(data || []);
    } catch (err: any) {
      // Profiles might not exist yet - that's fine
      setProfiles([]);
    } finally {
      setProfilesLoading(false);
    }
  };

  // Toggle alumni selection
  const toggleSelection = (alumniId: number, relationship: 'parent' | 'child') => {
    const newSelections = new Map(selections);
    
    if (newSelections.has(alumniId)) {
      const existing = newSelections.get(alumniId)!;
      if (existing.relationship === relationship) {
        newSelections.delete(alumniId);
      } else {
        newSelections.set(alumniId, { alumniMemberId: alumniId, relationship });
      }
    } else {
      newSelections.set(alumniId, { alumniMemberId: alumniId, relationship });
    }
    
    setSelections(newSelections);
  };

  // Handle YOB input change
  const handleYobChange = (alumniId: number, value: string) => {
    // Only allow digits, max 4 chars
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    
    const newInputs = new Map(yobInputs);
    newInputs.set(alumniId, cleaned);
    setYobInputs(newInputs);
    
    // Validate
    const newErrors = new Map(yobErrors);
    if (cleaned.length === 4) {
      const year = parseInt(cleaned);
      const currentYear = new Date().getFullYear();
      if (year < 1920 || year > currentYear) {
        newErrors.set(alumniId, `Year must be 1920-${currentYear}`);
      } else {
        newErrors.delete(alumniId);
      }
    } else if (cleaned.length > 0) {
      newErrors.set(alumniId, 'Enter 4-digit year');
    } else {
      newErrors.delete(alumniId);
    }
    setYobErrors(newErrors);
  };

  // Save YOB for an alumni record
  const saveYob = async (alumniId: number) => {
    const value = yobInputs.get(alumniId);
    if (!value || value.length !== 4) return;
    
    const year = parseInt(value);
    const currentYear = new Date().getFullYear();
    if (year < 1920 || year > currentYear) return;

    try {
      setActionInProgress(`yob-${alumniId}`);
      await APIService.collectYob(alumniId, year);
      
      // Refresh alumni list to get updated age/coppaStatus
      await loadAlumni();
      
      // Clear input
      const newInputs = new Map(yobInputs);
      newInputs.delete(alumniId);
      setYobInputs(newInputs);
    } catch (err: any) {
      const newErrors = new Map(yobErrors);
      newErrors.set(alumniId, err?.message || 'Failed to save');
      setYobErrors(newErrors);
    } finally {
      setActionInProgress(null);
    }
  };

  // Create profiles for selected alumni
  const createProfiles = async () => {
    if (selections.size === 0) {
      setActionError('Select at least one alumni record');
      return;
    }

    // Validate: all selected alumni must have YOB or be entering it now
    const selectionsArray = Array.from(selections.values());
    for (const sel of selectionsArray) {
      const alum = alumni.find(a => a.id === sel.alumniMemberId);
      if (!alum) continue;
      
      // If no YOB and no input provided
      if (alum.yearOfBirth === null) {
        const yobInput = yobInputs.get(sel.alumniMemberId);
        if (!yobInput || yobInput.length !== 4) {
          setActionError(`Enter year of birth for ${alum.firstName} ${alum.lastName}`);
          return;
        }
        // Include YOB in selection
        sel.yearOfBirth = parseInt(yobInput);
      }
    }

    try {
      setSubmitting(true);
      setActionError(null);

      // First save any pending YOB values
      for (const sel of selectionsArray) {
        if (sel.yearOfBirth) {
          await APIService.collectYob(sel.alumniMemberId, sel.yearOfBirth);
        }
      }

      // Then create profiles
      const result = await APIService.selectProfiles(selectionsArray);
      
      if (result.success) {
        await loadProfiles();
        await loadAlumni();
        setSelections(new Map());
        // Always take the user to the dashboard after profile creation to keep the flow simple
        goToDashboard();
      }
    } catch (err: any) {
      setActionError(err?.message || 'Failed to create profiles');
    } finally {
      setSubmitting(false);
    }
  };

  // Switch active profile
  const handleSwitchProfile = async (profileId: string) => {
    try {
      setActionInProgress(`switch-${profileId}`);
      const result = await switchProfile(profileId);
      
      if (result.token && result.refreshToken) {
        updateTokensAfterProfileSwitch(result.token, result.refreshToken, result.activeProfile);
      } else {
        setActiveProfileId(profileId);
        await refreshToken();
      }
      
      goToDashboard();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to switch profile');
    } finally {
      setActionInProgress(null);
    }
  };

  // Grant consent
  const handleGrantConsent = async (profileId: string) => {
    try {
      setActionInProgress(`consent-${profileId}`);
      await grantConsent(profileId);
      await loadProfiles();
      goToDashboard();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to grant consent');
    } finally {
      setActionInProgress(null);
    }
  };

  // Revoke consent
  const handleRevokeConsent = async (profileId: string) => {
    try {
      setActionInProgress(`revoke-${profileId}`);
      await revokeConsent(profileId);
      await loadProfiles();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to revoke consent');
    } finally {
      setActionInProgress(null);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full_access': return 'bg-green-100 text-green-800';
      case 'requires_consent': return 'bg-yellow-100 text-yellow-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter unclaimed alumni
  const unclaimedAlumni = alumni.filter(a => !a.alreadyClaimed);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>Please log in to manage your profiles.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Quick start */}
        <Card className="bg-gradient-to-r from-primary/10 via-background to-background border-primary/30">
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between py-6">
            <div>
              <p className="text-sm text-muted-foreground">Signed in as</p>
              <h1 className="text-xl font-semibold text-foreground">{user.email}</h1>
              <p className="text-sm text-muted-foreground mt-1">Pick a profile and jump straight to the dashboard.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={goToDashboard}
                disabled={!user?.profileId}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Go to dashboard
              </button>
              <button
                onClick={() => navigate('/family/manage')}
                className="px-4 py-2 border border-border rounded hover:bg-muted"
              >
                Parent consent center
              </button>
            </div>
          </CardContent>
        </Card>

        {actionError && (
          <Alert variant="destructive">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Section: Manage Existing Profiles */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Your profiles</CardTitle>
              <CardDescription>
                Tap a card to switch and continue to your dashboard. Grant consent where required.
              </CardDescription>
              {consentNeedingProfiles.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-3 py-2">
                  <span className="font-medium">{consentNeedingProfiles.length} minor{consentNeedingProfiles.length > 1 ? 's' : ''} need consent.</span>
                  <button
                    onClick={() => navigate('/family/manage')}
                    className="underline text-yellow-800 hover:text-yellow-900"
                  >
                    Open consent center
                  </button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : profiles.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No profiles yet. Claim alumni records to get started.
                </p>
              ) : (
                <div className="space-y-3">
                  {profiles.map(profile => {
                    const isActive = activeProfileId === profile.id;
                    const needsConsent = profile.requiresConsent && !profile.parentConsentGiven;

                    return (
                      <button
                        key={profile.id}
                        onClick={() => handleSwitchProfile(profile.id)}
                        disabled={actionInProgress !== null}
                        className={`w-full text-left border rounded-lg p-4 transition ${isActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/60 hover:bg-muted/60'} disabled:opacity-50`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {profile.displayName || `${profile.firstName} ${profile.lastName}`}
                              </span>
                              {isActive && (
                                <span className="text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                              <span className="capitalize">{profile.relationship === 'parent' ? 'My profile' : 'Child profile'}</span>
                              <span>•</span>
                              <span>{profile.centerName}</span>
                              {profile.yearOfBirth && (
                                <>
                                  <span>•</span>
                                  <span>Born {profile.yearOfBirth}</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                profile.accessLevel === 'full' ? 'bg-green-100 text-green-800' :
                                profile.accessLevel === 'supervised' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {profile.accessLevel}
                              </span>
                              {needsConsent && (
                                <span className="text-xs px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                                  Consent required
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 items-end">
                            <span className="text-xs text-muted-foreground">Tap to switch & go</span>
                            {needsConsent && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleGrantConsent(profile.id);
                                }}
                                disabled={actionInProgress !== null}
                                className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                {actionInProgress === `consent-${profile.id}` ? '...' : 'Grant consent'}
                              </button>
                            )}
                            {profile.requiresConsent && profile.parentConsentGiven && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleRevokeConsent(profile.id);
                                }}
                                disabled={actionInProgress !== null}
                                className="px-3 py-1.5 text-sm border border-border rounded hover:bg-muted disabled:opacity-50"
                              >
                                {actionInProgress === `revoke-${profile.id}` ? '...' : 'Revoke'}
                              </button>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section: Claim Alumni Records */}
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Claim alumni records</CardTitle>
              <CardDescription>
                Match your email to alumni records. Mark it as your profile or your child’s profile.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {alumniLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner size="lg" />
                </div>
              ) : alumniError ? (
                <Alert variant="destructive">
                  <AlertDescription>{alumniError}</AlertDescription>
                </Alert>
              ) : unclaimedAlumni.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {alumni.length === 0 
                    ? 'No alumni records found for your email.' 
                    : 'All alumni records have been claimed.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {unclaimedAlumni.map(alum => {
                    const isSelected = selections.has(alum.id);
                    const selection = selections.get(alum.id);
                    const yobInput = yobInputs.get(alum.id) || '';
                    const yobError = yobErrors.get(alum.id);
                    const needsYob = alum.yearOfBirth === null;
                    const isBlocked = alum.coppaStatus === 'blocked';

                    return (
                      <div
                        key={alum.id}
                        className={`border rounded-lg p-4 ${isSelected ? 'border-primary bg-primary/5' : 'border-border'} ${isBlocked ? 'opacity-60' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{alum.firstName} {alum.lastName}</span>
                              <span className="text-sm text-muted-foreground">Batch {alum.batch}</span>
                              <span className="text-sm text-muted-foreground">• {alum.centerName}</span>
                            </div>
                            
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              {/* Age/YOB display or input */}
                              {needsYob ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    placeholder="YYYY"
                                    value={yobInput}
                                    onChange={(e) => handleYobChange(alum.id, e.target.value)}
                                    className="w-20 px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                                    maxLength={4}
                                  />
                                  {yobInput.length === 4 && !yobError && (
                                    <button
                                      onClick={() => saveYob(alum.id)}
                                      disabled={actionInProgress === `yob-${alum.id}`}
                                      className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                                    >
                                      {actionInProgress === `yob-${alum.id}` ? '...' : 'Save'}
                                    </button>
                                  )}
                                  {yobError && <span className="text-xs text-destructive">{yobError}</span>}
                                </div>
                              ) : (
                                <span className="text-sm">
                                  Born {alum.yearOfBirth} ({alum.age} years old)
                                </span>
                              )}
                              
                              {/* COPPA status badge */}
                              <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(alum.coppaStatus)}`}>
                                {alum.coppaStatus === 'full_access' ? 'Adult' :
                                 alum.coppaStatus === 'requires_consent' ? 'Minor (14-17)' :
                                 alum.coppaStatus === 'blocked' ? 'Under 14' : 'Age unknown'}
                              </span>
                            </div>

                            {isBlocked && (
                              <p className="text-xs text-destructive mt-2">
                                Cannot create profile for users under 14 (COPPA compliance)
                              </p>
                            )}
                          </div>

                          {/* Selection buttons */}
                          {!isBlocked && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => toggleSelection(alum.id, 'parent')}
                                className={`px-3 py-1.5 text-sm rounded border ${
                                  selection?.relationship === 'parent'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:bg-muted'
                                }`}
                              >
                                My profile
                              </button>
                              <button
                                onClick={() => toggleSelection(alum.id, 'child')}
                                className={`px-3 py-1.5 text-sm rounded border ${
                                  selection?.relationship === 'child'
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'border-border hover:bg-muted'
                                }`}
                              >
                                My kid
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Create profiles button */}
                  {selections.size > 0 && (
                    <div className="pt-4 flex justify-end">
                      <button
                        onClick={createProfiles}
                        disabled={submitting}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50"
                      >
                        {submitting ? 'Creating...' : `Create ${selections.size} Profile${selections.size > 1 ? 's' : ''}`}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navigation */}
        <div className="flex justify-center">
          {user?.profileId && (
            <button
              onClick={goToDashboard}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Go to Dashboard →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

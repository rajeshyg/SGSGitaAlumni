import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import Badge from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  ArrowLeft,
  Globe,
  Settings,
  Save,
  RefreshCw,
  X,
  Plus,
  Star,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import APIService from '../services/api';
import NotificationsTab from '../components/preferences/NotificationsTab';
import PrivacyTab from '../components/preferences/PrivacyTab';
import AccountTab from '../components/preferences/AccountTab';

/**
 * PreferencesPage - Matches prototype design exactly
 * 
 * Features:
 * - Tabs layout with sticky header
 * - Database-backed domain selection
 * - Simple Select dropdowns for primary domain
 * - Badge chips for secondary domains and interests
 * - hasChanges tracking with unsaved indicator
 * - Backdrop blur header effect
 */

interface Domain {
  id: string;
  name: string;
  description: string;
  domain_level: 'primary' | 'secondary' | 'area_of_interest';
  parent_domain_id: string | null;
  icon: string | null;
  color_code: string | null;
  display_order: number;
}

interface UserPreferences {
  primary_domain_id: string | null;
  secondary_domain_ids: string[];
  areas_of_interest_ids: string[];
}

const sanitizePreferences = (prefs: UserPreferences, domains: Domain[]): UserPreferences => {
  const domainMap = new Map(domains.map(domain => [domain.id, domain]));
  const primaryId = prefs.primary_domain_id;

  const validSecondary = (prefs.secondary_domain_ids || []).filter((domainId) => {
    const domain = domainMap.get(domainId);
    return domain && domain.domain_level === 'secondary' && domain.parent_domain_id === primaryId;
  });

  const secondarySet = new Set(validSecondary);

  const validAreas = (prefs.areas_of_interest_ids || []).filter((areaId) => {
    const domain = domainMap.get(areaId);
    return domain && domain.domain_level === 'area_of_interest' && domain.parent_domain_id && secondarySet.has(domain.parent_domain_id);
  });

  return {
    primary_domain_id: primaryId || null,
    secondary_domain_ids: validSecondary,
    areas_of_interest_ids: validAreas
  };
};

const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('domains');

  // Refs for tab components
  const notificationsTabRef = React.useRef<{ save: () => Promise<void> }>(null);
  const privacyTabRef = React.useRef<{ save: () => Promise<void> }>(null);

  const [domains, setDomains] = useState<Domain[]>([]);
  const [originalPreferences, setOriginalPreferences] = useState<UserPreferences>({
    primary_domain_id: null,
    secondary_domain_ids: [],
    areas_of_interest_ids: []
  });
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    primary_domain_id: null,
    secondary_domain_ids: [],
    areas_of_interest_ids: []
  });

  // Load domains and user preferences on mount
  useEffect(() => {
    loadDomainsAndPreferences();
  }, [user?.id]);

  // Track changes
  useEffect(() => {
    const changed = 
      preferences.primary_domain_id !== originalPreferences.primary_domain_id ||
      JSON.stringify(preferences.secondary_domain_ids) !== JSON.stringify(originalPreferences.secondary_domain_ids) ||
      JSON.stringify(preferences.areas_of_interest_ids) !== JSON.stringify(originalPreferences.areas_of_interest_ids);
    setHasChanges(changed);
  }, [preferences, originalPreferences]);

  const loadDomainsAndPreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all domains from API (not hierarchy - we need flat list)
      const domainResponse = await APIService.get<{success: boolean; domains: Domain[]}>('/api/domains');
      console.log('🔍 [DIAGNOSTIC] Domains API response:', domainResponse);

      // API returns {success: true, domains: [...], hierarchy: {...}}
      if (domainResponse.success && domainResponse.domains) {
        console.log(`🔍 [DIAGNOSTIC] Loaded ${domainResponse.domains.length} domains`);
        setDomains(domainResponse.domains);
      } else {
        throw new Error('Invalid domains response structure');
      }

      // Fetch user preferences if available
      if (user?.id) {
        console.log(`🔍 [DIAGNOSTIC] Fetching preferences for user ID: ${user.id}`);
        try {
          const prefsResponse = await APIService.get<{success: boolean; preferences: any}>(`/api/preferences/${user.id}`);
          console.log('🔍 [DIAGNOSTIC] Preferences API response:', prefsResponse);

          if (prefsResponse.success && prefsResponse.preferences) {
            const prefs = prefsResponse.preferences;
            console.log('🔍 [DIAGNOSTIC] Raw preferences from API:', {
              primary_domain_id: prefs.primary_domain_id,
              secondary_domain_ids_type: typeof prefs.secondary_domain_ids,
              secondary_domain_ids_value: prefs.secondary_domain_ids,
              areas_of_interest_ids_type: typeof prefs.areas_of_interest_ids,
              areas_of_interest_ids_value: prefs.areas_of_interest_ids
            });

            // Parse JSON arrays if they're strings, otherwise use as-is
            let secondaryIds = [];
            let areaIds = [];

            if (typeof prefs.secondary_domain_ids === 'string') {
              console.log('🔍 [DIAGNOSTIC] Parsing secondary_domain_ids from string');
              secondaryIds = JSON.parse(prefs.secondary_domain_ids);
            } else if (Array.isArray(prefs.secondary_domain_ids)) {
              console.log('🔍 [DIAGNOSTIC] Using secondary_domain_ids as array');
              secondaryIds = prefs.secondary_domain_ids;
            }

            if (typeof prefs.areas_of_interest_ids === 'string') {
              console.log('🔍 [DIAGNOSTIC] Parsing areas_of_interest_ids from string');
              areaIds = JSON.parse(prefs.areas_of_interest_ids);
            } else if (Array.isArray(prefs.areas_of_interest_ids)) {
              console.log('🔍 [DIAGNOSTIC] Using areas_of_interest_ids as array');
              areaIds = prefs.areas_of_interest_ids;
            }

            const rawPrefs: UserPreferences = {
              primary_domain_id: prefs.primary_domain_id || null,
              secondary_domain_ids: secondaryIds,
              areas_of_interest_ids: areaIds
            };

            console.log('🔍 [DIAGNOSTIC] Parsed preferences:', rawPrefs);

            const sanitized = sanitizePreferences(rawPrefs, domainResponse.domains || []);
            console.log('🔍 [DIAGNOSTIC] Sanitized preferences:', sanitized);

            setPreferences(sanitized);
            setOriginalPreferences(sanitized);
            console.log('🔍 [DIAGNOSTIC] Preferences state updated successfully');
          } else {
            console.log('🔍 [DIAGNOSTIC] No preferences in response, using defaults');
          }
        } catch (err) {
          console.log('🔍 [DIAGNOSTIC] Error loading preferences:', err);
          console.log('No existing preferences found, using defaults');
        }
      } else {
        console.log('🔍 [DIAGNOSTIC] No user ID available, skipping preferences fetch');
      }
    } catch (err: any) {
      console.error('Failed to load domains:', err);
      setError(err.message || 'Failed to load domain data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrimaryDomainChange = (domainId: string) => {
    setPreferences(prev => ({
      ...prev,
      primary_domain_id: domainId,
      secondary_domain_ids: [],
      areas_of_interest_ids: []
    }));
    setSuccess(false);
    setError(null);
  };

  const addSecondaryDomain = (domainId: string) => {
    if (!preferences.secondary_domain_ids.includes(domainId) && domainId !== preferences.primary_domain_id) {
      if (preferences.secondary_domain_ids.length >= 3) {
        setError('Maximum 3 secondary domains allowed');
        setTimeout(() => setError(null), 3000);
        return;
      }
      setPreferences(prev => ({
        ...prev,
        secondary_domain_ids: [...prev.secondary_domain_ids, domainId]
      }));
      setSuccess(false);
      setError(null);
    }
  };

  const removeSecondaryDomain = (domainId: string) => {
    const areasToRemove = domains
      .filter(domain => domain.domain_level === 'area_of_interest' && domain.parent_domain_id === domainId)
      .map(domain => domain.id);

    setPreferences(prev => ({
      ...prev,
      secondary_domain_ids: prev.secondary_domain_ids.filter(d => d !== domainId),
      areas_of_interest_ids: prev.areas_of_interest_ids.filter(areaId => !areasToRemove.includes(areaId))
    }));
    setSuccess(false);
    setError(null);
  };

  const addInterest = (interestId: string) => {
    if (!preferences.areas_of_interest_ids.includes(interestId)) {
      setPreferences(prev => ({
        ...prev,
        areas_of_interest_ids: [...prev.areas_of_interest_ids, interestId]
      }));
      setSuccess(false);
      setError(null);
    }
  };

  const removeInterest = (interestId: string) => {
    setPreferences(prev => ({
      ...prev,
      areas_of_interest_ids: prev.areas_of_interest_ids.filter(i => i !== interestId)
    }));
    setSuccess(false);
    setError(null);
  };

  const handleSave = async () => {
    if (activeTab === 'domains' && !preferences.primary_domain_id) {
      setError('Please select a primary domain');
      return;
    }

    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Save based on active tab
      if (activeTab === 'domains') {
        const sanitized = sanitizePreferences(preferences, domains);
        const stateChanged =
          sanitized.primary_domain_id !== preferences.primary_domain_id ||
          JSON.stringify(sanitized.secondary_domain_ids) !== JSON.stringify(preferences.secondary_domain_ids) ||
          JSON.stringify(sanitized.areas_of_interest_ids) !== JSON.stringify(preferences.areas_of_interest_ids);

        if (stateChanged) {
          setPreferences(sanitized);
        }

        await APIService.put(`/api/preferences/${user.id}`, sanitized);
        setOriginalPreferences(sanitized);
      } else if (activeTab === 'notifications') {
        await notificationsTabRef.current?.save();
      } else if (activeTab === 'privacy') {
        await privacyTabRef.current?.save();
      }
      // Account tab is read-only, no save needed

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      setError(err.message || 'Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setPreferences(originalPreferences);
    setSuccess(false);
    setError(null);
  };

  const getPrimaryDomains = (): Domain[] => {
    return domains.filter(d => d.domain_level === 'primary').sort((a, b) => a.display_order - b.display_order);
  };

  const getSecondaryDomainsForPrimary = (primaryId: string): Domain[] => {
    return domains.filter(d => d.domain_level === 'secondary' && d.parent_domain_id === primaryId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getAreasForSecondary = (secondaryId: string): Domain[] => {
    return domains.filter(d => d.domain_level === 'area_of_interest' && d.parent_domain_id === secondaryId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getDomainById = (id: string | null): Domain | undefined => {
    if (!id) return undefined;
    return domains.find(d => d.id === id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading your preferences...</p>
        </div>
      </div>
    );
  }

  const primaryDomains = getPrimaryDomains();
  const secondaryDomains = preferences.primary_domain_id ? getSecondaryDomainsForPrimary(preferences.primary_domain_id) : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Sticky with backdrop blur */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Settings className="h-6 w-6 text-primary" />
                <h1 className="text-xl font-bold">Preferences</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  Unsaved changes
                </div>
              )}
              <Badge variant="secondary">Phase 2 Demo</Badge>
              <Button 
                variant="outline" 
                onClick={handleReset}
                disabled={saving || !hasChanges}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saving || !hasChanges}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-6 animate-in slide-in-from-top duration-300">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="ml-2">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400 animate-in slide-in-from-top duration-300">
              <CheckCircle2 className="h-5 w-5" />
              <AlertDescription className="ml-2 font-medium">
                Preferences saved successfully!
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="domains">Domains</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="privacy">Privacy</TabsTrigger>
              <TabsTrigger value="account">Account</TabsTrigger>
            </TabsList>

            {/* Domains Tab */}
            <TabsContent value="domains" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Primary Domain */}
                  <div>
                    <Label htmlFor="primaryDomain">Primary Domain</Label>
                    <Select 
                      value={preferences.primary_domain_id || ''} 
                      onValueChange={handlePrimaryDomainChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary domain" />
                      </SelectTrigger>
                      <SelectContent>
                        {primaryDomains.map(domain => (
                          <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Secondary Domains */}
                  {preferences.primary_domain_id && (
                    <div>
                      <Label>Secondary Domains</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {preferences.secondary_domain_ids.map(domainId => {
                          const domain = getDomainById(domainId);
                          if (!domain) return null;
                          return (
                            <Badge key={domainId} variant="secondary" className="flex items-center gap-1">
                              {domain.name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeSecondaryDomain(domainId)}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                      <Select 
                        onValueChange={addSecondaryDomain}
                        disabled={preferences.secondary_domain_ids.length >= 3}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add secondary domain" />
                        </SelectTrigger>
                        <SelectContent>
                          {secondaryDomains
                            .filter(domain => 
                              domain.id !== preferences.primary_domain_id && 
                              !preferences.secondary_domain_ids.includes(domain.id)
                            )
                            .map(domain => (
                              <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      {preferences.secondary_domain_ids.length >= 3 && (
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                          Maximum 3 secondary domains reached
                        </p>
                      )}
                    </div>
                  )}

                  {/* Areas of Interest */}
                  {preferences.secondary_domain_ids.length > 0 && (
                    <div>
                      <Label>Areas of Interest</Label>
                      <p className="text-sm text-muted-foreground mb-3">
                        Select specific areas within your domains that interest you
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {preferences.areas_of_interest_ids.map(interestId => {
                          const interest = getDomainById(interestId);
                          if (!interest) return null;
                          return (
                            <Badge key={interestId} variant="default" className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {interest.name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => removeInterest(interestId)}
                              />
                            </Badge>
                          );
                        })}
                      </div>

                      {/* Available interests grouped by secondary domain */}
                      <div className="space-y-4">
                        {preferences.secondary_domain_ids.map(secondaryId => {
                          const secondaryDomain = getDomainById(secondaryId);
                          const availableInterests = getAreasForSecondary(secondaryId)
                            .filter(interest => !preferences.areas_of_interest_ids.includes(interest.id));
                          
                          if (availableInterests.length === 0 || !secondaryDomain) return null;

                          return (
                            <div key={secondaryId}>
                              <h4 className="font-medium text-sm mb-2">{secondaryDomain.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                {availableInterests.map(interest => (
                                  <Button
                                    key={interest.id}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addInterest(interest.id)}
                                    className="h-8"
                                  >
                                    <Plus className="h-3 w-3 mr-1" />
                                    {interest.name}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <NotificationsTab
                ref={notificationsTabRef}
                userId={user?.id || ''}
                onPreferencesChange={(hasChanges) => setHasChanges(hasChanges)}
              />
            </TabsContent>

            {/* Privacy Tab */}
            <TabsContent value="privacy" className="space-y-6">
              <PrivacyTab
                ref={privacyTabRef}
                userId={user?.id || ''}
                onSettingsChange={(hasChanges) => setHasChanges(hasChanges)}
              />
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account" className="space-y-6">
              <AccountTab userId={user?.id || ''} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;

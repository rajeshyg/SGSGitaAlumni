import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { AlertCircle, CheckCircle2, Loader2, Info, ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import APIService from '../services/api';

/**
 * Enhanced PreferencesPage - User domain preferences configuration
 * 
 * Based on Task 7.7: Domain Taxonomy & Preferences System
 * Features:
 * - Fetch real domain data from database
 * - Primary Domain (single selection with visual cards)
 * - Secondary Domains (up to 3 with enhanced UI)
 * - Areas of Interest (hierarchical display with sub-domains)
 * - Professional, modern UI matching prototype standards
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

interface DomainHierarchy {
  [primaryId: string]: {
    domain: Domain;
    children: {
      [secondaryId: string]: {
        domain: Domain;
        children: Domain[];
      };
    };
  };
}

interface UserPreferences {
  primaryDomain: string | null;
  secondaryDomains: string[];
  areasOfInterest: string[];
}

const PreferencesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [domains, setDomains] = useState<Domain[]>([]);
  const [hierarchy, setHierarchy] = useState<DomainHierarchy>({});
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    primaryDomain: null,
    secondaryDomains: [],
    areasOfInterest: []
  });

  // Load domains and user preferences on mount
  useEffect(() => {
    loadDomainsAndPreferences();
  }, [user?.id]);

  const loadDomainsAndPreferences = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch domain hierarchy from API
      const domainResponse = await APIService.get<{domains: Domain[], hierarchy: DomainHierarchy}>('/domains/hierarchy');
      setDomains(domainResponse.domains);
      setHierarchy(domainResponse.hierarchy);
      
      // Fetch user preferences if available
      if (user?.id) {
        try {
          const prefsResponse = await APIService.get<UserPreferences>(`/preferences/${user.id}`);
          setPreferences(prefsResponse);
          
          // Auto-expand primary domain section if selected
          if (prefsResponse.primaryDomain) {
            setExpandedSections(new Set([prefsResponse.primaryDomain]));
          }
        } catch (err) {
          // Preferences may not exist yet, that's ok
          console.log('No existing preferences found');
        }
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
      primaryDomain: domainId,
      // Clear secondary domains and areas if primary changes
      secondaryDomains: prev.primaryDomain === domainId ? prev.secondaryDomains : [],
      areasOfInterest: prev.primaryDomain === domainId ? prev.areasOfInterest : []
    }));
    setExpandedSections(new Set([domainId]));
    setSuccess(false);
    setError(null);
  };

  const handleSecondaryDomainToggle = (domainId: string) => {
    setPreferences(prev => {
      const isSelected = prev.secondaryDomains.includes(domainId);
      
      if (isSelected) {
        return {
          ...prev,
          secondaryDomains: prev.secondaryDomains.filter(id => id !== domainId)
        };
      } else {
        if (prev.secondaryDomains.length >= 3) {
          setError('Maximum 3 secondary domains allowed');
          setTimeout(() => setError(null), 3000);
          return prev;
        }
        return {
          ...prev,
          secondaryDomains: [...prev.secondaryDomains, domainId]
        };
      }
    });
    setSuccess(false);
  };

  const handleAreaOfInterestToggle = (areaId: string) => {
    setPreferences(prev => {
      const isSelected = prev.areasOfInterest.includes(areaId);
      
      if (isSelected) {
        return {
          ...prev,
          areasOfInterest: prev.areasOfInterest.filter(id => id !== areaId)
        };
      } else {
        return {
          ...prev,
          areasOfInterest: [...prev.areasOfInterest, areaId]
        };
      }
    });
    setSuccess(false);
  };

  const toggleSection = (domainId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(domainId)) {
        newSet.delete(domainId);
      } else {
        newSet.add(domainId);
      }
      return newSet;
    });
  };

  const handleSave = async () => {
    if (!preferences.primaryDomain) {
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
      await APIService.put(`/preferences/${user.id}`, preferences);
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
    loadDomainsAndPreferences();
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
  const selectedPrimaryDomain = getDomainById(preferences.primaryDomain);
  const secondaryDomains = preferences.primaryDomain ? getSecondaryDomainsForPrimary(preferences.primaryDomain) : [];

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Preferences
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Configure your domain preferences to personalize your experience. Select your primary expertise area,
            add up to 3 secondary interests, and choose specific areas you'd like to focus on.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top duration-300">
            <AlertCircle className="h-5 w-5" />
            <AlertDescription className="ml-2">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-[--success-bg] border-[--success-border] text-[--success-foreground] animate-in slide-in-from-top duration-300">
            <CheckCircle2 className="h-5 w-5" />
            <AlertDescription className="ml-2 font-medium">
              Preferences saved successfully! Your personalized experience is now active.
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Indicator */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Configuration Progress</p>
                <p className="text-2xl font-bold mt-1">
                  {[preferences.primaryDomain, preferences.secondaryDomains.length > 0, preferences.areasOfInterest.length > 0].filter(Boolean).length}/3 Complete
                </p>
              </div>
              <Info className="h-8 w-8 text-primary/40" />
            </div>
            <div className="w-full bg-secondary rounded-full h-2.5">
              <div 
                className="bg-gradient-to-r from-primary to-purple-600 h-2.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${([preferences.primaryDomain, preferences.secondaryDomains.length > 0, preferences.areasOfInterest.length > 0].filter(Boolean).length / 3) * 100}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Primary Domain Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-2 h-8 bg-primary rounded-full" />
              <div>
                <CardTitle className="text-2xl">Primary Domain</CardTitle>
                <CardDescription className="text-base mt-1">
                  Select your main area of expertise or professional interest
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {primaryDomains.map((domain) => {
                const isSelected = preferences.primaryDomain === domain.id;
                return (
                  <button
                    key={domain.id}
                    onClick={() => handlePrimaryDomainChange(domain.id)}
                    className={`
                      relative p-6 rounded-lg border-2 text-left transition-all duration-200
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-lg scale-105' 
                        : 'border-border hover:border-primary/50 hover:shadow-md'
                      }
                    `}
                    aria-label={`Select ${domain.name} as primary domain`}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div 
                        className={`
                          w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                          ${isSelected ? 'bg-primary/20' : 'bg-secondary'}
                        `}
                        style={{ color: domain.color_code || undefined }}
                      >
                        {domain.icon || '📁'}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">{domain.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {domain.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Secondary Domains & Areas of Interest */}
        {preferences.primaryDomain && (
          <>
            {/* Secondary Domains */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-8 bg-[--accent] rounded-full" />
                  <div>
                    <CardTitle className="text-2xl">Secondary Domains</CardTitle>
                    <CardDescription className="text-base mt-1">
                      Choose up to 3 additional areas within {selectedPrimaryDomain?.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">
                    {preferences.secondaryDomains.length}/3 domains selected
                  </p>
                  {preferences.secondaryDomains.length >= 3 && (
                    <span className="text-xs text-[--warning] font-medium">
                      Maximum reached
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {secondaryDomains.map((domain) => {
                    const isSelected = preferences.secondaryDomains.includes(domain.id);
                    const isDisabled = !isSelected && preferences.secondaryDomains.length >= 3;
                    return (
                      <label
                        key={domain.id}
                        className={`
                          flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all
                          ${isSelected 
                            ? 'border-purple-600 bg-purple-500/10' 
                            : isDisabled
                              ? 'border-border bg-secondary/50 opacity-60 cursor-not-allowed'
                              : 'border-border hover:border-purple-600/50 hover:bg-secondary'
                          }
                        `}
                      >
                        <Checkbox
                          id={`secondary-${domain.id}`}
                          checked={isSelected}
                          onCheckedChange={() => handleSecondaryDomainToggle(domain.id)}
                          disabled={isDisabled}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold mb-1">{domain.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {domain.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Areas of Interest */}
            {preferences.secondaryDomains.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-[--primary] rounded-full" />
                    <div>
                      <CardTitle className="text-2xl">Areas of Interest</CardTitle>
                      <CardDescription className="text-base mt-1">
                        Select specific focus areas within your secondary domains
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {preferences.secondaryDomains.map(secondaryId => {
                    const secondaryDomain = getDomainById(secondaryId);
                    const areas = getAreasForSecondary(secondaryId);
                    const isExpanded = expandedSections.has(secondaryId);

                    if (!secondaryDomain) return null;

                    return (
                      <div key={secondaryId} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleSection(secondaryId)}
                          className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            )}
                            <h4 className="font-semibold text-lg">{secondaryDomain.name}</h4>
                            <span className="text-sm text-muted-foreground">
                              ({areas.filter(a => preferences.areasOfInterest.includes(a.id)).length}/{areas.length})
                            </span>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {areas.map(area => {
                              const isSelected = preferences.areasOfInterest.includes(area.id);
                              return (
                                <label
                                  key={area.id}
                                  className={`
                                    flex items-center gap-2 p-3 rounded border cursor-pointer transition-all
                                    ${isSelected 
                                      ? 'border-blue-600 bg-blue-500/10' 
                                      : 'border-border hover:border-blue-600/50 hover:bg-secondary'
                                    }
                                  `}
                                >
                                  <Checkbox
                                    id={`area-${area.id}`}
                                    checked={isSelected}
                                    onCheckedChange={() => handleAreaOfInterestToggle(area.id)}
                                  />
                                  <span className="text-sm flex-1">{area.name}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Save Button */}
        <div className="flex items-center justify-between gap-4 sticky bottom-4 bg-background/80 backdrop-blur-sm p-4 rounded-lg border shadow-lg">
          <Button 
            variant="outline" 
            onClick={handleReset} 
            disabled={saving}
            className="min-w-[120px]"
          >
            Reset
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving || !preferences.primaryDomain}
            className="min-w-[200px] bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
            size="lg"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Save Preferences
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;

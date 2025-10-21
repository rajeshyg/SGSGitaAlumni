import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Alert, AlertDescription } from '../components/ui/alert';
import Badge from '../components/ui/badge';
import { StepIndicator } from '../components/postings/StepIndicator';
import { SelectionCard } from '../components/postings/SelectionCard';
import { PostingPreview } from '../components/postings/PostingPreview';
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Loader2,
  AlertCircle,
  X,
  Briefcase,
  Users,
  Clock,
  Mail,
  Phone,
  Star,
  MessageCircle
} from 'lucide-react';
import APIService from '../services/api';

/**
 * CreatePostingPage - 4-step wizard for creating postings
 *
 * Matches prototype design from SGSDataMgmtCore
 *
 * Features:
 * - 4-step wizard with progress indicator
 * - Visual card selections for type and urgency
 * - Step-by-step validation
 * - Posting preview before submission
 * - Mobile-responsive design (44px buttons)
 * - Save draft functionality
 */

interface Domain {
  id: string;
  name: string;
  domain_level: 'primary' | 'secondary' | 'area_of_interest';
  parent_domain_id?: string | null;
  display_order: number;
}

interface Tag {
  id: string;
  name: string;
  tag_type: string;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

const CreatePostingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Loading states
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    posting_type: 'offer_support' as 'offer_support' | 'seek_support',
    category_id: '',
    title: '',

    // Step 2: Details & Domain (3-level hierarchy)
    content: '',
    primary_domain_id: '' as string,
    secondary_domain_ids: [] as string[],
    areas_of_interest_ids: [] as string[],
    tag_ids: [] as string[],

    // Step 3: Logistics & Timing
    urgency_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: '',
    location_type: 'remote' as 'remote' | 'in-person' | 'hybrid',
    duration: '',
    expiry_date: '',
    max_connections: 10,

    // Step 4: Contact Information
    contact_name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
    contact_email: user?.email || '',
    contact_phone: '',
    contact_country: 'USA',
    preferred_contact_method: 'email' as 'email' | 'phone' | 'chat'
  });

  // Step validation errors
  const [stepErrors, setStepErrors] = useState<Record<number, string[]>>({});

  // Reference data
  const [domains, setDomains] = useState<Domain[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // User preferences for smart domain suggestions
  const [userPreferences, setUserPreferences] = useState<{
    primary_domain_id: string | null;
    secondary_domain_ids: string[];
    areas_of_interest_ids: string[];
  } | null>(null);

  // Load reference data and user preferences on mount
  useEffect(() => {
    loadReferenceData();
    loadUserPreferences();
  }, [user?.id]);

  const loadReferenceData = async () => {
    setLoading(true);
    try {
      const [domainsRes, tagsRes, categoriesRes] = await Promise.all([
        APIService.get<{success: boolean; domains: Domain[]}>('/api/domains'),
        APIService.get<{success: boolean; tags: Tag[]}>('/api/tags'),
        APIService.get<{success: boolean; categories: Category[]}>('/api/postings/categories')
      ]);

      // API returns {success: true, domains: [...]} format
      setDomains(domainsRes.domains || []);
      setTags(tagsRes.tags || []);
      setCategories(categoriesRes.categories || []);
    } catch {
      setError('Failed to load form data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    if (!user?.id) return;

    try {
      const response = await APIService.get<{success: boolean; preferences: any}>(`/api/preferences/${user.id}`);

      if (response.success && response.preferences) {
        const prefs = response.preferences;

        // Parse JSON fields if they're strings
        const parsedPrefs = {
          primary_domain_id: prefs.primary_domain_id || null,
          secondary_domain_ids: typeof prefs.secondary_domain_ids === 'string'
            ? JSON.parse(prefs.secondary_domain_ids)
            : (prefs.secondary_domain_ids || []),
          areas_of_interest_ids: typeof prefs.areas_of_interest_ids === 'string'
            ? JSON.parse(prefs.areas_of_interest_ids)
            : (prefs.areas_of_interest_ids || [])
        };

        setUserPreferences(parsedPrefs);

        // Pre-populate domain selections based on user preferences
        // Only pre-populate if user hasn't already selected domains
        if (!formData.primary_domain_id && parsedPrefs.primary_domain_id) {
          updateFormData('primary_domain_id', parsedPrefs.primary_domain_id);
        }
        if (formData.secondary_domain_ids.length === 0 && parsedPrefs.secondary_domain_ids.length > 0) {
          updateFormData('secondary_domain_ids', parsedPrefs.secondary_domain_ids.slice(0, 3));
        }
        if (formData.areas_of_interest_ids.length === 0 && parsedPrefs.areas_of_interest_ids.length > 0) {
          updateFormData('areas_of_interest_ids', parsedPrefs.areas_of_interest_ids);
        }
      }
    } catch (err) {
      // Silently fail - preferences are optional
      console.log('No user preferences found or failed to load');
    }
  };

  // Update form field
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear errors for current step when user makes changes
    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    setError(null);
  };

  // Domain management - 3-level hierarchy
  const addSecondaryDomain = (domainId: string) => {
    if (!formData.secondary_domain_ids.includes(domainId) && formData.secondary_domain_ids.length < 3) {
      updateFormData('secondary_domain_ids', [...formData.secondary_domain_ids, domainId]);
    }
  };

  const removeSecondaryDomain = (domainId: string) => {
    updateFormData('secondary_domain_ids', formData.secondary_domain_ids.filter(id => id !== domainId));
    // Also remove any areas of interest that belong to this secondary domain
    const areasToRemove = domains
      .filter(d => d.domain_level === 'area_of_interest' && d.parent_domain_id === domainId)
      .map(d => d.id);
    if (areasToRemove.length > 0) {
      updateFormData('areas_of_interest_ids', formData.areas_of_interest_ids.filter(id => !areasToRemove.includes(id)));
    }
  };

  const addAreaOfInterest = (areaId: string) => {
    if (!formData.areas_of_interest_ids.includes(areaId)) {
      updateFormData('areas_of_interest_ids', [...formData.areas_of_interest_ids, areaId]);
    }
  };

  const removeAreaOfInterest = (areaId: string) => {
    updateFormData('areas_of_interest_ids', formData.areas_of_interest_ids.filter(id => id !== areaId));
  };

  const addTag = (tagId: string) => {
    if (!formData.tag_ids.includes(tagId)) {
      updateFormData('tag_ids', [...formData.tag_ids, tagId]);
    }
  };

  const removeTag = (tagId: string) => {
    updateFormData('tag_ids', formData.tag_ids.filter(id => id !== tagId));
  };

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Step validation
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 1: // Basic Information
        if (!formData.posting_type) {
          errors.push('Please select whether you are offering or seeking support');
        }
        if (!formData.category_id) {
          errors.push('Please select a category that best describes your posting');
        }
        if (!formData.title.trim()) {
          errors.push('Title is required - create a clear, descriptive title');
        } else if (formData.title.length < 10) {
          errors.push(`Title is too short - add ${10 - formData.title.length} more characters (minimum 10)`);
        } else if (formData.title.length > 200) {
          errors.push(`Title is too long - remove ${formData.title.length - 200} characters (maximum 200)`);
        }
        break;

      case 2: // Details & Domain
        if (!formData.content.trim()) {
          errors.push('Description is required - provide details about your posting');
        } else if (formData.content.length < 50) {
          errors.push(`Description is too short - add ${50 - formData.content.length} more characters (minimum 50)`);
        } else if (formData.content.length > 2000) {
          errors.push(`Description is too long - remove ${formData.content.length - 2000} characters (maximum 2000)`);
        }
        if (!formData.primary_domain_id) {
          errors.push('Please select a primary domain to categorize your posting');
        }
        if (formData.secondary_domain_ids.length === 0) {
          errors.push('Please select at least one secondary domain to help others find your posting');
        }
        break;

      case 3: // Logistics & Timing
        if (!formData.location.trim()) {
          errors.push('Location is required (e.g., "Remote", "New York, NY", or "Hybrid")');
        }
        if (!formData.duration.trim()) {
          errors.push('Duration is required (e.g., "3 months", "1 week", or "Ongoing")');
        }
        if (!formData.expiry_date) {
          errors.push('Expiry date is required');
        } else {
          const expiryDate = new Date(formData.expiry_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const maxDate = new Date(today);
          maxDate.setDate(maxDate.getDate() + 90);

          if (expiryDate < today) {
            errors.push('Expiry date must be in the future');
          } else if (expiryDate > maxDate) {
            errors.push('Expiry date cannot be more than 90 days from today');
          }
        }
        if (formData.max_connections < 1 || formData.max_connections > 50) {
          errors.push('Max connections must be between 1 and 50');
        }
        break;

      case 4: // Contact Information
        if (!formData.contact_name.trim()) {
          errors.push('Contact name is required - enter your full name');
        }
        if (!formData.contact_email.trim()) {
          errors.push('Contact email is required - this is how people will reach you');
        } else if (!isValidEmail(formData.contact_email)) {
          errors.push('Please enter a valid email address (e.g., name@example.com)');
        }
        if (formData.contact_phone && !/^[\d\s\-\+\(\)]+$/.test(formData.contact_phone)) {
          errors.push('Please enter a valid phone number (digits, spaces, and +()-. only)');
        }
        // Validate preferred contact method matches provided info
        if (formData.preferred_contact_method === 'phone' && !formData.contact_phone.trim()) {
          errors.push('Phone number is required when phone is the preferred contact method');
        }
        break;
    }

    return errors;
  };

  // Navigate to next step
  const handleNext = () => {
    const errors = validateStep(currentStep);

    if (errors.length > 0) {
      setStepErrors(prev => ({ ...prev, [currentStep]: errors }));
      setError('Please fix the errors before proceeding');
      return;
    }

    setStepErrors(prev => ({ ...prev, [currentStep]: [] }));
    setError(null);
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  // Navigate to previous step
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  // Save as draft
  const handleSaveDraft = async () => {
    try {
      setIsSavingDraft(true);
      setError(null);

      const draftData = {
        ...formData,
        status: 'draft',
        expires_at: formData.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      await APIService.postGeneric('/api/postings', draftData);

      navigate('/postings', {
        state: { message: 'Draft saved successfully!' }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save draft. Please try again.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Submit posting
  const handleSubmit = async () => {
    // Validate all steps
    const allErrors: string[] = [];
    for (let step = 1; step <= totalSteps; step++) {
      const errors = validateStep(step);
      if (errors.length > 0) {
        allErrors.push(...errors);
        setStepErrors(prev => ({ ...prev, [step]: errors }));
      }
    }

    if (allErrors.length > 0) {
      setError('Please fix all errors before submitting');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Transform 3-level domain hierarchy into domain_ids array for API
      const domain_ids = [
        formData.primary_domain_id,
        ...formData.secondary_domain_ids,
        ...formData.areas_of_interest_ids
      ].filter(Boolean);

      const submissionData = {
        ...formData,
        domain_ids, // API expects domain_ids array
        status: 'pending_review',
        expires_at: formData.expiry_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      // Remove the 3-level fields as API doesn't expect them
      delete (submissionData as any).primary_domain_id;
      delete (submissionData as any).secondary_domain_ids;
      delete (submissionData as any).areas_of_interest_ids;

      await APIService.postGeneric('/api/postings', submissionData);

      navigate('/postings', {
        state: { message: 'Posting submitted for review successfully!' }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create posting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for domain hierarchy (matching PreferencesPage)
  const getDomainById = (id: string) => domains.find(d => d.id === id);
  const getTagById = (id: string) => tags.find(t => t.id === id);

  const getPrimaryDomains = (): Domain[] => {
    return domains.filter(d => d.domain_level === 'primary').sort((a, b) => a.display_order - b.display_order);
  };

  const getSecondaryDomainsForPrimary = (primaryId: string): Domain[] => {
    return domains.filter(d => d.domain_level === 'secondary' && d.parent_domain_id === primaryId)
      .sort((a, b) => a.display_order - b.display_order);
  };

  const getAreasForSecondaries = (secondaryIds: string[]): Domain[] => {
    return domains.filter(d => d.domain_level === 'area_of_interest' && d.parent_domain_id && secondaryIds.includes(d.parent_domain_id))
      .sort((a, b) => a.display_order - b.display_order);
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
        <CardDescription>
          Choose the type and category of your posting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Type Selection - Visual Cards */}
        <div className="space-y-2">
          <Label>What type of posting is this? *</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectionCard
              icon={<Briefcase className="h-12 w-12" />}
              title="Offer Support"
              description="Share your expertise, resources, or opportunities"
              selected={formData.posting_type === 'offer_support'}
              onClick={() => updateFormData('posting_type', 'offer_support')}
            />
            <SelectionCard
              icon={<Users className="h-12 w-12" />}
              title="Seek Support"
              description="Request help, mentorship, or opportunities"
              selected={formData.posting_type === 'seek_support'}
              onClick={() => updateFormData('posting_type', 'seek_support')}
            />
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select
            value={formData.category_id}
            onValueChange={(value) => updateFormData('category_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="E.g., Looking for mentorship in software engineering"
            value={formData.title}
            onChange={(e) => updateFormData('title', e.target.value)}
            maxLength={200}
          />
          <p className="text-sm text-muted-foreground">
            {formData.title.length}/200 characters (minimum 10)
          </p>
        </div>

        {/* Step Errors */}
        {stepErrors[1] && stepErrors[1].length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {stepErrors[1].map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Step 2: Details & Domain
  const renderStep2 = () => {
    const primaryDomains = getPrimaryDomains();
    const secondaryDomains = formData.primary_domain_id ? getSecondaryDomainsForPrimary(formData.primary_domain_id) : [];
    const areasOfInterest = getAreasForSecondaries(formData.secondary_domain_ids);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Details & Domain</CardTitle>
          <CardDescription>
            Categorize your posting with hierarchical domain selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Domain */}
          <div className="space-y-2">
            <Label htmlFor="primaryDomain">Primary Domain *</Label>
            <p className="text-sm text-muted-foreground">
              Select the main category for your posting
            </p>
            <Select
              value={formData.primary_domain_id || ''}
              onValueChange={(value: string) => {
                updateFormData('primary_domain_id', value);
                // Reset secondary and areas when primary changes
                updateFormData('secondary_domain_ids', []);
                updateFormData('areas_of_interest_ids', []);
              }}
            >
              <SelectTrigger className="min-h-[44px]">
                <SelectValue placeholder="Select primary domain" />
              </SelectTrigger>
              <SelectContent>
                {primaryDomains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary Domains */}
          {formData.primary_domain_id && (
            <div className="space-y-2">
              <Label>Secondary Domains *</Label>
              <p className="text-sm text-muted-foreground">
                Select up to 3 specific areas within {getDomainById(formData.primary_domain_id)?.name}
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.secondary_domain_ids.map(domainId => {
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
                disabled={formData.secondary_domain_ids.length >= 3}
              >
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Add secondary domain" />
                </SelectTrigger>
                <SelectContent>
                  {secondaryDomains
                    .filter(domain => !formData.secondary_domain_ids.includes(domain.id))
                    .map(domain => (
                      <SelectItem key={domain.id} value={domain.id}>{domain.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {formData.secondary_domain_ids.length >= 3 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  Maximum 3 secondary domains reached
                </p>
              )}
            </div>
          )}

          {/* Areas of Interest */}
          {formData.secondary_domain_ids.length > 0 && (
            <div className="space-y-2">
              <Label>Areas of Interest (Optional)</Label>
              <p className="text-sm text-muted-foreground">
                Select specific areas within your secondary domains
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.areas_of_interest_ids.map(interestId => {
                  const interest = getDomainById(interestId);
                  if (!interest) return null;
                  return (
                    <Badge key={interestId} variant="default" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {interest.name}
                      <X
                        className="h-3 w-3 cursor-pointer"
                        onClick={() => removeAreaOfInterest(interestId)}
                      />
                    </Badge>
                  );
                })}
              </div>
              <Select onValueChange={addAreaOfInterest}>
                <SelectTrigger className="min-h-[44px]">
                  <SelectValue placeholder="Add area of interest" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {areasOfInterest
                    .filter(area => !formData.areas_of_interest_ids.includes(area.id))
                    .map(area => (
                      <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}


        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="content">Description *</Label>
          <Textarea
            id="content"
            placeholder="Describe your posting in detail..."
            value={formData.content}
            onChange={(e) => updateFormData('content', e.target.value)}
            rows={8}
            maxLength={2000}
          />
          <p className="text-sm text-muted-foreground">
            {formData.content.length}/2000 characters (minimum 50)
          </p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags (Optional)</Label>
          <p className="text-sm text-muted-foreground">
            Add tags to help people find your posting
          </p>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tag_ids.map(tagId => {
              const tag = getTagById(tagId);
              return tag ? (
                <Badge key={tagId} variant="outline">
                  {tag.name}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer"
                    onClick={() => removeTag(tagId)}
                  />
                </Badge>
              ) : null;
            })}
          </div>
          <Select onValueChange={addTag}>
            <SelectTrigger>
              <SelectValue placeholder="Add tag" />
            </SelectTrigger>
            <SelectContent>
              {tags
                .filter(t => !formData.tag_ids.includes(t.id))
                .map(tag => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {/* Step Errors */}
        {stepErrors[2] && stepErrors[2].length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {stepErrors[2].map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    );
  };

  // Step 3: Logistics & Timing
  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle>Logistics & Timing</CardTitle>
        <CardDescription>
          Specify location, duration, and urgency details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Urgency Level - Color-coded Cards */}
        <div className="space-y-2">
          <Label>Urgency Level</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SelectionCard
              icon={<Clock className="h-8 w-8" />}
              title="Low"
              description="No rush"
              selected={formData.urgency_level === 'low'}
              onClick={() => updateFormData('urgency_level', 'low')}
              variant="urgency-low"
            />
            <SelectionCard
              icon={<Clock className="h-8 w-8" />}
              title="Medium"
              description="Standard"
              selected={formData.urgency_level === 'medium'}
              onClick={() => updateFormData('urgency_level', 'medium')}
              variant="urgency-medium"
            />
            <SelectionCard
              icon={<Clock className="h-8 w-8" />}
              title="High"
              description="Soon"
              selected={formData.urgency_level === 'high'}
              onClick={() => updateFormData('urgency_level', 'high')}
              variant="urgency-high"
            />
            <SelectionCard
              icon={<Clock className="h-8 w-8" />}
              title="Critical"
              description="Urgent"
              selected={formData.urgency_level === 'critical'}
              onClick={() => updateFormData('urgency_level', 'critical')}
              variant="urgency-critical"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="E.g., San Francisco, CA"
              value={formData.location}
              onChange={(e) => updateFormData('location', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location_type">Location Type</Label>
            <Select
              value={formData.location_type}
              onValueChange={(value) => updateFormData('location_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="in-person">In-Person</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Duration & Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration *</Label>
            <Input
              id="duration"
              placeholder="E.g., 3 months, 1 week, Ongoing"
              value={formData.duration}
              onChange={(e) => updateFormData('duration', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiry_date">Expiry Date *</Label>
            <Input
              type="date"
              id="expiry_date"
              value={formData.expiry_date}
              onChange={(e) => updateFormData('expiry_date', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Max Connections */}
        <div className="space-y-2">
          <Label htmlFor="max_connections">Maximum Connections</Label>
          <Select
            value={formData.max_connections.toString()}
            onValueChange={(value) => updateFormData('max_connections', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 person</SelectItem>
              <SelectItem value="5">5 people</SelectItem>
              <SelectItem value="10">10 people</SelectItem>
              <SelectItem value="25">25 people</SelectItem>
              <SelectItem value="50">50 people</SelectItem>
              <SelectItem value="999">Unlimited</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Step Errors */}
        {stepErrors[3] && stepErrors[3].length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {stepErrors[3].map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  // Step 4: Contact & Preview
  const renderStep4 = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            How can interested members reach you?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This information will only be shared with approved connections
            </AlertDescription>
          </Alert>

          {/* Contact Name */}
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name *</Label>
            <Input
              id="contact_name"
              value={formData.contact_name}
              onChange={(e) => updateFormData('contact_name', e.target.value)}
              placeholder="Your full name"
            />
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email *</Label>
            <Input
              type="email"
              id="contact_email"
              value={formData.contact_email}
              onChange={(e) => updateFormData('contact_email', e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Contact Phone (Optional)</Label>
            <Input
              type="tel"
              id="contact_phone"
              placeholder="+1 (555) 123-4567"
              value={formData.contact_phone}
              onChange={(e) => updateFormData('contact_phone', e.target.value)}
            />
          </div>

          {/* Preferred Contact Method */}
          <div className="space-y-2">
            <Label>Preferred Contact Method</Label>
            <p className="text-sm text-muted-foreground">
              How would you like interested members to reach you?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SelectionCard
                icon={<Mail className="h-8 w-8" />}
                title="Email"
                description="Contact via email"
                selected={formData.preferred_contact_method === 'email'}
                onClick={() => updateFormData('preferred_contact_method', 'email')}
              />
              <SelectionCard
                icon={<Phone className="h-8 w-8" />}
                title="Phone"
                description="Contact via phone"
                selected={formData.preferred_contact_method === 'phone'}
                onClick={() => updateFormData('preferred_contact_method', 'phone')}
              />
              <SelectionCard
                icon={<MessageCircle className="h-8 w-8" />}
                title="Chat"
                description="Contact via chat"
                selected={formData.preferred_contact_method === 'chat'}
                onClick={() => updateFormData('preferred_contact_method', 'chat')}
              />
            </div>
          </div>

          {/* Step Errors */}
          {stepErrors[4] && stepErrors[4].length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {stepErrors[4].map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <PostingPreview
        formData={formData}
        categories={categories}
        domains={domains}
        tags={tags}
      />
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/postings')}
                className="min-h-[44px]"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Back to Postings</span>
                <span className="sm:hidden">Back</span>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold">Create New Posting</h1>
            </div>
            <Badge variant="outline">Phase 7</Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Indicator */}
          <StepIndicator
            currentStep={currentStep}
            totalSteps={totalSteps}
            steps={[
              { number: 1, title: 'Basic Info', completed: currentStep > 1 },
              { number: 2, title: 'Details', completed: currentStep > 2 },
              { number: 3, title: 'Logistics', completed: currentStep > 3 },
              { number: 4, title: 'Contact', completed: currentStep > 4 }
            ]}
          />

          {/* Global Error */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={loading || isSubmitting || isSavingDraft}
                  className="min-h-[44px]"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => navigate('/postings')}
                disabled={loading || isSubmitting || isSavingDraft}
                className="min-h-[44px]"
              >
                Cancel
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={loading || isSubmitting || isSavingDraft}
                className="min-h-[44px]"
              >
                {isSavingDraft ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Save Draft</span>
                    <span className="sm:hidden">Draft</span>
                  </>
                )}
              </Button>

              {currentStep < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={loading || isSubmitting || isSavingDraft}
                  className="min-h-[44px]"
                >
                  <span className="hidden sm:inline">Next</span>
                  <span className="sm:hidden">Next</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || isSubmitting || isSavingDraft}
                  className="min-h-[44px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span className="hidden sm:inline">Submit for Review</span>
                      <span className="sm:hidden">Submit</span>
                      <Send className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostingPage;

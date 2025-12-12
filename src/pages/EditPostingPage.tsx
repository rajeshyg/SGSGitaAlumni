/**
 * Edit Posting Page
 *
 * Allows users to edit their draft or pending review postings
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import APIService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  domain_level: 'primary' | 'secondary' | 'area_of_interest';
  parent_domain_id?: string | null;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
  description: string;
}

interface Posting {
  id: string;
  title: string;
  content: string;
  posting_type: string;
  status: string;
  category_id: string;
  location?: string;
  location_type?: string;
  urgency_level?: string;
  duration?: string;
  expires_at?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_country?: string;
  contact_email?: string;
  author_id: string;
  domains?: Array<{
    id: string;
    name: string;
    domain_level?: string;
  }>;
}

const EditPostingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posting, setPosting] = useState<Posting | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allDomains, setAllDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    posting_type: 'offer_support',
    category_id: '',
    urgency_level: 'medium',
    location: '',
    location_type: 'remote',
    duration: '',
    expires_at: '',
    contact_name: '',
    contact_phone: '',
    contact_country: '',
    contact_email: '',
    primary_domain_id: '',
    secondary_domain_ids: [] as string[],
    areas_of_interest_ids: [] as string[]
  });

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Load posting, categories, and domains in parallel
      const [postingResponse, categoriesResponse, domainsResponse] = await Promise.all([
        APIService.get<{posting: Posting}>(`/api/postings/${id}`),
        APIService.get<{ categories: Category[] }>('/api/postings/categories'),
        APIService.get<{ domains: Domain[] }>('/api/domains')
      ]);

      const loadedPosting = postingResponse.posting;

      // Backend will validate permissions when saving
      // Allow frontend to load for authorized users

      setPosting(loadedPosting);
      setCategories(categoriesResponse.categories || []);
      setAllDomains(domainsResponse.domains || []);

      // Parse domains into hierarchy levels
      const primaryDomain = loadedPosting.domains?.find(d => d.domain_level === 'primary');
      const secondaryDomains = loadedPosting.domains?.filter(d => d.domain_level === 'secondary') || [];
      const areasOfInterest = loadedPosting.domains?.filter(d => d.domain_level === 'area_of_interest') || [];

      // Set form data
      setFormData({
        title: loadedPosting.title,
        content: loadedPosting.content,
        posting_type: loadedPosting.posting_type,
        category_id: loadedPosting.category_id,
        urgency_level: loadedPosting.urgency_level || 'medium',
        location: loadedPosting.location || '',
        location_type: loadedPosting.location_type || 'remote',
        duration: loadedPosting.duration || '',
        expires_at: loadedPosting.expires_at ? new Date(loadedPosting.expires_at).toISOString().split('T')[0] : '',
        contact_name: loadedPosting.contact_name || '',
        contact_phone: loadedPosting.contact_phone || '',
        contact_country: loadedPosting.contact_country || '',
        contact_email: loadedPosting.contact_email || '',
        primary_domain_id: primaryDomain?.id || '',
        secondary_domain_ids: secondaryDomains.map(d => d.id),
        areas_of_interest_ids: areasOfInterest.map(d => d.id)
      });
    } catch (err: any) {
      console.error('Failed to load data:', err);
      setError(err.message || 'Failed to load posting');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!posting) return;

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.category_id) {
      setError('Category is required');
      return;
    }
    if (!formData.primary_domain_id) {
      setError('Primary domain is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Combine all domain IDs
      const domain_ids = [
        formData.primary_domain_id,
        ...formData.secondary_domain_ids,
        ...formData.areas_of_interest_ids
      ].filter(Boolean);

      const updateData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id,
        urgency_level: formData.urgency_level,
        location: formData.location || undefined,
        location_type: formData.location_type,
        duration: formData.duration || undefined,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at + 'T00:00:00Z').toISOString()
          : undefined,
        contact_name: formData.contact_name || undefined,
        contact_phone: formData.contact_phone || undefined,
        contact_country: formData.contact_country || undefined,
        contact_email: formData.contact_email || undefined,
        domain_ids
      };

      await APIService.put(`/api/postings/${posting.id}`, updateData);
      navigate(`/postings/${posting.id}`);
    } catch (err: any) {
      console.error('Failed to update posting:', err);
      setError(err.message || 'Failed to update posting');
    } finally {
      setSaving(false);
    }
  };

  const handleDomainToggle = (domainId: string, level: 'secondary' | 'area_of_interest') => {
    setFormData(prev => {
      if (level === 'secondary') {
        const isRemoving = prev.secondary_domain_ids.includes(domainId);
        const updatedSecondaries = isRemoving
          ? prev.secondary_domain_ids.filter(id => id !== domainId)
          : [...prev.secondary_domain_ids, domainId];

        // If removing a secondary, also remove its child areas of interest
        if (isRemoving) {
          const areasToRemove = allDomains
            .filter(d => d.domain_level === 'area_of_interest' && d.parent_domain_id === domainId)
            .map(d => d.id);

          return {
            ...prev,
            secondary_domain_ids: updatedSecondaries,
            areas_of_interest_ids: prev.areas_of_interest_ids.filter(id => !areasToRemove.includes(id))
          };
        }

        return { ...prev, secondary_domain_ids: updatedSecondaries };
      } else {
        // Handle areas of interest toggle
        const updated = prev.areas_of_interest_ids.includes(domainId)
          ? prev.areas_of_interest_ids.filter(id => id !== domainId)
          : [...prev.areas_of_interest_ids, domainId];
        return { ...prev, areas_of_interest_ids: updated };
      }
    });
  };

  const primaryDomains = allDomains.filter(d => d.domain_level === 'primary');
  const secondaryDomains = allDomains.filter(
    d => d.domain_level === 'secondary' && d.parent_domain_id === formData.primary_domain_id
  );
  const areasOfInterest = allDomains.filter(
    d => d.domain_level === 'area_of_interest' &&
    d.parent_domain_id &&
    formData.secondary_domain_ids.includes(d.parent_domain_id)
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading posting...</p>
        </div>
      </div>
    );
  }

  if (error && !posting) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => navigate('/postings/my')}>
              Back to My Postings
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Posting</h1>
        <div className="w-24"></div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Edit Posting Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Type */}
          <div className="space-y-2">
            <Label>Posting Type</Label>
            <Select
              value={formData.posting_type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, posting_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offer_support">Offering Support</SelectItem>
                <SelectItem value="seek_support">Seeking Support</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a clear, concise title"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Description *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Provide detailed information about your posting"
              rows={6}
            />
          </div>

          {/* Primary Domain */}
          <div className="space-y-2">
            <Label>Primary Domain *</Label>
            <Select
              value={formData.primary_domain_id}
              onValueChange={(value) => setFormData(prev => ({
                ...prev,
                primary_domain_id: value,
                secondary_domain_ids: []
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select primary domain" />
              </SelectTrigger>
              <SelectContent>
                {primaryDomains.map(domain => (
                  <SelectItem key={domain.id} value={domain.id}>
                    {domain.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Secondary Domains */}
          {formData.primary_domain_id && secondaryDomains.length > 0 && (
            <div className="space-y-2">
              <Label>Secondary Domains</Label>
              <div className="flex flex-wrap gap-2">
                {secondaryDomains.map(domain => (
                  <Badge
                    key={domain.id}
                    variant={formData.secondary_domain_ids.includes(domain.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleDomainToggle(domain.id, 'secondary')}
                  >
                    {domain.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Areas of Interest */}
          {areasOfInterest.length > 0 && (
            <div className="space-y-2">
              <Label>Areas of Interest</Label>
              <div className="flex flex-wrap gap-2">
                {areasOfInterest.map(domain => (
                  <Badge
                    key={domain.id}
                    variant={formData.areas_of_interest_ids.includes(domain.id) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleDomainToggle(domain.id, 'area_of_interest')}
                  >
                    {domain.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Urgency */}
          <div className="space-y-2">
            <Label>Urgency Level</Label>
            <Select
              value={formData.urgency_level}
              onValueChange={(value) => setFormData(prev => ({ ...prev, urgency_level: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-2">
              <Label>Location Type</Label>
              <Select
                value={formData.location_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, location_type: value }))}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 2 weeks, 3 months"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="font-medium">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_country">Contact Country</Label>
                <Input
                  id="contact_country"
                  value={formData.contact_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_country: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EditPostingPage;

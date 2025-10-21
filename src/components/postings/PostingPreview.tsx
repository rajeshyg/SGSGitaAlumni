/**
 * PostingPreview Component
 * 
 * Displays a preview of the posting before submission in Step 4.
 * Shows all form data in a read-only format similar to how it will appear to other users.
 * 
 * Features:
 * - Complete posting information display
 * - Domain and tag badges
 * - Contact information
 * - Urgency level indicator
 * - Location and timing details
 * - Mobile-responsive layout
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import Badge from '../ui/badge';
import { Separator } from '../ui/separator';
import { Sparkles, MapPin, Clock, Calendar, Users, Mail, Phone, User } from 'lucide-react';

interface Domain {
  id: string;
  name: string;
  domain_level: 'primary' | 'secondary' | 'area_of_interest';
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

interface FormData {
  posting_type: 'offer_support' | 'seek_support';
  category_id: string;
  title: string;
  content: string;
  // Support both old and new domain structures
  domain_ids?: string[];
  primary_domain_id?: string;
  secondary_domain_ids?: string[];
  areas_of_interest_ids?: string[];
  tag_ids: string[];
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  location_type: 'remote' | 'in-person' | 'hybrid';
  duration: string;
  expiry_date: string;
  max_connections: number;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  contact_country: string;
}

export interface PostingPreviewProps {
  formData: FormData;
  categories: Category[];
  domains: Domain[];
  tags: Tag[];
}

export const PostingPreview: React.FC<PostingPreviewProps> = ({
  formData,
  categories,
  domains,
  tags
}) => {
  // Find selected category
  const category = categories.find(c => c.id === formData.category_id);

  // Compute domain_ids from 3-level structure or use existing domain_ids
  const computedDomainIds = formData.domain_ids || [
    formData.primary_domain_id,
    ...(formData.secondary_domain_ids || []),
    ...(formData.areas_of_interest_ids || [])
  ].filter(Boolean) as string[];

  // Find selected domains
  const selectedDomains = domains.filter(d => computedDomainIds.includes(d.id));

  // Find selected tags
  const selectedTags = tags.filter(t => formData.tag_ids.includes(t.id));

  // Urgency badge variant
  const urgencyVariant = {
    'low': 'outline' as const,
    'medium': 'secondary' as const,
    'high': 'default' as const,
    'critical': 'destructive' as const
  }[formData.urgency_level];

  // Format expiry date
  const formatDate = (dateString: string) => {
    if (!dateString) return '(Not set)';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Posting Preview
        </CardTitle>
        <CardDescription>
          Review how your posting will appear to other members
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Type and Category */}
        <div className="flex flex-wrap gap-2">
          <Badge variant={formData.posting_type === 'offer_support' ? 'default' : 'secondary'}>
            {formData.posting_type === 'offer_support' ? 'Offering Support' : 'Seeking Support'}
          </Badge>
          {category && (
            <Badge variant="outline">{category.name}</Badge>
          )}
          <Badge variant={urgencyVariant}>
            {formData.urgency_level.charAt(0).toUpperCase() + formData.urgency_level.slice(1)} Priority
          </Badge>
        </div>

        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {formData.title || '(No title provided)'}
          </h3>
        </div>

        {/* Description */}
        <div>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {formData.content || '(No description provided)'}
          </p>
        </div>

        {/* Domains */}
        {selectedDomains.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Domains:</p>
            <div className="flex flex-wrap gap-1">
              {selectedDomains.map(d => (
                <Badge key={d.id} variant="outline" size="sm">
                  {d.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {selectedTags.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Tags:</p>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map(t => (
                <Badge key={t.id} variant="secondary" size="sm">
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Logistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Location</p>
              <p className="text-muted-foreground">
                {formData.location || '(Not specified)'}
                {formData.location_type && ` • ${formData.location_type}`}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Duration</p>
              <p className="text-muted-foreground">
                {formData.duration || '(Not specified)'}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Expires</p>
              <p className="text-muted-foreground">
                {formatDate(formData.expiry_date)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Max Connections</p>
              <p className="text-muted-foreground">
                {formData.max_connections === 999 ? 'Unlimited' : formData.max_connections}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact Information */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-3">Contact Information:</p>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                {formData.contact_name || '(Not provided)'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground break-all">
                {formData.contact_email || '(Not provided)'}
              </span>
            </div>
            
            {formData.contact_phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">
                  {formData.contact_phone}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};


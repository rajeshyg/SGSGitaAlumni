import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Badge from '../components/ui/badge';
import {
  Search,
  Filter,
  Plus,
  Loader2,
  Briefcase,
  Users,
  MapPin,
  Star,
  Globe
} from 'lucide-react';

/**
 * PostingsPage - Job postings, mentorship opportunities, and events
 * 
 * Based on Task 7.7: Domain Taxonomy & Preferences System
 * Features:
 * - List all postings with filters
 * - Search by domain, category, tags
 * - Create new postings (with domain/tag selection)
 * - View posting details
 */

interface Domain {
  id: string;
  name: string;
  icon?: string;
  color_code?: string;
}

interface Tag {
  id: string;
  name: string;
  tag_type: string;
}

interface Posting {
  id: string;
  title: string;
  content: string; // Changed from description to content
  posting_type: 'offer_support' | 'seek_support';
  category_name?: string;
  domains: Domain[];
  tags: Tag[];
  location?: string;
  location_type?: 'remote' | 'in-person' | 'hybrid';
  urgency_level?: 'low' | 'medium' | 'high' | 'critical';
  author_first_name?: string;
  author_last_name?: string;
  contact_name: string;
  contact_email: string;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'expired' | 'active';
  view_count?: number;
  interest_count?: number;
  published_at?: string;
  created_at: string;
}

// APIService for fetching real data from backend
import APIService from '../services/api';

const PostingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [postings, setPostings] = useState<Posting[]>([]);
  const [filteredPostings, setFilteredPostings] = useState<Posting[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const [matchedCount, setMatchedCount] = useState<number>(0);

  // Load postings on mount and when matched filter changes
  useEffect(() => {
    loadPostings();
  }, [showMatchedOnly]);

  // Apply filters whenever search/filter changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterType, filterDomain, postings]);

  const loadPostings = async () => {
    setLoading(true);

    try {
      let endpoint = '/api/postings';
      let params: any = {
        status: 'active',
        limit: 50
      };

      // Use matched endpoint if user is logged in and wants matched postings
      if (showMatchedOnly && user?.id) {
        endpoint = `/api/postings/matched/${user.id}`;
      }

      // Fetch postings from backend API
      const response = await APIService.get<{postings: Posting[]; pagination: any; matchedDomains?: number}>(endpoint, {
        params
      });

      console.log('Postings API response:', response);

      // API returns {postings: [...], pagination: {...}, matchedDomains?: number}
      setPostings(response.postings || []);
      if (response.matchedDomains !== undefined) {
        setMatchedCount(response.matchedDomains);
      }
    } catch (err) {
      console.error('Failed to load postings:', err);
      setPostings([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = postings;

    // Filter by type (posting_type)
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.posting_type === filterType);
    }

    // Filter by domain
    if (filterDomain !== 'all') {
      filtered = filtered.filter(p => p.domains.some(d => d.name === filterDomain));
    }

    // Search in title, content, and tags
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.name.toLowerCase().includes(query))
      );
    }

    setFilteredPostings(filtered);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Postings</h1>
            <p className="text-muted-foreground">
              Browse jobs, mentorship opportunities, events, and more from the alumni network.
            </p>
          </div>
          <div className="flex gap-2">
            {user && (
              <Button
                variant={showMatchedOnly ? "default" : "outline"}
                onClick={() => setShowMatchedOnly(!showMatchedOnly)}
                className="min-h-[44px]"
              >
                <Star className={`mr-2 h-4 w-4 ${showMatchedOnly ? 'fill-current' : ''}`} />
                {showMatchedOnly ? 'Matched' : 'Show Matched'}
                {showMatchedOnly && matchedCount > 0 && (
                  <Badge variant="secondary" className="ml-2">{matchedCount}</Badge>
                )}
              </Button>
            )}
            <Button onClick={() => navigate('/postings/new')} className="min-h-[44px]">
              <Plus className="mr-2 h-4 w-4" />
              Create Posting
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search postings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full md:w-[180px] h-10 pl-10 pr-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by type"
                >
                  <option value="all">All Types</option>
                  <option value="job">Jobs</option>
                  <option value="mentorship">Mentorship</option>
                  <option value="event">Events</option>
                  <option value="opportunity">Opportunities</option>
                </select>
              </div>

              {/* Domain Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <select
                  value={filterDomain}
                  onChange={(e) => setFilterDomain(e.target.value)}
                  className="w-full md:w-[180px] h-10 pl-10 pr-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  aria-label="Filter by domain"
                >
                  <option value="all">All Domains</option>
                  <option value="Technology">Technology</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Arts & Design">Arts & Design</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {loading ? (
            'Loading...'
          ) : (
            <>
              <span>{filteredPostings.length} posting{filteredPostings.length !== 1 ? 's' : ''} found</span>
              {showMatchedOnly && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-current" />
                  Matched to your preferences
                </Badge>
              )}
            </>
          )}
        </div>

        {/* Postings List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPostings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No postings found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPostings.map((posting) => (
              <Card key={posting.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={posting.posting_type === 'offer_support' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'}>
                          {posting.posting_type === 'offer_support' ? <Briefcase className="h-4 w-4 mr-1" /> : <Users className="h-4 w-4 mr-1" />}
                          <span className="capitalize">{posting.posting_type.replace('_', ' ')}</span>
                        </Badge>
                        {posting.category_name && (
                          <Badge variant="outline" className="text-xs">
                            {posting.category_name}
                          </Badge>
                        )}
                        {posting.location && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 mr-1" />
                            {posting.location}
                          </div>
                        )}
                        {posting.urgency_level && posting.urgency_level !== 'low' && (
                          <Badge variant="destructive" className="text-xs">
                            {posting.urgency_level}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl mb-2">{posting.title}</CardTitle>
                      <CardDescription className="line-clamp-2">{posting.content}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Domains */}
                    {posting.domains && posting.domains.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {posting.domains.map((domain) => (
                          <Badge key={domain.id} variant="outline">
                            {domain.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Tags */}
                    {posting.tags && posting.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {posting.tags.map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground pt-3 border-t">
                      <span>
                        Posted by {posting.author_first_name || posting.contact_name} 
                        {posting.author_last_name && ` ${posting.author_last_name}`}
                      </span>
                      <span>{new Date(posting.published_at || posting.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PostingsPage;

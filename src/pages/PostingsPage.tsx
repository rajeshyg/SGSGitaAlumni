import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Search,
  Filter,
  Plus,
  Loader2,
  Star,
  ArrowLeft
} from 'lucide-react';
import PostingCard from '../components/postings/PostingCard';

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
  comment_count?: number;
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
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [showMatchedOnly, setShowMatchedOnly] = useState(false);
  const [matchedCount, setMatchedCount] = useState<number>(0);
  const [categories, setCategories] = useState<{id: string; name: string}[]>([]);
  const [domains, setDomains] = useState<{id: string; name: string}[]>([]);

  // Load postings on mount and when matched filter changes
  useEffect(() => {
    loadPostings();
  }, [showMatchedOnly]);

  // Load categories on mount
  useEffect(() => {
    loadCategories();
    loadDomains();
  }, []);

  // Apply filters whenever search/filter changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, filterType, filterCategory, filterDomain, postings]);

  const loadPostings = async () => {
    setLoading(true);

    try {
      let endpoint = '/api/postings';
      const params: any = {
        // Don't specify status - let backend default to showing active and approved
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

      // API returns {postings: [...], pagination: {...}, matchedDomains?: number}
      setPostings(response.postings || []);
      if (response.matchedDomains !== undefined) {
        setMatchedCount(response.matchedDomains);
      }
    } catch (err) {
      setPostings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await APIService.get<{categories: {id: string; name: string}[]}>('/api/postings/categories');
      setCategories(response.categories || []);
    } catch (err) {
      setCategories([]);
    }
  };

  const loadDomains = async () => {
    try {
      const response = await APIService.get<{domains: {id: string; name: string}[]}>('/api/domains');
      setDomains(response.domains || []);
    } catch (err) {
      setDomains([]);
    }
  };

  const applyFilters = () => {
    let filtered = postings;

    // Filter by posting type (offer_support or seek_support)
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.posting_type === filterType);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(p => p.category_name === filterCategory);
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

  const handleLike = async (postingId: string) => {
    try {
      const response = await APIService.postGeneric<{
        success: boolean;
        liked: boolean;
        likeCount: number;
      }>(`/api/postings/${postingId}/like`, {});

      if (response.success) {
        // Update the posting in the list
        setPostings(prev =>
          prev.map(posting =>
            posting.id === postingId
              ? { ...posting, interest_count: response.likeCount }
              : posting
          )
        );
      }
    } catch (err) {
      // Error handling - silently fail for like action
    }
  };

  const handleComment = async (postingId: string, commentText: string) => {
    if (!commentText || commentText.trim().length === 0) {
      return;
    }

    try {
      const response = await APIService.postGeneric<{
        success: boolean;
        comment: {
          id: string;
          posting_id: string;
          user_id: string;
          user_name: string;
          comment_text: string;
          created_at: string;
        };
        commentCount: number;
      }>(`/api/postings/${postingId}/comment`, { comment: commentText });

      if (response.success) {
        // Update the posting's comment count in the UI
        setPostings(prev => prev.map(p =>
          p.id === postingId
            ? { ...p, comment_count: response.commentCount }
            : p
        ));
        setFilteredPostings(prev => prev.map(p =>
          p.id === postingId
            ? { ...p, comment_count: response.commentCount }
            : p
        ));
      }
    } catch (err) {
      // Error handling - silently fail for comment action
    }
  };

  const handleShare = async (postingId: string) => {
    // Copy link to clipboard
    const url = `${window.location.origin}/postings/${postingId}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (err) {
      alert('Failed to copy link. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-40 w-full">
        <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="min-h-[44px] shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold truncate">Postings</h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  Browse jobs, mentorship opportunities, events, and more
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
            {user && (
              <Button
                variant={showMatchedOnly ? "default" : "outline"}
                onClick={() => setShowMatchedOnly(!showMatchedOnly)}
                className="min-h-[44px] text-xs sm:text-sm"
                size="sm"
              >
                <Star className={`h-4 w-4 ${showMatchedOnly ? 'fill-current sm:mr-2' : 'sm:mr-2'}`} />
                <span className="hidden sm:inline">{showMatchedOnly ? 'Matched' : 'Show Matched'}</span>
                {showMatchedOnly && matchedCount > 0 && (
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs">{matchedCount}</Badge>
                )}
              </Button>
            )}
              {user && (
                <Button
                  variant="outline"
                  onClick={() => navigate('/postings/my')}
                  className="min-h-[44px] text-xs sm:text-sm"
                  size="sm"
                >
                  <span className="hidden sm:inline">My Postings</span>
                  <span className="sm:hidden">Mine</span>
                </Button>
              )}
              <Button onClick={() => navigate('/postings/new')} className="min-h-[44px] text-xs sm:text-sm" size="sm">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Create</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <div className="space-y-4 sm:space-y-6 w-full">
          {/* Search and Filters */}
          <Card className="w-full">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex flex-col gap-3 sm:gap-4 w-full">
              {/* Search */}
              <div className="w-full relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search postings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full min-h-[44px]"
                />
              </div>

              {/* Filters Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
                {/* Type Filter */}
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Filter by type"
                  >
                    <option value="all">All Types</option>
                    <option value="offer_support">Offering Support</option>
                    <option value="seek_support">Seeking Support</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Filter by category"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Domain Filter */}
                <div className="relative flex-1">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={filterDomain}
                    onChange={(e) => setFilterDomain(e.target.value)}
                    className="w-full h-11 pl-10 pr-3 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    aria-label="Filter by domain"
                  >
                    <option value="all">All Domains</option>
                    {domains.map(domain => (
                      <option key={domain.id} value={domain.name}>{domain.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matched Mode Banner */}
        {showMatchedOnly && !loading && (
          <Card className="w-full bg-primary/5 border-primary/20">
            <CardContent className="py-3 px-4">
              <div className="flex items-center gap-2 text-sm">
                <Star className="h-4 w-4 fill-primary text-primary" />
                <span className="font-medium text-primary">Showing only postings that match your Areas of Interest</span>
                <span className="text-muted-foreground">
                  ({filteredPostings.length} matched out of {postings.length} total)
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {loading ? (
            'Loading...'
          ) : (
            <>
              <span>{filteredPostings.length} posting{filteredPostings.length !== 1 ? 's' : ''} found</span>
              {!showMatchedOnly && user && (
                <span className="text-xs">
                  (Click "Show Matched" to see only postings matching your preferences)
                </span>
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
              <PostingCard
                key={posting.id}
                posting={posting}
                showActions={true}
                onLike={handleLike}
                onComment={handleComment}
                onShare={handleShare}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default PostingsPage;

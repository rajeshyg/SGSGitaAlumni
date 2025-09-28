import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import Badge from '../ui/badge';
import { Search, Users, GraduationCap, Mail, Calendar, Filter } from 'lucide-react';
import { APIService } from '../../services/APIService';
import { apiClient } from '../../lib/api';

interface UserSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  graduationYear: number;
  program: string;
  currentPosition?: string;
  company?: string;
  location?: string;
  profileImageUrl?: string;
  isProfileComplete: boolean;
  ageVerified: boolean;
  parentConsentRequired: boolean;
  createdAt: string;
}

interface AlumniSearchProps {
  onUserSelect: (user: UserSearchResult) => void;
  selectedUsers?: UserSearchResult[];
  multiSelect?: boolean;
}

export function AlumniSearch({ onUserSelect, selectedUsers = [], multiSelect = true }: AlumniSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [program, setProgram] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  // Debounced search function
  const performSearch = useCallback(async (query: string, year: string, prog: string) => {
    if (!query.trim() && !year && !prog) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Build query parameters for the API call
      const params = new URLSearchParams();

      if (query.trim()) {
        params.append('query', query.trim());
      }

      if (year) {
        params.append('graduationYear', year);
      }

      if (prog.trim()) {
        params.append('program', prog.trim());
      }

      params.append('limit', '50'); // Reasonable limit for search results

      // Call the user search API directly
      const response = await apiClient.get(`/api/users/search?${params.toString()}`);
      const { users } = response;

      // Transform results to match our interface
      const transformedResults: UserSearchResult[] = users.map((user: any) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        graduationYear: user.graduationYear,
        program: user.program,
        currentPosition: user.currentPosition,
        company: user.company,
        location: user.location,
        profileImageUrl: user.profileImageUrl,
        isProfileComplete: user.isProfileComplete,
        ageVerified: user.ageVerified,
        parentConsentRequired: user.parentConsentRequired,
        createdAt: user.createdAt
      }));

      setResults(transformedResults);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search users. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search input changes with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      performSearch(value, graduationYear, program);
    }, 300); // 300ms debounce

    setDebounceTimer(timer);
  };

  // Handle filter changes
  const handleFilterChange = (type: 'year' | 'program', value: string) => {
    if (type === 'year') {
      setGraduationYear(value);
      performSearch(searchQuery, value, program);
    } else {
      setProgram(value);
      performSearch(searchQuery, graduationYear, value);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setGraduationYear('');
    setProgram('');
    setResults([]);
  };

  // Check if user is already selected
  const isUserSelected = (userId: string) => {
    return selectedUsers.some(user => user.id === userId);
  };

  // Handle user selection
  const handleUserSelect = (user: UserSearchResult) => {
    if (multiSelect) {
      if (isUserSelected(user.id)) {
        // Remove from selection
        const newSelection = selectedUsers.filter(u => u.id !== user.id);
        onUserSelect(user); // This might need to be adjusted based on how the parent handles deselection
      } else {
        // Add to selection
        onUserSelect(user);
      }
    } else {
      // Single select
      onUserSelect(user);
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Alumni
        </CardTitle>
        <CardDescription>
          Find existing alumni to send profile completion invitations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Graduation Year</label>
            <Input
              type="number"
              placeholder="e.g. 2020"
              value={graduationYear}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              min="1950"
              max={new Date().getFullYear() + 10}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Program</label>
            <Input
              placeholder="e.g. Computer Science"
              value={program}
              onChange={(e) => handleFilterChange('program', e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
              disabled={!searchQuery && !graduationYear && !program}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-2">
          {loading && (
            <div className="text-center py-4 text-muted-foreground">
              Searching...
            </div>
          )}

          {error && (
            <div className="text-center py-4 text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && results.length === 0 && (searchQuery || graduationYear || program) && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No alumni found matching your criteria</p>
              <p className="text-sm">Try adjusting your search terms or filters</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((user) => (
                <Card
                  key={user.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    isUserSelected(user.id) ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleUserSelect(user)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {user.program} {user.graduationYear}
                            </span>
                          </div>
                          {user.currentPosition && (
                            <p className="text-sm text-muted-foreground">
                              {user.currentPosition}
                              {user.company && ` at ${user.company}`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.isProfileComplete && (
                          <Badge variant="secondary">Profile Complete</Badge>
                        )}
                        {isUserSelected(user.id) && (
                          <Badge variant="default">Selected</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="text-center text-sm text-muted-foreground">
              Found {results.length} alumni
              {selectedUsers.length > 0 && ` • ${selectedUsers.length} selected`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
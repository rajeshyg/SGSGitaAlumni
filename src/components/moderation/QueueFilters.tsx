/**
 * Queue Filters Component
 *
 * Enhanced filter controls with better UI from prototype
 * Merged best features while maintaining theme compliance
 *
 * Task: Action 8 - Moderator Review System Enhancement
 * Date: November 5, 2025
 */

import { Search, Filter, ChevronDown } from 'lucide-react';
import type { QueueFiltersType } from '../../types/moderation';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Card, CardContent } from '../ui/card';

interface QueueFiltersProps {
  filters: QueueFiltersType;
  onFilterChange: (filters: Partial<QueueFiltersType>) => void;
}

export function QueueFilters({ filters, onFilterChange }: QueueFiltersProps) {
  const getStatusLabel = () => {
    if (!filters.status) return 'All Items';
    return filters.status === 'PENDING' ? 'Pending Review' : 'Escalated';
  };

  const getSortLabel = () => {
    switch (filters.sortBy) {
      case 'newest':
        return 'Newest First';
      case 'oldest':
        return 'Oldest First';
      case 'urgent':
        return 'Urgent First';
      default:
        return 'Oldest First';
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or description..."
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">{getStatusLabel()}</span>
                  <span className="sm:hidden">Filter</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFilterChange({ status: undefined })}>
                  All Items
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange({ status: 'PENDING' })}>
                  Pending Review
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange({ status: 'ESCALATED' })}>
                  Escalated
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <span className="hidden sm:inline">{getSortLabel()}</span>
                  <span className="sm:hidden">Sort</span>
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onFilterChange({ sortBy: 'oldest' })}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange({ sortBy: 'newest' })}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onFilterChange({ sortBy: 'urgent' })}>
                  Urgent First
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

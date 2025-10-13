/**
 * DirectorySearch Component
 * Search bar with debounced input for alumni directory
 * Follows cross-platform compatibility and touch-optimization standards
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { Search, X } from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

export interface DirectorySearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

/**
 * DirectorySearch - Debounced search input for alumni directory
 * @param value Current search value
 * @param onChange Callback when search value changes
 * @param placeholder Placeholder text
 * @param debounceMs Debounce delay in milliseconds (default: 300ms)
 * @param className Optional additional CSS classes
 */
export const DirectorySearch: React.FC<DirectorySearchProps> = ({
  value,
  onChange,
  placeholder = 'Search by name or email...',
  debounceMs = 300,
  className
}) => {
  const [localValue, setLocalValue] = useState(value);

  // Update local value when external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) {
        onChange(localValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange, debounceMs]);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
  }, [onChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  return (
    <div className={cn('relative w-full', className)}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
        <Search className="h-4 w-4" />
      </div>

      {/* Search Input */}
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="pl-10 pr-10"
        aria-label="Search alumni directory"
      />

      {/* Clear Button */}
      {localValue && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default DirectorySearch;

/**
 * CollegesGallery Page
 *
 * Full-screen browse/filter/search gallery for colleges
 * Client-side filtering and search for instant UX
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/safeClient';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CollegeCard } from '@/components/colleges/CollegeCard';
import type { College, CollegeFilters, SortOption } from '@/lib/types/college';
import { Search, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function CollegesGallery() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<CollegeFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Fetch all colleges (cached for 10 minutes)
  const { data: colleges, isLoading, error } = useQuery({
    queryKey: ['colleges'],
    queryFn: async () => {
      console.log('[CollegesGallery] Fetching colleges from Supabase...');
      const { data, error } = await supabase
        .from('colleges')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      console.log('[CollegesGallery] Supabase response:', { data, error });
      console.log('[CollegesGallery] Number of colleges:', data?.length);

      if (error) {
        console.error('[CollegesGallery] Error fetching colleges:', error);
        throw error;
      }

      console.log('[CollegesGallery] Successfully fetched colleges:', data);
      return data as College[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch user's saved colleges for category badges
  const { data: userColleges } = useQuery({
    queryKey: ['user-college-list', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_college_list')
        .select('college_id, category')
        .eq('user_id', user.id);

      if (error) throw error;
      return data as Array<{ college_id: string; category: string | null }>;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Create a map of college_id -> category for quick lookup
  const categoryMap = useMemo(() => {
    const map = new Map<string, string | null>();
    userColleges?.forEach((item) => {
      map.set(item.college_id, item.category);
    });
    return map;
  }, [userColleges]);

  // Client-side filtering and sorting
  const filteredColleges = useMemo(() => {
    console.log('[CollegesGallery] Filtering colleges. Total colleges:', colleges?.length);
    if (!colleges) {
      console.log('[CollegesGallery] No colleges data available');
      return [];
    }

    let result = colleges;

    // Search filter (name, city, state)
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.city.toLowerCase().includes(search) ||
          c.state.toLowerCase().includes(search)
      );
    }

    // State filter
    if (filters.states && filters.states.length > 0) {
      result = result.filter((c) => filters.states!.includes(c.state));
    }

    // Type filter
    if (filters.types && filters.types.length > 0) {
      result = result.filter((c) => filters.types!.includes(c.type));
    }

    // Setting filter
    if (filters.settings && filters.settings.length > 0) {
      result = result.filter((c) => c.campus_setting && filters.settings!.includes(c.campus_setting));
    }

    // Major filter (check if any popular_majors match)
    if (filters.majors && filters.majors.length > 0) {
      result = result.filter((c) =>
        c.popular_majors.some((major) =>
          filters.majors!.some((filterMajor) => major.toLowerCase().includes(filterMajor.toLowerCase()))
        )
      );
    }

    // Sort
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'acceptance-asc') {
      result.sort((a, b) => (a.acceptance_rate || 100) - (b.acceptance_rate || 100));
    } else if (sortBy === 'tuition-asc') {
      result.sort(
        (a, b) =>
          (a.tuition_out_of_state || 999999) - (b.tuition_out_of_state || 999999)
      );
    }

    console.log('[CollegesGallery] Filtered result count:', result.length);
    console.log('[CollegesGallery] First 3 colleges:', result.slice(0, 3).map(c => c.name));
    return result;
  }, [colleges, searchTerm, filters, sortBy]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilters({});
  };

  const hasActiveFilters =
    searchTerm ||
    (filters.states && filters.states.length > 0) ||
    (filters.types && filters.types.length > 0) ||
    (filters.settings && filters.settings.length > 0) ||
    (filters.majors && filters.majors.length > 0);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-600">Failed to load colleges. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Explore Colleges</h1>
        <p className="text-muted-foreground">
          Browse, filter, and search through top colleges to build your personalized list
        </p>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search colleges by name, city, or state..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name-asc">A-Z</SelectItem>
            <SelectItem value="acceptance-asc">Most Selective</SelectItem>
            <SelectItem value="tuition-asc">Lowest Tuition</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4 mb-4 flex-wrap">
        <Select
          value={filters.types?.[0] || ''}
          onValueChange={(value) =>
            setFilters({ ...filters, types: value ? [value as 'public' | 'private' | 'community'] : [] })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public</SelectItem>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="community">Community</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.settings?.[0] || ''}
          onValueChange={(value) =>
            setFilters({ ...filters, settings: value ? [value as 'urban' | 'suburban' | 'rural'] : [] })
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Setting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urban">Urban</SelectItem>
            <SelectItem value="suburban">Suburban</SelectItem>
            <SelectItem value="rural">Rural</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Active Filters Chips */}
      {hasActiveFilters && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSearchTerm('')}
              />
            </Badge>
          )}
          {filters.types?.map((type) => (
            <Badge key={type} variant="secondary" className="gap-1">
              {type}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, types: [] })}
              />
            </Badge>
          ))}
          {filters.settings?.map((setting) => (
            <Badge key={setting} variant="secondary" className="gap-1">
              {setting}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setFilters({ ...filters, settings: [] })}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading colleges...
          </div>
        ) : (
          <span>
            {filteredColleges.length} {filteredColleges.length === 1 ? 'college' : 'colleges'}{' '}
            found
          </span>
        )}
      </div>

      {/* College Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-48 bg-slate-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : filteredColleges.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No colleges found matching your criteria.
          </p>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredColleges.map((college) => (
            <CollegeCard
              key={college.id}
              college={college}
              category={categoryMap.get(college.id) as any}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * useCollegeData - Cached college data hook
 * 
 * Provides memoized access to college data with React Query caching
 * for instant page loads on navigation
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getCollegeById, 
  COMMON_APP_COLLEGES,
  type CommonAppCollege, 
  type CommonAppSupplemental 
} from '@/data/commonAppColleges';
import { 
  getCollegeColors, 
  type CollegeVisualIdentity 
} from '@/data/collegeColors';
import { getCollegeProfile, type CollegeProfile } from '@/data/commonAppCollegeProfiles';

interface CollegeData {
  college: CommonAppCollege | undefined;
  colors: CollegeVisualIdentity;
  profile: CollegeProfile | undefined;
  currentPrompt: CommonAppSupplemental | undefined;
  totalEssays: number;
}

/**
 * Pre-computed college data cache for instant access
 * This is computed once at module load time
 */
const collegeDataCache = new Map<string, {
  college: CommonAppCollege | undefined;
  colors: CollegeVisualIdentity;
  profile: CollegeProfile | undefined;
}>();

// Pre-populate cache on module load
COMMON_APP_COLLEGES.forEach(college => {
  collegeDataCache.set(college.id, {
    college,
    colors: getCollegeColors(college.id),
    profile: getCollegeProfile(college.id),
  });
});

/**
 * Get cached college data synchronously (no async, no React Query)
 * Use this for immediate access without loading states
 */
export const getCachedCollegeData = (collegeId: string, essayNumber: number = 1): CollegeData => {
  const cached = collegeDataCache.get(collegeId);
  
  if (cached) {
    const currentPrompt = cached.college?.supplementals.find(s => s.number === essayNumber);
    return {
      ...cached,
      currentPrompt,
      totalEssays: cached.college?.supplementals.length || 0,
    };
  }

  // Fallback for unknown colleges
  const college = getCollegeById(collegeId);
  const colors = getCollegeColors(collegeId);
  const profile = getCollegeProfile(collegeId);
  const currentPrompt = college?.supplementals.find(s => s.number === essayNumber);

  return {
    college,
    colors,
    profile,
    currentPrompt,
    totalEssays: college?.supplementals.length || 0,
  };
};

/**
 * Hook for college data with React Query caching
 * staleTime: Infinity means data never goes stale (it's static)
 */
export const useCollegeData = (collegeId: string, essayNumber: number = 1): CollegeData => {
  // Use React Query for caching across route changes
  const { data } = useQuery({
    queryKey: ['college', collegeId],
    queryFn: () => {
      // Return pre-cached data immediately
      return getCachedCollegeData(collegeId, essayNumber);
    },
    staleTime: Infinity, // Never refetch - this is static data
    gcTime: Infinity, // Never garbage collect
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Memoize the final result including essayNumber-specific data
  return useMemo(() => {
    if (data) {
      // Update currentPrompt if essayNumber changes
      const currentPrompt = data.college?.supplementals.find(s => s.number === essayNumber);
      return { ...data, currentPrompt };
    }
    return getCachedCollegeData(collegeId, essayNumber);
  }, [data, collegeId, essayNumber]);
};

/**
 * Prefetch college data for adjacent colleges
 * Call this on hover over college items
 */
export const prefetchCollegeData = (collegeId: string) => {
  if (!collegeDataCache.has(collegeId)) {
    const college = getCollegeById(collegeId);
    const colors = getCollegeColors(collegeId);
    const profile = getCollegeProfile(collegeId);
    collegeDataCache.set(collegeId, { college, colors, profile });
  }
};

/**
 * Get all colleges with their cached data
 */
export const getAllCollegesData = () => {
  return COMMON_APP_COLLEGES.map(college => ({
    id: college.id,
    ...getCachedCollegeData(college.id, 1),
  }));
};

export default useCollegeData;

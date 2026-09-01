import { useQuery } from '@tanstack/react-query';
import { fetchAppCategories, AppCategory } from '@/lib/categories';

/**
 * Custom hook that fetches categories with React Query caching.
 * - Caches data for 10 minutes
 * - Shows stale data while revalidating in background
 * - Reduces Firestore reads and improves perceived performance
 */
export function useCategories() {
  return useQuery<AppCategory[]>({
    queryKey: ['categories'],
    queryFn: fetchAppCategories,
    staleTime: 10 * 60 * 1000, // 10 minutes - data is considered fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - cached data retention (formerly cacheTime)
    refetchOnWindowFocus: false, // Don't refetch when app returns to foreground
    refetchOnMount: false, // Don't refetch if data is still fresh
  });
}

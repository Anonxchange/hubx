import { useQuery } from '@tanstack/react-query';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import { getHomepageVideos } from '@/services/videosService';

export const useOptimizedVideos = (page = 1, limit = 60, category?: string, searchQuery?: string) => {
  // Get user ID for personalization - check multiple sources for faster access
  const userId = localStorage.getItem('user_id') || 
                localStorage.getItem('supabase.auth.token')?.includes('user_id') ? 
                JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user?.id : 
                undefined;

  return useQuery({
    queryKey: ['optimized-videos', page, limit, category, searchQuery, userId],
    queryFn: () => {
      // Use homepage sectioning for default/all categories and no search
      if ((!category || category === 'all' || category === 'featured') && !searchQuery) {
        return getHomepageVideos(page, limit, userId);
      }
      // Use regular optimized service for specific categories or searches
      return getOptimizedVideos(page, limit, category, searchQuery);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - longer caching
    gcTime: 60 * 60 * 1000, // 1 hour cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    // Enable background refetching for fresher data
    refetchInterval: 5 * 60 * 1000, // 5 minutes background refresh
    // Optimize initial load
    placeholderData: (previousData) => previousData,
    // Network mode optimization
    networkMode: 'offlineFirst',
    // Start fetching immediately, don't wait for auth
    enabled: true,
  });
};
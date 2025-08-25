import { useQuery } from '@tanstack/react-query';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import { getHomepageVideos } from '@/services/videosService';

export const useOptimizedVideos = (page = 1, limit = 60, category?: string, searchQuery?: string) => {
  // Get user ID for personalization
  const userId = localStorage.getItem('user_id') || undefined;

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
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (renamed from cacheTime)
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
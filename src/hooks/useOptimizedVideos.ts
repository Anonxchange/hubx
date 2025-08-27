import { useQuery } from '@tanstack/react-query';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import { getHomepageVideos } from '@/services/videosService';

export const useOptimizedVideos = (page = 1, limit = 20, category?: string, searchQuery?: string) => {
  // Get user ID for personalization with expiry check
  const getUserId = () => {
    try {
      const userIdCache = localStorage.getItem('user_id_cache');
      if (userIdCache) {
        const parsed = JSON.parse(userIdCache);
        if (Date.now() - parsed.timestamp < 5 * 60 * 1000) { // 5 minutes
          return parsed.userId;
        }
      }
    } catch (error) {
      console.error('Error reading user ID cache:', error);
    }
    
    const userId = localStorage.getItem('user_id') || 
                  localStorage.getItem('supabase.auth.token')?.includes('user_id') ? 
                  JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user?.id : 
                  undefined;
    
    // Cache the user ID with timestamp
    if (userId) {
      localStorage.setItem('user_id_cache', JSON.stringify({
        userId,
        timestamp: Date.now()
      }));
    }
    
    return userId;
  };
  
  const userId = getUserId();

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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes cache retention
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: true,
    // Reduce background refresh frequency
    refetchInterval: 10 * 60 * 1000, // 10 minutes background refresh
    // Keep previous data while loading new
    placeholderData: (previousData) => previousData,
    // Prioritize speed over offline functionality
    networkMode: 'online',
    enabled: true,
  });
};
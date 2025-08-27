
import { useInfiniteQuery } from '@tanstack/react-query';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import { getHomepageVideos } from '@/services/videosService';

export const useInfiniteVideos = (category?: string, searchQuery?: string) => {
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

  return useInfiniteQuery({
    queryKey: ['infinite-videos', category, searchQuery, userId],
    queryFn: ({ pageParam = 1 }) => {
      const limit = 20; // Smaller batches for faster loading
      
      if ((!category || category === 'all' || category === 'featured') && !searchQuery) {
        return getHomepageVideos(pageParam, limit, userId);
      }
      return getOptimizedVideos(pageParam, limit, category, searchQuery);
    },
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      return lastPage.videos.length === 20 ? currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });
};

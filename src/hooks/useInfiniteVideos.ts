
import { useInfiniteQuery } from '@tanstack/react-query';
import { getOptimizedVideos } from '@/services/optimizedVideosService';
import { getHomepageVideos } from '@/services/videosService';

export const useInfiniteVideos = (category?: string, searchQuery?: string) => {
  const userId = localStorage.getItem('user_id') || 
                localStorage.getItem('supabase.auth.token')?.includes('user_id') ? 
                JSON.parse(localStorage.getItem('supabase.auth.token') || '{}')?.user?.id : 
                undefined;

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

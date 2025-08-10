import { useQuery } from '@tanstack/react-query';
import { getVideos, getVideosByCategory, applyHumanBehaviorShuffle } from '@/services/videosService';
import type { Video } from '@/services/videosService';

export const useOptimizedVideos = (
  page: number = 1,
  limit: number = 60,
  category?: string,
  searchQuery?: string
) => {
  return useQuery({
    queryKey: ['optimized-videos', page, limit, category, searchQuery],
    queryFn: async () => {
      let result;
      if (category) {
        result = await getVideosByCategory(category, page, limit, searchQuery);
      } else {
        result = await getVideos(page, limit, undefined, searchQuery);
      }

      // Apply human behavior shuffle to all video results
      if (result.videos && result.videos.length > 0) {
        const shuffledVideos = applyHumanBehaviorShuffle(result.videos);
        result.videos = shuffledVideos;
      }

      return result;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
};
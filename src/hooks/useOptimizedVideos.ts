import { useQuery } from '@tanstack/react-query';
import { getOptimizedVideos } from '@/services/optimizedVideosService';

export const useOptimizedVideos = (page = 1, limit = 60, category?: string, searchQuery?: string) => {
  return useQuery({
    queryKey: ['optimized-videos', page, limit, category, searchQuery],
    queryFn: () => getOptimizedVideos(page, limit, category, searchQuery),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVideos, getVideosByCategory, getRelatedVideos, Video } from '@/services/videosService';

interface UseOptimizedVideosOptions {
  prefetchNext?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

export const useOptimizedVideos = (
  page = 1, 
  limit = 60, 
  category?: string, 
  searchQuery?: string,
  options: UseOptimizedVideosOptions = {}
) => {
  const {
    prefetchNext = true,
    cacheTime = 10 * 60 * 1000, // 10 minutes
    staleTime = 5 * 60 * 1000   // 5 minutes
  } = options;

  // Adaptive limit based on connection speed
  const [adaptiveLimit, setAdaptiveLimit] = useState(limit);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'medium' | 'fast'>('medium');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const effectiveType = connection?.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          setConnectionSpeed('slow');
          setAdaptiveLimit(Math.min(limit, 20)); // Reduce load on slow connections
          break;
        case '3g':
          setConnectionSpeed('medium');
          setAdaptiveLimit(Math.min(limit, 40));
          break;
        case '4g':
        default:
          setConnectionSpeed('fast');
          setAdaptiveLimit(limit);
          break;
      }
    }
  }, [limit]);

  const query = useQuery({
    queryKey: ['videos', page, adaptiveLimit, category, searchQuery, connectionSpeed],
    queryFn: () => getVideos(page, adaptiveLimit, category, searchQuery),
    staleTime,
    gcTime: cacheTime,
    // Reduce refetch frequency on slow connections
    refetchOnWindowFocus: connectionSpeed === 'fast',
    refetchOnReconnect: true,
  });

  // Prefetch next page for better UX
  const prefetchQuery = useQuery({
    queryKey: ['videos', page + 1, adaptiveLimit, category, searchQuery, connectionSpeed],
    queryFn: () => getVideos(page + 1, adaptiveLimit, category, searchQuery),
    enabled: prefetchNext && !!query.data && connectionSpeed !== 'slow',
    staleTime,
    gcTime: cacheTime,
  });

  // Memoize processed data to prevent unnecessary re-renders
  const processedData = useMemo(() => {
    if (!query.data) return null;

    // Sort videos by relevance/quality metrics
    const sortedVideos = [...query.data.videos].sort((a, b) => {
      // Prioritize videos with thumbnails and good engagement
      const scoreA = (a.thumbnail_url ? 2 : 0) + (a.views * 0.001) + (a.likes * 0.01);
      const scoreB = (b.thumbnail_url ? 2 : 0) + (b.views * 0.001) + (b.likes * 0.01);
      return scoreB - scoreA;
    });

    return {
      ...query.data,
      videos: sortedVideos
    };
  }, [query.data]);

  return {
    ...query,
    data: processedData,
    connectionSpeed,
    adaptiveLimit,
    isPrefetching: prefetchQuery.isFetching,
  };
};

export const useOptimizedVideosByCategory = (
  category: string, 
  page = 1, 
  limit = 60, 
  searchQuery?: string,
  options: UseOptimizedVideosOptions = {}
) => {
  return useOptimizedVideos(page, limit, category, searchQuery, options);
};

export const useOptimizedRelatedVideos = (
  videoId: string, 
  tags: string[], 
  limit = 15,
  options: UseOptimizedVideosOptions = {}
) => {
  const { staleTime = 10 * 60 * 1000 } = options;
  
  return useQuery({
    queryKey: ['videos', 'related', videoId, tags],
    queryFn: () => getRelatedVideos(videoId, tags, limit),
    enabled: !!videoId && tags.length > 0,
    staleTime,
    // Cache related videos longer since they change less frequently
    gcTime: 15 * 60 * 1000,
  });
};

// Hook for monitoring data usage
export const useDataUsageMonitor = () => {
  const [dataUsage, setDataUsage] = useState(0);
  const [sessionUsage, setSessionUsage] = useState(0);

  useEffect(() => {
    // Load saved usage from localStorage
    const saved = localStorage.getItem('video_data_usage');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDataUsage(parsed.total || 0);
        setSessionUsage(parsed.session || 0);
      } catch (e) {
        console.error('Error loading data usage:', e);
      }
    }
  }, []);

  const trackUsage = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    setDataUsage(prev => {
      const newTotal = prev + mb;
      setSessionUsage(prevSession => {
        const newSession = prevSession + mb;
        
        // Save to localStorage
        localStorage.setItem('video_data_usage', JSON.stringify({
          total: newTotal,
          session: newSession,
          lastUpdated: Date.now()
        }));
        
        return newSession;
      });
      return newTotal;
    });
  };

  const resetSessionUsage = () => {
    setSessionUsage(0);
    localStorage.setItem('video_data_usage', JSON.stringify({
      total: dataUsage,
      session: 0,
      lastUpdated: Date.now()
    }));
  };

  return {
    dataUsage,
    sessionUsage,
    trackUsage,
    resetSessionUsage,
  };
};
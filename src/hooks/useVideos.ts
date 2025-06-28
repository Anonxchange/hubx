
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVideos, getVideosByCategory, getRelatedVideos, Video } from '@/services/videosService';

export const useVideos = (page = 1, limit = 20, category?: string) => {
  return useQuery({
    queryKey: ['videos', page, limit, category],
    queryFn: () => getVideos(page, limit, category),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVideosByCategory = (category: string, page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['videos', 'category', category, page, limit],
    queryFn: () => getVideosByCategory(category, page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRelatedVideos = (videoId: string, tags: string[], limit = 5) => {
  return useQuery({
    queryKey: ['videos', 'related', videoId, tags],
    queryFn: () => getRelatedVideos(videoId, tags, limit),
    enabled: !!videoId && tags.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

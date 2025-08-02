
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getVideos, getVideosByCategory, getRelatedVideos, Video } from '@/services/videosService';

export const useVideos = (page = 1, limit = 20, category?: string, searchQuery?: string) => {
  return useQuery({
    queryKey: ['videos', page, limit, category, searchQuery],
    queryFn: () => getVideos(page, limit, category, searchQuery),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useVideosByCategory = (category: string, page = 1, limit = 20, searchQuery?: string) => {
  return useQuery({
    queryKey: ['videos', 'category', category, page, limit, searchQuery],
    queryFn: () => getVideosByCategory(category, page, limit, searchQuery),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRelatedVideos = (videoId: string, tags: string[], limit = 15) => {
  return useQuery({
    queryKey: ['videos', 'related', videoId, tags],
    queryFn: () => getRelatedVideos(videoId, tags, limit),
    enabled: !!videoId && tags.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

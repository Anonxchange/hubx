import { supabase } from '@/integrations/supabase/client';

// Lightweight video interface for lists and grids
export interface LightVideo {
  id: string;
  title: string;
  description?: string;
  thumbnail_url?: string;
  duration: string;
  views: number;
  likes: number;
  tags: string[];
  created_at: string;
  is_premium?: boolean;
}

// Get videos with minimal data for better performance
export const getOptimizedVideos = async (page = 1, limit = 60, category?: string, searchQuery?: string) => {
  let query = supabase
    .from('videos')
    .select('id, title, description, thumbnail_url, duration, views, likes, tags, created_at, is_premium', { count: 'exact' });

  // Apply category-based sorting and filtering
  if (category && category !== 'all') {
    switch (category.toLowerCase()) {
      case 'recommended':
        query = query.eq('is_premium', false).order('views', { ascending: false });
        break;
      case 'trending':
        query = query.eq('is_premium', false).order('views', { ascending: false });
        break;
      case 'most rated':
        query = query.eq('is_premium', false).order('likes', { ascending: false });
        break;
      case 'premium':
        query = query.eq('is_premium', true).order('created_at', { ascending: false });
        break;
      default:
        query = query.eq('is_premium', false).contains('tags', [category]).order('created_at', { ascending: false });
        break;
    }
  } else {
    query = query.eq('is_premium', false).order('created_at', { ascending: false });
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching optimized videos:', error);
    throw error;
  }

  return {
    videos: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit)
  };
};
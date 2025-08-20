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
  uploader_username?: string;
  uploader_type?: string;
  uploader_id?: string;
  uploader_avatar?: string;
  uploader_subscribers?: number;
  uploader_verified?: boolean;
}

// Get videos with minimal data for better performance
export const getOptimizedVideos = async (page = 1, limit = 60, category?: string, searchQuery?: string) => {
  let query = supabase
    .from('videos')
    .select(`
      *,
      profiles:owner_id (
        id,
        username,
        user_type,
        avatar_url
      )
    `, { count: 'exact' });

  // Apply category-based sorting and filtering
  if (category && category !== 'all') {
    switch (category.toLowerCase()) {
      case 'recommended':
        query = query.order('views', { ascending: false });
        break;
      case 'trending':
        query = query.order('views', { ascending: false });
        break;
      case 'most rated':
        query = query.order('likes', { ascending: false });
        break;
      case 'premium':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.contains('tags', [category]).order('created_at', { ascending: false });
        break;
    }
  } else {
    query = query.order('created_at', { ascending: false });
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
    videos: data?.map(video => ({
      ...video,
      tags: Array.isArray(video.tags) ? video.tags : [],
      uploader_username: video.profiles?.username || 'Unknown',
      uploader_type: video.profiles?.user_type || 'user',
      uploader_id: video.profiles?.id,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_subscribers: 0,
      uploader_verified: false
    })) || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit)
  };
};

// --- Fetching specific video data ---

// Function to get a single video by its ID, including owner details
export const getVideoById = async (id: string) => {
  const { data: video, error } = await supabase
    .from('videos')
    .select(`
      *,
      profiles:owner_id (
        id,
        full_name,
        username,
        user_type,
        avatar_url
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching video with id ${id}:`, error);
    throw error;
  }

  return {
    ...video,
    tags: Array.isArray(video.tags) ? video.tags : [],
    uploader_username: video.profiles?.username || 'Unknown',
    uploader_type: video.profiles?.user_type || 'user',
    uploader_id: video.profiles?.id,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_subscribers: 0,
    uploader_verified: false
  };
};

// Function to get videos for a specific category
export const getCategoryVideos = async (category: string, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      thumbnail_url,
      duration,
      views,
      created_at,
      category,
      tags,
      owner_id,
      profiles:owner_id (
        id,
        full_name,
        username,
        user_type,
        avatar_url
      )
    `)
    .eq('category', category)
    
    .order('created_at', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error(`Error fetching videos for category ${category}:`, error);
    throw error;
  }

  return {
    videos: videos?.map(video => ({
      ...video,
      tags: Array.isArray(video.tags) ? video.tags : [],
      uploader_username: video.profiles?.username || 'Unknown',
      uploader_type: video.profiles?.user_type || 'user',
      uploader_id: video.profiles?.id,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_subscribers: 0,
      uploader_verified: false
    })) || [],
    totalCount: videos?.length || 0, // Placeholder, ideally get count from query
  };
};

// Function to get trending videos (based on views in the last 7 days)
export const getTrendingVideos = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      thumbnail_url,
      duration,
      views,
      created_at,
      category,
      tags,
      owner_id,
      profiles:owner_id (
        id,
        full_name,
        username,
        user_type,
        avatar_url
      )
    `)
    
    .gte('created_at', sevenDaysAgo)
    .order('views', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching trending videos:', error);
    throw error;
  }

  return {
    videos: videos?.map(video => ({
      ...video,
      tags: Array.isArray(video.tags) ? video.tags : [],
      uploader_username: video.profiles?.username || 'Unknown',
      uploader_type: video.profiles?.user_type || 'user',
      uploader_id: video.profiles?.id,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_subscribers: 0,
      uploader_verified: false
    })) || [],
    totalCount: videos?.length || 0, // Placeholder
  };
};

// Function to search videos
export const searchVideos = async (searchTerm: string, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      thumbnail_url,
      duration,
      views,
      created_at,
      category,
      tags,
      description,
      owner_id,
      profiles:owner_id (
        id,
        full_name,
        username,
        user_type,
        avatar_url
      )
    `)
    
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    .order('views', { ascending: false })
    .limit(limit)
    .range(offset, offset + limit - 1);

  if (error) {
    console.error(`Error searching videos for term "${searchTerm}":`, error);
    throw error;
  }

  return {
    videos: videos?.map(video => ({
      ...video,
      tags: Array.isArray(video.tags) ? video.tags : [],
      uploader_username: video.profiles?.username || 'Unknown',
      uploader_type: video.profiles?.user_type || 'user',
      uploader_id: video.profiles?.id,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_subscribers: 0,
      uploader_verified: false
    })) || [],
    totalCount: videos?.length || 0, // Placeholder
  };
};
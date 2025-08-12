import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  owner_id: string; // Added owner_id
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration: string;
  views: number;
  likes: number;
  dislikes: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  is_premium?: boolean;
  is_moment?: boolean;
  users?: {
    id: string;
    username: string;
    avatar_url?: string;
  }; // uploader profile info
}

export interface VideoUpload {
  owner_id: string; // Added owner_id required on upload
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration?: string;
  tags: string[];
  is_premium?: boolean;
  is_moment?: boolean;
}

export interface VideoReaction {
  id: string;
  video_id: string;
  user_session: string;
  reaction_type: 'like' | 'dislike';
  created_at: string;
}

// Generate session ID for anonymous users
const getSessionId = () => {
  let sessionId = localStorage.getItem('user_session');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('user_session', sessionId);
  }
  return sessionId;
};

// Get all videos with uploader profile info, pagination, and search
export const getVideos = async (
  page = 1,
  limit = 60,
  category?: string,
  searchQuery?: string,
  isMoment?: boolean
) => {
  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      users:owner_id (id, username, avatar_url)
      `,
      { count: 'exact' }
    );

  if (isMoment !== undefined) {
    query = query.eq('is_moment', isMoment);
  }

  if (category && category !== 'all') {
    switch (category.toLowerCase()) {
      case 'recommended':
        query = query.eq('is_premium', false).eq('is_moment', false).order('views', { ascending: false });
        break;
      case 'trending':
        query = query.eq('is_premium', false).eq('is_moment', false).order('views', { ascending: false });
        break;
      case 'most rated':
        query = query.eq('is_premium', false).eq('is_moment', false).order('likes', { ascending: false });
        break;
      case 'premium':
        query = query.eq('is_premium', true).eq('is_moment', false).order('created_at', { ascending: false });
        break;
      case 'moments':
        query = query.eq('is_moment', true).order('created_at', { ascending: false });
        break;
      default:
        query = query
          .eq('is_premium', false)
          .eq('is_moment', false)
          .contains('tags', [category])
          .order('created_at', { ascending: false });
        break;
    }
  } else if (isMoment === undefined) {
    query = query.eq('is_premium', false).eq('is_moment', false).order('created_at', { ascending: false });
  }

  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching videos:', error);
    throw error;
  }

  return {
    videos: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Get videos by category with uploader profile info
export const getVideosByCategory = async (
  category: string,
  page = 1,
  limit = 60,
  searchQuery?: string
) => {
  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      users:owner_id (id, username, avatar_url)
      `,
      { count: 'exact' }
    );

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

  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching videos by category:', error);
    throw error;
  }

  return {
    videos: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// (Other functions like getVideoById, uploadVideo, updateVideo etc. remain unchanged)
// You can add similar uploader profile joins in other functions if needed.
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
  owner_id: string;
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
  profiles?: {
    id: string;
    username: string;
    avatar_url?: string;
  }; // uploader profile info
}

export interface VideoUpload {
  owner_id: string;
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
const getSessionId = (): string => {
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
      profiles:owner_id (id, username, avatar_url)
      `,
      { count: 'exact' }
    );

  if (isMoment !== undefined) {
    query = query.eq('is_moment', isMoment);
  }

  if (category && category !== 'all') {
    switch (category.toLowerCase()) {
      case 'recommended':
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
      profiles:owner_id (id, username, avatar_url)
      `,
      { count: 'exact' }
    );

  switch (category.toLowerCase()) {
    case 'recommended':
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

// Get related videos based on tags excluding the current video
export const getRelatedVideos = async (videoId: string, tags: string[], limit = 15) => {
  if (!tags || tags.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url)
      `
    )
    .neq('id', videoId)
    .overlaps('tags', tags)
    .order('views', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related videos:', error);
    throw error;
  }

  return data || [];
};

// Get a single video by ID, with uploader info
export const getVideoById = async (videoId: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select(
      `
      *,
      profiles:owner_id (id, username, avatar_url)
      `
    )
    .eq('id', videoId)
    .single();

  if (error) {
    console.error('Error fetching video:', error);
    throw error;
  }

  return data;
};

// Upload a new video
export const uploadVideo = async (videoData: VideoUpload) => {
  const { data, error } = await supabase
    .from('videos')
    .insert([videoData])
    .select()
    .single();

  if (error) {
    console.error('Error uploading video:', error);
    throw error;
  }

  return data;
};

// Update a video
export const updateVideo = async (videoId: string, updates: Partial<VideoUpload>) => {
  const { data, error } = await supabase
    .from('videos')
    .update(updates)
    .eq('id', videoId)
    .select()
    .single();

  if (error) {
    console.error('Error updating video:', error);
    throw error;
  }

  return data;
};

// Delete a video
export const deleteVideo = async (videoId: string) => {
  const { error } = await supabase.from('videos').delete().eq('id', videoId);

  if (error) {
    console.error('Error deleting video:', error);
    throw error;
  }

  return true;
};

// Increment view count
export const incrementViews = async (videoId: string) => {
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('views')
    .eq('id', videoId)
    .single();

  if (fetchError) {
    console.error('Error fetching video for view increment:', fetchError);
    return;
  }

  const { error } = await supabase
    .from('videos')
    .update({ views: (video.views || 0) + 1 })
    .eq('id', videoId);

  if (error) {
    console.error('Error incrementing views:', error);
  }
};

// React to video (like/dislike)
export const reactToVideo = async (videoId: string, reactionType: 'like' | 'dislike') => {
  const sessionId = getSessionId();

  // Check if user already reacted
  const { data: existingReaction } = await supabase
    .from('video_reactions')
    .select('*')
    .eq('video_id', videoId)
    .eq('user_session', sessionId)
    .single();

  if (existingReaction) {
    // Update existing reaction
    const { data, error } = await supabase
      .from('video_reactions')
      .update({ reaction_type: reactionType })
      .eq('id', existingReaction.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating reaction:', error);
      throw error;
    }

    await updateVideoReactionCounts(videoId);
    return data;
  } else {
    // Create new reaction
    const { data, error } = await supabase
      .from('video_reactions')
      .insert([
        {
          video_id: videoId,
          user_session: sessionId,
          reaction_type: reactionType,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating reaction:', error);
      throw error;
    }

    await updateVideoReactionCounts(videoId);
    return data;
  }
};

// Helper function to update video reaction counts
const updateVideoReactionCounts = async (videoId: string) => {
  const { data: reactions } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId);

  if (reactions) {
    const likes = reactions.filter((r) => r.reaction_type === 'like').length;
    const dislikes = reactions.filter((r) => r.reaction_type === 'dislike').length;

    await supabase.from('videos').update({ likes, dislikes }).eq('id', videoId);
  }
};

// Get user's reaction to a video
export const getUserReaction = async (videoId: string) => {
  const sessionId = getSessionId();

  // Get user's reaction
  const { data: userReactionData, error: userError } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId)
    .eq('user_session', sessionId)
    .single();

  if (userError && userError.code !== 'PGRST116') {
    console.error('Error fetching user reaction:', userError);
  }

  // Get video likes and dislikes counts
  const { data: videoData, error: videoError } = await supabase
    .from('videos')
    .select('likes, dislikes')
    .eq('id', videoId)
    .single();

  if (videoError) {
    console.error('Error fetching video data:', videoError);
  }

  return {
    userReaction: userReactionData?.reaction_type || null,
    likes: videoData?.likes || 0,
    dislikes: videoData?.dislikes || 0,
  };
};

// Search videos
export const searchVideos = async (searchTerm: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    .order('views', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching videos:', error);
    throw error;
  }

  return data || [];
};

// Get user's country (used in Header)
export const getUserCountry = async (): Promise<string> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_name || 'Nigeria';
  } catch (error) {
    console.error('Error getting user country:', error);
    return 'Nigeria';
  }
};

// Get hottest videos by country
export const getHottestByCountry = async (country: string, page = 1, limit = 60) => {
  let query = supabase.from('videos').select('*', { count: 'exact' }).eq('is_premium', false);

  if (country && country.toLowerCase() !== 'global') {
    query = query.contains('tags', [country.toLowerCase()]);
  }

  query = query.order('views', { ascending: false });

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching hottest videos by country:', error);
    throw error;
  }

  return {
    videos: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Apply human behavior-like shuffling to video recommendations
export const applyHumanBehaviorShuffle = (videos: Video[]): Video[] => {
  if (!videos || videos.length === 0) return videos;

  const shuffled = [...videos];

  return shuffled.sort((a, b) => {
    const scoreA = a.views * 0.6 + a.likes * 0.3 + Math.random() * 0.1;
    const scoreB = b.views * 0.6 + b.likes * 0.3 + Math.random() * 0.1;

    return scoreB - scoreA;
  });
};
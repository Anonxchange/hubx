
import { supabase } from '@/integrations/supabase/client';

export interface Video {
  id: string;
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
}

export interface VideoUpload {
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  preview_url?: string;
  duration?: string;
  tags: string[];
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

// Get all videos with pagination and search
export const getVideos = async (page = 1, limit = 30, category?: string, searchQuery?: string) => {
  let query = supabase
    .from('videos')
    .select('*');

  // Apply category-based filtering
  if (category && category !== 'all') {
    // Filter by tag
    query = query.contains('tags', [category]).order('created_at', { ascending: false });
  } else {
    // Default ordering by creation date
    query = query.order('created_at', { ascending: false });
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
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
    totalPages: Math.ceil((count || 0) / limit)
  };
};

// Get videos by category
export const getVideosByCategory = async (category: string, page = 1, limit = 30, searchQuery?: string) => {
  return getVideos(page, limit, category, searchQuery);
};

// Get related videos by tags (limited to 15, randomly selected)
export const getRelatedVideos = async (videoId: string, tags: string[], limit = 15) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .neq('id', videoId)
    .overlaps('tags', tags)
    .order('created_at', { ascending: false })
    .limit(50); // Get more to randomly select from

  if (error) {
    console.error('Error fetching related videos:', error);
    throw error;
  }

  // Randomly shuffle and limit to 15
  const shuffled = (data || []).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
};

// Get single video by ID
export const getVideoById = async (id: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching video:', error);
    throw error;
  }

  return data;
};

// Upload new video
export const uploadVideo = async (video: VideoUpload) => {
  const { data, error } = await supabase
    .from('videos')
    .insert([video])
    .select()
    .single();

  if (error) {
    console.error('Error uploading video:', error);
    throw error;
  }

  return data;
};

// Update video
export const updateVideo = async (id: string, updates: Partial<VideoUpload>) => {
  const { data, error } = await supabase
    .from('videos')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating video:', error);
    throw error;
  }

  return data;
};

// Delete video
export const deleteVideo = async (id: string) => {
  const { error } = await supabase
    .from('videos')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

// Increment view count
export const incrementViews = async (id: string) => {
  // First get the current view count
  const { data: video, error: fetchError } = await supabase
    .from('videos')
    .select('views')
    .eq('id', id)
    .single();
    
  if (fetchError) {
    console.error('Error fetching video for view increment:', fetchError);
    return;
  }
  
  // Then increment the view count
  const { error: updateError } = await supabase
    .from('videos')
    .update({ views: (video.views || 0) + 1 })
    .eq('id', id);
    
  if (updateError) {
    console.error('Error incrementing views:', updateError);
  }
};

// Like/Dislike functionality
export const reactToVideo = async (videoId: string, reactionType: 'like' | 'dislike') => {
  const sessionId = getSessionId();
  
  try {
    // First, check if user already reacted
    const { data: existingReaction } = await supabase
      .from('video_reactions')
      .select('*')
      .eq('video_id', videoId)
      .eq('user_session', sessionId)
      .single();

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        // Remove reaction if same type
        await supabase
          .from('video_reactions')
          .delete()
          .eq('id', existingReaction.id);
        
        // Update video count
        const field = reactionType === 'like' ? 'likes' : 'dislikes';
        const { data: video } = await supabase
          .from('videos')
          .select(field)
          .eq('id', videoId)
          .single();
        
        if (video) {
          await supabase
            .from('videos')
            .update({ [field]: Math.max(0, (video[field] || 1) - 1) })
            .eq('id', videoId);
        }
      } else {
        // Change reaction type
        await supabase
          .from('video_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existingReaction.id);
        
        // Update both counts
        const { data: video } = await supabase
          .from('videos')
          .select('likes, dislikes')
          .eq('id', videoId)
          .single();
        
        if (video) {
          const oldField = existingReaction.reaction_type === 'like' ? 'likes' : 'dislikes';
          const newField = reactionType === 'like' ? 'likes' : 'dislikes';
          
          await supabase
            .from('videos')
            .update({
              [oldField]: Math.max(0, (video[oldField] || 1) - 1),
              [newField]: (video[newField] || 0) + 1
            })
            .eq('id', videoId);
        }
      }
    } else {
      // Add new reaction
      await supabase
        .from('video_reactions')
        .insert([{
          video_id: videoId,
          user_session: sessionId,
          reaction_type: reactionType
        }]);
      
      // Update video count
      const field = reactionType === 'like' ? 'likes' : 'dislikes';
      const { data: video } = await supabase
        .from('videos')
        .select(field)
        .eq('id', videoId)
        .single();
      
      if (video) {
        await supabase
          .from('videos')
          .update({ [field]: (video[field] || 0) + 1 })
          .eq('id', videoId);
      }
    }
  } catch (error) {
    console.error('Error reacting to video:', error);
    throw error;
  }
};

// Get user's reaction to a video
export const getUserReaction = async (videoId: string) => {
  const sessionId = getSessionId();
  
  const { data, error } = await supabase
    .from('video_reactions')
    .select('reaction_type')
    .eq('video_id', videoId)
    .eq('user_session', sessionId)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching user reaction:', error);
  }
  
  return data?.reaction_type || null;
};

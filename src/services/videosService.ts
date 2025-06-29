
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

// Get all videos with pagination
export const getVideos = async (page = 1, limit = 20, category?: string) => {
  let query = supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.contains('tags', [category]);
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
export const getVideosByCategory = async (category: string, page = 1, limit = 20) => {
  return getVideos(page, limit, category);
};

// Get related videos by tags
export const getRelatedVideos = async (videoId: string, tags: string[], limit = 5) => {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .neq('id', videoId)
    .overlaps('tags', tags)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related videos:', error);
    throw error;
  }

  return data || [];
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

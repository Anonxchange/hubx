
import { supabase } from '@/integrations/supabase/client';

export interface UserStats {
  videosWatched: number;
  subscribers: number;
  totalViews: number;
  favoritesCount: number;
  uploadedVideos: number;
  earnings: number;
  watchTimeMinutes: number;
}

// Get user statistics from the database
export const getUserStats = async (userId: string): Promise<UserStats> => {
  try {
    // Get user's watch history count
    const { data: watchHistory, error: watchError } = await supabase
      .from('video_views')
      .select('id')
      .eq('user_id', userId);

    if (watchError && watchError.code !== 'PGRST116') {
      console.error('Error fetching watch history:', watchError);
    }

    // Get user's uploaded videos count (for creators)
    const { data: uploadedVideos, error: uploadsError } = await supabase
      .from('videos')
      .select('id, views')
      .eq('created_by', userId);

    if (uploadsError && uploadsError.code !== 'PGRST116') {
      console.error('Error fetching uploaded videos:', uploadsError);
    }

    // Get user's favorites count
    const { data: favorites, error: favError } = await supabase
      .from('video_reactions')
      .select('id')
      .eq('user_session', userId)
      .eq('reaction_type', 'like');

    if (favError && favError.code !== 'PGRST116') {
      console.error('Error fetching favorites:', favError);
    }

    // Get user's total video views (for creators)
    const totalViews = uploadedVideos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;

    // Calculate basic earnings (mock calculation - $0.001 per view)
    const earnings = totalViews * 0.001;

    // Get user's watch time (mock calculation for now)
    const watchTimeMinutes = (watchHistory?.length || 0) * 15; // Assume 15 min average per video

    return {
      videosWatched: watchHistory?.length || 0,
      subscribers: 0, // We'll implement subscriber system later
      totalViews,
      favoritesCount: favorites?.length || 0,
      uploadedVideos: uploadedVideos?.length || 0,
      earnings: Math.round(earnings * 100) / 100, // Round to 2 decimal places
      watchTimeMinutes
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      videosWatched: 0,
      subscribers: 0,
      totalViews: 0,
      favoritesCount: 0,
      uploadedVideos: 0,
      earnings: 0,
      watchTimeMinutes: 0
    };
  }
};

// Track video view for statistics
export const trackVideoView = async (videoId: string, userId?: string) => {
  try {
    if (!userId) return; // Skip if user not logged in
    
    // Check if view already exists to prevent double counting
    const { data: existingView } = await supabase
      .from('video_views')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', userId)
      .single();

    if (!existingView) {
      // Insert new view record
      const { error } = await supabase
        .from('video_views')
        .insert({
          video_id: videoId,
          user_id: userId,
          viewed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error tracking video view:', error);
      }
    }
  } catch (error) {
    console.error('Error tracking video view:', error);
  }
};

// Get user's favorite videos
export const getUserFavorites = async (userId: string) => {
  try {
    const { data: favorites, error } = await supabase
      .from('video_reactions')
      .select(`
        video_id,
        videos (
          id,
          title,
          thumbnail_url,
          duration,
          views,
          likes
        )
      `)
      .eq('user_session', userId)
      .eq('reaction_type', 'like')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    return favorites?.map(fav => fav.videos).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

// Get user's watch history
export const getUserWatchHistory = async (userId: string) => {
  try {
    const { data: history, error } = await supabase
      .from('video_views')
      .select(`
        video_id,
        viewed_at,
        videos (
          id,
          title,
          thumbnail_url,
          duration,
          views,
          likes
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching watch history:', error);
      return [];
    }

    return history?.map(item => ({
      ...item.videos,
      watched_at: item.viewed_at
    })).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};

import { supabase } from '@/integrations/supabase/client';
import { calculateViewEarnings } from './earningsService';

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
    // Get subscriber count for this creator
    const { data: subscribers, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('creator_id', userId);

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscribers:', subError);
    }

    // Get all videos (since videos table doesn't track creator)
    const { data: allVideos, error: videosError } = await supabase
      .from('videos')
      .select('id, views, likes, created_at');

    if (videosError) {
      console.error('Error fetching videos:', videosError);
    }

    // Calculate some basic stats from available data
    const totalViews = allVideos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
    const totalLikes = allVideos?.reduce((sum, video) => sum + (video.likes || 0), 0) || 0;

    // Basic earnings calculation
    const earnings = totalViews * 0.001;

    // Estimated watch time based on video count
    const watchTimeMinutes = (allVideos?.length || 0) * 10;

    return {
      videosWatched: 0, // Not tracking individual watch history
      subscribers: subscribers?.length || 0,
      totalViews,
      favoritesCount: 0, // Video favorites table not available in current schema
      uploadedVideos: allVideos?.length || 0,
      earnings: Math.round(earnings * 100) / 100,
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

// Track video view for statistics - simplified for current schema
export const trackVideoView = async (videoId: string, userId?: string) => {
  try {
    console.log('Tracking video view for video:', videoId);
    // For now, just increment the views count directly on the video
    // since we don't have video_views table in current schema
    const { error } = await supabase
      .from('videos')
      .update({ 
        views: supabase.sql`COALESCE(views, 0) + 1`
      })
      .eq('id', videoId);

    if (error) {
      console.error('Error incrementing video views:', error);
    }
  } catch (error) {
    console.error('Error tracking video view:', error);
  }
};

// Get user's favorite videos - simplified for current schema
export const getUserFavorites = async (userId: string) => {
  try {
    // Since video_favorites table doesn't exist in current schema,
    // return empty array for now
    console.log('Getting favorites for user:', userId);
    return [];
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

// Get user's watch history - simplified for current schema  
export const getUserWatchHistory = async (userId: string) => {
  try {
    // Since video_views table doesn't exist in current schema,
    // return empty array for now
    console.log('Getting watch history for user:', userId);
    return [];
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};
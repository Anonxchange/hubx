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
    // Get creator earnings data which tracks actual views and earnings
    const { data: creatorEarnings, error: earningsError } = await supabase
      .from('creator_earnings')
      .select('*')
      .eq('creator_id', userId)
      .single();

    if (earningsError && earningsError.code !== 'PGRST116') {
      console.error('Error fetching creator earnings:', earningsError);
    }

    // Get subscriber count for this creator
    const { data: subscribers, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('creator_id', userId);

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscribers:', subError);
    }

    // Get view earnings records to count actual views
    const { data: viewEarnings, error: viewError } = await supabase
      .from('view_earnings')
      .select('id, earnings_amount, is_premium')
      .eq('creator_id', userId);

    if (viewError && viewError.code !== 'PGRST116') {
      console.error('Error fetching view earnings:', viewError);
    }

    // Get user's favorite videos
    const { data: favorites, error: favError } = await supabase
      .from('video_favorites')
      .select('id')
      .eq('user_id', userId);

    if (favError && favError.code !== 'PGRST116') {
      console.error('Error fetching favorites:', favError);
    }

    // Get actual videos uploaded by this user using owner_id
    const { data: userVideos, error: videosError } = await supabase
      .from('videos')
      .select('id, views')
      .eq('owner_id', userId);

    if (videosError && videosError.code !== 'PGRST116') {
      console.error('Error fetching user videos:', videosError);
    }

    const uploadedVideos = userVideos?.length || 0;

    // Use actual video views from user's videos
    const actualViews = userVideos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;
    const totalViews = Math.max(actualViews, creatorEarnings?.total_views || 0);
    const totalEarnings = creatorEarnings?.total_earnings || 0;
    
    // Calculate estimated watch time based on actual view data
    const avgViewDuration = 5; // Average 5 minutes per view
    const watchTimeMinutes = Math.round((totalViews * avgViewDuration) / 60);

    console.log('User stats calculation using actual data:', {
      userId,
      totalViews,
      subscribers: subscribers?.length || 0,
      totalEarnings,
      uploadedVideos,
      favoritesCount: favorites?.length || 0
    });

    return {
      videosWatched: 0, // Individual watch history not implemented yet
      subscribers: subscribers?.length || 0,
      totalViews,
      favoritesCount: favorites?.length || 0,
      uploadedVideos,
      earnings: Math.round(totalEarnings * 100) / 100,
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
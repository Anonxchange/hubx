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

    // Get user's favorite videos using user_session field
    const { data: favorites, error: favError } = await supabase
      .from('video_favorites')
      .select('id')
      .eq('user_session', userId);

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

    // Get actual videos watched count from video_views table
    const { data: watchedVideos, error: watchError } = await supabase
      .from('video_views')
      .select('id')
      .eq('user_id', userId);

    if (watchError && watchError.code !== 'PGRST116') {
      console.error('Error fetching watched videos:', watchError);
    }

    return {
      videosWatched: watchedVideos?.length || 0,
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

// Get user's favorite videos using video_favorites table
export const getUserFavorites = async (userId: string) => {
  try {
    console.log('Getting favorites for user:', userId);
    
    // Use user_session field which stores user ID or session ID
    const { data: favorites, error } = await supabase
      .from('video_favorites')
      .select(`
        video_id,
        created_at,
        videos (
          id,
          title,
          thumbnail_url,
          preview_url,
          video_url,
          duration,
          views,
          likes,
          description,
          tags,
          owner_id,
          created_at,
          is_premium,
          is_moment,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            user_type
          )
        )
      `)
      .eq('user_session', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      return [];
    }

    // Transform data to match expected format
    const favoriteVideos = favorites?.map(fav => ({
      ...fav.videos,
      favorited_at: fav.created_at,
      uploader_username: fav.videos?.profiles?.username,
      uploader_name: fav.videos?.profiles?.full_name,
      uploader_avatar: fav.videos?.profiles?.avatar_url,
      uploader_type: fav.videos?.profiles?.user_type,
      uploader_id: fav.videos?.profiles?.id
    })) || [];

    console.log('Found favorites:', favoriteVideos.length);
    return favoriteVideos;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
};

// Get user's watch history using video_views table  
export const getUserWatchHistory = async (userId: string) => {
  try {
    console.log('Getting watch history for user:', userId);
    
    const { data: watchHistory, error } = await supabase
      .from('video_views')
      .select(`
        id,
        video_id,
        viewed_at,
        watch_duration,
        videos (
          id,
          title,
          thumbnail_url,
          preview_url,
          video_url,
          duration,
          views,
          likes,
          description,
          tags,
          owner_id,
          created_at,
          is_premium,
          is_moment,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            user_type
          )
        )
      `)
      .eq('user_id', userId)
      .order('viewed_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching watch history:', error);
      return [];
    }

    // Transform data to match expected format
    const watchedVideos = watchHistory?.map(view => ({
      ...view.videos,
      watched_at: view.viewed_at,
      watch_duration: view.watch_duration,
      uploader_username: view.videos?.profiles?.username,
      uploader_name: view.videos?.profiles?.full_name,
      uploader_avatar: view.videos?.profiles?.avatar_url,
      uploader_type: view.videos?.profiles?.user_type,
      uploader_id: view.videos?.profiles?.id
    })) || [];

    console.log('Found watch history:', watchedVideos.length);
    return watchedVideos;
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};
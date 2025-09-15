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
    // Get user's watch history count (table doesn't exist yet, so return 0)
    let watchHistory = null;
    let watchError = null;

    try {
      const { data, error } = await supabase
        .from('video_views')
        .select('id')
        .eq('user_id', userId);
      watchHistory = data;
      watchError = error;
    } catch (error) {
      // Table doesn't exist, ignore error
      console.log('video_views table not available yet');
    }

    // Get user's uploaded videos count (for creators)
    const { data: uploadedVideos, error: uploadsError } = await supabase
      .from('videos')
      .select('id, views')
      .eq('owner_id', userId);

    if (uploadsError && uploadsError.code !== 'PGRST116') {
      console.error('Error fetching uploaded videos:', uploadsError);
    }

    // Get user's favorites count
    const { data: favorites, error: favError } = await supabase
      .from('video_favorites')
      .select('id')
      .eq('user_session', userId);

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
    // Generate session ID for anonymous users
    const getSessionId = (): string => {
      let sessionId = localStorage.getItem('user_session');
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        localStorage.setItem('user_session', sessionId);
      }
      return sessionId;
    };

    const sessionId = userId || getSessionId();

    // Check if user/session already viewed this video
    let existingView = null;
    
    if (userId) {
      // Check if logged-in user already viewed
      const { data } = await supabase
        .from('video_views')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', userId)
        .single();
      existingView = data;
    } else {
      // Check if session already viewed (for guests)
      const { data } = await supabase
        .from('video_views')
        .select('id')
        .eq('video_id', videoId)
        .eq('user_id', sessionId)
        .single();
      existingView = data;
    }

    if (!existingView) {
      // Insert new view record and increment video views count
      const { data: newView, error } = await supabase
        .from('video_views')
        .insert({
          video_id: videoId,
          user_id: sessionId, // Use sessionId for both logged-in users and guests
          viewed_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (!error && newView) {
        // Increment the views count on the video
        await supabase.rpc('increment_video_views', { video_id: videoId });
      }

      if (error) {
        console.error('Error tracking video view:', error);
        return;
      }

      // Get video details for earnings calculation
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('owner_id, is_premium, profiles:owner_id(user_type)')
        .eq('id', videoId)
        .single();

      if (videoError) {
        console.error('Error fetching video details:', videoError);
        return;
      }

      if (videoData && newView) {
        const creatorId = videoData.owner_id;
        const isPremium = videoData.is_premium || false;
        const isCreator = videoData.profiles?.user_type === 'individual_creator' || 
                         videoData.profiles?.user_type === 'studio_creator';

        // Only calculate earnings for creators (not regular users)
        // Don't give earnings if creator is viewing their own video
        if (isCreator && creatorId && creatorId !== sessionId) {
          // Calculate and record view earnings for the creator
          await calculateViewEarnings(videoId, creatorId, newView.id, isPremium);
        }
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
      .from('video_favorites')
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
    const { data: watchHistory, error } = await supabase
      .from('video_views')
      .select(`
        video_id,
        watched_at,
        videos (
          id,
          title,
          thumbnail_url,
          duration,
          views,
          likes,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('watched_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching watch history:', error);
      return [];
    }

    return watchHistory?.map(view => ({
      ...view.videos,
      watched_at: view.watched_at
    })).filter(video => video && video.id) || [];
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return [];
  }
};
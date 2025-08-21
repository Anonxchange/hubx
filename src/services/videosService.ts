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
    full_name?: string; // Added for uploader_name
    user_type?: string; // Added for uploader_type
  }; // uploader profile info
  uploader_id?: string; // Added computed field
  uploader_username?: string; // Added computed field
  uploader_name?: string; // Added computed field
  uploader_avatar?: string; // Added computed field
  uploader_type?: string; // Added computed field
  uploader_subscribers?: number; // Added computed field
  video_count?: number; // Added computed field
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
  premiumOnly?: boolean
) => {
  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment, preview_url,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    );

  if (premiumOnly !== undefined) {
    query = query.eq('is_premium', premiumOnly);
    if (premiumOnly) {
      // For premium videos, also ensure they're not moments
      query = query.eq('is_moment', false);
    }
  }

  if (category && category !== 'all') {
    switch (category.toLowerCase()) {
      case 'recommended':
      case 'trending':
        if (!premiumOnly) {
          query = query.eq('is_premium', false).eq('is_moment', false);
        }
        query = query.order('views', { ascending: false });
        break;
      case 'most rated':
        if (!premiumOnly) {
          query = query.eq('is_premium', false).eq('is_moment', false);
        }
        query = query.order('likes', { ascending: false });
        break;
      case 'premium':
        query = query.eq('is_premium', true).eq('is_moment', false).order('created_at', { ascending: false });
        break;
      case 'moments':
        query = query.eq('is_moment', true).order('created_at', { ascending: false });
        break;
      default:
        if (!premiumOnly) {
          query = query.eq('is_premium', false).eq('is_moment', false);
        }
        query = query.contains('tags', [category]).order('created_at', { ascending: false });
        break;
    }
  } else if (premiumOnly === undefined) {
    query = query.eq('is_premium', false).eq('is_moment', false).order('created_at', { ascending: false });
  } else if (premiumOnly) {
    query = query.order('created_at', { ascending: false });
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

  // Process videos to add computed uploader fields
  const processedVideos = (data || []).map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Get recommended videos with advanced personalization
export const getRecommendedVideos = async (
  page = 1,
  limit = 60,
  userId?: string
) => {
  if (userId) {
    // Logged-in user recommendations
    return await getLoggedInRecommendations(userId, page, limit);
  } else {
    // Guest user recommendations
    return await getGuestRecommendations(page, limit);
  }
};

// Get personalized recommendations for logged-in users
const getLoggedInRecommendations = async (userId: string, page: number, limit: number) => {
  // Get user's watch history and preferences
  const { data: watchHistory } = await supabase
    .from('video_views')
    .select('video_id, videos(tags, likes, views)')
    .eq('user_id', userId)
    .order('watched_at', { ascending: false })
    .limit(50);

  const { data: userReactions } = await supabase
    .from('video_reactions')
    .select('video_id, reaction_type, videos(tags)')
    .eq('user_session', userId)
    .eq('reaction_type', 'like');

  // Extract user preferences from history
  const userTags = new Set<string>();
  const watchedVideoIds = new Set<string>();

  watchHistory?.forEach(view => {
    watchedVideoIds.add(view.video_id);
    if (view.videos?.tags) {
      view.videos.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
    }
  });

  userReactions?.forEach(reaction => {
    if (reaction.videos?.tags) {
      reaction.videos.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
    }
  });

  // Get all videos for scoring - explicitly exclude moments and premium
  const { data: allVideos, error, count } = await supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', false)
    .eq('is_moment', false);

  if (error) {
    console.error('Error fetching videos for recommendations:', error);
    throw error;
  }

  // Score videos based on user preferences
  const scoredVideos = (allVideos || []).map(video => {
    let score = 0;

    // Skip already watched videos (lower priority)
    if (watchedVideoIds.has(video.id)) {
      score -= 0.5;
    }

    // Tag similarity scoring
    const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());
    const tagMatches = videoTagsLower.filter(tag => userTags.has(tag)).length;
    const tagScore = tagMatches / Math.max(videoTagsLower.length, 1);
    score += tagScore * 0.4;

    // Popularity factors
    const viewScore = Math.log(Math.max(video.views, 1) + 1) * 0.2;
    const likeScore = Math.log(Math.max(video.likes, 1) + 1) * 0.15;
    score += viewScore + likeScore;

    // Recency bonus
    const age = Date.now() - new Date(video.created_at).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const recencyBonus = Math.max(0, 1 - (age / (7 * dayMs))) * 0.15;
    score += recencyBonus;

    // Random discovery factor (10-20%)
    const randomFactor = Math.random() * 0.1;
    score += randomFactor;

    return { ...video, recommendationScore: score };
  });

  // Sort by recommendation score and apply pagination
  const sortedVideos = scoredVideos
    .sort((a, b) => (b as any).recommendationScore - (a as any).recommendationScore);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const paginatedVideos = sortedVideos.slice(from, to + 1);

  // Process videos to add computed uploader fields
  const processedVideos = paginatedVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Get recommendations for guest users
const getGuestRecommendations = async (page: number, limit: number) => {
  const sessionId = getSessionId();

  // Get session-based activity
  const { data: sessionViews } = await supabase
    .from('video_reactions')
    .select('video_id, videos(tags, likes, views)')
    .eq('user_session', sessionId);

  const { data: userCountryData } = await getUserLocationData();
  const userCountry = userCountryData?.country?.toLowerCase() || 'nigeria';

  // Get session preferences
  const sessionTags = new Set<string>();
  sessionViews?.forEach(view => {
    if (view.videos?.tags) {
      view.videos.tags.forEach((tag: string) => sessionTags.add(tag.toLowerCase()));
    }
  });

  // Get all videos for scoring - explicitly exclude moments and premium
  const { data: allVideos, error, count } = await supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', false)
    .eq('is_moment', false);

  if (error) {
    console.error('Error fetching videos for guest recommendations:', error);
    throw error;
  }

  // Score videos for guests
  const scoredVideos = (allVideos || []).map(video => {
    let score = 0;

    // Session activity similarity
    if (sessionTags.size > 0) {
      const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());
      const tagMatches = videoTagsLower.filter(tag => sessionTags.has(tag)).length;
      const tagScore = tagMatches / Math.max(videoTagsLower.length, 1);
      score += tagScore * 0.3;
    }

    // Location-based popularity
    const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());
    const hasLocationTag = videoTagsLower.includes(userCountry) ||
                          videoTagsLower.some(tag => tag.includes(userCountry));
    if (hasLocationTag) {
      score += 0.25;
    }

    // General trending factors
    const viewScore = Math.log(Math.max(video.views, 1) + 1) * 0.3;
    const likeScore = Math.log(Math.max(video.likes, 1) + 1) * 0.2;
    score += viewScore + likeScore;

    // Recency bonus
    const age = Date.now() - new Date(video.created_at).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const recencyBonus = Math.max(0, 1 - (age / (14 * dayMs))) * 0.1;
    score += recencyBonus;

    // Random discovery factor (20% for guests)
    const randomFactor = Math.random() * 0.2;
    score += randomFactor;

    return { ...video, recommendationScore: score };
  });

  // Sort by recommendation score and apply pagination
  const sortedVideos = scoredVideos
    .sort((a, b) => (b as any).recommendationScore - (a as any).recommendationScore);

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const paginatedVideos = sortedVideos.slice(from, to + 1);

  // Process videos to add computed uploader fields
  const processedVideos = paginatedVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Helper function to get user location data with better error handling
const getUserLocationData = async () => {
  // Check if we have cached location data (valid for 1 hour)
  const cachedLocation = localStorage.getItem('user_location');
  if (cachedLocation) {
    try {
      const parsed = JSON.parse(cachedLocation);
      const oneHour = 60 * 60 * 1000;
      if (parsed.timestamp && (Date.now() - parsed.timestamp) < oneHour) {
        return parsed;
      } else {
        localStorage.removeItem('user_location');
      }
    } catch (e) {
      localStorage.removeItem('user_location');
    }
  }

  // Try to get location data with minimal logging
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // Reduced to 2 seconds

    const response = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.country && !data.error && data.country !== 'undefined') {
        // Cache the result for 1 hour
        const locationData = {
          country: data.country,
          country_name: data.country_name || data.country,
          timestamp: Date.now()
        };
        localStorage.setItem('user_location', JSON.stringify(locationData));
        return locationData;
      }
    }
  } catch (error) {
    // Completely silent - no console logs
  }

  // Return default location
  return { country: 'Nigeria', country_name: 'Nigeria' };
};

// Get videos by category with three sections: Recommended, Hottest/Trending, Random/Discovery
export const getCategoryVideos = async (
  category: string,
  page = 1,
  limit = 60,
  searchQuery?: string,
  userId?: string
) => {
  // Special handling for special categories
  if (category.toLowerCase() === 'recommended') {
    return await getRecommendedVideos(page, limit, userId);
  }
  if (category.toLowerCase() === 'trending') {
    return await getTrendingVideos(page, limit);
  }
  if (category.toLowerCase() === 'premium') {
    return await getPremiumVideos(page, limit, searchQuery);
  }

  // Get all videos in the category for sectioning
  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', false)
    .eq('is_moment', false)
    .contains('tags', [category]);

  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
    );
  }

  const { data: allCategoryVideos, error, count } = await query;

  if (error) {
    console.error('Error fetching category videos:', error);
    throw error;
  }

  if (!allCategoryVideos || allCategoryVideos.length === 0) {
    return {
      videos: [],
      totalCount: 0,
      totalPages: 0,
    };
  }

  // Apply category sectioning algorithm
  const sectionedVideos = await applyCategorySectioning(
    allCategoryVideos,
    category,
    userId
  );

  // Apply pagination to sectioned results
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const paginatedVideos = sectionedVideos.slice(from, to + 1);

  // Process videos to add computed uploader fields
  const processedVideos = paginatedVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Apply category sectioning: Recommended (40%), Hottest/Trending (35%), Random/Discovery (25%)
const applyCategorySectioning = async (
  categoryVideos: Video[],
  category: string,
  userId?: string
): Promise<Video[]> => {
  if (categoryVideos.length === 0) return [];

  // Get user watch history and session data
  let watchedVideoIds = new Set<string>();
  let userTags = new Set<string>();

  if (userId) {
    const { data: watchHistory } = await supabase
      .from('video_views')
      .select('video_id, videos(tags)')
      .eq('user_id', userId);

    watchHistory?.forEach(view => {
      watchedVideoIds.add(view.video_id);
      if (view.videos?.tags) {
        view.videos.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
      }
    });
  } else {
    // Guest user - use session data
    const sessionId = getSessionId();
    const { data: sessionViews } = await supabase
      .from('video_reactions')
      .select('video_id, videos(tags)')
      .eq('user_session', sessionId);

    sessionViews?.forEach(view => {
      watchedVideoIds.add(view.video_id);
      if (view.videos?.tags) {
        view.videos.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
      }
    });
  }

  // Get user location for guests
  const userLocationData = userId ? null : await getUserLocationData();
  const userCountry = userLocationData?.country?.toLowerCase() || 'nigeria';

  // Section 1: Recommended (40%)
  const recommendedVideos = categoryVideos.map(video => {
    let score = 0;

    if (userId) {
      // Logged-in user recommendations based on history intersection
      const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());
      const tagMatches = videoTagsLower.filter(tag => userTags.has(tag)).length;
      const tagScore = tagMatches / Math.max(videoTagsLower.length, 1);
      score += tagScore * 0.6;

      // Deprioritize watched videos
      if (watchedVideoIds.has(video.id)) {
        score *= 0.3;
      }

      // Popularity factors
      score += Math.log(Math.max(video.views, 1) + 1) * 0.2;
      score += Math.log(Math.max(video.likes, 1) + 1) * 0.15;
    } else {
      // Guest recommendations: session clicks, location popularity, trending
      const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());

      // Session activity similarity
      if (userTags.size > 0) {
        const tagMatches = videoTagsLower.filter(tag => userTags.has(tag)).length;
        score += (tagMatches / Math.max(videoTagsLower.length, 1)) * 0.3;
      }

      // Location popularity
      const hasLocationTag = videoTagsLower.includes(userCountry) ||
                            videoTagsLower.some(tag => tag.includes(userCountry));
      if (hasLocationTag) {
        score += 0.25;
      }

      // Trending factors
      score += Math.log(Math.max(video.views, 1) + 1) * 0.25;
      score += Math.log(Math.max(video.likes, 1) + 1) * 0.15;
    }

    // Small randomization
    score += Math.random() * 0.05;

    return { ...video, recommendedScore: score };
  }).sort((a, b) => (b as any).recommendedScore - (a as any).recommendedScore);

  // Section 2: Hottest/Trending (35%)
  const hottestVideos = categoryVideos.map(video => {
    // Calculate trending score based on views, likes, comments
    const viewScore = Math.log(Math.max(video.views, 1) + 1) * 0.5;
    const likeScore = Math.log(Math.max(video.likes, 1) + 1) * 0.3;

    // Engagement ratio
    const engagementRatio = video.views > 0 ?
      Math.min((video.likes / video.views) * 0.15, 0.15) :
      (video.likes > 0 ? 0.1 : 0);

    // Recency bonus
    const age = Date.now() - new Date(video.created_at).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const recencyBonus = Math.max(0, 1 - (age / (7 * dayMs))) * 0.05;

    const hottestScore = viewScore + likeScore + engagementRatio + recencyBonus;

    return { ...video, hottestScore };
  }).sort((a, b) => (b as any).hottestScore - (a as any).hottestScore);

  // Section 3: Random/Discovery (25%)
  const discoveryVideos = categoryVideos.map(video => {
    let score = 0;

    // Favor less-seen videos
    const viewPenalty = Math.log(Math.max(video.views, 1) + 1) * -0.3;
    score += viewPenalty;

    // Favor fresh uploads
    const age = Date.now() - new Date(video.created_at).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const freshnessBonus = Math.max(0, 1 - (age / (30 * dayMs))) * 0.4;
    score += freshnessBonus;

    // Large randomization factor for discovery
    score += Math.random() * 0.6;

    return { ...video, discoveryScore: score };
  }).sort((a, b) => (b as any).discoveryScore - (a as any).discoveryScore);

  // Combine sections with appropriate weightings
  const totalVideos = categoryVideos.length;
  const recommendedCount = Math.ceil(totalVideos * 0.4);
  const hottestCount = Math.ceil(totalVideos * 0.35);
  const discoveryCount = Math.ceil(totalVideos * 0.25);

  // Ensure we don't exceed total count
  const adjustedRecommendedCount = Math.min(recommendedCount, totalVideos);
  const adjustedHottestCount = Math.min(hottestCount, totalVideos - adjustedRecommendedCount);
  const adjustedDiscoveryCount = Math.min(discoveryCount, totalVideos - adjustedRecommendedCount - adjustedHottestCount);

  // Take from each section and shuffle within sections
  const finalRecommended = shuffleArray(recommendedVideos.slice(0, adjustedRecommendedCount));
  const finalHottest = shuffleArray(hottestVideos.slice(0, adjustedHottestCount));
  const finalDiscovery = shuffleArray(discoveryVideos.slice(0, adjustedDiscoveryCount));

  // Interleave the sections for better distribution
  const result: Video[] = [];
  const maxLength = Math.max(finalRecommended.length, finalHottest.length, finalDiscovery.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < finalRecommended.length) result.push(finalRecommended[i]);
    if (i < finalHottest.length) result.push(finalHottest[i]);
    if (i < finalDiscovery.length) result.push(finalDiscovery[i]);
  }

  // Process videos to add computed uploader fields
  const processedResult = result.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return processedResult;
};

// Helper function to shuffle array
const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Helper function for premium videos
const getPremiumVideos = async (page: number, limit: number, searchQuery?: string) => {
  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', true)
    .eq('is_moment', false)
    .order('created_at', { ascending: false });

  if (searchQuery) {
    query = query.or(
      `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`
    );
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching premium videos:', error);
    throw error;
  }

  // Process videos to add computed uploader fields
  const processedVideos = (data || []).map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Legacy function for backward compatibility
export const getVideosByCategory = async (
  category: string,
  page = 1,
  limit = 60,
  searchQuery?: string,
  userId?: string
) => {
  return getCategoryVideos(category, page, limit, searchQuery, userId);
};

// Get related videos based on tags excluding the current video
export const getRelatedVideos = async (videoId: string, tags: string[], limit = 15) => {
  if (!tags || tags.length === 0) {
    // If no tags provided, get random recent videos
    const { data: fallbackData } = await supabase
      .from('videos')
      .select(
        `
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
        `
      )
      .neq('id', videoId)
      .eq('is_moment', false)
      .eq('is_premium', false)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Process videos to add computed uploader fields
    const processedVideos = (fallbackData || []).map(video => ({
      ...video,
      uploader_id: video.profiles?.id || video.owner_id,
      uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_type: video.profiles?.user_type || 'user',
      uploader_subscribers: 0, // TODO: Calculate from subscriptions table
      video_count: 0, // TODO: Calculate from videos count
    }));

    return processedVideos;
  }

  // Try to get videos with overlapping tags
  const { data, error } = await supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `
    )
    .neq('id', videoId)
    .eq('is_moment', false)
    .eq('is_premium', false)
    .overlaps('tags', tags)
    .order('views', { ascending: false })
    .limit(limit * 2); // Get more initially for better sorting

  if (error) {
    console.error('Error fetching related videos:', error);
    // Fallback to recent videos if tag search fails
    const { data: fallbackData } = await supabase
      .from('videos')
      .select(
        `
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
        `
      )
      .neq('id', videoId)
      .eq('is_moment', false)
      .eq('is_premium', false)
      .order('views', { ascending: false })
      .limit(limit);

    // Process videos to add computed uploader fields
    const processedVideos = (fallbackData || []).map(video => ({
      ...video,
      uploader_id: video.profiles?.id || video.owner_id,
      uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_type: video.profiles?.user_type || 'user',
      uploader_subscribers: 0, // TODO: Calculate from subscriptions table
      video_count: 0, // TODO: Calculate from videos count
    }));

    return processedVideos;
  }

  const relatedVideos = data || [];

  if (relatedVideos.length === 0) {
    // If no related videos found, get popular videos as fallback
    const { data: fallbackData } = await supabase
      .from('videos')
      .select(
        `
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
        `
      )
      .neq('id', videoId)
      .eq('is_moment', false)
      .eq('is_premium', false)
      .order('views', { ascending: false })
      .limit(limit);

    // Process videos to add computed uploader fields
    const processedVideos = (fallbackData || []).map(video => ({
      ...video,
      uploader_id: video.profiles?.id || video.owner_id,
      uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_type: video.profiles?.user_type || 'user',
      uploader_subscribers: 0, // TODO: Calculate from subscriptions table
      video_count: 0, // TODO: Calculate from videos count
    }));

    return processedVideos;
  }

  // Score and sort related videos by relevance
  const scoredVideos = relatedVideos.map(video => {
    const videoTags = (video.tags || []).map((tag: string) => tag.toLowerCase());
    const inputTags = tags.map(tag => tag.toLowerCase());

    // Calculate tag similarity score
    const commonTags = videoTags.filter(tag => inputTags.includes(tag)).length;
    const tagSimilarity = commonTags / Math.max(inputTags.length, videoTags.length);

    // Combine with popularity metrics
    const viewScore = Math.log(Math.max(video.views || 0, 1) + 1) * 0.3;
    const likeScore = Math.log(Math.max(video.likes || 0, 1) + 1) * 0.2;
    const engagementRatio = (video.views || 0) > 0 ?
      ((video.likes || 0) / (video.views || 1)) * 0.1 : 0;

    const finalScore = (tagSimilarity * 0.4) + viewScore + likeScore + engagementRatio;

    return { ...video, relevanceScore: finalScore };
  });

  // Sort by relevance score and return top results
  const sortedAndScoredVideos = scoredVideos
    .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
    .slice(0, limit);

  // Process videos to add computed uploader fields
  const processedVideos = sortedAndScoredVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return processedVideos;
};

// Get a single video by ID, with uploader info
export const getVideoById = async (videoId: string) => {
  const { data, error } = await supabase
    .from('videos')
    .select(
      `
      *,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `
    )
    .eq('id', videoId)
    .single();

  if (error) {
    console.error('Error fetching video:', error);
    throw error;
  }

  // Process video to add computed uploader fields
  const processedVideo = data ? {
    ...data,
    uploader_id: data.profiles?.id || data.owner_id,
    uploader_username: data.profiles?.username || `User_${data.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: data.profiles?.full_name || data.profiles?.username || `User_${data.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: data.profiles?.avatar_url,
    uploader_type: data.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  } : null;

  return processedVideo;
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
    .select(`
      *,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `)
    .eq('is_moment', false)
    .eq('is_premium', false)
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
    .order('views', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error searching videos:', error);
    throw error;
  }

  // Process videos to add computed uploader fields
  const processedVideos = (data || []).map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return processedVideos;
};

// Get user's country (used in Header)
export const getUserCountry = async (): Promise<string> => {
  try {
    const locationData = await getUserLocationData();
    return locationData.country_name || locationData.country || 'Nigeria';
  } catch (error) {
    console.log('Error getting user country, using default');
    return 'Nigeria';
  }
};

// Get hottest videos by country with advanced location-based ranking
export const getHottestByCountry = async (
  country: string,
  page = 1,
  limit = 60,
  userId?: string
) => {
  // Get user's watched videos to deprioritize them
  let watchedVideoIds = new Set<string>();

  if (userId) {
    const { data: watchHistory } = await supabase
      .from('video_views')
      .select('video_id')
      .eq('user_id', userId);

    watchHistory?.forEach(view => watchedVideoIds.add(view.video_id));
  } else {
    // For guests, check session-based reactions
    const sessionId = getSessionId();
    const { data: sessionViews } = await supabase
      .from('video_reactions')
      .select('video_id')
      .eq('user_session', sessionId);

    sessionViews?.forEach(view => watchedVideoIds.add(view.video_id));
  }

  // First, try to get location-specific videos
  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', false)
    .eq('is_moment', false);

  let locationSpecificVideos: any[] = [];
  let locationQuery = null;

  // Apply location filtering with multiple variants for better matching
  if (country && country.toLowerCase() !== 'global') {
    const locationVariants = [
      country.toLowerCase(),
      country.toLowerCase().replace(/\s+/g, ''),
      country.split(' ')[0]?.toLowerCase(),
      // Add common alternative names
      ...(country.toLowerCase() === 'united states' ? ['usa', 'america', 'us'] : []),
      ...(country.toLowerCase() === 'united kingdom' ? ['uk', 'britain', 'england'] : []),
      ...(country.toLowerCase() === 'nigeria' ? ['ng', 'naija'] : []),
      ...(country.toLowerCase() === 'south africa' ? ['za', 'sa'] : []),
    ].filter(Boolean);

    // Try each variant separately to be more flexible
    for (const variant of locationVariants) {
      const variantQuery = supabase
        .from('videos')
        .select(
          `
          id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
          profiles:owner_id (id, username, avatar_url, full_name, user_type)
          `
        )
        .eq('is_premium', false)
        .eq('is_moment', false)
        .contains('tags', [variant]);

      const { data: variantVideos } = await variantQuery;
      if (variantVideos && variantVideos.length > 0) {
        locationSpecificVideos.push(...variantVideos);
      }
    }

    // Remove duplicates
    const uniqueVideos = new Map();
    locationSpecificVideos.forEach(video => {
      if (!uniqueVideos.has(video.id)) {
        uniqueVideos.set(video.id, video);
      }
    });
    locationSpecificVideos = Array.from(uniqueVideos.values());
  }

  // If we found location-specific videos, use them; otherwise get all videos
  let allVideos: any[], error: any, count: number;

  if (locationSpecificVideos.length > 0) {
    allVideos = locationSpecificVideos;
    count = locationSpecificVideos.length;
    error = null;
  } else {
    // Fallback to all videos if no location-specific videos found
    const result = await supabase
      .from('videos')
      .select(
        `
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
        `,
        { count: 'exact' }
      )
      .eq('is_premium', false)
      .eq('is_moment', false);

    allVideos = result.data;
    error = result.error;
    count = result.count;
  }

  if (error) {
    console.error('Error fetching hottest videos by country:', error);
    // Try a simpler query as last resort
    const { data: simpleVideos } = await supabase
      .from('videos')
      .select(`
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `)
      .eq('is_premium', false)
      .eq('is_moment', false)
      .order('views', { ascending: false })
      .limit(limit);

    // Process videos to add computed uploader fields
    const processedVideos = (simpleVideos || []).map(video => ({
      ...video,
      uploader_id: video.profiles?.id || video.owner_id,
      uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_type: video.profiles?.user_type || 'user',
      uploader_subscribers: 0, // TODO: Calculate from subscriptions table
      video_count: 0, // TODO: Calculate from videos count
    }));

    return {
      videos: processedVideos,
      totalCount: simpleVideos?.length || 0,
      totalPages: 1,
    };
  }

  if (!allVideos || allVideos.length === 0) {
    console.log('No videos found, trying simple query');
    // Try to get any videos if none found with filters
    const { data: anyVideos } = await supabase
      .from('videos')
      .select(`
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `)
      .eq('is_premium', false)
      .eq('is_moment', false)
      .order('views', { ascending: false })
      .limit(limit);

    // Process videos to add computed uploader fields
    const processedVideos = (anyVideos || []).map(video => ({
      ...video,
      uploader_id: video.profiles?.id || video.owner_id,
      uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_type: video.profiles?.user_type || 'user',
      uploader_subscribers: 0, // TODO: Calculate from subscriptions table
      video_count: 0, // TODO: Calculate from videos count
    }));

    return {
      videos: processedVideos,
      totalCount: anyVideos?.length || 0,
      totalPages: 1,
    };
  }

  // Apply hottest algorithm with location-based ranking
  const hottestVideos = allVideos.map(video => {
    let score = 0;

    // Primary ranking factors - popularity based
    const viewScore = Math.log(Math.max(video.views, 1) + 1) * 0.5; // 50% weight on views
    const likeScore = Math.log(Math.max(video.likes, 1) + 1) * 0.3; // 30% weight on likes

    // Engagement ratio (likes vs views)
    const engagementRatio = video.views > 0 ?
      Math.min((video.likes / video.views) * 0.15, 0.15) :
      (video.likes > 0 ? 0.1 : 0);

    // Combine base scores
    score = viewScore + likeScore + engagementRatio;

    // Deprioritize already watched content (but don't exclude completely)
    if (watchedVideoIds.has(video.id)) {
      score *= 0.7; // Reduce score by 30% for watched videos
    }

    // Minor personalization boost for recent content
    const age = Date.now() - new Date(video.created_at).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const recencyBonus = Math.max(0, 1 - (age / (30 * dayMs))) * 0.05; // Small 5% bonus for recent content
    score += recencyBonus;

    return {
      ...video,
      hottestScore: score
    };
  });

  // Sort by hottest score
  const sortedVideos = hottestVideos
    .sort((a, b) => (b as any).hottestScore - (a as any).hottestScore);

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const paginatedVideos = sortedVideos.slice(from, to + 1);

  // Process videos to add computed uploader fields
  const processedVideos = paginatedVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Get trending videos based on recent activity (24-48h)
export const getTrendingVideos = async (
  page = 1,
  limit = 60,
  location?: string
) => {
  // Calculate time range for recent activity (last 7 days to ensure we have content)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

  let query = supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', false)
    .eq('is_moment', false);

  // Filter by location if specified (make location filter more flexible)
  if (location && location !== 'Global') {
    // Try exact match first, then fallback to partial match
    const locationVariants = [
      location.toLowerCase(),
      location.toLowerCase().replace(/\s+/g, ''),
      location.split(' ')[0]?.toLowerCase()
    ].filter(Boolean);

    // Use OR condition to match any of the location variants
    const locationFilter = locationVariants.map(variant => `tags.cs.{${variant}}`).join(',');
    query = query.or(locationFilter);
  }

  // Get videos from the last 7 days, but prioritize more recent ones
  query = query.gte('created_at', sevenDaysAgo.toISOString());

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query.range(from, to);

  if (error || !data || data.length === 0) {
    console.log('No recent trending videos found, using fallback approach');

    // Fallback to all videos with trending algorithm
    const fallbackQuery = supabase
      .from('videos')
      .select(
        `
        id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
        profiles:owner_id (id, username, avatar_url, full_name, user_type)
        `,
        { count: 'exact' }
      )
      .eq('is_premium', false)
      .eq('is_moment', false);

    // Apply location filter to fallback as well
    if (location && location !== 'Global') {
      const locationVariants = [
        location.toLowerCase(),
        location.toLowerCase().replace(/\s+/g, ''),
        location.split(' ')[0]?.toLowerCase()
      ].filter(Boolean);

      const locationFilter = locationVariants.map(variant => `tags.cs.{${variant}}`).join(',');
      fallbackQuery.or(locationFilter);
    }

    const fallbackResult = await fallbackQuery
      .order('views', { ascending: false })
      .range(from, to);

    if (fallbackResult.error) {
      console.error('Error in fallback query:', fallbackResult.error);
      return {
        videos: [],
        totalCount: 0,
        totalPages: 0,
      };
    }

    // Apply trending algorithm to fallback results
    const trendingVideos = applyTrendingAlgorithm(fallbackResult.data || []);

    // Process videos to add computed uploader fields
    const processedVideos = trendingVideos.map(video => ({
      ...video,
      uploader_id: video.profiles?.id || video.owner_id,
      uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
      uploader_avatar: video.profiles?.avatar_url,
      uploader_type: video.profiles?.user_type || 'user',
      uploader_subscribers: 0, // TODO: Calculate from subscriptions table
      video_count: 0, // TODO: Calculate from videos count
    }));

    return {
      videos: processedVideos,
      totalCount: fallbackResult.count || 0,
      totalPages: Math.ceil((fallbackResult.count || 0) / limit),
    };
  }

  // Apply trending algorithm to the results
  const trendingVideos = applyTrendingAlgorithm(data || []);

  // Process videos to add computed uploader fields
  const processedVideos = trendingVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Apply trending algorithm based on recent activity metrics
const applyTrendingAlgorithm = (videos: Video[]): Video[] => {
  if (!videos || videos.length === 0) return [];

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  return videos
    .map(video => {
      const age = now - new Date(video.created_at).getTime();
      const ageInDays = age / dayMs;

      // Recency boost - newer content gets higher priority (adjusted for 7 days)
      const recencyBoost = Math.max(0, 1 - (ageInDays / 7)) * 0.25;

      // Activity score based on views and likes (enhanced scoring)
      const viewScore = Math.log(Math.max(video.views, 1) + 1) * 0.4;
      const likeScore = Math.log(Math.max(video.likes, 1) + 1) * 0.25;

      // Engagement ratio (likes vs views)
      const engagementRatio = video.views > 0 ?
        Math.min((video.likes / video.views) * 0.15, 0.15) :
        (video.likes > 0 ? 0.1 : 0);

      // Velocity bonus for videos with good likes-to-age ratio
      const velocityBonus = ageInDays > 0 ?
        Math.min((video.likes / ageInDays) * 0.05, 0.1) :
        (video.likes > 0 ? 0.1 : 0);

      // Small randomization factor to prevent staleness
      const randomFactor = Math.random() * 0.05;

      // Calculate trending score
      const trendingScore = viewScore + likeScore + recencyBoost + engagementRatio + velocityBonus + randomFactor;

      return {
        ...video,
        trendingScore
      };
    })
    .sort((a, b) => (b as any).trendingScore - (a as any).trendingScore);
};

// Get homepage videos with sectioning: Recommended (40%), Hottest/Trending (30%), Random/Discovery (30%)
export const getHomepageVideos = async (
  page = 1,
  limit = 60,
  userId?: string
) => {
  // Get all videos for sectioning
  const { data: allVideos, error, count } = await supabase
    .from('videos')
    .select(
      `
      id, owner_id, title, description, video_url, thumbnail_url, duration, views, likes, dislikes, tags, created_at, updated_at, is_premium, is_moment,
      profiles:owner_id (id, username, avatar_url, full_name, user_type)
      `,
      { count: 'exact' }
    )
    .eq('is_premium', false)
    .eq('is_moment', false);

  if (error) {
    console.error('Error fetching homepage videos:', error);
    throw error;
  }

  if (!allVideos || allVideos.length === 0) {
    return {
      videos: [],
      totalCount: 0,
      totalPages: 0,
    };
  }

  // Apply homepage sectioning algorithm
  const sectionedVideos = await applyHomepageSectioning(allVideos, userId);

  // Apply pagination to sectioned results
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  const paginatedVideos = sectionedVideos.slice(from, to + 1);

  // Process videos to add computed uploader fields
  const processedVideos = paginatedVideos.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return {
    videos: processedVideos,
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

// Enhanced recommendation engine with real-time behavior tracking
const applyHomepageSectioning = async (
  allVideos: Video[],
  userId?: string
): Promise<Video[]> => {
  if (allVideos.length === 0) return [];

  // Get comprehensive user behavior data
  let watchedVideoIds = new Set<string>();
  let userTags = new Set<string>();
  let recentSearches: string[] = [];
  let sessionClickPattern: { [key: string]: number } = {};
  let timeOfDayPreference: { [key: string]: number } = {};

  const sessionId = getSessionId();
  const currentHour = new Date().getHours();

  if (userId) {
    // Logged-in user: comprehensive behavior analysis
    const [watchHistory, userReactions, searchHistory] = await Promise.all([
      supabase
        .from('video_views')
        .select('video_id, watched_at, videos(tags, category)')
        .eq('user_id', userId)
        .order('watched_at', { ascending: false })
        .limit(100),

      supabase
        .from('video_reactions')
        .select('video_id, created_at, videos(tags, category)')
        .eq('user_session', userId)
        .eq('reaction_type', 'like')
        .order('created_at', { ascending: false })
        .limit(50),

      // Mock search history - you'd implement this table
      Promise.resolve({ data: [] })
    ]);

    // Analyze watch patterns by time of day
    watchHistory.data?.forEach(view => {
      const hour = new Date(view.watched_at).getHours();
      timeOfDayPreference[hour] = (timeOfDayPreference[hour] || 0) + 1;

      watchedVideoIds.add(view.video_id);
      if (view.videos?.tags) {
        view.videos.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
      }
    });

    userReactions.data?.forEach(reaction => {
      if (reaction.videos?.tags) {
        reaction.videos.tags.forEach((tag: string) => userTags.add(tag.toLowerCase()));
      }
    });
  } else {
    // Guest user: session-based behavior tracking
    const sessionViews = await supabase
      .from('video_reactions')
      .select('video_id, created_at, videos(tags)')
      .eq('user_session', sessionId)
      .order('created_at', { ascending: false });

    sessionViews.data?.forEach(view => {
      watchedVideoIds.add(view.video_id);
      if (view.videos?.tags) {
        view.videos.tags.forEach((tag: string) => {
          userTags.add(tag.toLowerCase());
          sessionClickPattern[tag.toLowerCase()] = (sessionClickPattern[tag.toLowerCase()] || 0) + 1;
        });
      }
    });

    // Get session-based search patterns from localStorage
    try {
      const savedSearches = localStorage.getItem('recent_searches');
      if (savedSearches) {
        recentSearches = JSON.parse(savedSearches).slice(0, 10);
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  // Get user location and current context
  const userLocationData = userId ? null : await getUserLocationData();
  const userCountry = userLocationData?.country?.toLowerCase() || 'nigeria';

  // Calculate dynamic section weights based on user behavior
  let recommendedWeight = 0.4;
  let hottestWeight = 0.3;
  let discoveryWeight = 0.3;

  // Adjust weights based on user engagement patterns
  if (userId && watchedVideoIds.size > 20) {
    // Heavy users get more personalized recommendations
    recommendedWeight = 0.6;
    hottestWeight = 0.25;
    discoveryWeight = 0.15;
  } else if (userTags.size === 0) {
    // New users get more trending/discovery content
    recommendedWeight = 0.2;
    hottestWeight = 0.4;
    discoveryWeight = 0.4;
  }

  // Section 1: Advanced Personalized Recommendations
  const recommendedVideos = allVideos.map(video => {
    let score = 0;
    const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());

    if (userId) {
      // Multi-factor personalization scoring

      // 1. Tag affinity with decay for recent preferences
      const tagMatches = videoTagsLower.filter(tag => userTags.has(tag)).length;
      const tagAffinityScore = tagMatches / Math.max(videoTagsLower.length, 1);
      score += tagAffinityScore * 0.4;

      // 2. Collaborative filtering - users with similar taste
      const popularityBoost = Math.log(Math.max(video.views, 1) + 1) * 0.2;
      score += popularityBoost;

      // 3. Time-of-day preference matching
      const timePreferenceBoost = timeOfDayPreference[currentHour] ? 0.1 : 0;
      score += timePreferenceBoost;

      // 4. Engagement velocity (recent likes/views ratio)
      const engagementRatio = video.views > 0 ?
        Math.min((video.likes / video.views) * 0.15, 0.15) : 0;
      score += engagementRatio;

      // 5. Freshness factor for content discovery
      const age = Date.now() - new Date(video.created_at).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      const freshnessBonus = Math.max(0, 1 - (age / (7 * dayMs))) * 0.1;
      score += freshnessBonus;

      // 6. Diversity injection - avoid echo chambers
      const watchedTagOverlap = videoTagsLower.filter(tag =>
        Array.from(userTags).some(userTag => userTag === tag)
      ).length;
      if (watchedTagOverlap === 0 && Math.random() < 0.2) {
        score += 0.2; // 20% chance to boost diverse content
      }

      // 7. Penalize recently watched content less harshly
      if (watchedVideoIds.has(video.id)) {
        score *= 0.5; // Reduce but don't eliminate
      }

    } else {
      // Guest user: session-based intelligence

      // 1. Session click pattern analysis
      const sessionRelevance = videoTagsLower.reduce((acc, tag) => {
        return acc + (sessionClickPattern[tag] || 0);
      }, 0) * 0.3;
      score += sessionRelevance;

      // 2. Search intent matching
      const searchRelevance = recentSearches.reduce((acc, search) => {
        const searchLower = search.toLowerCase();
        const titleMatch = video.title.toLowerCase().includes(searchLower) ? 0.2 : 0;
        const tagMatch = videoTagsLower.some(tag => tag.includes(searchLower)) ? 0.1 : 0;
        return acc + titleMatch + tagMatch;
      }, 0);
      score += searchRelevance;

      // 3. Geographic trending with time decay
      const hasLocationTag = videoTagsLower.includes(userCountry) ||
                            videoTagsLower.some(tag => tag.includes(userCountry));
      if (hasLocationTag) {
        const age = Date.now() - new Date(video.created_at).getTime();
        const hourMs = 60 * 60 * 1000;
        const timeDecay = Math.max(0.1, 1 - (age / (24 * hourMs))); // 24h decay
        score += 0.25 * timeDecay;
      }

      // 4. Viral momentum detection
      const viralScore = video.views > 1000 ?
        Math.log(video.views) * (video.likes / Math.max(video.views, 1)) * 0.2 : 0;
      score += viralScore;

      // 5. Content freshness with popularity threshold
      const age = Date.now() - new Date(video.created_at).getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      if (age < (3 * dayMs) && video.views > 100) { // Fresh and gaining traction
        score += 0.15;
      }
    }

    // Real-time randomization factor (changes every hour)
    const hourSeed = Math.floor(Date.now() / (60 * 60 * 1000));
    const pseudoRandom = Math.abs(Math.sin(video.id.charCodeAt(0) * hourSeed)) * 0.05;
    score += pseudoRandom;

    return { ...video, recommendedScore: score };
  }).sort((a, b) => (b as any).recommendedScore - (a as any).recommendedScore);

  // Section 2: Hottest/Trending (30%) - last 24-48h activity
  const hottestVideos = allVideos.map(video => {
    const age = Date.now() - new Date(video.created_at).getTime();
    const hourMs = 60 * 60 * 1000;

    // Strong recency boost for 24-48h window
    const recencyBoost = age <= (48 * hourMs) ?
      Math.max(0, 1 - (age / (48 * hourMs))) * 0.4 : 0;

    // Activity metrics
    const viewScore = Math.log(Math.max(video.views, 1) + 1) * 0.4;
    const likeScore = Math.log(Math.max(video.likes, 1) + 1) * 0.25;

    // Engagement ratio
    const engagementRatio = video.views > 0 ?
      Math.min((video.likes / video.views) * 0.15, 0.15) :
      (video.likes > 0 ? 0.1 : 0);

    // Location-based trending for guests
    let locationBonus = 0;
    if (!userId) {
      const videoTagsLower = video.tags.map((tag: string) => tag.toLowerCase());
      const hasLocationTag = videoTagsLower.includes(userCountry) ||
                            videoTagsLower.some(tag => tag.includes(userCountry));
      if (hasLocationTag) {
        locationBonus = 0.2;
      }
    }

    let hottestScore = viewScore + likeScore + engagementRatio + recencyBoost + locationBonus;

    // Add deterministic component for consistent ordering
    const idHash = video.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    hottestScore += (Math.abs(idHash) % 1000) / 10000;

    return { ...video, hottestScore };
  }).sort((a, b) => (b as any).hottestScore - (a as any).hottestScore);

  // Section 3: Random/Discovery (30%) - fresh, less-seen, older videos
  const discoveryVideos = allVideos.map(video => {
    let score = 0;

    // Favor fresh uploads
    const age = Date.now() - new Date(video.created_at).getTime();
    const dayMs = 24 * 60 * 60 * 1000;
    const freshnessBonus = Math.max(0, 1 - (age / (30 * dayMs))) * 0.3;
    score += freshnessBonus;

    // Favor less-seen videos (inverse popularity)
    const viewPenalty = Math.log(Math.max(video.views, 1) + 1) * -0.2;
    score += viewPenalty;

    // Slight preference for moderately popular videos
    const moderatePopularityBonus = video.views > 10 && video.views < 1000 ? 0.2 : 0;
    score += moderatePopularityBonus;

    // Use deterministic pseudo-random based on video ID instead of Math.random()
    const idHash = video.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    const pseudoRandom = (Math.abs(idHash) % 10000) / 10000; // 0-1 range
    score += pseudoRandom * 0.5;

    return { ...video, discoveryScore: score };
  }).sort((a, b) => (b as any).discoveryScore - (a as any).discoveryScore);

  // Calculate section sizes (40%, 30%, 30%)
  const totalVideos = allVideos.length;
  const recommendedCount = Math.ceil(totalVideos * 0.4);
  const hottestCount = Math.ceil(totalVideos * 0.3);
  const discoveryCount = Math.ceil(totalVideos * 0.3);

  // Ensure we don't exceed total count
  const adjustedRecommendedCount = Math.min(recommendedCount, totalVideos);
  const adjustedHottestCount = Math.min(hottestCount, totalVideos - adjustedRecommendedCount);
  const adjustedDiscoveryCount = Math.min(discoveryCount, totalVideos - adjustedRecommendedCount - adjustedHottestCount);

  // Take from each section (no random shuffling - use deterministic ordering)
  const finalRecommended = recommendedVideos.slice(0, adjustedRecommendedCount);
  const finalHottest = hottestVideos.slice(0, adjustedHottestCount);
  const finalDiscovery = discoveryVideos.slice(0, adjustedDiscoveryCount);

  // Interleave the sections for better distribution
  const result: Video[] = [];
  const maxLength = Math.max(finalRecommended.length, finalHottest.length, finalDiscovery.length);

  for (let i = 0; i < maxLength; i++) {
    if (i < finalRecommended.length) result.push(finalRecommended[i]);
    if (i < finalHottest.length) result.push(finalHottest[i]);
    if (i < finalDiscovery.length) result.push(finalDiscovery[i]);
  }

  // Process videos to add computed uploader fields
  const processedResult = result.map(video => ({
    ...video,
    uploader_id: video.profiles?.id || video.owner_id,
    uploader_username: video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_name: video.profiles?.full_name || video.profiles?.username || `User_${video.owner_id?.slice(-8) || 'Unknown'}`,
    uploader_avatar: video.profiles?.avatar_url,
    uploader_type: video.profiles?.user_type || 'user',
    uploader_subscribers: 0, // TODO: Calculate from subscriptions table
    video_count: 0, // TODO: Calculate from videos count
  }));

  return processedResult;
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
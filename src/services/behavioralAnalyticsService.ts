import { supabase } from '@/integrations/supabase/client';

// Get user location data with caching
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

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

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
    // Silent error handling
  }

  return { country: 'Nigeria', country_name: 'Nigeria' };
};

// Get session ID for anonymous users
export const getSessionId = (): string => {
  let sessionId = localStorage.getItem('user_session');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    localStorage.setItem('user_session', sessionId);
  }
  return sessionId;
};

// Track search queries (simplified for existing Supabase setup)
export const trackSearch = async (searchTerm: string, resultsCount: number, userId?: string) => {
  try {
    // Store search data in localStorage for now (can be moved to proper table later)
    const searches = JSON.parse(localStorage.getItem('user_searches') || '[]');
    const locationData = await getUserLocationData();
    
    searches.push({
      search_term: searchTerm.toLowerCase().trim(),
      user_country: locationData.country_name || locationData.country,
      timestamp: Date.now(),
      user_id: userId
    });
    
    // Keep only last 100 searches
    const recentSearches = searches.slice(-100);
    localStorage.setItem('user_searches', JSON.stringify(recentSearches));
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

// Get most searched terms by country (using localStorage for now)
export const getMostSearchedByCountry = async (country: string, limit: number = 20) => {
  try {
    const searches = JSON.parse(localStorage.getItem('user_searches') || '[]');
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Filter by country and time
    const countrySearches = searches.filter((s: any) => 
      s.user_country === country && s.timestamp > thirtyDaysAgo
    );
    
    // Count search terms
    const searchCounts = new Map();
    countrySearches.forEach((s: any) => {
      const count = searchCounts.get(s.search_term) || 0;
      searchCounts.set(s.search_term, count + 1);
    });
    
    // Convert to array and sort
    return Array.from(searchCounts.entries())
      .map(([search_term, count]) => ({ search_term, search_count: count }))
      .sort((a, b) => b.search_count - a.search_count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting searches by country:', error);
    return [];
  }
};

// Get most viewed videos by analyzing existing video data
export const getMostViewedByCountry = async (country: string, limit: number = 100) => {
  try {
    // Get top videos based on views and recent activity
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id, title, tags, views, likes, created_at,
        profiles!videos_owner_id_fkey(username, user_type, avatar_url)
      `)
      .eq('is_premium', false)
      .order('views', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(video => ({
      video_id: video.id,
      view_count: video.views,
      videos: video
    }));
  } catch (error) {
    console.error('Error getting views by country:', error);
    return [];
  }
};

// Get most liked videos by analyzing existing video data  
export const getMostLikedByCountry = async (country: string, limit: number = 100) => {
  try {
    // Get top videos based on likes
    const { data, error } = await supabase
      .from('videos')
      .select(`
        id, title, tags, views, likes, created_at,
        profiles!videos_owner_id_fkey(username, user_type, avatar_url)
      `)
      .eq('is_premium', false)
      .order('likes', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).map(video => ({
      video_id: video.id,
      like_count: video.likes,
      videos: video
    }));
  } catch (error) {
    console.error('Error getting likes by country:', error);
    return [];
  }
};

// Get popular tags based on general video popularity
export const getPopularTagsByCountry = async (country: string, limit: number = 50) => {
  try {
    // Get most popular videos and analyze their tags
    const { data: popularVideos, error } = await supabase
      .from('videos')
      .select('tags, views, likes')
      .eq('is_premium', false)
      .order('views', { ascending: false })
      .limit(200);

    if (error) throw error;

    // Count tag frequencies weighted by video popularity
    const tagCounts = new Map<string, number>();
    
    popularVideos?.forEach(video => {
      if (video.tags && Array.isArray(video.tags)) {
        const weight = Math.log(video.views + 1) + Math.log(video.likes + 1);
        video.tags.forEach((tag: string) => {
          const lowercaseTag = tag.toLowerCase();
          tagCounts.set(lowercaseTag, (tagCounts.get(lowercaseTag) || 0) + weight);
        });
      }
    });

    // Convert to array and sort by weighted frequency
    const sortedTags = Array.from(tagCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));

    return sortedTags;
  } catch (error) {
    console.error('Error getting popular tags by country:', error);
    return [];
  }
};

// Enhanced hottest videos algorithm based on real user behavior by country
export const getHottestVideosByBehavior = async (
  country: string, 
  page: number = 1, 
  limit: number = 60
) => {
  try {
    // Get behavioral data for this country
    const [searchTerms, popularTags, viewedVideos, likedVideos] = await Promise.all([
      getMostSearchedByCountry(country, 10),
      getPopularTagsByCountry(country, 20),
      getMostViewedByCountry(country, 50),
      getMostLikedByCountry(country, 30)
    ]);

    // Extract popular search keywords and tags
    const popularKeywords = [
      ...searchTerms.map(s => s.search_term),
      ...popularTags.map(t => t.tag)
    ];

    // Get video IDs that are popular (simplified approach)
    const behaviorBasedVideoIds = [
      ...viewedVideos.map(v => v.video_id),
      ...likedVideos.map(v => v.video_id)
    ];

    // Get behavioral videos (most popular ones)
    const { data: behaviorVideos } = await supabase
      .from('videos')
      .select(`
        id, title, description, thumbnail_url, duration, views, likes, tags, created_at,
        profiles!videos_owner_id_fkey(username, user_type, avatar_url)
      `)
      .eq('is_premium', false)
      .in('id', behaviorBasedVideoIds.slice(0, 50))
      .order('views', { ascending: false })
      .limit(Math.floor(limit * 0.4)); // 40% from behavior

    // Priority 2: Videos matching popular keywords
    let keywordVideos: any[] = [];
    if (popularKeywords.length > 0) {
      // Build OR conditions for popular keywords
      const keywordQueries = popularKeywords.slice(0, 5).map(async (keyword) => {
        const { data } = await supabase
          .from('videos')
          .select(`
            id, title, description, thumbnail_url, duration, views, likes, tags, created_at,
            profiles!videos_owner_id_fkey(username, user_type, avatar_url)
          `)
          .eq('is_premium', false)
          .or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`)
          .order('views', { ascending: false })
          .limit(10);
        return data || [];
      });
      
      const allKeywordResults = await Promise.all(keywordQueries);
      keywordVideos = allKeywordResults.flat().slice(0, Math.floor(limit * 0.4));
    }

    // Priority 3: General trending videos
    const excludeIds = [
      ...(behaviorVideos?.map(v => v.id) || []),
      ...keywordVideos.map(v => v.id)
    ];

    const { data: trendingVideos } = await supabase
      .from('videos')
      .select(`
        id, title, description, thumbnail_url, duration, views, likes, tags, created_at,
        profiles!videos_owner_id_fkey(username, user_type, avatar_url)
      `)
      .eq('is_premium', false)
      .order('views', { ascending: false })
      .limit(Math.floor(limit * 0.2)); // 20% trending

    // Combine all results with behavior-based prioritization
    const combinedVideos = [
      ...(behaviorVideos || []),
      ...keywordVideos,
      ...(trendingVideos || [])
    ];

    // Remove duplicates by ID
    const uniqueVideos = combinedVideos.filter((video, index, self) => 
      index === self.findIndex(v => v.id === video.id)
    );

    // Apply pagination
    const from = (page - 1) * limit;
    const paginatedVideos = uniqueVideos.slice(from, from + limit);

    return {
      videos: paginatedVideos.map(video => ({
        ...video,
        tags: Array.isArray(video.tags) ? video.tags : [],
        uploader_username: video.profiles?.username || 'Unknown',
        uploader_type: video.profiles?.user_type || 'user',
        uploader_id: video.profiles?.id || video.owner_id,
        uploader_avatar: video.profiles?.avatar_url,
        uploader_subscribers: 0,
        uploader_verified: false,
        preview_url: '',
        video_url: '',
        is_moment: false
      })),
      totalCount: uniqueVideos.length,
      totalPages: Math.ceil(uniqueVideos.length / limit),
      behaviorData: {
        popularSearches: searchTerms.slice(0, 5),
        popularTags: popularTags.slice(0, 10)
      }
    };

    // Fallback to general trending if no behavioral data
    const { data: fallbackVideos, count } = await supabase
      .from('videos')
      .select(`
        id, title, description, thumbnail_url, duration, views, likes, tags, created_at, owner_id,
        profiles!videos_owner_id_fkey(username, user_type, avatar_url)
      `, { count: 'exact' })
      .eq('is_premium', false)
      .order('views', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    return {
      videos: (fallbackVideos || []).map(video => ({
        ...video,
        tags: Array.isArray(video.tags) ? video.tags : [],
        uploader_username: video.profiles?.username || 'Unknown',
        uploader_type: video.profiles?.user_type || 'user',
        uploader_id: video.profiles?.id || video.owner_id,
        uploader_avatar: video.profiles?.avatar_url,
        uploader_subscribers: 0,
        uploader_verified: false,
        preview_url: '',
        video_url: '',
        is_moment: false
      })),
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      behaviorData: {
        popularSearches: [],
        popularTags: []
      }
    };

  } catch (error) {
    console.error('Error getting hottest videos by behavior:', error);
    throw error;
  }
};
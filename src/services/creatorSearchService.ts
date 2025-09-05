import { supabase } from '@/integrations/supabase/client';

export interface CreatorProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  user_type: string;
  bio: string | null;
  subscriberCount: number;
  videoCount: number;
  totalViews: number;
  rank: number;
}

export interface CreatorSearchResult {
  creators: CreatorProfile[];
  videos: any[];
}

// Search for creators by username, full name, bio, location, or website
export const searchCreators = async (searchTerm: string): Promise<CreatorProfile[]> => {
  try {
    const { data: creators, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%,bio.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,website.ilike.%${searchTerm}%`)
      .in('user_type', ['individual_creator', 'studio_creator'])
      .limit(10);

    if (error) {
      console.error('Error searching creators:', error);
      return [];
    }

    if (!creators) return [];

    // Get stats for each creator
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const [subscriberCount, videoStats] = await Promise.all([
          getSubscriberCount(creator.id),
          getCreatorVideoStats(creator.id)
        ]);

        return {
          ...creator,
          subscriberCount,
          videoCount: videoStats.count,
          totalViews: videoStats.totalViews,
          rank: calculateRank(subscriberCount, videoStats.totalViews)
        };
      })
    );

    // Sort by exact match first, then by rank
    return creatorsWithStats.sort((a, b) => {
      // Check for exact matches first
      const aExactMatch = a.username?.toLowerCase() === searchTerm.toLowerCase() || 
                          a.full_name?.toLowerCase() === searchTerm.toLowerCase();
      const bExactMatch = b.username?.toLowerCase() === searchTerm.toLowerCase() || 
                          b.full_name?.toLowerCase() === searchTerm.toLowerCase();
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Then sort by rank
      return a.rank - b.rank;
    });

  } catch (error) {
    console.error('Error in searchCreators:', error);
    return [];
  }
};

// Get subscriber count for a creator
const getSubscriberCount = async (creatorId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact' })
      .eq('creator_id', creatorId);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error getting subscriber count:', error);
    return 0;
  }
};

// Get creator video statistics
const getCreatorVideoStats = async (creatorId: string): Promise<{ count: number; totalViews: number }> => {
  try {
    const { data: videos, error } = await supabase
      .from('videos')
      .select('views')
      .eq('owner_id', creatorId);

    if (error || !videos) {
      return { count: 0, totalViews: 0 };
    }

    return {
      count: videos.length,
      totalViews: videos.reduce((sum, video) => sum + (video.views || 0), 0)
    };
  } catch (error) {
    console.error('Error getting creator video stats:', error);
    return { count: 0, totalViews: 0 };
  }
};

// Calculate creator rank based on subscribers and views
const calculateRank = (subscribers: number, totalViews: number): number => {
  // Simple ranking algorithm - can be made more sophisticated
  const score = (subscribers * 10) + (totalViews * 0.01);
  
  if (score >= 10000) return 1;
  if (score >= 5000) return 2;
  if (score >= 1000) return 3;
  if (score >= 500) return 4;
  if (score >= 100) return 5;
  return 6;
};

// Format numbers for display
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};
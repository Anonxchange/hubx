import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CreatorProfileCard from '@/components/CreatorProfileCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { CreatorProfile } from '@/services/creatorSearchService';
import AdComponent from '@/components/AdComponent';
import VerificationBadge from '@/components/VerificationBadge';

const PornstarsPage = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState<any>(null); // State to hold the current user
  const [activeTab, setActiveTab] = useState('all'); // State for active tab

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Helper function to check if the current user is subscribed to a creator
  const isSubscribedToCreator = async (creatorId: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('subscriber_id', user.id)
      .eq('creator_id', creatorId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking subscription:', error);
      return false;
    }
    return !!data;
  };

  // Handle subscribe/unsubscribe
  const handleSubscribeToggle = async (creatorId: string) => {
    if (!user) {
      alert('Please log in to subscribe.');
      return;
    }

    const creatorIndex = creators.findIndex(c => c.id === creatorId);
    if (creatorIndex === -1) return;

    const creator = creators[creatorIndex];
    const isCurrentlySubscribed = creator.isFollowing;

    try {
      if (isCurrentlySubscribed) {
        // Unsubscribe
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('subscriber_id', user.id)
          .eq('creator_id', creatorId);
        
        if (error) throw error;
      } else {
        // Subscribe
        const { error } = await supabase
          .from('subscriptions')
          .insert([
            { 
              subscriber_id: user.id, 
              creator_id: creatorId,
              created_at: new Date().toISOString()
            }
          ]);
        
        if (error) throw error;
      }

      // Update the local state for both arrays
      const updateCreators = (prevCreators: CreatorProfile[]) =>
        prevCreators.map(c =>
          c.id === creatorId
            ? { 
                ...c, 
                isFollowing: !isCurrentlySubscribed,
                subscriberCount: isCurrentlySubscribed ? c.subscriberCount - 1 : c.subscriberCount + 1,
              }
            : c
        );

      setCreators(updateCreators);
      setFilteredCreators(updateCreators);

    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert('Failed to update subscription. Please try again.');
    }
  };

  // Fetch individual creators
  useEffect(() => {
    const fetchIndividualCreators = async () => {
      try {
        setLoading(true);

        // Get all individual creators
        const { data: individualProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, profile_picture_url, bio, user_type, created_at, cover_photo_url')
          .eq('user_type', 'individual_creator');

        if (profilesError) {
          console.error('Error fetching individual profiles:', profilesError);
          return;
        }

        if (!individualProfiles || individualProfiles.length === 0) {
          console.log('No individual creators found');
          setLoading(false);
          return;
        }

        // Get stats for each creator
        const creatorsWithStats = await Promise.all(
          individualProfiles.map(async (profile: any, index: number) => {
            // Get video count and views
            let videoCount = 0;
            let totalViews = 0;

            try {
              // @ts-ignore - Temporary fix for TypeScript compilation issue
              const { data, error } = await supabase
                .from('videos')
                .select('views')
                .eq('owner_id', profile.id);

              if (!error && data) {
                videoCount = data.length;
                totalViews = data.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
              }
            } catch (error) {
              console.error(`Error fetching videos for creator ${profile.id}:`, error);
            }

            // Get subscriber count
            const { count: subscriberCount, error: subError } = await supabase
              .from('subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('creator_id', profile.id);
            
            if (subError) {
              console.error('Error fetching subscriber count:', subError);
            }

            // Check if current user is subscribed
            let isFollowing = false;
            if (user) {
              isFollowing = await isSubscribedToCreator(profile.id);
            }

            return {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name,
              avatar_url: profile.avatar_url || profile.profile_picture_url,
              bio: profile.bio,
              user_type: profile.user_type,
              cover_photo_url: profile.cover_photo_url,
              videoCount,
              totalViews,
              subscriberCount: subscriberCount || 0,
              rank: index + 1,
              isFollowing,
            };
          })
        );

        // Sort by total views
        const sortedCreators = creatorsWithStats.sort((a, b) => b.totalViews - a.totalViews);

        setCreators(sortedCreators);
        setFilteredCreators(sortedCreators);
      } catch (error) {
        console.error('Error fetching individual creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchIndividualCreators();
  }, [user]); // Re-fetch when user changes

  // Filter creators based on search query and active tab
  useEffect(() => {
    let filtered = creators;

    // Apply tab filter first
    if (activeTab === 'popular') {
      // Sort by total views (most popular)
      filtered = [...creators].sort((a, b) => b.totalViews - a.totalViews);
    } else if (activeTab === 'trending') {
      // Sort by subscriber count (trending)
      filtered = [...creators].sort((a, b) => b.subscriberCount - a.subscriberCount);
    } else if (activeTab === 'following') {
      // Show only creators the user is following
      filtered = creators.filter(creator => creator.isFollowing);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(creator => 
        creator.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCreators(filtered);
  }, [searchQuery, creators, activeTab]);

  // Handle creator profile click
  const handleCreatorClick = (creator: CreatorProfile) => {
    const username = creator.username || creator.full_name?.replace(/\s+/g, '') || creator.id;
    navigate(`/profile/${username}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Top Ad Banner */}
          <div className="w-full flex justify-center mb-8">
            <div className="w-full max-w-4xl">
              <AdComponent zoneId="5660534" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              PornStars | Models
            </h1>
            <p className="text-muted-foreground text-lg">
              Discover talented Model content creators
            </p>
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto mb-8">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search creators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
              data-testid="input-search-creators"
            />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-lg p-6 space-y-4">
                  <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                  <Skeleton className="h-4 w-3/4 mx-auto" />
                  <Skeleton className="h-4 w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex gap-4 mb-8 overflow-x-auto">
            <button 
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeTab === 'all' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All PornStars
            </button>
            <button 
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeTab === 'popular' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('popular')}
            >
              Popular
            </button>
            <button 
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeTab === 'trending' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('trending')}
            >
              Trending
            </button>
            <button 
              className={`px-6 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${
                activeTab === 'following' 
                  ? 'bg-orange-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
              onClick={() => setActiveTab('following')}
            >
              Following
            </button>
          </div>

          {/* Creators List */}
          {!loading && filteredCreators.length > 0 && (
            <div className="space-y-4">
              {filteredCreators.map((creator, index) => (
                <div 
                  key={creator.id}
                  className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                  onClick={() => handleCreatorClick(creator)}
                  data-testid={`creator-card-${creator.id}`}
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <img 
                        src={creator.avatar_url || '/default-avatar.png'} 
                        alt={creator.username || creator.full_name || 'Creator'}
                        className="w-16 h-16 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/default-avatar.png';
                        }}
                      />
                      {/* Verification Badge */}
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge userType="individual_creator" size="small" />
                      </div>
                      {/* Rank Badge */}
                      <div className="absolute -top-2 -left-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        #{index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {creator.username || creator.full_name || 'Unknown Creator'}
                        </h3>
                        <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">
                          Model
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-3">
                        Welcome to my profile! 🌟
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-6 mb-4">
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Subscribers</div>
                          <div className="text-orange-500 font-bold">{creator.subscriberCount}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Videos</div>
                          <div className="text-white font-bold">{creator.videoCount}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-400">Views</div>
                          <div className="text-white font-bold">
                            {creator.totalViews >= 1000 
                              ? `${(creator.totalViews / 1000).toFixed(1)}K` 
                              : creator.totalViews}
                          </div>
                        </div>
                      </div>

                      {/* Subscribe Button */}
                      <button 
                        className={`w-full font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                          creator.isFollowing 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSubscribeToggle(creator.id);
                        }}
                        data-testid={`button-subscribe-${creator.id}`}
                      >
                        {creator.isFollowing ? 'Unsubscribe' : 'Subscribe'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && filteredCreators.length === 0 && (
            <div className="text-center py-12">
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchQuery 
                  ? 'No creators found' 
                  : activeTab === 'following' 
                    ? 'No followed creators' 
                    : 'No creators available'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms.' 
                  : activeTab === 'following'
                    ? 'Start following creators to see them here.'
                    : 'Check back later for new content creators.'}
              </p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PornstarsPage;
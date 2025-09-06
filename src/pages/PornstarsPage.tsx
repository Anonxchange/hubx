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

const PornstarsPage = () => {
  const navigate = useNavigate();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<CreatorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

        // Process creators with stats - simplified approach
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
            const subscriberResult = await supabase
              .from('subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('creator_id', profile.id);

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
              subscriberCount: subscriberResult.count || 0,
              rank: index + 1,
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
  }, []);

  // Filter creators based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredCreators(creators);
    } else {
      const filtered = creators.filter(creator => 
        creator.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCreators(filtered);
    }
  }, [searchQuery, creators]);

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
            <button className="bg-orange-600 text-white px-6 py-2 rounded-full font-medium whitespace-nowrap">
              All PornStars
            </button>
            <button className="text-gray-400 px-6 py-2 rounded-full font-medium whitespace-nowrap hover:text-white">
              Popular
            </button>
            <button className="text-gray-400 px-6 py-2 rounded-full font-medium whitespace-nowrap hover:text-white">
              Trending
            </button>
            <button className="text-gray-400 px-6 py-2 rounded-full font-medium whitespace-nowrap hover:text-white">
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
                      {/* Rank Badge */}
                      <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
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
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle subscribe logic here
                        }}
                        data-testid={`button-subscribe-${creator.id}`}
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z"/>
                        </svg>
                        Subscribe
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
                {searchQuery ? 'No creators found' : 'No creators available'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try adjusting your search terms.' 
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

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Users, Check, Heart, Search, User, Settings, Eye, Play, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SubscriptionModal from '@/components/SubscriptionModal';
import SignInModal from '@/components/SignInModal';
import ProfileDropdown from '@/components/ProfileDropdown';
import PremiumPageFooter from '@/components/PremiumPageFooter';
import VerificationBadge from '@/components/VerificationBadge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface PremiumIndividualCreator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  subscribers: number;
  premiumVideos: number;
  totalViews: number;
  isFollowing: boolean;
  description?: string;
  createdAt: string;
}

const PremiumIndividualCreatorsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [creators, setCreators] = useState<PremiumIndividualCreator[]>([]);
  const [filteredCreators, setFilteredCreators] = useState<PremiumIndividualCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isSignInModalOpen, setIsSignInModalOpen] = useState(false);

  // Fetch individual creators with premium content
  useEffect(() => {
    const fetchPremiumIndividualCreators = async () => {
      try {
        setLoading(true);

        // Get individual creators who have uploaded premium content
        const { data: premiumVideos, error: videosError } = await supabase
          .from('videos')
          .select(`
            owner_id,
            profiles!videos_owner_id_fkey (
              id,
              username,
              full_name,
              avatar_url,
              profile_picture_url,
              bio,
              user_type,
              created_at
            )
          `)
          .eq('is_premium', true)
          .eq('profiles.user_type', 'individual_creator');

        if (videosError) {
          console.error('Error fetching premium videos:', videosError);
          return;
        }

        // Group by creator and get stats
        const creatorMap = new Map();
        
        premiumVideos?.forEach(video => {
          const profile = video.profiles;
          if (profile && profile.user_type === 'individual_creator') {
            if (!creatorMap.has(profile.id)) {
              creatorMap.set(profile.id, {
                profile,
                videoCount: 0,
                totalViews: 0
              });
            }
            creatorMap.get(profile.id).videoCount += 1;
          }
        });

        // Convert to array and fetch additional stats
        const creatorsWithStats = await Promise.all(
          Array.from(creatorMap.values()).map(async (item, index) => {
            const { profile } = item;
            
            // Get subscriber count
            const { count: subscriberCount } = await supabase
              .from('subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('creator_id', profile.id);

            // Get total views for premium videos
            const { data: videos } = await supabase
              .from('videos')
              .select('views')
              .eq('owner_id', profile.id)
              .eq('is_premium', true);

            const totalViews = videos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;

            // Check if current user is following
            let isFollowing = false;
            if (user) {
              const { data: subscription } = await supabase
                .from('subscriptions')
                .select('id')
                .eq('subscriber_id', user.id)
                .eq('creator_id', profile.id)
                .single();

              isFollowing = !!subscription;
            }

            return {
              id: profile.id,
              name: profile.full_name || profile.username || 'Unknown Creator',
              username: profile.username,
              avatar: profile.avatar_url || profile.profile_picture_url || '/placeholder.svg',
              subscribers: subscriberCount || 0,
              premiumVideos: item.videoCount,
              totalViews: totalViews,
              isFollowing: isFollowing,
              description: profile.bio || 'Premium content creator',
              createdAt: profile.created_at
            } as PremiumIndividualCreator;
          })
        );

        // Sort by premium video count and views
        const sortedCreators = creatorsWithStats.sort((a, b) => {
          const scoreA = a.premiumVideos * 100 + a.totalViews;
          const scoreB = b.premiumVideos * 100 + b.totalViews;
          return scoreB - scoreA;
        });

        setCreators(sortedCreators);
        setFilteredCreators(sortedCreators);
      } catch (error) {
        console.error('Error fetching premium individual creators:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPremiumIndividualCreators();
  }, [user]);

  // Filter creators based on search
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = creators.filter(creator =>
        creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCreators(filtered);
    } else {
      setFilteredCreators(creators);
    }
  }, [searchQuery, creators]);

  const handleFollow = async (e: React.MouseEvent, creatorId: string) => {
    e.stopPropagation();
    
    if (!user) {
      setIsSignInModalOpen(true);
      return;
    }

    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return;

    try {
      if (creator.isFollowing) {
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
          .insert({
            subscriber_id: user.id,
            creator_id: creatorId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Update local state
      const updateCreators = (prevCreators: PremiumIndividualCreator[]) =>
        prevCreators.map(c =>
          c.id === creatorId
            ? { 
                ...c, 
                isFollowing: !c.isFollowing,
                subscribers: c.isFollowing ? c.subscribers - 1 : c.subscribers + 1
              }
            : c
        );

      setCreators(updateCreators);
      setFilteredCreators(updateCreators);

    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 text-xs bg-black border-b border-gray-800">
        <div className="flex items-center space-x-1">
          <div className="w-1 h-1 bg-red-500 rounded-full"></div>
          <span>Live</span>
          <Heart className="w-3 h-3 text-pink-500 ml-2" />
          <span>Sex Chat</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">VR Only</span>
          <div className="w-8 h-4 bg-gray-600 rounded-full relative">
            <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 right-0.5"></div>
          </div>
          <div className="relative">
            <Heart className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-3 h-3 flex items-center justify-center text-white text-[8px]">2</span>
          </div>
          <Settings className="w-4 h-4" />
        </div>
      </div>

      {/* Header */}
      <div className="bg-black px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/premium" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Star className="w-8 h-8 text-pink-400" />
            <div>
              <h1 className="text-lg font-bold text-pink-400">Premium Pornstars</h1>
              <p className="text-xs text-gray-400">Individual Creators</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <ProfileDropdown />
            ) : (
              <button onClick={() => setIsSignInModalOpen(true)}>
                <User className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
              </button>
            )}
            <Button
              onClick={() => setIsSubscriptionModalOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-xs px-3 py-1 h-7"
            >
              Join now
            </Button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-4 py-4 bg-black border-b border-gray-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search premium creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <div className="bg-black min-h-screen">
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold text-white mb-4">
            Premium Pornstars ({filteredCreators.length})
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading premium creators...</p>
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Star className="w-12 h-12 text-pink-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              {searchQuery ? 'No creators found' : 'No Premium Creators'}
            </h3>
            <p className="text-gray-400 text-sm">
              {searchQuery 
                ? `No creators match "${searchQuery}". Try different keywords.`
                : 'No individual creators have uploaded premium content yet.'
              }
            </p>
          </div>
        ) : (
          <div className="px-4 grid grid-cols-1 gap-4">
            {filteredCreators.map((creator) => (
              <Card 
                key={creator.id}
                className="bg-gray-900 border-gray-800 hover:border-pink-500/50 transition-all cursor-pointer"
                onClick={() => navigate(`/profile/${creator.username || creator.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-gray-300 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge userType="individual_creator" size="small" />
                      </div>
                    </div>

                    {/* Creator Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-white truncate">
                          {creator.name}
                        </h3>
                        <Badge variant="outline" className="text-xs border-pink-500/30 text-pink-500">
                          <Star className="w-3 h-3 mr-1" />
                          Pornstar
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-400 line-clamp-2 mb-2">
                        {creator.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{creator.subscribers.toLocaleString()} subscribers</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Play className="w-3 h-3" />
                          <span>{creator.premiumVideos} premium videos</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>{creator.totalViews.toLocaleString()} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Subscribe Button */}
                    <Button
                      onClick={(e) => handleFollow(e, creator.id)}
                      className={`font-semibold px-6 py-2 transition-all ${
                        creator.isFollowing
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-pink-500 hover:bg-pink-600 text-white'
                      }`}
                    >
                      {creator.isFollowing ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Subscribed
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Subscribe
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 safe-area-bottom">
        <div className="flex justify-around py-2">
          <Link to="/premium" className="flex flex-col items-center py-2 px-4">
            <Play className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Videos</span>
          </Link>
          <button className="flex flex-col items-center py-2 px-4">
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Search</span>
          </button>
          <button className="flex flex-col items-center py-2 px-4">
            <Heart className="w-5 h-5 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Favorites</span>
          </button>
          {user ? (
            <div className="flex flex-col items-center py-2 px-4">
              <ProfileDropdown />
              <span className="text-xs text-gray-400 mt-1">Profile</span>
            </div>
          ) : (
            <button onClick={() => setIsSignInModalOpen(true)} className="flex flex-col items-center py-2 px-4">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-xs text-gray-400 mt-1">Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      <SubscriptionModal
        isOpen={isSubscriptionModalOpen}
        onClose={() => setIsSubscriptionModalOpen(false)}
      />

      <SignInModal
        isOpen={isSignInModalOpen}
        onClose={() => setIsSignInModalOpen(false)}
      />

      <PremiumPageFooter />
    </div>
  );
};

export default PremiumIndividualCreatorsPage;

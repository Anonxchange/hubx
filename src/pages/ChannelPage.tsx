import React, { useState, useEffect } from 'react';
import { Search, Users, Play, Eye, TrendingUp, Star, Crown, Check, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import VerificationBadge from '@/components/VerificationBadge';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscribers: number;
  videos: number;
  views: number;
  rank: number;
  verified: boolean;
  description?: string;
  category?: string;
  isFollowing?: boolean;
  username?: string;
  userType?: string;
  createdAt?: string;
}

const ChannelPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch real channels from Supabase
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);

        // Fetch only studio creators
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_type', 'studio_creator')
          .order('created_at', { ascending: false });

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          return;
        }

        // Fetch video counts and stats for each creator
        const channelsWithStats = await Promise.all(
          (profiles || []).map(async (profile, index) => {
            // Get video count for this creator
            const { count: videoCount } = await supabase
              .from('videos')
              .select('*', { count: 'exact', head: true })
              .eq('owner_id', profile.id);

            // Get total views for this creator
            const { data: videos } = await supabase
              .from('videos')
              .select('views')
              .eq('owner_id', profile.id);

            const totalViews = videos?.reduce((sum, video) => sum + (video.views || 0), 0) || 0;

            // Get subscriber count for this creator (from subscriptions table)
            const { count: subscriberCount } = await supabase
              .from('subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('creator_id', profile.id);

            // Check if current user is following this creator
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
              videos: videoCount || 0,
              views: totalViews,
              rank: index + 1,
              verified: true, // All studios are verified
              description: profile.bio || `Professional studio on HubX`,
              category: 'Studio',
              isFollowing: isFollowing,
              userType: profile.user_type,
              createdAt: profile.created_at
            } as Channel;
          })
        );

        // Sort by video count and views for ranking
        const sortedChannels = channelsWithStats.sort((a, b) => {
          const scoreA = a.videos * 100 + a.views;
          const scoreB = b.videos * 100 + b.views;
          return scoreB - scoreA;
        }).map((channel, index) => ({ ...channel, rank: index + 1 }));

        setChannels(sortedChannels);
        setFilteredChannels(sortedChannels);
      } catch (error) {
        console.error('Error fetching channels:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  // Filter channels based on search and active tab
  useEffect(() => {
    let filtered = channels;

    if (searchQuery.trim()) {
      filtered = filtered.filter(channel =>
        channel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        channel.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (activeTab === 'popular') {
      filtered = filtered.sort((a, b) => b.subscribers - a.subscribers);
    } else if (activeTab === 'trending') {
      filtered = filtered.sort((a, b) => b.views - a.views);
    } else if (activeTab === 'following') {
      filtered = filtered.filter(channel => channel.isFollowing);
    } else {
      filtered = filtered.sort((a, b) => a.rank - b.rank);
    }

    setFilteredChannels(filtered);
  }, [searchQuery, activeTab, channels]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleFollow = (channelId: string) => {
    setChannels(prevChannels =>
      prevChannels.map(channel =>
        channel.id === channelId
          ? { ...channel, isFollowing: !channel.isFollowing }
          : channel
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Ad Component at the top */}
        <div className="mb-8">
          <AdComponent zoneId="5660534" />
        </div>

        {/* Hero Section */}
        <div className="mb-12 text-center space-y-4">
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent">
              Discover Creators
            </h1>
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full"></div>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the most popular professional studios on HubX
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search studios or content types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border-border text-foreground placeholder-muted-foreground pl-12 pr-4 py-4 rounded-xl text-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </form>
        </div>

        {/* Filter Tabs */}
        <div className="mb-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto bg-card border border-border rounded-xl p-1">
              <TabsTrigger
                value="all"
                className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
              >
                <Users className="w-4 h-4 mr-2" />
                All Studios
              </TabsTrigger>
              <TabsTrigger
                value="popular"
                className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
              >
                <Star className="w-4 h-4 mr-2" />
                Popular
              </TabsTrigger>
              <TabsTrigger
                value="trending"
                className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="rounded-lg data-[state=active]:bg-orange-500 data-[state=active]:text-white transition-all"
              >
                <Heart className="w-4 h-4 mr-2" />
                Following
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-foreground mb-2">Loading Studios...</h3>
            <p className="text-muted-foreground">Discovering amazing professional studios for you</p>
          </div>
        ) : (
          <>
            {/* Channels Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {filteredChannels.map((channel) => (
            <Card key={channel.id} className="bg-card border-border hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 group overflow-hidden">
              <CardContent className="p-0">
                {/* Card Header with Rank Badge */}
                <div className="relative p-6 pb-4">
                  {channel.rank <= 10 && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-black font-bold">
                        #{channel.rank}
                      </Badge>
                    </div>
                  )}

                  {/* Avatar and Name */}
                  <div className="flex items-start space-x-4">
                    <div className="relative">
                      <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden ring-2 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all">
                        <img
                          src={channel.avatar}
                          alt={channel.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1">
                        <VerificationBadge
                          userType={channel.userType as 'studio_creator'}
                          size="small"
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold text-foreground group-hover:text-orange-500 transition-colors truncate">
                          {channel.name}
                        </h3>
                        {channel.category && (
                          <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-500">
                            {channel.category}
                          </Badge>
                        )}
                      </div>

                      {channel.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {channel.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Subscribers</div>
                      <div className="text-lg font-bold text-orange-500">
                        {channel.subscribers >= 1000000
                          ? `${(channel.subscribers / 1000000).toFixed(1)}M`
                          : channel.subscribers >= 1000
                          ? `${(channel.subscribers / 1000).toFixed(1)}K`
                          : channel.subscribers.toString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Videos</div>
                      <div className="text-lg font-bold text-foreground">
                        {channel.videos >= 1000
                          ? `${(channel.videos / 1000).toFixed(1)}K`
                          : channel.videos.toString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Views</div>
                      <div className="text-lg font-bold text-foreground">
                        {channel.views >= 1000000000
                          ? `${(channel.views / 1000000000).toFixed(1)}B`
                          : channel.views >= 1000000
                          ? `${(channel.views / 1000000).toFixed(1)}M`
                          : channel.views >= 1000
                          ? `${(channel.views / 1000).toFixed(1)}K`
                          : channel.views.toString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subscribe Button */}
                <div className="p-6 pt-0">
                  <Button
                    onClick={() => handleFollow(channel.id)}
                    className={`w-full font-semibold transition-all ${
                      channel.isFollowing
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    {channel.isFollowing ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Subscribed
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Subscribe
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More Section */}
            {filteredChannels.length > 0 && (
              <div className="text-center">
                <Button
                  variant="outline"
                  size="lg"
                  className="bg-card border-border hover:border-orange-500 hover:bg-orange-500/10 text-foreground px-12 py-3 text-lg font-semibold transition-all"
                >
                  Load More Studios
                </Button>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {filteredChannels.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No studios found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery ? `No studios match "${searchQuery}". Try a different search term.` : 'No studios available in this category.'}
            </p>
            {searchQuery && (
              <Button
                onClick={() => setSearchQuery('')}
                variant="outline"
                className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}

        {/* Bottom Ad */}
        <div className="mt-16">
          <AdComponent zoneId="5660534" />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ChannelPage;
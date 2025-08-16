
import React, { useState, useEffect } from 'react';
import { Search, Users, Play, Eye, TrendingUp, Star, Crown, Check, Heart, MessageCircle, Share2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AdComponent from '@/components/AdComponent';
import MessageButton from '@/components/MessageButton';

interface Channel {
  id: string;
  name: string;
  avatar: string;
  subscribers: string;
  videos: string;
  views: string;
  rank: number;
  verified: boolean;
  description?: string;
  category?: string;
  isFollowing?: boolean;
}

const ChannelPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [channels, setChannels] = useState<Channel[]>([]);
  const [filteredChannels, setFilteredChannels] = useState<Channel[]>([]);

  // Mock channel data - replace with actual API call
  useEffect(() => {
    const mockChannels: Channel[] = [
      {
        id: '1',
        name: 'HotStudio',
        avatar: '/placeholder.svg',
        subscribers: '8.2M',
        videos: '4.4K',
        views: '9.8B',
        rank: 1,
        verified: true,
        description: 'Premium adult content studio creating high-quality exclusive videos',
        category: 'Studio',
        isFollowing: false
      },
      {
        id: '2',
        name: 'Bella Rose',
        avatar: '/placeholder.svg',
        subscribers: '3.2M',
        videos: '6.9K',
        views: '6.1B',
        rank: 16,
        verified: true,
        description: 'Independent content creator sharing intimate moments',
        category: 'Individual',
        isFollowing: true
      },
      {
        id: '3',
        name: 'Fantasy Network',
        avatar: '/placeholder.svg',
        subscribers: '339K',
        videos: '3.1K',
        views: '575M',
        rank: 66,
        verified: false,
        description: 'Amateur content network featuring real couples',
        category: 'Network',
        isFollowing: false
      },
      {
        id: '4',
        name: 'Luna Star',
        avatar: '/placeholder.svg',
        subscribers: '2.8M',
        videos: '892',
        views: '4.2B',
        rank: 8,
        verified: true,
        description: 'International performer creating passionate content',
        category: 'Individual',
        isFollowing: false
      },
      {
        id: '5',
        name: 'Premium Productions',
        avatar: '/placeholder.svg',
        subscribers: '1.5M',
        videos: '2.3K',
        views: '2.8B',
        rank: 32,
        verified: true,
        description: 'Professional studio producing cinematic adult films',
        category: 'Studio',
        isFollowing: true
      },
      {
        id: '6',
        name: 'Amateur Central',
        avatar: '/placeholder.svg',
        subscribers: '945K',
        videos: '5.7K',
        views: '1.2B',
        rank: 45,
        verified: false,
        description: 'Authentic amateur couples sharing real moments',
        category: 'Amateur',
        isFollowing: false
      }
    ];
    
    setChannels(mockChannels);
    setFilteredChannels(mockChannels);
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
      filtered = filtered.sort((a, b) => parseInt(a.subscribers.replace(/[^0-9]/g, '')) - parseInt(b.subscribers.replace(/[^0-9]/g, ''))).reverse();
    } else if (activeTab === 'trending') {
      filtered = filtered.sort((a, b) => parseInt(a.views.replace(/[^0-9]/g, '')) - parseInt(b.views.replace(/[^0-9]/g, ''))).reverse();
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
            Explore the most popular content creators and studios on HubX
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-8 max-w-2xl mx-auto">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search creators, studios, or content types..."
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
                All Creators
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
                      <div className="w-16 h-16 bg-muted rounded-full overflow-hidden ring-2 ring-orange-500/20 group-hover:ring-orange-500/40 transition-all">
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
                      {channel.verified && (
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-background">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
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
                      <div className="text-lg font-bold text-orange-500">{channel.subscribers}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Videos</div>
                      <div className="text-lg font-bold text-foreground">{channel.videos}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Views</div>
                      <div className="text-lg font-bold text-foreground">{channel.views}</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-6 pt-0 space-y-3">
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
                        Following
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <MessageButton
                      creatorId={channel.id}
                      creatorName={channel.name}
                      variant="outline"
                      size="sm"
                      className="flex-1 border-border hover:border-orange-500/50"
                    />
                    <Button variant="outline" size="sm" className="flex-1 border-border hover:border-orange-500/50">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                  </div>
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
              Load More Creators
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredChannels.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-2">No creators found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchQuery ? `No creators match "${searchQuery}". Try a different search term.` : 'No creators available in this category.'}
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
